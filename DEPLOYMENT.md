# WB-Tracks Deployment Guide

This guide covers deployment options for WB-Tracks, from local development to production cloud deployment.

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Initialize database
npm run db:push

# Start development server
npm run dev
```

Access the application at http://localhost:5000

## Production Deployment

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Session security
SESSION_SECRET=your-secure-random-string-here

# Environment
NODE_ENV=production

# Optional: Custom port
PORT=5000
```

### Database Setup

1. **Create PostgreSQL database**
2. **Set DATABASE_URL** in environment
3. **Run migrations**: `npm run db:push`
4. **Create admin user** through the registration interface

### Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Cloud Deployment Options

### Digital Ocean App Platform

1. Connect your repository
2. Set environment variables in the dashboard
3. Configure build command: `npm run build`
4. Configure run command: `npm start`
5. Add PostgreSQL database addon

### AWS/Google Cloud/Azure

1. **Container deployment** using Docker
2. **Database**: Use managed PostgreSQL service
3. **Load balancer**: Configure SSL termination
4. **Environment**: Set production variables
5. **Monitoring**: Set up logging and alerts

### Heroku

```bash
# Install Heroku CLI
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set SESSION_SECRET=your-secret-here
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build image
docker build -t wb-tracks .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=your-database-url \
  -e SESSION_SECRET=your-secret \
  wb-tracks
```

## Security Considerations

### SSL/HTTPS
- **Required for production**
- Use Let's Encrypt for free certificates
- Configure reverse proxy (nginx/Apache)

### Database Security
- Use connection pooling
- Enable SSL for database connections
- Regular backups
- Restrict network access

### Application Security
- Strong SESSION_SECRET (32+ characters)
- Regular dependency updates
- Input validation enabled
- Rate limiting on API endpoints

## Performance Optimization

### Database
- Add indexes for frequently queried columns
- Configure connection pooling
- Monitor slow queries
- Regular VACUUM and ANALYZE

### Application
- Enable gzip compression
- Use CDN for static assets
- Configure caching headers
- Monitor memory usage

### Monitoring
- Application performance monitoring
- Database performance tracking
- Error logging and alerts
- Uptime monitoring

## Backup Strategy

### Database Backups
```bash
# Daily automated backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240101.sql
```

### File Backups
- User uploaded photos
- Configuration files
- Application logs

## Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Session store sharing (Redis)
- Database read replicas
- CDN for static content

### Vertical Scaling
- Monitor CPU and memory usage
- Database performance tuning
- Connection pool optimization
- Caching strategies

## Maintenance

### Regular Tasks
- Security updates
- Database maintenance
- Log rotation
- Performance monitoring

### Health Checks
- Application endpoint monitoring
- Database connection testing
- WebSocket functionality
- Barcode scanning capability

## Troubleshooting

### Common Issues
- Database connection failures
- Session storage problems
- Camera/barcode access issues
- Performance degradation

### Debugging
- Check application logs
- Monitor database performance
- Verify environment variables
- Test network connectivity

## Support and Updates

### Version Updates
1. Test in staging environment
2. Backup production database
3. Deploy during maintenance window
4. Verify all functionality
5. Monitor for issues

### Getting Help
- Check documentation
- Review system logs
- Contact technical support
- Community forums