import { MemorySessionStorage } from "@shopify/shopify-app-session-storage-memory";
import { PostgreSQLSessionStorage } from "@shopify/shopify-app-session-storage-postgresql";

/**
 * Oturum deposu.
 *
 * Bellek deposu (MemorySessionStorage) uretimde kullanilamaz: Railway her
 * dagitimda ve her yeniden baslatmada konteyneri sifirdan olusturur, boylece
 * kurulu tum magazalarin erisim belirteci silinir. Magaza sahibi uygulamaya
 * her girisinde yeniden yetkilendirmeye dusuyor, arka plandaki webhook ve
 * metafield yazma islemleri ise oturum bulunamadigi icin sessizce basarisiz
 * oluyordu.
 *
 * DATABASE_URL tanimliysa kalici Postgres deposu kullanilir. Tablo adi
 * ozellikle benzersiz secildi: ayni veritabani baska bir uygulamayla
 * paylasildiginda varsayilan `shopify_sessions` tablosu cakisir.
 */
const TABLO = "satiskiti_sessions";

export function oturumDeposu() {
  const url = (process.env.DATABASE_URL || "").trim();

  if (!url) {
    console.error(
      "[CF] KRITIK: DATABASE_URL tanimli degil. Oturumlar bellekte tutulacak " +
        "ve her yeniden baslatmada silinecek. Railway Variables sekmesinden " +
        "Postgres baglantisini ekleyin."
    );
    return new MemorySessionStorage();
  }

  console.log(`[CF] Oturum deposu: Postgres (${TABLO})`);
  return new PostgreSQLSessionStorage(url, { sessionTableName: TABLO });
}
