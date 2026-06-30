/** Utilidades de exportación CSV (cliente, sin dependencias ni storage). */

const escapeCell = (value: string): string => {
  const needsQuotes = /[",\n;]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((cols) => cols.map(escapeCell).join(","));
  // BOM para que Excel respete acentos.
  return "﻿" + lines.join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
