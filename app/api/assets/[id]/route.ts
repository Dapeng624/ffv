import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { assets } from "@/db/schema";
import { ensureCoreSchema, getDb } from "@/db";
import { attachGuestCookie, getGuestWorkspace } from "@/lib/guest-workspace";
import { verifyProviderAssetUrl } from "@/lib/provider-assets";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const guest = getGuestWorkspace(request);
  const { id } = await context.params;
  const requestUrl = new URL(request.url);
  const providerAccess = await verifyProviderAssetUrl(
    id,
    requestUrl.searchParams.get("expires"),
    requestUrl.searchParams.get("signature"),
  );
  await ensureCoreSchema();
  const [asset] = await getDb()
    .select()
    .from(assets)
    .where(providerAccess ? eq(assets.id, id) : and(eq(assets.id, id), eq(assets.guestId, guest.id)))
    .limit(1);

  if (!asset) return attachGuestCookie(new Response("Not found", { status: 404 }), guest);
  const media = (env as unknown as { MEDIA: R2Bucket }).MEDIA;
  const object = await media.get(asset.objectKey);
  if (!object) return attachGuestCookie(new Response("Not found", { status: 404 }), guest);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", providerAccess ? "public, max-age=1800" : "private, max-age=3600");
  headers.set("Content-Disposition", `inline; filename="${encodeURIComponent(asset.fileName)}"`);
  return attachGuestCookie(new Response(object.body, { headers }), guest);
}
