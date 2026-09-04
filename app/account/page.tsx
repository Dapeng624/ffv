"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = { email: string; displayName: string; creditBalance: number };
type CreditTransaction = {
  id: string;
  amount: number;
  balance_after: number;
  type: string;
  note: string;
  created_at: string;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { user?: User | null; credits?: { transactions?: CreditTransaction[] } | null }) => {
        setUser(payload.user ?? null);
        setTransactions(payload.credits?.transactions ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (!loading && !user) {
    return (
      <main className="account-page">
        <section className="auth-panel compact">
          <p className="eyebrow">ACCOUNT</p>
          <h1>请先登录</h1>
          <p>登录后可以查看积分余额、支付记录和生成任务。</p>
          <Link className="auth-link-button" href="/auth">去登录</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="account-page">
      <header className="simple-nav">
        <Link className="brand" href="/"><span className="brand-mark">Y</span><span>映作</span><small>YINGZO</small></Link>
        <nav><Link href="/studio">工作台</Link><Link href="/pricing">购买积分</Link></nav>
      </header>
      <section className="account-grid">
        <article className="account-summary">
          <p className="eyebrow">BALANCE</p>
          <h1>{loading ? "..." : user?.creditBalance ?? 0}</h1>
          <span>当前可用积分</span>
          <Link href="/pricing">购买更多积分</Link>
        </article>
        <article className="profile-card">
          <p className="eyebrow">PROFILE</p>
          <h2>{user?.displayName ?? "创作者"}</h2>
          <p>{user?.email ?? ""}</p>
          <button type="button" onClick={() => void logout()}>退出登录</button>
        </article>
      </section>
      <section className="ledger-section">
        <div className="section-heading"><div><p className="eyebrow">LEDGER</p><h2>积分流水</h2></div></div>
        {transactions.length ? (
          <div className="ledger-list">
            {transactions.map((item) => (
              <div className="ledger-row" key={item.id}>
                <div><strong>{transactionLabel(item.type)}</strong><span>{item.note || formatTime(item.created_at)}</span></div>
                <b className={item.amount > 0 ? "positive" : "negative"}>{item.amount > 0 ? "+" : ""}{item.amount}</b>
                <small>余额 {item.balance_after}</small>
              </div>
            ))}
          </div>
        ) : <div className="empty-tasks"><strong>暂无积分流水</strong><span>注册赠送、购买入账和生成扣费会记录在这里。</span></div>}
      </section>
    </main>
  );
}

function transactionLabel(type: string) {
  const labels: Record<string, string> = {
    signup_bonus: "注册赠送",
    purchase: "购买积分",
    generation_debit: "生成扣费",
    generation_refund: "失败退款",
    admin_adjustment: "人工调整",
  };
  return labels[type] ?? type;
}

function formatTime(value: string) {
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN");
}
