import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CashierFacade } from '../../../core/facades/cashier.facade';
import { Table, Payment } from '../../../core/models';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReceiptComponent } from '../../../shared/components/receipt/receipt.component';

@Component({
  selector: 'app-cashier-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    ReceiptComponent
  ],
  templateUrl: './cashier-dashboard.component.html',
  styleUrls: ['./cashier-dashboard.component.scss']
})
export class CashierDashboardComponent {
  cashierFacade = inject(CashierFacade);
  
  selectedTable = signal<Table | null>(null);
  selectedBill = signal<any>(null);
  
  today = new Date();

  processingPayment = signal(false);
  paymentSuccess = signal(false);

  selectTable(table: Table) {
    if (!table.activeSessionId) return;
    this.selectedTable.set(table);
    this.selectedBill.set(this.cashierFacade.generateBill(table.activeSessionId));
    
    // Auto-mark as Generating if they selected a Requested bill
    const session = this.cashierFacade.sessions().find(s => s.sessionId === table.activeSessionId);
    if (session && session.billStatus === 'Requested') {
      this.updateBillStatus('Generating');
    }
  }

  async updateBillStatus(status: 'Requested' | 'Generating' | 'Ready' | 'Paid' | 'Closed') {
    const table = this.selectedTable();
    if (!table || !table.activeSessionId) return;
    try {
      await this.cashierFacade.updateBillStatus(table.activeSessionId, status);
    } catch (e) {
      console.error('Failed to update bill status', e);
    }
  }

  getSession(sessionId: string) {
    return this.cashierFacade.sessions().find(s => s.sessionId === sessionId);
  }

  async processPayment(method: Payment['method']) {
    const table = this.selectedTable();
    const bill = this.selectedBill();
    if (!table || !bill) return;

    this.processingPayment.set(true);
    try {
      await this.cashierFacade.processPayment(table.id!, table.activeSessionId!, bill.grandTotal, method);
      this.paymentSuccess.set(true); // Show success overlay
      // Wait for user to dismiss or auto dismiss
    } catch (e) {
      console.error(e);
    } finally {
      this.processingPayment.set(false);
    }
  }

  dismissSuccess() {
    this.paymentSuccess.set(false);
    this.selectedTable.set(null);
    this.selectedBill.set(null);
  }

  async printReceipt() {
    await this.updateBillStatus('Ready');
    window.print();
  }

  async generatePdf() {
    await this.updateBillStatus('Ready');
    const receiptEl = document.getElementById('receipt-content');
    if (!receiptEl) return;

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // We temporarily adjust width for PDF rendering to ensure it fits A4 nicely
    const originalWidth = receiptEl.style.width;
    const originalMaxWidth = receiptEl.style.maxWidth;
    receiptEl.style.width = '210mm'; // A4 width
    receiptEl.style.maxWidth = '210mm';

    await pdf.html(receiptEl, {
      callback: (doc) => {
        receiptEl.style.width = originalWidth;
        receiptEl.style.maxWidth = originalMaxWidth;
        doc.save(`Receipt_${this.selectedTable()?.tableNumber}_${Date.now()}.pdf`);
      },
      x: 0,
      y: 0,
      width: 210,
      windowWidth: 794 // Approximately 210mm in pixels at 96dpi
    });
  }
}
