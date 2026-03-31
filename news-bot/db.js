/**
 * SQLite 数据库 - 追踪已发布文章
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'news.db');

let db;

function initDb() {
  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      url         TEXT    NOT NULL UNIQUE,
      source      TEXT    NOT NULL,
      published   TEXT,
      processed   INTEGER DEFAULT 0,
      notion_id   TEXT,
      created_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS runs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at  TEXT    DEFAULT (datetime('now')),
      finished_at TEXT,
      articles_collected INTEGER DEFAULT 0,
      articles_published INTEGER DEFAULT 0,
      error       TEXT
    );
  `);

  return db;
}

function isProcessed(url) {
  const row = db.prepare('SELECT id FROM articles WHERE url = ?').get(url);
  return !!row;
}

function markProcessed(url, title, source, published, notionId) {
  db.prepare(`
    INSERT OR IGNORE INTO articles (title, url, source, published, processed, notion_id)
    VALUES (?, ?, ?, ?, 1, ?)
  `).run(title, url, source, published, notionId);
}

function startRun() {
  return db.prepare('INSERT INTO runs DEFAULT VALUES').lastInsertRowid;
}

function finishRun(runId, collected, published, error) {
  db.prepare(`
    UPDATE runs
    SET finished_at = datetime('now'),
        articles_collected = ?,
        articles_published = ?,
        error = ?
    WHERE id = ?
  `).run(collected, published, error || null, runId);
}

function getRecentArticles(limit = 20) {
  return db.prepare(`
    SELECT * FROM articles
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

module.exports = { initDb, isProcessed, markProcessed, startRun, finishRun, getRecentArticles };
