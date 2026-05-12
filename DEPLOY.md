# Deployment Guide

Production deployment of WB Tracks to a Raspberry Pi on the Woodbridge Foam plant network.

This guide assumes:

- The Pi will live in or near the server rack
- It will run 24/7 on the plant LAN
- Users access it from desktops, laptops, and phones on the same network

If you are deploying to a different target (cloud VM, NAS Docker container, dedicated mini-PC), the **systemd**, **reverse proxy**, and **firewall** sections still apply — only the OS imaging steps differ.

---

## Hardware Recommendations

| Component | Recommended | Minimum |
| --- | --- | --- |
| Pi model | Raspberry Pi 4 (4GB or 8GB) | Pi 3B+ |
| Storage | 32GB+ A2-rated microSD, or USB SSD | 16GB Class 10 |
| Power | Official 5.1V 3A USB-C PSU | Any reliable 3A PSU |
| Cooling | Heatsink case (passive) or active fan | Heatsink |
| Network | Wired Ethernet (always) | — |

> **Use wired Ethernet.** WiFi on a plant floor is unreliable and adds latency. The Pi tracks the network — it should be on the network reliably.

---

## Step 1 — Prepare the Pi OS

### Image the SD card

1. Download **Raspberry Pi Imager** from <https://www.raspberrypi.com/software/>
2. Insert the microSD card into your workstation
3. Open the Imager and choose:
   - **OS:** Raspberry Pi OS Lite (64-bit) — Bookworm or later
   - **Storage:** your microSD
4. Click the gear icon (or "Edit Settings") and pre-configure:
   - **Hostname:** `wb-tracks`
   - **Username / password:** create an admin account (do not use the default `pi` / `raspberry`)
   - **Wireless LAN:** leave blank (we are using Ethernet)
   - **Locale:** America/Chicago, US keyboard
   - **SSH:** enable, password authentication or paste your public key
5. Write the image, eject, and insert the card into the Pi
6. Connect Ethernet and power. Wait 60 seconds for first boot.

### Find the Pi on the network

From your workstation:

```bash
ssh wb-tracks.local      # mDNS
# or, if mDNS doesn't resolve:
ssh <pi-user>@<pi-ip>    # find IP from your router's DHCP table
```

### Update the OS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw
sudo reboot
```

---

## Step 2 — Install Node.js 20

WB Tracks requires **Node.js 20 or newer**. The default Raspberry Pi OS package is too old.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version    # should print v20.x or newer
npm --version
```

---

## Step 3 — Transfer the App

You have two paths. Pick one.

### Option A — Git clone (recommended)

```bash
sudo mkdir -p /opt/wb-tracks
sudo chown $USER:$USER /opt/wb-tracks
git clone https://github.com/lowlunk/WB-Tracks.git /opt/wb-tracks
cd /opt/wb-tracks
npm ci --omit=dev
npm run build
```

Future updates: `cd /opt/wb-tracks && git pull && npm ci --omit=dev && npm run build && sudo systemctl restart wb-tracks`.

### Option B — USB transfer (offline / airgapped)

If the Pi has no internet access, transfer the prebuilt bundle.

**On a build machine (with internet):**

```bash
git clone https://github.com/lowlunk/WB-Tracks.git
cd WB-Tracks
npm ci
npm run build
tar -czf pi-deploy-wb-tracks.tar.gz dist/ package.json package-lock.json
```

Copy `pi-deploy-wb-tracks.tar.gz` and a `node_modules/` archive to a USB stick. Then on the Pi:

```bash
sudo mkdir -p /opt/wb-tracks
sudo chown $USER:$USER /opt/wb-tracks
cd /opt/wb-tracks
tar -xzf /media/usb/pi-deploy-wb-tracks.tar.gz
# If node_modules was bundled:
tar -xzf /media/usb/node_modules.tar.gz
# Otherwise, on the Pi with temporary internet access:
npm ci --omit=dev
```

---

## Step 4 — First Run (smoke test)

```bash
cd /opt/wb-tracks
NODE_ENV=production PORT=5000 node dist/index.cjs
```

Expected output:

