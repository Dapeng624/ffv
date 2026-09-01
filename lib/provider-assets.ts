import { runtimeEnv } from "@/lib/runtime-env";

const SIGNED_URL_TTL_SECONDS = 60 * 30;

export type ProviderAsset = {
  id: string;
  kind: "image" | "video";
  objectKey: string;
};

export async function providerAssetUrl(asset: ProviderAsset): Promise<string> {
  const publicMediaBase = runtimeEnv("MEDIA_PUBLIC_BASE_URL");
  if (publicMediaBase) {
    return `${publicMediaBase.replace(/\/$/, "")}/${asset.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  }

  const appUrl = runtimeEnv("PUBLIC_APP_URL");
  if (!appUrl) throw new Error("PUBLIC_APP_URL_REQUIRED");
  const expires = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
  const signature = await signAsset(asset.id, expires);
  const url = new URL(`/api/assets/${asset.id}`, appUrl);
  url.searchParams.set("expires", String(expires));
  url.searchParams.set("signature", signature);
  return url.toString();
}

export async function verifyProviderAssetUrl(assetId: string, expiresValue: string | null, signature: string | null) {
  const expires = Number(expiresValue);
  if (!signature || !Number.isInteger(expires) || expires <= Math.floor(Date.now() / 1000)) return false;
  const expected = await signAsset(assetId, expires);
  return timingSafeEqual(signature, expected);
}

async function signAsset(assetId: string, expires: number) {
  const secret = runtimeEnv("ASSET_SIGNING_SECRET") ?? runtimeEnv("ARK_API_KEY");
  if (!secret) throw new Error("ASSET_SIGNING_SECRET_REQUIRED");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${assetId}:${expires}`));
  return base64Url(new Uint8Array(bytes));
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}
