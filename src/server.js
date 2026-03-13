const express = require('express');
const { exec } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

function isValidTarget(target) {
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-\.]{0,253}[a-zA-Z0-9])?$/;
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^[a-fA-F0-9:]+$/;
  return hostnameRegex.test(target) || ipv4Regex.test(target) || ipv6Regex.test(target);
}

wss.on('connection', (ws) => {
  // Map of panelId -> child process (supports multiple concurrent pings)
  const processes = new Map();

  function send(obj) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.action === 'ping') {
        const { panelId, target, count = 10, interval = 1 } = data;

        if (!target || !isValidTarget(target)) {
          send({ type: 'error', panelId, message: 'Invalid target. Use a valid hostname or IP address.' });
          return;
        }

        // Kill existing process for this panel if any
        if (processes.has(panelId)) {
          processes.get(panelId).kill();
          processes.delete(panelId);
        }

        const platform = os.platform();
        const cmd = platform === 'win32'
          ? `ping -n ${count} ${target}`
          : `ping -c ${count} -i ${Math.max(0.2, parseFloat(interval))} ${target}`;

        send({ type: 'start', panelId, target, count, timestamp: new Date().toISOString() });

        const proc = exec(cmd);
        processes.set(panelId, proc);
        let lineBuffer = '';

        proc.stdout.on('data', (chunk) => {
          lineBuffer += chunk;
          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop();
          lines.forEach(line => {
            if (line.trim()) send({ type: 'line', panelId, data: line });
          });
        });

        proc.stderr.on('data', (chunk) => {
          send({ type: 'error', panelId, message: chunk.trim() });
        });

        proc.on('close', (code) => {
          if (lineBuffer.trim()) send({ type: 'line', panelId, data: lineBuffer });
          send({ type: 'done', panelId, code });
          processes.delete(panelId);
        });
      }

      if (data.action === 'stop') {
        const { panelId } = data;
        if (processes.has(panelId)) {
          processes.get(panelId).kill();
          processes.delete(panelId);
          send({ type: 'stopped', panelId, message: 'Ping stopped by user.' });
        }
      }

      if (data.action === 'stopAll') {
        for (const [pid, proc] of processes) {
          proc.kill();
          send({ type: 'stopped', panelId: pid, message: 'Ping stopped.' });
        }
        processes.clear();
      }

    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format.' }));
    }
  });

  ws.on('close', () => {
    for (const proc of processes.values()) proc.kill();
    processes.clear();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebPing running at http://localhost:${PORT}`);
});
