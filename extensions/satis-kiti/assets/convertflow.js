/* Satis Kiti. Blok basina JS 10 KB sinirli. */

(function () {
  'use strict';

  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function formatPara(tutar, format) {
    if (!format) return tutar.toLocaleString('tr-TR');
    return format.replace(/\{\{\s*amount\s*\}\}/g, (tutar / 100).toFixed(2).replace('.', ','));
  }

  function baslatGozlemci() {
    if (!window.IntersectionObserver) return;
    const gozlemci = new IntersectionObserver(function (girisler) {
      girisler.forEach(function (giris) {
        if (!giris.isIntersecting) return;
        giris.target.classList.add('cf-gorunur');
        gozlemci.unobserve(giris.target);
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.cf-taksit, .cf-kargo, .cf-rozetler, .cf-aciliyet, .cf-indirim')
      .forEach(function (el) { gozlemci.observe(el); });
  }

  function confettiPatlat(x, y, renkler) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    renkler = renkler || ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#DC2626', '#06B6D4'];
    const kap = document.createElement('div');
    kap.className = 'cf-confetti';

    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      const boy = (4 + Math.random() * 8).toFixed(1);
      p.className = 'cf-confetti-parca';
      p.style.cssText = 'left:' + (x + (Math.random() - 0.5) * 200) + 'px;top:' +
        (y + (Math.random() - 0.5) * 100) + 'px;width:' + boy + 'px;height:' + boy +
        'px;background:' + renkler[Math.floor(Math.random() * renkler.length)] +
        ';border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') +
        ';animation-duration:' + (2 + Math.random() * 2).toFixed(1) + 's;animation-delay:' +
        (Math.random() * 0.5).toFixed(2) + 's';
      kap.appendChild(p);
    }

    document.body.appendChild(kap);
    setTimeout(function () { kap.remove(); }, 4500);
  }

  // Dawn temalari DOM olayi yayinlamaz; cart fetch'lerini yakalayip olay basiyoruz.
  const SEPET_OLAYI = 'sk:sepet-degisti';
  function sepetYamasiKur() {
    if (window.__skSepetYamali || !window.fetch) return;
    window.__skSepetYamali = true;
    const orj = window.fetch;
    window.fetch = function (girdi) {
      const yol = (girdi && girdi.url) || girdi || '';
      const sonuc = orj.apply(this, arguments);
      if (/\/cart\/(add|change|update|clear)/.test(yol)) {
        sonuc.then(function () { document.dispatchEvent(new Event(SEPET_OLAYI)); }).catch(function () {});
      }
      return sonuc;
    };
  }

  function baslatTaksit() {
    document.querySelectorAll('[data-sk-taksit]').forEach(function (tablo) {
      const plan = tablo.dataset.plan;
      const fiyat = parseInt(tablo.dataset.fiyat, 10);
      const altLimit = parseInt(tablo.dataset.altLimit, 10) || 0;
      const minTaksit = parseInt(tablo.dataset.minTaksitTutari, 10) || 100;
      const paraFormati = tablo.dataset.paraFormati;
      const vadeEtiketi = tablo.dataset.vadeEtiketi;
      const taksitKelimesi = tablo.dataset.taksitKelimesi || 'taksit';
      const govde = tablo.querySelector('[data-sk-taksit-govde]');
      if (!govde || !plan || !fiyat || fiyat < altLimit) return;

      let html = '';
      plan.split(',').map(function (s) { return parseInt(s.trim(), 10); }).filter(Boolean)
        .forEach(function (vade, i) {
          const aylik = Math.ceil(fiyat / vade);
          if (aylik < minTaksit) return;
          const toplam = aylik * vade;
          const etiket = toplam - fiyat <= 0 && vadeEtiketi
            ? '<span class="cf-taksit__vade-etiket">' + vadeEtiketi + '</span>' : '';
          html += '<tr style="animation-delay:' + (i * 0.08) + 's"><td>' + vade + ' ' +
            taksitKelimesi + etiket + '</td><td><strong>' + formatPara(aylik, paraFormati) +
            '</strong></td><td>' + formatPara(toplam, paraFormati) + '</td></tr>';
        });

      govde.innerHTML = html;
    });
  }

  function baslatKargo() {
    document.querySelectorAll('[data-sk-kargo]').forEach(function (bar) {
      const esik = parseInt(bar.dataset.esik, 10);
      const mesajDevam = bar.dataset.mesajDevam;
      const mesajTamam = bar.dataset.mesajTamam;
      const paraFormati = bar.dataset.paraFormati;
      const mesajEl = bar.querySelector('[data-sk-kargo-mesaj]');
      const dolguEl = bar.querySelector('[data-sk-kargo-dolgu]');
      const rayEl = bar.querySelector('[data-sk-kargo-ray]');
      const yuzdeEl = bar.querySelector('[data-sk-kargo-yuzde]');
      if (!esik || !mesajEl || !dolguEl) return;

      function guncelle() {
        fetch('/cart.js', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
          .then(function (r) { return r.json(); })
          .then(function (sepet) {
            const toplam = sepet.total_price;
            const kalan = Math.max(0, esik - toplam);
            const yuzde = esik > 0 ? Math.min(100, Math.round((toplam / esik) * 100)) : 0;

            if (kalan > 0) {
              mesajEl.textContent = mesajDevam.replace('[tutar]', formatPara(kalan, paraFormati));
              mesajEl.classList.remove('cf-kargo__tamam'); delete bar.dataset.kutlandi;
            } else {
              mesajEl.textContent = mesajTamam;
              mesajEl.classList.add('cf-kargo__tamam');
              if (!bar.dataset.kutlandi) {
                bar.dataset.kutlandi = '1';
                const kutu = bar.getBoundingClientRect();
                confettiPatlat(kutu.left + kutu.width / 2, kutu.top,
                  ['#10B981', '#34D399', '#6EE7B7', '#059669']);
              }
            }

            const yuzdeMetin = yuzde + '% tamamlandı';
            dolguEl.style.width = yuzde + '%';
            if (yuzdeEl) yuzdeEl.textContent = yuzdeMetin;
            if (rayEl) {
              rayEl.setAttribute('aria-valuenow', yuzde);
              rayEl.setAttribute('aria-valuetext', yuzdeMetin);
            }
          })
          .catch(function () {});
      }

      guncelle();
      const gecikmeli = debounce(guncelle, 300);
      document.addEventListener(SEPET_OLAYI, gecikmeli);
    });
  }

  function baslatKargoSuresi() {
    document.querySelectorAll('[data-sk-aciliyet]').forEach(function (sayac) {
      const kesimSaati = sayac.dataset.kesimSaati;
      const mesaj = sayac.dataset.mesaj;
      const sonMesaj = sayac.dataset.sonMesaj;
      const mesajEl = sayac.querySelector('[data-sk-aciliyet-mesaj]');
      if (!kesimSaati || !mesajEl) return;

      const [saat, dakika] = kesimSaati.split(':').map(Number);

      function guncelle() {
        const simdi = new Date();
        const kesim = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate(), saat, dakika, 0);
        if (kesim < simdi) kesim.setDate(kesim.getDate() + 1);

        const kalan = kesim - simdi;
        if (kalan <= 0) {
          mesajEl.textContent = sonMesaj || 'Bugünkü kargo kesim saati doldu. Yarın kargolanacak.';
          mesajEl.style.opacity = '0.6';
          return;
        }

        const kSaat = Math.floor(kalan / 3600000);
        const kDakika = Math.floor((kalan % 3600000) / 60000);
        mesajEl.textContent = mesaj
          .replace('[saat]', kSaat)
          .replace('[dakika]', kDakika)
          .replace('[sure]', kSaat + ' saat ' + kDakika + ' dakika');
      }

      guncelle();
      setInterval(guncelle, 30000);
    });
  }

  function baslatIndirimSayaclari() {
    document.querySelectorAll('[data-cf-indirim]').forEach(function (sayac) {
      const bitisStr = sayac.dataset.bitis;
      if (!bitisStr) return;

      const bitis = new Date(bitisStr);
      const mesajAktif = sayac.dataset.mesajAktif || '';
      const mesajBitti = sayac.dataset.mesajBitti || '';

      const elGun = sayac.querySelector('[data-cf-gun]');
      const elSaat = sayac.querySelector('[data-cf-saat]');
      const elDakika = sayac.querySelector('[data-cf-dakika]');
      const elSaniye = sayac.querySelector('[data-cf-saniye]');
      const elMesaj = sayac.querySelector('[data-cf-indirim-mesaj]');
      if (!elGun || !elSaat || !elDakika || !elSaniye) return;

      function yaz(el, deger) {
        const metin = String(deger).padStart(2, '0');
        if (el.textContent === metin) return;
        el.textContent = metin;
        el.removeAttribute('data-flip');
        void el.offsetWidth;
        el.setAttribute('data-flip', '');
      }

      let kutlandi = false;

      function guncelle() {
        const kalan = bitis - new Date();

        if (kalan <= 0) {
          [elGun, elSaat, elDakika, elSaniye].forEach(function (el) { el.textContent = '00'; });
          if (elMesaj && mesajBitti) elMesaj.textContent = mesajBitti;
          sayac.style.opacity = '0.6';
          if (!kutlandi) {
            kutlandi = true;
            const kutu = sayac.getBoundingClientRect();
            confettiPatlat(kutu.left + kutu.width / 2, kutu.top,
              ['#DC2626', '#F97316', '#FBBF24', '#EF4444']);
          }
          return;
        }

        yaz(elGun, Math.floor(kalan / 86400000));
        yaz(elSaat, Math.floor((kalan % 86400000) / 3600000));
        yaz(elDakika, Math.floor((kalan % 3600000) / 60000));
        yaz(elSaniye, Math.floor((kalan % 60000) / 1000));

        if (elMesaj && mesajAktif) elMesaj.textContent = mesajAktif;

        if (kalan < 3600000) {
          sayac.setAttribute('data-acil', '');
          const kart = sayac.closest('.cf-indirim');
          if (kart) kart.setAttribute('data-acil', '');
        }
      }

      guncelle();
      setInterval(guncelle, 1000);
    });
  }

  function init() {
    sepetYamasiKur();
    baslatTaksit();
    baslatKargo();
    baslatKargoSuresi();
    baslatIndirimSayaclari();
    baslatGozlemci();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
