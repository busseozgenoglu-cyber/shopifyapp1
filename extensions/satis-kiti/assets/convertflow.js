/* ============================================================
   CONVERTFLOW TR — Mükemmel Satış Artırıcı Blok Motoru
   Intersection Observer + Smooth Animasyon + Confetti
   ============================================================ */

(function () {
  'use strict';

  /* ---------- UTILITIES ---------- */
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

  /* ---------- INTERSECTION OBSERVER (Animasyon trigger) ---------- */
  function baslatGozlemci() {
    if (!window.IntersectionObserver) return;
    const gozlemci = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('cf-gorunur');
          gozlemci.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.cf-taksit, .cf-kargo, .cf-rozetler, .cf-aciliyet, .cf-indirim').forEach(function (el) {
      gozlemci.observe(el);
    });
  }

  /* ---------- CONFETTI MOTORU ---------- */
  function confettiPatlat(x, y, renkler) {
    renkler = renkler || ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#DC2626', '#06B6D4'];
    const container = document.createElement('div');
    container.className = 'cf-confetti';
    document.body.appendChild(container);

    for (let i = 0; i < 40; i++) {
      const parca = document.createElement('div');
      parca.className = 'cf-confetti-parca';
      parca.style.left = (x + (Math.random() - 0.5) * 200) + 'px';
      parca.style.top = (y + (Math.random() - 0.5) * 100) + 'px';
      parca.style.background = renkler[Math.floor(Math.random() * renkler.length)];
      parca.style.width = (4 + Math.random() * 8) + 'px';
      parca.style.height = (4 + Math.random() * 8) + 'px';
      parca.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      parca.style.animationDuration = (2 + Math.random() * 2) + 's';
      parca.style.animationDelay = (Math.random() * 0.5) + 's';
      container.appendChild(parca);
    }

    setTimeout(function () { container.remove(); }, 4500);
  }

  /* ============================================================
     TAKSIT TABLOSU
     ============================================================ */
  function baslatTaksit() {
    const tablolar = document.querySelectorAll('[data-sk-taksit]');
    if (!tablolar.length) return;

    tablolar.forEach(function (tablo) {
      const plan = tablo.dataset.plan;
      const fiyat = parseInt(tablo.dataset.fiyat, 10);
      const altLimit = parseInt(tablo.dataset.altLimit, 10) || 0;
      const minTaksit = parseInt(tablo.dataset.minTaksitTutari, 10) || 100;
      const paraFormati = tablo.dataset.paraFormati;
      const vadeEtiketi = tablo.dataset.vadeEtiketi;
      const taksitKelimesi = tablo.dataset.taksitKelimesi || 'taksit';
      const govde = tablo.querySelector('[data-sk-taksit-govde]');
      if (!govde || !plan || !fiyat || fiyat < altLimit) return;

      const satirlar = plan.split(',').map(function (s) { return parseInt(s.trim(), 10); }).filter(Boolean);
      let html = '';

      satirlar.forEach(function (vade, i) {
        const aylik = Math.ceil(fiyat / vade);
        if (aylik < minTaksit) return;
        const toplam = aylik * vade;
        const fark = toplam - fiyat;
        const etiket = fark <= 0 && vadeEtiketi ? '<span class="cf-taksit__vade-etiket">' + vadeEtiketi + '</span>' : '';

        html += '<tr style="animation-delay:' + (i * 0.08) + 's">' +
          '<td>' + vade + ' ' + taksitKelimesi + etiket + '</td>' +
          '<td><strong>' + formatPara(aylik, paraFormati) + '</strong></td>' +
          '<td>' + formatPara(toplam, paraFormati) + '</td>' +
          '</tr>';
      });

      govde.innerHTML = html;
    });
  }

  /* ============================================================
     KARGO BARİ
     ============================================================ */
  function baslatKargo() {
    const barlar = document.querySelectorAll('[data-sk-kargo]');
    if (!barlar.length) return;

    barlar.forEach(function (bar) {
      const esik = parseInt(bar.dataset.esik, 10);
      const mesajDevam = bar.dataset.mesajDevam;
      const mesajTamam = bar.dataset.mesajTamam;
      const paraFormati = bar.dataset.paraFormati;
      const mesajEl = bar.querySelector('[data-sk-kargo-mesaj]');
      const dolguEl = bar.querySelector('[data-sk-kargo-dolgu]');
      const rayEl = bar.querySelector('[data-sk-kargo-ray]');
      if (!esik || !mesajEl || !dolguEl) return;

      function guncelle() {
        fetch('/cart.js', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
          .then(function (r) { return r.json(); })
          .then(function (cart) {
            const toplam = cart.total_price;
            const kalan = Math.max(0, esik - toplam);
            const yuzde = esik > 0 ? Math.min(100, Math.round((toplam / esik) * 100)) : 0;

            if (kalan > 0) {
              mesajEl.textContent = mesajDevam.replace('[tutar]', formatPara(kalan, paraFormati));
            } else {
              mesajEl.textContent = mesajTamam;
              mesajEl.classList.add('cf-kargo__tamam');
              // Confetti when free shipping reached!
              if (!bar.dataset.celebrated) {
                bar.dataset.celebrated = '1';
                const rect = bar.getBoundingClientRect();
                confettiPatlat(rect.left + rect.width / 2, rect.top, ['#10B981', '#34D399', '#6EE7B7', '#059669']);
              }
            }

            dolguEl.style.width = yuzde + '%';
            if (rayEl) {
              rayEl.setAttribute('aria-valuenow', yuzde);
              rayEl.setAttribute('aria-valuetext', yuzde + '% tamamlandı');
            }
          })
          .catch(function () {});
      }

      guncelle();
      document.addEventListener('cart:updated', debounce(guncelle, 300));
      document.addEventListener('cart:refresh', debounce(guncelle, 300));
    });
  }

  /* ============================================================
     KARGO SURESI SAYACI
     ============================================================ */
  function baslatKargoSuresi() {
    const sayaclar = document.querySelectorAll('[data-sk-aciliyet]');
    if (!sayaclar.length) return;

    sayaclar.forEach(function (sayac) {
      const kesimSaati = sayac.dataset.kesimSaati;
      const mesaj = sayac.dataset.mesaj;
      const sonMesaj = sayac.dataset.sonMesaj;
      const mesajEl = sayac.querySelector('[data-sk-aciliyet-mesaj]');
      if (!kesimSaati || !mesajEl) return;

      const [saat, dakika] = kesimSaati.split(':').map(Number);

      function guncelle() {
        const simdi = new Date();
        const bugunKesim = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate(), saat, dakika, 0);
        if (bugunKesim < simdi) bugunKesim.setDate(bugunKesim.getDate() + 1);

        const kalan = bugunKesim - simdi;
        const kSaat = Math.floor(kalan / (1000 * 60 * 60));
        const kDakika = Math.floor((kalan % (1000 * 60 * 60)) / (1000 * 60));

        if (kalan <= 0) {
          mesajEl.textContent = sonMesaj || 'Bugünkü kargo kesim saati doldu. Yarın kargolanacak.';
          mesajEl.style.opacity = '0.6';
        } else {
          mesajEl.textContent = mesaj
            .replace('[saat]', kSaat)
            .replace('[dakika]', kDakika)
            .replace('[sure]', kSaat + ' saat ' + kDakika + ' dakika');
        }
      }

      guncelle();
      setInterval(guncelle, 30000);
    });
  }

  /* ============================================================
     INDIRIM SAYACI
     ============================================================ */
  function baslatIndirimSayaclari() {
    const sayaclar = document.querySelectorAll('[data-cf-indirim]');
    if (!sayaclar.length) return;

    sayaclar.forEach(function (sayac) {
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

      let confettiAtildi = false;

      function guncelle() {
        const simdi = new Date();
        const kalan = bitis - simdi;

        if (kalan <= 0) {
          elGun.textContent = '00';
          elSaat.textContent = '00';
          elDakika.textContent = '00';
          elSaniye.textContent = '00';
          if (elMesaj && mesajBitti) elMesaj.textContent = mesajBitti;
          sayac.style.opacity = '0.6';

          if (!confettiAtildi) {
            confettiAtildi = true;
            const rect = sayac.getBoundingClientRect();
            confettiPatlat(rect.left + rect.width / 2, rect.top, ['#DC2626', '#F97316', '#FBBF24', '#EF4444']);
          }
          return;
        }

        const gun = Math.floor(kalan / (1000 * 60 * 60 * 24));
        const saat = Math.floor((kalan % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const dakika = Math.floor((kalan % (1000 * 60 * 60)) / (1000 * 60));
        const saniye = Math.floor((kalan % (1000 * 60)) / 1000);

        elGun.textContent = String(gun).padStart(2, '0');
        elSaat.textContent = String(saat).padStart(2, '0');
        elDakika.textContent = String(dakika).padStart(2, '0');
        elSaniye.textContent = String(saniye).padStart(2, '0');

        if (elMesaj && mesajAktif) elMesaj.textContent = mesajAktif;

        // Urgency effect when less than 1 hour
        if (kalan < 1000 * 60 * 60) {
          sayac.style.borderColor = '#ef4444';
          sayac.style.boxShadow = '0 0 20px rgba(220,38,38,0.15)';
        }
      }

      guncelle();
      setInterval(guncelle, 1000);
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
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
