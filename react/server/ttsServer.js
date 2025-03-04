const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Set up WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws/speech' });

// Create necessary directories
const publicDir = path.join(__dirname, '../public');
const uploadDir = path.join(__dirname, '../uploads');
const profilesDir = path.join(__dirname, '../profiles');
const tempDir = path.join(__dirname, '../temp');

// Ensure all required directories exist
[publicDir, uploadDir, profilesDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/public', express.static(publicDir));

// Utility functions
const cleanupOldFiles = (directory, maxAgeHours = 24) => {
  try {
    const files = fs.readdirSync(directory);
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old file: ${filePath}`);
      }
    });
  } catch (error) {
    console.error(`Error cleaning up directory ${directory}:`, error);
  }
};

// Run cleanup at startup and periodically
cleanupOldFiles(publicDir);
cleanupOldFiles(tempDir);
setInterval(() => {
  cleanupOldFiles(publicDir);
  cleanupOldFiles(tempDir);
}, 3600000); // Every hour

// WebSocket connection handling
wss.on('connection', function connection(ws) {
  console.log('WebSocket client connected');
  
  let audioData = [];
  let clientId = uuidv4();
  
  ws.on('message', function incoming(message) {
    // Assuming message is audio data
    audioData.push(message);
    
    // Process audio when enough data is received
    if (audioData.length >= 5) {
      processAudioForTranscription(audioData, ws, clientId);
      audioData = [];
    }
  });
  
  ws.on('close', function() {
    console.log(`WebSocket client ${clientId} disconnected`);
  });
  
  ws.on('error', function(error) {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
});

// Add these configuration options near the top of the file
const whisperConfig = {
  model: process.env.WHISPER_MODEL || 'medium', // tiny, base, small, medium, large
  language: process.env.WHISPER_LANGUAGE || 'auto', // auto for automatic detection, or specific language code
  translate: process.env.WHISPER_TRANSLATE === 'true' || false, // whether to translate to English
  vad: process.env.WHISPER_VAD === 'true' || true, // voice activity detection
  vad_threshold: parseFloat(process.env.WHISPER_VAD_THRESHOLD || '0.5'),
  word_timestamps: process.env.WHISPER_WORD_TIMESTAMPS === 'true' || true,
};

// Improved whisper audio processing function
function processAudioForTranscription(audioChunks, ws, clientId) {
  // Create a temporary file with the audio data
  const tempFile = path.join(tempDir, `asr_${clientId}_${Date.now()}.webm`);
  const wavFile = path.join(tempDir, `asr_${clientId}_${Date.now()}.wav`);
  
  // Combine audio chunks and write to file
  const combined = Buffer.concat(audioChunks);
  
  try {
    fs.writeFileSync(tempFile, combined);
    
    // First convert to WAV format for better compatibility with whisper.cpp
    console.log(`Converting audio to WAV format for client ${clientId}...`);
    
    exec(`ffmpeg -i ${tempFile} -acodec pcm_s16le -ar 16000 -ac 1 ${wavFile}`, (convError, convStdout, convStderr) => {
      // Delete the original file
      fs.unlink(tempFile, err => {
        if (err) console.error(`Error removing temp file ${tempFile}:`, err);
      });
      
      if (convError) {
        console.error(`FFmpeg conversion error: ${convError.message}`);
        sendErrorToClient(ws, 'Failed to process audio format');
        return;
      }
      
      // Build whisper command with enhanced options
      const whisperCommand = buildWhisperCommand(wavFile);
      console.log(`Executing whisper command for client ${clientId}: ${whisperCommand}`);
      
      // Track processing start time for performance monitoring
      const processingStartTime = Date.now();
      
      // Process with whisper.cpp
      exec(whisperCommand, (error, stdout, stderr) => {
        // Clean up wav file
        fs.unlink(wavFile, err => {
          if (err) console.error(`Error removing wav file ${wavFile}:`, err);
        });
        
        if (error) {
          console.error(`Whisper error: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          sendErrorToClient(ws, 'Failed to transcribe audio');
          return;
        }
        
        // Process the whisper output
        const processingTime = Date.now() - processingStartTime;
        const result = processWhisperOutput(stdout, stderr);
        
        console.log(`ASR completed in ${processingTime}ms for client ${clientId}`);
        
        // Send transcription to client with metadata
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'transcription',
            text: result.transcription,
            confidence: result.confidence,
            language: result.detectedLanguage,
            processing_time_ms: processingTime,
            word_timestamps: result.wordTimestamps || [],
            segments: result.segments || []
          }));
        }
      });
    });
  } catch (error) {
    console.error(`Error writing temporary file ${tempFile}:`, error);
    sendErrorToClient(ws, 'Failed to process audio data');
  }
}

// Helper to send error responses to client
function sendErrorToClient(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      error: message
    }));
  }
}

