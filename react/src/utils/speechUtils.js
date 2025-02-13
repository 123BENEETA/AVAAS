const speechQueue = [];
let isSpeaking = false;

export const speakText = (text, settings = { rate: 1, pitch: 1, volume: 1 }) => {
    speechQueue.push({ text, settings });
    if (!isSpeaking) {
        speakNext();
    }
};

function speakNext() {
    if (speechQueue.length === 0 || isSpeaking) return;

    isSpeaking = true;
    const { text, settings } = speechQueue.shift();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onend = () => {
        isSpeaking = false;
        speakNext();
    };

    utterance.onerror = () => {
        console.error('Speech synthesis error');
        isSpeaking = false;
        speakNext();
    };

    setTimeout(() => {
        try {
            speechSynthesis.speak(utterance);
        } catch (err) {
            console.error('Speech synthesis failed:', err);
            isSpeaking = false;
            speakNext();
        }
    }, 100);
}

export const clearSpeechQueue = () => {
    speechQueue.length = 0;
    speechSynthesis.cancel();
    isSpeaking = false;
};
