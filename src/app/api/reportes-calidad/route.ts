import { GET as backendGet } from "@backend/reportes-calidad/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return backendGet();
}
