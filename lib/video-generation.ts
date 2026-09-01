import { providerAssetUrl, type ProviderAsset } from "@/lib/provider-assets";
import { requiredRuntimeEnv, runtimeEnv } from "@/lib/runtime-env";

export const GENERATION_MODES = [
  "text-to-video",
  "image-to-video",
  "first-last-frame",
  "motion-control",
  "video-to-video",
] as const;

export type GenerationMode = (typeof GENERATION_MODES)[number];

export type CreateGenerationInput = {
  mode: GenerationMode;
  model: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: "9:16" | "1:1" | "16:9" | "21:9";
  durationSeconds: 5 | 10;
  cameraMotion: string;
  motionStrength: number;
  inputAssetId: string | null;
  endAssetId: string | null;
  motionAssetId: string | null;
};

export type ProviderSubmission = CreateGenerationInput & {
  assets: Map<string, ProviderAsset>;
  safetyIdentifier: string;
};

export type ProviderTaskStatus = {
  status: "queued" | "processing" | "succeeded" | "failed";
  progress: number;
  outputUrl?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type VideoProvider = {
  id: string;
  submit(input: ProviderSubmission): Promise<{ providerTaskId: string; model: string }>;
  getStatus(providerTaskId: string): Promise<ProviderTaskStatus>;
};

const MOCK_OUTPUT_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const mockProvider: VideoProvider = {
  id: "mock",
  async submit() {
    return { providerTaskId: `mock_${Date.now()}`, model: "mock-cinema-v1" };
  },
  async getStatus(providerTaskId) {
    const timestamp = Number(providerTaskId.split("_").at(-1));
    const age = Number.isFinite(timestamp) ? Date.now() - timestamp : 10_000;
    if (age < 1_800) return { status: "queued", progress: 8 };
    if (age < 9_000) return { status: "processing", progress: Math.min(92, 18 + Math.floor(age / 120)) };
    return { status: "succeeded", progress: 100, outputUrl: MOCK_OUTPUT_URL };
  },
};

const seedanceProvider: VideoProvider = {
  id: "seedance",
  async submit(input) {
    const model = requiredRuntimeEnv("ARK_VIDEO_MODEL");
    const content = await buildSeedanceContent(input);
    const response = await arkRequest("/contents/generations/tasks", {
      method: "POST",
      body: JSON.stringify({
        model,
        content,
        resolution: runtimeEnv("ARK_VIDEO_RESOLUTION") ?? "720p",
        ratio: input.aspectRatio,
        duration: input.durationSeconds,
        generate_audio: runtimeEnv("ARK_GENERATE_AUDIO") === "true",
        watermark: runtimeEnv("ARK_WATERMARK") === "true",
        safety_identifier: input.safetyIdentifier.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64),
      }),
    });
    const payload = (await response.json()) as { id?: string; error?: { code?: string; message?: string } };
    if (!response.ok || !payload.id) throw providerError(response.status, payload.error);
    return { providerTaskId: payload.id, model };
  },
  async getStatus(providerTaskId) {
    const response = await arkRequest(`/contents/generations/tasks/${encodeURIComponent(providerTaskId)}`, { method: "GET" });
    const payload = (await response.json()) as ArkTaskResponse;
    if (!response.ok) throw providerError(response.status, payload.error);
    if (payload.status === "succeeded") {
      if (!payload.content?.video_url) {
        return { status: "failed", progress: 100, errorCode: "OUTPUT_URL_MISSING", errorMessage: "模型任务成功但未返回视频地址" };
      }
      return { status: "succeeded", progress: 100, outputUrl: payload.content.video_url };
    }
    if (["failed", "expired", "cancelled"].includes(payload.status ?? "")) {
      return {
        status: "failed",
        progress: 100,
        errorCode: payload.error?.code ?? `PROVIDER_${payload.status?.toUpperCase() ?? "FAILED"}`,
        errorMessage: payload.error?.message ?? "视频生成失败",
      };
    }
    return payload.status === "running" ? { status: "processing", progress: 55 } : { status: "queued", progress: 8 };
  },
};

type ArkTaskResponse = {
  status?: string;
  content?: { video_url?: string };
  error?: { code?: string; message?: string };
};

export function getVideoProvider(model: string): VideoProvider {
  if (model === "mock-cinema-v1" || model.startsWith("mock_")) return mockProvider;
  if (model === "seedance" || model.startsWith("doubao-seedance-") || model.startsWith("ep-")) return seedanceProvider;
  if (model === "auto") return runtimeEnv("VIDEO_PROVIDER") === "seedance" ? seedanceProvider : mockProvider;
  throw new Error("MODEL_NOT_AVAILABLE");
}

