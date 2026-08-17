import "dotenv/config";
import express from "express";
import compression from "compression";
import serveStatic from "serve-static";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import shopify from "./shopify.js";
import webhookHandlers from "./webhooks.js";
import { lisansYaz } from "./lisans.js";
import { belirtecAraKatmani } from "./oturum.js";
import { PLANS, PLAN_DETAILS, NAME_TO_KEY, KEY_TO_NAME } from "./plans.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIK = join(__dirname, "..", "web", "dist");
const PORT = parseInt(process.env.PORT || "3000", 10);
const TEST_MODU = process.env.NODE_ENV !== "production";
const APP_VERSION = "1.1.0";

const app = express();
app.set("trust proxy", 1);
app.use(compression());

/* ---------- Request Logging ---------- */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`[CF] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

/* ---------- Health Check ---------- */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: APP_VERSION, env: process.env.NODE_ENV || "dev" });
});

/* ---------- Yasal Sayfalar ---------- */
app.get("/gizlilik-politikasi", (_req, res) => {
  res.sendFile(join(__dirname, "..", "web", "public", "gizlilik-politikasi.html"));
});
app.get("/kullanim-kosullari", (_req, res) => {
  res.sendFile(join(__dirname, "..", "web", "public", "kullanim-kosullari.html"));
});

/* ---------- OAuth ---------- */
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(shopify.config.auth.callbackPath, shopify.auth.callback());

/* ---------- Webhook'lar ---------- */
app.post(shopify.config.webhooks.path, shopify.processWebhooks({ webhookHandlers }));

/* ---------- Korumali API ---------- */
// Express 5'te yol desenlerinde ciplak `*` gecersiz (path-to-regexp v8).
// `app.use("/api", ...)` zaten /api ile baslayan tum yollari kapsiyor ve
// yukarida tanimlanan auth/webhook yollarindan sonra geldigi icin onlari
// etkilemiyor.
app.use("/api", shopify.validateAuthenticatedSession());
app.use("/api", belirtecAraKatmani());
app.use(express.json({ limit: "256kb" }));

app.get("/api/magaza", async (_req, res) => {
  const session = res.locals.shopify.session;
  res.json({ domain: session.shop, planlar: PLAN_DETAILS });
});

app.get("/api/abonelik", async (_req, res) => {
  const session = res.locals.shopify.session;
  try {
    const sonuc = await shopify.api.billing.check({
      session,
      plans: Object.values(PLANS),
      isTest: TEST_MODU,
    });
    const ad = sonuc?.appSubscriptions?.[0]?.name || null;
    res.json({ aktif: !!ad, plan: ad ? NAME_TO_KEY[ad] : null, planAdi: ad });
  } catch (err) {
    console.error(`[CF] Billing check: ${err.message}`);
    res.json({ aktif: false, plan: null, planAdi: null });
  }
});

app.post("/api/abonelik", async (req, res) => {
  const session = res.locals.shopify.session;
  const planAdi = KEY_TO_NAME[String(req.body?.plan || "")];
  if (!planAdi) return res.status(400).json({ error: "Geçersiz paket." });
  try {
    const onayUrl = await shopify.api.billing.request({
      session, plan: planAdi, isTest: TEST_MODU,
      returnUrl: `${process.env.HOST}/?shop=${session.shop}`,
    });
    res.json({ onayUrl });
  } catch (err) {
    console.error(`[CF] Billing request: ${err.message}`);
    res.status(500).json({ error: "Abonelik başlatılamadı." });
  }
});

app.post("/api/lisans", async (req, res) => {
  const session = res.locals.shopify.session;
  const yazildi = await lisansYaz(session, req.body?.aktif !== false);
  res.json({ ok: yazildi });
});

/* ---------- Global Hata ---------- */
app.use("/api", (err, _req, res, _next) => {
  console.error(`[CF] API error: ${err.message}`);
  res.status(500).json({ error: "Beklenmeyen hata." });
});

/* ---------- Panel ---------- */
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIK, { index: false }));

// Yolsuz `app.use`: geriye kalan tum istekleri karsilar (Express 5 uyumlu).
app.use(shopify.ensureInstalledOnShop(), (_req, res) => {
  const dosya = join(STATIK, "index.html");
  if (!existsSync(dosya)) return res.status(500).send("Panel derlenmemiş.");
  res.status(200).set("Content-Type", "text/html").send(readFileSync(dosya));
});

app.listen(PORT, () => {
  console.log(`[CF] v${APP_VERSION} on port ${PORT} — ${process.env.NODE_ENV || "dev"}`);
});
