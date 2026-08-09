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
  MediaCard,
  VideoThumbnail,
} from "@shopify/polaris";
import {
  OrderIcon,
  DeliveryIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  CircleChevronRightIcon,
  SettingsIcon,
  ChartBarIcon,
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
  },
  {
    ad: "Ücretsiz Kargo Çubuğu",
    yer: "Sepet sayfası",
    aciklama: "Ücretsiz kargoya ne kadar kaldığını gösterir. Sepet ortalamasını %15-25 yükseltir.",
    ikon: DeliveryIcon,
    renk: "bg-surface-success",
  },
  {
    ad: "Güven Rozetleri",
    yer: "Ürün sayfası",
    aciklama: "Kapıda ödeme, iade, güvenli ödeme gibi hizmetlerini görünür kılar. Yeni mağazalarda güven en büyük terk sebebidir.",
    ikon: ShieldCheckIcon,
    renk: "bg-surface-caution",
  },
  {
    ad: "Kargo Saati & Stok",
    yer: "Ürün sayfası",
    aciklama: "Kargo kesim saatine kalan süreyi ve gerçek stok adedini gösterir. 'Hemen al' hissiyatı yaratır.",
    ikon: ClockIcon,
    renk: "bg-surface-warning",
  },
];

const ADIMLAR = [
  { baslik: "Uygulamayı mağazana bağla", aciklama: "OAuth kurulumu tamamlandı", tamam: true },
  { baslik: "Taksit tablosunu ürün sayfasına ekle", aciklama: "Tema düzenleyicide 'Blok ekle' → 'Uygulamalar' sekmesi", tamam: false },
  { baslik: "Kargo çubuğunu sepete ekle", aciklama: "Sepet sayfasında veya sepet çekmecesine yerleştir", tamam: false },
  { baslik: "Paketini seç ve yayına al", aciklama: "14 gün ücretsiz dene, istediğin an iptal et", tamam: false },
];

