export type PaymentProvider = "creem" | "stripe";

export type PaymentProviderOption = {
  id: PaymentProvider;
  name: string;
  description: string;
  recommended: boolean;
  configured: boolean;
};

const providers: Array<Omit<PaymentProviderOption, "configured">> = [
  {
    id: "creem",
    name: "Creem",
    description: "由 Creem 托管结账、税务与订阅管理",
    recommended: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "使用 Stripe Checkout 和客户门户",
    recommended: false,
  },
];

export function paymentProviders(configuration: Partial<Record<PaymentProvider, boolean>> = {}) {
  return providers.map((provider) => ({
    ...provider,
    configured: Boolean(configuration[provider.id]),
  }));
}

export function isPaymentProvider(value: string): value is PaymentProvider {
  return value === "creem" || value === "stripe";
}

export function paymentProviderName(provider: PaymentProvider) {
  return providers.find((item) => item.id === provider)?.name ?? provider;
}
