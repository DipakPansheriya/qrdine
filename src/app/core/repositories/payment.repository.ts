import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Payment } from '../models';
import { Observable } from 'rxjs';
import { collection, query, where, collectionData } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class PaymentRepository extends BaseRepository<Payment> {
  protected override collectionKey = 'payments';
  protected override idKey: keyof Payment = 'paymentId';

  getByRestaurant(restaurantId: string): Observable<Payment[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(collRef, where('restaurantId', '==', restaurantId));
    return collectionData(q, { idField: String(this.idKey) }) as Observable<Payment[]>;
  }
}
