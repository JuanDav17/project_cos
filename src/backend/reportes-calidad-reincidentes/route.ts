import { loadRowsFromSql } from "@backend/shared/sqlLoader";
import { processData } from "@reincidentes/lib/dataProcessor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await loadRowsFromSql(
      "db/reportes-calidad-reincidentes/BASE_DE_DATOS_SOUL.sql",
    );
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
