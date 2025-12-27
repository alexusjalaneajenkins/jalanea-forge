declare module 'html2pdf.js' {
  interface Html2PdfWorker extends Promise<void> {
    set(opt: any): Html2PdfWorker;
    from(element: HTMLElement | string): Html2PdfWorker;
    save(filename?: string): Html2PdfWorker;
    toPdf(): Html2PdfWorker;
    output(type: string, options?: any): Html2PdfWorker;
  }
  
  function html2pdf(element?: HTMLElement | string, opt?: any): Html2PdfWorker;
  export default html2pdf;
}
