import { and, eq } from "drizzle-orm";
import { generationTasks } from "@/db/schema";
import { ensureCoreSchema, getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { attachGuestCookie, getGuestWorkspace } from "@/lib/guest-workspace";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const guest = getGuestWorkspace(request);
  try {
    const { id } = await context.params;
    await ensureCoreSchema();
    const user = await requireUser(request);
    const [task] = await getDb()
      .select()
      .from(generationTasks)
      .where(and(eq(generationTasks.id, id), eq(generationTasks.guestId, user.id)))
      .limit(1);

    return attachGuestCookie(
      task
        ? Response.json({ task })
        : Response.json({ error: { code: "TASK_NOT_FOUND", message: "任务不存在" } }, { status: 404 }),
      guest,
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "TASK_GET_FAILED";
    return attachGuestCookie(
      Response.json({ error: { code, message: code === "AUTH_REQUIRED" ? "请先登录" : "暂时无法读取任务" } }, { status: code === "AUTH_REQUIRED" ? 401 : 500 }),
      guest,
    );
  }
}
