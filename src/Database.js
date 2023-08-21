import Database from 'better-sqlite3';
import fs from 'fs';

export const db = new Database('data/app.db');
db.pragma('journal_model = WAL');

export async function runMigrations() {
    db.prepare(`CREATE TABLE IF NOT EXISTS db_migrations (
        filename TEXT PRIMARY KEY
    )`).run();

    const existingMigrations = db.prepare('SELECT * FROM db_migrations').all();
    const migrationFiles = fs.readdirSync('./data/migrations/');
    migrationFiles.sort();

    for (const migrationFile of migrationFiles) {
        if (!existingMigrations.some(row => row.filename === migrationFile)) {
            const migrationSQL = fs.readFileSync(`./data/migrations/${migrationFile}`);
            db.exec(migrationSQL.toString('ascii'));
            db.prepare(`INSERT INTO db_migrations (filename) VALUES (?)`).run(migrationFile);
        }
    }
};