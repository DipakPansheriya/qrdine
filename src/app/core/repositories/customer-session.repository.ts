import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { CustomerSession } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerSessionRepository extends BaseRepository<CustomerSession> {
  protected collectionKey = 'sessions';
  protected idKey: keyof CustomerSession = 'sessionId';
}