// Build the whisper.cpp command with appropriate options
function buildWhisperCommand(audioFile) {
  let cmd = `whisper ${audioFile} --model ${whisperConfig.model}`;
  
  // Add language option if specified
  if (whisperConfig.language !== 'auto') {
    cmd += ` --language ${whisperConfig.language}`;
  }
  
  // Add translation flag if needed
  if (whisperConfig.translate) {
    cmd += ' --translate';
  }
  
  // Add word timestamps if enabled
  if (whisperConfig.word_timestamps) {
    cmd += ' --word_timestamps true';
  }
  
  // Add voice activity detection if enabled
  if (whisperConfig.vad) {
    cmd += ` --vad_threshold ${whisperConfig.vad_threshold}`;
  }
  
  // Add output format for easier parsing
  cmd += ' --output_format json';
  
  return cmd;
}

// Process whisper output with enhanced information extraction
function processWhisperOutput(stdout, stderr) {
  try {
    // Try parsing JSON output if available
    const jsonOutput = JSON.parse(stdout);
    
    // Extract the full transcription
    const transcription = jsonOutput.text || '';
    
    // Extract other useful metadata
    return {
      transcription,
      confidence: jsonOutput.confidence || 0.0,
      detectedLanguage: jsonOutput.language || 'unknown',
      wordTimestamps: jsonOutput.word_timestamps || [],
      segments: jsonOutput.segments || []
    };
  } catch (e) {
    console.log('Could not parse JSON output, falling back to text parsing');
    
    // Fallback to text-based parsing if JSON is not available
    // Extract transcription from stdout
    const transcription = extractTranscriptionFromWhisperOutput(stdout);
    
    // Extract language detection info if available
    const langMatch = stderr.match(/Detected language: ([a-z]{2})/i);
    const detectedLanguage = langMatch ? langMatch[1] : 'unknown';
    
    return {
      transcription,
      confidence: 0.0, // Cannot determine confidence from text output
      detectedLanguage
    };
  }
}

// The original extraction function remains as fallback
function extractTranscriptionFromWhisperOutput(output) {
  // Customize this based on whisper.cpp output format
  // Example: parse the output string to extract just the transcription
  const lines = output.split('\n');
  
  // Find lines that contain actual transcription (not timestamps)
  const transcriptionLines = lines.filter(line => 
    !line.match(/^\[\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}\]/)
  );
  
  return transcriptionLines.join(' ').trim();
}

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Endpoint to generate TTS audio
app.post('/api/tts', async (req, res) => {
  const { text, voice, voice_profile } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    // Create a unique output filename
    const outputFileName = `output_${uuidv4()}.wav`;
    const outputFile = path.join(publicDir, outputFileName);
    
    let command;
    
    // Use voice profile for XTTS if provided
    if (voice_profile && fs.existsSync(path.join(profilesDir, `${voice_profile}.wav`))) {
      // Command for Coqui XTTS with voice cloning
      command = `xtts --text "${text}" --voice_samples ${path.join(profilesDir, `${voice_profile}.wav`)} --out_path ${outputFile}`;
    } else {
      // Standard TTS command
      command = `tts --text "${text}" --model_name "${voice || 'tts_models/en/ljspeech/tacotron2-DDC'}" --out_path ${outputFile}`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`TTS Error: ${error.message}`);
        if (stderr) console.error(`TTS stderr: ${stderr}`);
        return res.status(500).json({ error: 'Failed to generate speech' });
      }
      
      if (stderr) {
        console.error(`TTS stderr: ${stderr}`);
      }
      
      console.log(`TTS stdout: ${stdout}`);
      
      // Return the URL to the generated audio file
      res.json({ audioUrl: `/public/${outputFileName}` });
    });
  } catch (error) {
    console.error('Error generating TTS audio:', error);
    res.status(500).json({ error: 'Failed to process TTS request' });
  }
});

// Upload voice sample for voice cloning
app.post('/api/voice-profile', upload.single('reference_audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    // Generate unique profile ID
    const profileId = uuidv4();
    
    // Convert uploaded audio to proper format if needed (e.g., webm to wav)
    const inputFile = req.file.path;
    const outputFile = path.join(profilesDir, `${profileId}.wav`);
    
    // Use ffmpeg to convert if needed
    const command = `ffmpeg -i ${inputFile} -acodec pcm_s16le -ar 22050 -ac 1 ${outputFile}`;
    
    exec(command, (error, stdout, stderr) => {
      // Clean up the uploaded file
      fs.unlink(inputFile, () => {});
      
      if (error) {
        console.error(`Error converting voice sample: ${error.message}`);
        return res.status(500).json({ error: 'Failed to process voice sample' });
      }
      
      res.status(201).json({ 
        message: 'Voice profile created', 
        profile_id: profileId 
      });
    });
    
  } catch (error) {
    console.error('Error creating voice profile:', error);
    res.status(500).json({ error: 'Failed to create voice profile' });
  }
});

