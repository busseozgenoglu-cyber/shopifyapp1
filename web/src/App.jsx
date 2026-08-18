import { useCallback, useEffect, useState } from "react";
import {
  Frame,
  Page,
  Card,
  BlockStack,
  InlineStack,
  InlineGrid,
  Text,
  Button,
  Badge,
  Banner,
  List,
  Toast,
  Spinner,
  Divider,
  Tabs,
  Box,
  ProgressBar,
} from "@shopify/polaris";

async function istek(yol, secenekler = {}) {
  const yanit = await fetch(yol, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...secenekler,
  });

  const metin = await yanit.text();

  // Oturum düştüğünde sunucu, App Bridge'in yeniden yetkilendirmesi için JSON
  // yerine HTML döndürür. JSON.parse burada ham bir sözdizimi hatası fırlatıp
  // paneli komple çökertiyordu; anlaşılır bir hataya çeviriyoruz.
  let veri = null;
  if (metin) {
    try {
      veri = JSON.parse(metin);
    } catch {
      throw new Error("Oturum doğrulanamadı. Sayfayı yenileyin.");
    }
  }

  if (!yanit.ok) throw new Error(veri?.error || "İstek başarısız oldu.");
  return veri;
}

function SvgIcon({ path, color = "#4F46E5", size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {path}
    </svg>
  );
}

