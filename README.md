# Satış Kiti

Türk e-ticaret mağazaları için Shopify uygulaması. Ürün sayfasına **taksit tablosu**, sepete **ücretsiz kargo çubuğu**, ürün sayfasına **güven rozetleri** ve **kargo kesim saati sayacı** ekler.

**Hiçbir dış servise bağlanmaz.** SMS sağlayıcısı, ödeme sağlayıcısı, API anahtarı, veritabanı — hiçbiri gerekmez. Tüm veri Shopify'ın kendi Liquid nesnelerinden gelir. Kurduğun anda çalışır.

---

## Neden bu dört blok

| Blok | Ne yapar | Neden para kazandırır |
|---|---|---|
| Taksit tablosu | 2.499 ₺ ürünü "12 x 224,91 ₺" olarak gösterir | Türkiye'de yüksek fiyatlı ürün satın alma kararı taksitle verilir. Fiyatı aylık ödemeye çevirmek algılanan maliyeti düşürür. |
| Ücretsiz kargo çubuğu | "Ücretsiz kargoya 180 ₺ kaldı" | Sepet ortalamasını doğrudan yükseltir. Müşteri eşiği görünce bir ürün daha ekler. |
| Güven rozetleri | Kapıda ödeme, iade, güvenli ödeme | Yeni mağazalarda en büyük terk sebebi güvensizliktir. |
| Kargo saati + stok | "Bugün kargoda: 3 saat 12 dakika içinde sipariş ver" | Gerçek bir son tarih, kararı erteleme alışkanlığını kırar. |

> **Sahte "şu an 14 kişi bakıyor" sayacı bilerek konmadı.** Uydurma veridir, tüketiciyi yanıltır, Shopify uygulama incelemesinde ret sebebidir ve TKHK kapsamında yaptırımı vardır. Bunun yerine gerçek stok adedi ve gerçek kargo kesim saati kullanılıyor — bunlar da dönüşümü artırır, üstelik yasal.

**Sana nasıl gelir olur:** Shopify Billing API ile aylık $9.99 / $19.99 abonelik. Shopify parayı mağazadan tahsil edip komisyonunu düşerek sana öder. Kendi ödeme altyapını kurmana gerek yok. Uygulama hiçbir işletim maliyeti üretmediği için (SMS ücreti yok, veritabanı yok) marjın neredeyse %100.

---

## Yapı

```
satiskiti/
├── src/                        Küçük Express sunucusu (yaklaşık 150 satır)
│   ├── index.js                OAuth, abonelik, panel servisi
│   ├── shopify.js              Shopify app yapılandırması (veritabanı YOK)
│   ├── plans.js                Paketler ve fiyatlar
│   ├── lisans.js               Abonelik durumunu tema metafield'ine yazar
│   └── webhooks.js             app/uninstalled + zorunlu KVKK webhook'ları
├── web/                        Polaris yönetim paneli (tek sayfa)
├── extensions/satis-kiti/      ★ Uygulamanın asıl işi burada
│   ├── blocks/
│   │   ├── taksit.liquid
│   │   ├── kargo-bari.liquid
│   │   ├── guven-rozetleri.liquid
│   │   └── kargo-suresi.liquid
│   └── assets/{satiskiti.css, satiskiti.js}
├── Dockerfile
└── shopify.app.toml
```

Ayarların tamamı tema düzenleyicide tutulur, bu yüzden uygulamanın saklaması gereken kalıcı veri yoktur. Veritabanı, migration, Prisma — hiçbiri yok.

---

# Shopify'a yükleme: adım adım

Toplam süre yaklaşık 20 dakika. Sıra önemli.

## Adım 1 — Bilgisayarına araçları kur

```bash
node -v                          # 20 veya üstü olmalı
npm install -g @shopify/cli@latest
shopify version
```

## Adım 2 — Partner panelinde uygulamayı oluştur

