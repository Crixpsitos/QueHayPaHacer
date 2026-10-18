import { renderToHTMLString } from "@tiptap/static-renderer";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

const extensions = [StarterKit];
const SAFE_HREF = /^(https?:|mailto:|tel:)/i;
const schema = getSchema(extensions);

type Doc = Parameters<typeof renderToHTMLString>[0]["content"];
type Mark = { type?: unknown; attrs?: Record<string, unknown> };
type Node = { type?: unknown; content?: unknown; marks?: unknown; [k: string]: unknown };

const isSafeMark = (m: Mark) =>
  typeof m?.type === "string" && m.type in schema.marks &&
  (m.type !== "link" || (typeof m.attrs?.href === "string" && SAFE_HREF.test(m.attrs.href.trim())));
const isKnownNode = (n: Node) => typeof n?.type === "string" && n.type in schema.nodes;

function clean(node: Node): Node {
  return {
    ...node,
    ...(Array.isArray(node.marks) && { marks: (node.marks as Mark[]).filter(isSafeMark) }),
    ...(Array.isArray(node.content) && { content: (node.content as Node[]).filter(isKnownNode).map(clean) }),
  };
}

/**
 * Tiptap JSON → HTML sin DOM (nada de jsdom en el servidor). El renderer solo
 * emite nodos/marcas del esquema y escapa el texto. Se descartan nodos/marcas
 * fuera del esquema (si no, el render falla entero) y links que no sean http(s)/mailto/tel.
 */
export function renderDescriptionHTML(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  try {
    return renderToHTMLString({ content: clean(doc as Node) as Doc, extensions });
  } catch {
    return "";
  }
}
