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
} from "@shopify/polaris";

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
    ad: "Taksit tablosu",
    yer: "Ürün sayfası",
    aciklama: "Ürün fiyatını taksit planına böler. Varyant değişince tutar anında güncellenir.",
  },
  {
    ad: "Ücretsiz kargo çubuğu",
    yer: "Sepet sayfası veya sepet çekmecesi",
    aciklama: "Ücretsiz kargoya ne kadar kaldığını gösterir. Sepet ortalamasını yükseltir.",
  },
  {
    ad: "Güven rozetleri",
    yer: "Ürün sayfası",
    aciklama: "Kapıda ödeme, iade, güvenli ödeme gibi hizmetlerini görünür kılar.",
  },
  {
    ad: "Kargo saati ve stok",
    yer: "Ürün sayfası",
    aciklama: "Kargo kesim saatine kalan süreyi ve gerçek stok adedini gösterir.",
  },
];

export default function App() {
  const [magaza, setMagaza] = useState(null);
  const [abonelik, setAbonelik] = useState(null);
  const [mesgul, setMesgul] = useState(null);
  const [toast, setToast] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = useCallback(async () => {
    try {
      const [m, a] = await Promise.all([istek("/api/magaza"), istek("/api/abonelik")]);
      setMagaza(m);
      setAbonelik(a);
      if (a.aktif) istek("/api/lisans", { method: "POST", body: JSON.stringify({ aktif: true }) });
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

  if (yukleniyor) {
    return (
      <Frame>
        <Page>
          <InlineStack align="center">
            <Spinner accessibilityLabel="Yükleniyor" size="large" />
          </InlineStack>
        </Page>
      </Frame>
    );
  }

  return (
    <Frame>
      <Page
        title="Satış Kiti"
        subtitle="Taksit tablosu, kargo çubuğu ve güven rozetleri — tek kurulumda"
      >
        <BlockStack gap="400">
          <Banner
            tone={abonelik?.aktif ? "success" : "info"}
            title={abonelik?.aktif ? `${abonelik.planAdi} paketi aktif` : "Kurulum 2 dakika sürer"}
          >
            <p>
              {abonelik?.aktif
                ? "Blokları tema düzenleyicide istediğin yere ekleyebilirsin."
                : "Aşağıdaki adımları izle, sonra bir paket seç. İlk 14 gün ücretsiz."}
            </p>
          </Banner>

          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Blokları mağazana ekle
              </Text>

              <List type="number">
                <List.Item>Aşağıdaki düğmeyle tema düzenleyiciyi aç.</List.Item>
                <List.Item>
                  Sol üstten düzenlemek istediğin sayfayı seç — taksit tablosu için{" "}
                  <b>Ürün sayfaları</b>, kargo çubuğu için <b>Sepet</b>.
                </List.Item>
                <List.Item>
                  İlgili bölümde <b>Blok ekle</b> → <b>Uygulamalar</b> sekmesi → eklemek istediğin bloğu seç.
                </List.Item>
                <List.Item>Sağdaki panelden ayarları düzenle, <b>Kaydet</b>e bas.</List.Item>
              </List>

              <InlineStack>
                <Button variant="primary" onClick={temaAc}>
                  Tema düzenleyiciyi aç
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Kutudan çıkan bloklar
              </Text>
              <InlineGrid columns={{ xs: 1, sm: 2 }} gap="300">
                {BLOKLAR.map((b) => (
                  <BlockStack gap="100" key={b.ad}>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="h3" variant="headingSm">
                        {b.ad}
                      </Text>
                      <Badge>{b.yer}</Badge>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {b.aciklama}
                    </Text>
                  </BlockStack>
                ))}
              </InlineGrid>
            </BlockStack>
          </Card>

          <Divider />

          <Text as="h2" variant="headingMd">
            Paketler
          </Text>

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

          <Text as="p" variant="bodySm" tone="subdued">
            Ödeme Shopify faturana eklenir. İstediğin an Ayarlar → Uygulamalar bölümünden iptal edebilirsin.
          </Text>
        </BlockStack>
      </Page>

      {toast && (
        <Toast content={toast.mesaj} error={toast.hata} onDismiss={() => setToast(null)} duration={4000} />
      )}
    </Frame>
  );
}
