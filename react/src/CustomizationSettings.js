import React, { useState } from 'react';

const CustomizationSettings = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.body.style.backgroundColor = isDarkMode ? '#fff' : '#333';
        document.body.style.color = isDarkMode ? '#000' : '#fff';
    };

    return (
        <div>
            <h2>Customization Settings</h2>
            <label>
                Dark Mode:
                <input
                    type="checkbox"
                    checked={isDarkMode}
                    onChange={toggleDarkMode}
                />
            </label>
        </div>
    );
};

export default CustomizationSettings;
