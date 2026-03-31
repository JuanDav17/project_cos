import { loadStandardSql } from "@backend/shared/sqlLoader";
import { processCorrelaciones } from "@correlaciones/lib/dataProcessor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [auditorias, antifraude, efectividad, vozCliente, npsFcr] =
      await Promise.all([
        loadStandardSql("correlaciones/bd_auditorias_etb_retencion.sql"),
        loadStandardSql("correlaciones/bd_celula_antifraude.sql"),
        loadStandardSql("correlaciones/bd_efectividad.sql"),
        loadStandardSql("correlaciones/bd_voz_cliente.sql"),
        loadStandardSql("correlaciones/bd_nps_fcr.sql"),
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
