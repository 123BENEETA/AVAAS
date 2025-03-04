const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const config = require('../config/config');

// Ensure necessary directories
const tempDir = path.join(__dirname, '../../shared/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Initialize a WebSocket server for speech processing
const setupSpeechWebSocket = (server) => {
  const wss = new WebSocket.Server({ 
    server, 
    path: '/ws/speech'
  });
  
  console.log('WebSocket server initialized at /ws/speech');
  
  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    console.log(`Client ${clientId} connected`);
    
    let audioData = [];
    
    ws.on('message', async (message) => {
      // Accumulate audio data chunks
      audioData.push(message);
      
      // Process when we have enough data
      if (audioData.length >= 5) {
        processAudioForSpeechRecognition(audioData, ws, clientId);
        audioData = [];
      }
    });
    
    ws.on('close', () => {
      console.log(`Client ${clientId} disconnected`);
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  });
  
  return wss;
};

// Process audio for speech recognition
const processAudioForSpeechRecognition = async (audioChunks, ws, clientId) => {
  const webmFile = path.join(tempDir, `audio_${clientId}_${Date.now()}.webm`);
  const wavFile = path.join(tempDir, `audio_${clientId}_${Date.now()}.wav`);
  
  try {
    // Save audio to temp file
    fs.writeFileSync(webmFile, Buffer.concat(audioChunks));
    
    // Convert webm to wav for better compatibility with speech recognition
    exec(`ffmpeg -i ${webmFile} -acodec pcm_s16le -ar 16000 -ac 1 ${wavFile}`, (err) => {
      if (err) {
        console.error(`FFmpeg error: ${err.message}`);
        sendErrorToClient(ws, 'Audio conversion failed');
        cleanup();
        return;
      }
      
      // Build whisper.cpp command
      const whisperCommand = buildWhisperCommand(wavFile);
      
      // Process with whisper
      exec(whisperCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Whisper error: ${error.message}`);
          sendErrorToClient(ws, 'Speech recognition failed');
          cleanup();
          return;
        }
        
        // Parse whisper output
        const result = parseWhisperOutput(stdout, stderr);
        
        // Send result to client
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'transcription',
            text: result.text,
            confidence: result.confidence,
            language: result.language
          }));
        }
        
        cleanup();
      });
    });
  } catch (error) {
    console.error(`Error processing audio: ${error.message}`);
    sendErrorToClient(ws, 'Failed to process audio');
    cleanup();
  }
  
  function cleanup() {
    // Clean up temporary files
    if (fs.existsSync(webmFile)) {
      fs.unlink(webmFile, () => {});
    }
    
    if (fs.existsSync(wavFile)) {
      fs.unlink(wavFile, () => {});
    }
  }
};

// Build Whisper command with configuration
const buildWhisperCommand = (audioFile) => {
  let cmd = `whisper ${audioFile} --model ${config.whisperModel || 'medium'}`;
  
  if (config.whisperLanguage && config.whisperLanguage !== 'auto') {
    cmd += ` --language ${config.whisperLanguage}`;
  }
  
  if (config.whisperTranslate) {
    cmd += ' --translate';
  }
  
  cmd += ' --output_format json';
  
  return cmd;
};

// Parse Whisper output
const parseWhisperOutput = (stdout, stderr) => {
  try {
    // Try to parse JSON output
    const data = JSON.parse(stdout);
    return {
      text: data.text || '',
      confidence: data.confidence || 0,
      language: data.language || 'en'
    };
  } catch (e) {
    // Fallback to text parsing
    return {
      text: stdout.replace(/\[\d+:\d+\.\d+ --> \d+:\d+\.\d+\]\s+/g, '').trim(),
      confidence: 0,
      language: 'unknown'
    };
  }
};

// Send error to client
const sendErrorToClient = (ws, message) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      error: message
    }));
  }
};

module.exports = setupSpeechWebSocket;
