# ConvertFlow TR — App Store'a Yükleme (Partner hesabınla)

Bu rehber, uygulamayı **sadece kendi mağazana özel kurulum** değil, **Shopify App Store'da herkese açık listeleme** için hazırlar. Sondaki fark önemli: Partner panelinde iki ayrı "Distribution" (dağıtım) yöntemi var —

| Yöntem | Ne zaman kullanılır | Onay süreci |
|---|---|---|
| **Custom distribution** | Sadece kendi mağazanda / belirli müşterilerinde kullanacaksan | Yok, anında kurulur |
| **Shopify App Store** | Herkesin bulup kurabilmesini istiyorsan | Shopify inceler, 5-10 iş günü |

Sen App Store'u istediğin için bu rehber ikinciyi anlatıyor. Toplam süre — barındırma dahil — yaklaşık 1-2 saat kurulum + inceleme bekleme süresi.

---

## Önce şunu bil: barındırma hâlâ gerekli

App Store'da listelenen bir uygulama gömülüdür (embedded), OAuth ile kurulur ve Billing API kullanır. Bunların hepsi **çalışan bir sunucu adresi** ister — bu Shopify'ın mimarisi, benim tercihim değil. Railway kullanmak zorunda değilsin ama bir barındırma seçmen gerekiyor. Aynı Dockerfile'ı destekleyen alternatifler:

- **Railway** — en hızlı kurulum, ücretsiz katmanı var
- **Render** — benzer kolaylıkta, ücretsiz katmanı var (uyku moduna geçer, ilk istek yavaş olabilir)
- **Fly.io** — ücretsiz katmanı var, biraz daha teknik kurulum

Bu rehberde Railway ile ilerliyorum çünkü en az adımı gerektiriyor. Başka birini tercih edersen sadece "Adım 2"yi değiştirmen yeterli — geri kalan hepsi aynı.

---

## Adım 1 — Partner panelinde uygulamayı bul veya oluştur

