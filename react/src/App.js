import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/AppStyles.css';
import AudioCapture from './components/AudioCapture';
import NoiseReducer from './components/NoiseReducer';
import LiveTranscription from './components/LiveTranscription';
import PredictiveText from './components/PredictiveText';
import SpeechSynthesis from './components/SpeechSynthesis';
import FacialAnimations from './components/FacialAnimations';
import SocialSharing from './components/SocialSharing';
import WebSocketTransmitter from './components/WebSocketTransmitter';
import ThemeToggle from './components/ThemeToggle';
import { FaMicrophone, FaVolumeUp, FaFont, FaShare } from 'react-icons/fa';

function App() {
  // State management for the application workflow
  const [wsTransmitter] = useState(() => WebSocketTransmitter());
  const [audioBlob, setAudioBlob] = useState(null);
  const [processedAudio, setProcessedAudio] = useState(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [finalText, setFinalText] = useState('');
  const [synthesizedAudio, setSynthesizedAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [userVoiceProfile, setUserVoiceProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('input');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  
  // Set theme on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Handle processed audio from noise reduction
  const handleProcessedAudio = (processedBlob) => {
    setProcessedAudio(processedBlob);
    wsTransmitter.sendAudioBlob(processedBlob);
  };
  
  // Handle incoming transcription from server
  useEffect(() => {
    const unsubscribe = wsTransmitter.onTranscription((data) => {
      if (typeof data === 'string') {
        setTranscribedText(data);
      } else {
        setTranscribedText(data.text || '');
        setConfidence(data.confidence || 0);
        setDetectedLanguage(data.language || '');
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [wsTransmitter]);
  
  // Finalize text for speech synthesis
  const handleFinalizeText = (text) => {
    setFinalText(text);
    // Auto-switch to synthesis tab when text is finalized
    setActiveTab('output');
  };
  
  // Handle synthesized speech
  const handleSynthesizedSpeech = (audioUrl) => {
    setSynthesizedAudio(audioUrl);
  };
  
  // Save user voice profile for cloning
  const handleVoiceProfileUpdate = (profile) => {
    setUserVoiceProfile(profile);
  };
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  // Render active section based on tab
  const renderActiveSection = () => {
    switch (activeTab) {
      case 'input':
        return (
          <>
            <div className="panel">
              <h2>Audio Input</h2>
              <AudioCapture 
                onCapture={setAudioBlob} 
                isRecording={isRecording}
                setIsRecording={setIsRecording}
              />
              <NoiseReducer 
                audioBlob={audioBlob} 
                onProcessed={handleProcessedAudio} 
              />
            </div>
          </>
        );
      case 'transcription':
        return (
          <>
            <div className="panel">
              <h2>Speech Recognition</h2>
              {detectedLanguage && confidence > 0 && (
                <div className="transcription-meta">
                  <span className="language-badge">
                    Language: {detectedLanguage.toUpperCase()}
                  </span>
                  <span className="confidence-indicator">
                    Confidence: {Math.round(confidence * 100)}%
                  </span>
                </div>
              )}
              <LiveTranscription 
                text={transcribedText} 
                onTextFinalized={handleFinalizeText}
              />
              <PredictiveText 
                currentText={transcribedText} 
                onSuggestionSelected={(suggestion) => {
                  setTranscribedText(transcribedText + " " + suggestion);
                }}
              />
            </div>
          </>
        );
      case 'output':
        return (
          <>
            <div className="panel">
              <h2>Voice Synthesis</h2>
              <SpeechSynthesis 
                text={finalText} 
                voiceProfile={userVoiceProfile}
                onSpeechGenerated={handleSynthesizedSpeech}
                onVoiceProfileUpdated={handleVoiceProfileUpdate}
              />
              <FacialAnimations 
                audioUrl={synthesizedAudio}
                text={finalText}
              />
            </div>
          </>
        );
      case 'share':
        return (
          <>
            <div className="panel">
              <h2>Share</h2>
              <SocialSharing 
                text={finalText}
                audioUrl={synthesizedAudio}
                platforms={['whatsapp', 'telegram', 'twitter', 'email']}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="avaass-app">
      <header className="app-header">
        <h1>AVAASS - Assisting People with Stutter</h1>
        <p>Whisper to communicate fluently</p>
      </header>
      
      <nav className="app-tabs">
        <button 
          className={`tab-button ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          <FaMicrophone /> Input
        </button>
        <button 
          className={`tab-button ${activeTab === 'transcription' ? 'active' : ''} ${transcribedText ? 'has-content' : ''}`}
          onClick={() => setActiveTab('transcription')}
        >
          <FaFont /> Transcription
          {transcribedText && <span className="tab-notification"></span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'output' ? 'active' : ''} ${finalText ? 'has-content' : ''}`}
          onClick={() => setActiveTab('output')}
          disabled={!finalText}
        >
          <FaVolumeUp /> Synthesis
        </button>
        <button 
          className={`tab-button ${activeTab === 'share' ? 'active' : ''}`}
          onClick={() => setActiveTab('share')}
          disabled={!synthesizedAudio}
        >
          <FaShare /> Share
        </button>
      </nav>
      
      <main className="app-main">
        {renderActiveSection()}
        
        <div className="workflow-status">
          <div className={`workflow-step ${audioBlob ? 'completed' : 'current'}`}>
            <span className="step-number">1</span>
            <span className="step-text">Record</span>
          </div>
          <div className={`workflow-step ${transcribedText ? 'completed' : audioBlob ? 'current' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-text">Transcribe</span>
          </div>
          <div className={`workflow-step ${finalText ? 'completed' : transcribedText ? 'current' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-text">Edit</span>
          </div>
          <div className={`workflow-step ${synthesizedAudio ? 'completed' : finalText ? 'current' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-text">Synthesize</span>
          </div>
          <div className={`workflow-step ${synthesizedAudio ? 'current' : ''}`}>
            <span className="step-number">5</span>
            <span className="step-text">Share</span>
          </div>
        </div>
      </main>
      
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <footer className="app-footer">
        <p>AVAASS - Advanced Voice and Audio Assistance for Stammering Support</p>
      </footer>
    </div>
  );
}

export default App;
