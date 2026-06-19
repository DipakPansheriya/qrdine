import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { MenuCategory } from '../models';
import { collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MenuCategoryRepository extends BaseRepository<MenuCategory> {
  protected collectionKey = 'menuCategories';
  protected idKey: keyof MenuCategory = 'categoryId';

  getByRestaurant(restaurantId: string): Observable<MenuCategory[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(collRef, where('restaurantId', '==', restaurantId));
    return collectionData(q, { idField: String(this.idKey) }) as Observable<MenuCategory[]>;
  }
}
