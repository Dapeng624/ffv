import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Yingzo marketing home", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /映作 YINGZO - AI 视频生成工作台/);
  assert.match(html, /革新视频创作/);
  assert.match(html, /核心技术/);
  assert.match(html, /为什么选择映作/);
  assert.match(html, /四步完成一条 AI 视频/);
  assert.match(html, /产品矩阵/);
  assert.match(html, /创作者场景/);
  assert.match(html, /常见问题/);
  assert.match(html, /href="\/studio"/);
});

test("keeps the five-mode studio wired to the provider API", async () => {
  const [studio, provider, route, envExample] = await Promise.all([
    readFile(new URL("../app/studio/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/video-generation.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/generations/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.local.example", import.meta.url), "utf8"),
  ]);

  for (const mode of ["text-to-video", "image-to-video", "first-last-frame", "motion-control", "video-to-video"]) {
    assert.match(studio, new RegExp(`id: "${mode}"`));
  }
  assert.match(studio, /model: "auto"/);
  assert.match(provider, /contents\/generations\/tasks/);
  assert.match(provider, /async getStatus/);
  assert.match(provider, /Authorization: `Bearer \$\{apiKey\}`/);
  assert.match(route, /reconcileProviderTasks/);
  assert.match(envExample, /VIDEO_PROVIDER=seedance/);
  assert.match(envExample, /ARK_API_KEY=/);
  assert.match(envExample, /ARK_VIDEO_MODEL=/);
});