```
HH:MM:SS [express] serving on port 5000
```

From your workstation:

```bash
curl http://wb-tracks.local:5000/api/dashboard
```

Should return a JSON payload. Open <http://wb-tracks.local:5000> in a browser to confirm the UI loads.

Press **Ctrl+C** to stop. Now we make it run as a service.

---

## Step 5 — systemd Service (auto-start at boot)

Create the unit file:

```bash
sudo tee /etc/systemd/system/wb-tracks.service >/dev/null <<'EOF'
[Unit]
Description=WB Tracks - IT Asset Management
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=wbtracks
Group=wbtracks
WorkingDirectory=/opt/wb-tracks
Environment=NODE_ENV=production
Environment=PORT=5000
ExecStart=/usr/bin/node /opt/wb-tracks/dist/index.cjs
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=wb-tracks

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/wb-tracks
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictNamespaces=true
RestrictRealtime=true
LockPersonality=true

[Install]
WantedBy=multi-user.target
EOF
```

Create a dedicated service user (cannot log in, no shell):

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin wbtracks
sudo chown -R wbtracks:wbtracks /opt/wb-tracks
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wb-tracks
sudo systemctl status wb-tracks
```

You should see `active (running)`. Logs live in journald:

```bash
sudo journalctl -u wb-tracks -f          # tail live
sudo journalctl -u wb-tracks --since today
```

---

## Step 6 — Static IP

A floating DHCP lease will break bookmarks. Pin the Pi to a fixed IP — either by **DHCP reservation on your router** (preferred) or **statically on the Pi**.

### Router DHCP reservation (recommended)

In your router admin UI, find the Pi's MAC address (`ip link show eth0`) and assign it a fixed IP — for example `10.0.0.50`. This keeps the config centralized.

### Static on the Pi (NetworkManager — Bookworm and later)

```bash
sudo nmcli con mod "Wired connection 1" \
  ipv4.addresses 10.0.0.50/24 \
  ipv4.gateway 10.0.0.1 \
  ipv4.dns "10.0.0.1 1.1.1.1" \
  ipv4.method manual
sudo nmcli con up "Wired connection 1"
```

Adjust `10.0.0.50`, gateway, and DNS to match your plant network.

---

## Step 7 — DNS / Friendly URL

Give users a name they can remember. Three options:

1. **Local DNS server** (Pi-hole, UDM, OPNsense, Windows DNS): add an A record `wbtracks.local → 10.0.0.50`
2. **HOSTS file entries** on each user's PC (`C:\Windows\System32\drivers\etc\hosts` on Windows): `10.0.0.50  wbtracks`
3. **mDNS** (`wb-tracks.local`) — works out of the box on macOS, modern Linux, and Windows 11

After this, users browse to `http://wbtracks` or `http://wb-tracks.local`.

---

## Step 8 — (Optional) Reverse Proxy on Port 80

Skip the `:5000` in the URL by putting nginx in front.

```bash
sudo apt install -y nginx
sudo tee /etc/nginx/sites-available/wb-tracks >/dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Increase if you upload large notes / attachments later
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/wb-tracks /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Now <http://wbtracks/> works without a port.

---

## Step 9 — Firewall

Lock the Pi down to only what is needed.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 10.0.0.0/8 to any port 22 proto tcp comment 'SSH from LAN'
sudo ufw allow 80/tcp comment 'WB Tracks HTTP'
# Optional: only if you also want to expose :5000 directly
# sudo ufw allow 5000/tcp comment 'WB Tracks direct'
sudo ufw enable
sudo ufw status verbose
```

Adjust the `10.0.0.0/8` source to match your plant's RFC1918 range.

---

## Step 10 — (Optional) HTTPS

For a true production deployment, terminate TLS. Two routes:

### Self-signed cert (internal only)

```bash
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/ssl/private/wb-tracks.key \
  -out /etc/ssl/certs/wb-tracks.crt \
  -subj "/CN=wbtracks.local"
```

Add `listen 443 ssl;` + `ssl_certificate` lines to the nginx config and redirect 80 → 443.

### Internal CA (recommended for teams)

