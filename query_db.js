import { Database } from "bun:sqlite";
const db = new Database("/home/rahul/.hukum/host/dev-runs/traycer-af6c6931/hukum-host.sqlite");
const rows = db.query("SELECT id, kind, title FROM artifacts;").all();
console.log(JSON.stringify(rows, null, 2));
