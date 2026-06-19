import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Staff } from '../models';
import { collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StaffRepository extends BaseRepository<Staff> {
  protected collectionKey = 'staff';
  protected idKey: keyof Staff = 'staffId';

  getByRestaurant(restaurantId: string): Observable<Staff[]> {
    const q = query(
      collection(this.firestore, this.collectionKey),
      where('restaurantId', '==', restaurantId)
    );
    return collectionData(q, { idField: 'staffId' }) as Observable<Staff[]>;
  }
}
