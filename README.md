# ConvertFlow TR

[![Shopify](https://img.shields.io/badge/Shopify-App%20Store-96BF48?logo=shopify&logoColor=white)](https://apps.shopify.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20.0-brightgreen?logo=node.js)](https://nodejs.org)

> **Türk e-ticaret mağazaları için dönüşüm odaklı Shopify tema blokları.**
> 
> Taksit tablosu, ücretsiz kargo çubuğu, güven rozetleri ve kargo kesim saati sayacı — tek kurulumda, sıfır bakım maliyetiyle.

---

## 🚀 Neden ConvertFlow TR?

Türkiye'deki Shopify mağazaları en büyük dönüşüm kaybını şu 4 noktada yaşıyor:

| Problem | Etki | ConvertFlow Çözümü |
|---|---|---|
| Müşteri "pahalı" diyerek terk ediyor | Sepet terki %30-40 | **Taksit Tablosu** — aylık ödeme gösterir |
| Sepet ortalaması düşük | AOV düşüklüğü | **Kargo Çubuğu** — ücretsiz kargo eşiği görünür |
| Yeni mağazaya güvenilmiyor | Dönüşüm düşüklüğü | **Güven Rozetleri** — kapıda ödeme, iade, güvenli ödeme |
| "Sonra alırım" ertelemesi | Hemen alım düşüklüğü | **Kargo Sayacı** — gerçek kesim saati ile aciliyet yaratır |

**Hiçbir dış servise bağlanmaz.** SMS sağlayıcısı, ödeme sağlayıcısı, API anahtarı, veritabanı — hiçbiri gerekmez. Tüm veri Shopify'ın kendi Liquid nesnelerinden gelir. Kurduğun anda çalışır.

---

## 📦 Kutudan Çıkan Bloklar

### 1. Taksit Tablosu
2.499 ₺ ürünü **"12 x 224,91 ₺"** olarak gösterir. Varyant değiştikçe tutarlar anında güncellenir. Türkiye'de yüksek fiyatlı ürün satın alma kararı taksitle verilir — fiyatı aylık ödemeye çevirmek algılanan maliyeti düşürür.

### 2. Ücretsiz Kargo Çubuğu
**"Ücretsiz kargoya 180 ₺ kaldı"** — sepet ortalamasını doğrudan yükseltir. Müşteri eşiği görünce bir ürün daha ekler.

### 3. Güven Rozetleri
Kapıda ödeme, iade süresi, güvenli ödeme gibi sunduğun hizmetleri ürün sayfasında görünür kılar. Yeni mağazalarda en büyük terk sebebi güvensizliktir.

### 4. Kargo Kesim Saati Sayacı
**"Bugün kargoda: 3 saat 12 dakika içinde sipariş ver"** — gerçek bir son tarih, kararı erteleme alışkanlığını kırar. Stok adediyle birlikte çalışır.

> **Sahte "şu an 14 kişi bakıyor" sayacı bilerek konmadı.** Uydurma veridir, tüketiciyi yanıltır, Shopify uygulama incelemesinde ret sebebidir ve TKHK kapsamında yaptırımı vardır. Bunun yerine gerçek stok adedi ve gerçek kargo kesim saati kullanılıyor — bunlar da dönüşümü artırır, üstelik yasal.

---

## 💰 Gelir Modeli

Shopify Billing API ile aylık abonelik:

| Paket | Fiyat | İçerik |
|---|---|---|
| **Başlangıç** | $9.99/ay | Taksit tablosu + Kargo çubuğu + Güven rozetleri + Sınırsız ürün |
| **Pro** | $19.99/ay | Tüm bloklar + Kargo sayacı + Stok uyarısı + Öncelikli destek |

- **14 gün ücretsiz deneme** — kredi kartı gerekmez.
- Shopify parayı mağazadan tahsil edip komisyonunu düşerek sana öder.
- Kendi ödeme altyapını kurmana gerek yok.
- Uygulama hiçbir işletim maliyeti üretmediği için (SMS ücreti yok, veritabanı yok) **marjın neredeyse %100**.

---

## 🏗️ Teknik Mimarisi

```
convertflow-tr/
├── src/                        Express sunucusu (~200 satır)
│   ├── index.js                OAuth, abonelik, panel servisi, health check
│   ├── shopify.js              Shopify app yapılandırması (veritabanı YOK)
│   ├── plans.js                Paketler ve fiyatlandırma
│   ├── lisans.js               Abonelik durumunu tema metafield'ine yazar
│   └── webhooks.js             app/uninstalled + zorunlu KVKK webhook'ları
├── web/                        Polaris yönetim paneli (React + Vite)
│   ├── src/App.jsx             Sekmeli onboarding + ayarlar + performans
│   └── public/                 Yasal sayfalar (App Store zorunlu)
├── extensions/convertflow-tr/  ★ Uygulamanın asıl işi burada
│   ├── blocks/
│   │   ├── taksit.liquid
│   │   ├── kargo-bari.liquid
│   │   ├── guven-rozetleri.liquid
│   │   └── kargo-suresi.liquid
│   └── assets/{convertflow.css, convertflow.js}
├── Dockerfile
└── shopify.app.toml
```

**Neden sıfır maliyet?**
- **Veritabanı yok:** Tüm ayarlar tema metafield'lerinde tutulur.
- **Dış API yok:** SMS, ödeme, kargo firması entegrasyonu gerekmez.
- **Sunucu maliyeti yok:** Railway ücretsiz katmanıyla başlar, ölçeklendikçe $5/ay.
- **Marj %100:** Shopify Billing API ile tahsilat, komisyonu düşüp direkt hesabına yatar.

---

## ⚡ Hızlı Başlangıç (20 dakika)

### Adım 1 — Araçları kur
```bash
node -v                          # 20 veya üstü olmalı
npm install -g @shopify/cli@latest
shopify version
```

### Adım 2 — Partner panelinde uygulamayı oluştur
1. [partners.shopify.com](https://partners.shopify.com) → **Apps** → **Create app**
2. **Create app manually** → isim: `ConvertFlow TR`
3. Client ID ve Client secret'ı kopyala

### Adım 3 — Sunucuyu yayınla
```bash
git clone https://github.com/busseozgenoglu-cyber/shopifyapp1.git convertflow-tr
cd convertflow-tr
npm install
```

[Railway](https://railway.app) → **New Project → Deploy from GitHub repo** → `convertflow-tr` seç.

**Settings → Networking → Generate Domain** ile adres al.

**Variables** sekmesine gir:
```
SHOPIFY_API_KEY=<Client ID>
SHOPIFY_API_SECRET=<Client secret>
SCOPES=read_products
HOST=https://ADRESIN.up.railway.app
VITE_SHOPIFY_API_KEY=<Client ID>
NODE_ENV=production
PORT=3000
```

Deploy bitince kontrol et:
- `https://ADRESIN/health` → `{"status":"ok","version":"1.0.0"}`
- `https://ADRESIN/gizlilik-politikasi` → gizlilik sayfası
- `https://ADRESIN/kullanim-kosullari` → kullanım koşulları sayfası

### Adım 4 — shopify.app.toml güncelle
```toml
client_id = "CLIENT_ID"
application_url = "https://ADRESIN.up.railway.app"

[auth]
redirect_urls = [
  "https://ADRESIN.up.railway.app/api/auth/callback"
]
```

### Adım 5 — Partner panelinde adresleri gir
- **App URL:** `https://ADRESIN.up.railway.app`
- **Allowed redirection URL(s):** `https://ADRESIN.up.railway.app/api/auth/callback`
- **Embed app in Shopify admin:** açık
- **GDPR mandatory webhooks:** `https://ADRESIN.up.railway.app/api/webhooks`

### Adım 6 — Tema eklentisini yükle
```bash
npm install
shopify app deploy
```

### Adım 7 — App Store'a yükle
Partner panelinde **Distribution → Public → Shopify App Store** seç. Listing metinleri için `APP_STORE_LISTING_METNI.md` dosyasına bak.

---

## 📋 App Store'a Yükleme Kontrol Listesi

- [ ] Gizlilik politikası sayfası gerçekten açılıyor mu?
- [ ] Destek e-postası çalışıyor mu?
- [ ] Uygulama adı App Store'da başka biri tarafından kullanılmıyor mu?
- [ ] En az 3 ekran görüntüsü hazır mı? (1600x900, gerçek mağazadan)
- [ ] 1200x1200 ikon hazır mı?
- [ ] Kendi test mağazanda uygulamayı kurup denedin mi?

---

## 🛡️ Yasal Uyum

- **KVKK:** `customers/data_request`, `customers/redact`, `shop/redact` webhook'ları aktif.
- **Gizlilik politikası:** Müşteri verisi toplanmaz veya saklanmaz.
- **TKHK:** Sahte sayaçlar ve yanıltıcı veri kullanılmaz.

---

## 📄 Lisans

MIT License — [LICENSE](LICENSE) dosyasına bakın.

---

<p align="center">
  <b>ConvertFlow TR</b> — Türk e-ticaretinin dönüşüm motoru 🚀
</p>
