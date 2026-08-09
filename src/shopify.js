import "dotenv/config";
import { shopifyApp } from "@shopify/shopify-app-express";
import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";
import { billingConfig } from "./plans.js";

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
    apiVersion: LATEST_API_VERSION,
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
