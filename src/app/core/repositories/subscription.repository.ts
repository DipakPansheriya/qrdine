import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Subscription } from '../models';

@Injectable({ providedIn: 'root' })
export class SubscriptionRepository extends BaseRepository<Subscription> {
  protected collectionKey = 'subscriptions';
  protected idKey: keyof Subscription = 'subscriptionId';
}
