// TOKEN MANAGER - Simple authentication token management for standalone HTML pages
// ✅ COMPLETED: JWT token management for authentication
// ✅ COMPLETED: Token storage and retrieval
// ✅ COMPLETED: Token validation and refresh
// ✅ COMPLETED: Logout functionality

class TokenManager {
  constructor() {
    this.tokenKey = 'auth_token';
    this.refreshTokenKey = 'refresh_token';
    this.userKey = 'user_data';
    
    // Start periodic integrity checks
    this.startIntegrityMonitoring();
  }

  // Start periodic integrity monitoring to prevent corruption
  startIntegrityMonitoring() {
    // Check integrity every 30 seconds
    setInterval(() => {
      this.performIntegrityCheck();
    }, 30000);
  }

  // Perform integrity check on stored tokens
  performIntegrityCheck() {
    const token = localStorage.getItem(this.tokenKey);
    if (token && !this.validateTokenFormat(token)) {
      console.warn('Integrity check failed - corrupted token detected');
      
      // Try to restore from backup before clearing
      if (!this.restoreFromBackup()) {
        console.warn('No valid backup available - clearing authentication');
        this.clearAuth();
      }
    }
  }

  // Get stored token with integrity check
  getToken() {
    const token = localStorage.getItem(this.tokenKey);
    
    // If token exists, validate it before returning
    if (token && !this.validateTokenFormat(token)) {
      console.warn('Corrupted token detected in storage - clearing it');
      this.clearAuth();
      return null;
    }
    
    return token;
  }

  // Get stored refresh token
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Get stored user data
  getUserData() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Set token with validation and corruption prevention
  setToken(token) {
    // Validate token before storing
    if (!this.validateTokenFormat(token)) {
      console.error('Invalid token format - refusing to store corrupted token');
      return false;
    }
    
    try {
      // Test decode before storing to ensure it's valid
      this.decodeToken(token);
      
      // Create backup before storing
      const currentToken = localStorage.getItem(this.tokenKey);
      if (currentToken) {
        localStorage.setItem(`${this.tokenKey}_backup`, currentToken);
      }
      
      // Store with error handling
      localStorage.setItem(this.tokenKey, token);
      
      console.log('Token stored successfully with backup');
      return true;
    } catch (error) {
      console.error('Failed to store token - token is corrupted:', error);
      return false;
    }
  }

  // Restore from backup if main token is corrupted
  restoreFromBackup() {
    const backupToken = localStorage.getItem(`${this.tokenKey}_backup`);
    if (backupToken && this.validateTokenFormat(backupToken)) {
      console.log('Restoring token from backup');
      localStorage.setItem(this.tokenKey, backupToken);
      return true;
    }
    return false;
  }

  // Validate token format before storing
  validateTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      console.warn('Token validation failed: not a string');
      return false;
    }
    
    if (!token.includes('.')) {
      console.warn('Token validation failed: not a JWT format');
      return false;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Token validation failed: not 3 parts');
      return false;
    }
    
    // Check if each part is valid base64
    for (let i = 0; i < parts.length; i++) {
      try {
        atob(parts[i].replace(/-/g, '+').replace(/_/g, '/'));
      } catch (error) {
        console.warn(`Token validation failed: part ${i} is not valid base64`);
        return false;
      }
    }
    
    return true;
  }

  // Set refresh token
  setRefreshToken(refreshToken) {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  // Set user data
  setUserData(userData) {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  // Set tokens and role (convenience method)
  setTokens(accessToken, role) {
    // Validate token before storing
    if (!this.setToken(accessToken)) {
      console.error('Failed to set token - token validation failed');
      return false;
    }
    
    this.setUserData({ role: role });
    // Also store in 'accessToken' key for userService compatibility
    localStorage.setItem('accessToken', accessToken);
    return true;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Validate token format first
      if (typeof token !== 'string' || !token.includes('.')) {
        console.warn('Invalid token format - not a JWT');
        this.clearAuth(); // Clear corrupted token
        return false;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format - not 3 parts');
        this.clearAuth(); // Clear corrupted token
        return false;
      }
      
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      console.warn('Token appears to be corrupted - clearing authentication');
      this.clearAuth(); // Clear corrupted token
      return false;
    }
  }

  // Get user role
  getUserRole() {
    const userData = this.getUserData();
    return userData ? userData.role : null;
  }

  // Check if user is admin
  isAdmin() {
    return this.getUserRole() === 'admin';
  }

  // Check if user is teacher
  isTeacher() {
    return this.getUserRole() === 'teacher';
  }

  // Check if user is student
  isStudent() {
    return this.getUserRole() === 'student';
  }

  // Clear all stored data with corruption prevention
  clearAuth() {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
      localStorage.removeItem(this.userKey);
      localStorage.removeItem(`${this.tokenKey}_backup`);
    } catch (error) {
      console.error('Failed to clear localStorage - possible corruption:', error);
      // Try to clear all possible keys
      this.forceClearAllAuthData();
    }
  }

  // Force clear all authentication data (fallback for localStorage corruption)
  forceClearAllAuthData() {
    const keysToRemove = [
      'auth_token',
      'accessToken', 
      'userRole',
      'userData',
      'refresh_token',
      'auth_token_backup'
    ];
    
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    });
  }

  // Logout user
  logout() {
    this.clearAuth();
    // Redirect to login page
    window.location.href = '/login';
  }

  // Get authorization header for API requests
  getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  // Make authenticated API request
  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // If token is expired, try to refresh
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        headers.Authorization = `Bearer ${this.getToken()}`;
        return fetch(url, {
          ...options,
          headers
        });
      } else {
        // Refresh failed, logout user
        this.logout();
        throw new Error('Authentication failed');
      }
    }

    return response;
  }

  // Refresh token
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch('/.netlify/functions/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.token);
        if (data.refreshToken) {
          this.setRefreshToken(data.refreshToken);
        }
        return true;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }

    return false;
  }

  // Get access token (alias for getToken)
  getAccessToken() {
    return this.getToken();
  }

  // Decode JWT token
  decodeToken(token) {
    try {
      // Validate token format first
      if (typeof token !== 'string' || !token.includes('.')) {
        console.warn('Invalid token format - not a JWT');
        this.clearAuth(); // Clear corrupted token
        return null;
      }
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format - not 3 parts');
        this.clearAuth(); // Clear corrupted token
        return null;
      }
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      console.warn('Token appears to be corrupted - clearing authentication');
      this.clearAuth(); // Clear corrupted token
      return null;
    }
  }

  // Initialize authentication check
  init() {
    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      // Redirect to login if not authenticated
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return false;
    }

    // Set up automatic token refresh
    this.setupTokenRefresh();
    return true;
  }

  // Set up automatic token refresh
  setupTokenRefresh() {
    // Refresh token every 50 minutes (tokens expire in 1 hour)
    setInterval(async () => {
      if (this.isAuthenticated()) {
        await this.refreshToken();
      }
    }, 50 * 60 * 1000);
  }
}

// Create global instance
const tokenManager = new TokenManager();

// Make available globally
window.tokenManager = tokenManager;

// Initialize on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      tokenManager.init();
    });
  } else {
    // DOM is already loaded (React environment)
    tokenManager.init();
  }
}

// Export for module usage
export default tokenManager;
