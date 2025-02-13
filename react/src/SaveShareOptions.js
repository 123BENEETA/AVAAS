import React from 'react';

const SaveShareOptions = () => {
    const handleSave = () => {
        // Logic to save transcription
        alert('Transcription saved!');
    };

    const handleShare = () => {
        // Logic to share transcription
        alert('Transcription shared!');
    };

    return (
        <div>
            <h2>Save & Share Options</h2>
            <button onClick={handleSave}>Save Transcription</button>
            <button onClick={handleShare}>Share Transcription</button>
        </div>
    );
};

export default SaveShareOptions;
