import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Table } from '../models';
import { collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TableRepository extends BaseRepository<Table> {
  protected collectionKey = 'tables';
  protected idKey: keyof Table = 'id';

  getByRestaurant(restaurantId: string): Observable<Table[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(collRef, where('restaurantId', '==', restaurantId));
    return collectionData(q, { idField: String(this.idKey) }) as Observable<Table[]>;
  }
}
