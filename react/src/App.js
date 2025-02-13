import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Microphone from './Microphone';
import TranscriptionArea from './TranscriptionArea';

function App() {
  const [transcription, setTranscription] = useState('');
  
  return (
    <div className="App">
      <Navbar />
      <div className="container">
        <div className="hero-section">
          <h2 className="title">Stammering Assistant</h2>
          <p className="subtitle">Whisper your words and I'll be the voice for you</p>
        </div>
        <div className="main-content">
          <div className="microphone-container">
            <Microphone setTranscription={setTranscription} />
          </div>
          <TranscriptionArea 
            transcription={transcription} 
            setTranscription={setTranscription}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
