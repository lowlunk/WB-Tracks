# Security Policy

## Reporting a Vulnerability

If you discover a security issue in WB Tracks, **please do not open a public issue**. Instead, email Chris directly at <chris@brysonshome.com> with:

- A description of the vulnerability
- Steps to reproduce
- Affected versions
- Your assessment of the impact

You can expect a response within **3 business days** and a fix or mitigation plan within **14 days** for confirmed issues.

---

## Current Security Posture (v1.0)

WB Tracks v1.0 is designed for **internal LAN-only deployment behind a corporate firewall**. It is **not hardened for direct exposure to the public internet**.

### What v1.0 does

- Runs as a non-privileged systemd service user (`wbtracks`)
- Hardened systemd unit (`NoNewPrivileges`, `ProtectSystem=strict`, `PrivateTmp`, etc.) — see [DEPLOY.md](DEPLOY.md#step-5--systemd-service-auto-start-at-boot)
- Zod validation on every API write
- No SQL — in-memory storage means no injection surface
- No `eval`, no `Function()` constructors, no dynamic requires
- All dependencies pinned in `package-lock.json`

### What v1.0 explicitly does not do

- **No authentication.** Anyone who can reach the URL can read and write. Network ACLs and firewall rules are the only access control.
- **No authorization.** No roles, no per-user permissions.
- **No HTTPS by default.** Configure nginx + TLS per [DEPLOY.md Step 10](DEPLOY.md#step-10--optional-https).
- **No audit log.** Edits are not recorded.
- **No rate limiting.** A misbehaving client can hammer the API.
- **No CSRF protection** (not currently needed without auth, but required once auth is added).

### Production deployment guidance

For any deployment that goes beyond evaluation:

1. **Firewall** — restrict port 80/443/5000 to the plant LAN only (see [DEPLOY.md Step 9](DEPLOY.md#step-9--firewall))
2. **HTTPS** — terminate TLS at nginx with a cert from your internal CA
3. **SSH hardening** — disable password auth on the Pi, use keys only
4. **OS patching** — schedule `unattended-upgrades` for security updates
5. **Backups** — once migrated to Postgres, automate nightly dumps off-site
6. **Monitoring** — health-check `/api/dashboard` from a watchdog host

---

## Planned Security Work

Tracked on the [roadmap](DEVELOPMENT.md#roadmap):

- Azure AD / Entra ID single sign-on
- Role-based access (admin / editor / viewer)
- Audit log table (who, what, when, before, after)
- Rate limiting on `/api/*`
- CSRF tokens on state-changing requests
- Optional Pi-hole / DNS sinkhole compatibility check (some firmware uses port 80 conflicts)
