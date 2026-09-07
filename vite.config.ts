import { sites } from "@openai/sites-vite-plugin";
import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";
import hostingConfig from "./.openai/hosting.json";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig(async ({ mode }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";
  const localEnv = loadEnv(mode, process.cwd(), "");
  const d1DatabaseId =
    process.env.YINGZO_D1_DATABASE_ID ??
    localEnv.YINGZO_D1_DATABASE_ID ??
    SITE_CREATOR_PLACEHOLDER_DATABASE_ID;
  const d1DatabaseName =
    process.env.YINGZO_D1_DATABASE_NAME ??
    localEnv.YINGZO_D1_DATABASE_NAME ??
    "site-creator-d1";
  const r2BucketName =
    process.env.YINGZO_R2_BUCKET_NAME ??
    localEnv.YINGZO_R2_BUCKET_NAME ??
    "site-creator-r2";
  const workerVars = Object.fromEntries(
    [
      "VIDEO_PROVIDER",
      "ARK_API_KEY",
      "ARK_VIDEO_MODEL",
      "ARK_API_BASE_URL",
      "ARK_VIDEO_RESOLUTION",
      "ARK_GENERATE_AUDIO",
      "ARK_WATERMARK",
      "PUBLIC_APP_URL",
      "MEDIA_PUBLIC_BASE_URL",
      "ASSET_SIGNING_SECRET",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_MONTHLY_PRICE_ID",
      "STRIPE_YEARLY_PRICE_ID",
    ]
      .map((name) => [name, localEnv[name]])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );

  const localBindingConfig = {
    main: "./worker/index.ts",
    compatibility_flags: ["nodejs_compat"],
    vars: workerVars,
    d1_databases: d1
      ? [
          {
            binding: d1,
            database_name: d1DatabaseName,
            database_id: d1DatabaseId,
          },
        ]
      : [],
    r2_buckets: r2
      ? [
          {
            binding: r2,
            bucket_name: r2BucketName,
          },
        ]
      : [],
    triggers: { crons: ["17 0 * * *"] },
  };

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
