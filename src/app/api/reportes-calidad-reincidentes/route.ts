import { GET as backendGet } from "@backend/reportes-calidad-reincidentes/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return backendGet();
}