// Get available voices endpoint
app.get('/api/voices', (req, res) => {
  try {
    // In a production system, this would query Coqui for available models
    // For now, we return a static list
    const voices = [
      { id: 'tts_models/en/ljspeech/tacotron2-DDC', name: 'LJ Speech (English)' },
      { id: 'tts_models/en/vctk/vits', name: 'VCTK (Multi-speaker English)' },
      { id: 'tts_models/en/jenny/jenny', name: 'Jenny (American English)' },
      { id: 'tts_models/en/multi-dataset/tortoise-v2', name: 'Tortoise (High quality)' },
      { id: 'xtts_v2', name: 'XTTS v2 (Voice cloning)' }
    ];
    
    res.json({ voices });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ error: 'Failed to retrieve voices' });
  }
});

// Predictive text endpoint
app.post('/api/predict', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text input is required' });
  }
  
  try {
    // This is a simplified example. In a real application, you would:
    // 1. Use a proper NLP model or API for next word prediction
    // 2. Consider context, grammar, etc.
    
    // Common words that might follow different contexts
    const predictions = generatePredictions(text);
    
    res.json({ predictions });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// Simple prediction generation function
function generatePredictions(text) {
  const commonWords = {
    greeting: ['hello', 'hi', 'hey', 'good'],
    question: ['what', 'how', 'when', 'why', 'where', 'who'],
    continuation: ['and', 'also', 'additionally', 'furthermore', 'moreover'],
    confirmation: ['yes', 'sure', 'definitely', 'absolutely', 'of course'],
    negation: ['no', 'not', 'never', 'disagree', 'cannot'],
  };
  
  const lastWord = text.trim().split(/\s+/).pop().toLowerCase();
  
  // Some simple context-based predictions
  switch (lastWord) {
    case 'hello':
    case 'hi':
    case 'hey':
      return ['there', 'everyone', 'world', 'friend', 'how are you'];
    case 'i':
      return ['am', 'will', 'would', 'could', 'have'];
    case 'am':
      return ['not', 'going', 'trying', 'planning', 'thinking'];
    case 'you':
      return ['are', 'can', 'should', 'will', 'might'];
    case 'how':
      return ['are', 'is', 'do', 'does', 'can'];
    case 'what':
      return ['is', 'are', 'do', 'about', 'should'];
    case 'the':
      return ['most', 'best', 'world', 'way', 'time'];
    case 'to':
      return ['get', 'make', 'see', 'be', 'do'];
    case 'it':
      return ['is', 'was', 'will', 'should', 'could'];
    default:
      // Mix different types of continuations
      return [
        ...commonWords.continuation.slice(0, 2),
        ...commonWords.question.slice(0, 1),
        ...commonWords.confirmation.slice(0, 1),
        ...commonWords.negation.slice(0, 1)
      ];
  }
}

// Lip-sync generation endpoint
app.post('/api/lip-sync', (req, res) => {
  const { text, audioUrl } = req.body;
  
  if (!text || !audioUrl) {
    return res.status(400).json({ error: 'Both text and audioUrl are required' });
  }
  
  try {
    // In a production app, you'd use a proper phoneme-to-viseme mapping library
    // This is a simplified example that generates mock lip-sync data
    
    // Generate mock lip-sync data based on text length and estimated duration
    const lipSyncData = generateMockLipSyncData(text);
    
    res.json({ lipSync: lipSyncData });
  } catch (error) {
    console.error('Error generating lip-sync data:', error);
    res.status(500).json({ error: 'Failed to generate lip-sync data' });
  }
});

// Generate mock lip-sync data for demonstration
function generateMockLipSyncData(text) {
  const words = text.split(/\s+/);
  const lipSyncData = [];
  
  // Simplified visemes
  const visemes = ['rest', 'open', 'wide', 'round', 'closed', 'narrow'];
  
  let currentTime = 0;
  const averageWordDuration = 300; // ms
  
  words.forEach(word => {
    const wordDuration = word.length * 70; // Longer words take more time
    const phonemesCount = Math.max(2, Math.ceil(word.length / 2));
    
    // Generate phonemes for each word
    for (let i = 0; i < phonemesCount; i++) {
      const viseme = visemes[Math.floor(Math.random() * visemes.length)];
      const duration = wordDuration / phonemesCount;
      
      lipSyncData.push({
        time: currentTime,
        viseme: viseme,
        duration: duration,
        intensity: 0.5 + Math.random() * 0.5
      });
      
      currentTime += duration;
    }
    
    // Add pause between words
    currentTime += 50; // 50ms pause
  });
  
  return lipSyncData;
}

// Start the server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   AVAASS - Speech Processing Server                ║
║   Running on port ${PORT}                          ║
║                                                    ║
║   API Endpoints:                                   ║
║   - /api/health - Server health check              ║
║   - /api/tts - Text-to-Speech                      ║
║   - /api/voices - Available voices                 ║
║   - /api/predict - Predictive text                 ║
║   - /api/lip-sync - Generate lip-sync data         ║
║   - /api/voice-profile - Create voice profile      ║
║                                                    ║
║   WebSocket:                                       ║
║   - ws://localhost:${PORT}/ws/speech               ║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
