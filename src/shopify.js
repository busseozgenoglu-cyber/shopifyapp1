import "dotenv/config";
import { shopifyApp } from "@shopify/shopify-app-express";
import { ApiVersion, LATEST_API_VERSION } from "@shopify/shopify-api";
import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";
import { billingConfig } from "./plans.js";

const hostName = (process.env.HOST || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET || !hostName) {
  console.warn("[Satis Kiti] UYARI: SHOPIFY_API_KEY, SHOPIFY_API_SECRET veya HOST eksik.");
}

/**
 * Veritabani yok. Ayarlarin tamami tema duzenleyicide tutuldugu icin
 * uygulamanin saklamasi gereken kalici veri bulunmuyor.
 */
const shopify = shopifyApp({
  api: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: (process.env.SCOPES || "read_products").split(",").map((s) => s.trim()),
    apiVersion: ApiVersion.October25 || LATEST_API_VERSION,
    hostName,
    hostScheme: "https",
    isEmbeddedApp: true,
    billing: billingConfig,
  },
  auth: { path: "/api/auth", callbackPath: "/api/auth/callback" },
  webhooks: { path: "/api/webhooks" },
  sessionStorage: new MemorySessionStorage(),
});

export default shopify;
