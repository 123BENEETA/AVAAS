import React, { useState, useEffect } from 'react';

const PredictiveText = ({ currentText, onSuggestionSelected }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!currentText) {
      setSuggestions([]);
      return;
    }
    
    const fetchSuggestions = async () => {
      setIsLoading(true);
      
      try {
        // Get the last few words to provide context for prediction
        const words = currentText.trim().split(/\s+/);
        const lastWords = words.slice(-3).join(' '); // Take last 3 words for context
        
        const response = await fetch('http://localhost:5000/api/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: lastWords }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        
        const data = await response.json();
        setSuggestions(data.predictions || []);
      } catch (error) {
        console.error('Error fetching predictions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [currentText]);
  
  const handleSuggestionClick = (suggestion) => {
    onSuggestionSelected(suggestion);
  };
  
  return (
    <div className="predictive-text">
      <div className="suggestions-container">
        {isLoading ? (
          <div className="loading-indicator">
            Loading suggestions...
          </div>
        ) : suggestions.length > 0 ? (
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index} 
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-suggestions">
            No suggestions available
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveText;