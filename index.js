const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

const ALLOWED_GROUP_ID = '120363425664686055@g.us';

const REMINDER_MESSAGE = `(📢 OFFICIAL UPDATE & WAY FORWARD 🙏

Hello family,

We have successfully discussed and agreed on the plan. We have accepted my proposal on how we will be helping each other.

Below is everything we agreed, step by step, so everyone is aware.



📌 HOW EVERYONE WILL BENEFIT

- Cycle of Blessing: We help one person at a time. Once that person travels, gets settled and paid, they must come back to help the next person. This way, eventually EVERYONE gets a chance to travel.
- Financial Relief: You don't carry the whole burden alone. You pay your part, the group supports the balance.
- Safety & Trust: Since I am the one handling everything and connecting you directly, you are safe from scammers and fake agents.
- Transparency: Everything will be done openly with proof and receipts.



📌 THE STEPS WE FOLLOW

1. DOCUMENTATION & VERIFICATION
Before anything else, you must be ready with:

- Passport
- National ID
- Good Conduct Certificate
- Birth Certificate
- I will personally verify all these documents. I have connections to check if your passport is clean or has any issues, and I take full responsibility.

⚠️ RULE: NO DOCUMENTS, NO SUPPORT, NO CONTRIBUTION.
We cannot start any process or collect money for you if you have not submitted and verified your documents first.

2. FINANCIAL REQUIREMENT
You must have at least 60% of the total cost ready.

- MIDDLE EAST:- Total: 250,000 KSH
- You pay: 150,000 KSH
- Group supports: 100,000 KSH
- EUROPE:- Total: 500,000 - 600,000 KSH
- You pay: 300,000 - 360,000 KSH
- Group supports: 200,000 - 240,000 KSH
- TURKEY 🇹🇷:- Special process handled directly by me.
- NO PAYMENT until Offer Letter is out.
- Once letter is out, we do a conference call with my team there, then payments start.

💡 GROUP WELFARE FUND:
From the amount that the group contributes for you, we shall deduct a small percentage of 2% or 3%.
This money will be kept as a Group Fund to help us support other members later or for any emergency needs.

3. PAYMENT METHOD

- All contributions will be sent to MY NUMBER only.
- We do not send money directly to agents or offices in bits.
- When the time comes, you go to the office personally, and I send the money while you are there to ensure it is used for the process only.



📌 STRICT RULES

✅ We only help serious people. Money is for processing only, not luxury.
✅ Honesty is a must. If you have issues, tell the truth.
✅ Promise: If we help you today, you must promise to help others tomorrow.
✅ Order will be followed: First come, first served on the list.



🚀 HOW TO START

If you are ready, you have the 60% cash, and you have all the required documents:

👉 STEP 1: DM ME NOW
Send me a direct message and attach all your documents for verification.

👉 STEP 2: LISTING
I will verify your documents, and then I will write down your name in the list.

Let us work together and rise together. God bless you all 🙏🏾🫂)`;

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth/session3' }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

let pendingPayments = new Map();

app.post('/umva-ipn', async (req, res) => {
    const ipnData = req.body;
    console.log('Received UMVA IPN:', ipnData);
    // TODO: Verify signature
    if (ipnData.status === 1) { // Success
        const identifier = ipnData.identifier;
        console.log('Payment successful for identifier:', identifier);
        // Extract phone from identifier: payment-timestamp-phone
        const parts = identifier.split('-');
        if (parts.length >= 3) {
            const phone = parts.slice(2).join('-'); // in case phone has -
            // Find pending payment by phone
            for (const [sender, data] of pendingPayments) {
                if (data.phone === phone && data.status === 'payment_pending') {
                    data.status = 'paid';
                    try {
                        await client.sendMessage(sender, '✅ Payment confirmed! Welcome to the group. You are now an official member.');
                        console.log('Sent confirmation to:', sender);
                    } catch (error) {
                        console.error('Failed to send confirmation:', error);
                    }
                    break;
                }
            }
        }
    }
    res.status(200).send('OK');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
    console.log('Scan QR code above with WhatsApp');
});

