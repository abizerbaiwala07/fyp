# Backend CORS Configuration Fix

## Issue
Your frontend is now correctly calling the backend, but CORS is blocking the requests.

## Error
```
Access to XMLHttpRequest at 'https://dropout-back.onrender.com/api/students' 
from origin 'https://dropout-front-29gn-offhna73k-shlok2345788s-projects-8lmc8c3yq.vercel.app' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## Backend Fix Required

In your backend code (Python Flask/Django), you need to update CORS configuration:

### For Flask (if using Flask-CORS):
```python
from flask_cors import CORS

# Add your Vercel domains to allowed origins
CORS(app, origins=[
    "http://localhost:3000",  # Local development
    "https://dropout-front-*.vercel.app",  # Vercel deployments
    "https://dropout-front-29gn-offhna73k-shlok2345788s-projects-8lmc8c3yq.vercel.app"  # Current deployment
])
```

### For Django (if using django-cors-headers):
```python
# In settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://dropout-front-29gn-offhna73k-shlok2345788s-projects-8lmc8c3yq.vercel.app",
]

# Or use wildcard for all Vercel deployments (less secure but easier):
CORS_ALLOW_ALL_ORIGINS = True  # Only for development
```

### Alternative Quick Fix (Backend):
Add these headers to all API responses:
```python
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://dropout-front-29gn-offhna73k-shlok2345788s-projects-8lmc8c3yq.vercel.app')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
```

## Timeout Issue
The 10-second timeout suggests your Render backend might be sleeping (cold start).

### Render Cold Start Fix:
1. Visit https://dropout-back.onrender.com directly to wake it up
2. Consider upgrading to paid Render plan to avoid cold starts
3. Or implement a ping service to keep it awake

## Current Status:
- ✅ Frontend correctly calls backend URL
- ❌ CORS blocking requests  
- ❌ Backend sleeping (cold start)

## Next Steps:
1. Update backend CORS configuration
2. Redeploy backend
3. Test API calls again