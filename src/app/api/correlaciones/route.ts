import { GET as backendGet } from "@backend/correlaciones/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return backendGet();
}