client.on('ready', async () => {
    console.log('✅ WhatsApp Bot is ready and connected!');
    try {
        await client.sendMessage(ALLOWED_GROUP_ID, '🤖 Bot is online and ready!');
        console.log('Confirmation message sent to group.');
    } catch (error) {
        console.error('Failed to send confirmation message:', error);
    }
    // Send initial reminder immediately
    try {
        await client.sendMessage(ALLOWED_GROUP_ID, REMINDER_MESSAGE);
        console.log('Initial reminder message sent to group.');
    } catch (error) {
        console.error('Failed to send initial reminder message:', error);
    }
    // Send reminder every 24 hours
    setInterval(async () => {
        try {
            await client.sendMessage(ALLOWED_GROUP_ID, REMINDER_MESSAGE);
            console.log('Reminder message sent to group.');
        } catch (error) {
            console.error('Failed to send reminder message:', error);
        }
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
});

client.on('group_join', async (notification) => {
    if (notification.id.remote !== ALLOWED_GROUP_ID) return;
    try {
        const joinedUser = notification.id.participant;
        const contact = await client.getContactById(joinedUser);
        
        const welcomeMsg = `🎉 Welcome @${joinedUser.slice(0, -5)} to the group!

To complete your membership, please send your mobile money phone number (format: 254XXXXXXXXX) to pay the KSH 250 joining fee.

You will receive an STK push shortly after sending your number.`;
        
        await notification.reply(welcomeMsg, { mentions: [contact] });
        pendingPayments.set(joinedUser, { status: 'awaiting_number', timestamp: Date.now() });
    } catch (error) {
        console.error('Error handling group join:', error);
    }
});



const initiateSTKPush = async (phoneNumber) => {
    const baseUrl = 'https://umva.net/api/server-api-payment';

    try {
        // Step 1: Create customer
        const createCustomerResponse = await axios.post(`${baseUrl}/create-customer`, {
            public_key: process.env.UMVA_PUBLIC_KEY,
            phone_number: phoneNumber
        }, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });

        if (createCustomerResponse.data.status !== 'success') {
            return { success: false, error: 'Failed to create customer' };
        }

        const customerId = createCustomerResponse.data.data.customer_id;

        // Step 2: Create payment gateway
        const createGatewayResponse = await axios.post(`${baseUrl}/create-payment-gateway`, {
            public_key: process.env.UMVA_PUBLIC_KEY,
            customer_id: customerId,
            phone_number: phoneNumber,
            network: 'M-Pesa',
            country_code: '254'
        }, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });

        if (createGatewayResponse.data.status !== 'success') {
            return { success: false, error: 'Failed to create payment gateway' };
        }

        const paymentId = createGatewayResponse.data.data.payment_id;

        // Step 3: Initiate fiat charge
        const initiateResponse = await axios.post(`${baseUrl}/initiate-fiat`, {
            public_key: process.env.UMVA_PUBLIC_KEY,
            customer_id: customerId,
            payment_id: paymentId,
            amount: 250,
            currency: 'KES',
            network: 'M-Pesa',
            identifier: `payment-${Date.now()}-${phoneNumber}`,
            ipn_url: process.env.UMVA_IPN_URL
        }, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });

        if (initiateResponse.data.status !== 'success') {
            return { success: false, error: 'Failed to initiate payment' };
        }

        return { success: true, response: initiateResponse.data };
    } catch (error) {
        console.error('UMVA error:', error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

client.on('message', async message => {
    if (!message.from.includes('@g.us')) return;
    if (message.from !== ALLOWED_GROUP_ID) return;

    const sender = message.author;
    const content = message.body.trim();
    
    const phoneMatch = content.match(/^(254|0)[0-9]{9}$/);
    
    if (phoneMatch && pendingPayments.has(sender)) {
        let phone = content;
        if (phone.startsWith('0')) phone = '254' + phone.slice(1);
        
        await message.reply(`⏳ Processing payment for ${phone}... Sending STK push now.`);
        
        const result = await initiateSTKPush(phone);
        
        if (result.success) {
            await message.reply('✅ STK push sent! Please enter your mobile money PIN on your phone to complete payment.');
            pendingPayments.get(sender).phone = phone;
            pendingPayments.get(sender).status = 'payment_pending';
        } else {
            await message.reply('❌ Failed to initiate payment. Please try again later.');
        }
    }
    
    if (message.body.toLowerCase() === '!help') {
        await message.reply(`📋 Available commands:
!help - Show this help message
Send phone number (254XXXXXXXXX) to pay joining fee`);
    }
});

client.on('disconnected', (reason) => {
    console.log('Client disconnected:', reason);
});

app.listen(3000, () => console.log('Express server running on port 3000'));

client.initialize();

console.log('Starting WhatsApp bot...');