import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { ensureCoreSchema, getDb } from "@/db";
import { createSession, displayNameFromEmail, hashPassword, normalizeEmail, validatePassword } from "@/lib/auth";
import { grantCredits, SIGNUP_BONUS_CREDITS } from "@/lib/credits";

export async function POST(request: Request) {
  try {
    await ensureCoreSchema();
    const body = (await request.json()) as Record<string, unknown>;
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 32)
      : displayNameFromEmail(email);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("EMAIL_INVALID", "请输入有效邮箱", 400);
    if (!validatePassword(password)) return jsonError("PASSWORD_INVALID", "密码至少 8 位", 400);

    const existing = await getDb().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return jsonError("EMAIL_EXISTS", "这个邮箱已经注册", 409);

    const userId = crypto.randomUUID();
    await getDb().insert(users).values({
      id: userId,
      email,
      passwordHash: await hashPassword(password),
      displayName,
      creditBalance: 0,
    });
    await grantCredits({
      userId,
      amount: SIGNUP_BONUS_CREDITS,
      type: "signup_bonus",
      referenceType: "user",
      referenceId: userId,
      note: "新用户注册赠送",
    });

    const cookie = await createSession(userId, request);
    return jsonWithCookie({ user: { id: userId, email, displayName, creditBalance: SIGNUP_BONUS_CREDITS } }, cookie, 201);
  } catch (error) {
    return jsonError("REGISTER_FAILED", error instanceof Error ? error.message : "注册失败", 500);
  }
}

function jsonWithCookie(payload: unknown, cookie: string, status = 200) {
  const response = Response.json(payload, { status });
  response.headers.append("Set-Cookie", cookie);
  return response;
}

function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}
