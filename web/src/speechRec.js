// src/SpeechRecognition.js
import React, { useState } from 'react';

const SpeechRecognition = (callback) => {
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
        if (speechResult.includes("get nouns")) {
            document.getElementById('take-photo').click();
        }
        if (speechResult.includes("take picture")) {
            document.getElementById('take-photo').click();
        }
        // check if soeech contains "USE INFERENCE" and if it does it will take the speech result and fill the        
        // <div>
        // <input
        //     type="text"
        //     id="queryAgent"
        //     value={query}
        //     onChange={(e) => setQuery(e.target.value)}
        //     placeholder="Enter query"
        // />
        // <input
        //     type="number"
        //     value={maxIterations}
        //     id="maxIterations"
        //     onChange={(e) => setMaxIterations(Number(e.target.value))}
        //     placeholder="Max Iterations"
        // />
        // <button id='runAgent' onClick={runAgent}>Run Agent</button>
            setText(speechResult);
        if (speechResult.includes("use inference")) {
        //set the input to speech result
        document.getElementById('queryAgent').value = speechResult;

        //set the max iterations to 1
        document.getElementById('maxIterations').value = 1;
        //click the run agent button
        document.getElementById('runAgent').click();
        console.log(speechResult)
        }
        
    };

    recognition.onspeechend = () => {
        recognition.stop();
        console.log('Voice recognition stopped.');
    };

    recognition.onerror = (event) => {
        console.error('Error occurred in recognition: ' + event.error);
    };
    // while look that checks text value and if it contains "get nounns" it will call the function getNouns
   


    return (
        <div>
            <button onClick={startRecognition}>Start Recognition</button>
            <p>You said: {text}</p>
        </div>
    );
};

export default SpeechRecognition;
