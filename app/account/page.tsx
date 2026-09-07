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
type Membership = {
  planId: "monthly" | "yearly";
  planName: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  nextCreditGrantAt: string;
  creditsPerMonth: number;
  creditsPerYear: number;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { user?: User | null; credits?: { transactions?: CreditTransaction[] } | null; membership?: Membership | null }) => {
        setUser(payload.user ?? null);
        setTransactions(payload.credits?.transactions ?? []);
        setMembership(payload.membership ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: { message?: string } };
      if (!response.ok || !payload.url) throw new Error(payload.error?.message ?? "暂时无法打开会员管理");
      window.location.assign(payload.url);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "暂时无法打开会员管理");
      setPortalLoading(false);
    }
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
        <nav><Link href="/studio">工作台</Link><Link href="/pricing">会员方案</Link></nav>
      </header>
      <section className="account-grid">
        <article className="account-summary">
          <p className="eyebrow">BALANCE</p>
          <h1>{loading ? "..." : user?.creditBalance ?? 0}</h1>
          <span>当前可用积分</span>
          <Link href="/pricing">查看会员方案</Link>
        </article>
        <article className="membership-card">
          <p className="eyebrow">MEMBERSHIP</p>
          <div className="membership-title-row">
            <h2>{membership?.planName ?? "免费账户"}</h2>
            <span className={`membership-status status-${membership?.status ?? "free"}`}>{membershipStatus(membership?.status)}</span>
          </div>
          {membership ? (
            <>
              <p>每月 {membership.creditsPerMonth} 积分 · 全年权益 {membership.creditsPerYear} 积分</p>
              <dl>
                <div><dt>下次积分到账</dt><dd>{formatDate(membership.nextCreditGrantAt)}</dd></div>
                <div><dt>{membership.cancelAtPeriodEnd ? "会员到期" : "下次续费"}</dt><dd>{formatDate(membership.currentPeriodEnd)}</dd></div>
              </dl>
              {membership.cancelAtPeriodEnd && <small>已取消自动续订，当前权益保留至到期日。</small>}
              <button type="button" disabled={portalLoading} onClick={() => void openBillingPortal()}>
                {portalLoading ? "正在打开..." : "管理订阅"}
              </button>
            </>
          ) : (
            <>
              <p>注册赠送积分用完后，可订阅会员获得每月积分。</p>
              <Link className="membership-link" href="/pricing">选择会员方案</Link>
            </>
          )}
        </article>
        <article className="profile-card">
          <p className="eyebrow">PROFILE</p>
          <h2>{user?.displayName ?? "创作者"}</h2>
          <p>{user?.email ?? ""}</p>
          <button type="button" onClick={() => void logout()}>退出登录</button>
        </article>
      </section>
      {error && <p className="account-error">{error}</p>}
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
    subscription_grant: "会员月度积分",
    generation_debit: "生成扣费",
    generation_refund: "失败退款",
    admin_adjustment: "人工调整",
  };
  return labels[type] ?? type;
}

function membershipStatus(status?: string) {
  const labels: Record<string, string> = {
    active: "生效中",
    trialing: "试用中",
    past_due: "待付款",
    canceled: "已结束",
    unpaid: "付款失败",
    paused: "已暂停",
    incomplete: "待完成",
    incomplete_expired: "未完成",
  };
  return status ? labels[status] ?? status : "未订阅";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("zh-CN");
}

function formatTime(value: string) {
  const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN");
}
