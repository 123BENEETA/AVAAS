import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SpeechSynthesis({ text, voiceProfile, onSpeechGenerated, onVoiceProfileUpdated }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [isRecordingReference, setIsRecordingReference] = useState(false);
  const [referenceAudio, setReferenceAudio] = useState(null);
  const [referenceAudioUrl, setReferenceAudioUrl] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Fetch available voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/voices');
        const data = await response.json();
        setVoices(data.voices);
        if (data.voices.length > 0) {
          setSelectedVoice(data.voices[0].id);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
      }
    };

    fetchVoices();
  }, []);
  
  // Generate speech when text is finalized
  useEffect(() => {
    if (text) {
      generateSpeech();
    }
  }, [text]);
  
  // Function to start recording reference audio for voice cloning
  const startRecordingReference = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setReferenceAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setReferenceAudioUrl(url);
      };
      
      mediaRecorderRef.current.start();
      setIsRecordingReference(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  // Function to stop recording reference audio
  const stopRecordingReference = () => {
    if (mediaRecorderRef.current && isRecordingReference) {
      mediaRecorderRef.current.stop();
      setIsRecordingReference(false);
    }
  };
  
  // Function to upload reference audio for voice cloning
  const uploadReferenceAudio = async () => {
    if (!referenceAudio) return;
    
    try {
      const formData = new FormData();
      formData.append('reference_audio', referenceAudio);
      
      const response = await fetch('http://localhost:5000/api/voice-profile', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        onVoiceProfileUpdated(data.profile_id);
        alert('Voice profile created successfully!');
      } else {
        throw new Error(data.error || 'Failed to create voice profile');
      }
    } catch (error) {
      console.error('Error uploading reference audio:', error);
      alert('Failed to create voice profile. Try again.');
    }
  };
  
  // Generate speech using the TTS server
  const generateSpeech = async () => {
    if (!text.trim()) return;
    
    setIsGenerating(true);
    
    try {
      const payload = {
        text,
        voice: selectedVoice,
      };
      
      // Add voice profile if available
      if (voiceProfile) {
        payload.voice_profile = voiceProfile;
      }
      
      const response = await fetch('http://localhost:5000/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Append timestamp to avoid browser caching
      const audioUrlWithTimestamp = `http://localhost:5000${data.audioUrl}?t=${new Date().getTime()}`;
      setAudioUrl(audioUrlWithTimestamp);
      onSpeechGenerated(audioUrlWithTimestamp);
    } catch (error) {
      console.error('Error generating speech:', error);
      alert('Failed to generate speech. See console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="speech-synthesis">
      <div className="voice-cloning-section">
        <h3>Voice Cloning</h3>
        <p>Record your voice to create a personalized voice profile:</p>
        
        <div className="reference-audio-controls">
          {isRecordingReference ? (
            <button onClick={stopRecordingReference} className="stop-recording-button">
              Stop Recording
            </button>
          ) : (
            <button onClick={startRecordingReference} className="start-recording-button">
              Start Recording
            </button>
          )}
        </div>
        
        {referenceAudioUrl && (
          <div className="reference-audio-player">
            <p>Reference Audio:</p>
            <audio controls src={referenceAudioUrl}>
              Your browser does not support the audio element.
            </audio>
            <button onClick={uploadReferenceAudio} className="upload-button">
              Use This Voice
            </button>
          </div>
        )}
        
        {voiceProfile && (
          <div className="voice-profile-status">
            <p>Voice profile is active ✓</p>
          </div>
        )}
      </div>
      
      <div className="voice-selection">
        <label htmlFor="voice-select">Select Voice:</label>
        <select 
          id="voice-select"
          value={selectedVoice} 
          onChange={(e) => setSelectedVoice(e.target.value)}
          disabled={voiceProfile !== null}
        >
          {voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        
        {voiceProfile && (
          <button 
            onClick={() => onVoiceProfileUpdated(null)} 
            className="clear-profile-button"
          >
            Clear Voice Profile
          </button>
        )}
      </div>
      
      {text && (
        <div className="synthesis-controls">
          <button 
            onClick={generateSpeech} 
            disabled={isGenerating || !text.trim()}
            className="generate-button"
          >
            {isGenerating ? 'Generating...' : 'Regenerate Speech'}
          </button>
        </div>
      )}
      
      {audioUrl && (
        <div className="audio-player">
          <h3>Synthesized Speech:</h3>
          <audio controls autoPlay src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}