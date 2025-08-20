# Twilio WhatsApp Integration Setup Guide

This guide will help you set up Twilio WhatsApp Business API for sending check-in messages to employees.

## Prerequisites

1. **Twilio Account**: Sign up at [https://www.twilio.com](https://www.twilio.com)
2. **WhatsApp Business Account**: Required for WhatsApp messaging
3. **Phone Number**: A dedicated phone number for your organization

## Step 1: Create Twilio Account

1. Go to [https://console.twilio.com](https://console.twilio.com)
2. Sign up for a new account or log in
3. Complete account verification
4. Note down your **Account SID** and **Auth Token** from the dashboard

## Step 2: Set Up WhatsApp Business

### Option A: Twilio WhatsApp Sandbox (Testing)
For development and testing:

1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the sandbox
3. Use the sandbox number: `whatsapp:+14155238886`
4. Send "join [sandbox-keyword]" to the number to activate

### Option B: WhatsApp Business API (Production)
For production use:

1. Go to **Messaging** → **WhatsApp** → **Senders**
2. Click **Create new WhatsApp sender**
3. Follow the WhatsApp Business verification process
4. This requires:
   - Business verification documents
   - Facebook Business Manager account
   - WhatsApp Business profile setup
   - Can take 1-3 weeks for approval

## Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
# Twilio Configuration
VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+your_whatsapp_number_here
```

### Finding Your Credentials

1. **Account SID**: Found on your Twilio Console dashboard
2. **Auth Token**: Click "Show" next to Auth Token on dashboard
3. **WhatsApp Number**: 
   - Sandbox: `whatsapp:+14155238886`
   - Production: Your verified WhatsApp Business number

## Step 4: Test the Integration

1. Start your development server
2. Go to HR Dashboard → Send Check-in
3. Use the "Test Connection" button to verify setup
4. Send a test message to your own phone number

## Step 5: Phone Number Format

The system supports Kenyan phone numbers in these formats:
- `+254712345678` (International)
- `254712345678` (Without +)
- `0712345678` (Local format - automatically converted)

## Message Templates

The system includes pre-built templates:

1. **Daily Check-in**: Standard engagement check
2. **Weekly Pulse**: Comprehensive weekly check
3. **Project Feedback**: Project-specific engagement
4. **Custom Message**: Fully customizable

## Rate Limits

- **Sandbox**: 1 message per second
- **Production**: Varies by account type
- The system automatically adds 1.1-second delays between messages

## Troubleshooting

### Common Issues

1. **"Invalid phone number"**
   - Ensure phone numbers are in correct format
   - Check country code (+254 for Kenya)

2. **"Authentication failed"**
   - Verify Account SID and Auth Token
   - Check for extra spaces in environment variables

3. **"WhatsApp number not verified"**
   - Complete WhatsApp Business verification
   - Use sandbox for testing

4. **"Message failed to send"**
   - Check recipient has WhatsApp installed
   - Verify they've opted in to receive messages
   - Check message content length (max 1600 characters)

### Testing Checklist

- [ ] Twilio credentials configured
- [ ] WhatsApp number set up (sandbox or production)
- [ ] Test connection successful
- [ ] Phone numbers in correct format
- [ ] Recipients have WhatsApp installed
- [ ] Message templates working

## Security Best Practices

1. **Never expose credentials in frontend code**
2. **Use environment variables for all sensitive data**
3. **Implement proper error handling**
4. **Log message delivery status**
5. **Respect user privacy and consent**

## Production Considerations

1. **WhatsApp Business Verification**: Required for production
2. **Message Templates**: May need pre-approval for certain content
3. **Opt-in Requirements**: Users must consent to receive messages
4. **Rate Limiting**: Monitor and respect Twilio's rate limits
5. **Cost Management**: Monitor usage and costs

## Support

- **Twilio Documentation**: [https://www.twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp)
- **WhatsApp Business API**: [https://developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **Twilio Support**: Available through Twilio Console

## Next Steps

1. Complete Twilio account setup
2. Configure environment variables
3. Test with sandbox number
4. Apply for WhatsApp Business verification (for production)
5. Train HR team on using the check-in feature
