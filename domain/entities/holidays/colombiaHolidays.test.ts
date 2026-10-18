import { test } from "node:test"
import assert from "node:assert/strict"
import { computeColombiaHolidays, easterSunday, holidayMap } from "./colombiaHolidays"

const dates = (y: number) => computeColombiaHolidays(y).map((h) => h.date)

test("Pascua: fechas conocidas", () => {
  assert.equal(easterSunday(2025).toISOString().slice(0, 10), "2025-04-20")
  assert.equal(easterSunday(2026).toISOString().slice(0, 10), "2026-04-05")
  assert.equal(easterSunday(2027).toISOString().slice(0, 10), "2027-03-28")
})

test("2026: los 18 festivos del calendario oficial", () => {
  assert.deepEqual(dates(2026), [
    "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03", "2026-05-01",
    "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29", "2026-07-20", "2026-08-07",
    "2026-08-17", "2026-10-12", "2026-11-02", "2026-11-16", "2026-12-08", "2026-12-25",
  ])
})

test("2025: trasladados al lunes y coincidencia del 30 de junio", () => {
  const d = dates(2025)
  for (const x of ["2025-01-06", "2025-03-24", "2025-04-17", "2025-04-18", "2025-06-02", "2025-06-23",
    "2025-06-30", "2025-07-20", "2025-08-18", "2025-10-13", "2025-11-03", "2025-11-17"]) assert.ok(d.includes(x), x)
  assert.equal(d.filter((x) => x === "2025-06-30").length, 2) // Sagrado Corazón y San Pedro y San Pablo
  assert.match(holidayMap(computeColombiaHolidays(2025))["2025-06-30"], / y /)
})

test("los festivos trasladables siempre caen en lunes; los fijos no se mueven", () => {
  for (let y = 2024; y <= 2040; y++) {
    const list = computeColombiaHolidays(y)
    const moved = ["Día de los Reyes Magos", "Día de San José", "San Pedro y San Pablo", "Asunción de la Virgen",
      "Día de la Raza", "Todos los Santos", "Independencia de Cartagena", "Ascensión del Señor", "Corpus Christi",
      "Sagrado Corazón de Jesús"]
    for (const h of list) {
      const dow = new Date(`${h.date}T00:00:00Z`).getUTCDay()
      if (moved.includes(h.name)) assert.equal(dow, 1, `${y} ${h.name}`)
    }
    assert.ok(list.some((h) => h.date === `${y}-07-20`) && list.some((h) => h.date === `${y}-12-25`))
    assert.equal(list.length, 18)
  }
})
