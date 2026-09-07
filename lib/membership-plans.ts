export type MembershipPlanId = "monthly" | "yearly";

export type MembershipPlan = {
  id: MembershipPlanId;
  name: string;
  amount: number;
  currency: "usd";
  interval: "month" | "year";
  intervalLabel: string;
  creditsPerMonth: number;
  creditsPerYear: number;
  priceEnvName: "STRIPE_MONTHLY_PRICE_ID" | "STRIPE_YEARLY_PRICE_ID";
  description: string;
};

export const MEMBERSHIP_CREDITS_PER_MONTH = 200;

const plans: MembershipPlan[] = [
  {
    id: "monthly",
    name: "月度会员",
    amount: 990,
    currency: "usd",
    interval: "month",
    intervalLabel: "月",
    creditsPerMonth: MEMBERSHIP_CREDITS_PER_MONTH,
    creditsPerYear: MEMBERSHIP_CREDITS_PER_MONTH * 12,
    priceEnvName: "STRIPE_MONTHLY_PRICE_ID",
    description: "每月自动续费，每个会员月发放 200 积分",
  },
  {
    id: "yearly",
    name: "年度会员",
    amount: 9_900,
    currency: "usd",
    interval: "year",
    intervalLabel: "年",
    creditsPerMonth: MEMBERSHIP_CREDITS_PER_MONTH,
    creditsPerYear: MEMBERSHIP_CREDITS_PER_MONTH * 12,
    priceEnvName: "STRIPE_YEARLY_PRICE_ID",
    description: "每年自动续费，2400 积分按月分 12 次发放",
  },
];

export function membershipPlans() {
  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    amount: plan.amount,
    currency: plan.currency,
    interval: plan.interval,
    intervalLabel: plan.intervalLabel,
    creditsPerMonth: plan.creditsPerMonth,
    creditsPerYear: plan.creditsPerYear,
    description: plan.description,
  }));
}

export function findMembershipPlan(id: string) {
  return plans.find((plan) => plan.id === id) ?? null;
}

export function isMembershipPlanId(value: string): value is MembershipPlanId {
  return value === "monthly" || value === "yearly";
}
