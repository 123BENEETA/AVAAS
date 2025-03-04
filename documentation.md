# AVAASS – Advanced Voice Activated Assistive System for Stuttering

## Objective

Develop a full-stack web application that enables users who stutter to communicate more fluently. The system allows users to speak in a whisper (which naturally has fewer disfluencies) and processes the audio through multiple stages to deliver a clear, fluent speech output. This output is provided both as a live transcription and as synthesized audio with synchronized facial animations. Additionally, users can share their transcriptions and audio outputs via popular messaging platforms such as Telegram, WhatsApp, and X.com.

## Table of Contents

1. [Objective](#objective)
2. [Functional Requirements](#functional-requirements)
   - [Audio Capture & Noise Reduction](#audio-capture--noise-reduction)
   - [Speech-to-Text (ASR) Processing](#speech-to-text-asr-processing)
   - [Predictive Text Assistance](#predictive-text-assistance)
   - [Text-to-Speech (TTS) and Voice Cloning](#text-to-speech-tts-and-voice-cloning)
   - [Facial Animation Integration](#facial-animation-integration)
   - [Sharing Functionality](#sharing-functionality)
   - [User Interface & Experience](#user-interface--experience)
3. [Technical Stack](#technical-stack)
4. [Cloud & Deployment](#cloud--deployment)
5. [Outcome](#outcome)
6. [Future Work](#future-work)
7. [License](#license)

## Functional Requirements

### Audio Capture & Noise Reduction

- **Capture Whispered Audio:**
  - Use the browser’s Web Audio API to record audio directly from the user’s microphone.
  
- **Noise Reduction:**
  - Integrate `rnnoise-wasm` to clean the raw audio input by reducing background noise and enhancing the quality of the whispered signal.

### Speech-to-Text (ASR) Processing

- **Transcription:**
  - Forward the denoised audio to `whisper.cpp` (compiled to WebAssembly) for real-time transcription.
  - *Reference:* [Minimal WASM example from whisper.cpp](https://whisper.ggerganov.com/)
  
- **Live Transcription Display:**
  - Stream the transcription back to the frontend using WebSockets to provide near real-time updates.

### Predictive Text Assistance

- **Next-Word Prediction:**
  - Implement a predictive text engine (e.g., using a GPT-based model) that suggests subsequent words as the user speaks.
  - This feature assists in forming complete, coherent sentences quickly.

### Text-to-Speech (TTS) and Voice Cloning

- **Clear Speech Generation:**
  - Send the transcribed text to Coqui’s XTTS v2 model for real-time text-to-speech synthesis.
  - Use voice cloning techniques to retain the user’s unique vocal characteristics.
  - *Reference:* [Coqui XTTS v2 overview on Reddit](https://www.reddit.com)

### Facial Animation Integration

- **Visual Speech Representation:**
  - Develop a module that leverages facial animation (using WebGL or Three.js) to display lip-sync and expressive facial cues.
  - Synchronize these animations with the synthesized speech to enhance accessibility and listener engagement.

### Sharing Functionality

- **Multi-Platform Sharing:**
  - Provide options (buttons or links) to share the transcribed text and synthesized audio directly to messaging platforms such as Telegram, WhatsApp, or X.com.
  - Use deep links or platform-specific APIs (e.g., [wa.me](https://faq.whatsapp.com/425247423114725) for WhatsApp, Telegram’s API) for seamless sharing.

### User Interface & Experience

- **Responsive Design:**
  - Build an intuitive, accessible, and responsive UI using modern frameworks such as React.js .
  
- **Real-Time Feedback:**
  - Display live transcription, predictive suggestions, and facial animations concurrently.
  - Provide controls for starting/stopping audio recording and playback.

- **Dashboard:**
  - Offer users a dashboard to review past sessions, adjust settings (e.g., noise reduction levels, voice style preferences), and manage sharing options.

## Technical Stack

### Frontend

- **Framework:** React.js 
- **Audio & Animation:**
  - **Audio Capture:** Web Audio API
  - **Real-Time Communication:** WebSockets
  - **Facial Animation:** Three.js or WebGL

### Backend

- **Server:** Python (FastAPI)
- **Real-Time Communication:** WebSockets for streaming transcriptions and other live updates.
- **Integration:** API endpoints for interfacing with `rnnoise-wasm`, `whisper.cpp` (WASM build), and Coqui XTTS v2.

### Deployment

- **Serverless Functions:** Utilize serverless architecture for on-demand processing tasks.

## Outcome

The final solution will be a cloud-based SaaS platform that empowers individuals with stuttering by converting whispered speech into fluent, clear audio output. The system will provide:
- Live text transcription,
- Synthesized audio with voice cloning,
- Synchronized facial animations,
- Seamless sharing options to popular messaging platforms.

This comprehensive approach ensures that users experience an enhanced, accessible communication method tailored to their needs.

## Future Work

- **Model Enhancements:** Refine noise reduction algorithms and improve voice cloning accuracy.
- **Feature Expansion:** Integrate additional messaging platforms and support a wider range of languages.
- **UI/UX Improvements:** Enhance customization options for facial animations and user dashboard features.
- **Performance Optimization:** Further reduce latency and optimize real-time processing capabilities.

## License

This project is licensed under the [MIT License](LICENSE).

---
*End of Documentation*
