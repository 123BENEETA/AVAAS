import React, { useState } from 'react';
import { FiSettings, FiList } from 'react-icons/fi';
import TranscriptHistory from './components/TranscriptHistory';

const Navigation = ({ onSettingsClick }) => {
    const [showHistory, setShowHistory] = useState(false);

    return (
        <>
            <nav className="navbar">
                <div className="nav-brand">
                    <h1>AVAAS</h1>
                    <span className="nav-subtitle">AI Voice Assistance & Support System</span>
                </div>
                <ul className="nav-links">
                    <li className="nav-link">
                        <button onClick={() => setShowHistory(true)}>
                            <FiList />
                            <span>Progress</span>
                        </button>
                    </li>
                    <li className="nav-link">
                        <button onClick={onSettingsClick}>
                            <FiSettings />
                            <span>Settings</span>
                        </button>
                    </li>
                </ul>
            </nav>
            
            {showHistory && (
                <div className="modal-overlay" onClick={() => setShowHistory(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <TranscriptHistory onClose={() => setShowHistory(false)} />
                    </div>
                </div>
            )}
        </>
    );
};

export default Navigation;
