import { Database } from "bun:sqlite";
const db = new Database("/home/rahul/.hukum/host/dev-runs/traycer-af6c6931/hukum-host.sqlite");

db.transaction(() => {
  db.run("PRAGMA foreign_keys=OFF;");
  
  // Update artifacts table
  db.run(`CREATE TABLE new_artifacts (
    id TEXT PRIMARY KEY,
    epic_id TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('spec', 'ticket', 'story', 'review', 'html-preview')),
    title TEXT NOT NULL,
    folder_name TEXT NOT NULL,
    parent_id TEXT,
    status INTEGER,
    assignee TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(epic_id, folder_name)
  );`);
  db.run("INSERT INTO new_artifacts SELECT * FROM artifacts;");
  db.run("DROP TABLE artifacts;");
  db.run("ALTER TABLE new_artifacts RENAME TO artifacts;");
  db.run("CREATE INDEX artifacts_epic_idx ON artifacts(epic_id, updated_at DESC);");

  // Update comment_threads table
  db.run(`CREATE TABLE new_comment_threads (
    thread_id TEXT PRIMARY KEY,
    epic_id TEXT NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
    artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
    artifact_kind TEXT NOT NULL CHECK (artifact_kind IN ('spec', 'ticket', 'story', 'review', 'html-preview')),
    resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
    created_by_user_id TEXT NOT NULL,
    created_by_handle TEXT,
    quoted_text TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`);
  db.run("INSERT INTO new_comment_threads SELECT * FROM comment_threads;");
  db.run("DROP TABLE comment_threads;");
  db.run("ALTER TABLE new_comment_threads RENAME TO comment_threads;");
  db.run("CREATE INDEX comment_threads_artifact_idx ON comment_threads(artifact_id, updated_at DESC);");
  db.run("CREATE INDEX comment_threads_epic_idx ON comment_threads(epic_id, updated_at DESC);");
  
  db.run("PRAGMA foreign_keys=ON;");
})();
console.log("Database updated successfully");
