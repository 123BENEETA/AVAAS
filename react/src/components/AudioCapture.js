import React, { useState, useEffect } from 'react';
import { WebAudioContext } from './WebAudioContext';

export default function AudioCapture() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  // Initialize the audio context
  const audioContext = new WebAudioContext();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set up audio input stream
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          setAudioBlob(event.data);
        };

        return () => {
          mediaRecorder.stop();
        };
      });
    }
  }, []);

  // Start/Stop recording
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      mediaRecorder.start();
    } else {
      mediaRecorder.stop();
    }
  };

  return (
    <button onClick={toggleRecording}>
      {isRecording ? 'Stop Recording' : 'Start Recording'}
    </button>
  );
}