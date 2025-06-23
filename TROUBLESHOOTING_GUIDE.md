# WB-Tracks Troubleshooting Guide

## Common Issues and Solutions

### Mobile Camera Scanner Issues

#### Android Chrome Camera Not Working
**Symptoms**: Camera scanner shows "Camera Error" or buttons don't respond
**Solutions**:
1. **Check Camera Permissions**:
   - Tap the camera/lock icon in Chrome's address bar
   - Select "Allow" for camera permissions
   - Refresh the page
   
2. **Browser Settings Method**:
   - Chrome → Settings → Site Settings → Camera
   - Find your WB-Tracks site and enable camera access
   
3. **Force Camera Start**:
   - Use the "Force Camera Start" button if regular start fails
   - This bypasses device enumeration issues
   
4. **Fallback Option**:
   - Use "Manual Entry" as a reliable alternative
   - Type or paste barcode numbers directly

#### Camera Shows Wrong Orientation
**Symptoms**: Rear camera appears mirrored or backwards
**Solution**: 
- The system now automatically detects camera type
- Rear cameras show correct orientation for scanning
- Front cameras are mirrored for natural selfie experience
- If issues persist, try switching camera selection

#### Camera Permissions Keep Asking
**Symptoms**: Browser repeatedly asks for camera permissions
**Solutions**:
1. **Clear Browser Data**:
   - Chrome → Settings → Privacy → Clear browsing data
   - Clear "Site settings" and try again
   
2. **Reset Site Permissions**:
   - Chrome → Settings → Site Settings → Camera
   - Remove your site and allow fresh permission request

### Database Connection Issues

#### "Database connection failed" Error
**Symptoms**: Application shows database connection errors
**Solutions**:
1. **Check Environment Variables**:
   ```bash
   echo $DATABASE_URL
   # Should show: postgresql://user:pass@host:port/db
   ```
   
2. **Verify Database Server**:
   - Ensure PostgreSQL is running
   - Check network connectivity to database host
   - Verify credentials are correct
   
3. **Connection Pool Issues**:
   - Restart the application
   - Check for connection leaks in logs
   - Monitor active connections

#### Slow Database Performance
**Symptoms**: Queries take a long time, app feels sluggish
**Solutions**:
1. **Database Optimization**:
   - Use the built-in database optimizer in Admin section
   - Run VACUUM and ANALYZE operations
   - Check for missing indexes
   
2. **Query Analysis**:
   - Review slow query logs
   - Optimize frequently used queries
   - Consider adding database indexes

### Authentication Problems

#### Cannot Login with Valid Credentials
**Symptoms**: Login fails despite correct username/password
**Solutions**:
1. **Session Issues**:
   - Clear browser cookies and local storage
   - Try incognito/private browsing mode
   - Check SESSION_SECRET environment variable
   
2. **User Account Status**:
   - Verify user account is active in database
   - Check user role permissions
   - Reset password if needed

#### Session Keeps Expiring
**Symptoms**: Automatically logged out frequently
**Solutions**:
1. **Session Configuration**:
   - Check SESSION_SECRET is set correctly
   - Verify session store is working (PostgreSQL)
   - Review session timeout settings
   
2. **Browser Issues**:
   - Enable cookies in browser settings
   - Check for browser extensions blocking cookies
   - Try different browser

### File Upload Issues

#### Photo Upload Fails
**Symptoms**: Component photos won't upload or save
**Solutions**:
1. **File Size and Format**:
   - Check file size is under 5MB limit
   - Use supported formats: JPEG, PNG, WebP
   - Compress large images before upload
   
2. **Server Permissions**:
   ```bash
   chmod 755 uploads/
   chmod 755 uploads/components/
   ```
   
3. **Disk Space**:
   - Check available disk space on server
   - Clean up old/unused photos if needed

#### Uploaded Photos Don't Display
**Symptoms**: Photos upload but don't show in interface
**Solutions**:
1. **File Path Issues**:
   - Check uploads directory exists and is accessible
   - Verify file permissions are correct
   - Check URL generation in photo endpoints
   
2. **Browser Cache**:
   - Clear browser cache
   - Try hard refresh (Ctrl+F5)
   - Check browser developer tools for 404 errors

### Performance Issues

#### Slow Loading Pages
**Symptoms**: Application takes long time to load or respond
**Solutions**:
1. **Network Issues**:
   - Check internet connection speed
   - Monitor WebSocket connection status
   - Consider using local deployment for better speed
   
2. **Server Performance**:
   - Monitor CPU and memory usage
   - Check database query performance
   - Review server logs for bottlenecks
   
3. **Browser Performance**:
   - Close unnecessary browser tabs
   - Clear browser cache and data
   - Update browser to latest version

#### Memory Issues
**Symptoms**: Browser becomes slow or crashes
**Solutions**:
1. **Browser Memory**:
   - Close other applications and tabs
   - Restart browser
   - Check for memory leaks in developer tools
   
