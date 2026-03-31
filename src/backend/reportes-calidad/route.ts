import { loadRowsFromSql } from "@backend/shared/sqlLoader";
import { processReportData } from "@quality/lib/dataProcessor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [soulRows, antiRows, speechRows] = await Promise.all([
      loadRowsFromSql("db/reportes-calidad/BASE_DE_DATOS_REPORT.sql"),
      loadRowsFromSql("db/reportes-calidad/BBDD_ANTIFRAUDE.sql"),
      loadRowsFromSql("db/reportes-calidad/BBDD_SPEECH_ANALYTICS.sql"),
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
