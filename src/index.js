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
import { PLANS, PLAN_DETAILS, NAME_TO_KEY, KEY_TO_NAME } from "./plans.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIK = join(__dirname, "..", "web", "dist");
const PORT = parseInt(process.env.PORT || "3000", 10);
const TEST_MODU = process.env.NODE_ENV !== "production";
const APP_VERSION = "1.0.0";

const app = express();
app.set("trust proxy", 1);
app.use(compression());

/* ---------- Health Check ---------- */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
});

/* ---------- Herkese açık yasal sayfalar (App Store listing için zorunlu) ---------- */
app.get("/gizlilik-politikasi", (_req, res) => {
  res.sendFile(join(__dirname, "..", "web", "public", "gizlilik-politikasi.html"));
});
app.get("/kullanim-kosullari", (_req, res) => {
  res.sendFile(join(__dirname, "..", "web", "public", "kullanim-kosullari.html"));
});

/* ---------- OAuth ---------- */
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

/* ---------- Webhook'lar (express.json ONCESINDE) ---------- */
app.post(shopify.config.webhooks.path, shopify.processWebhooks({ webhookHandlers }));

/* ---------- Korumali API ---------- */
app.use("/api/*", shopify.validateAuthenticatedSession());
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
    res.json({
      aktif: !!ad,
      plan: ad ? NAME_TO_KEY[ad] : null,
      planAdi: ad,
      abonelikId: sonuc?.appSubscriptions?.[0]?.id || null,
    });
  } catch (err) {
    console.error(`[ConvertFlow TR] Abonelik kontrolu: ${err.message}`);
    res.json({ aktif: false, plan: null, planAdi: null });
  }
});

app.post("/api/abonelik", async (req, res) => {
  const session = res.locals.shopify.session;
  const planAdi = KEY_TO_NAME[String(req.body?.plan || "")];
  if (!planAdi) return res.status(400).json({ error: "Geçersiz paket seçimi." });

  try {
    const onayUrl = await shopify.api.billing.request({
      session,
      plan: planAdi,
      isTest: TEST_MODU,
      returnUrl: `${process.env.HOST}/?shop=${session.shop}`,
    });
    console.log(`[ConvertFlow TR] Abonelik baslatildi: ${session.shop} -> ${planAdi}`);
    res.json({ onayUrl });
  } catch (err) {
    console.error(`[ConvertFlow TR] Abonelik baslatma hatasi: ${err.message}`);
    res.status(500).json({ error: "Abonelik başlatılamadı. Tekrar dene." });
  }
});

app.post("/api/lisans", async (req, res) => {
  const session = res.locals.shopify.session;
  const yazildi = await lisansYaz(session, req.body?.aktif !== false);
  res.json({ ok: yazildi });
});

/* ---------- Global Hata Yakalama ---------- */
app.use("/api/*", (err, _req, res, _next) => {
  console.error(`[ConvertFlow TR] API hatasi: ${err.message}`, err.stack);
  res.status(500).json({ error: "Beklenmeyen bir hata oluştu. Lütfen tekrar dene." });
});

/* ---------- Gomulu panel ---------- */
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIK, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), (_req, res) => {
  const dosya = join(STATIK, "index.html");
  if (!existsSync(dosya)) {
    return res.status(500).send("Panel derlenmemiş. `npm run build` çalıştırın.");
  }
  res.status(200).set("Content-Type", "text/html").send(readFileSync(dosya));
});

app.listen(PORT, () => {
  console.log(`[ConvertFlow TR] v${APP_VERSION} — ${PORT} portunda calisiyor.`);
  console.log(`[ConvertFlow TR] Ortam: ${process.env.NODE_ENV || "development"}`);
});
