class TTSWebSocket {
    constructor() {
        this.ws = null;
        this.queue = [];
        this.isProcessing = false;
        this.chunks = [];
        this.lastSpokenText = '';
        // Don't create AudioContext until needed
        this._audioContext = null;
        this.processedTexts = new Set(); // Add this line
    }

    // Getter for lazy initialization of AudioContext
    get audioContext() {
        if (!this._audioContext || this._audioContext.state === 'closed') {
            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this._audioContext;
    }

    connect() {
        if (this.ws?.readyState === WebSocket.OPEN) return;

        this.ws = new WebSocket('ws://localhost:8000/tts');
        
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.processQueue();
        };

        this.ws.onmessage = async (event) => {
            if (event.data instanceof Blob) {
                this.chunks.push(event.data);
            } else if (event.data === "END") {
                await this.playCompleteAudio();
                this.chunks = []; // Clear chunks after playing
                this.isProcessing = false;
                this.processQueue();
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.isProcessing = false;
        };

        this.ws.onclose = () => {
            console.log('WebSocket closed');
            this.isProcessing = false;
            setTimeout(() => this.connect(), 2000);
        };
    }

    async playCompleteAudio() {
        try {
            const audioBlob = new Blob(this.chunks, { type: 'audio/wav' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 1;

            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            return new Promise((resolve) => {
                source.onended = resolve;
                source.start(0);
            });
        } catch (error) {
            console.error('Error playing audio:', error);
            this.isProcessing = false;
        }
    }

    async speak(text) {
        // Improved duplicate detection
        const trimmedText = text.trim();
        if (!trimmedText || this.processedTexts.has(trimmedText)) {
            console.log('Skipping duplicate or empty text:', trimmedText);
            return;
        }
        
        try {
            await this.audioContext.resume();
            this.processedTexts.add(trimmedText);
            this.queue.push(trimmedText);
            if (!this.isProcessing) {
                this.processQueue();
            }
        } catch (error) {
            console.error('Error in speak:', error);
        }
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        
        if (this.ws?.readyState !== WebSocket.OPEN) {
            this.connect();
            return;
        }

        this.isProcessing = true;
        const text = this.queue.shift();
        this.ws.send(text);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.queue = [];
        this.chunks = [];
        this.isProcessing = false;
        this.lastSpokenText = '';
        // Don't close AudioContext, just let it be recreated if needed
        this._audioContext = null;
        this.processedTexts.clear(); // Add this line
    }

    // Helper method to clear processed texts (add this)
    clearProcessedTexts() {
        this.processedTexts.clear();
    }
}

export const ttsWebSocket = new TTSWebSocket();
