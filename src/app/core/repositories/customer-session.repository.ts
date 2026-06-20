import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { CustomerSession } from '../models';
import { Observable } from 'rxjs';
import { collection, query, where, collectionData } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CustomerSessionRepository extends BaseRepository<CustomerSession> {
  protected override collectionKey = 'sessions';
  protected override idKey: keyof CustomerSession = 'sessionId';

  getByRestaurant(restaurantId: string): Observable<CustomerSession[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(collRef, where('restaurantId', '==', restaurantId));
    return collectionData(q, { idField: String(this.idKey) }) as Observable<CustomerSession[]>;
  }
}
