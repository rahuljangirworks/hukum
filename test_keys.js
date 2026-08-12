const fs = require("fs");
const cfg = JSON.parse(fs.readFileSync("/home/rahul/.hukum/config.json"));
async function test() {
  for (const key of cfg.opencodeApiKeys) {
    const res = await fetch("https://opencode.ai/zen/v1/models", {
      headers: { "Authorization": "Bearer " + key }
    });
    console.log(key.substring(0, 10) + "... -> status:", res.status);
    if (!res.ok) console.log(await res.text());
  }
}
test();
