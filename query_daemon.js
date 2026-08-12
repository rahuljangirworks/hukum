const fs = require('fs');
const pidData = JSON.parse(fs.readFileSync('/home/rahul/.hukum/host/dev-runs/traycer-af6c6931/pid.json', 'utf8'));
const wsUrl = pidData.websocketUrl;

const ws = new WebSocket(wsUrl);

ws.addEventListener('open', () => {
  const req = {
    jsonrpc: "2.0",
    id: 1,
    method: "providers.list",
    params: {}
  };
  ws.send(JSON.stringify(req));
});

ws.addEventListener('message', (event) => {
  const res = JSON.parse(event.data);
  if (res.id === 1) {
    const opencode = res.result.providers.find(p => p.providerId === 'opencode');
    console.log(JSON.stringify(opencode, null, 2));
    process.exit(0);
  }
});

ws.addEventListener('error', (err) => {
  console.error(err);
  process.exit(1);
});
