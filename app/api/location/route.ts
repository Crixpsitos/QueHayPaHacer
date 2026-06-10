import { NextResponse } from "next/server";
import { connection } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  await connection();

  try {
    const geoReader = globalThis.cachedGeoReader;
    if (!geoReader) return NextResponse.json(null);

    const hdrs = await headers();
    const rawIp = hdrs.get("x-client-ip");
    if (!rawIp) return NextResponse.json(null);

    const location = geoReader.city(rawIp);

    return NextResponse.json({
      city: location.city?.names.es || location.city?.names.en || "",
      country: {
        isoCode: location.country?.isoCode || "",
        name: location.country?.names.es || location.country?.names.en || "",
      },
      state: {
        isoCode: location.subdivisions?.[0]?.isoCode || "",
        name: location.subdivisions?.[0]?.names.es || location.subdivisions?.[0]?.names.en || "",
      },
    });
  } catch {
    return NextResponse.json(null);
  }
}
