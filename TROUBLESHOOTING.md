# Troubleshooting Guide

## 401 Unauthorized Errors

### If you're getting 401 errors after login:

1. **Clear browser storage**:
   ```javascript
   // Open browser console (F12) and run:
   localStorage.clear()
   location.reload()
   ```

2. **Check token is stored**:
   ```javascript
   localStorage.getItem('token')
   // Should return a long string starting with "eyJ..."
   ```

3. **Verify login response**:
   - Open browser DevTools → Network tab
   - Login again
   - Check `/api/v1/auth/login` response
   - Should have `access_token` field

4. **Check API requests**:
   - In Network tab, check if `Authorization: Bearer ...` header is present
   - If missing, token isn't being sent

### Common Causes

1. **Token not stored**: Login might be failing silently
2. **Token expired**: JWT tokens expire after 480 minutes (8 hours)
3. **CORS issues**: Check browser console for CORS errors
4. **Backend not running**: Verify backend is on port 8000

## Pages Not Loading

### Check These:

1. **Backend running?**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Frontend running?**
   ```bash
   curl http://localhost:5173
   ```

3. **Check browser console** for JavaScript errors

4. **Check Network tab** for failed API calls

## Navigation Issues

### If clicking doesn't navigate:

1. Check browser console for errors
2. Verify route exists in `App.jsx`
3. Check if ProtectedRoute is blocking access
4. Verify user role matches `allowedRoles`

## Quick Fixes

### Reset Everything:
```javascript
// In browser console:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Test Authentication:
```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token'))

// Test API call
fetch('http://localhost:8000/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log)
```

## Still Having Issues?

1. Check `FRONTEND_FIXES.md` for applied fixes
2. Check `ALL_FIXES_SUMMARY.md` for complete list
3. Verify backend logs for errors
4. Check browser console for detailed error messages