1. [partners.shopify.com](https://partners.shopify.com) → **Apps** → **Create app** → **Create app manually**
2. İsim: `Satış Kiti`
3. Açılan sayfada **Client ID** ve **Client secret** değerlerini kopyala, bir kenara yaz.

## Adım 3 — Kodu GitHub'a at

```bash
cd satiskiti
git init
git add .
git commit -m "Satis Kiti ilk surum"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/satiskiti.git
git push -u origin main
```

## Adım 4 — Sunucuyu Railway'e yükle

Uygulamanın yönetim paneli için tek bir adres gerekiyor. Veritabanı **eklemene gerek yok**.

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → `satiskiti`
2. **Settings → Networking → Generate Domain** → adresi kopyala
   (örnek: `satiskiti-production.up.railway.app`)
3. **Variables** sekmesine şunları gir:

```
SHOPIFY_API_KEY=<Adım 2'deki Client ID>
SHOPIFY_API_SECRET=<Adım 2'deki Client secret>
SCOPES=read_products
HOST=https://satiskiti-production.up.railway.app
VITE_SHOPIFY_API_KEY=<Adım 2'deki Client ID>
NODE_ENV=production
PORT=3000
```

4. **Settings → Build** bölümünde **Build Arg** olarak `VITE_SHOPIFY_API_KEY` ekle, değeri Client ID.
   (Panel derlenirken bu değer HTML'e gömülüyor; eksikse panel açılır ama API'ye bağlanamaz.)

5. Deploy bitince `https://ADRESIN/health` adresini tarayıcıda aç. `{"status":"ok"}` görmelisin.

## Adım 5 — Partner panelinde adresleri gir

Apps → Satış Kiti → **Configuration**:

- **App URL:** `https://satiskiti-production.up.railway.app`
- **Allowed redirection URL(s):** `https://satiskiti-production.up.railway.app/api/auth/callback`
- **Embed app in Shopify admin:** açık
- **Compliance webhooks** — üçünün de adresi:
  `https://satiskiti-production.up.railway.app/api/webhooks`

Kaydet.

## Adım 6 — `shopify.app.toml` dosyasını kendi değerlerinle güncelle

```toml
client_id = "ADIM_2_DEKI_CLIENT_ID"
application_url = "https://satiskiti-production.up.railway.app"

[auth]
redirect_urls = [
  "https://satiskiti-production.up.railway.app/api/auth/callback"
]
```

Alternatif olarak CLI'ın kendisi doldursun:

```bash
shopify app config link
```

## Adım 7 — Tema eklentisini Shopify'a gönder

**Bu komut uygulamanın asıl işini yükleyen komuttur.** Liquid bloklarını, CSS'i ve JS'i Shopify'ın sunucularına yükler:

```bash
npm install
shopify app deploy
```

CLI hangi uygulamaya göndereceğini sorar, `Satış Kiti`'ni seç. Sonunda bir sürüm numarası verir ve **Released** yazar.

> Kodda her değişiklik yaptığında bu komutu tekrar çalıştırman gerekir. Railway'e push etmek tema eklentisini güncellemez — ikisi ayrı kanaldır.

## Adım 8 — Mağazaya kur

Partner paneli → Apps → Satış Kiti → **Test your app** → **Select store** → mağazanı seç → **Install app**.

Uygulama gömülü panelde açılır.

## Adım 9 — Blokları tema düzenleyicide yerleştir

Bu adım atlanırsa mağazada hiçbir şey görünmez — eklenti yüklüdür ama tema onu çağırmıyordur.

**Taksit tablosu için:**

1. Shopify admin → **Online Store** → **Themes** → **Customize**
2. Üstteki sayfa seçicisinden **Products** → **Default product**
3. Ürün bilgisi bölümünde **Add block** → **Apps** sekmesi → **Taksit tablosu**
4. Bloğu fiyatın hemen altına sürükle
5. Sağdaki panelden **taksit planını** kendi banka anlaşmana göre gir:
   `3:0, 6:0, 9:4.5, 12:8`
   → 3 ve 6 taksit vade farksız, 9 taksitte %4.5, 12 taksitte %8 fark
6. **Save**

**Ücretsiz kargo çubuğu için:** sayfa seçicisinden **Cart** → **Add block** → **Apps** → **Ücretsiz kargo çubuğu** → eşiği gir (75000 = 750 ₺) → Save

**Güven rozetleri** ve **Kargo saati ve stok** için de aynı şekilde ürün sayfasına ekle.

## Adım 10 — Kontrol et

Mağazanda 500 ₺ üzeri bir ürüne git. Taksit tablosunu görmelisin. Varyant değiştir — tutarların anında güncellendiğini doğrula.

---

## Uygulama mağazasında satmak istersen

Kendi mağazanda kullanmak için yukarısı yeterli. Başkalarına satmak için ek olarak:

1. **Gizlilik politikası URL'i** ve **destek e-postası** — Partner panelinde **App listing** bölümünde zorunlu
2. **Ekran görüntüleri** — en az 3 adet, 1600x900
3. **Uygulama simgesi** — 1200x1200
4. `shopify.app.toml` içindeki isim ve handle'ı kesinleştir
5. Partner paneli → **Distribution** → **Shopify App Store** → **Submit for review**

İnceleme genellikle 5–10 iş günü sürer. En sık ret sebepleri: eksik compliance webhook'ları (bu projede hazır), çalışmayan OAuth akışı, ve ekran görüntülerinin uygulamayı temsil etmemesi.

---

## Yerelde geliştirme

```bash
npm install
npm --prefix web install
shopify app dev
```

CLI otomatik tünel açar, tema düzenleyicide değişiklikleri canlı görürsün.

---

## Sorun giderme

| Belirti | Sebep ve çözüm |
|---|---|
| Tema düzenleyicide **Apps** sekmesi boş | `shopify app deploy` çalıştırılmamış ya da başka bir uygulamaya gönderilmiş |
| Panel açılıyor, "Beklenmeyen bir hata" diyor | `VITE_SHOPIFY_API_KEY` build arg olarak verilmemiş. Railway → Settings → Build → Build Arg ekle, sonra **Redeploy** |
| Kurulumda "redirect_uri is not whitelisted" | Adım 5'teki redirect URL, `HOST` değeriyle birebir aynı olmalı. Sonunda `/` olmamalı |
| Taksit tablosu görünmüyor | Ürün fiyatı `alt_limit` ayarının altında olabilir. Varsayılan 50000 kuruş = 500 ₺ |
| Taksit tutarları yanlış | Taksit planındaki oranlar bankanın vade farkı oranı olmalı, ürün kârı değil. POS sözleşmendeki tablodan al |
| Varyant değişince tutar güncellenmiyor | Tema özel bir varyant seçici kullanıyor olabilir. `assets/satiskiti.js` içindeki olay dinleyicilerine temanın kendi olayını ekle |
| Kargo çubuğu sepette güncellenmiyor | Tema sepeti XHR ile güncelliyor olabilir. Betik `fetch`'i yakalar; XHR için sayfa yenilemesinde yine doğru gösterir |

---

## Yasal not

- Güven rozetlerine **sadece gerçekten sunduğun** hizmetleri yaz. Sunmadığın bir iade veya kargo sözü Tüketicinin Korunması Hakkında Kanun kapsamında yaptırıma tabidir.
- Taksit tablosu bilgilendirme amaçlıdır; kesin tutarı bankanın POS'u belirler. Bloktaki dipnot bunu belirtir, silme.
- Uygulama hiçbir kişisel veri toplamaz ve saklamaz. Zorunlu KVKK/GDPR webhook'ları "saklanan veri yok" yanıtı verecek şekilde hazır.
