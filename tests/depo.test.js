import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

/**
 * Uretimde bellek deposuna dusmek, kurulu tum magazalarin belirtecini her
 * yeniden baslatmada silmek demek. Bu testler o secimin yanlislikla geri
 * gelmesini engelliyor.
 */

class SahteMemory {}
class SahtePostgres {
  constructor(url, opts) {
    this.url = url;
    this.opts = opts;
  }
}

vi.mock("@shopify/shopify-app-session-storage-memory", () => ({
  MemorySessionStorage: SahteMemory,
}));
vi.mock("@shopify/shopify-app-session-storage-postgresql", () => ({
  PostgreSQLSessionStorage: SahtePostgres,
}));

const { oturumDeposu } = await import("../src/depo.js");

const eski = process.env.DATABASE_URL;

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  if (eski === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = eski;
});

describe("oturumDeposu", () => {
  it("DATABASE_URL varsa Postgres kullanir", () => {
    process.env.DATABASE_URL = "postgres://kullanici:sifre@host:5432/db";
    expect(oturumDeposu()).toBeInstanceOf(SahtePostgres);
  });

  it("varsayilan tablo adini kullanmaz (baska uygulamayla cakismasin)", () => {
    process.env.DATABASE_URL = "postgres://kullanici:sifre@host:5432/db";
    const depo = oturumDeposu();
    expect(depo.opts.sessionTableName).toBe("satiskiti_sessions");
    expect(depo.opts.sessionTableName).not.toBe("shopify_sessions");
  });

  it("DATABASE_URL yoksa bellege duser ve kritik uyari basar", () => {
    delete process.env.DATABASE_URL;
    const hata = vi.spyOn(console, "error");
    expect(oturumDeposu()).toBeInstanceOf(SahteMemory);
    expect(hata.mock.calls.flat().join(" ")).toMatch(/KRITIK/);
  });

  it("bos/bosluklu DATABASE_URL degerini tanimsiz sayar", () => {
    process.env.DATABASE_URL = "   ";
    expect(oturumDeposu()).toBeInstanceOf(SahteMemory);
  });
});
