import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveGeoIso, toGeoSlug, buildLocationDetails } from "./geoLocation";

test("resolveGeoIso: Colombia/Tolima → CO/TOL", () => {
  assert.deepEqual(resolveGeoIso("Colombia", "Tolima"), {
    countryIso: "CO",
    departmentIso: "TOL",
  });
});

test("resolveGeoIso: desconocido → cadenas vacías", () => {
  assert.deepEqual(resolveGeoIso("Narnia", "Nada"), { countryIso: "", departmentIso: "" });
});

test("toGeoSlug: quita acentos y espacios", () => {
  assert.equal(toGeoSlug("Ibagué"), "ibague");
});

test("buildLocationDetails: Ibagué arma objetos con iso+slug", () => {
  const { country, department, city } = buildLocationDetails({
    countryName: "Colombia",
    departmentName: "Tolima",
    cityName: "Ibagué",
  });
  assert.deepEqual(country, { isoCode: "CO", name: "Colombia", slug: "colombia" });
  assert.deepEqual(department, { isoCode: "TOL", name: "Tolima", slug: "tolima" });
  assert.deepEqual(city, { name: "Ibagué", slug: "ibague" });
});
