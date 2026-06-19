import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Settings } from '../models';
import { collection, query, where, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SettingsRepository extends BaseRepository<Settings> {
  protected collectionKey = 'settings';
  protected idKey: keyof Settings = 'settingsId';

  getByRestaurant(restaurantId: string): Observable<Settings | null> {
    const q = query(
      collection(this.firestore, this.collectionKey),
      where('restaurantId', '==', restaurantId)
    );
    return collectionData(q, { idField: 'settingsId' }).pipe(
      map(settings => settings.length > 0 ? (settings[0] as Settings) : null)
    );
  }
}
