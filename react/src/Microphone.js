import React, { useState, useEffect } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';
import annyang from 'annyang';

const Microphone = ({ setTranscription }) => {
    const [isListening, setIsListening] = useState(false);
    const [confidence, setConfidence] = useState(0);

    const showToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2000);
        }, 100);
    };

    const startListening = () => {
        if (annyang) {
            setIsListening(true);
            annyang.start({ autoRestart: true, continuous: false });
            annyang.addCallback('result', (phrases) => {
                setTranscription((prev) => {
                    const newPhrase = phrases[0];
                    return prev ? `${prev}\n${newPhrase}` : newPhrase;
                });
                setConfidence((annyang.lastScore || 0) * 100);
            });
            
            annyang.addCallback('soundstart', () => {
                const button = document.querySelector('.mic-button');
                button.style.transform = 'scale(1.1)';
            });
            
            annyang.addCallback('soundend', () => {
                const button = document.querySelector('.mic-button');
                button.style.transform = 'scale(1)';
            });
            
            showToast("Take your time, I'm listening...");
        }
    };

    const stopListening = () => {
        if (annyang) {
            setIsListening(false);
            annyang.abort();
            showToast("Well done! Your message is ready.");
        }
    };

    useEffect(() => {
        return () => {
            if (annyang) {
                annyang.abort();
            }
        };
    }, []);

    return (
        <div className="microphone-wrapper">
            {isListening && (
                <p className="status-text">
                    Listening quietly... 
                    {confidence > 0 && (
                        <span className="confidence">
                            (Clarity: {Math.round(confidence)}%)
                        </span>
                    )}
                </p>
            )}

            <button
                onClick={isListening ? stopListening : startListening}
                className={`action-button mic-button ${isListening ? 'recording' : ''}`}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
                {isListening ? <FiMicOff size={24} /> : <FiMic size={24} />}
            </button>

        </div>
    );
};

export default Microphone;
