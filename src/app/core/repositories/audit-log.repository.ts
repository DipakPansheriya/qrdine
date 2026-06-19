import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { AuditLog } from '../models';
import { collection, query, where, collectionData, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuditLogRepository extends BaseRepository<AuditLog> {
  protected collectionKey = 'auditLogs';
  protected idKey: keyof AuditLog = 'logId';

  getByRestaurant(restaurantId: string): Observable<AuditLog[]> {
    const q = query(
      collection(this.firestore, this.collectionKey),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'logId' }) as Observable<AuditLog[]>;
  }
}
