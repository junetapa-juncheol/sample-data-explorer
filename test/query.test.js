import test from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { stops, validateQuery } from '../src/data.js';

test('SQLite WebAssembly executes filters and aggregates on the travel records', async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('CREATE TABLE stops (name TEXT, category TEXT, region TEXT, minutes INTEGER, cost INTEGER)');
  const insert = db.prepare('INSERT INTO stops VALUES (?, ?, ?, ?, ?)');
  for (const stop of stops) insert.run(stop);
  insert.free();
  assert.deepEqual(db.exec('SELECT COUNT(*) FROM stops WHERE cost = 0')[0].values, [[4]]);
  db.run('PRAGMA query_only = ON');
  assert.throws(() => db.run('DELETE FROM stops'), /readonly/);
  db.close();
});

test('only a first read query is accepted even with leading comments', () => {
  assert.match(validateQuery('-- 코스\n SELECT name FROM stops'), /^SELECT/);
  assert.throws(() => validateQuery('PRAGMA query_only = OFF'), /SELECT/);
  assert.throws(() => validateQuery('DELETE FROM stops'), /SELECT/);
});

test('a prepared statement ignores trailing commands without changing data', async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('CREATE TABLE place (name TEXT); INSERT INTO place VALUES (\'garden\')');
  const statement = db.prepare('SELECT * FROM place; DELETE FROM place;');
  assert.ok(statement.step());
  statement.free();
  assert.equal(db.exec('SELECT COUNT(*) FROM place')[0].values[0][0], 1);
  db.close();
});
