import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { ensureCoreSchema, getDb } from "@/db";
import { createSession, normalizeEmail, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await ensureCoreSchema();
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return jsonError("LOGIN_INVALID", "邮箱或密码不正确", 401);
    }

    const cookie = await createSession(user.id, request);
    const response = Response.json({
      user: { id: user.id, email: user.email, displayName: user.displayName, creditBalance: user.creditBalance },
    });
    response.headers.append("Set-Cookie", cookie);
    return response;
  } catch (error) {
    return jsonError("LOGIN_FAILED", error instanceof Error ? error.message : "登录失败", 500);
  }
}

function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}
