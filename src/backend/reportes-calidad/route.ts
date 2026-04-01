import { loadRowsFromSupabase } from "@backend/shared/supabase";
import { processReportData } from "@quality/lib/dataProcessor";

export const dynamic = "force-dynamic";

const TABLE_REPORTES_CALIDAD_SOUL =
  process.env.SUPABASE_TABLE_REPORTES_CALIDAD_SOUL ?? "base_de_datos_report";
const TABLE_REPORTES_CALIDAD_ANTIFRAUDE =
  process.env.SUPABASE_TABLE_REPORTES_CALIDAD_ANTIFRAUDE ?? "bbdd_antifraude";
const TABLE_REPORTES_CALIDAD_SPEECH =
  process.env.SUPABASE_TABLE_REPORTES_CALIDAD_SPEECH ?? "bbdd_speech_analytics";

export async function GET() {
  try {
    const [soulRows, antiRows, speechRows] = await Promise.all([
      loadRowsFromSupabase(TABLE_REPORTES_CALIDAD_SOUL),
      loadRowsFromSupabase(TABLE_REPORTES_CALIDAD_ANTIFRAUDE),
      loadRowsFromSupabase(TABLE_REPORTES_CALIDAD_SPEECH),
    ]);

    const report = processReportData(soulRows, antiRows, speechRows);
    return Response.json(report);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la base de datos integrada.";
    return Response.json({ error: message }, { status: 500 });
  }
}