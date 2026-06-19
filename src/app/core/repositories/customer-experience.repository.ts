import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { CustomerExperience } from '../models';
import { collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerExperienceRepository extends BaseRepository<CustomerExperience> {
  protected collectionKey = 'customerExperience';
  protected idKey: keyof CustomerExperience = 'experienceId';

  getByRestaurant(restaurantId: string): Observable<CustomerExperience | null> {
    const q = query(
      collection(this.firestore, this.collectionKey),
      where('restaurantId', '==', restaurantId)
    );
    return collectionData(q, { idField: 'experienceId' }).pipe(
      map(items => items.length > 0 ? (items[0] as CustomerExperience) : null)
    );
  }
}
