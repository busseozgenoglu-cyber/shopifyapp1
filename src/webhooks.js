import { DeliveryMethod } from "@shopify/shopify-api";

const YOL = "/api/webhooks";

/**
 * Uygulama kalici musteri verisi saklamadigi icin KVKK/GDPR webhook'lari
 * "silinecek veri yok" yanitini verir. Shopify bu uc webhook'un
 * 200 donmesini zorunlu tutar.
 */
const webhookHandlers = {
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: YOL,
    callback: async (_topic, shop) => {
      console.log(`[Satis Kiti] Uygulama kaldirildi: ${shop}`);
    },
  },

  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: YOL,
    callback: async (_topic, shop) => {
      console.log(`[Satis Kiti] Veri talebi (${shop}) — saklanan musteri verisi yok.`);
    },
  },

  CUSTOMERS_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: YOL,
    callback: async (_topic, shop) => {
      console.log(`[Satis Kiti] Musteri silme talebi (${shop}) — saklanan veri yok.`);
    },
  },

  SHOP_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: YOL,
    callback: async (_topic, shop) => {
      console.log(`[Satis Kiti] Magaza silme talebi (${shop}) — saklanan veri yok.`);
    },
  },
};

export default webhookHandlers;
