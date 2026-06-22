import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  public code = signal<string>('INR');
  public symbol = signal<string>('₹');

  updateCurrency(settings: any) {
    if (settings?.currencyCode) {
      this.code.set(settings.currencyCode);
    }
    if (settings?.currencySymbol) {
      this.symbol.set(settings.currencySymbol);
    }
  }
}
