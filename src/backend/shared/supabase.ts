import { createClient } from "@supabase/supabase-js";

export type DbRow = Record<string, unknown>;

const PAGE_SIZE = 1000;
const cache = new Map<string, Promise<DbRow[]>>();
const LEGACY_ROW_ORDER: Record<
  string,
  Array<{ column: string; direction: "asc" | "desc" }>
> = {
  auditorias_etb_retencion: [
    { column: "id", direction: "desc" },
    { column: "id_item", direction: "asc" },
  ],
  voz_cliente: [{ column: "id_speech", direction: "desc" }],
};
const LEGACY_STANDARD_SQL_COLUMNS: Record<string, string[]> = {
  auditorias_etb_retencion: [
    "id",
    "matriz_id",
    "nombre_matriz",
    "rol_auditor",
    "auditor",
    "documento_auditor",
    "cargo_auditor",
    "fecha_creacion",
    "hora_creacion",
    "dia",
    "anio",
    "nom_mes",
    "trimestre",
    "nombre_dia",
    "intervalo",
    "nombre_del_jefe_inmediato",
    "documento_del_jefe_inmediato",
    "nombre_coordinador",
    "nombre_jefe_de_operacion",
    "nombre_gerente_de_operacion",
    "nombre_gerente_de_cuentas",
    "nombre_asesor",
    "cedula_asesor",
    "fecha_llamada",
    "hora_contacto",
    "tipo_monitoreo",
    "grabacion_llamada",
    "servicio",
    "ucid",
    "tipo_auditoria",
    "solucion_al_primer_contacto",
    "razon_no_solucion",
    "razon",
    "ojt",
    "calificacion_del_monitoreo",
    "observacion",
    "estado_retroalimentacion_auditor",
    "fecha_retroalimentacion_auditor",
    "hora_retroalimentacion_auditor",
    "retroalimentacion_auditor",
    "compromiso_calidad",
    "fecha_compromiso",
    "estado_retroalimentacion_supervisor",
    "fecha_retroalimentacion_supervisor",
    "hora_retroalimentacion_supervisor",
    "retroalimentacion_supervisor",
    "compromiso_operacion",
    "fecha_eliminacion",
    "usuario_eliminacion",
    "observacion_eliminacion",
    "id_modulo",
    "modulo",
    "id_item",
    "item",
    "tipo_item",
    "cumple",
    "no_cumple",
    "no_aplica",
    "tiempo_retro_auditor",
    "tiempo_retro_supervisor",
    "col_24_horas",
    "mayor_a_24_horas",
    "col_48_horas",
    "mayor_a_48_horas",
    "critico",
  ],
  celula_antifraude: [
    "mes",
    "semana",
    "fecha_de_monitoreo",
    "fecha_de_llamada",
    "duracion_de_la_llamada",
    "cedula",
    "asesor",
    "fecha_de_ingreso",
    "antiguedad",
    "supervisor",
    "c_c_super",
    "dirigido",
    "cc_cliente",
    "id_llamada",
    "mala_practica",
    "tipo_de_mala_practica",
    "descripcion",
    "devolucion",
    "observacion",
  ],
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
}

const supabaseUrl = requireEnv("SUPABASE_URL");
const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function unwrapSingleColumnRow(row: DbRow): DbRow {
  const entries = Object.entries(row);

  if (entries.length !== 1) {
    return row;
  }

  const [, value] = entries[0];

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as DbRow;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as DbRow;
      }
    } catch {
      return row;
    }
  }

  return row;
}

function serializeLegacySqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function compareLegacyOrderValues(left: unknown, right: unknown): number {
  if (left === right) return 0;
  if (left === null || left === undefined) return 1;
  if (right === null || right === undefined) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;

  return String(left).localeCompare(String(right), "es");
}

function applyLegacyRowOrder(tableName: string, rows: DbRow[]): DbRow[] {
  const rules = LEGACY_ROW_ORDER[tableName];

  if (!rules) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    for (const rule of rules) {
      const diff = compareLegacyOrderValues(left[rule.column], right[rule.column]);
      if (diff !== 0) {
        return rule.direction === "asc" ? diff : -diff;
      }
    }

    return 0;
  });
}

function serializeLegacyInsert(tableName: string, columns: string[], row: DbRow): string {
  const values = columns.map((column) => serializeLegacySqlValue(row[column])).join(", ");
  return `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${values});`;
}

function parseStandardSqlValues(valuesStr: string): unknown[] {
  const results: unknown[] = [];
  let i = 0;
  const len = valuesStr.length;

  while (i < len) {
    while (i < len && (valuesStr[i] === " " || valuesStr[i] === "\t")) i++;
    if (i >= len) break;

    if (valuesStr[i] === "'") {
      i++;
      let str = "";
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
      let token = "";
      while (i < len && valuesStr[i] !== ",") {
        token += valuesStr[i];
        i++;
      }
      token = token.trim();
      if (token.toUpperCase() === "NULL") {
        results.push(null);
      } else {
        const num = Number(token);
        results.push(Number.isNaN(num) ? token : num);
      }
    }

    while (i < len && (valuesStr[i] === " " || valuesStr[i] === "\t")) i++;
    if (i < len && valuesStr[i] === ",") i++;
  }

  return results;
}

function replayLegacyStandardSqlParser(
  tableName: string,
  columns: string[],
  rows: DbRow[]
): DbRow[] {
  const parsedRows: DbRow[] = [];

  for (const row of rows) {
    const statement = serializeLegacyInsert(tableName, columns, row);

    for (const line of statement.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("INSERT INTO ")) continue;

      const valuesIdx = trimmed.indexOf("VALUES");
      if (valuesIdx === -1) continue;

      const afterValues = trimmed.slice(valuesIdx + 6).trim();
      const openParen = afterValues.indexOf("(");
      let closeParen = afterValues.lastIndexOf(")");
      if (afterValues.endsWith(");")) {
        closeParen = afterValues.lastIndexOf(")", afterValues.length - 2);
      }
      if (openParen === -1 || closeParen === -1 || closeParen <= openParen) continue;

      const valuesStr = afterValues.slice(openParen + 1, closeParen);
      const values = parseStandardSqlValues(valuesStr);

      const parsedRow: DbRow = {};
      for (let idx = 0; idx < columns.length && idx < values.length; idx++) {
        parsedRow[columns[idx]] = values[idx];
      }
      parsedRows.push(parsedRow);
    }
  }

  return parsedRows;
}

function applyLegacySqlCompatibility(tableName: string, rows: DbRow[]): DbRow[] {
  const columns = LEGACY_STANDARD_SQL_COLUMNS[tableName];

  if (!columns) {
    return rows;
  }

  return replayLegacyStandardSqlParser(tableName, columns, rows);
}

async function fetchAllRows(tableName: string): Promise<DbRow[]> {
  const rows: DbRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`No se pudo consultar la tabla "${tableName}": ${error.message}`);
    }

    rows.push(...(data ?? []).map((row) => unwrapSingleColumnRow(row as DbRow)));

    if ((data ?? []).length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return applyLegacySqlCompatibility(tableName, applyLegacyRowOrder(tableName, rows));
}

export function loadRowsFromSupabase(tableName: string): Promise<DbRow[]> {
  if (!cache.has(tableName)) {
    cache.set(tableName, fetchAllRows(tableName));
  }

  return cache.get(tableName)!;
}
