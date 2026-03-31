import * as XLSX from 'xlsx';
import { RawRow } from '@quality/types/report';
import { trimRowKeys } from './utils';

export async function readWorkbookFile(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const firstSheet = workbook.SheetNames[0];

        if (!firstSheet) {
          throw new Error('El archivo no contiene hojas para procesar.');
        }

        const worksheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: '', raw: true });

        if (!rows.length) {
          throw new Error('El archivo no contiene filas de datos.');
        }

        resolve(rows.map(trimRowKeys));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('No se pudo interpretar el archivo.'));
      }
    };

    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsArrayBuffer(file);
  });
}
