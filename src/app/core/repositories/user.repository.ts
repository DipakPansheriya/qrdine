import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserRepository extends BaseRepository<User> {
  protected collectionKey = 'users';
  protected idKey: keyof User = 'uid';
}
