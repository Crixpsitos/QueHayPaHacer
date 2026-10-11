import { connection } from "next/server";

/**
 * Digital Asset Links para la app Android (TWA). Sin esto la TWA muestra la
 * barra de URL del navegador. Huellas SHA-256 del certificado de firma de Play
 * (Play Console → Integridad de la app), separadas por coma.
 */
export async function GET() {
  // Variables de RUNTIME (apphosting.yaml): no hornear el valor del build.
  await connection();
  const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  if (fingerprints.length === 0) return Response.json([]);

  return Response.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: process.env.ANDROID_PACKAGE_NAME || "com.quehaypahacer.app",
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]);
}
