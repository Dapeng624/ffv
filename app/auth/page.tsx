"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const payload = (await response.json()) as { error?: { message: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "操作失败");
      window.location.href = "/studio";
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="brand" href="/"><span className="brand-mark">Y</span><span>映作</span><small>YINGZO</small></Link>
      <section className="auth-panel">
        <div>
          <p className="eyebrow">ACCOUNT</p>
          <h1>{mode === "login" ? "登录账号" : "创建账号"}</h1>
          <p>{mode === "login" ? "登录后继续管理素材、生成任务和积分。" : "注册即可获得新用户体验积分。"}</p>
        </div>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>登录</button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>注册</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label><span>昵称</span><input value={displayName} maxLength={32} placeholder="你的昵称" onChange={(event) => setDisplayName(event.target.value)} /></label>
          )}
          <label><span>邮箱</span><input type="email" value={email} autoComplete="email" placeholder="you@example.com" required onChange={(event) => setEmail(event.target.value)} /></label>
          <label><span>密码</span><input type="password" value={password} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} placeholder="至少 8 位" required onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="auth-submit" type="submit" disabled={loading}>{loading ? "处理中..." : mode === "login" ? "登录" : "注册并领取积分"}</button>
          {error && <p className="form-error">{error}</p>}
        </form>
      </section>
    </main>
  );
}
