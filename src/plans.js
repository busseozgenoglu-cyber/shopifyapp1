import { BillingInterval } from "@shopify/shopify-api";

export const PLANS = {
  BASLANGIC: "Başlangıç",
  PRO: "Pro",
};

export const PLAN_DETAILS = [
  {
    key: "baslangic",
    name: PLANS.BASLANGIC,
    price: 9.99,
    features: [
      "Taksit tablosu (varyant uyumlu)",
      "Ücretsiz kargo ilerleme çubuğu",
      "Güven rozetleri (kapıda ödeme, iade, güvenli ödeme)",
      "Sınırsız ürün ve sayfa",
      "E-posta desteği",
    ],
  },
  {
    key: "pro",
    name: PLANS.PRO,
    price: 19.99,
    features: [
      "Başlangıç paketindeki her şey",
      "Kargo kesim saati sayacı",
      "Stok uyarısı ve aciliyet mesajı",
      "İndirim sayacı (geri sayım + stok aciliyet)",
      "Öncelikli destek (24 saat içinde yanıt)",
      "Gelişmiş blok özelleştirme",
    ],
  },
];

export const billingConfig = {
  [PLANS.BASLANGIC]: {
    amount: 9.99,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
    trialDays: 14,
  },
  [PLANS.PRO]: {
    amount: 19.99,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
    trialDays: 14,
  },
};

export const NAME_TO_KEY = {
  [PLANS.BASLANGIC]: "baslangic",
  [PLANS.PRO]: "pro",
};

export const KEY_TO_NAME = Object.fromEntries(
  Object.entries(NAME_TO_KEY).map(([name, key]) => [key, name])
);
