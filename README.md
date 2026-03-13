# WebPing 🌐

A lightweight, web-based network ping tool with a real-time terminal-style interface. Check the reachability of any host or IP address directly from your browser.

<img width="958" height="499" alt="image" src="https://github.com/user-attachments/assets/1a83582e-56f7-44e3-bf94-568daa88bebe" />


## Features

- 🖥️ Real-time terminal output with packet-by-packet display
- 📊 Live stats — sent, received, packet loss, min/avg/max RTT
- 🎨 Color-coded latency (green < 50ms, yellow < 150ms, red > 150ms)
- 🔌 WebSocket-powered — no polling, no page refresh
- 🛑 Stop ping mid-flight
- 🐳 Docker-ready, single command to run
- 🔒 Input sanitization to prevent command injection

## Quick Start

### With Docker (recommended)

```bash
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000)

### Without Docker

> Requires Node.js 18+ and `ping` available on your system.

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a hostname (e.g. `google.com`) or IP address (e.g. `8.8.8.8`)
2. Set the packet count and interval
3. Click **PING** or press **Enter**
4. Watch the live terminal output
5. Click **STOP** at any time to abort

## Docker Notes

The `NET_RAW` and `NET_ADMIN` capabilities are required for `ping` to work inside a container. These are set in `docker-compose.yml`.

```yaml
cap_add:
  - NET_RAW
  - NET_ADMIN
```

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |

## Stack

- **Backend**: Node.js + Express + ws (WebSocket)
- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Transport**: WebSocket for real-time streaming

## License

MIT
