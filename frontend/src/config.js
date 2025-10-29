// frontend/src/config.js
// Create this file to manage API URLs

const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
};

export default config;

// Usage in your components:
// import config from './config';
// axios.get(`${config.API_URL}/api/nasa/image`)