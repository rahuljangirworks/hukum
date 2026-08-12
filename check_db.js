const { Database } = require("bun:sqlite");
const db = new Database("/home/rahul/.hukum/host/dev-runs/traycer-af6c6931/epics.db");
const artifacts = db.query("SELECT id, title, kind, epic_id FROM artifacts").all();
console.log("Total artifacts:", artifacts.length);
artifacts.forEach(a => console.log(a));
