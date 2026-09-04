import { and, desc, eq, inArray } from "drizzle-orm";
import { assets, generationTasks } from "@/db/schema";
import { ensureCoreSchema, getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { debitCredits, grantCredits, refundGenerationCredits } from "@/lib/credits";
import { attachGuestCookie, getGuestWorkspace } from "@/lib/guest-workspace";
import { configuredVideoProvider, generationCost, getVideoProvider, parseGenerationInput } from "@/lib/video-generation";

export async function GET(request: Request) {
  const guest = getGuestWorkspace(request);
  try {
    await ensureCoreSchema();
    const user = await requireUser(request);
    await reconcileProviderTasks(user.id);
    const tasks = await getDb()
      .select()
      .from(generationTasks)
      .where(eq(generationTasks.guestId, user.id))
      .orderBy(desc(generationTasks.createdAt))
      .limit(40);
    return attachGuestCookie(Response.json({ tasks, provider: configuredVideoProvider() }), guest);
  } catch (error) {
    const code = errorMessage(error);
    return jsonError(code === "AUTH_REQUIRED" ? code : "TASK_LIST_FAILED", friendlyMessage(code), code === "AUTH_REQUIRED" ? 401 : 500, guest);
  }
}

export async function POST(request: Request) {
  const guest = getGuestWorkspace(request);
  try {
    await ensureCoreSchema();
    const user = await requireUser(request);
    const input = parseGenerationInput(await request.json());
    const referencedIds = [input.inputAssetId, input.endAssetId, input.motionAssetId].filter(Boolean) as string[];
    let ownedAssets: Array<{ id: string; kind: "image" | "video"; objectKey: string }> = [];
    if (referencedIds.length) {
      ownedAssets = await getDb()
        .select({ id: assets.id, kind: assets.kind, objectKey: assets.objectKey })
        .from(assets)
        .where(and(eq(assets.guestId, user.id), inArray(assets.id, referencedIds)));
      if (ownedAssets.length !== new Set(referencedIds).size) return jsonError("ASSET_NOT_FOUND", "素材不存在或无权访问", 404, guest);
      const kinds = new Map(ownedAssets.map((asset) => [asset.id, asset.kind]));
      const inputKind = input.inputAssetId ? kinds.get(input.inputAssetId) : null;
      if (input.mode === "video-to-video" && inputKind !== "video") return jsonError("ASSET_KIND_MISMATCH", "视频重绘模式需要上传视频", 400, guest);
      if (input.mode !== "text-to-video" && input.mode !== "video-to-video" && inputKind !== "image") return jsonError("ASSET_KIND_MISMATCH", "当前模式的起始素材必须是图片", 400, guest);
      if (input.endAssetId && kinds.get(input.endAssetId) !== "image") return jsonError("ASSET_KIND_MISMATCH", "结束帧必须是图片", 400, guest);
      if (input.motionAssetId && kinds.get(input.motionAssetId) !== "video") return jsonError("ASSET_KIND_MISMATCH", "动作参考必须是视频", 400, guest);
    }

    const provider = getVideoProvider(input.model);
    const id = crypto.randomUUID();
    const creditCost = generationCost(input);
    const debit = await debitCredits({
      userId: user.id,
      amount: creditCost,
      referenceType: "generation_task",
      referenceId: id,
      note: "视频生成预扣",
    });
    let providerTask: Awaited<ReturnType<typeof provider.submit>>;
    try {
      providerTask = await provider.submit({
        ...input,
        assets: new Map(ownedAssets.map((asset) => [asset.id, asset])),
        safetyIdentifier: user.id,
      });
    } catch (error) {
      await grantCredits({
        userId: user.id,
        amount: creditCost,
        type: "generation_refund",
        referenceType: "generation_task",
        referenceId: id,
        note: errorMessage(error),
      });
      throw error;
    }
    const [task] = await getDb()
      .insert(generationTasks)
      .values({
        id,
        guestId: user.id,
        mode: input.mode,
        model: providerTask.model,
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        aspectRatio: input.aspectRatio,
        durationSeconds: input.durationSeconds,
        cameraMotion: input.cameraMotion,
        motionStrength: input.motionStrength,
        inputAssetId: input.inputAssetId,
        endAssetId: input.endAssetId,
        motionAssetId: input.motionAssetId,
        providerTaskId: providerTask.providerTaskId,
        status: "queued",
        progress: 3,
        creditCost,
        creditTransactionId: debit.transactionId,
      })
      .returning();

    return attachGuestCookie(Response.json({ task }, { status: 201 }), guest);
  } catch (error) {
    const code = errorMessage(error);
    const status = code.startsWith("ENV_") || code === "PUBLIC_APP_URL_REQUIRED" || code === "ASSET_SIGNING_SECRET_REQUIRED"
      ? 503
      : code.endsWith("_REQUIRED") || code === "PROMPT_TOO_LONG"
        ? 400
        : code === "MODEL_NOT_AVAILABLE"
          ? 422
            : code === "INSUFFICIENT_CREDITS"
              ? 402
              : code === "AUTH_REQUIRED"
                ? 401
                : code === "QuotaExceeded" || code === "RateLimitExceeded"
            ? 429
            : 500;
    return jsonError(code, friendlyMessage(code), status, guest);
  }
}

async function reconcileProviderTasks(guestId: string) {
  const db = getDb();
  const active = await db
    .select()
    .from(generationTasks)
    .where(and(eq(generationTasks.guestId, guestId), inArray(generationTasks.status, ["queued", "processing"])));
  for (const task of active) {
    if (!task.providerTaskId) continue;
    try {
      const provider = getVideoProvider(task.model);
      const status = await provider.getStatus(task.providerTaskId);
      if (status.status === "failed" && !task.creditsRefundedAt) {
        await refundGenerationCredits({
          taskId: task.id,
          userId: guestId,
          amount: task.creditCost,
          reason: status.errorCode ?? "生成失败",
        });
      }
      await db
        .update(generationTasks)
        .set({
          status: status.status,
          progress: status.progress,
          outputUrl: status.outputUrl ?? task.outputUrl,
          errorCode: status.errorCode ?? null,
          errorMessage: status.errorMessage ?? null,
          creditsRefundedAt: status.status === "failed" ? new Date().toISOString() : task.creditsRefundedAt,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(generationTasks.id, task.id));
    } catch (error) {
      console.error("Provider status sync failed", task.id, errorMessage(error));
    }
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "UNEXPECTED_ERROR";
}

function friendlyMessage(code: string) {
  const messages: Record<string, string> = {
    PROMPT_REQUIRED: "请输入画面描述",
    AUTH_REQUIRED: "请先登录后再生成视频",
    INSUFFICIENT_CREDITS: "积分不足，请先购买积分",
    PROMPT_TOO_LONG: "画面描述不能超过 1200 个字符",
    INPUT_ASSET_REQUIRED: "当前模式需要上传起始素材",
    END_ASSET_REQUIRED: "首尾帧模式需要上传结束帧",
    MOTION_ASSET_REQUIRED: "动作控制模式需要上传参考视频",
    ASSET_KIND_MISMATCH: "素材类型与生成模式不匹配",
    MODEL_NOT_AVAILABLE: "当前模型暂不可用",
    ENV_ARK_API_KEY_REQUIRED: "尚未配置火山方舟 API Key",
    ENV_ARK_VIDEO_MODEL_REQUIRED: "尚未配置 Seedance 模型 ID",
    PUBLIC_APP_URL_REQUIRED: "真实模型需要配置可公网访问的站点地址",
    ASSET_SIGNING_SECRET_REQUIRED: "尚未配置素材签名密钥",
    InputTextSensitiveContentDetected: "画面描述未通过内容安全检查，请修改后重试",
    InputImageSensitiveContentDetected: "输入图片未通过内容安全检查，请更换素材",
    InputVideoSensitiveContentDetected: "输入视频未通过内容安全检查，请更换素材",
    OutputVideoSensitiveContentDetected: "生成结果未通过内容安全检查，请调整描述或素材",
    QuotaExceeded: "当前模型排队任务已达上限，请稍后重试",
    RateLimitExceeded: "请求过于频繁，请稍后重试",
    "InputImageSensitiveContentDetected.PrivacyInformation": "输入图片包含隐私信息，请打码或更换素材",
  };
  return messages[code] ?? "任务创建失败，请稍后重试";
}

function jsonError(code: string, message: string, status: number, guest: ReturnType<typeof getGuestWorkspace>) {
  return attachGuestCookie(Response.json({ error: { code, message } }, { status }), guest);
}
