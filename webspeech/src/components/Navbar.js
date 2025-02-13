import React, { useState } from 'react';
import { FiHome, FiBook, FiSettings, FiInfo } from 'react-icons/fi';
import SettingsModal from './SettingsModal';

const Navbar = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settings, setSettings] = useState({
        volume: 100,
        pitch: 100,
        speed: 100
    });

    return (
        <>
            <nav className="navbar">
                <div className="nav-brand">
                    <h1>AVAASS</h1>
                    <span className="nav-subtitle">Speech Assistive System</span>
                </div>
                <ul className="nav-links">
                    <li className="nav-link active">
                        <FiHome />
                        <span>Home</span>
                    </li>
                    <li className="nav-link">
                        <FiBook />
                        <span>Progress</span>
                    </li>
                    <li className="nav-link">
                        <button onClick={() => setIsSettingsOpen(true)}>
                            <FiSettings />
                            <span>Settings</span>
                        </button>
                    </li>
                    <li className="nav-link">
                        <FiInfo />
                        <span>About</span>
                    </li>
                </ul>
            </nav>
            
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
            />
        </>
    );
};

export default Navbar;
