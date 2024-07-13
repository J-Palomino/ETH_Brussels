import React, { useState } from 'react';
import lighthouse from '@lighthouse-web3/sdk';
const apiKey = '583da035.ed5f3661683246b2a64d1da5c8ed1fb5';  // Get your API key from Lighthouse

async function uploadPhoto(file) {
    console.log('Starting the upload to Filecoin...');
    try {
        const response = await lighthouse.upload(file, apiKey);
        console.log('Lighthouse response:', response);  // Log the entire response
        const cid = response.data.Hash;
        console.log(`Upload complete. Content added with CID: ${cid}`);
        return cid;
    } catch (error) {
        console.error('Error uploading to Filecoin via Lighthouse:', error);
        throw error;
    }
}

const App = () => {
    const [status, setStatus] = useState('Disconnected');
    const [photo, setPhoto] = useState('');

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

                    // Convert base64 image to File object
                    console.log('Converting base64 to file object...');
                    const byteString = atob(base64Image.split(',')[1]);
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
                    setStatus(`Photo uploaded to Filecoin with CID: ${cid}`);
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
            <button onClick={connect}>Connect to Nounocle</button>
            <button id="take-photo" disabled>Take New Photo</button>
            <p>Status: {status}</p>
            <img id="photo" style={{ display: 'none' }} />
        </div>
    );
};

export default App;
