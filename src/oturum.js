import shopify from "./shopify.js";

/**
 * Suresiz (non-expiring) offline erisim belirteclerinin Admin API tarafindan
 * kabul edilmesi sona erdi. Kutuphane `future.expiringOfflineAccessTokens`
 * acikken YENI kurulumlarda suresi dolan belirtec alir ve suresi dolmak
 * uzereyken kendisi yeniler; ancak bayrak acilmadan once kurulmus
 * magazalarin kayitli belirteci hala suresizdir ve hicbir zaman kendiliginden
 * donusmez. O magazalar ilk cagrida 403 alir.
 *
 * Bu yuzden depodan gelen oturum ilk kullanimda bir defa donusturulur:
 * `migrateToExpiringToken` suresiz belirteci ayni yetkilerle suresi dolan bir
 * belirtecle takas eder, yenileme belirtecini (refreshToken) dondurur ve
 * sonuc depoya yazilir. Sonraki isteklerde `refreshToken` dolu oldugu icin
 * bu adim atlanir.
 */
export async function belirteciTazele(session) {
  if (!session || session.isOnline || !session.accessToken) return session;
  if (session.refreshToken) return session; // zaten donusturulmus

  try {
    const { session: yeni } = await shopify.api.auth.migrateToExpiringToken({
      shop: session.shop,
      nonExpiringOfflineAccessToken: session.accessToken,
    });

    await shopify.config.sessionStorage.storeSession(yeni);
    console.log(`[CF] Belirtec donusturuldu (suresi dolan): ${session.shop}`);
    return yeni;
  } catch (err) {
    // Donusum basarisiz olursa eski oturumla devam edilir; cagri yine de
    // 403 alabilir ama uygulama burada cokmemeli.
    console.error(`[CF] Belirtec donusturulemedi (${session.shop}): ${err.message}`);
    return session;
  }
}

/**
 * `validateAuthenticatedSession` sonrasina takilan ara katman. Oturumu
 * donusturur ve guncel halini res.locals'a geri yazar, boylece sonraki
 * yol isleyicileri her zaman gecerli bir belirtecle calisir.
 */
export function belirtecAraKatmani() {
  return async (_req, res, next) => {
    const session = res.locals?.shopify?.session;
    if (!session) return next();

    try {
      res.locals.shopify.session = await belirteciTazele(session);
    } catch (err) {
      console.error(`[CF] Belirtec ara katmani: ${err.message}`);
    }
    next();
  };
}
