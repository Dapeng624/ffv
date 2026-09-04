"use client";

/* eslint-disable @next/next/no-img-element -- The generator renders user-uploaded blob and protected asset URLs. */

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type GenerationMode = "text-to-video" | "image-to-video" | "first-last-frame" | "motion-control" | "video-to-video";
type TaskStatus = "queued" | "processing" | "succeeded" | "failed";

type AssetRef = {
  id: string;
  kind: "image" | "video";
  fileName: string;
  url: string;
  uploading?: boolean;
};

type GenerationTask = {
  id: string;
  mode: GenerationMode;
  model: string;
  prompt: string;
  aspectRatio: string;
  durationSeconds: number;
  cameraMotion: string;
  inputAssetId: string | null;
  status: TaskStatus;
  progress: number;
  outputUrl: string | null;
  errorMessage: string | null;
  creditCost: number;
  createdAt: string;
};

type AccountUser = {
  email: string;
  displayName: string;
  creditBalance: number;
};

type Template = { name: string; category: string; image: string; prompt: string; cameraMotion: string };

const modes: Array<{ id: GenerationMode; label: string; short: string }> = [
  { id: "image-to-video", label: "图生视频", short: "图片 + 描述" },
  { id: "text-to-video", label: "文生视频", short: "纯文本生成" },
  { id: "first-last-frame", label: "首尾帧", short: "锁定起点和终点" },
  { id: "motion-control", label: "动作控制", short: "参考视频驱动" },
  { id: "video-to-video", label: "视频重绘", short: "修改已有视频" },
];

const templates: Template[] = [
  {
    name: "奢感推近",
    category: "商品广告",
    image: "https://images.unsplash.com/photo-1598634222670-87c5f558119c?auto=format&fit=crop&w=900&q=85",
    prompt: "镜头缓慢推近产品，硬光扫过瓶身，玻璃反射细腻，奢华广告质感",
    cameraMotion: "push-in",
  },
  {
    name: "纯净护肤",
    category: "商品广告",
    image: "https://images.unsplash.com/photo-1613803745799-ba6c10aace85?auto=format&fit=crop&w=900&q=85",
    prompt: "柔和自然光移动，产品轻微旋转，干净高级的护肤广告画面",
    cameraMotion: "orbit",
  },
  {
    name: "植物实验室",
    category: "社媒内容",
    image: "https://images.unsplash.com/photo-1636918191572-c2e64186d918?auto=format&fit=crop&w=900&q=85",
    prompt: "叶片轻轻晃动，镜头环绕护肤品，清新自然的实验室氛围",
    cameraMotion: "handheld",
  },
  {
    name: "探店推进",
    category: "门店宣传",
    image: "https://images.unsplash.com/photo-1718578061045-b17fe1dbbd77?auto=format&fit=crop&w=900&q=85",
    prompt: "镜头平稳进入餐厅，灯光逐渐亮起，电影感探店开场",
    cameraMotion: "dolly-forward",
  },
];

const categories = ["为你推荐", "商品广告", "人物短片", "门店宣传", "热门特效"];

