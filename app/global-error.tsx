"use client";

// Reemplaza al root layout cuando éste falla: sin estilos globales, solo HTML plano.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, textAlign: "center", padding: 16 }}>
        <title>Error | Que Hay Pa Hacer</title>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>No pudimos cargar Que Hay Pa Hacer</p>
          <p style={{ color: "#555" }}>Fue un error de nuestro lado. Intenta de nuevo en unos segundos.</p>
          <button onClick={() => retry()} style={{ marginTop: 8, padding: "8px 16px", cursor: "pointer" }}>
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
