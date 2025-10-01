# Security Remediation Plan
## Mathayomwatsing Testing System

**Date**: December 2024  
**Priority**: CRITICAL  
**Status**: PENDING IMPLEMENTATION

---

## 🚨 CRITICAL ISSUES TO ADDRESS

### 1. **Remove Hardcoded API Credentials** (CRITICAL)
**Current Issue**: Cloudinary credentials exposed in source code
**Files Affected**: 
- `mws/app/src/main/java/com/mws/config/ProductionConfig.kt`

**Action Plan**:
1. **Immediate**: Remove hardcoded credentials from source code
2. **Environment Variables**: Move to secure environment variable storage
3. **Netlify Configuration**: Set up environment variables in Netlify dashboard
4. **Code Update**: Modify configuration to read from environment variables

**Implementation Steps**:
```kotlin
// Replace hardcoded values with:
val CLOUDINARY_API_KEY: String = System.getenv("CLOUDINARY_API_KEY") ?: ""
val CLOUDINARY_API_SECRET: String = System.getenv("CLOUDINARY_API_SECRET") ?: ""
```

**Verification**: Ensure no credentials are visible in source code or build artifacts

---

### 2. **Update Vulnerable Dependencies** (HIGH)
**Current Issues**:
- xlsx package: High severity (Prototype Pollution, ReDoS)
- esbuild: Moderate severity (development server vulnerability)
- vite: Depends on vulnerable esbuild

**Action Plan**:
1. **Update Dependencies**: Run `npm audit fix --force`
2. **Review xlsx Package**: Consider alternative libraries
3. **Test Application**: Ensure functionality remains intact
4. **Monitor**: Set up automated dependency scanning

**Implementation Steps**:
```bash
# Step 1: Update all dependencies
npm audit fix --force

# Step 2: Check for remaining vulnerabilities
npm audit

# Step 3: If xlsx still vulnerable, consider alternatives:
# - xlsx-populate (more secure alternative)
# - exceljs (another secure alternative)
```

**Verification**: Run `npm audit` to confirm all vulnerabilities are resolved

---

### 3. **Implement Security Headers** (MEDIUM)
**Current Issue**: Missing security headers in Netlify configuration

**Action Plan**:
1. **Update netlify.toml**: Add comprehensive security headers
2. **Test Headers**: Verify headers are applied correctly
3. **Monitor**: Use security header testing tools

**Implementation Steps**:
Add to `netlify.toml`:
```toml
# Security Headers Configuration
[[headers]]
  for = "/*"
  [headers.values]
    # Prevent clickjacking
    X-Frame-Options = "DENY"
    
    # Prevent MIME type sniffing
    X-Content-Type-Options = "nosniff"
    
    # Enable XSS protection
    X-XSS-Protection = "1; mode=block"
    
    # Force HTTPS
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    
    # Content Security Policy
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:;"
    
    # Referrer Policy
    Referrer-Policy = "strict-origin-when-cross-origin"
    
    # Permissions Policy
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"

# API-specific headers
[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

**Verification**: Use tools like securityheaders.com to test header implementation

---

### 4. **Secure CORS Configuration** (MEDIUM)
**Current Issue**: CORS configuration may be too permissive

**Action Plan**:
1. **Review CORS Settings**: Audit current CORS configuration
2. **Restrict Origins**: Limit to specific domains only
3. **Environment Variables**: Use environment-specific CORS settings
4. **Test Cross-Origin**: Verify CORS works correctly

**Implementation Steps**:
```javascript
// Update CORS configuration in all function files
const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://mathayomwatsing.netlify.app',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
};
```

**Environment Variables to Set**:
- `ALLOWED_ORIGIN`: `https://mathayomwatsing.netlify.app`
- `ALLOWED_ORIGINS`: `https://mathayomwatsing.netlify.app,https://localhost:5174` (for development)

---

### 5. **Input Validation Enhancement** (MEDIUM)
**Current Issue**: Limited input validation in API endpoints

