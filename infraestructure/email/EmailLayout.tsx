import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components"
import type { EmailModel } from "@/domain/entities/email/templates"

const WINE = "#9B0A26"
const INK = "#27272A"
const MUTED = "#71717A"

/** Diseño único de los correos de Qué Hay Pa Hacer: vinotinto de marca, blanco, texto legible en celular. React escapa todo lo que viene de personas. */
export function EmailLayout({ m }: { m: EmailModel }) {
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
