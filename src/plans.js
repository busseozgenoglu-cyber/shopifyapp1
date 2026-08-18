import { BillingInterval } from "@shopify/shopify-api";

/**
 * Fiyatlandırma, App Store'daki doğrudan rakiplerin altında konumlandırıldı:
 * Urgency+ Low Stock Counter 2,99 $, Pro+ Low Stock & Timer Banner 3,99 $,
 * Urgify – Urgency Suite 7,99 $ (üst paketi 19,99 $). Satış Kiti bu apların
 * sunduğu geri sayım ve stok aciliyetine ek olarak taksit tablosu, kargo
 * çubuğu ve güven rozetlerini de veriyor; yine de yeni bir uygulama olduğu
 * için fiyatla rekabet ediyor.
 *
 * Buradaki `price` değerleri panelde gösterilir, `billingConfig.amount`
 * Shopify'a bildirilir. İkisinin ayrışması yanıltıcı fiyatlandırma sayılır,
 * bu yüzden tests/plans.test.js ikisini karşılaştırıyor.
 */
export const PLANS = {
  BASLANGIC: "Başlangıç",
  PRO: "Pro",
};

export const PLAN_DETAILS = [
  {
    key: "baslangic",
    name: PLANS.BASLANGIC,
    price: 2.49,
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
    price: 5.99,
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
    amount: 2.49,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
    trialDays: 14,
  },
  [PLANS.PRO]: {
    amount: 5.99,
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