**Action Plan**:
1. **Add Input Sanitization**: Implement proper input validation
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **Request Size Limits**: Implement request size limits
4. **Error Handling**: Improve error handling to prevent information leakage

**Implementation Steps**:
```javascript
// Add input validation middleware
const validateInput = (data, schema) => {
  // Implement validation logic
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input data');
  }
  // Add specific field validation
};

// Add rate limiting
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 20;

const checkRateLimit = (ip) => {
  const now = Date.now();
  const userRequests = rateLimit.get(ip) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    throw new Error('Rate limit exceeded');
  }
  
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
};
```

---

## 📋 IMPLEMENTATION TIMELINE

### Phase 1: Critical Issues (Week 1)
- [ ] Remove hardcoded credentials
- [ ] Update vulnerable dependencies
- [ ] Set up environment variables in Netlify

### Phase 2: Security Headers (Week 2)
- [ ] Implement security headers in netlify.toml
- [ ] Test header implementation
- [ ] Verify CSP doesn't break functionality

### Phase 3: CORS & Validation (Week 3)
- [ ] Secure CORS configuration
- [ ] Add input validation
- [ ] Implement rate limiting

### Phase 4: Testing & Monitoring (Week 4)
- [ ] Security testing
- [ ] Performance testing
- [ ] Set up monitoring

---

## 🔧 TECHNICAL IMPLEMENTATION

### Environment Variables Setup
**Netlify Dashboard Configuration**:
1. Go to Site Settings → Environment Variables
2. Add the following variables:
   - `CLOUDINARY_API_KEY`: [Your Cloudinary API Key]
   - `CLOUDINARY_API_SECRET`: [Your Cloudinary API Secret]
   - `ALLOWED_ORIGIN`: `https://mathayomwatsing.netlify.app`
   - `JWT_SECRET`: [Strong JWT secret]
   - `JWT_REFRESH_SECRET`: [Strong refresh token secret]

### Code Changes Required
1. **ProductionConfig.kt**: Remove hardcoded credentials
2. **netlify.toml**: Add security headers
3. **All function files**: Update CORS configuration
4. **package.json**: Update dependencies

---

## 🧪 TESTING CHECKLIST

### Security Testing
- [ ] Verify no credentials in source code
- [ ] Test security headers with online tools
- [ ] Verify CORS configuration
- [ ] Test rate limiting
- [ ] Check for information leakage in error messages

### Functionality Testing
- [ ] Login functionality
- [ ] File upload functionality
- [ ] API endpoints
- [ ] Cross-origin requests
- [ ] Mobile app integration

---

## 📊 SUCCESS METRICS

### Security Metrics
- [ ] Zero hardcoded credentials in codebase
- [ ] All dependencies vulnerability-free
- [ ] Security headers score: A+ (securityheaders.com)
- [ ] CORS properly configured
- [ ] Rate limiting functional

### Performance Metrics
- [ ] No performance degradation
- [ ] API response times maintained
- [ ] Mobile app functionality intact

---

## 🚨 ROLLBACK PLAN

If any changes cause issues:
1. **Immediate**: Revert netlify.toml changes
2. **Environment**: Restore previous environment variables
3. **Dependencies**: Revert to previous package-lock.json
4. **Code**: Revert credential changes if needed

---

## 📞 SUPPORT & RESOURCES

### Documentation
- [Netlify Security Headers](https://docs.netlify.com/configure-builds/file-based-configuration/#headers)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

### Tools for Testing
- [Security Headers Test](https://securityheaders.com)
- [Mozilla Observatory](https://observatory.mozilla.org)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)

---

**Next Steps**: Begin with Phase 1 implementation, focusing on removing hardcoded credentials and updating dependencies.

**Estimated Completion**: 4 weeks
**Risk Level**: Medium (due to dependency updates)
**Testing Required**: Yes (comprehensive security and functionality testing)
