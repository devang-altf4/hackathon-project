const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client;
let isReady = false;
let qrCodeData = null;
let initializationStarted = false;

const initializeWhatsApp = async () => {
    if (isReady) {
        console.log('WhatsApp Client is already ready.');
        return;
    }
    if (initializationStarted) {
        // console.log('WhatsApp Client is already initializing...');
        return;
    }

    initializationStarted = true;
    console.log('Initializing WhatsApp Client...');
    
    try {
        client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--disable-gpu'
                ],
                headless: true,
                timeout: 60000,
            },
            authTimeoutMs: 60000, 
            qrMaxRetries: 5,
        });

        client.on('qr', (qr) => {
            console.log('QR RECEIVED. Scan this with your WhatsApp app:');
            qrcode.generate(qr, { small: true });
            qrCodeData = qr; 
        });

        client.on('ready', () => {
            console.log('✅ WhatsApp Client is ready!');
            isReady = true;
            qrCodeData = null;
            initializationStarted = false;
        });

        client.on('auth_failure', msg => {
            console.error('AUTHENTICATION FAILURE', msg);
            // Reset logic handled by resetWhatsApp
        });

        client.on('disconnected', (reason) => {
            console.log('Client was logged out', reason);
            resetState();
        });

        // Race between initialize and a timeout
        const initPromise = client.initialize();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('WhatsApp initialization timed out')), 45000)
        );

        await Promise.race([initPromise, timeoutPromise]);
    } catch (err) {
        console.error('WhatsApp Initialization Error:', err);
        if (client) {
            try {
                await client.destroy();
            } catch (e) {
                console.error('Failed to destroy failed client:', e);
            }
            client = null;
        }
        resetState();
    }
};

const resetState = () => {
    isReady = false;
    qrCodeData = null;
    initializationStarted = false;
};

const resetWhatsApp = async () => {
    console.log('Resetting WhatsApp Client...');
    if (client) {
        try {
            await client.destroy();
        } catch (e) {
            console.error('Error destroying client:', e);
        }
    }
    client = null; // Clear client instance
    resetState();
    // Use timeout to allow cleanup
    setTimeout(() => {
        initializeWhatsApp();
    }, 2000);
};

const getQr = () => qrCodeData;
const isClientReady = () => isReady;
const isInitializing = () => initializationStarted;

const sendMessage = async (phoneNumber, message) => {
    if (!isReady) {
        console.warn('WhatsApp client is not ready. Message not sent.');
        return false;
    }

    try {
        // Format phone number
        let formattedNumber = phoneNumber.replace(/\D/g, '');
        if (formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber;
        }
        const chatId = formattedNumber + '@c.us';

        await client.sendMessage(chatId, message);
        console.log(`Message sent to ${formattedNumber}`);
        return true;
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        return false;
    }
};

module.exports = { initializeWhatsApp, sendMessage, getQr, isClientReady, resetWhatsApp, isInitializing };