export default function Home() {
  const [mode, setMode] = useState<GenerationMode>("image-to-video");
  const [activeTemplate, setActiveTemplate] = useState(templates[0]);
  const [prompt, setPrompt] = useState(templates[0].prompt);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [ratio, setRatio] = useState("9:16");
  const [duration, setDuration] = useState<5 | 10>(5);
  const [category, setCategory] = useState(categories[0]);
  const [cameraMotion, setCameraMotion] = useState(templates[0].cameraMotion);
  const [motionStrength, setMotionStrength] = useState(50);
  const [inputAsset, setInputAsset] = useState<AssetRef | null>(null);
  const [endAsset, setEndAsset] = useState<AssetRef | null>(null);
  const [motionAsset, setMotionAsset] = useState<AssetRef | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [providerMode, setProviderMode] = useState<"seedance" | "mock">("mock");
  const [user, setUser] = useState<AccountUser | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const activeMode = modes.find((item) => item.id === mode) ?? modes[0];
  const previewImage = inputAsset?.kind === "image" ? inputAsset.url : activeTemplate.image;
  const creditCost = duration * 2 * (mode === "motion-control" || mode === "video-to-video" ? 2 : 1);
  const visibleTemplates =
    category === "为你推荐" || category === "人物短片" || category === "热门特效"
      ? templates
      : templates.filter((template) => template.category === category);
  const hasActiveTask = tasks.some((task) => task.status === "queued" || task.status === "processing");
  const providerLabel = providerMode === "seedance" ? "Seedance 实时" : "模拟模式";

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/generations", { cache: "no-store" });
      const payload = (await response.json()) as {
        tasks?: GenerationTask[];
        provider?: "seedance" | "mock";
        error?: { message: string };
      };
      if (response.ok && payload.tasks) {
        setTasks(payload.tasks);
        if (payload.provider) setProviderMode(payload.provider);
        setSelectedTaskId((current) => current ?? payload.tasks?.[0]?.id ?? null);
      } else {
        if (response.status !== 401) setError(payload.error?.message ?? "暂时无法同步任务");
      }
    } catch {
      setError("暂时无法同步任务，请稍后重试");
    }
  }, []);

  const loadAccount = useCallback(async () => {
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      const payload = (await response.json()) as { user?: AccountUser | null };
      setUser(payload.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAccount();
      void loadTasks();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAccount, loadTasks]);

  useEffect(() => {
    if (!hasActiveTask) return;
    const timer = window.setInterval(() => void loadTasks(), 1500);
    return () => window.clearInterval(timer);
  }, [hasActiveTask, loadTasks]);

  const uploadAsset = useCallback(async (file: File, target: "input" | "end" | "motion") => {
    const localUrl = URL.createObjectURL(file);
    const optimistic: AssetRef = {
      id: "",
      kind: file.type.startsWith("video/") ? "video" : "image",
      fileName: file.name,
      url: localUrl,
      uploading: true,
    };
    const setter = target === "input" ? setInputAsset : target === "end" ? setEndAsset : setMotionAsset;
    setter(optimistic);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/assets", { method: "POST", body: form });
      const payload = (await response.json()) as { asset?: Omit<AssetRef, "url"> & { url: string }; error?: { message: string } };
      if (response.status === 401) throw new Error("请先登录后再上传素材");
      if (!response.ok || !payload.asset) throw new Error(payload.error?.message ?? "上传失败");
      setter({ ...payload.asset, url: localUrl, uploading: false });
    } catch (uploadError) {
      setter(null);
      URL.revokeObjectURL(localUrl);
      setError(uploadError instanceof Error ? uploadError.message : "上传失败");
    }
  }, []);

  function selectTemplate(template: Template) {
    setActiveTemplate(template);
    setPrompt(template.prompt);
    setCameraMotion(template.cameraMotion);
    setError("");
    document.querySelector("#create")?.scrollIntoView({ behavior: "smooth" });
  }

  async function submitGeneration() {
    setError("");
    if (!user) return setError("请先登录后再生成视频");
    if (!prompt.trim()) return setError("请输入画面描述");
    if (mode !== "text-to-video" && !inputAsset?.id) return setError("请先上传起始素材并等待上传完成");
    if (mode === "first-last-frame" && !endAsset?.id) return setError("请上传结束帧");
    if (mode === "motion-control" && !motionAsset?.id) return setError("请上传动作参考视频");

    setSubmitting(true);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          model: "auto",
          prompt,
          negativePrompt,
          aspectRatio: ratio,
          durationSeconds: duration,
          cameraMotion,
          motionStrength,
          inputAssetId: inputAsset?.id ?? null,
          endAssetId: endAsset?.id ?? null,
          motionAssetId: motionAsset?.id ?? null,
        }),
      });
      const payload = (await response.json()) as { task?: GenerationTask; error?: { message: string } };
      if (!response.ok || !payload.task) throw new Error(payload.error?.message ?? "任务创建失败");
      setTasks((current) => [payload.task!, ...current]);
      setSelectedTaskId(payload.task.id);
      void loadAccount();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "任务创建失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar" id="top">
        <Link className="brand" href="/" aria-label="返回映作首页"><span className="brand-mark">Y</span><span>映作</span><small>YINGZO</small></Link>
        <nav className="primary-nav" aria-label="主要导航">
          <Link href="/">首页</Link><a className="active" href="#create">生成</a><a href="#templates">模板</a><a href="#works">任务</a><Link href="/pricing">价格</Link>
        </nav>
        <div className="account-actions">
          <button className="credit-pill" type="button"><span className="credit-dot" />{providerLabel}</button>
          <Link className="credit-pill account-credit" href={user ? "/account" : "/auth"}>{user ? `${user.creditBalance} 积分` : "登录"}</Link>
          <Link className="avatar-button" href={user ? "/account" : "/auth"} aria-label={user ? "账户中心" : "登录"}>{user?.displayName.slice(0, 1).toUpperCase() ?? "G"}</Link>
        </div>
      </header>

      <section className="mode-switcher" aria-label="生成模式">
        {modes.map((item) => (
          <button key={item.id} className={mode === item.id ? "active" : ""} type="button" onClick={() => {
            setMode(item.id);
            setError("");
            if (item.id === "video-to-video" && inputAsset?.kind === "image") setInputAsset(null);
            if (item.id !== "video-to-video" && item.id !== "text-to-video" && inputAsset?.kind === "video") setInputAsset(null);
          }}>
            <strong>{item.label}</strong><span>{item.short}</span>
          </button>
        ))}
      </section>

      <section className="workspace" id="create">
        <div className="control-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">CORE GENERATOR</p><h1>{activeMode.label}</h1><p className="mode-description">{activeMode.short} · 当前使用 {providerLabel}</p></div>
            <span className="version-badge">CORE V0.2</span>
          </div>

          {mode !== "text-to-video" && (
            <UploadSlot
              label={mode === "video-to-video" ? "输入视频" : "起始图片"}
              accept={mode === "video-to-video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp"}
              asset={inputAsset}
              onFile={(file) => void uploadAsset(file, "input")}
            />
          )}

          {mode === "first-last-frame" && (
            <UploadSlot label="结束图片" accept="image/jpeg,image/png,image/webp" asset={endAsset} onFile={(file) => void uploadAsset(file, "end")} />
          )}

          {mode === "motion-control" && (
            <UploadSlot label="动作参考视频" accept="video/mp4,video/webm,video/quicktime" asset={motionAsset} onFile={(file) => void uploadAsset(file, "motion")} />
          )}

          <div className="field-group">
            <div className="field-label-row"><label htmlFor="prompt">画面描述</label><button className="text-action" type="button" onClick={() => setPrompt(activeTemplate.prompt)}>使用模板描述</button></div>
            <textarea id="prompt" value={prompt} maxLength={1200} onChange={(event) => setPrompt(event.target.value)} />
            <span className="character-count">{prompt.length} / 1200</span>
          </div>

          <div className="two-column-fields">
            <fieldset className="field-group compact"><legend>视频比例</legend><div className="segmented-control">
              {["9:16", "1:1", "16:9"].map((item) => <button className={ratio === item ? "selected" : ""} key={item} type="button" onClick={() => setRatio(item)}>{item}</button>)}
            </div></fieldset>
            <fieldset className="field-group compact"><legend>视频时长</legend><div className="segmented-control two-items">
              {[5, 10].map((item) => <button className={duration === item ? "selected" : ""} key={item} type="button" onClick={() => setDuration(item as 5 | 10)}>{item} 秒</button>)}
            </div></fieldset>
          </div>

          <div className="camera-row">
            <label htmlFor="camera-motion">镜头运动</label>
            <select id="camera-motion" value={cameraMotion} onChange={(event) => setCameraMotion(event.target.value)}>
              <option value="auto">自动</option><option value="push-in">缓慢推近</option><option value="orbit">环绕</option><option value="handheld">手持</option><option value="dolly-forward">轨道前进</option><option value="zoom-out">快速拉远</option>
            </select>
          </div>

          <button className="advanced-toggle" type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((value) => !value)}><span>高级设置</span><span>{advancedOpen ? "⌃" : "⌄"}</span></button>
          {advancedOpen && (
            <div className="advanced-fields core-advanced">
              <label><span>排除内容</span><input type="text" value={negativePrompt} placeholder="模糊、文字、水印" onChange={(event) => setNegativePrompt(event.target.value)} /></label>
              <label><span>运动强度 {motionStrength}</span><input type="range" min="0" max="100" value={motionStrength} onChange={(event) => setMotionStrength(Number(event.target.value))} /></label>
            </div>
          )}

          <div className="generate-block">
            <button className="generate-button" type="button" disabled={submitting} onClick={() => void submitGeneration()}><span>{submitting ? "正在创建任务..." : user ? "生成视频" : "登录后生成"}</span><span className="button-cost">{creditCost} 积分 ↗</span></button>
            <p className={error ? "form-error" : ""}>{error || "任务将进入异步队列，关闭页面后也不会丢失"}</p>
          </div>
        </div>

        <div className="preview-stage">
          <div className="stage-toolbar"><div className="stage-title"><span className={`live-dot ${selectedTask?.status ?? "idle"}`} /><span>{selectedTask ? statusLabel(selectedTask.status) : "预览画布"}</span><span className="stage-meta">{ratio} · {duration} 秒 · {cameraMotion}</span></div><div className="stage-actions"><button type="button" aria-label="适应画布">⌗</button><button type="button" aria-label="更多操作">•••</button></div></div>
          <div className="canvas-area">
            {selectedTask?.status === "succeeded" && selectedTask.outputUrl ? (
              <div className={`video-frame ratio-${selectedTask.aspectRatio.replace(":", "-")}`}><video src={selectedTask.outputUrl} controls autoPlay loop muted playsInline /><div className="result-badge">生成结果 · {selectedTask.model}</div></div>
            ) : (
              <div className={`video-frame ratio-${ratio.replace(":", "-")}`}>
                {inputAsset?.kind === "video" ? <video src={inputAsset.url} controls muted playsInline /> : <img src={previewImage} alt={`${activeTemplate.name}预览`} />}
                <div className="frame-overlay" />
                {selectedTask && selectedTask.status !== "failed" ? <TaskProgress task={selectedTask} /> : <div className="template-caption"><span>{activeMode.label}</span><strong>{activeTemplate.name}</strong></div>}
              </div>
            )}
          </div>
          <div className="stage-footer"><span>{selectedTask ? `任务 ${selectedTask.id.slice(0, 8)}` : "上传素材或选择纯文本模式开始"}</span><span>{selectedTask ? `${selectedTask.progress}%` : "READY"}</span></div>
        </div>
      </section>

      <section className="template-section" id="templates">
        <div className="section-heading"><div><p className="eyebrow">MOTION PRESETS</p><h2>镜头预设</h2></div><span className="section-note">选择后自动带入描述与镜头运动</span></div>
        <div className="category-tabs" role="tablist" aria-label="模板分类">{categories.map((item) => <button className={category === item ? "active" : ""} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="template-grid">{visibleTemplates.map((template, index) => (
          <button className={`template-card ${activeTemplate.name === template.name ? "active" : ""}`} key={template.name} type="button" onClick={() => selectTemplate(template)}>
            <div className="card-media"><img src={template.image} alt={`${template.name}模板`} loading={index > 1 ? "lazy" : "eager"} /><span className="card-duration">{template.cameraMotion}</span><span className="use-template">+</span></div>
            <div className="card-copy"><div><strong>{template.name}</strong><span>{template.category}</span></div><span className="card-cost">应用预设</span></div>
          </button>
        ))}</div>
      </section>

      <section className="works-section" id="works">
        <div className="section-heading"><div><p className="eyebrow">GENERATION QUEUE</p><h2>生成任务</h2></div><button className="view-all" type="button" onClick={() => void loadTasks()}>刷新状态</button></div>
        {tasks.length ? <div className="works-list">{tasks.map((task) => (
          <button className={`work-row task-row ${selectedTaskId === task.id ? "selected" : ""}`} type="button" key={task.id} onClick={() => setSelectedTaskId(task.id)}>
            <div className="task-mode-icon">{modeShort(task.mode)}</div><div className="work-name"><strong>{task.prompt}</strong><span>{modeLabel(task.mode)} · {task.aspectRatio} · {task.durationSeconds} 秒 · {task.cameraMotion}</span></div>
            <span className={`work-status status-${task.status}`}>{statusLabel(task.status)}</span><time>{formatTaskTime(task.createdAt)}</time><span className="task-progress">{task.progress}%</span>
          </button>
        ))}</div> : <div className="empty-tasks"><strong>还没有生成任务</strong><span>创建第一条任务后，排队、进度和结果都会保存在这里。</span></div>}
      </section>

      <section className="core-boundary" id="pricing"><div><p className="eyebrow">CREDITS & BILLING</p><h2>账号、积分和支付已经接入</h2></div><p>登录用户可以保存素材和任务，生成前预扣积分，失败后自动退回。积分可在价格页通过 Stripe Checkout 购买。</p><Link href="/pricing">购买积分 ↗</Link></section>
      <footer className="site-footer"><a className="brand" href="#top"><span className="brand-mark">Y</span><span>映作</span></a><p>核心功能开发版</p><span>CORE V0.2</span></footer>
    </main>
  );
}

