declare module 'pdfmake/src/printer' {
  import type { TDocumentDefinitions } from 'pdfmake/interfaces';

  class PdfPrinter {
    constructor(fonts: any);
    createPdfKitDocument(
      docDefinition: TDocumentDefinitions,
      options?: any
    ): any;
  }

  export default PdfPrinter;
}
