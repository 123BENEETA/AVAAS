import React, { useEffect, useState } from 'react';
import { createRNNoiseNode } from 'rnnoise-wasm';

const NoiseReducer = ({ audioBlob, onProcessed }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  useEffect(() => {
    if (!audioBlob) return;
    
    const processAudio = async () => {
      setIsProcessing(true);
      setProcessingProgress(0);
      
      try {
        // Convert blob to AudioBuffer
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Create RNNoise processing node
        const rnnoiseNode = await createRNNoiseNode(audioContext);
        
        // Create source and destination nodes
        const sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        
        const destinationNode = audioContext.createMediaStreamDestination();
        
        // Connect the nodes
        sourceNode.connect(rnnoiseNode);
        rnnoiseNode.connect(destinationNode);
        
        // Setup recording from destination stream
        const mediaRecorder = new MediaRecorder(destinationNode.stream);
        const chunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const processedBlob = new Blob(chunks, { type: 'audio/webm' });
          onProcessed(processedBlob);
          setIsProcessing(false);
          setProcessingProgress(100);
        };
        
        // Start source and recorder
        mediaRecorder.start();
        sourceNode.start();
        
        // Update progress
        const duration = audioBuffer.duration * 1000;
        const updateInterval = 100;
        let currentTime = 0;
        
        const progressInterval = setInterval(() => {
          currentTime += updateInterval;
          const progress = Math.min((currentTime / duration) * 100, 99);
          setProcessingProgress(progress);
          
          if (currentTime >= duration) {
            clearInterval(progressInterval);
            sourceNode.stop();
            mediaRecorder.stop();
          }
        }, updateInterval);
        
      } catch (error) {
        console.error("Error in noise reduction:", error);
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    };
    
    processAudio();
  }, [audioBlob, onProcessed]);
  
  return (
    <div className="noise-reducer">
      {isProcessing && (
        <div className="processing-indicator">
          <p>Reducing noise: {Math.round(processingProgress)}%</p>
          <progress value={processingProgress} max="100" />
        </div>
      )}
    </div>
  );
};

export default NoiseReducer;
