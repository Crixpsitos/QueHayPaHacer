import { Body, Button, Column, Container, Head, Heading, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components"
import type { EmailModel, WeeklyBlock, WeeklyCard } from "@/domain/entities/email/templates"

const WINE = "#9B0A26"
const INK = "#27272A"
const MUTED = "#71717A"
const GOLD = "#FFB703"
const CREAM = "#FFF8E7"

/** Diseño único de los correos de Qué Hay Pa Hacer: vinotinto de marca, blanco, texto legible en celular. React escapa todo lo que viene de personas. */
export function EmailLayout({ m }: { m: EmailModel }) {
  if (m.weekly) return <WeeklyLayout m={m} w={m.weekly} />
  return (
    <Html lang="es-CO">
      <Head />
      <Preview>{m.heading}</Preview>
      <Body style={{ margin: 0, backgroundColor: "#FAFAFC", fontFamily: "Arial, Helvetica, sans-serif", color: INK }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
          <Text style={{ margin: "0 0 16px", fontWeight: 700, color: WINE, fontSize: 16 }}>Qué Hay Pa Hacer</Text>
          <Heading as="h1" style={{ margin: "0 0 12px", fontSize: 22, lineHeight: "1.25", color: INK }}>{m.heading}</Heading>
          {m.paragraphs.map((p) => <Text key={p} style={{ margin: "0 0 8px", fontSize: 16, lineHeight: "1.5" }}>{p}</Text>)}
          {m.items.length ? (
            <Section>
              {m.items.map((i) => (
                <Text key={i.href} style={{ margin: "0 0 14px", lineHeight: "1.4" }}>
                  <Link href={i.href} style={{ color: WINE, fontWeight: 700, textDecoration: "none", fontSize: 16 }}>{i.title}</Link><br />
                  <span style={{ fontSize: 14, color: "#52525B" }}>{i.when}</span>
                </Text>
              ))}
            </Section>
          ) : null}
          {m.cta ? <Section style={{ margin: "20px 0" }}><Button href={m.cta.href} style={{ backgroundColor: WINE, color: "#FFFFFF", padding: "12px 22px", borderRadius: 999, fontWeight: 700, textDecoration: "none" }}>{m.cta.label}</Button></Section> : null}
          <Hr style={{ borderColor: "#E4E4E7", margin: "24px 0" }} />
          <Text style={{ margin: 0, fontSize: 12, lineHeight: "1.5", color: MUTED }}>
            {m.reason}<br />
            <Link href={m.unsubscribeUrl} style={{ color: WINE }}>Dejar de recibir correos</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const priceStyle = (price: string) => (price === "Gratis" || price === "Evento" ? { backgroundColor: "#E4F5E8", color: "#14532D" } : { backgroundColor: CREAM, color: "#7A5200" })

function WeeklyRow({ c }: { c: WeeklyCard }) {
  return (
    <Row style={{ borderTop: "1px solid #F1E3E6" }}>
      <Column style={{ width: 88, paddingTop: 12, paddingBottom: 12, verticalAlign: "middle" }}>
        {c.imageUrl ? <Img src={c.imageUrl} width="76" height="76" alt="" style={{ borderRadius: 16, objectFit: "cover", display: "block" }} /> : <div style={{ width: 76, height: 76, borderRadius: 16, backgroundColor: "#F6C9CF" }} />}
      </Column>
      <Column style={{ verticalAlign: "middle", paddingTop: 12, paddingBottom: 12 }}>
        <Link href={c.href} style={{ color: INK, fontWeight: 700, fontSize: 16, lineHeight: "1.25", textDecoration: "none" }}>{c.title}</Link>
        <Text style={{ margin: "3px 0 0", fontSize: 13, color: MUTED }}>{[c.when, c.place].filter(Boolean).join(" · ")}</Text>
      </Column>
      {c.price ? <Column style={{ width: 96, textAlign: "right", verticalAlign: "middle" }}><span style={{ ...priceStyle(c.price), borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{c.price.replace("Desde ", "")}</span></Column> : null}
    </Row>
  )
}

/** Correo semanal con portada: vinotinto con la tira de días, plan destacado con foto, filas por día y un solo botón. */
function WeeklyLayout({ m, w }: { m: EmailModel; w: WeeklyBlock }) {
  return (
    <Html lang="es-CO">
      <Head />
      <Preview>{`${m.heading}: ${w.total} planes elegidos para ti`}</Preview>
      <Body style={{ margin: 0, backgroundColor: "#F3EDEE", fontFamily: "Arial, Helvetica, sans-serif", color: INK }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: "20px 12px" }}>
          <Section style={{ backgroundColor: "#FFFFFF", borderRadius: 24, overflow: "hidden" }}>
            <Section style={{ backgroundColor: WINE, padding: "28px 32px 26px" }}>
              <Text style={{ margin: 0, color: "#FFFFFF", fontWeight: 700, fontSize: 15 }}>Qué Hay Pa Hacer</Text>
              <Heading as="h1" style={{ margin: "22px 0 8px", color: "#FFFFFF", fontSize: 34, lineHeight: "1.08", fontWeight: 800 }}>{m.heading}</Heading>
              <Text style={{ margin: 0, color: "#FDE7EB", fontSize: 15, lineHeight: "1.5" }}>{w.range} · {w.total} planes elegidos para ti</Text>
              <Row style={{ marginTop: 20 }}>
                {w.days.map((d, i) => (
                  <Column key={d.label} style={{ paddingRight: i < w.days.length - 1 ? 8 : 0 }}>
                    <div style={{ backgroundColor: i === 0 ? GOLD : "rgba(255,255,255,0.16)", color: i === 0 ? INK : "#FFFFFF", borderRadius: 16, textAlign: "center", padding: "8px 4px", fontSize: 12, fontWeight: 600 }}>
                      {d.label.split(" ")[0].slice(0, 3)}<br /><span style={{ fontSize: 20, fontWeight: 800 }}>{d.label.split(" ")[1] ?? ""}</span><br />{d.count} {d.count === 1 ? "plan" : "planes"}
                    </div>
                  </Column>
                ))}
              </Row>
            </Section>
            <Section style={{ padding: "26px 32px 4px" }}>
              {w.featured ? (
                <>
                  <Text style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700, color: INK }}>El plan que no te puedes perder</Text>
                  <Section style={{ border: "1px solid #F1E3E6", borderRadius: 20, overflow: "hidden" }}>
                    {w.featured.imageUrl ? <Img src={w.featured.imageUrl} width="536" alt={w.featured.title} style={{ width: "100%", height: "auto", display: "block" }} /> : null}
                    <Section style={{ padding: "16px 18px" }}>
                      <Text style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: "1.15" }}>{w.featured.title}</Text>
                      <Text style={{ margin: "6px 0 12px", fontSize: 14, color: "#52525B" }}>{[w.featured.when, w.featured.place, w.featured.price.replace("Desde ", "")].filter(Boolean).join(" · ")}</Text>
                      <Button href={w.featured.href} style={{ backgroundColor: WINE, color: "#FFFFFF", padding: "12px 22px", borderRadius: 999, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>Ver el plan</Button>
                    </Section>
                  </Section>
                </>
              ) : null}
              {w.groups.map((g) => (
                <Section key={g.title} style={{ marginTop: 22 }}>
                  <Text style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: WINE }}>{g.title}</Text>
                  {g.items.map((c) => <WeeklyRow key={c.href + c.when} c={c} />)}
                </Section>
              ))}
              <Section style={{ textAlign: "center", margin: "26px 0 10px" }}>
                <Button href={w.allHref} style={{ backgroundColor: WINE, color: "#FFFFFF", padding: "15px 30px", borderRadius: 999, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>Ver los {w.total} planes</Button>
              </Section>
            </Section>
            <Section style={{ backgroundColor: "#FBF6F7", padding: "20px 32px 26px", marginTop: 14 }}>
              <Text style={{ margin: 0, fontSize: 13, lineHeight: "1.55", color: "#52525B" }}>{m.reason}</Text>
              <Text style={{ margin: "8px 0 0", fontSize: 13 }}>
                <Link href={`${w.allHref.split("/actividades")[0]}/avisos`} style={{ color: WINE, fontWeight: 600 }}>Cambiar mis avisos</Link>{"  ·  "}
                <Link href={m.unsubscribeUrl} style={{ color: WINE, fontWeight: 600 }}>Dejar de recibir correos</Link>
              </Text>
              <Text style={{ margin: "8px 0 0", fontSize: 12, color: MUTED }}>Qué Hay Pa Hacer · Ibagué, Tolima</Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
