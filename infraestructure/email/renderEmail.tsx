import { render } from "@react-email/components"
import type { EmailModel } from "@/domain/entities/email/templates"
import { EmailLayout } from "./EmailLayout"

/** Dibuja el correo (HTML) a partir de su modelo. */
export const renderEmailHtml = (m: EmailModel): Promise<string> => render(<EmailLayout m={m} />)
