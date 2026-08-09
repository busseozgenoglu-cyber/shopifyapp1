import shopify from "./shopify.js";

const SHOP_ID = `{ shop { id } }`;

const METAFIELD_SET = `
  mutation ayarla($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { key value }
      userErrors { field message }
    }
  }
`;

/**
 * Tema bloklari `app.metafields.convertflow.aktif` degerini okur.
 * "0" ise bloklar hic render edilmez. Metafield yoksa bloklar calismaya devam eder
 * (fail-open) — boylece bir hata magazanin urun sayfasini bozmaz.
 */
export async function lisansYaz(session, aktifMi) {
  try {
    const client = new shopify.api.clients.Graphql({ session });

    const shopRes = await client.request(SHOP_ID);
    const ownerId = shopRes?.data?.shop?.id;
    if (!ownerId) {
      console.warn("[ConvertFlow TR] Shop ID alinamadi.");
      return false;
    }

    const res = await client.request(METAFIELD_SET, {
      variables: {
        metafields: [
          {
            ownerId,
            namespace: "convertflow",
            key: "aktif",
            type: "single_line_text_field",
            value: aktifMi ? "1" : "0",
          },
        ],
      },
    });

    const hatalar = res?.data?.metafieldsSet?.userErrors || [];
    if (hatalar.length) {
      console.warn("[ConvertFlow TR] Lisans metafield hatasi:", hatalar.map((e) => e.message).join(", "));
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[ConvertFlow TR] Lisans yazilamadi:", err.message);
    return false;
  }
}
