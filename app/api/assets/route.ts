import { env } from "cloudflare:workers";
import { assets } from "@/db/schema";
import { ensureCoreSchema, getDb } from "@/db";
import { requireUser } from "@/lib/auth";
import { attachGuestCookie, getGuestWorkspace } from "@/lib/guest-workspace";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: Request) {
  const guest = getGuestWorkspace(request);
  try {
    await ensureCoreSchema();
    const user = await requireUser(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("FILE_REQUIRED", "请选择要上传的文件", 400, guest);

    const kind = IMAGE_TYPES.has(file.type) ? "image" : VIDEO_TYPES.has(file.type) ? "video" : null;
    if (!kind) return jsonError("FILE_TYPE_NOT_ALLOWED", "仅支持 JPG、PNG、WebP、MP4、WebM 或 MOV", 415, guest);
    const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size > maxBytes) return jsonError("FILE_TOO_LARGE", `文件不能超过 ${maxBytes / 1024 / 1024}MB`, 413, guest);

    const id = crypto.randomUUID();
    const extension = safeExtension(file.name, kind);
    const objectKey = `users/${user.id}/${id}.${extension}`;
    const media = (env as unknown as { MEDIA: R2Bucket }).MEDIA;
    if (!media) throw new Error("MEDIA_BUCKET_UNAVAILABLE");

    await media.put(objectKey, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { userId: user.id, originalName: file.name.slice(0, 180) },
    });

    await getDb().insert(assets).values({
      id,
      guestId: user.id,
      objectKey,
      fileName: file.name.slice(0, 180),
      contentType: file.type,
      byteSize: file.size,
      kind,
    });

    return attachGuestCookie(
      Response.json({ asset: { id, kind, fileName: file.name, url: `/api/assets/${id}` } }, { status: 201 }),
      guest,
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
    const message = code === "AUTH_REQUIRED" ? "请先登录后再上传素材" : code;
    return jsonError(code === "AUTH_REQUIRED" ? code : "UPLOAD_FAILED", message, code === "AUTH_REQUIRED" ? 401 : 500, guest);
  }
}

function safeExtension(name: string, kind: "image" | "video") {
  const candidate = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (candidate && candidate.length <= 5) return candidate;
  return kind === "image" ? "jpg" : "mp4";
}

function jsonError(code: string, message: string, status: number, guest: ReturnType<typeof getGuestWorkspace>) {
  return attachGuestCookie(Response.json({ error: { code, message } }, { status }), guest);
}
