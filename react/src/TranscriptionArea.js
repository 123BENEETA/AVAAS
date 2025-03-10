import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiShare2, FiTrash2, FiSave } from 'react-icons/fi';
import { speechQuotes } from './data/quotes';
import './styles/QuotePanels.css';
import { ttsWebSocket } from './services/websocketService';
import Microphone from './Microphone';

const TranscriptionArea = ({ transcription, setTranscription, settings = { speed: 100, pitch: 100, volume: 100 } }) => {
    const previousTranscriptionRef = useRef('');
    const transcriptionRef = useRef(null);
    const [quoteSetIndex, setQuoteSetIndex] = useState(0);
    const totalSets = Math.floor(speechQuotes.length / 3);

    useEffect(() => {
        const timer = setInterval(() => {
            setQuoteSetIndex(prev => (prev + 1) % totalSets);
        }, 8000); // Rotate every 8 seconds

        return () => clearInterval(timer);
    }, [totalSets]);

    useEffect(() => {
        ttsWebSocket.connect();
        
        // Cleanup WebSocket connection when component unmounts
        return () => ttsWebSocket.disconnect();
    }, []);

    const handleNewTranscription = useCallback((text) => {
        if (text?.trim()) {
            const prevText = previousTranscriptionRef.current || '';
            // Only get the actual new content
            const newText = text.slice(prevText.length).trim();
            
            if (newText) {  // Remove the text !== prevText check
                ttsWebSocket.speak(newText);
            }
            previousTranscriptionRef.current = text;
        }
    }, []);

    useEffect(() => {
        if (transcription) {
            handleNewTranscription(transcription);
        }
    }, [transcription, handleNewTranscription]);

    const getQuotesForDisplay = (side) => {
        const startIdx = (quoteSetIndex * 3) % speechQuotes.length;
        const quotes = side === 'right' 
            ? [...speechQuotes].reverse()
            : speechQuotes;
        return quotes.slice(startIdx, startIdx + 3);
    };

    const handleShare = async () => {
        if (!transcription) return;
        
        try {
            await navigator.clipboard.writeText(transcription);
            const shareData = {
                title: 'AVAASS Transcription',
                text: transcription,
            };

            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Show toast for clipboard copy
                document.body.appendChild(createToast("Text copied to clipboard!"));
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleClear = () => {
        setTranscription('');
        previousTranscriptionRef.current = '';
        document.body.appendChild(createToast("Transcription cleared"));
    };

    const handleSave = () => {
        if (!transcription) return;
        
        const savedTranscripts = JSON.parse(localStorage.getItem('savedTranscripts') || '[]');
        const newTranscript = {
            id: Date.now(),
            text: transcription,
            date: new Date().toISOString(),
        };
        
        savedTranscripts.push(newTranscript);
        localStorage.setItem('savedTranscripts', JSON.stringify(savedTranscripts));
        document.body.appendChild(createToast("Transcription saved!"));
    };

    const createToast = (message) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => document.body.removeChild(toast), 300);
            }, 2000);
        }, 100);
        return toast;
    };

    useEffect(() => {
        if (transcriptionRef.current) {
            const element = transcriptionRef.current;
            element.scrollTop = element.scrollHeight;
        }
    }, [transcription]);

    return (
        <div className="transcription-section">
            <aside className="quote-panels left">
                {getQuotesForDisplay('left').map((quote, idx) => (
                    <div 
                        key={`${quoteSetIndex}-${idx}`} 
                        className="quote-box"
                        style={{ 
                            '--order': idx,
                            '--rotation': `${[-2, 1, -1][idx]}deg`
                        }}
                    >
                        <p>{quote}</p>
                    </div>
                ))}
            </aside>
            
            <div className="transcription-container">
                <h2 className="transcription-title">
                    Transcription
                    <span className="transcription-dot"></span>
                </h2>
                <div className="transcription-content" ref={transcriptionRef}>
                    {transcription ? (
                        <p className="transcription-text" key={transcription.length}>
                            {transcription.split('\n').map((text, i) => (
                                <span 
                                    key={i} 
                                    className="transcription-line"
                                    style={{ 
                                        animationDelay: `${i * 0.1}s`,
                                        opacity: 0,
                                        animation: 'fadeIn 0.5s forwards'
                                    }}
                                >
                                    {text}
                                    <br />
                                </span>
                            ))}
                        </p>
                    ) : (
                        <p className="transcription-placeholder">
                            Take your time. Whisper your thoughts, and I will help express them clearly...
                        </p>
                    )}
                </div>
                <div className="transcription-actions">
                    <button 
                        className="action-button save-button"
                        onClick={handleSave}
                        disabled={!transcription}
                        title="Save transcription"
                    >
                        <FiSave size={20} />
                        <span>Save</span>
                    </button>
                    <button 
                        className="action-button share-button"
                        onClick={handleShare}
                        disabled={!transcription}
                        title="Share transcription"
                    >
                        <FiShare2 size={20} />
                        <span>Share</span>
                    </button>
                    <button 
                        className="action-button clear-button"
                        onClick={handleClear}
                        disabled={!transcription}
                        title="Clear transcription"
                    >
                        <FiTrash2 size={20} />
                        <span>Clear</span>
                    </button>
                </div>
                <Microphone setTranscription={setTranscription} />
            </div>

            <aside className="quote-panels right">
                {getQuotesForDisplay('right').map((quote, idx) => (
                    <div 
                        key={`${quoteSetIndex}-${idx}`} 
                        className="quote-box"
                        style={{ 
                            '--order': idx,
                            '--rotation': `${[2, -1, 1][idx]}deg`
                        }}
                    >
                        <p>{quote}</p>
                    </div>
                ))}
            </aside>
        </div>
    );
};

export default TranscriptionArea;
