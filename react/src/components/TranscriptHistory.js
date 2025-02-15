import React, { useState, useEffect } from 'react';
import { FiClock, FiTrash2, FiCopy, FiX } from 'react-icons/fi';
import '../styles/TranscriptHistory.css';

const TranscriptHistory = ({ onClose }) => {
    const [savedTranscripts, setSavedTranscripts] = useState([]);

    useEffect(() => {
        const loadSavedTranscripts = () => {
            const saved = JSON.parse(localStorage.getItem('savedTranscripts') || '[]');
            setSavedTranscripts(saved.sort((a, b) => b.id - a.id));
        };

        loadSavedTranscripts();
        window.addEventListener('storage', loadSavedTranscripts);
        return () => window.removeEventListener('storage', loadSavedTranscripts);
    }, []);

    const handleDelete = (id) => {
        const updated = savedTranscripts.filter(t => t.id !== id);
        localStorage.setItem('savedTranscripts', JSON.stringify(updated));
        setSavedTranscripts(updated);
    };

    const handleCopy = async (text) => {
        await navigator.clipboard.writeText(text);
        // Show toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = 'Copied to clipboard!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString(),
            relative: getRelativeTime(date)
        };
    };

    const getRelativeTime = (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="transcript-history">
            <div className="transcript-header">
                <h2><FiClock /> Saved Transcripts</h2>
                <button className="close-button" onClick={onClose}>
                    <FiX />
                </button>
            </div>
            <div className="transcript-list">
                {savedTranscripts.map(transcript => {
                    const time = formatDate(transcript.date);
                    return (
                        <div key={transcript.id} className="transcript-item">
                            <div className="transcript-content">
                                <p>{transcript.text}</p>
                                <div className="transcript-metadata">
                                    <span className="transcript-time" title={`${time.date} ${time.time}`}>
                                        {time.relative}
                                    </span>
                                    <span className="transcript-date">
                                        {time.date} at {time.time}
                                    </span>
                                </div>
                            </div>
                            <div className="transcript-actions">
                                <button 
                                    onClick={() => handleCopy(transcript.text)}
                                    className="action-button"
                                    title="Copy to clipboard"
                                >
                                    <FiCopy />
                                </button>
                                <button 
                                    onClick={() => handleDelete(transcript.id)}
                                    className="action-button delete"
                                    title="Delete"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {savedTranscripts.length === 0 && (
                    <p className="no-transcripts">No saved transcripts yet</p>
                )}
            </div>
        </div>
    );
};

export default TranscriptHistory;
