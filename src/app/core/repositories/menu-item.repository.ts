import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { MenuItem } from '../models';
import { collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MenuItemRepository extends BaseRepository<MenuItem> {
  protected collectionKey = 'menuItems';
  protected idKey: keyof MenuItem = 'itemId';

  getByRestaurant(restaurantId: string): Observable<MenuItem[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(collRef, where('restaurantId', '==', restaurantId));
    return collectionData(q, { idField: String(this.idKey) }) as Observable<MenuItem[]>;
  }
}
