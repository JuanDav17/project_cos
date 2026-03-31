import { readFile } from 'fs/promises';
import path from 'path';

type RawRow = Record<string, unknown>;

const cache = new Map<string, Promise<RawRow[]>>();

function resolveDbPath(relativePath: string): string {
  const normalizedPath = relativePath.replace(/^db[\\/]/, '');
  return path.join(process.cwd(), 'db', normalizedPath);
}

async function parseSqlFile(filePath: string): Promise<RawRow[]> {
  const content = await readFile(filePath, 'utf8');
  const rows: RawRow[] = [];

  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith('INSERT INTO ')) continue;
    const start = line.indexOf("('");
    const end = line.lastIndexOf("');");
    if (start === -1 || end === -1 || end <= start + 2) continue;

    const encodedJson = line.slice(start + 2, end).replace(/''/g, "'");
    rows.push(JSON.parse(encodedJson) as RawRow);
  }

  return rows;
}

/* ── Standard SQL parser ──────────────────────────────────────────────────── */

function parseStandardSqlValues(valuesStr: string): unknown[] {
  const results: unknown[] = [];
  let i = 0;
  const len = valuesStr.length;

  while (i < len) {
    while (i < len && (valuesStr[i] === ' ' || valuesStr[i] === '\t')) i++;
    if (i >= len) break;

    if (valuesStr[i] === "'") {
      i++;
      let str = '';
      while (i < len) {
        if (valuesStr[i] === "'" && i + 1 < len && valuesStr[i + 1] === "'") {
          str += "'";
          i += 2;
        } else if (valuesStr[i] === "'") {
          i++;
          break;
        } else {
          str += valuesStr[i];
          i++;
        }
      }
      results.push(str);
    } else {
      let token = '';
      while (i < len && valuesStr[i] !== ',') {
        token += valuesStr[i];
        i++;
      }
      token = token.trim();
      if (token.toUpperCase() === 'NULL') {
        results.push(null);
      } else {
        const num = Number(token);
        results.push(Number.isNaN(num) ? token : num);
      }
    }

    while (i < len && (valuesStr[i] === ' ' || valuesStr[i] === '\t')) i++;
    if (i < len && valuesStr[i] === ',') i++;
  }

  return results;
}

async function parseStandardSqlFile(filePath: string): Promise<RawRow[]> {
  const content = await readFile(filePath, 'utf8');
  const rows: RawRow[] = [];
  const lines = content.split(/\r?\n/);

  let columns: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();

    if (!columns.length && trimmed.startsWith('INSERT INTO ')) {
      const colMatch = trimmed.match(/INSERT INTO \S+\s*\(([^)]+)\)/i);
      if (colMatch) {
        columns = colMatch[1].split(',').map((c) => c.trim().replace(/`/g, ''));
      }
    }

    if (!trimmed.startsWith('INSERT INTO ') || !columns.length) continue;

    const valuesIdx = trimmed.indexOf('VALUES');
    if (valuesIdx === -1) continue;

    const afterValues = trimmed.slice(valuesIdx + 6).trim();
    const openParen = afterValues.indexOf('(');
    let closeParen = afterValues.lastIndexOf(')');
    if (afterValues.endsWith(');')) closeParen = afterValues.lastIndexOf(')', afterValues.length - 2);
    if (openParen === -1 || closeParen === -1 || closeParen <= openParen) continue;

    const valuesStr = afterValues.slice(openParen + 1, closeParen);
    const values = parseStandardSqlValues(valuesStr);

    const row: RawRow = {};
    for (let idx = 0; idx < columns.length && idx < values.length; idx++) {
      row[columns[idx]] = values[idx];
    }
    rows.push(row);
  }

  return rows;
}

/* ── Public API ───────────────────────────────────────────────────────────── */

export function loadRowsFromSql(relativePath: string): Promise<RawRow[]> {
  const absolutePath = resolveDbPath(relativePath);

  if (!cache.has(absolutePath)) {
    cache.set(absolutePath, parseSqlFile(absolutePath));
  }

  return cache.get(absolutePath)!;
}

export function loadStandardSql(relativePath: string): Promise<RawRow[]> {
  const absolutePath = resolveDbPath(relativePath);

  if (!cache.has(absolutePath)) {
    cache.set(absolutePath, parseStandardSqlFile(absolutePath));
  }

  return cache.get(absolutePath)!;
}
