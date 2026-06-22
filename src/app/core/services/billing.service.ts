import { Injectable } from '@angular/core';
import { Order, Settings } from '../models';

export interface BillSummary {
  orders: Order[];
  items: any[];
  subtotal: number;
  tax: number;
  discount: number;
  serviceCharge: number;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
  ordersCount: number;
}

@Injectable({ providedIn: 'root' })
export class BillingCalculationService {
  
  calculateSessionSummary(orders: Order[], settings: Settings | null): BillSummary {
    let subtotal = 0;
    let tax = 0;
    let grandTotal = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let items: any[] = [];

    const activeOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded');

    activeOrders.forEach(o => {
      subtotal += o.subtotal || 0;
      tax += o.tax || 0;
      grandTotal += o.grandTotal || 0;
      items = [...items, ...(o.items || [])];

      if (o.paymentStatus === 'PAID') {
        paidAmount += o.grandTotal || 0;
      } else {
        pendingAmount += o.grandTotal || 0;
      }
    });

    const discount = 0;
    // Derive service charge since it is baked into grandTotal during order placement
    const serviceCharge = Math.max(0, grandTotal - subtotal - tax + discount);

    // To prevent rounding errors where sum(orders) != grandTotal, we force pendingAmount to be grandTotal - paidAmount
    pendingAmount = Math.max(0, grandTotal - paidAmount);

    return {
      orders: activeOrders,
      items,
      subtotal,
      tax,
      discount,
      serviceCharge,
      grandTotal,
      paidAmount,
      pendingAmount,
      ordersCount: activeOrders.length
    };
  }
}
