import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType) {
    case "pdf": {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    }
    case "docx":
    case "doc": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "xlsx":
    case "xls":
    case "csv": {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const textParts: string[] = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        // Convert to array of arrays for clean text extraction
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });

        if (rows.length === 0) continue;

        textParts.push(`--- Sheet: ${sheetName} ---`);

        // Use first row as headers if it looks like a header row
        const headers = rows[0] as string[];
        const dataRows = rows.slice(1);

        if (dataRows.length > 0) {
          // Format as "Header: Value" pairs for better AI comprehension
          for (const row of dataRows) {
            const pairs = (row as string[])
              .map((cell, i) => {
                const header = headers[i] || `Column ${i + 1}`;
                const value = String(cell).trim();
                return value ? `${header}: ${value}` : null;
              })
              .filter(Boolean);

            if (pairs.length > 0) {
              textParts.push(pairs.join(" | "));
            }
          }
        } else {
          // Only headers, just join them
          textParts.push(headers.join(" | "));
        }
      }

      return textParts.join("\n");
    }
    case "txt":
    case "md": {
      return buffer.toString("utf-8");
    }
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Extract text from an Excel file per sheet/tab.
 * Returns an array of { sheetName, text } for each non-empty sheet.
 */
export function extractExcelSheets(
  buffer: Buffer
): Array<{ sheetName: string; text: string; rowCount: number }> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheets: Array<{ sheetName: string; text: string; rowCount: number }> = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });

    if (rows.length <= 1) continue; // Skip empty or header-only sheets

    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);
    const textParts: string[] = [];

    textParts.push(`Section: ${sheetName}`);
    textParts.push(`Columns: ${headers.filter(Boolean).join(", ")}`);

    for (const row of dataRows) {
      const pairs = (row as string[])
        .map((cell, i) => {
          const header = headers[i] || `Column ${i + 1}`;
          const value = String(cell).trim();
          return value ? `${header}: ${value}` : null;
        })
        .filter(Boolean);

      if (pairs.length > 0) {
        textParts.push(pairs.join(" | "));
      }
    }

    sheets.push({
      sheetName,
      text: textParts.join("\n"),
      rowCount: dataRows.length,
    });
  }

  return sheets;
}

/**
 * Split text into chunks of roughly `maxTokens` words with overlap.
 */
export function chunkText(
  text: string,
  maxTokens: number = 400,
  overlap: number = 50
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + maxTokens, words.length);
    const chunk = words.slice(start, end).join(" ");
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
    if (end >= words.length) break;
    start = end - overlap;
  }

  return chunks;
}
