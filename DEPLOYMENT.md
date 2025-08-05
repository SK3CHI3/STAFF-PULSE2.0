# 🚀 Staff Pulse Deployment Guide

## Netlify Deployment Instructions

### Prerequisites
- Node.js 18+ installed
- Git repository with your code
- Netlify account

### 1. Environment Variables Setup

Before deploying, set up these environment variables in your Netlify dashboard:

#### Required Variables:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio Configuration (for SMS/WhatsApp)
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# OpenRouter API (for AI insights)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# IntaSend Payment Gateway
VITE_INTASEND_PUBLIC_API_KEY=your_intasend_public_key
```

### 2. Netlify Dashboard Setup

1. **Connect Repository**:
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub/GitLab repository

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **Environment Variables**:
   - Go to Site settings → Environment variables
   - Add all the variables listed above

### 3. Domain Configuration

1. **Custom Domain** (Optional):
   - Go to Site settings → Domain management
   - Add your custom domain
   - Configure DNS settings

2. **HTTPS**:
   - Automatically enabled by Netlify
   - Force HTTPS redirect is recommended

### 4. Post-Deployment Configuration

#### Twilio Webhooks:
Update your Twilio console with the new domain:
```
https://your-site.netlify.app/api/webhooks/twilio/sms-incoming
https://your-site.netlify.app/api/webhooks/twilio/whatsapp-incoming
https://your-site.netlify.app/api/webhooks/twilio/message-status
```

#### Supabase Configuration:
1. Update allowed origins in Supabase dashboard
2. Add your Netlify domain to the allowed list

### 5. Testing Deployment

1. **Functionality Tests**:
   - [ ] User authentication works
   - [ ] Employee management functions
   - [ ] Department management works
   - [ ] Check-in campaigns can be sent
   - [ ] Reports and analytics display correctly

2. **Performance Tests**:
   - [ ] Page load times are acceptable
   - [ ] Images and assets load properly
   - [ ] Mobile responsiveness works

### 6. Monitoring and Maintenance

1. **Netlify Analytics**:
   - Enable in Site settings → Analytics
   - Monitor traffic and performance

2. **Error Monitoring**:
   - Check Netlify function logs
   - Monitor browser console for errors

3. **Regular Updates**:
   - Keep dependencies updated
   - Monitor security advisories

## Troubleshooting

### Common Issues:

1. **404 Errors on Refresh**:
   - Ensure `_redirects` file is in `public/` folder
   - Check netlify.toml redirect configuration

2. **Environment Variables Not Working**:
   - Verify all variables start with `VITE_`
   - Check they're set in Netlify dashboard
   - Redeploy after adding variables

3. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

4. **API Calls Failing**:
   - Verify CORS settings in Supabase
   - Check environment variable values
   - Ensure API endpoints are accessible

### Support Resources:
- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router Deployment](https://reactrouter.com/en/main/guides/deploying)

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files to git
   - Use Netlify's environment variable system
   - Regularly rotate API keys

2. **Content Security Policy**:
   - Review CSP headers in index.html
   - Ensure all external domains are whitelisted

3. **HTTPS**:
   - Always use HTTPS in production
   - Update all API calls to use HTTPS

## Performance Optimization

1. **Build Optimization**:
   - Code splitting is enabled by default in Vite
   - Assets are automatically optimized

2. **Caching**:
   - Static assets cached for 1 year
   - HTML files not cached for updates

3. **Monitoring**:
   - Use Netlify Analytics
   - Monitor Core Web Vitals
   - Set up error tracking
