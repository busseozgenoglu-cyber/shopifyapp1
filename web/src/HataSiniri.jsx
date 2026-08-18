import React from "react";

/**
 * Panelde yakalanmayan bir hata olustugunda React tum agaci soker ve ekran
 * bembeyaz kalir; magaza sahibi ne oldugunu anlamaz, inceleme de bunu
 * "uygulama acilmiyor" olarak degerlendirir. Hata siniri en azindan ne
 * oldugunu ve ne yapilacagini gosterir.
 */
export default class HataSiniri extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hata: null };
  }

  static getDerivedStateFromError(hata) {
    return { hata };
  }

  componentDidCatch(hata, bilgi) {
    console.error("[Satış Kiti] Panel hatası:", hata, bilgi?.componentStack);
  }

  render() {
    if (!this.state.hata) return this.props.children;

    return (
      <div
        style={{
          maxWidth: 520,
          margin: "80px auto",
          padding: 24,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          border: "1px solid #e3e3e3",
          borderRadius: 12,
          background: "#fff",
        }}
      >
        <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>Panel açılamadı</h1>
        <p style={{ margin: "0 0 16px", color: "#616161", lineHeight: 1.5 }}>
          Beklenmeyen bir hata oluştu. Sayfayı yenilemek çoğu durumda yeterli
          oluyor. Sorun sürerse busseozgenoglu@gmail.com adresine yazın.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #1a1a1a",
            background: "#1a1a1a",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Sayfayı yenile
        </button>
        <p style={{ marginTop: 16, fontSize: 12, color: "#8a8a8a" }}>
          {String(this.state.hata?.message || this.state.hata)}
        </p>
      </div>
    );
  }
}
