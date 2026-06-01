# Deploying Padsmith to your server

Target: **`willko.dev/padsmith/`** behind your own web server.

The `padsmith` branch of `willkoman/willkoman` is a self-contained
repo where everything lives at root (no `steam-input-editor/`
subdirectory). You can clone it directly onto your server.

## Optional: extract to its own GitHub repo

Strictly optional — the `padsmith` branch works as-is. But if you want
a `willkoman/padsmith` repo for cleaner referencing:

1. Create the empty repo on GitHub: `https://github.com/new` →
   `willkoman/padsmith` → no README, no .gitignore (we already have
   those).
2. From a local clone of `willkoman/willkoman`:

   ```bash
   git fetch origin padsmith
   git push https://github.com/willkoman/padsmith.git padsmith:main
   ```

   That pushes the split branch as `main` of the new repo. Done.

## Server-side workflow

On your server (one-time setup):

```bash
# Clone the padsmith branch into the deploy dir.
# If you extracted to willkoman/padsmith, point at that instead.
sudo mkdir -p /var/www/padsmith
sudo chown $USER /var/www/padsmith
git clone -b padsmith --depth=1 \
  https://github.com/willkoman/willkoman.git /opt/padsmith-src

cd /opt/padsmith-src
npm ci
npm run build

# Copy the built static site into place.
rsync -a --delete dist/ /var/www/padsmith/
```

For updates:

```bash
cd /opt/padsmith-src
git pull --ff-only
npm ci          # if package-lock changed
npm run build
rsync -a --delete dist/ /var/www/padsmith/
```

The `rsync --delete` removes stale hashed assets from previous builds.
Vite emits content-hashed filenames, so old chunks linger forever
without `--delete`.

## A single deploy script

`scripts/deploy.sh` in the repo root packages the above. On your
server:

```bash
DEPLOY_TARGET=/var/www/padsmith ./scripts/deploy.sh
```

It will: `git pull`, `npm ci` (only if `package-lock.json` changed
since last build), `npm run build`, then `rsync` into the target.

## Web server config

### nginx

```nginx
server {
  listen 443 ssl http2;
  server_name willko.dev;

  # … your other location blocks above …

  location /padsmith/ {
    alias /var/www/padsmith/;
    try_files $uri $uri/ /padsmith/index.html;

    # Long-cache the hashed asset chunks; never cache the entrypoint
    # html / manifest / sw so hotfixes propagate.
    location ~* /padsmith/assets/.*\.(js|css|woff2?|png|svg)$ {
      alias /var/www/padsmith/assets/;
      try_files $uri =404;
      expires 1y;
      add_header Cache-Control "public, immutable";
    }
    location = /padsmith/index.html {
      alias /var/www/padsmith/index.html;
      add_header Cache-Control "no-cache";
    }
    location = /padsmith/sw.js {
      alias /var/www/padsmith/sw.js;
      add_header Cache-Control "no-cache";
    }
    location = /padsmith/manifest.webmanifest {
      alias /var/www/padsmith/manifest.webmanifest;
      add_header Cache-Control "no-cache";
      types { } default_type "application/manifest+json";
    }
  }
}
```

### Caddy

```caddy
willko.dev {
  # … your other handlers above …

  handle_path /padsmith/* {
    root * /var/www/padsmith
    @assets path /assets/*
    header @assets Cache-Control "public, max-age=31536000, immutable"
    @noCache path /index.html /sw.js /manifest.webmanifest
    header @noCache Cache-Control "no-cache"
    try_files {path} /index.html
    file_server
  }
}
```

## HTTPS

The PWA service worker only registers over HTTPS or `localhost`.
Without HTTPS the editor itself still works, but install + offline
cache will be disabled and Padsmith will show no install prompt.

If your domain already terminates TLS (Caddy auto-provisions; nginx
needs Let's Encrypt or similar), nothing extra is required.

## Verifying the deploy

```bash
curl -I https://willko.dev/padsmith/                    # → 200
curl -I https://willko.dev/padsmith/editor              # → 200 (SPA fallback)
curl -I https://willko.dev/padsmith/sw.js               # → 200
curl -I https://willko.dev/padsmith/manifest.webmanifest # → 200
```

Then load it in a browser:

- DevTools → Application → Service Workers should show `padsmith`
  registered.
- DevTools → Application → Manifest should show name "Padsmith",
  start_url `/padsmith/`, theme color `#0c0a08`.
- Hard refresh (Cmd/Shift+R) after each deploy to bypass the SW
  cache; the SW will then pick up the new build on the next reload.
