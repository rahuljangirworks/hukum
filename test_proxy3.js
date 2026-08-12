fetch("https://httpbin.org/ip", { proxy: "http://103.111.182.122:80" }) // some public proxy if alive
  .then(r => r.json())
  .then(j => console.log("Success:", j))
  .catch(e => console.log("Error:", e.message));
