import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class QrUtilityService {

  constructor() { }

  private async captureElement(elementId: string): Promise<HTMLCanvasElement | null> {
    const element = document.getElementById(elementId);
    if (!element) return null;

    // Find the dialog content container and remove overflow restrictions
    const dialogContent = element.closest('.mat-mdc-dialog-content') as HTMLElement;
    let originalOverflow = '';
    let originalMaxHeight = '';

    if (dialogContent) {
      originalOverflow = dialogContent.style.overflow;
      originalMaxHeight = dialogContent.style.maxHeight;
      dialogContent.style.overflow = 'visible';
      dialogContent.style.maxHeight = 'none';
    }

    try {
      // Force a tiny layout reflow to ensure styles apply
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      });
      return canvas;
    } finally {
      if (dialogContent) {
        dialogContent.style.overflow = originalOverflow;
        dialogContent.style.maxHeight = originalMaxHeight;
      }
    }
  }

  async downloadAsPng(elementId: string, filename: string): Promise<void> {
    try {
      const canvas = await this.captureElement(elementId);
      if (!canvas) return;
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating PNG', error);
    }
  }

  async downloadAsPdf(elementId: string, filename: string): Promise<void> {
    try {
      const canvas = await this.captureElement(elementId);
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Print starting a bit down
      const yOffset = 20;

      pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, pdfHeight);
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF', error);
    }
  }

  printQr(): void {
    window.print();
  }
}
