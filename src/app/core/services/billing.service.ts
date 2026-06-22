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
    let paidAmount = 0;
    let pendingAmount = 0;
    let items: any[] = [];

    const activeOrders = orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Refunded');

    activeOrders.forEach(o => {
      subtotal += o.subtotal || 0;
      items = [...items, ...(o.items || [])];
    });

    const serviceChargePercentage = settings?.serviceChargePercentage || 0;
    const gstPercentage = settings?.gstPercentage || 0;

    const discount = 0;
    const postDiscount = subtotal - discount;
    const serviceCharge = (postDiscount * serviceChargePercentage) / 100;
    const tax = ((postDiscount + serviceCharge) * gstPercentage) / 100;
    const grandTotal = postDiscount + serviceCharge + tax;

    // Distribute paid vs pending. If order is marked PAID, it covers its fraction of grandTotal.
    // However, if we process order level payments, an order's subtotal might be known, but what about its share of tax/service charge?
    // Actually, order.grandTotal is already calculated. We can just use order.grandTotal!
    
    // Wait, the order.grandTotal in the database might not include the session-level discount/fees if they are applied globally.
    // But currently, CustomerFacade calculates order.grandTotal using cartSubtotal + cartTax.
    // Let's recalculate accurately here.
    
    activeOrders.forEach(o => {
      // Re-calculate the grandTotal for the order to include service charge/tax based on current settings
      const oDiscount = 0;
      const oPostDiscount = (o.subtotal || 0) - oDiscount;
      const oServiceCharge = (oPostDiscount * serviceChargePercentage) / 100;
      const oTax = ((oPostDiscount + oServiceCharge) * gstPercentage) / 100;
      const oGrandTotal = oPostDiscount + oServiceCharge + oTax;

      if (o.paymentStatus === 'PAID') {
        paidAmount += oGrandTotal;
      } else {
        pendingAmount += oGrandTotal;
      }
    });

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