function UploadSlot({ label, accept, asset, onFile }: { label: string; accept: string; asset: AssetRef | null; onFile: (file: File) => void }) {
  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFile(file);
  }
  return (
    <div className="field-group upload-field"><div className="field-label-row"><label>{label}</label><span>{asset?.uploading ? "上传中..." : asset ? "已就绪" : accept.startsWith("video") ? "MP4 / WebM / MOV" : "JPG / PNG / WebP"}</span></div>
      <label className={`upload-box ${asset ? "has-asset" : ""}`}><span className="upload-icon">{asset?.uploading ? "…" : asset ? "✓" : "+"}</span><span><strong>{asset?.fileName ?? `上传${label}`}</strong><small>{asset ? "点击替换素材" : "素材将安全保存到当前匿名工作区"}</small></span><input type="file" accept={accept} onChange={handleFile} /></label>
    </div>
  );
}

function TaskProgress({ task }: { task: GenerationTask }) {
  return <div className="task-overlay"><span>{statusLabel(task.status)}</span><strong>{task.progress}%</strong><div className="progress-track"><span style={{ width: `${task.progress}%` }} /></div><small>可以离开页面，任务会继续处理</small></div>;
}

function statusLabel(status: TaskStatus) {
  return { queued: "等待中", processing: "生成中", succeeded: "已完成", failed: "失败" }[status];
}
function modeLabel(mode: GenerationMode) { return modes.find((item) => item.id === mode)?.label ?? mode; }
function modeShort(mode: GenerationMode) { return { "text-to-video": "T", "image-to-video": "I", "first-last-frame": "F/L", "motion-control": "M", "video-to-video": "V" }[mode]; }
function formatTaskTime(value: string) {
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
