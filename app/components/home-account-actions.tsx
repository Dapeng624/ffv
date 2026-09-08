"use client";

import { useCallback, useEffect, useState } from "react";

type AccountUser = {
  displayName: string;
  creditBalance: number;
};

export default function HomeAccountActions() {
  const [user, setUser] = useState<AccountUser | null | undefined>(undefined);

  const loadAccount = useCallback(async () => {
    try {
      const response = await fetch("/api/me", { cache: "no-store", credentials: "same-origin" });
      const payload = (await response.json()) as { user?: AccountUser | null };
      setUser(response.ok ? payload.user ?? null : null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAccount(), 0);
    const handlePageShow = () => void loadAccount();
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [loadAccount]);

  return (
    <div className="benchmark-nav-actions">
      <a className="benchmark-price-link" href="/pricing">价格</a>
      {user === undefined ? (
        <span className="benchmark-account-loading" aria-label="正在读取账户">账户</span>
      ) : user ? (
        <>
          <a className="benchmark-account-credit" href="/account" aria-label={`打开账户中心，当前 ${user.creditBalance} 积分`}>{user.creditBalance} 积分</a>
          <a className="benchmark-account-avatar" href="/account" aria-label={`打开 ${user.displayName} 的账户中心`}>{user.displayName.slice(0, 1).toUpperCase()}</a>
        </>
      ) : (
        <a className="benchmark-login-link" href="/auth">登录</a>
      )}
      <span className="nav-indicator" title="当前为浅色主题">☼</span>
      <span className="nav-indicator" title="当前语言：中文">中</span>
    </div>
  );
}
