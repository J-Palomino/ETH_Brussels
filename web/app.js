import lighthouse from '@lighthouse-web3/sdk';

const apiKey = 'YOUR_LIGHTHOUSE_API_KEY';  // Get your API key from Lighthouse

async function uploadPhoto(file) {
    console.log('Starting the upload to Filecoin...');
    try {
        const response = await lighthouse.upload(file, apiKey);
        const cid = response.data.Hash;
        console.log(`Upload complete. Content added with CID: ${cid}`);
        return cid;
    } catch (error) {
        console.error('Error uploading to Filecoin via Lighthouse:', error);
        throw error;
    }
}

document.getElementById('connect').addEventListener('click', async () => {
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
                document.getElementById('status').textContent = 'Status: Connected and Photo Captured';

                // Convert base64 image to File object
                const byteString = atob(base64Image.split(',')[1]);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const file = new Blob([ab], { type: 'image/jpeg' });

                // Upload the photo to Filecoin
                console.log('Starting the upload to Filecoin...');
                const cid = await uploadPhoto(new File([file], 'photo.jpg'));
                document.getElementById('status').textContent = `Photo uploaded to Filecoin with CID: ${cid}`;
            }, 5000);  // Adjust the timeout as necessary based on the chunk transmission time
        });

        document.getElementById('status').textContent = 'Status: Connected';
        document.getElementById('take-photo').disabled = false;

    } catch (error) {
        console.error(error);
        document.getElementById('status').textContent = `Error: ${error.message}`;
    }
});
