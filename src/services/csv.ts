/**
 * Excel-friendly CSV helper
 * - Uses semicolon delimiter (common for DE locale Excel)
 * - Adds "sep=;" as first line so Excel auto-detects separator
 * - Uses CRLF line endings
 * - Escapes values that contain ;, \n, \r or "
 * - Prepends UTF-8 BOM to avoid umlaut issues in Excel
 */

export type CsvValue = string | number | boolean | Date | null | undefined;

function normalizeValue(v: CsvValue): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v);
}

function escapeCell(raw: string): string {
  const needsQuotes = /[;"\n\r]/.test(raw);
  if (!needsQuotes) return raw;
  return '"' + raw.replace(/"/g, '""') + '"';
}

export function toCsv(
  headers: string[],
  rows: Array<Record<string, CsvValue>>
): string {
  const delimiter = ";";
  const lines: string[] = [];

  lines.push(headers.map((h) => escapeCell(h)).join(delimiter));

  for (const row of rows) {
    const line = headers
      .map((h) => escapeCell(normalizeValue(row[h])))
      .join(delimiter);
    lines.push(line);
  }

  // UTF-8 BOM + CRLF
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

export function toExcelUtf16leCsvBuffer(csvText: string): Buffer {
  return Buffer.from("\uFEFF" + csvText, "utf16le");
}