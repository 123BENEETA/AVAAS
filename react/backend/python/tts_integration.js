const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid'); // Added missing import
const config = require('../config/config');

class TTSService {
  constructor() {
    this.pythonProcess = null;
    this.wsConnection = null;
    this.isServerRunning = false;
    this.pendingRequests = new Map();
    this.serverUrl = config.pythonTtsServer || 'http://localhost:8000';
    this.wsUrl = config.pythonTtsWs || 'ws://localhost:8000/tts';
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
  }

  /**
   * Start the Python TTS server if it's not already running
   */
  async startPythonServer() {
    if (this.isServerRunning) {
      return;
    }

    console.log('Starting Python TTS server...');
    
    try {
      // Check if server is already running
      const response = await axios.get(`${this.serverUrl}/health`).catch(() => null);
      
      if (response && response.data && response.data.status === 'healthy') {
        console.log('Python TTS server is already running');
        this.isServerRunning = true;
        return;
      }
      
      // Start the Python server
      const scriptPath = path.join(__dirname, 'fastapi_server.py');
      
      if (!fs.existsSync(scriptPath)) {
        console.error(`Python script not found at ${scriptPath}`);
        return;
      }
      
      this.pythonProcess = spawn('python', [scriptPath], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      this.pythonProcess.stdout.on('data', (data) => {
        console.log(`Python TTS server: ${data.toString().trim()}`);
      });
      
      this.pythonProcess.stderr.on('data', (data) => {
        console.error(`Python TTS server error: ${data.toString().trim()}`);
      });
      
      this.pythonProcess.on('close', (code) => {
        console.log(`Python TTS server exited with code ${code}`);
        this.isServerRunning = false;
        this.pythonProcess = null;
      });
      
      // Wait for server to start
      await new Promise((resolve) => setTimeout(resolve, 5000));
      
      // Verify the server is running
      const healthCheck = await axios.get(`${this.serverUrl}/health`).catch(() => null);
      
      if (healthCheck && healthCheck.data && healthCheck.data.status === 'healthy') {
        console.log('Python TTS server started successfully');
        this.isServerRunning = true;
      } else {
        console.error('Failed to start Python TTS server');
      }
    } catch (error) {
      console.error('Error starting Python TTS server:', error.message);
    }
  }

  /**
   * Connect to the WebSocket for streaming TTS
   */
  connectToWebSocket() {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      return;
    }
    
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error('Maximum WebSocket connection attempts reached');
      return;
    }
    
    this.connectionAttempts++;
    console.log(`Connecting to TTS WebSocket (attempt ${this.connectionAttempts})...`);
    
    try {
      this.wsConnection = new WebSocket(this.wsUrl);
      
      this.wsConnection.on('open', () => {
        console.log('Connected to TTS WebSocket');
        this.connectionAttempts = 0;
      });
      
      this.wsConnection.on('message', (data) => {
        if (typeof data === 'string') {
          // Handle text messages (END or ERROR)
          if (data === 'END') {
            // Synthesis complete, do nothing here as we handle each chunk separately
          } else if (data.startsWith('ERROR:')) {
            console.error(`TTS error: ${data.substring(7)}`);
          }
        } else {
          // Handle binary audio data
          // This is handled in the generateSpeech method
        }
      });
      
      this.wsConnection.on('close', () => {
        console.log('TTS WebSocket connection closed');
        setTimeout(() => this.connectToWebSocket(), 3000);
      });
      
      this.wsConnection.on('error', (error) => {
        console.error('TTS WebSocket error:', error);
      });
    } catch (error) {
      console.error('Error connecting to TTS WebSocket:', error);
      setTimeout(() => this.connectToWebSocket(), 3000);
    }
  }

  /**
   * Generate speech from text
   * @param {string} text - Text to convert to speech
   * @param {string} outputFile - Path to save the audio file
   * @param {Object} options - Additional options like voice, speed, etc.
   */
  async generateSpeech(text, outputFile, options = {}) {
    if (!text || !outputFile) {
      throw new Error('Text and output file path are required');
    }
    
    if (!this.isServerRunning) {
      await this.startPythonServer();
    }
    
    try {
      // Try REST API approach first (more reliable for file output)
      const response = await axios.post(`${this.serverUrl}/synthesize`, {
        text,
        ...options
      }, {
        responseType: 'arraybuffer'
      });
      
      fs.writeFileSync(outputFile, Buffer.from(response.data));
      return outputFile;
    } catch (error) {
      console.error('Error using REST API for TTS, falling back to WebSocket:', error.message);
      
      // Fall back to WebSocket approach
      return new Promise((resolve, reject) => {
        if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
          this.connectToWebSocket();
          
          // Wait for connection to establish
          let attempts = 0;
          const checkConnection = setInterval(() => {
            attempts++;
            
            if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
              clearInterval(checkConnection);
              this.processTTSWebSocket(text, outputFile, options, resolve, reject);
            } else if (attempts >= 10) {
              clearInterval(checkConnection);
              reject(new Error('Failed to connect to TTS WebSocket'));
            }
          }, 500);
        } else {
          this.processTTSWebSocket(text, outputFile, options, resolve, reject);
        }
      });
    }
  }
  
  /**
   * Process TTS via WebSocket
   */
  processTTSWebSocket(text, outputFile, options, resolve, reject) {
    const requestId = uuidv4();
    const audioChunks = [];
    
    // Create a handler for this specific request
    const messageHandler = (data) => {
      if (typeof data === 'string') {
        if (data === 'END') {
          // Synthesis complete, write file
          try {
            fs.writeFileSync(outputFile, Buffer.concat(audioChunks));
            this.wsConnection.removeListener('message', messageHandler);
            resolve(outputFile);
          } catch (err) {
            reject(err);
          }
        } else if (data.startsWith('ERROR:')) {
          this.wsConnection.removeListener('message', messageHandler);
          reject(new Error(data.substring(7)));
        }
      } else {
        // Collect audio chunks
        audioChunks.push(Buffer.from(data));
      }
    };
    
    // Add the message handler
    this.wsConnection.on('message', messageHandler);
    
    // Send the text for synthesis
    this.wsConnection.send(JSON.stringify({
      text,
      requestId,
      ...options
    }));
  }
  
  /**
   * Stop the Python server if it was started by this service
   */
  shutdown() {
    if (this.pythonProcess) {
      console.log('Shutting down Python TTS server...');
      
      // Close WebSocket connection
      if (this.wsConnection) {
        this.wsConnection.close();
        this.wsConnection = null;
      }
      
      // Kill the process
      try {
        // On Windows, we need to kill the process group
        if (process.platform === 'win32') {
          require('child_process').exec(`taskkill /pid ${this.pythonProcess.pid} /T /F`);
        } else {
          // On Unix-like systems, we can send a SIGTERM signal
          process.kill(-this.pythonProcess.pid, 'SIGTERM');
        }
      } catch (error) {
        console.error('Error shutting down Python TTS server:', error);
      }
      
      this.pythonProcess = null;
      this.isServerRunning = false;
      console.log('Python TTS server shut down');
    }
  }
}

module.exports = new TTSService();