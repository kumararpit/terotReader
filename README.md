"# 🔮 Tarot Card Reading Website

A modern, elegant web application for booking tarot card reading sessions with integrated payment processing and email confirmations.

## ✨ Features

- **Beautiful Light Theme**: Clean, calming, and modern design with soft pastel colors
- **Three Service Types**:
  - Delivered Readings (Written tarot readings via email)
  - Live Readings (Real-time Zoom sessions)
  - Aura Scanning (Energy field assessment)
- **Comprehensive Booking System**: Service-specific forms with validation
- **Payment Integration**: Stripe, PayPal, Razorpay, and Bank Transfer support
- **Email Automation**: Automatic confirmation emails to both client and admin
- **Age Verification**: 18+ validation for delivered readings
- **Word Count Tracking**: Real-time word limits (300/500 words)
- **Terms & Conditions**: Mandatory acceptance before booking
- **Emergency Slots**: 30% surcharge for priority bookings
- **Responsive Design**: Mobile-friendly across all devices

## 🛠 Tech Stack

### Frontend
- React 19.0.0
- React Router DOM 7.5.1
- Tailwind CSS 3.4.17
- Shadcn/UI Components
- Axios for API calls
- Date-fns for date handling
- Sonner for toast notifications

### Backend
- FastAPI 0.110.1
- Motor (AsyncIO MongoDB driver)
- Pydantic for data validation
- Stripe, Razorpay, PayPal SDK
- Python-dotenv for environment variables
- Python 3.10+

### Database
- MongoDB 5.0+

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.10 or higher) - [Download](https://www.python.org/)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Yarn** (v1.22 or higher) - Install via: `npm install -g yarn`
- **Git** - [Download](https://git-scm.com/)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tarot-reading-website
```

### 2. MongoDB Setup

**Start MongoDB:**
```bash
# On macOS (using Homebrew)
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
# Start MongoDB from Services or run mongod.exe
```

**Verify MongoDB is running:**
```bash
mongo --eval \"db.version()\"
# or
mongosh --eval \"db.version()\"
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example)
cp .env.example .env
```

**Configure Backend `.env` file:**
```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=tarot_reader_db

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Tarot Reader Tejashvini <your-email@gmail.com>

# Payment Gateway Keys (Use test keys for development)
# Stripe Test Keys (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# Razorpay Test Keys (Get from https://dashboard.razorpay.com/app/keys)
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_secret_here

# PayPal Sandbox Keys (Get from https://developer.paypal.com/)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here

# Application Settings
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8001
```

**Start Backend Server:**
```bash
# Make sure you're in the backend directory with venv activated
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Backend will be available at: `http://localhost:8001`

### 4. Frontend Setup

Open a **new terminal** (keep backend running):

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
yarn install

# Create .env file
cp .env.example .env
```

**Configure Frontend `.env` file:**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Start Frontend Server:**
```bash
yarn start
```

Frontend will automatically open at: `http://localhost:3000`

## 📁 Project Structure

```
tarot-reading-website/
├── frontend/                 # React Frontend
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/         # Shadcn UI components
│   │   │   ├── Header.jsx
│   │   │   ├── HeroLight.jsx
│   │   │   ├── About.jsx
│   │   │   ├── ServicesLight.jsx
│   │   │   ├── BookingFormLight.jsx
│   │   │   ├── Testimonials.jsx
│   │   │   ├── FAQ.jsx
│   │   │   └── Footer.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── PaymentSuccess.jsx
│   │   │   └── PaymentCancel.jsx
│   │   ├── hooks/          # Custom hooks
│   │   ├── mock.js         # Mock data
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   └── .env
│
├── backend/                 # FastAPI Backend
│   ├── server.py           # Main server file
│   ├── payment_service.py  # Payment gateway integration
│   ├── email_service.py    # Email service
│   ├── requirements.txt    # Python dependencies
│   └── .env
│
└── README.md
```

## 🎯 Usage

### Accessing the Application

1. **Homepage**: Navigate to `http://localhost:3000`
2. **Browse Services**: Scroll to view the three service types
3. **Book a Reading**:
   - Click \"Book Now\" on any service
   - Fill in the required information
   - Select service-specific options
   - Accept Terms & Conditions
   - Proceed to payment
4. **Payment**: Complete payment via Stripe/PayPal/Razorpay
5. **Confirmation**: Receive booking confirmation via email

### API Endpoints

**Base URL**: `http://localhost:8001/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/bookings/create` | Create booking and initiate payment |
| POST | `/bookings/verify-payment` | Verify payment and send emails |
| GET | `/bookings/{booking_id}` | Get booking details |

## 💳 Payment Gateway Setup

### Stripe (Recommended for Testing)
1. Create account at [stripe.com](https://stripe.com)
2. Get test API keys from [Dashboard](https://dashboard.stripe.com/test/apikeys)
3. Add keys to backend `.env` file

### Razorpay
1. Create account at [razorpay.com](https://razorpay.com)
2. Get test keys from [Dashboard](https://dashboard.razorpay.com/app/keys)
3. Add keys to backend `.env` file

### PayPal
1. Create developer account at [developer.paypal.com](https://developer.paypal.com)
2. Create sandbox app and get credentials
3. Add keys to backend `.env` file

## 📧 Email Configuration

### Using Gmail SMTP

1. Enable 2-Factor Authentication on your Gmail account
2. Generate App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate password for \"Mail\"
3. Add credentials to backend `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-digit-app-password
   ```

## 🧪 Testing

### Test Booking Flow

1. **Delivered Reading**:
   - Age: Must be 18+
   - Questions: Max 300 words
   - Description: Max 500 words

2. **Live Reading**:
   - Select date from calendar
   - Choose 20 or 40 minute session

3. **Aura Scanning**:
   - Upload clear photo
   - Plain background required

### Test Payment Cards (Stripe)

```
Card Number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find and kill process on port 8001
lsof -ti:8001 | xargs kill -9
```

**MongoDB connection failed:**
```bash
# Check if MongoDB is running
mongosh
# or
mongo
```

### Frontend Issues

**Port 3000 already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
yarn install
```

**Build errors:**
```bash
# Clear cache and rebuild
yarn cache clean
rm -rf node_modules/.cache
yarn start
```

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use test/sandbox keys for development
- Switch to production keys only for live deployment
- Keep API keys secure and rotate regularly
- Enable CORS properly for production
- Validate all user inputs on backend

## 📱 Responsive Design

The application is fully responsive and tested on:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667, 414x896)

## 🎨 Customization

### Colors
Edit `/frontend/src/App.css` to customize the color scheme:
```css
:root {
  --color-deep-blue: #4A90E2;
  --color-sky-blue: #7AB6F4;
  /* Add your custom colors */
}
```

### Services
Edit `/frontend/src/mock.js` to update service descriptions and pricing.

## 📞 Support

For issues or questions:
- Email: bathejatejashvini@gmail.com
- Check `/app/test_result.md` for testing logs

## 📄 License

All rights reserved © 2026 Tarot Reader Tejashvini

## 🙏 Acknowledgments

- Shadcn/UI for beautiful components
- React team for the amazing framework
- FastAPI for the backend framework
- MongoDB for the database
- Stripe, Razorpay, PayPal for payment processing

---

**Happy Reading! 🔮✨**
"