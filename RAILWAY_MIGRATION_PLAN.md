# Railway Migration Plan

## Overview
Migrate from **Netlify + Neon** to **Railway** for better compute limits and built-in cron functionality.

## Current Setup
- **Frontend**: React app hosted on Netlify
- **Backend**: Netlify Functions (serverless)
- **Database**: Neon PostgreSQL
- **Cron**: External service needed
- **Compute**: 100 hours/month (Netlify free tier)

## Target Setup
- **Frontend**: React app hosted on Railway
- **Backend**: Railway Functions (serverless)
- **Database**: Railway PostgreSQL
- **Cron**: Built-in Railway cron jobs
- **Compute**: 500 hours/month (Railway free tier)

## Benefits
- ✅ **5x more compute** (500 vs 100 hours)
- ✅ **No execution time limits** (vs 10s on Netlify)
- ✅ **Built-in cron** (no external services)
- ✅ **Simpler architecture** (everything in one place)
- ✅ **$0/month** total cost
- ✅ **Better performance**

## Migration Steps

### Phase 1: Database Migration
1. **Export Neon Database**
   ```bash
   # Export schema and data from Neon
   pg_dump $NEON_DATABASE_URL > neon_backup.sql
   ```

2. **Create Railway PostgreSQL Database**
   - Sign up for Railway account
   - Create new PostgreSQL database
   - Get connection string

3. **Import Data to Railway**
   ```bash
   # Import to Railway database
   psql $RAILWAY_DATABASE_URL < neon_backup.sql
   ```

### Phase 2: Backend Migration
1. **Convert Netlify Functions to Railway Functions**
   - Move `functions/` directory to `api/` directory
   - Update function structure for Railway
   - Update database connection strings

2. **Update Function Structure**
   ```javascript
   // Old Netlify function structure
   exports.handler = async (event, context) => { ... }
   
   // New Railway function structure
   export default async function handler(req, res) { ... }
   ```

3. **Update Database Connections**
   - Replace `@neondatabase/serverless` with `pg` or `@railway/database`
   - Update connection strings to use Railway database

### Phase 3: Frontend Migration
1. **Deploy React App to Railway**
   - Connect GitHub repository to Railway
   - Configure build settings
   - Update API endpoints to use Railway URLs

2. **Update API Endpoints**
   ```javascript
   // Old Netlify endpoints
   const API_BASE = '/.netlify/functions'
   
   // New Railway endpoints
   const API_BASE = 'https://your-app.railway.app/api'
   ```

### Phase 4: Cron Jobs Setup
1. **Create Cleanup Function**
   ```javascript
   // api/cleanup-expired-assignments.js
   export default async function handler(req, res) {
     // Deactivate expired assignments
     const result = await sql`
       UPDATE test_assignments 
       SET is_active = false, updated_at = NOW()
       WHERE is_active = true 
       AND due_date IS NOT NULL 
       AND due_date <= NOW()
     `;
     
     res.json({ success: true, deactivated: result.length });
   }
   ```

2. **Configure Railway Cron**
   - Set up cron job to run every 2 days at 23:58
   - Configure Railway cron settings

### Phase 5: Testing & Validation
1. **Test All Functions**
   - Verify all API endpoints work
   - Test database connections
   - Validate cron job execution

2. **Performance Testing**
   - Compare response times
   - Test under load
   - Verify compute usage

3. **Data Integrity**
   - Verify all data migrated correctly
   - Test all CRUD operations
   - Validate relationships

## File Structure Changes

### Before (Netlify)
```
project/
├── functions/           # Netlify Functions
│   ├── get-teacher-active-tests.js
│   ├── submit-multiple-choice-test.js
│   └── ...
├── src/                # React app
└── netlify.toml        # Netlify config
```

### After (Railway)
```
project/
├── api/                # Railway Functions
│   ├── get-teacher-active-tests.js
│   ├── submit-multiple-choice-test.js
│   └── ...
├── src/                # React app
├── railway.json        # Railway config
└── package.json        # Updated dependencies
```

## Configuration Changes

### Environment Variables
```bash
# Old (Neon)
NEON_DATABASE_URL=postgresql://...

# New (Railway)
DATABASE_URL=postgresql://...
```

### Package.json Updates
```json
{
  "dependencies": {
    "pg": "^8.11.3",
    "@railway/database": "^1.0.0"
  },
  "scripts": {
    "dev": "railway dev",
    "deploy": "railway up"
  }
}
```

## Rollback Plan
1. **Keep Neon database** until migration is fully tested
2. **Maintain Netlify deployment** as backup
3. **Gradual traffic migration** (canary deployment)
4. **Quick rollback** if issues arise

## Timeline
- **Week 1**: Database migration and testing
- **Week 2**: Backend function migration
- **Week 3**: Frontend deployment and testing
- **Week 4**: Cron setup and full validation

## Risk Mitigation
- **Data backup** before migration
- **Staged rollout** with feature flags
- **Monitoring** during migration
- **Quick rollback** procedures

## Success Criteria
- ✅ All functions working on Railway
- ✅ Database performance maintained
- ✅ Cron jobs executing correctly
- ✅ No data loss
- ✅ Improved compute limits
- ✅ $0/month cost maintained

## Notes
- Railway provides better compute limits for production usage
- Built-in cron eliminates external service dependency
- Simpler architecture with everything in one platform
- Easy scaling as usage grows
