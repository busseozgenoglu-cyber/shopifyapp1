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
  Icon,
  Box,
  ProgressBar,
  Link,
  Tooltip,
} from "@shopify/polaris";
import {
  OrderIcon,
  DeliveryIcon,
  ShieldCheckIcon,
  ClockIcon,
  DiscountIcon,
  CheckCircleIcon,
  CircleChevronRightIcon,
  SettingsIcon,
  ChartBarIcon,
  ExternalIcon,
  HelpIcon,
} from "@shopify/polaris-icons";

async function istek(yol, secenekler = {}) {
  const yanit = await fetch(yol, {
    headers: { "Content-Type": "application/json" },
    ...secenekler,
  });
  const metin = await yanit.text();
  const veri = metin ? JSON.parse(metin) : null;
  if (!yanit.ok) throw new Error(veri?.error || "İstek başarısız oldu.");
  return veri;
}

const BLOKLAR = [
  {
    ad: "Taksit Tablosu",
    yer: "Ürün sayfası",
    aciklama: "Ürün fiyatını taksit planına böler. Varyant değişince tutar anında güncellenir. Türkiye'de satın alma kararını %40 hızlandırır.",
    ikon: OrderIcon,
    renk: "bg-surface-info",
    etiket: "En çok kullanılan",
  },
  {
    ad: "Ücretsiz Kargo Çubuğu",
    yer: "Sepet sayfası",
    aciklama: "Ücretsiz kargoya ne kadar kaldığını gösterir. Sepet ortalamasını %15-25 yükseltir. Hedefe ulaşınca confetti patlar! 🎉",
    ikon: DeliveryIcon,
    renk: "bg-surface-success",
    etiket: "AOV artırıcı",
  },
  {
    ad: "Güven Rozetleri",
    yer: "Ürün sayfası",
    aciklama: "Kapıda ödeme, iade, güvenli ödeme gibi hizmetlerini görünür kılar. Yeni mağazalarda güven en büyük terk sebebidir.",
    ikon: ShieldCheckIcon,
    renk: "bg-surface-caution",
    etiket: "Güven artırıcı",
  },
  {
    ad: "Kargo Saati & Stok",
    yer: "Ürün sayfası",
    aciklama: "Kargo kesim saatine kalan süreyi ve gerçek stok adedini gösterir. 'Hemen al' hissiyatı yaratır.",
    ikon: ClockIcon,
    renk: "bg-surface-warning",
    etiket: "Aciliyet yaratır",
  },
  {
    ad: "İndirim Sayacı",
    yer: "Ürün sayfası",
    aciklama: "Gerçek indirim bitiş tarihine geri sayım + stok aciliyet çubuğu. 'Fırsat kaçmadan al' hissiyatı yaratır. Sayaç bitince confetti!",
    ikon: DiscountIcon,
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

  const yukle = useCallback(async () => {
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

  const sekmeler = [
    { id: "kurulum", content: "🚀 Kurulum", icon: CircleChevronRightIcon },
    { id: "bloklar", content: "🎨 Bloklar", icon: SettingsIcon },
    { id: "paketler", content: "💎 Paketler", icon: ChartBarIcon },
  ];

  if (yukleniyor) {
    return (
      <Frame>
        <Page>
          <InlineStack align="center" blockAlign="center" gap="400" direction="column">
            <Spinner accessibilityLabel="Yükleniyor" size="large" />
            <Text as="p" variant="bodyLg" tone="subdued">
              ConvertFlow TR hazırlanıyor...
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Satış artırıcı bloklar yükleniyor
            </Text>
          </InlineStack>
        </Page>
      </Frame>
    );
  }

  return (
    <Frame>
      <Confetti active={confetti} />
      <Page
        title="ConvertFlow TR"
        subtitle="Türk e-ticaret mağazaları için dönüşüm odaklı satış artırıcı bloklar"
        primaryAction={{
          content: "Tema Düzenleyiciyi Aç",
          icon: ExternalIcon,
          onAction: temaAc,
        }}
        secondaryActions={[
          {
            content: "Yardım",
            icon: HelpIcon,
            onAction: () => window.open("https://convertflow-tr.com/yardim", "_blank"),
          },
        ]}
      >
        <BlockStack gap="500">
          {/* Durum Banner */}
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

          {/* Sekmeler */}
          <Tabs tabs={sekmeler} selected={aktifSekme} onSelect={setAktifSekme} fitted>
            <BlockStack gap="500">
              {/* SEKME 1: Kurulum */}
              {aktifSekme === 0 && (
                <>
                  <Card>
                    <BlockStack gap="500">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h2" variant="headingMd">
                          Kurulum İlerlemesi
                        </Text>
                        <Badge tone={ilerlemeYuzde === 100 ? "success" : "info"}>
                          {tamamlananAdim} / {kurulumAdimlari.length} tamamlandı
                        </Badge>
                      </InlineStack>
                      <ProgressBar progress={ilerlemeYuzde} size="medium" />

                      <BlockStack gap="400">
                        {kurulumAdimlari.map((adim, i) => (
                          <InlineStack key={i} gap="300" blockAlign="start">
                            <Box>
                              {adim.tamam ? (
                                <Icon source={CheckCircleIcon} tone="success" />
                              ) : (
                                <Text as="span" variant="bodyLg" tone="subdued">
                                  {i + 1}
                                </Text>
                              )}
                            </Box>
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingSm" tone={adim.tamam ? "subdued" : undefined}>
                                {adim.baslik}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                {adim.aciklama}
                              </Text>
                            </BlockStack>
                          </InlineStack>
                        ))}
                      </BlockStack>

                      <InlineStack gap="300" wrap={false}>
                        <Button variant="primary" onClick={temaAc} icon={ExternalIcon}>
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
                      <Text as="h2" variant="headingMd">
                        🎯 Nasıl Blok Eklenir?
                      </Text>
                      <List type="number">
                        <List.Item>
                          <b>Tema düzenleyiciyi aç</b> — yukarıdaki düğmeye tıkla.
                        </List.Item>
                        <List.Item>
                          Sol üstten düzenlemek istediğin sayfayı seç — taksit ve indirim için <b>Ürün sayfaları</b>, kargo için <b>Sepet</b>.
                        </List.Item>
                        <List.Item>
                          İlgili bölümde <b>Blok ekle</b> → <b>Uygulamalar</b> sekmesi → <b>ConvertFlow TR</b> altından bloğu seç.
                        </List.Item>
                        <List.Item>
                          Sağdaki panelden ayarları düzenle (renk, mesaj, tarih), <b>Kaydet</b>'e bas.
                        </List.Item>
                      </List>
                    </BlockStack>
                  </Card>
                </>
              )}

              {/* SEKME 2: Bloklar */}
              {aktifSekme === 1 && (
                <>
                  <Card>
                    <BlockStack gap="500">
                      <Text as="h2" variant="headingMd">
                        🎨 5 Satış Artırıcı Blok
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Her blok tema düzenleyicide sürükle-bırak ile kurulur. Kod bilgisi gerekmez. Tüm veriler Shopify'dan gelir.
                      </Text>
                      <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                        {BLOKLAR.map((b) => (
                          <Card key={b.ad}>
                            <BlockStack gap="300">
                              <InlineStack gap="200" blockAlign="center" wrap={false}>
                                <Icon source={b.ikon} tone="primary" />
                                <Text as="h3" variant="headingSm">
                                  {b.ad}
                                </Text>
                                <Badge tone="info">{b.etiket}</Badge>
                              </InlineStack>
                              <Text as="p" variant="bodySm" tone="subdued">
                                {b.aciklama}
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                📍 <b>{b.yer}</b>
                              </Text>
                            </BlockStack>
                          </Card>
                        ))}
                      </InlineGrid>
                    </BlockStack>
                  </Card>

                  <Banner tone="success" title="💡 Neden bu 5 blok?">
                    <p>
                      Türkiye'de Shopify mağazaları en çok bu 5 noktada dönüşüm kaybediyor: fiyat algısı, kargo şeffaflığı, güven eksikliği, erteleme alışkanlığı ve indirim fırsatlarını kaçırma. ConvertFlow TR hepsini tek uygulamada çözer.
                    </p>
                  </Banner>
                </>
              )}

              {/* SEKME 3: Paketler */}
              {aktifSekme === 2 && (
                <>
                  <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                    {(magaza?.planlar || []).map((p) => {
                      const secili = abonelik?.plan === p.key;
                      return (
                        <Card key={p.key}>
                          <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="center">
                              <Text as="h3" variant="headingLg">
                                {p.name}
                              </Text>
                              {secili && <Badge tone="success">✓ Aktif</Badge>}
                            </InlineStack>

                            <Text as="p" variant="heading2xl">
                              ${p.price}
                              <Text as="span" variant="bodySm" tone="subdued">
                                {" "}/ ay
                              </Text>
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
                    <p>
                      💳 Ödeme Shopify faturana eklenir. İstediğin an <b>Ayarlar → Uygulamalar</b> bölümünden iptal edebilirsin. Kredi kartı gerekmez — Shopify hesabından tahsil edilir.
                    </p>
                  </Banner>
                </>
              )}
            </BlockStack>
          </Tabs>

          <Divider />

          <InlineStack align="center" gap="200">
            <Text as="p" variant="bodySm" tone="subdued">
              ConvertFlow TR v1.1.0 — 🚀 Türk e-ticaretinin dönüşüm motoru
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
