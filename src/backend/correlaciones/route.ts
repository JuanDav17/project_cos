import { loadRowsFromSupabase } from "@backend/shared/supabase";
import { processCorrelaciones } from "@correlaciones/lib/dataProcessor";

export const dynamic = "force-dynamic";

const TABLE_AUDITORIAS =
  process.env.SUPABASE_TABLE_AUDITORIAS_ETB_RETENCION ?? "auditorias_etb_retencion";
const TABLE_ANTIFRAUDE =
  process.env.SUPABASE_TABLE_CELULA_ANTIFRAUDE ?? "celula_antifraude";
const TABLE_EFECTIVIDAD =
  process.env.SUPABASE_TABLE_EFECTIVIDAD ?? "efectividad";
const TABLE_VOZ_CLIENTE =
  process.env.SUPABASE_TABLE_VOZ_CLIENTE ?? "voz_cliente";
const TABLE_NPS_FCR =
  process.env.SUPABASE_TABLE_NPS_FCR ?? "nps_fcr";

export async function GET() {
  try {
    const [auditorias, antifraude, efectividad, vozCliente, npsFcr] =
      await Promise.all([
        loadRowsFromSupabase(TABLE_AUDITORIAS),
        loadRowsFromSupabase(TABLE_ANTIFRAUDE),
        loadRowsFromSupabase(TABLE_EFECTIVIDAD),
        loadRowsFromSupabase(TABLE_VOZ_CLIENTE),
        loadRowsFromSupabase(TABLE_NPS_FCR),
      ]);

    const report = processCorrelaciones({
      auditorias,
      antifraude,
      efectividad,
      vozCliente,
      npsFcr,
    });

    return Response.json(report);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cargar las bases de correlaciones.";
    return Response.json({ error: message }, { status: 500 });
  }
}