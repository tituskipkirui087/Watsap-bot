# WhatsApp Group Bot with M-Pesa Integration

## Setup
1. Copy `.env.example` to `.env`
2. Fill in your M-Pesa Daraja API credentials
3. Set your callback URL (use ngrok for testing)
4. Run `npm install`
5. Run `npm start`
6. Scan QR code with WhatsApp

## Features
✅ Auto-welcome new group members
✅ M-Pesa STK push for KSH 250 joining fee
✅ Phone number format validation (Kenya)
✅ Session persistence (no QR scan every restart)
✅ Group only operation (ignores private messages)

## Environment Variables
```
CONSUMER_KEY=your_mpesa_consumer_key
CONSUMER_SECRET=your_mpesa_consumer_secret
SHORTCODE=174379
PASSKEY=your_mpesa_passkey
CALLBACK_URL=https://your-ngrok-url.ngrok.io/callback
```

## Testing
Use Safaricom sandbox credentials for testing. For production replace sandbox URLs with live.