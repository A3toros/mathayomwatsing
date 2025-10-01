# Environment Variables Setup Guide
## Mathayomwatsing Testing System

This guide explains how to set up the required environment variables for the secure deployment of your application.

---

## 🔧 **NETLIFY DASHBOARD SETUP**

### Step 1: Access Netlify Dashboard
1. Go to [netlify.com](https://netlify.com) and log in
2. Navigate to your site: `mathayomwatsing.netlify.app`
3. Go to **Site Settings** → **Environment Variables**

### Step 2: Add Required Environment Variables

Add the following environment variables in the Netlify dashboard:

#### **Critical Security Variables**
```
CLOUDINARY_API_KEY=252927275769619
CLOUDINARY_API_SECRET=0QungPQ1DalxpwHvJE1COjICbww
CLOUDINARY_CLOUD_NAME=dnovxoaqi
```

#### **CORS Configuration**
```
ALLOWED_ORIGIN=https://mathayomwatsing.netlify.app
```

#### **JWT Security**
```
JWT_SECRET=your-super-secure-jwt-secret-here-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here-minimum-32-characters
```

#### **Database Configuration**
```
NEON_DATABASE_URL=your-neon-database-connection-string
```

---

## 🔐 **SECURITY RECOMMENDATIONS**

### JWT Secrets
- **Minimum Length**: 32 characters
- **Character Set**: Mix of letters, numbers, and symbols
- **Example**: `MyS3cur3JWT!S3cr3tK3y2024#Netlify$`

### Cloudinary Credentials
- These are the credentials that were previously hardcoded
- **IMPORTANT**: Never commit these to version control
- Consider rotating these credentials for enhanced security

---

## 🚀 **DEPLOYMENT STEPS**

### Step 1: Set Environment Variables
1. Follow the Netlify dashboard setup above
2. Ensure all variables are marked as "Sensitive" if available
3. Save the configuration

### Step 2: Redeploy Application
1. Go to **Deploys** tab in Netlify
2. Click **Trigger deploy** → **Deploy site**
3. Monitor the deployment logs for any errors

### Step 3: Verify Security
1. Test the application functionality
2. Check that Cloudinary uploads work
3. Verify login functionality
4. Test CORS with your mobile app

---

## 🧪 **TESTING CHECKLIST**

### Environment Variables Test
- [ ] Cloudinary credentials are accessible to functions
- [ ] JWT secrets are properly set
- [ ] CORS origin is correctly configured
- [ ] Database connection works

### Security Test
- [ ] No hardcoded credentials in source code
- [ ] Environment variables are not exposed in client-side code
- [ ] CORS is working correctly
- [ ] Rate limiting is functional

### Functionality Test
- [ ] Student login works
- [ ] Teacher login works
- [ ] File uploads work
- [ ] API endpoints respond correctly
- [ ] Mobile app integration works

---

## 🚨 **TROUBLESHOOTING**

### Common Issues

#### **"Environment variable not found"**
- **Solution**: Check that the variable name matches exactly
- **Check**: Case sensitivity matters
- **Verify**: Variable is saved in Netlify dashboard

#### **"CORS error"**
- **Solution**: Verify `ALLOWED_ORIGIN` is set correctly
- **Check**: No trailing slashes in the URL
- **Test**: Try with different origins

#### **"Cloudinary upload fails"**
- **Solution**: Verify Cloudinary credentials are correct
- **Check**: API key and secret are properly set
- **Test**: Try uploading a simple image

#### **"JWT token invalid"**
- **Solution**: Check JWT secrets are set correctly
- **Verify**: Secrets are the same across all functions
- **Test**: Try logging in again

---

## 📋 **ENVIRONMENT VARIABLES REFERENCE**

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes | `252927275769619` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes | `0QungPQ1DalxpwHvJE1COjICbww` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes | `dnovxoaqi` |
| `ALLOWED_ORIGIN` | CORS allowed origin | Yes | `https://mathayomwatsing.netlify.app` |
| `JWT_SECRET` | JWT signing secret | Yes | `MyS3cur3JWT!S3cr3tK3y2024#Netlify$` |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Yes | `MyR3fr3shJWT!S3cr3tK3y2024#Netlify$` |
| `NEON_DATABASE_URL` | Database connection | Yes | `postgresql://...` |

---

## 🔄 **NEXT STEPS**

1. **Set up environment variables** in Netlify dashboard
2. **Deploy the application** with new security measures
3. **Test all functionality** to ensure everything works
4. **Monitor for any issues** in the first few days
5. **Consider rotating secrets** for enhanced security

---

## 📞 **SUPPORT**

If you encounter any issues:
1. Check the Netlify function logs
2. Verify environment variables are set correctly
3. Test individual components (login, upload, etc.)
4. Review the security remediation plan for additional guidance

**Remember**: Never commit environment variables to version control!
