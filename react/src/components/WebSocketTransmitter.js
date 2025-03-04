import { useCallback, useEffect, useRef } from 'react';

const WebSocketTransmitter = () => {
  const socketRef = useRef(null);
  const transcriptionCallbacksRef = useRef([]);
  const reconnectTimeoutRef = useRef(null);
  
  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      // Close existing socket if any
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      
      // Connect to WebSocket server
      socketRef.current = new WebSocket('ws://localhost:5000/ws/speech');
      
      // Setup event listeners
      socketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };
      
      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'transcription') {
            // Notify all transcription listeners
            transcriptionCallbacksRef.current.forEach(callback => {
              callback(data.text);
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socketRef.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        
        // Attempt to reconnect after a delay
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 3000);
      };
      
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Socket will auto-close, which will trigger reconnect via onclose
      };
      
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }, []);
  
  // Initialize connection on component mount
  useEffect(() => {
    connectWebSocket();
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);
  
  // Register for transcription events
  const onTranscription = useCallback((callback) => {
    transcriptionCallbacksRef.current.push(callback);
    
    // Return function to unregister
    return () => {
      transcriptionCallbacksRef.current = transcriptionCallbacksRef.current
        .filter(cb => cb !== callback);
    };
  }, []);
  
  // Send audio blob to server
  const sendAudioBlob = useCallback((blob) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Cannot send audio.');
      return;
    }
    
    // Convert blob to array buffer for transmission
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result;
      
      // Send audio data
      socketRef.current.send(arrayBuffer);
    };
    
    reader.readAsArrayBuffer(blob);
  }, []);
  
  // Expose public methods
  return {
    onTranscription,
    sendAudioBlob
  };
};

export default WebSocketTransmitter;