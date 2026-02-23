/**
 * Type declarations for pdfmake server-side usage
 *
 * pdfmake's TypeScript types are browser-focused, but the server-side
 * PdfPrinter class is exported from pdfmake/Printer.
 */

declare module 'pdfmake/Printer' {
  import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

  export interface PdfKitDocument extends NodeJS.ReadableStream {
    end(): void;
    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }

  export default class PdfPrinter {
    constructor(fontDescriptors: TFontDictionary);
    createPdfKitDocument(
      docDefinition: TDocumentDefinitions,
      options?: unknown
    ): Promise<PdfKitDocument>;
  }
}