[partners.shopify.com](https://partners.shopify.com) → **Apps**.

Daha önce oluşturduysan listede görünür, aç. Oluşturmadıysan:

**Apps → Create app → Create app manually** → isim: `ConvertFlow TR`.

Açılan sayfadan **Client ID** ve **Client secret**'ı kopyala, bir kenara yaz — birazdan lazım olacak.

---

## Adım 2 — Sunucuyu yayınla

```bash
cd convertflow
git init && git add . && git commit -m "ConvertFlow TR"
git remote add origin https://github.com/KULLANICI_ADIN/convertflow.git
git push -u origin main
```

[railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → `convertflow` seç.

**Settings → Networking → Generate Domain** ile bir adres al (örnek: `convertflow-production.up.railway.app`).

**Variables** sekmesine gir:

```
SHOPIFY_API_KEY=<Adım 1'deki Client ID>
SHOPIFY_API_SECRET=<Adım 1'deki Client secret>
SCOPES=read_products
HOST=https://convertflow-production.up.railway.app
VITE_SHOPIFY_API_KEY=<Adım 1'deki Client ID>
NODE_ENV=production
PORT=3000
```

**Settings → Build → Build Arg** olarak da `VITE_SHOPIFY_API_KEY` ekle.

Deploy bitince tarayıcıda şu üç adresi kontrol et, hepsi açılmalı:

- `https://ADRESIN/health` → `{"status":"ok"}`
- `https://ADRESIN/gizlilik-politikasi` → gizlilik sayfası
- `https://ADRESIN/kullanim-kosullari` → kullanım koşulları sayfası

---

## Adım 3 — Yasal sayfalardaki yer tutucuları doldur

`web/public/gizlilik-politikasi.html` ve `web/public/kullanim-kosullari.html` içinde:

- `BURAYA_EPOSTA_ADRESI` → gerçek destek e-postan
- `<!-- GÜNCELLEME_TARİHİ -->` → bugünün tarihi

Değiştirdikten sonra tekrar push et, Railway otomatik yeniden derler.

---

## Adım 4 — `shopify.app.toml` ve kod tabanını kendi adresinle güncelle

```toml
client_id = "ADIM_1_DEKI_CLIENT_ID"
application_url = "https://convertflow-production.up.railway.app"

[auth]
redirect_urls = [
  "https://convertflow-production.up.railway.app/api/auth/callback"
]
```

Veya CLI'a otomatik doldurt:

```bash
npm install -g @shopify/cli@latest
shopify app config link
```

---

## Adım 5 — Partner panelinde teknik adresleri gir

Apps → ConvertFlow TR → **Configuration**:

- **App URL:** `https://convertflow-production.up.railway.app`
- **Allowed redirection URL(s):** `https://convertflow-production.up.railway.app/api/auth/callback`
- **Embed app in Shopify admin:** açık
- **GDPR mandatory webhooks** — üçü de:
  `https://convertflow-production.up.railway.app/api/webhooks`

**Save**.

---

## Adım 6 — Tema eklentisini yükle

```bash
cd convertflow
npm install
shopify app deploy
```

Hangi uygulamaya göndereceğini sorar → `ConvertFlow TR` seç. Sonunda **Released** yazmalı.

> Koda her değişiklikte bu komutu tekrar çalıştır. Bu komut olmadan bloklar tema düzenleyicide görünmez.

---

## Adım 7 — Kendi mağazanda test et (App Store'a göndermeden önce zorunlu adım)

Partner paneli → Apps → ConvertFlow TR → **Test your app** → **Select store** → mağazanı seç → **Install app**.

Kurulduktan sonra:

1. Uygulama panelini aç, hata var mı bak
2. Tema düzenleyicide **Blok ekle → Uygulamalar** sekmesinden dört bloğu da ürün/sepet sayfasına ekle
3. Gerçek bir ürün sayfasında taksit tablosunun, kargo çubuğunun doğru göründüğünü doğrula
4. 14 günlük deneme sürecini başlatıp Billing akışının çalıştığını kontrol et

**İnceleme ekibi tam olarak bunu yapacak.** Sende çalışmayan bir şey onlarda da çalışmaz ve red gelir.

---

## Adım 8 — App listing formunu doldur

Partner paneli → Apps → ConvertFlow TR → **Distribution**.

Şu ana kadar "Custom distribution" seçili görünüyor olabilir (Adım 7'deki test kurulumu bunu kullandı). Şimdi:

**Distribution → Shopify App Store** seçeneğine geç.

Açılan **App listing** formunda `APP_STORE_LISTING_METNI.md` dosyasındaki metinleri sırayla yapıştır:

| Form alanı | Kaynak |
|---|---|
| App name | Listing metni → "App name" |
| Tagline | Listing metni → "Tagline" |
| App introduction | Listing metni → "App introduction" |
| App details | Listing metni → "App details" |
| Feature list | Listing metni → "Feature list" |
| Category | Listing metni → "Category" |
| Pricing details | Otomatik dolar (Billing API'den çeker), görüntü metnini kontrol et |
| Support email | Kendi e-postan |
| Privacy policy URL | `https://ADRESIN/gizlilik-politikasi` |
| Screenshots | En az 3 adet, 1600x900 px — Adım 7'de kurduğun test mağazasından al |
| App icon | 1200x1200 px, PNG |

Ekran görüntüsü ve ikon **gerçek**, senin çalıştırdığın uygulamadan alınmalı — mockup kabul edilmiyor.

---

## Adım 9 — Gönder

Form tamamlanınca sayfanın altında **Submit for review** düğmesi aktif olur. Tıkla.

Shopify genellikle **5-10 iş günü** içinde döner. Üç sonuç olur:

- **Onaylandı** → uygulama App Store'da yayına girer
- **Değişiklik istendi** → e-postayla neyin eksik/hatalı olduğu söylenir, düzeltip tekrar gönderirsin
- **Reddedildi** → nadiren olur, genelde tekrarlanan değişiklik talebi sonrası

---

## En sık red sebepleri (kontrol listesi)

- [ ] Gizlilik politikası linki 404 veriyor — Adım 2'deki üç kontrolü tekrar yap
- [ ] OAuth kurulumu bir yerde hata veriyor — kendi mağazanda silip yeniden kur, dene
- [ ] Compliance webhook'ları 200 dönmüyor — Adım 5'teki adresi tekrar kontrol et
- [ ] Ekran görüntüleri düşük çözünürlükte veya mockup görünümlü
- [ ] Uygulama, listing'de vaat edileni yapmıyor (örn. "taksit hesaplar" yazıp tabloyu boş bırakmak)
- [ ] Destek e-postasına gelen test maillerine yanıt verilmiyor — inceleme sırasında gerçekten mail atabiliyorlar

---

## Onaylandıktan sonra

Uygulama App Store'da göründüğünde, kod tarafında yapacağın her güncelleme için hâlâ `shopify app deploy` çalıştırman ve önemli değişikliklerde listing'i güncellemen gerekir. Fiyat değiştirmek istersen `src/plans.js` içindeki `PLAN_DETAILS` ve `billingConfig`'i güncelleyip yeniden deploy edersin — mevcut abonelerin fiyatı otomatik değişmez, sadece yeni abone olanlar yeni fiyatı görür.
