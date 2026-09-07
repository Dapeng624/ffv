"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MembershipPlan = {
  id: "monthly" | "yearly";
  name: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  intervalLabel: string;
  creditsPerMonth: number;
  creditsPerYear: number;
  description: string;
};

type PaymentProvider = {
  id: "creem" | "stripe";
  name: string;
  description: string;
  recommended: boolean;
};

export default function PricingPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [provider, setProvider] = useState<PaymentProvider["id"]>("creem");
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/billing/packages")
      .then((response) => response.json())
      .then((payload: { plans?: MembershipPlan[]; providers?: PaymentProvider[] }) => {
        setPlans(payload.plans ?? []);
        setProviders(payload.providers ?? []);
      })
      .catch(() => setError("暂时无法加载会员套餐"));
  }, []);

  async function checkout(planId: string) {
    setLoadingPlan(`${provider}:${planId}`);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, provider }),
      });
      const payload = (await response.json()) as { url?: string; error?: { message: string } };
      if (response.status === 401) {
        window.location.assign("/auth");
        return;
      }
      if (!response.ok || !payload.url) throw new Error(payload.error?.message ?? "暂时无法创建会员订阅");
      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "暂时无法创建会员订阅");
      setLoadingPlan("");
    }
  }

  return (
    <main className="billing-page">
      <header className="simple-nav">
        <Link className="brand" href="/"><span className="brand-mark">Y</span><span>映作</span><small>YINGZO</small></Link>
        <nav><Link href="/studio">工作台</Link><Link href="/account">账户</Link></nav>
      </header>
      <section className="billing-hero">
        <p className="eyebrow">MEMBERSHIP</p>
        <h1>稳定创作，从每月 200 积分开始</h1>
        <p>月度和年度会员享有相同的每月积分权益。年度会员一次支付一年费用，2400 积分按月分 12 次到账。</p>
      </section>
      <section className="payment-provider-picker" aria-label="选择支付方式">
        <div className="provider-picker-heading">
          <div><strong>支付方式</strong><span>选择后将在对应平台的安全结账页完成付款</span></div>
          <small>{providers.find((item) => item.id === provider)?.description}</small>
        </div>
        <div className="provider-segmented-control">
          {providers.map((item) => (
            <button
              className={provider === item.id ? "active" : ""}
              key={item.id}
              type="button"
              aria-pressed={provider === item.id}
              onClick={() => setProvider(item.id)}
            >
              <span>{item.name}</span>
              {item.recommended && <small>推荐</small>}
            </button>
          ))}
        </div>
      </section>
      <section className="membership-pricing-grid">
        {plans.map((plan) => (
          <article className={`pricing-card membership-price-card${plan.id === "yearly" ? " featured" : ""}`} key={plan.id}>
            {plan.id === "yearly" && <span className="membership-badge">节省 $19.80</span>}
            <div><span>{plan.name}</span><strong>{plan.creditsPerMonth}</strong><small>积分 / 月</small></div>
            <p>{plan.description}</p>
            <ul>
              <li>每月发放 {plan.creditsPerMonth} 积分</li>
              <li>全年权益 {plan.creditsPerYear} 积分</li>
              <li>可在账户中心管理续订</li>
            </ul>
            <b>{formatMoney(plan.amount, plan.currency)} <small>/ {plan.intervalLabel}</small></b>
            {plan.id === "yearly" && <span className="monthly-equivalent">相当于每月 $8.25</span>}
            <button type="button" disabled={Boolean(loadingPlan)} onClick={() => void checkout(plan.id)}>
              {loadingPlan === `${provider}:${plan.id}`
                ? "正在跳转..."
                : `使用 ${providers.find((item) => item.id === provider)?.name ?? provider} 订阅`}
            </button>
          </article>
        ))}
      </section>
      <p className="billing-note">会员会自动续费。付款与税费由所选支付平台处理；取消续订后，权益保留到当前已付款周期结束。</p>
      {error && <p className="billing-error">{error}</p>}
    </main>
  );
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}