If Woodbridge has an AD CA or step-ca, issue a cert from it so browsers don't warn. Drop the cert at `/etc/ssl/certs/wb-tracks.crt`, key at `/etc/ssl/private/wb-tracks.key`, and reload nginx.

---

## Step 11 — Backups

> **Important:** v1.0 uses **in-memory storage** seeded at boot. Changes are lost on restart. This is fine for evaluation and POC. For production, migrate to PostgreSQL — see [DEVELOPMENT.md](DEVELOPMENT.md#persistence) for the migration path.

Once Postgres is in place, back up nightly:

```bash
sudo tee /etc/cron.daily/wb-tracks-backup >/dev/null <<'EOF'
#!/bin/bash
set -e
BACKUP_DIR=/var/backups/wb-tracks
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
pg_dump -U wbtracks wbtracks | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"
# Keep last 30 days
find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +30 -delete
EOF
sudo chmod +x /etc/cron.daily/wb-tracks-backup
```

Sync `/var/backups/wb-tracks/` to a network share or off-site location.

---

## Step 12 — Monitoring

Quick health check from any host:

```bash
curl -fsS http://wbtracks/api/dashboard >/dev/null && echo OK || echo DOWN
```

Drop this into a cron on another host or your monitoring tool (Uptime Kuma, Zabbix, Checkmk) to alert if the Pi falls off the network.

---

## Updating

### Git clone install

```bash
cd /opt/wb-tracks
sudo -u wbtracks git pull
sudo -u wbtracks npm ci --omit=dev
sudo -u wbtracks npm run build
sudo systemctl restart wb-tracks
sudo journalctl -u wb-tracks -n 50 --no-pager
```

### USB install

Build a new `pi-deploy-wb-tracks.tar.gz` on the build machine, copy to USB, then:

```bash
sudo systemctl stop wb-tracks
sudo -u wbtracks tar -xzf /media/usb/pi-deploy-wb-tracks.tar.gz -C /opt/wb-tracks --overwrite
sudo systemctl start wb-tracks
```

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Service won't start | `sudo journalctl -u wb-tracks -n 100 --no-pager` |
| Port 5000 busy | `sudo ss -tlnp \| grep 5000` — another process is bound |
| 502 from nginx | The Node process is down — restart `wb-tracks.service` |
| Page loads but API 404 | nginx misconfigured — verify `proxy_pass http://127.0.0.1:5000;` |
| Can't reach from LAN | `sudo ufw status`, check the Pi's IP and the firewall rules |
| Data resets on reboot | v1.0 uses in-memory storage by design — migrate to Postgres for persistence |
| Slow on Pi 3 | Pi 3 is RAM-bound; upgrade to Pi 4 or 5 |
| SD card corruption | Move to USB SSD; SD cards degrade with constant writes |

---

## Uninstall

```bash
sudo systemctl disable --now wb-tracks
sudo rm /etc/systemd/system/wb-tracks.service
sudo systemctl daemon-reload
sudo rm -rf /opt/wb-tracks
sudo userdel wbtracks
sudo rm -f /etc/nginx/sites-enabled/wb-tracks /etc/nginx/sites-available/wb-tracks
sudo systemctl reload nginx
```

---

## Production Readiness Checklist

Before handing the Pi to the plant:

- [ ] OS fully patched (`apt update && apt upgrade`)
- [ ] Non-default username and strong password (or SSH key only)
- [ ] SSH password auth disabled if using keys (`PasswordAuthentication no` in `/etc/ssh/sshd_config`)
- [ ] Static IP or DHCP reservation in place
- [ ] DNS or HOSTS entry on user PCs
- [ ] `wb-tracks.service` enabled and running
- [ ] Firewall rules applied
- [ ] HTTPS terminated (self-signed or internal CA)
- [ ] Reboot test — the Pi comes back up clean and the service starts
- [ ] Smoke test from a user PC (`http://wbtracks/` loads, dashboard populates)
- [ ] Backups configured (after Postgres migration)
- [ ] Monitoring endpoint hit by an external watchdog
- [ ] Labelled physically in the rack, with the Pi MAC and IP written on the label
