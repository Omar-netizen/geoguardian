# 🛰️ GeoGuardian - AI-Powered Environmental Monitoring

**Real-time satellite monitoring for climate action, disaster response, and environmental protection.**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://geoguardian.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Built with](https://img.shields.io/badge/built%20with-MERN-green)](https://github.com)

---

## 🌍 Overview

GeoGuardian democratizes professional satellite monitoring by providing free, AI-powered environmental change detection. Monitor deforestation, wildfires, floods, and climate change in real-time with automated alerts.

**🎥 [Watch Demo Video](https://youtube.com/your-demo)**  
**🚀 [Try Live App](https://geoguardian.vercel.app)**

---

## ✨ Features

### 🛰️ High-Resolution Satellite Imagery
- 10-meter resolution Sentinel-2 data
- Automatic cloud masking (max 30% clouds)
- Updated every 5 days globally
- Free access (would cost $50+ per image commercially)

### 🔍 AI Change Detection
- Pixel-by-pixel RGB analysis
- Severity classification (low/medium/high)
- Automatic change type identification
- Email alerts for critical changes

### 🎬 Time-Lapse Generation
- Create animations from multiple dates
- Visualize 6 months of change in 6 seconds
- Interactive slideshow controls
- Perfect for presentations

### 🕐 Automated Monitoring
- Schedule daily/weekly/monthly checks
- Monitor unlimited regions simultaneously
- Instant email notifications
- Zero manual effort required

### 🗺️ Interactive Tools
- Map-based region selection
- Coordinates to BBox converter
- Historical analysis tracking
- User authentication & data persistence

---

## 🎯 Use Cases

| Sector | Application | Impact |
|--------|-------------|--------|
| **NGOs** | Monitor protected forests 24/7 | Stop illegal deforestation |
| **Disaster Response** | Early wildfire/flood detection | Save lives and property |
| **Researchers** | Long-term climate documentation | Publish peer-reviewed studies |
| **Government** | Urban planning & agriculture | Data-driven policy decisions |
| **Insurance** | Damage assessment & verification | Faster claims processing |

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas account
- Sentinel Hub API credentials (free tier)
- Gmail account (for alerts)

### Installation

**1. Clone Repository**
```bash
git clone https://github.com/yourusername/geoguardian.git
cd geoguardian
```

**2. Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
node index.js
```

**3. Frontend Setup**
```bash
cd frontend
npm install
npm start
```

**4. Access App**
```
Frontend: http://localhost:3000
Backend: http://localhost:5000
```

---

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **Leaflet.js** - Interactive maps
- **Chart.js** - Data visualization
- **Axios** - API requests

### Backend
- **Node.js & Express** - Server framework
- **MongoDB & GridFS** - Database & image storage
- **Sharp** - Image processing
- **Node-cron** - Task scheduling
- **Nodemailer** - Email alerts

### APIs & Services
- **Sentinel Hub API** - Satellite imagery
- **JWT** - Authentication
- **Bcrypt** - Password hashing

---

## 📊 Architecture

```
┌─────────────┐
│   React     │  ← User Interface
│  Frontend   │
└──────┬──────┘
       │ HTTP/REST
┌──────▼──────┐
│   Express   │  ← API Server
│   Backend   │
└──────┬──────┘
       │
   ┌───┴────┬────────────┬──────────┐
   │        │            │          │
┌──▼───┐ ┌─▼───────┐ ┌──▼─────┐ ┌─▼──────┐
│MongoDB│ │Sentinel │ │  Cron  │ │ Email  │
│GridFS │ │  Hub    │ │Scheduler│ │Service │
└───────┘ └─────────┘ └────────┘ └────────┘
```

---

## 📸 Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)
*Fetch satellite imagery with coordinates converter*

### Change Detection
![Comparison](screenshots/comparison.png)
*Before/after analysis with AI-powered change detection*

### Time-Lapse
![Time-lapse](screenshots/timelapse.png)
*Animated visualization of environmental changes*

### Automated Monitoring
![Monitoring](screenshots/monitoring.png)
*Set up regions for automated 24/7 monitoring*

---

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```bash
MONGO_URI=mongodb+srv://...
SENTINEL_CLIENT_ID=your_client_id
SENTINEL_CLIENT_SECRET=your_client_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
JWT_SECRET=your_secret_key
PORT=5000
```

**Frontend (.env):**
```bash
REACT_APP_API_URL=http://localhost:5000
```

---

## 📖 API Documentation

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
```

### Satellite Imagery
```http
POST /api/nasa/image
GET /api/nasa/image/:id
```

### Change Detection
```http
POST /api/change-detection
GET /api/change-detection/diff/:id
```

### Time-Lapse
```http
POST /api/timelapse/generate
GET /api/timelapse/:parentId/frames
```

### Monitoring
```http
POST /api/monitoring/regions
GET /api/monitoring/regions
POST /api/monitoring/regions/:id/check
```

[Full API Documentation →](API.md)

---

## 🧪 Testing

### Manual Testing Locations

**California Wildfire (July 2024):**
```
Before: 2024-07-20
After: 2024-07-30
BBox: -121.8,39.8,-121.3,40.3
Expected: 20-30% change, HIGH severity
```

**Amazon Deforestation:**
```
Before: 2024-01-01
After: 2024-07-01
BBox: -54.5,-3.5,-54.0,-3.0
Expected: 10-20% change, MEDIUM severity
```

**Agricultural Seasonal:**
```
Before: 2024-02-01
After: 2024-05-01
BBox: -121.5,36.5,-121.0,37.0
Expected: 5-15% change, LOW-MEDIUM severity
```

---

## 🚀 Deployment

Deployed on:
- **Frontend:** Vercel (https://geoguardian.vercel.app)
- **Backend:** Render (https://geoguardian-backend.onrender.com)
- **Database:** MongoDB Atlas

[Deployment Guide →](DEPLOYMENT.md)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Built with 💚 for Octopus Hackathon 2024**

- [Your Name](https://github.com/yourusername) - Full Stack Developer

---

## 🙏 Acknowledgments

- **Sentinel Hub** for providing free satellite data access
- **ESA Copernicus** for Sentinel-2 satellite program
- **Open Source Community** for amazing libraries and tools

---

## 📧 Contact

- **Email:** your.email@example.com
- **Project Link:** https://github.com/yourusername/geoguardian
- **Live Demo:** https://geoguardian.vercel.app

---

## 🌟 Star This Repository

If you find GeoGuardian useful, please ⭐ this repository to show your support!

---

**Made with ❤️ for our planet** 🌍
