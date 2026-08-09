/*
 * ConvertFlow TR — mağaza vitrini betiği.
 * Yalnızca Shopify'ın kendi uç noktalarını kullanır (/cart.js, /products/handle.js).
 * Hiçbir dış sunucuya istek gitmez, hiçbir veri toplanmaz.
 */
(function () {
  "use strict";

  if (window.__satisKitiYuklendi) return;
  window.__satisKitiYuklendi = true;

  var kok = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || "/";

  /* ---------- Para biçimlendirme (Shopify money_format uyumlu) ---------- */

  function sayiBicimle(deger, ondalik, binlik, ondalikAyraci) {
    if (isNaN(deger) || deger === null) deger = 0;
    var sabit = deger.toFixed(ondalik);
    var parcalar = sabit.split(".");
    var tam = parcalar[0].replace(/(\d)(?=(\d{3})+$)/g, "$1" + binlik);
    var kalan = parcalar[1] ? ondalikAyraci + parcalar[1] : "";
    return tam + kalan;
  }

  function paraYaz(kurus, format) {
    var tutar = (Number(kurus) || 0) / 100;
    var kaliplar = {
      amount: function () { return sayiBicimle(tutar, 2, ",", "."); },
      amount_no_decimals: function () { return sayiBicimle(tutar, 0, ",", ""); },
      amount_with_comma_separator: function () { return sayiBicimle(tutar, 2, ".", ","); },
      amount_no_decimals_with_comma_separator: function () { return sayiBicimle(tutar, 0, ".", ""); },
      amount_with_space_separator: function () { return sayiBicimle(tutar, 2, " ", ","); },
      amount_no_decimals_with_space_separator: function () { return sayiBicimle(tutar, 0, " ", ""); },
      amount_with_apostrophe_separator: function () { return sayiBicimle(tutar, 2, "'", "."); }
    };
    var sablon = format || "{{amount_with_comma_separator}} TL";
    return sablon.replace(/\{\{\s*(\w+)\s*\}\}/g, function (_, anahtar) {
      var fn = kaliplar[anahtar] || kaliplar.amount_with_comma_separator;
      return fn();
    });
  }

  /* ---------- Taksit tablosu ---------- */

  function planCoz(metin) {
    return String(metin || "")
      .split(",")
      .map(function (satir) {
        var parcalar = satir.split(":");
        var adet = parseInt(String(parcalar[0]).trim(), 10);
        var oran = parcalar.length > 1 ? parseFloat(String(parcalar[1]).trim()) : 0;
        return { adet: adet, oran: isNaN(oran) ? 0 : oran };
      })
      .filter(function (s) { return !isNaN(s.adet) && s.adet > 1; });
  }

  function taksitCiz(kutu, fiyat) {
    var govde = kutu.querySelector("[data-sk-taksit-govde]");
    if (!govde) return;

    var altLimit = parseInt(kutu.dataset.altLimit, 10) || 0;
    var minTaksit = parseInt(kutu.dataset.minTaksit, 10) || 0;
    var format = kutu.dataset.paraFormati;
    var vadeEtiketi = kutu.dataset.vadeEtiketi || "";
    var taksitKelimesi = kutu.dataset.taksitKelimesi || "Taksit";

    if (fiyat < altLimit) {
      kutu.hidden = true;
      return;
    }
    kutu.hidden = false;

    var satirlar = planCoz(kutu.dataset.plan);
    var html = "";

    satirlar.forEach(function (s) {
      var toplam = Math.round(fiyat + (fiyat * s.oran) / 100);
      var aylik = Math.round(toplam / s.adet);
      if (aylik < minTaksit) return;

      var rozet = s.oran === 0 && vadeEtiketi
        ? ' <span class="sk-taksit__rozet">' + vadeEtiketi + "</span>"
        : "";

      html +=
        "<tr><td><strong>" + s.adet + "</strong> " + taksitKelimesi + rozet + "</td>" +
        '<td class="sk-taksit__aylik">' + paraYaz(aylik, format) + "</td>" +
        '<td class="sk-taksit__toplam">' + paraYaz(toplam, format) + "</td></tr>";
    });

    govde.innerHTML = html;
    kutu.hidden = html === "";
  }

  var urunOnbellek = {};

  function urunGetir(handle) {
    if (urunOnbellek[handle]) return urunOnbellek[handle];
    urunOnbellek[handle] = fetch(kok + "products/" + handle + ".js", {
      headers: { Accept: "application/json" }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
    return urunOnbellek[handle];
  }

  function seciliVaryantId() {
    var url = new URL(window.location.href);
    var id = url.searchParams.get("variant");
    if (id) return Number(id);
    var alan = document.querySelector('form[action*="/cart/add"] [name="id"]');
    return alan ? Number(alan.value) : null;
  }

  function taksitleriGuncelle() {
    document.querySelectorAll("[data-sk-taksit]").forEach(function (kutu) {
      var handle = kutu.dataset.urun;
      var varyantId = seciliVaryantId();
      if (!handle || !varyantId) return;

      urunGetir(handle).then(function (urun) {
        if (!urun) return;
        var varyant = urun.variants.find(function (v) { return v.id === varyantId; });
        if (varyant) taksitCiz(kutu, varyant.price);
      });
    });
  }

  /* ---------- Ücretsiz kargo çubuğu ---------- */

  function kargoBariCiz(toplam) {
    document.querySelectorAll("[data-sk-kargo]").forEach(function (kutu) {
      var esik = parseInt(kutu.dataset.esik, 10) || 0;
      if (esik <= 0) return;

      var format = kutu.dataset.paraFormati;
      var kalan = Math.max(0, esik - toplam);
      var yuzde = Math.min(100, Math.round((toplam / esik) * 100));

      var mesajKutusu = kutu.querySelector("[data-sk-kargo-mesaj]");
      var dolgu = kutu.querySelector("[data-sk-kargo-dolgu]");
      var ray = kutu.querySelector("[data-sk-kargo-ray]");

      if (mesajKutusu) {
        mesajKutusu.textContent =
          kalan > 0
            ? String(kutu.dataset.mesajDevam || "").replace("[tutar]", paraYaz(kalan, format))
            : kutu.dataset.mesajTamam || "";
      }
      if (dolgu) dolgu.style.width = yuzde + "%";
      if (ray) ray.setAttribute("aria-valuenow", String(yuzde));
    });
  }

  function sepetiYenile() {
    if (!document.querySelector("[data-sk-kargo]")) return;
    fetch(kok + "cart.js", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (sepet) { if (sepet) kargoBariCiz(sepet.total_price); })
      .catch(function () {});
  }

  /* Tema sepeti güncellediğinde çubuğu da güncelle */
  var asilFetch = window.fetch;
  window.fetch = function () {
    var istek = asilFetch.apply(this, arguments);
    try {
      var adres = String(arguments[0] && arguments[0].url ? arguments[0].url : arguments[0]);
      if (/\/cart\/(add|change|update|clear)/.test(adres)) {
        istek.then(function () { setTimeout(sepetiYenile, 120); });
      }
    } catch (e) {}
    return istek;
  };

  /* ---------- Kargo kesim saati sayacı ---------- */

  function sureMetni(ms) {
    var toplamDk = Math.floor(ms / 60000);
    var saat = Math.floor(toplamDk / 60);
    var dakika = toplamDk % 60;
    if (saat > 0) return saat + " saat " + dakika + " dakika";
    return dakika + " dakika";
  }

  function sayaciGuncelle() {
    document.querySelectorAll("[data-sk-aciliyet]").forEach(function (kutu) {
      var mesajKutusu = kutu.querySelector("[data-sk-aciliyet-mesaj]");
      if (!mesajKutusu) return;

      var parcalar = String(kutu.dataset.kesimSaati || "16:00").split(":");
      var saat = parseInt(parcalar[0], 10);
      var dakika = parseInt(parcalar[1], 10) || 0;
      if (isNaN(saat)) return;

      var simdi = new Date();
      var kesim = new Date(simdi);
      kesim.setHours(saat, dakika, 0, 0);

      if (simdi >= kesim) {
        mesajKutusu.textContent = kutu.dataset.sonMesaj || "";
        return;
      }
      mesajKutusu.textContent = String(kutu.dataset.mesaj || "").replace(
        "[sure]",
        sureMetni(kesim - simdi)
      );
    });
  }

  /* ---------- Başlat ---------- */

  function baslat() {
    taksitleriGuncelle();
    sepetiYenile();
    sayaciGuncelle();
    setInterval(sayaciGuncelle, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", baslat);
  } else {
    baslat();
  }

  /* Varyant değişimi: tema hangi yöntemi kullanırsa kullansın yakala */
  document.addEventListener("change", function (olay) {
    if (olay.target.closest('form[action*="/cart/add"], variant-selects, variant-radios')) {
      setTimeout(taksitleriGuncelle, 60);
    }
  });
  ["variant:change", "variantChange", "product:variant-change"].forEach(function (ad) {
    document.addEventListener(ad, function () { setTimeout(taksitleriGuncelle, 60); });
  });
  window.addEventListener("popstate", function () { setTimeout(taksitleriGuncelle, 60); });

  /* Tema düzenleyicide blok eklenince yeniden çiz */
  document.addEventListener("shopify:section:load", baslat);
  document.addEventListener("shopify:block:select", baslat);
})();