export function configuredVideoProvider() {
  return runtimeEnv("VIDEO_PROVIDER") === "seedance" ? "seedance" : "mock";
}

export function parseGenerationInput(value: unknown): CreateGenerationInput {
  const input = (value ?? {}) as Record<string, unknown>;
  const mode = GENERATION_MODES.includes(input.mode as GenerationMode) ? (input.mode as GenerationMode) : "image-to-video";
  const prompt = typeof input.prompt === "string" ? input.prompt.trim() : "";
  const aspectRatio = ["9:16", "1:1", "16:9", "21:9"].includes(String(input.aspectRatio))
    ? (input.aspectRatio as CreateGenerationInput["aspectRatio"])
    : "9:16";
  const durationSeconds = Number(input.durationSeconds) === 10 ? 10 : 5;
  const motionStrength = Math.max(0, Math.min(100, Number(input.motionStrength) || 50));

  if (!prompt) throw new Error("PROMPT_REQUIRED");
  if (prompt.length > 1200) throw new Error("PROMPT_TOO_LONG");

  const parsed: CreateGenerationInput = {
    mode,
    model: typeof input.model === "string" ? input.model : "auto",
    prompt,
    negativePrompt: typeof input.negativePrompt === "string" ? input.negativePrompt.trim() : "",
    aspectRatio,
    durationSeconds,
    cameraMotion: typeof input.cameraMotion === "string" ? input.cameraMotion : "auto",
    motionStrength,
    inputAssetId: optionalId(input.inputAssetId),
    endAssetId: optionalId(input.endAssetId),
    motionAssetId: optionalId(input.motionAssetId),
  };

  if (mode !== "text-to-video" && !parsed.inputAssetId) throw new Error("INPUT_ASSET_REQUIRED");
  if (mode === "first-last-frame" && !parsed.endAssetId) throw new Error("END_ASSET_REQUIRED");
  if (mode === "motion-control" && !parsed.motionAssetId) throw new Error("MOTION_ASSET_REQUIRED");
  return parsed;
}

export function generationCost(input: CreateGenerationInput): number {
  const durationMultiplier = input.durationSeconds === 10 ? 2 : 1;
  const modeMultiplier = input.mode === "motion-control" || input.mode === "video-to-video" ? 2 : 1;
  return 10 * durationMultiplier * modeMultiplier;
}

async function buildSeedanceContent(input: ProviderSubmission) {
  const content: Array<Record<string, unknown>> = [{ type: "text", text: enhancePrompt(input) }];
  const append = async (assetId: string | null, type: "image_url" | "video_url", role: "reference_image" | "reference_video") => {
    if (!assetId) return;
    const asset = input.assets.get(assetId);
    if (!asset) throw new Error("ASSET_NOT_FOUND");
    const url = await providerAssetUrl(asset);
    content.push({ type, [type]: { url }, role });
  };

  await append(
    input.inputAssetId,
    input.mode === "video-to-video" ? "video_url" : "image_url",
    input.mode === "video-to-video" ? "reference_video" : "reference_image",
  );
  await append(input.endAssetId, "image_url", "reference_image");
  await append(input.motionAssetId, "video_url", "reference_video");
  return content;
}

function enhancePrompt(input: ProviderSubmission) {
  const instructions = [input.prompt];
  if (input.mode === "image-to-video") instructions.push("使用图片1作为视频起始画面，保持主体与商品外观一致。");
  if (input.mode === "first-last-frame") instructions.push("使用图片1作为首帧、图片2作为尾帧，自然完成两者之间的镜头运动与过渡。");
  if (input.mode === "motion-control") instructions.push("参考视频1的动作、节奏和姿态，保持图片1中的主体外观一致。");
  if (input.mode === "video-to-video") instructions.push("参考视频1的构图、动作与时序，根据描述重绘画面。");
  if (input.cameraMotion && input.cameraMotion !== "auto") instructions.push(`镜头运动：${input.cameraMotion}。运动强度约 ${input.motionStrength}%。`);
  if (input.negativePrompt) instructions.push(`避免出现：${input.negativePrompt}。`);
  return instructions.join("\n");
}

async function arkRequest(path: string, init: RequestInit) {
  const apiKey = requiredRuntimeEnv("ARK_API_KEY");
  const baseUrl = runtimeEnv("ARK_API_BASE_URL") ?? "https://ark.cn-beijing.volces.com/api/v3";
  return fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, ...init.headers },
    signal: AbortSignal.timeout(30_000),
  });
}

function providerError(status: number, error?: { code?: string; message?: string }) {
  const failure = new Error(error?.code ?? `ARK_HTTP_${status}`);
  failure.cause = error?.message;
  return failure;
}

function optionalId(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}
