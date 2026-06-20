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

@Component({
  selector: 'app-cashier-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
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
      this.selectedTable.set(null);
      this.selectedBill.set(null);
    } catch (e) {
      console.error(e);
    } finally {
      this.processingPayment.set(false);
    }
  }

  async printInvoice() {
    await this.updateBillStatus('Ready');
    const invoiceEl = document.getElementById('printable-invoice');
    if (!invoiceEl) return;

    // Brief timeout to ensure rendering is complete before capture
    setTimeout(async () => {
      const canvas = await html2canvas(invoiceEl, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${this.selectedTable()?.tableNumber}_${Date.now()}.pdf`);
    }, 100);
  }
}
