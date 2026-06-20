import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { CustomerRequest } from '../models';
import { Observable } from 'rxjs';
import { collection, query, where, collectionData } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CustomerRequestRepository extends BaseRepository<CustomerRequest> {
  protected override collectionKey = 'customerRequests';
  protected override idKey: keyof CustomerRequest = 'requestId';

  getByRestaurant(restaurantId: string): Observable<CustomerRequest[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(collRef, where('restaurantId', '==', restaurantId));
    return collectionData(q, { idField: String(this.idKey) }) as Observable<CustomerRequest[]>;
  }

  getActiveByRestaurant(restaurantId: string): Observable<CustomerRequest[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(
      collRef, 
      where('restaurantId', '==', restaurantId),
      where('status', '==', 'Pending')
    );
    return collectionData(q, { idField: String(this.idKey) }) as Observable<CustomerRequest[]>;
  }
}