const ICONS = {
  taksit: <SvgIcon color="#4F46E5" path={<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M7 15h.01"/><path d="M12 15h.01"/><path d="M17 15h.01"/></>} />,
  kargo: <SvgIcon color="#10B981" path={<><path d="M1 7h13v9H1z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/></>} />,
  guven: <SvgIcon color="#F59E0B" path={<><path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></>} />,
  saat: <SvgIcon color="#EC4899" path={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>} />,
  indirim: <SvgIcon color="#DC2626" path={<><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>} />,
  check: <SvgIcon color="#10B981" size={18} path={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} />,
  external: <SvgIcon color="#4F46E5" size={18} path={<><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>} />,
  help: <SvgIcon color="#64748B" size={18} path={<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>} />,
  chevron: <SvgIcon color="#4F46E5" size={18} path={<><circle cx="12" cy="12" r="10"/><polyline points="12 16 16 12 12 8"/><line x1="8" y1="12" x2="16" y2="12"/></>} />,
  settings: <SvgIcon color="#64748B" size={18} path={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />,
  chart: <SvgIcon color="#64748B" size={18} path={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>} />,
};

const BLOKLAR = [
  {
    ad: "Taksit Tablosu",
    yer: "Ürün sayfası",
    aciklama: "Ürün fiyatını taksit planına böler. Varyant değişince tutar anında güncellenir. Türkiye'de satın alma kararını %40 hızlandırır.",
    ikon: ICONS.taksit,
    renk: "bg-surface-info",
    etiket: "En çok kullanılan",
  },
  {
    ad: "Ücretsiz Kargo Çubuğu",
    yer: "Sepet sayfası",
    aciklama: "Ücretsiz kargoya ne kadar kaldığını gösterir. Sepet ortalamasını %15-25 yükseltir. Hedefe ulaşınca confetti patlar! 🎉",
    ikon: ICONS.kargo,
    renk: "bg-surface-success",
    etiket: "AOV artırıcı",
  },
  {
    ad: "Güven Rozetleri",
    yer: "Ürün sayfası",
    aciklama: "Kapıda ödeme, iade, güvenli ödeme gibi hizmetlerini görünür kılar. Yeni mağazalarda güven en büyük terk sebebidir.",
    ikon: ICONS.guven,
    renk: "bg-surface-caution",
    etiket: "Güven artırıcı",
  },
  {
    ad: "Kargo Saati & Stok",
    yer: "Ürün sayfası",
    aciklama: "Kargo kesim saatine kalan süreyi ve gerçek stok adedini gösterir. 'Hemen al' hissiyatı yaratır.",
    ikon: ICONS.saat,
    renk: "bg-surface-warning",
    etiket: "Aciliyet yaratır",
  },
  {
    ad: "İndirim Sayacı",
    yer: "Ürün sayfası",
    aciklama: "Gerçek indirim bitiş tarihine geri sayım + stok aciliyet çubuğu. 'Fırsat kaçmadan al' hissiyatı yaratır. Sayaç bitince confetti!",
    ikon: ICONS.indirim,
    renk: "bg-surface-critical",
    etiket: "Pro paket",
  },
];

const ADIMLAR = [
  { baslik: "Uygulamayı mağazana bağla", aciklama: "OAuth kurulumu tamamlandı", tamam: true },
  { baslik: "Blokları tema düzenleyiciye ekle", aciklama: "Taksit, kargo, rozet, kargo saati ve indirim sayacı", tamam: false },
  { baslik: "Paketini seç ve yayına al", aciklama: "14 gün ücretsiz dene, istediğin an iptal et", tamam: false },
];

/* ---------- Confetti Component ---------- */
function Confetti({ active }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!active) return;
    const colors = ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#DC2626', '#06B6D4'];
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
    }));
    setPieces(newPieces);
    const t = setTimeout(() => setPieces([]), 5000);
    return () => clearTimeout(t);
  }, [active]);

  if (!pieces.length) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `cf-confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes cf-confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [magaza, setMagaza] = useState(null);
  const [abonelik, setAbonelik] = useState(null);
  const [mesgul, setMesgul] = useState(null);
  const [toast, setToast] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aktifSekme, setAktifSekme] = useState(0);
  const [kurulumAdimlari, setKurulumAdimlari] = useState(ADIMLAR);
  const [confetti, setConfetti] = useState(false);
  const [hata, setHata] = useState(null);

  const yukle = useCallback(async () => {
    setHata(null);
    try {
      const [m, a] = await Promise.all([istek("/api/magaza"), istek("/api/abonelik")]);
      setMagaza(m);
      setAbonelik(a);
      if (a.aktif) {
        istek("/api/lisans", { method: "POST", body: JSON.stringify({ aktif: true }) });
        setKurulumAdimlari((onceki) =>
          onceki.map((adim, i) => (i === 2 ? { ...adim, tamam: true } : adim))
        );
        setConfetti(true);
      }
    } catch (err) {
      // Veri gelmediyse ana ekran boş alanlara dokunup çökebiliyor; bu durumu
      // ayrı bir ekranda gösterip yeniden denemeye izin veriyoruz.
      setHata(err.message);
      setToast({ mesaj: err.message, hata: true });
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    yukle();
  }, [yukle]);

  const abone = async (anahtar) => {
    setMesgul(anahtar);
    try {
      const { onayUrl } = await istek("/api/abonelik", {
        method: "POST",
        body: JSON.stringify({ plan: anahtar }),
      });
      window.open(onayUrl, "_top");
    } catch (err) {
      setToast({ mesaj: err.message, hata: true });
      setMesgul(null);
    }
  };

  const temaAc = () => {
    if (!magaza?.domain) return;
    const isim = magaza.domain.replace(".myshopify.com", "");
    window.open(`https://admin.shopify.com/store/${isim}/themes/current/editor`, "_blank");
  };

  const tamamlananAdim = kurulumAdimlari.filter((a) => a.tamam).length;
  const ilerlemeYuzde = Math.round((tamamlananAdim / kurulumAdimlari.length) * 100);

  // `icon` verildiğinde Polaris sekme metnini gizleyip yalnızca simgeyi
  // çiziyordu; sekmelerin hangisi olduğu anlaşılmıyordu. Metin tek başına
  // yeterli, simgeler zaten emoji olarak içerikte.
  const sekmeler = [
    { id: "kurulum", content: "🚀 Kurulum", panelID: "panel-kurulum" },
    { id: "bloklar", content: "🎨 Bloklar", panelID: "panel-bloklar" },
    { id: "paketler", content: "💎 Paketler", panelID: "panel-paketler" },
  ];

  if (yukleniyor) {
    return (
      <Frame>
        <Page>
          <BlockStack align="center" inlineAlign="center" gap="400">
            <Spinner accessibilityLabel="Yükleniyor" size="large" />
            <Text as="p" variant="bodyLg" tone="subdued">
              Satış Kiti hazırlanıyor...
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Satış artırıcı bloklar yükleniyor
            </Text>
          </BlockStack>
        </Page>
      </Frame>
    );
  }

  if (hata || !magaza) {
    return (
      <Frame>
        <Page title="Satış Kiti">
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Mağaza bilgileri alınamadı
              </Text>
              <Text as="p" tone="subdued">
                {hata || "Beklenmeyen bir durum oluştu."} Sayfayı yenilemek çoğu
                durumda yeterli oluyor.
              </Text>
              <InlineStack gap="200">
                <Button variant="primary" onClick={yukle}>
                  Yeniden dene
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Sayfayı yenile
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Page>
      </Frame>
    );
  }

  return (
    <Frame>
      <Confetti active={confetti} />
      <Page
        title="Satış Kiti"
        subtitle="Türk e-ticaret mağazaları için dönüşüm odaklı satış artırıcı bloklar"
        primaryAction={{
          content: "Tema Düzenleyiciyi Aç",
          icon: ICONS.external,
          onAction: temaAc,
        }}
        secondaryActions={[
          {
            content: "Yardım",
            icon: ICONS.help,
            // Var olmayan bir yardım sitesine link vermek yerine doğrudan
            // destek adresine yazdırıyoruz; inceleme ölü bağlantıları reddediyor.
            onAction: () =>
              window.open(
                "mailto:busseozgenoglu@gmail.com?subject=Satış%20Kiti%20destek",
                "_blank"
              ),
          },
        ]}
      >
        <BlockStack gap="500">
          <Banner
            tone={abonelik?.aktif ? "success" : "info"}
            title={
              abonelik?.aktif
                ? `🎉 ${abonelik.planAdi} paketi aktif — mağazan hazır!`
                : "Mağazanı 2 dakikada hazır hale getir"
            }
          >
            <p>
              {abonelik?.aktif
                ? "Tüm 5 bloğu tema düzenleyicide istediğin yere ekleyebilirsin. Performansını 'Paketler' sekmesinden takip et."
                : "Aşağıdaki adımları izle, sonra bir paket seç. İlk 14 gün ücretsiz — kredi kartı gerekmez."}
            </p>
          </Banner>

          <Tabs tabs={sekmeler} selected={aktifSekme} onSelect={setAktifSekme} fitted>
            <BlockStack gap="500">
              {aktifSekme === 0 && (
                <>
                  <Card>
                    <BlockStack gap="500">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h2" variant="headingMd">Kurulum İlerlemesi</Text>
                        <Badge tone={ilerlemeYuzde === 100 ? "success" : "info"}>
                          {tamamlananAdim} / {kurulumAdimlari.length} tamamlandı
                        </Badge>
                      </InlineStack>
                      <ProgressBar progress={ilerlemeYuzde} size="medium" />
                      <BlockStack gap="400">
                        {kurulumAdimlari.map((adim, i) => (
                          <InlineStack key={i} gap="300" blockAlign="start">
                            <Box>
                              {adim.tamam ? ICONS.check : (
                                <Text as="span" variant="bodyLg" tone="subdued">{i + 1}</Text>
                              )}
                            </Box>
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingSm" tone={adim.tamam ? "subdued" : undefined}>
                                {adim.baslik}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">{adim.aciklama}</Text>
                            </BlockStack>
                          </InlineStack>
                        ))}
                      </BlockStack>
                      <InlineStack gap="300" wrap={false}>
                        <Button variant="primary" onClick={temaAc} icon={ICONS.external}>
                          Tema Düzenleyiciyi Aç
                        </Button>
                        <Button variant="secondary" onClick={() => setAktifSekme(2)}>
                          Paket Seç
                        </Button>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                  <Card>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd">🎯 Nasıl Blok Eklenir?</Text>
                      <List type="number">
                        <List.Item><b>Tema düzenleyiciyi aç</b> — yukarıdaki düğmeye tıkla.</List.Item>
                        <List.Item>Sol üstten düzenlemek istediğin sayfayı seç — taksit ve indirim için <b>Ürün sayfaları</b>, kargo için <b>Sepet</b>.</List.Item>
                        <List.Item>İlgili bölümde <b>Blok ekle</b> → <b>Uygulamalar</b> sekmesi → <b>Satış Kiti</b> altından bloğu seç.</List.Item>
                        <List.Item>Sağdaki panelden ayarları düzenle (renk, mesaj, tarih), <b>Kaydet</b>'e bas.</List.Item>
                      </List>
                    </BlockStack>
                  </Card>
                </>
              )}

              {aktifSekme === 1 && (
                <>
                  <Card>
                    <BlockStack gap="500">
                      <Text as="h2" variant="headingMd">🎨 5 Satış Artırıcı Blok</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Her blok tema düzenleyicide sürükle-bırak ile kurulur. Kod bilgisi gerekmez. Tüm veriler Shopify'dan gelir.
                      </Text>
                      <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                        {BLOKLAR.map((b) => (
                          <Card key={b.ad}>
                            <BlockStack gap="300">
                              <InlineStack gap="200" blockAlign="center" wrap={false}>
                                {b.ikon}
                                <Text as="h3" variant="headingSm">{b.ad}</Text>
                                <Badge tone="info">{b.etiket}</Badge>
                              </InlineStack>
                              <Text as="p" variant="bodySm" tone="subdued">{b.aciklama}</Text>
                              <Text as="p" variant="bodySm" tone="subdued">📍 <b>{b.yer}</b></Text>
                            </BlockStack>
                          </Card>
                        ))}
                      </InlineGrid>
                    </BlockStack>
                  </Card>
                  <Banner tone="success" title="💡 Neden bu 5 blok?">
                    <p>Türkiye'de Shopify mağazaları en çok bu 5 noktada dönüşüm kaybediyor: fiyat algısı, kargo şeffaflığı, güven eksikliği, erteleme alışkanlığı ve indirim fırsatlarını kaçırma. Satış Kiti hepsini tek uygulamada çözer.</p>
                  </Banner>
                </>
              )}

              {aktifSekme === 2 && (
                <>
                  <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                    {(magaza?.planlar || []).map((p) => {
                      const secili = abonelik?.plan === p.key;
                      return (
                        <Card key={p.key}>
                          <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                              <Text as="h3" variant="headingLg">{p.name}</Text>
                              {secili && <Badge tone="success">✓ Aktif</Badge>}
                            </InlineStack>
                            <Text as="p" variant="heading2xl">
                              ${p.price}
                              <Text as="span" variant="bodySm" tone="subdued">{" "}/ ay</Text>
                            </Text>
                            <List type="bullet">
                              {p.features.map((f) => (
                                <List.Item key={f}>{f}</List.Item>
                              ))}
                            </List>
                            <Button
                              variant={secili ? "secondary" : "primary"}
                              disabled={secili}
                              loading={mesgul === p.key}
                              onClick={() => abone(p.key)}
                              fullWidth
                            >
                              {secili ? "✓ Kullanılıyor" : "🚀 14 gün ücretsiz dene"}
                            </Button>
                          </BlockStack>
                        </Card>
                      );
                    })}
                  </InlineGrid>
                  <Banner tone="info">
                    <p>💳 Ödeme Shopify faturana eklenir. İstediğin an <b>Ayarlar → Uygulamalar</b> bölümünden iptal edebilirsin. Kredi kartı gerekmez — Shopify hesabından tahsil edilir.</p>
                  </Banner>
                </>
              )}
            </BlockStack>
          </Tabs>

          <Divider />
          <InlineStack align="center" gap="200">
            <Text as="p" variant="bodySm" tone="subdued">
              Satış Kiti v1.2.0 — 🚀 Türk e-ticaretinin dönüşüm motoru
            </Text>
          </InlineStack>
        </BlockStack>
      </Page>
      {toast && (
        <Toast content={toast.mesaj} error={toast.hata} onDismiss={() => setToast(null)} duration={4000} />
      )}
    </Frame>
  );
}
