export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "#8a8678",
        }}
      >
        Istmo Marketing PA · Fase 0
      </div>
      <h1
        style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 400,
          fontSize: 44,
          letterSpacing: "-.02em",
          margin: 0,
        }}
      >
        NORBOT Group · CRM
      </h1>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          maxWidth: 460,
          lineHeight: 1.5,
          color: "#5a5648",
        }}
      >
        Andamiaje listo: Next.js 16 · App Router · TypeScript, con Supabase y
        papaparse instalados. La interfaz completa llega en la Fase 1.
      </p>
    </main>
  );
}
