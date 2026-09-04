"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  amount: number;
  currency: string;
  description: string;
};

export default function PricingPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loadingPackage, setLoadingPackage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/billing/packages")
      .then((response) => response.json())
      .then((payload: { packages?: CreditPackage[] }) => setPackages(payload.packages ?? []))
      .catch(() => setError("暂时无法加载套餐"));
  }, []);

  async function checkout(packageId: string) {
    setLoadingPackage(packageId);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const payload = (await response.json()) as { url?: string; error?: { message: string } };
      if (response.status === 401) {
        window.location.href = "/auth";
        return;
      }
      if (!response.ok || !payload.url) throw new Error(payload.error?.message ?? "暂时无法创建支付订单");
      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "暂时无法创建支付订单");
      setLoadingPackage("");
    }
  }

  return (
    <main className="billing-page">
      <header className="simple-nav">
        <Link className="brand" href="/"><span className="brand-mark">Y</span><span>映作</span><small>YINGZO</small></Link>
        <nav><Link href="/studio">工作台</Link><Link href="/account">账户</Link></nav>
      </header>
      <section className="billing-hero">
        <p className="eyebrow">CREDITS</p>
        <h1>购买积分，继续生成视频</h1>
        <p>积分用于提交视频生成任务。5 秒普通视频消耗 10 积分，10 秒普通视频消耗 20 积分。</p>
      </section>
      <section className="pricing-grid">
        {packages.map((item) => (
          <article className="pricing-card" key={item.id}>
            <div><span>{item.name}</span><strong>{item.credits}</strong><small>积分</small></div>
            <p>{item.description}</p>
            <b>{formatMoney(item.amount, item.currency)}</b>
            <button type="button" disabled={loadingPackage === item.id} onClick={() => void checkout(item.id)}>
              {loadingPackage === item.id ? "正在跳转..." : "购买积分"}
            </button>
          </article>
        ))}
      </section>
      {error && <p className="billing-error">{error}</p>}
    </main>
  );
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}
