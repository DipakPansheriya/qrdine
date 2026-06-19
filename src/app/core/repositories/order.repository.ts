import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Order } from '../models';
import { collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderRepository extends BaseRepository<Order> {
  protected collectionKey = 'orders';
  protected idKey: keyof Order = 'orderId';

  getBySession(sessionId: string): Observable<Order[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(collRef, where('sessionId', '==', sessionId));
    return collectionData(q, { idField: String(this.idKey) }) as Observable<Order[]>;
  }

  getByRestaurant(restaurantId: string): Observable<Order[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(collRef, where('restaurantId', '==', restaurantId));
    return collectionData(q, { idField: String(this.idKey) }) as Observable<Order[]>;
  }
}
