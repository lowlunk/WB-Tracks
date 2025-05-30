
# WB-Tracks Raspberry Pi 5 Installation Runbook

## Overview
This runbook provides step-by-step instructions for installing WB-Tracks inventory management system on a Raspberry Pi 5 and accessing it from Android phones and tablets with full functionality including barcode scanning and printing.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Hardware Setup](#hardware-setup)
3. [System Preparation](#system-preparation)
4. [Software Installation](#software-installation)
5. [Database Setup](#database-setup)
6. [Application Installation](#application-installation)
7. [Network Configuration](#network-configuration)
8. [Android Device Setup](#android-device-setup)
9. [Testing & Verification](#testing--verification)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance](#maintenance)

## Prerequisites

### Hardware Requirements
- **Raspberry Pi 5** (4GB or 8GB RAM recommended)
- **MicroSD Card** (32GB or larger, Class 10 or better)
- **Power Supply** (Official Raspberry Pi 5 power adapter)
- **Ethernet Cable** or Wi-Fi connection
- **HDMI Cable and Monitor** (for initial setup)
- **USB Keyboard and Mouse** (for initial setup)
- **Label Printer** (optional, for barcode label printing)

### Network Requirements
- **Wi-Fi Network** accessible by both Raspberry Pi and Android devices
- **Static IP Address** (recommended for consistent access)
- **Port 5000** available for web application

### Android Device Requirements
- **Android 7.0+** with modern web browser (Chrome recommended)
- **Camera** for barcode scanning functionality
- **Wi-Fi** connection to same network as Raspberry Pi

## Hardware Setup

### 1. Raspberry Pi 5 Setup
1. **Install Raspberry Pi OS**:
   ```bash
   # Use Raspberry Pi Imager to flash Raspberry Pi OS (64-bit) to SD card
   # Enable SSH and configure Wi-Fi during imaging process
   ```

2. **Initial Boot**:
   - Insert SD card into Raspberry Pi 5
   - Connect HDMI, keyboard, mouse, and power
   - Complete initial setup wizard
   - Enable SSH: `sudo systemctl enable ssh`

3. **Update System**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo reboot
   ```

## System Preparation

### 1. Install Required System Packages
```bash
# Update package lists
sudo apt update

# Install essential packages
sudo apt install -y curl wget git build-essential

# Install network tools
sudo apt install -y net-tools

# Find your Pi's IP address
ip addr show wlan0
# Note the IP address (e.g., 192.168.1.100)
```

### 2. Configure Static IP (Recommended)
```bash
# Edit dhcpcd configuration
sudo nano /etc/dhcpcd.conf

# Add these lines at the end (replace with your network details):
interface wlan0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

Reboot to apply changes:
```bash
sudo reboot
```

## Software Installation

### 1. Install Node.js 18
```bash
# Download and install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### 2. Install PostgreSQL
```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo systemctl status postgresql
```

## Database Setup

### 1. Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user (run these commands in PostgreSQL prompt)
CREATE DATABASE wb_tracks;
CREATE USER wb_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE wb_tracks TO wb_user;
ALTER USER wb_user CREATEDB;
\q
```

### 2. Test Database Connection
```bash
# Test connection
psql -h localhost -U wb_user -d wb_tracks
# Enter password when prompted
# Type \q to exit
```

## Application Installation

### 1. Clone Repository
```bash
# Navigate to home directory
cd ~

# Clone the WB-Tracks repository
git clone https://github.com/your-username/wb-tracks.git
cd wb-tracks
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# This may take 5-10 minutes on Raspberry Pi
```

### 3. Configure Environment
```bash
# Create environment file
cp .env.example .env

# Edit environment file
nano .env
```

Add the following configuration:
```env
# Database Configuration
DATABASE_URL=postgresql://wb_user:your_secure_password_here@localhost:5432/wb_tracks

# Session Security
SESSION_SECRET=your-secure-random-string-32-characters-long

# Environment
NODE_ENV=production

# Server Configuration
PORT=5000
HOST=0.0.0.0
```

### 4. Initialize Database
```bash
# Push database schema
npm run db:push

# Verify database setup
npm run db:studio
# This opens Drizzle Studio - press Ctrl+C to close
```

### 5. Build Application
```bash
# Build for production
npm run build
```

## Network Configuration

### 1. Configure Server Binding
Verify that your server is configured to bind to `0.0.0.0`:

```bash
# Check server/index.ts contains:
grep -n "0.0.0.0" server/index.ts
```

The file should contain:
```typescript
server.listen({
  port: 5000,
  host: "0.0.0.0",
  reusePort: true,
}, () => {
  log(`serving on port 5000`);
});
```

### 2. Configure Firewall (if enabled)
```bash
# Check if ufw is active
sudo ufw status

# If active, allow port 5000
sudo ufw allow 5000
```

### 3. Start Application
```bash
# Install PM2 for process management
sudo npm install -g pm2

# Start application with PM2
pm2 start npm --name "wb-tracks" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command
```

### 4. Verify Application is Running
```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs wb-tracks

# Test local access
curl http://localhost:5000
```

## Android Device Setup

### 1. Network Connection
1. **Connect to Wi-Fi**: Ensure Android device is on same network as Raspberry Pi
2. **Note IP Address**: Use the Raspberry Pi's IP (e.g., 192.168.1.100)

### 2. Browser Configuration
1. **Open Chrome Browser** on Android device
2. **Navigate to**: `http://192.168.1.100:5000`
3. **Bookmark the URL** for easy access

### 3. Camera Permissions
1. **Allow Camera Access**: When prompted for barcode scanning
2. **Test Camera**: Use the barcode scanner feature in WB-Tracks

### 4. Print Setup (Optional)
1. **Wi-Fi Printer**: Connect label printer to same network
2. **Android Print Services**: Enable in Android Settings
3. **Test Printing**: Generate a barcode label in WB-Tracks

## Testing & Verification

### 1. Basic Functionality Test
1. **Access Application**: `http://192.168.1.100:5000`
2. **Login**: Use admin/admin123 (change password immediately)
3. **Add Component**: Test adding a new inventory item
4. **Transfer Items**: Test moving items between locations

### 2. Mobile Functionality Test
1. **Responsive Design**: Verify interface adapts to mobile screen
2. **Touch Navigation**: Test all buttons and menus
3. **Barcode Scanning**: Test camera-based scanning
4. **Data Entry**: Test adding/editing components on mobile

### 3. Network Connectivity Test
```bash
# On Raspberry Pi - check network connectivity
ping google.com

# Test application accessibility from network
# On another device:
curl http://192.168.1.100:5000
```

### 4. Performance Test
```bash
# Monitor system resources
htop

# Check application memory usage
pm2 monit

# Test database performance
psql -U wb_user -d wb_tracks -c "SELECT COUNT(*) FROM components;"
```

## Troubleshooting

### Common Issues

#### 1. Cannot Access from Android Device
**Problem**: Application not accessible from mobile devices
**Solutions**:
```bash
# Check if application is running
pm2 status

# Verify port binding
netstat -tulpn | grep :5000

# Check firewall
sudo ufw status

# Restart application
pm2 restart wb-tracks
```

#### 2. Database Connection Errors
**Problem**: Database connection failures
**Solutions**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify database credentials
psql -h localhost -U wb_user -d wb_tracks

# Check environment variables
cat .env
```

#### 3. Barcode Scanner Not Working
**Problem**: Camera not accessible on Android
**Solutions**:
- Ensure HTTPS or localhost access
- Check camera permissions in browser
- Try different Android browser
- Verify camera hardware functionality

#### 4. Slow Performance
**Problem**: Application running slowly
**Solutions**:
```bash
# Check system resources
free -h
df -h

# Optimize PostgreSQL
sudo -u postgres psql -c "VACUUM ANALYZE;"

# Restart application
pm2 restart wb-tracks
```

### Diagnostic Commands
```bash
# Check system status
systemctl status postgresql
pm2 status
pm2 logs wb-tracks

# Network diagnostics
netstat -tulpn | grep :5000
ss -tulpn | grep :5000

# System resource monitoring
htop
iostat
```

### Log Files
```bash
# Application logs
pm2 logs wb-tracks

# System logs
sudo journalctl -u postgresql
sudo journalctl -f

# Network logs
dmesg | grep -i network
```

## Maintenance

### Daily Tasks
```bash
# Check application status
pm2 status

# View recent logs
pm2 logs wb-tracks --lines 50
```

### Weekly Tasks
```bash
# System updates
sudo apt update && sudo apt upgrade

# Database maintenance
sudo -u postgres psql -d wb_tracks -c "VACUUM ANALYZE;"

# Check disk space
df -h

# Restart application (if needed)
pm2 restart wb-tracks
```

### Monthly Tasks
```bash
# Database backup
pg_dump -U wb_user -h localhost wb_tracks > backup_$(date +%Y%m%d).sql

# Update Node.js dependencies
npm audit
npm update

# Clean up old logs
pm2 flush
```

### Backup Procedure
```bash
# Create backup script
cat > backup_wb_tracks.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/pi/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U wb_user -h localhost wb_tracks > $BACKUP_DIR/wb_tracks_db_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/wb_tracks_app_$DATE.tar.gz ~/wb-tracks

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make script executable
chmod +x backup_wb_tracks.sh

# Add to crontab for daily backups
crontab -e
# Add line: 0 2 * * * /home/pi/backup_wb_tracks.sh
```

## Security Considerations

### 1. Change Default Credentials
```bash
# First login - change admin password immediately
# Navigate to Settings > Profile in WB-Tracks interface
```

### 2. Network Security
- Use WPA3 Wi-Fi security
- Consider VPN for remote access
- Regular security updates

### 3. Application Security
```bash
# Update session secret
nano .env
# Change SESSION_SECRET to a new random string

# Restart application
pm2 restart wb-tracks
```

## Performance Optimization

### 1. Database Optimization
```bash
# Optimize PostgreSQL for Raspberry Pi
sudo nano /etc/postgresql/*/main/postgresql.conf

# Add these optimizations:
shared_buffers = 64MB
effective_cache_size = 512MB
maintenance_work_mem = 32MB
```

### 2. System Optimization
```bash
# Increase swap size if needed
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=1024
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

## Accessing the Dashboard

After successful installation, access your WB-Tracks dashboard at:

**URL**: `http://[YOUR_PI_IP_ADDRESS]:5000/dashboard`

Example: `http://192.168.1.100:5000/dashboard`

**Default Login**:
- Username: `admin`
- Password: `admin123`

**Important**: Change the default password immediately after first login.

## Support Information

### Getting Help
1. **Check Logs**: `pm2 logs wb-tracks`
2. **System Status**: `pm2 status`
3. **Database Status**: `sudo systemctl status postgresql`
4. **Network Connectivity**: `ping 8.8.8.8`

### Emergency Recovery
```bash
# Complete application restart
pm2 stop wb-tracks
pm2 start wb-tracks

# Database restart
sudo systemctl restart postgresql

# System restart (last resort)
sudo reboot
```

---

**Installation Complete!**

Your WB-Tracks inventory management system is now running on your Raspberry Pi 5 and accessible from all devices on your local network. The barcode scanning, printing, and all other features will work seamlessly on Android devices through the web browser.

For additional support or advanced configuration, refer to the technical documentation included with the application.
