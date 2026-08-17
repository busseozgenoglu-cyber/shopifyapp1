import { describe, expect, it } from "vitest";
import {
  PLANS,
  PLAN_DETAILS,
  billingConfig,
  NAME_TO_KEY,
  KEY_TO_NAME,
} from "../src/plans.js";

/**
 * Panelde gosterilen fiyat ile Shopify'a bildirilen tutar ayrisirsa magaza
 * sahibi ilan edilenden farkli bir tutarla ucretlendirilir. Inceleme bunu
 * yaniltici fiyatlandirma sayar; bu yuzden iki kaynak burada karsilastiriliyor.
 */

describe("paket tanimlari", () => {
  it("panelde gosterilen fiyat faturalandirma tutariyla ayni", () => {
    for (const paket of PLAN_DETAILS) {
      expect(billingConfig[paket.name].amount).toBe(paket.price);
    }
  });

  it("her paketin faturalandirma karsiligi var", () => {
    for (const paket of PLAN_DETAILS) {
      expect(billingConfig[paket.name]).toBeDefined();
    }
    expect(Object.keys(billingConfig)).toHaveLength(PLAN_DETAILS.length);
  });

  it("ad <-> anahtar eslemesi her iki yonde tutarli", () => {
    for (const paket of PLAN_DETAILS) {
      expect(NAME_TO_KEY[paket.name]).toBe(paket.key);
      expect(KEY_TO_NAME[paket.key]).toBe(paket.name);
    }
  });

  it("tum paketler ayni para biriminde ve aylik", () => {
    for (const ayar of Object.values(billingConfig)) {
      expect(ayar.currencyCode).toBe("USD");
      expect(ayar.interval).toBe("EVERY_30_DAYS");
    }
  });

  it("deneme suresi tanimli ve makul", () => {
    for (const ayar of Object.values(billingConfig)) {
      expect(ayar.trialDays).toBeGreaterThan(0);
      expect(ayar.trialDays).toBeLessThanOrEqual(30);
    }
  });

  it("paket adlari PLANS sabitinden geliyor", () => {
    const adlar = PLAN_DETAILS.map((p) => p.name);
    expect(adlar).toEqual(Object.values(PLANS));
  });
});
