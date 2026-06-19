import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { MenuItem } from '../models';

@Injectable({ providedIn: 'root' })
export class MenuItemRepository extends BaseRepository<MenuItem> {
  protected collectionKey = 'menuItems';
  protected idKey: keyof MenuItem = 'itemId';
}
