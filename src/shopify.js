import "dotenv/config";
import { shopifyApp } from "@shopify/shopify-app-express";
import { ApiVersion } from "@shopify/shopify-api";
import { billingConfig } from "./plans.js";
import { oturumDeposu } from "./depo.js";

const hostName = (process.env.HOST || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET || !hostName) {
  console.error("[CF] HATA: SHOPIFY_API_KEY, SHOPIFY_API_SECRET veya HOST eksik!");
  console.error("[CF] Railway Variables sekmesinden kontrol et.");
}

const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: ["read_products", "write_products"],
    // LATEST_API_VERSION yerine sabit surum: kutuphane guncellendiginde API
    // surumu kendiliginden atlarsa shopify.app.toml'daki webhook surumuyle
    // ayrisiyor ve webhook yuklerinin bicimi sessizce degisebiliyor.
    apiVersion: ApiVersion.October25,
    hostName,
    hostScheme: "https",
    isEmbeddedApp: true,
    billing: billingConfig,
  },
  auth: { path: "/api/auth", callbackPath: "/api/auth/callback" },
  webhooks: { path: "/api/webhooks" },
  sessionStorage: oturumDeposu(),
  future: {
    // Suresiz offline belirtecler Admin API tarafindan artik kabul edilmiyor.
    // Bu bayrak acikken kurulumda suresi dolan belirtec alinir ve suresi
    // dolmadan once otomatik yenilenir.
    expiringOfflineAccessTokens: true,
    // Yonetilen kurulum (managed installation) uygulamada zaten acik; gomulu
    // istekler OAuth yonlendirmesi yerine belirtec takasiyla yetkilendirilir.
    tokenExchange: true,
  },
});

export default shopify;