export default function App() {
  const [magaza, setMagaza] = useState(null);
  const [abonelik, setAbonelik] = useState(null);
  const [mesgul, setMesgul] = useState(null);
  const [toast, setToast] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aktifSekme, setAktifSekme] = useState(0);
  const [kurulumAdimlari, setKurulumAdimlari] = useState(ADIMLAR);

  const yukle = useCallback(async () => {
    try {
      const [m, a] = await Promise.all([istek("/api/magaza"), istek("/api/abonelik")]);
      setMagaza(m);
      setAbonelik(a);
      if (a.aktif) {
        istek("/api/lisans", { method: "POST", body: JSON.stringify({ aktif: true }) });
        setKurulumAdimlari((onceki) =>
          onceki.map((adim, i) => (i === 3 ? { ...adim, tamam: true } : adim))
        );
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
    { id: "kurulum", content: "Kurulum Rehberi", icon: CircleChevronRightIcon },
    { id: "bloklar", content: "Bloklar & Özellikler", icon: SettingsIcon },
    { id: "paketler", content: "Paketler", icon: ChartBarIcon },
  ];

  if (yukleniyor) {
    return (
      <Frame>
        <Page>
          <InlineStack align="center" blockAlign="center" gap="400">
            <Spinner accessibilityLabel="Yükleniyor" size="large" />
            <Text as="p" variant="bodyMd" tone="subdued">
              ConvertFlow TR hazırlanıyor...
            </Text>
          </InlineStack>
        </Page>
      </Frame>
    );
  }

  return (
    <Frame>
      <Page
        title="ConvertFlow TR"
        subtitle="Türk e-ticaret mağazaları için dönüşüm odaklı satış artırıcı bloklar"
      >
        <BlockStack gap="400">
          {/* Durum Banner */}
          <Banner
            tone={abonelik?.aktif ? "success" : "info"}
            title={
              abonelik?.aktif
                ? `${abonelik.planAdi} paketi aktif — mağazan hazır`
                : "Mağazanı 2 dakikada hazır hale getir"
            }
          >
            <p>
              {abonelik?.aktif
                ? "Tüm blokları tema düzenleyicide istediğin yere ekleyebilirsin. Performansını 'Paketler' sekmesinden takip et."
                : "Aşağıdaki adımları izle, sonra bir paket seç. İlk 14 gün ücretsiz — kredi kartı gerekmez."}
            </p>
          </Banner>

          {/* Sekmeler */}
          <Tabs tabs={sekmeler} selected={aktifSekme} onSelect={setAktifSekme} fitted>
            <BlockStack gap="400">
              {/* SEKME 1: Kurulum Rehberi */}
              {aktifSekme === 0 && (
                <>
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h2" variant="headingMd">
                          Kurulum İlerlemesi
                        </Text>
                        <Badge tone={ilerlemeYuzde === 100 ? "success" : "info"}>
                          {tamamlananAdim} / {kurulumAdimlari.length} tamamlandı
                        </Badge>
                      </InlineStack>
                      <ProgressBar progress={ilerlemeYuzde} size="medium" />

                      <BlockStack gap="300">
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

                      <InlineStack gap="300">
                        <Button variant="primary" onClick={temaAc} icon={CircleChevronRightIcon}>
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
                        Nasıl Blok Eklenir?
                      </Text>
                      <List type="number">
                        <List.Item>
                          <b>Tema düzenleyiciyi aç</b> — yukarıdaki düğmeye tıkla.
                        </List.Item>
                        <List.Item>
                          Sol üstten düzenlemek istediğin sayfayı seç — taksit için <b>Ürün sayfaları</b>, kargo için <b>Sepet</b>.
                        </List.Item>
                        <List.Item>
                          İlgili bölümde <b>Blok ekle</b> → <b>Uygulamalar</b> sekmesi → eklemek istediğin bloğu seç.
                        </List.Item>
                        <List.Item>
                          Sağdaki panelden ayarları düzenle, <b>Kaydet</b>'e bas.
                        </List.Item>
                      </List>
                    </BlockStack>
                  </Card>
                </>
              )}

              {/* SEKME 2: Bloklar & Özellikler */}
              {aktifSekme === 1 && (
                <>
                  <Card>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd">
                        Kutudan Çıkan Bloklar
                      </Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Her blok tema düzenleyicide sürükle-bırak ile kurulur. Kod bilgisi gerekmez.
                      </Text>
                      <InlineGrid columns={{ xs: 1, sm: 2 }} gap="300">
                        {BLOKLAR.map((b) => (
                          <Card key={b.ad}>
                            <BlockStack gap="300">
                              <InlineStack gap="200" blockAlign="center">
                                <Icon source={b.ikon} tone="primary" />
                                <Text as="h3" variant="headingSm">
                                  {b.ad}
                                </Text>
                                <Badge>{b.yer}</Badge>
                              </InlineStack>
                              <Text as="p" variant="bodySm" tone="subdued">
                                {b.aciklama}
                              </Text>
                            </BlockStack>
                          </Card>
                        ))}
                      </InlineGrid>
                    </BlockStack>
                  </Card>

                  <Banner tone="success" title="Neden bu 4 blok?">
                    <p>
                      Türkiye'de Shopify mağazaları en çok bu 4 noktada dönüşüm kaybediyor: fiyat algısı, kargo şeffaflığı, güven eksikliği ve erteleme alışkanlığı. ConvertFlow TR bu dördünü tek uygulamada çözer.
                    </p>
                  </Banner>
                </>
              )}

              {/* SEKME 3: Paketler */}
              {aktifSekme === 2 && (
                <>
                  <InlineGrid columns={{ xs: 1, sm: 2 }} gap="300">
                    {(magaza?.planlar || []).map((p) => {
                      const secili = abonelik?.plan === p.key;
                      return (
                        <Card key={p.key}>
                          <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="center">
                              <Text as="h3" variant="headingLg">
                                {p.name}
                              </Text>
                              {secili && <Badge tone="success">Aktif</Badge>}
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
                              {secili ? "Kullanılıyor" : "14 gün ücretsiz dene"}
                            </Button>
                          </BlockStack>
                        </Card>
                      );
                    })}
                  </InlineGrid>

                  <Banner tone="info">
                    <p>
                      Ödeme Shopify faturana eklenir. İstediğin an <b>Ayarlar → Uygulamalar</b> bölümünden iptal edebilirsin. Kredi kartı gerekmez — Shopify hesabından tahsil edilir.
                    </p>
                  </Banner>
                </>
              )}
            </BlockStack>
          </Tabs>

          <Divider />

          <InlineStack align="center">
            <Text as="p" variant="bodySm" tone="subdued">
              ConvertFlow TR v1.0.0 — Sorun mu var? Destek ekibine ulaş.
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
