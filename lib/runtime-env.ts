import { env } from "cloudflare:workers";

export function runtimeEnv(name: string): string | undefined {
  const workerValue = (env as unknown as Record<string, unknown>)[name];
  if (typeof workerValue === "string" && workerValue.trim()) return workerValue.trim();

  const processValue = typeof process !== "undefined" ? process.env[name] : undefined;
  return processValue?.trim() || undefined;
}

export function requiredRuntimeEnv(name: string): string {
  const value = runtimeEnv(name);
  if (!value) throw new Error(`ENV_${name}_REQUIRED`);
  return value;
}