2. **Application Memory**:
   - Refresh the application
   - Check for JavaScript errors in console
   - Monitor memory usage in developer tools

### Mobile-Specific Issues

#### Mobile Interface Problems
**Symptoms**: Interface doesn't work properly on mobile
**Solutions**:
1. **Responsive Design**:
   - Ensure viewport meta tag is present
   - Check CSS media queries are working
   - Verify touch targets are large enough
   
2. **Mobile Browser**:
   - Use supported mobile browsers (Chrome, Safari, Firefox)
   - Update mobile browser to latest version
   - Clear mobile browser cache

#### Touch Controls Not Working
**Symptoms**: Touch interactions don't respond properly
**Solutions**:
1. **Touch Events**:
   - Check JavaScript touch event handlers
   - Verify no conflicting touch events
   - Test on different mobile devices
   
2. **Browser Compatibility**:
   - Try different mobile browser
   - Check browser console for JavaScript errors
   - Verify browser supports required features

### WebSocket Connection Issues

#### Real-time Updates Not Working
**Symptoms**: Live notifications and updates don't appear
**Solutions**:
1. **WebSocket Connection**:
   - Check browser developer tools → Network → WS tab
   - Look for WebSocket connection errors
   - Verify server WebSocket endpoint is accessible
   
2. **Network Configuration**:
   - Check firewall settings
   - Verify proxy doesn't block WebSocket connections
   - Try different network connection

#### Connection Keeps Dropping
**Symptoms**: WebSocket disconnects frequently
**Solutions**:
1. **Network Stability**:
   - Check network connection stability
   - Monitor for network interruptions
   - Consider connection retry logic
   
2. **Server Configuration**:
   - Check server logs for WebSocket errors
   - Verify server can handle WebSocket connections
   - Monitor server resource usage

### Print/Export Issues

#### Barcode Labels Won't Print
**Symptoms**: Label generation or printing fails
**Solutions**:
1. **Browser Printing**:
   - Check browser print permissions
   - Try different printer or PDF export
   - Verify print stylesheets are loading
   
2. **Label Generation**:
   - Check barcode generation library
   - Verify component data is complete
   - Try generating different barcode formats

#### CSV Export Fails
**Symptoms**: Data export doesn't work or file is empty
**Solutions**:
1. **Data Export**:
   - Check if data query returns results
   - Verify CSV generation logic
   - Try exporting smaller datasets
   
2. **Browser Download**:
   - Check browser download settings
   - Verify download directory permissions
   - Try different browser

### API and Integration Issues

#### API Endpoints Return Errors
**Symptoms**: API calls fail with error responses
**Solutions**:
1. **Authentication**:
   - Verify user is logged in
   - Check API authentication headers
   - Confirm user has required permissions
   
2. **Request Format**:
   - Check request payload format
   - Verify required fields are included
   - Confirm content-type headers

#### External Integration Problems
**Symptoms**: Connections to external systems fail
**Solutions**:
1. **Network Connectivity**:
   - Test external system availability
   - Check firewall rules for outbound connections
   - Verify API keys and credentials
   
2. **API Limits**:
   - Check rate limiting on external APIs
   - Monitor API usage quotas
   - Implement retry logic for failed requests

## Advanced Troubleshooting

### Debug Mode
1. **Enable Console Logging**:
   ```javascript
   localStorage.setItem('debug', 'true');
   ```
   
2. **Browser Developer Tools**:
   - Console tab: JavaScript errors and logs
   - Network tab: Failed requests and slow responses
   - Application tab: Local storage and session data

### Log Analysis
1. **Server Logs**:
   - Check application logs for errors
   - Monitor database query logs
   - Review WebSocket connection logs
   
2. **Browser Console**:
   - JavaScript errors and warnings
   - Network request failures
   - WebSocket connection status

### Health Check Endpoints
- **Application Health**: `GET /api/health`
- **Database Status**: Included in health check response
- **System Information**: Environment and configuration status

## Getting Additional Help

### Documentation Resources
- **README.md**: Basic setup and features
- **TECHNICAL_DOCUMENTATION.md**: Detailed technical information
- **MOBILE_GUIDE.md**: Mobile-specific features and troubleshooting
- **API_REFERENCE.md**: Complete API documentation

### Support Channels
1. **Check Documentation**: Review relevant documentation first
2. **System Logs**: Collect application and browser console logs
3. **Error Details**: Note exact error messages and steps to reproduce
4. **Environment Info**: Gather system, browser, and deployment details

### Information to Collect Before Seeking Help
- Operating system and version
- Browser type and version
- Mobile device type (if applicable)
- Exact error messages
- Steps to reproduce the issue
- Screenshots or screen recordings
- Browser console logs
- Server logs (if accessible)

---

*This troubleshooting guide covers the most common issues with WB-Tracks. For specific technical issues not covered here, refer to the technical documentation or contact your system administrator.*