import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private tenantIdSignal = signal<string | null>(null);

  get tenantId() {
    return this.tenantIdSignal.asReadonly();
  }

  setTenantId(restaurantId: string | null) {
    this.tenantIdSignal.set(restaurantId);
  }

  get currentTenantId(): string | null {
    return this.tenantIdSignal();
  }
}
