import React, { useState, useEffect, useRef } from 'react';

const LiveTranscription = ({ text, onTextFinalized }) => {
  const [editedText, setEditedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef(null);
  
  // Update the edited text when new transcription comes in
  useEffect(() => {
    if (!isEditing) {
      setEditedText(text);
    }
  }, [text, isEditing]);
  
  // Enable editing of the transcription
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  // Save the edited text and notify parent
  const handleSaveClick = () => {
    setIsEditing(false);
    onTextFinalized(editedText);
  };
  
  // Handle text changes by the user
  const handleTextChange = (e) => {
    setEditedText(e.target.value);
  };
  
  // Focus on the textarea when editing starts
  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
    }
  }, [isEditing]);
  
  return (
    <div className="live-transcription">
      {isEditing ? (
        <div className="editing-container">
          <textarea
            ref={textRef}
            value={editedText}
            onChange={handleTextChange}
            rows="4"
            className="transcription-editor"
            placeholder="Edit transcription here..."
          />
          <div className="button-group">
            <button onClick={handleSaveClick} className="save-button">
              Save
            </button>
            <button onClick={() => setIsEditing(false)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="display-container">
          <div className="transcription-display">
            {text ? text : <span className="placeholder">Your speech will appear here...</span>}
          </div>
          <div className="button-group">
            <button onClick={handleEditClick} className="edit-button">
              Edit
            </button>
            <button onClick={() => onTextFinalized(text)} className="finalize-button">
              Use This Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTranscription;
