import React, { useState } from 'react';

const PlaybackSettings = () => {
    const [volume, setVolume] = useState(1);
    const [pitch, setPitch] = useState(1);
    const [rate, setRate] = useState(1);

    return (
        <div>
            <h2>Playback & Voice Settings</h2>
            <label>
                Volume:
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                />
            </label>
            <label>
                Pitch:
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                />
            </label>
            <label>
                Rate:
                <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                />
            </label>
        </div>
    );
};

export default PlaybackSettings;
