import initSqlJs from 'sql.js';
import { stops, validateQuery } from './data.js';

let database;
self.onmessage = async ({ data }) => {
  try {
    if (!database) {
      const SQL = await initSqlJs({ locateFile: () => data.wasmUrl });
      database = new SQL.Database();
      database.run('CREATE TABLE stops (name TEXT, category TEXT, region TEXT, minutes INTEGER, cost INTEGER)');
      const insert = database.prepare('INSERT INTO stops VALUES (?, ?, ?, ?, ?)');
      for (const row of stops) insert.run(row);
      insert.free();
    }
    const query = validateQuery(data.sql);
    database.run('PRAGMA query_only = ON');
    const statement = database.prepare(query);
    try {
      const columns = statement.getColumnNames();
      const rows = [];
      while (rows.length < 200 && statement.step()) rows.push(statement.get());
      self.postMessage({ columns, rows, limited: rows.length === 200 });
    } finally {
      statement.free();
    }
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
