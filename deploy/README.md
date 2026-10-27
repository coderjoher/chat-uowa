# Deploying UOWA Chat

UOWA Chat runs the official Rocket.Chat release in Docker, with the UOWA name and icons from this repository on top. Caddy serves it over HTTPS and renews the certificate automatically.

| Container | Purpose |
|---|---|
| `mongodb` | Database (MongoDB 8, single-node replica set) |
| `rocketchat` | Rocket.Chat, the version set by `RELEASE` in `.env` |
| `caddy` | HTTPS on ports 80 and 443 for `DOMAIN` |

## Try it on your computer first

You need Docker: [Docker Desktop](https://www.docker.com/products/docker-desktop/) on Windows or macOS (on Windows, accept the WSL 2 option), or `curl -fsSL https://get.docker.com | sh` on Linux. Then, in this folder:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
docker compose -f docker-compose.yml -f docker-compose.local.yml logs -f rocketchat
```

When you see `SERVER RUNNING`, press Ctrl+C and open **http://localhost:3000**. No domain, certificate or `.env` is needed.

### From phones and other computers on the same network

1. Find this computer's IP address on the local network:
   - **Windows:** run `ipconfig` and read **IPv4 Address** (for example `192.168.1.20`)
   - **macOS:** `ipconfig getifaddr en0`
   - **Linux:** `hostname -I`
2. Before the **first** start, create a `.env` file in this folder containing:
   ```
   LOCAL_URL=http://192.168.1.20:3000
   ```
   If you already started it with `localhost`, also change **Administration → Settings → General → Site URL** to the same address. Rocket.Chat saves the address on the first start only.
3. Start it with the command above, and open **http://192.168.1.20:3000** on the other device.
4. If the other device can't connect, the firewall on this computer is blocking port 3000:
   - **Windows:** when Windows asks whether to allow Docker Desktop, choose **Allow** (private networks). If it doesn't ask, open PowerShell **as administrator** and run:
     ```powershell
     New-NetFirewallRule -DisplayName "UOWA Chat (local test)" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
     ```
     Then make sure your Wi-Fi or Ethernet connection is set to **Private network** in Windows settings. The rule doesn't apply to *Public* networks.
   - **macOS:** if asked, allow incoming connections for Docker. Otherwise check *System Settings → Network → Firewall*.
   - **Linux (ufw):** `sudo ufw allow 3000/tcp`
   - Guest Wi-Fi networks often block devices from reaching each other. Use the normal staff network.

Over plain `http://` to an IP address, browsers treat the site as not secure. On other devices, chat, channels and file sharing work, but **voice and video calls, browser notifications and "Install app" are blocked**. Those work on `localhost` on this computer, and on the real server once it has HTTPS.

To stop, run the same command with `down` instead of `up -d`. Use `down -v` to also delete the test data.

## Requirements

- Ubuntu 24.04 with at least 2 CPU cores, 4 GB RAM and 40 GB disk
- A DNS **A record** for `chat.uowa.edu.iq` that points at the server's public IP address
- Ports **80** and **443** open to the internet (Caddy needs both to get its certificate)

## 1. Prepare the server

```bash
sudo apt update && sudo apt upgrade -y

# Firewall: SSH, HTTP and HTTPS only
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443
sudo ufw enable

# Docker Engine and the Compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and back in so the `docker` group takes effect.

## 2. Get the deployment files

```bash
sudo mkdir -p /opt/uowa-chat && sudo chown "$USER" /opt/uowa-chat
# Download only the deployment files and the UOWA branding, not all of Rocket.Chat's source
git clone --depth 1 --filter=blob:none --sparse https://github.com/coderjoher/chat-uowa.git /opt/uowa-chat
git -C /opt/uowa-chat sparse-checkout set deploy apps/meteor/public
cd /opt/uowa-chat/deploy
cp .env.example .env
nano .env
```

In `.env`, check `DOMAIN` and `RELEASE`, set `ACME_EMAIL` to an address the IT center reads, and choose `LANGUAGE` (`en` or `ar`).

## 3. Start it

```bash
docker compose up -d
docker compose logs -f rocketchat
```

Wait for `SERVER RUNNING`, then press Ctrl+C. Open **https://chat.uowa.edu.iq**. The first visit takes a few seconds while Caddy gets the certificate.

## 4. First-time setup (in the browser)

1. The setup wizard opens. Create the **admin account** and fill in the organization details.
2. **Administration → Workspace → Settings**:
   - **Assets**: upload `logo.svg`, `logo_dark.svg` and the favicons from `apps/meteor/public/images/logo/` to replace the defaults saved in the database.
   - **Layout → Login**: turn on **Hide "Powered by"** if you want.
   - **Email → SMTP**: add the university mail server, so password resets and email notifications work.
   - **Accounts**: decide whether people can register themselves, or whether the admin creates the accounts.
3. Create the channels, for example a read-only **#announcements** and the IT center's working channels.
4. Invite the IT center staff.

## 5. Install it as an app

Once the site is live, each person can install it:

- **Android (Chrome):** menu **⋮ → Install app**
- **iPhone (Safari):** **Share → Add to Home Screen**
- **Windows / macOS (Chrome or Edge):** the install icon in the address bar

It opens in its own window as **UOWA Chat** with the UOWA icon.

## Backups

`backup.sh` saves the database and uploaded files to `deploy/backups/` and keeps 14 days. Run it every night at 02:30:

```bash
chmod +x /opt/uowa-chat/deploy/backup.sh
(crontab -l 2>/dev/null; echo "30 2 * * * /opt/uowa-chat/deploy/backup.sh >> /opt/uowa-chat/deploy/backups/backup.log 2>&1") | crontab -
```

Also copy `deploy/backups/` to another machine regularly. A backup on the same disk doesn't protect against losing the server.

### Restore

```bash
cd /opt/uowa-chat/deploy
docker compose exec -T mongodb mongorestore --archive --gzip --drop < backups/db_YYYY-MM-DD_HHMM.archive.gz
docker compose exec -T rocketchat tar -xzf - -C /app < backups/uploads_YYYY-MM-DD_HHMM.tar.gz
docker compose restart rocketchat
```

## Updating Rocket.Chat

1. Read the release notes at https://github.com/RocketChat/Rocket.Chat/releases.
2. Take a backup: `./backup.sh`.
3. Set the new version in `.env` (`RELEASE=...`), then:
   ```bash
   git pull
   docker compose pull
   docker compose up -d
   ```

Move one release at a time when upgrading across several versions.

## Useful commands

| Task | Command |
|---|---|
| Status | `docker compose ps` |
| Logs | `docker compose logs -f rocketchat` |
| Restart | `docker compose restart rocketchat` |
| Stop everything | `docker compose down` (keeps the data) |

Never run `docker compose down -v`: it deletes the database and uploaded files.
