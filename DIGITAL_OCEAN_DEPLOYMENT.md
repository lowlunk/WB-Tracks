# WB-Tracks Digital Ocean Deployment Guide

## Prerequisites
- Digital Ocean account
- Git repository (GitHub, GitLab, or Bitbucket)
- Basic command line knowledge

## Option 1: Digital Ocean App Platform (Recommended)

### Step 1: Prepare Your Repository
1. Push your WB-Tracks code to a Git repository
2. Ensure the following files are in your repository:
   - `app.yaml` (already created)
   - `package.json` with correct build scripts
   - All source code files

### Step 2: Create App on Digital Ocean
1. Log into Digital Ocean
2. Go to "Apps" in the left sidebar
3. Click "Create App"
4. Connect your Git repository
5. Select the repository containing WB-Tracks
6. Choose the main/master branch

### Step 3: Configure Environment Variables
In the Digital Ocean App Platform console, add these environment variables:

**Required:**
- `NODE_ENV` = `production`
- `SESSION_SECRET` = `your-secure-random-string-here`
- `DATABASE_URL` = `${db.DATABASE_URL}` (auto-generated)

### Step 4: Database Setup
Digital Ocean will automatically create a PostgreSQL database based on the `app.yaml` configuration.

### Step 5: Deploy
1. Review the configuration
2. Click "Create Resources"
3. Wait for deployment (5-10 minutes)
4. Your app will be available at a `.ondigitalocean.app` domain

### Cost Estimate
- Basic App: $5-12/month
- PostgreSQL Database: $15/month
- **Total: ~$20-27/month**

---

## Option 2: Digital Ocean Droplet (Manual Setup)

### Step 1: Create Droplet
1. Create a new Droplet (Ubuntu 22.04 LTS)
2. Choose size: Basic $6-12/month plan
3. Add your SSH key
4. Create the droplet

### Step 2: Initial Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
```

### Step 3: Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE wb_tracks;
CREATE USER wb_user WITH ENCRYPTED PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE wb_tracks TO wb_user;
\q
```

### Step 4: Deploy Application
```bash
# Clone your repository
git clone https://github.com/yourusername/wb-tracks.git
cd wb-tracks

# Install dependencies
npm install

# Build the application
npm run build

# Set environment variables
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://wb_user:secure_password_here@localhost:5432/wb_tracks
SESSION_SECRET=your-secure-random-string-here
EOF

# Push database schema
npm run db:push

# Start with PM2
pm2 start npm --name "wb-tracks" -- start
pm2 save
pm2 startup
```

### Step 5: Setup Nginx (Optional)
```bash
sudo apt install nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/wb-tracks

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/wb-tracks /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Cost Estimate
- Droplet: $6-12/month
- **Total: $6-12/month**

---

## Option 3: Docker Container on Digital Ocean

### Step 1: Create Dockerfile
The `Dockerfile` has already been created in your project.

### Step 2: Build and Deploy
```bash
# Build the image
docker build -t wb-tracks .

# Run the container
docker run -d \
  --name wb-tracks \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-database-url" \
  -e SESSION_SECRET="your-session-secret" \
  wb-tracks
```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret for session encryption | `random-secure-string-32-chars` |

## Security Considerations

1. **Use strong passwords** for database users
2. **Generate secure session secrets** (32+ random characters)
3. **Enable firewall** on your droplet if using manual setup
4. **Keep system updated** regularly
5. **Use SSL certificates** (Let's Encrypt is free)

## Default Admin Account

Once deployed, log in with:
- **Username:** admin
- **Password:** admin123

**Important:** Change the admin password immediately after first login.

## Troubleshooting

### Common Issues:
1. **Database connection errors:** Verify DATABASE_URL format
2. **Port conflicts:** Ensure port 5000 is available
3. **Permission errors:** Check file permissions and user access
4. **Build failures:** Verify all dependencies are installed

### Logs:
- App Platform: Check logs in Digital Ocean dashboard
- Droplet: `pm2 logs wb-tracks` or `journalctl -u wb-tracks`

## Scaling and Monitoring

### App Platform:
- Auto-scaling available
- Built-in monitoring and alerts
- Automatic backups

### Droplet:
- Manual scaling by resizing droplet
- Setup monitoring with PM2 or external tools
- Configure regular database backups

## Support

For deployment issues:
1. Check Digital Ocean documentation
2. Review application logs
3. Verify environment variables
4. Test database connectivity