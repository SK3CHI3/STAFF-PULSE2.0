# 📊 Staff Pulse - Employee Engagement Management Platform.

A comprehensive employee engagement and participation platform built with React, TypeScript, and Vite. Staff Pulse helps organizations monitor employee engagement, conduct check-ins, and gain insights into team performance. 

## ✨ Features.
 
### 🏢 **Organization Management**
- **Employee Directory** - Manage employee profiles, departments, and contact information
- **Department Management** - Create and organize departments with employee counts
- **Role-based Access** - Secure access control for different user types.
    
### 📱 **Communication & Check-ins**
- **WhatsApp/SMS Integration** - Send check-in messages via Twilio 
- **Automated Campaigns** - Schedule and automate engagement check-ins.
- **Multi-channel Support** - WhatsApp and SMS messaging options

### 📊 **Analytics & Insights** 
- **Real-time Dashboard** - Monitor employee engagement and participation metrics 
- **Engagement Tracking** - Track team engagement trends over time  
- **AI-powered Insights** - Get intelligent recommendations using OpenRouter AI.
- **Response Analytics** - Analyze check-in responses and feedback
 
### 💳 **Subscription Management**
- **Tiered Plans** - Startup, Business, and Enterprise plans
- **Payment Integration** - Secure payments via IntaSend
- **Usage Tracking** - Monitor plan limits and usage

### 🎨 **User Experience**
- **Modern UI** - Clean, responsive design with dark/light mode
- **Mobile-first** - Optimized for all device sizes
- **Accessibility** - WCAG compliant interface
- **Real-time Updates** - Live data synchronization

## 🛠 **Tech Stack**

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Messaging**: Twilio (WhatsApp/SMS)
- **AI**: OpenRouter API
- **Payments**: IntaSend
- **Deployment**: Netlify

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Twilio account (for messaging)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd staff-pulse
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```

4. **Configure environment variables** (see `.env` file)

5. **Start development server**
```bash
npm run dev
```

## 📁 **Project Structure**

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Main application pages
├── services/           # API services and external integrations
├── types/              # TypeScript type definitions
└── utils/              # Helper functions

public/
├── _redirects          # Netlify redirects for SPA
└── assets/             # Static assets
```

## 🔧 **Configuration**

### Environment Variables
See `.env` for all required environment variables:
- Supabase configuration
- Twilio credentials
- OpenRouter API key
- IntaSend payment keys

## 🚀 **Deployment**

This project is optimized for Netlify deployment. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Netlify
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy with build command: `npm run build`

## 📄 **License**

This project is licensed under the MIT License.
 
Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
