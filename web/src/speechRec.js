// src/SpeechRecognition.js
import React, { useState } from 'react';

const SpeechRecognition = () => {
    const [text, setText] = useState('');
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const startRecognition = () => {
        recognition.start();
        console.log('Voice recognition started. Speak into the microphone.');
    };

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        console.log('Result received: ' + speechResult);
        setText(speechResult);
    };

    recognition.onspeechend = () => {
        recognition.stop();
        console.log('Voice recognition stopped.');
    };

    recognition.onerror = (event) => {
        console.error('Error occurred in recognition: ' + event.error);
    };

    return (
        <div>
            <h1>Voice to Text Example</h1>
            <button onClick={startRecognition}>Start Recognition</button>
            <p>You said: {text}</p>
        </div>
    );
};

export default SpeechRecognition;
