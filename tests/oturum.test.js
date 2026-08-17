import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Belirtec donusumu, suresiz offline belirtecle kurulmus magazalarin
 * calismaya devam etmesini saglayan tek yer. Kirilirsa hata sessiz olur:
 * uygulama acilir ama her Admin API cagrisi 403 doner.
 */

const migrateToExpiringToken = vi.fn();
const storeSession = vi.fn();

vi.mock("../src/shopify.js", () => ({
  default: {
    api: { auth: { migrateToExpiringToken } },
    config: { sessionStorage: { storeSession } },
  },
}));

const { belirteciTazele, belirtecAraKatmani } = await import("../src/oturum.js");

const oturum = (ek = {}) => ({
  shop: "magaza.myshopify.com",
  accessToken: "shpat_eski",
  isOnline: false,
  ...ek,
});

beforeEach(() => {
  migrateToExpiringToken.mockReset();
  storeSession.mockReset();
  storeSession.mockResolvedValue(true);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("belirteciTazele", () => {
  it("suresiz belirteci donusturur ve depoya yazar", async () => {
    const yeni = oturum({ accessToken: "shpat_yeni", refreshToken: "r1" });
    migrateToExpiringToken.mockResolvedValue({ session: yeni });

    const sonuc = await belirteciTazele(oturum());

    expect(migrateToExpiringToken).toHaveBeenCalledWith({
      shop: "magaza.myshopify.com",
      nonExpiringOfflineAccessToken: "shpat_eski",
    });
    expect(storeSession).toHaveBeenCalledWith(yeni);
    expect(sonuc).toBe(yeni);
  });

  it("zaten donusturulmus oturumu tekrar donusturmez", async () => {
    const mevcut = oturum({ refreshToken: "r1" });
    const sonuc = await belirteciTazele(mevcut);

    expect(migrateToExpiringToken).not.toHaveBeenCalled();
    expect(sonuc).toBe(mevcut);
  });

  it("cevrimici oturuma dokunmaz", async () => {
    const mevcut = oturum({ isOnline: true });
    await belirteciTazele(mevcut);
    expect(migrateToExpiringToken).not.toHaveBeenCalled();
  });

  it("belirteci olmayan oturuma dokunmaz", async () => {
    await belirteciTazele(oturum({ accessToken: undefined }));
    expect(migrateToExpiringToken).not.toHaveBeenCalled();
  });

  it("donusum basarisiz olursa eski oturumla devam eder", async () => {
    migrateToExpiringToken.mockRejectedValue(new Error("takas reddedildi"));
    const mevcut = oturum();

    const sonuc = await belirteciTazele(mevcut);

    expect(sonuc).toBe(mevcut);
    expect(storeSession).not.toHaveBeenCalled();
  });
});

describe("belirtecAraKatmani", () => {
  it("donusen oturumu res.locals'a geri yazar", async () => {
    const yeni = oturum({ refreshToken: "r1" });
    migrateToExpiringToken.mockResolvedValue({ session: yeni });

    const res = { locals: { shopify: { session: oturum() } } };
    const next = vi.fn();

    await belirtecAraKatmani()({}, res, next);

    expect(res.locals.shopify.session).toBe(yeni);
    expect(next).toHaveBeenCalledOnce();
  });

  it("oturum yoksa zinciri kesmez", async () => {
    const next = vi.fn();
    await belirtecAraKatmani()({}, { locals: {} }, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
