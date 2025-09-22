import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Import token manager and role-based loader for JWT functionality
import './utils/tokenManager.js';
import '../js/role-based-loader.js';

// Enhanced application initialization for new structure
const initializeApp = () => {
  console.log('[DEBUG] Initializing application with new structure');
  
  // NEW: Enhanced initialization for new schema
  const initData = {
    schemaVersion: '2.0',
    enhancedFeatures: true,
    newUserStructure: true,
    newTestStructure: true
  };
  
  // Store initialization data
  localStorage.setItem('app_init_data', JSON.stringify(initData));
  
  console.log('[DEBUG] Application initialized with enhanced features');
};

// Enhanced main function for new structure
const main = () => {
  console.log('[DEBUG] Starting main application');
  
  // Initialize app with new structure
  initializeApp();
  
  // Create root element
  const root = ReactDOM.createRoot(document.getElementById('root'));

  // Render the app with enhanced features
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Start the application
main();
