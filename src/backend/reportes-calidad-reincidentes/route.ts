import { loadRowsFromSupabase } from "@backend/shared/supabase";
import { processData } from "@reincidentes/lib/dataProcessor";

export const dynamic = "force-dynamic";

const TABLE_REPORTES_CALIDAD_REINCIDENTES =
  process.env.SUPABASE_TABLE_REPORTES_CALIDAD_REINCIDENTES ?? "base_de_datos_soul";

export async function GET() {
  try {
    const rows = await loadRowsFromSupabase(TABLE_REPORTES_CALIDAD_REINCIDENTES);
    const report = await processData(rows, "BASE_DE_DATOS_SOUL.sql");
    return Response.json(report);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la base de datos integrada.";
    return Response.json({ error: message }, { status: 500 });
  }
}