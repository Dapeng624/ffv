import { ensureCoreSchema } from "@/db";
import { destroySession } from "@/lib/auth";

export async function POST(request: Request) {
  await ensureCoreSchema();
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", await destroySession(request));
  return response;
}
