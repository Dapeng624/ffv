import { and, eq } from "drizzle-orm";
import { generationTasks } from "@/db/schema";
import { ensureCoreSchema, getDb } from "@/db";
import { attachGuestCookie, getGuestWorkspace } from "@/lib/guest-workspace";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const guest = getGuestWorkspace(request);
  const { id } = await context.params;
  await ensureCoreSchema();
  const [task] = await getDb()
    .select()
    .from(generationTasks)
    .where(and(eq(generationTasks.id, id), eq(generationTasks.guestId, guest.id)))
    .limit(1);

  return attachGuestCookie(
    task
      ? Response.json({ task })
      : Response.json({ error: { code: "TASK_NOT_FOUND", message: "任务不存在" } }, { status: 404 }),
    guest,
  );
}
