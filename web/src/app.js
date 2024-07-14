import React, { useState } from 'react';
import lighthouse from '@lighthouse-web3/sdk';
import QRCode from 'qrcode.react';
import axios from 'axios';
import SpeechRecognition from './SpeechRec';
import RunAgentForm from './components/agentForm';
import AgentInteractionComponent from './components/AgentInteract';

const apiKey = process.env.REACT_APP_LIGHTHOUSE_KEY;  // Get your API key from Lighthouse
const aiKey = process.env.REACT_APP_AI_KEY; 

const speak = (text) => {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    } else {
        console.error('Text-to-speech is not supported in this browser.');
    }
};

async function uploadPhoto(file) {
    console.log('Starting the upload to Filecoin...');
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://node.lighthouse.storage/api/v0/add?wrap-with-directory=false', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Lighthouse response:', result);  // Log the entire response
        const cid = result.Hash;
        console.log(`Upload complete. Content added with CID: ${cid}`);
        return cid;
    } catch (error) {
        console.error('Error uploading to Filecoin via Lighthouse:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
        throw error;
    }
}

async function getChatGptDescription(image) {
    console.log('Requesting description from Galadriel...');
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o', // or another model you prefer
                messages: [
                    {"role": "system", "content": "You are a helpful assistant that returns brief descriptions of images."},
                    {"role": "user", "content": [
                        {"type": "text", "text": "Describe the image below:"},
                        {"type": "image_url", "image_url": {"url": `data:image/png;base64,${image}}`}
                        }
                    ]}
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiKey}`
                }
            }
        );

        const description = response.data.choices[0].message.content;
        console.log('ChatGPT description:', description);
        return description;
    } catch (error) {
        console.error('Error getting description from ChatGPT:', error);
        throw error;
    }
}

const App = () => {
    const [status, setStatus] = useState('Disconnected');
    const [photo, setPhoto] = useState('');
    const [cid, setCid] = useState('');
    const [description, setDescription] = useState('');

    const connect = async () => {
        let serviceUuid = '12345678-1234-1234-1234-123456789012';
        let photoCharacteristicUuid = '87654321-4321-4321-4321-210987654321';
        let commandCharacteristicUuid = '87654321-4321-4321-4321-210987654322';

        try {
            console.log('Requesting Bluetooth Device...');
            const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [serviceUuid] }]
            });

            console.log('Connecting to GATT Server...');
            const server = await device.gatt.connect();

            console.log('Getting Service...');
            const service = await server.getPrimaryService(serviceUuid);

            console.log('Getting Characteristics...');
            const photoCharacteristic = await service.getCharacteristic(photoCharacteristicUuid);
            const commandCharacteristic = await service.getCharacteristic(commandCharacteristicUuid);

            let base64Image = '';
            photoCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
                const value = new TextDecoder('utf-8').decode(event.target.value);
                base64Image += value;
                console.log('Received chunk:', value);
            });

            console.log('Subscribing to notifications...');
            await photoCharacteristic.startNotifications();

            document.getElementById('take-photo').addEventListener('click', async () => {
                console.log('Sending take photo command...');
                await commandCharacteristic.writeValue(new TextEncoder().encode('TAKE_PHOTO'));

                base64Image = '';
                // Wait for all chunks to be received
                setTimeout(async () => {
                    console.log('Displaying Image...');
                    const img = document.getElementById('photo');
                    img.src = `data:image/jpeg;base64,${base64Image}`;
                    img.style.display = 'block';
                    setStatus('Connected and Photo Captured');

                    try {
                        // Ensure the base64 string is valid
                        let cleanedBase64Image = base64Image.replace(/[^A-Za-z0-9+/=]/g, '');

                        // Correct padding
                        while (cleanedBase64Image.length % 4 !== 0) {
                            cleanedBase64Image += '=';
                        }

                        // Convert base64 image to File object
                        console.log('Converting base64 to file object...');
                        const byteString = atob(cleanedBase64Image);
                        const ab = new ArrayBuffer(byteString.length);
                        const ia = new Uint8Array(ab);
                        for (let i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        const file = new Blob([ab], { type: 'image/jpeg' });
                        console.log('File object created:', file);

                        // Upload the photo to Filecoin
                        console.log('Starting the upload to Filecoin...');
                        const cid = await uploadPhoto(new File([file], 'photo.jpg'));
                        setCid(cid);
                        setStatus(`Photo uploaded to Filecoin with CID: ${cid}`);

                        const ipfsLink = `https://gateway.lighthouse.storage/ipfs/${cid}`;
                        // RUN GALADRIEl inference here:
                        const description = await getChatGptDescription(cleanedBase64Image);

                        setDescription(description);
                    } catch (e) {
                        console.error('Error decoding base64 image:', e);
                        setStatus('Error: Invalid base64 image string');
                    }
                }, 5000);  // Adjust the timeout as necessary based on the chunk transmission time
            });

            setStatus('Connected');
            document.getElementById('take-photo').disabled = false;

        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <h1>Nounocle Photo Capture</h1>
            <RunAgentForm />
            <AgentInteractionComponent />
            <button onClick={connect}>Connect to Nounocle</button>
            <button id="take-photo" disabled>Take New Photo</button>
            <p>Status: {status}</p>
            <img id="photo" style={{ display: 'none' }} />
            {cid && (
                <div>
                    <p>
                        Photo uploaded to Filecoin with CID: <a href={`https://gateway.lighthouse.storage/ipfs/${cid}`} target="_blank" rel="noopener noreferrer">{cid}</a>
                    </p>
                    <QRCode value={`https://gateway.lighthouse.storage/ipfs/${cid}`} />
                </div>
            )}
            {description && (
                <div>
                    {description && (
                <div>
                    <h2>Image Description</h2>
                    <p>{description}</p>
                    <button onClick={() => speak(description)}>Listen to Description</button>
                    <SpeechRecognition/>
                </div>
            )}
                </div>
            )}
        </div>
    );
};

export default App;
