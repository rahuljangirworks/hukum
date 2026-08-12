fetch("https://google.com", { proxy: "http://127.0.0.1:8080" }).catch(e => console.log(e.message));
