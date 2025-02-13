import React from 'react';
import { FiX } from 'react-icons/fi';
import '../styles/SettingsModal.css';

const SettingsModal = ({ isOpen, onClose, settings, onSettingsChange }) => {
    if (!isOpen) return null;

    const handleSliderChange = (setting, value) => {
        onSettingsChange({ ...settings, [setting]: value });
    };

    return (
        <div className="settings-overlay">
            <div className="settings-modal">
                <button className="close-x-button" onClick={onClose}>
                    <FiX size={24} />
                </button>
                <h2>Voice Settings</h2>
                <div className="settings-content">
                    {[
                        { name: 'volume', max: 100, label: 'Volume' },
                        { name: 'pitch', max: 200, label: 'Pitch' },
                        { name: 'speed', max: 200, label: 'Speed' }
                    ].map(slider => (
                        <div key={slider.name} className="slider-group">
                            <span>{slider.label}</span>
                            <input 
                                type="range" 
                                min="0" 
                                max={slider.max} 
                                value={settings[slider.name]}
                                onChange={(e) => handleSliderChange(slider.name, e.target.value)}
                                orient="vertical"
                            />
                            <span className="value">{settings[slider.name]}%</span>
                        </div>
                    ))}
                </div>
                <button className="close-button" onClick={onClose}>Apply</button>
            </div>
        </div>
    );
};

export default SettingsModal;
