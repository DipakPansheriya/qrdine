import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { MenuCategory } from '../models';

@Injectable({ providedIn: 'root' })
export class MenuCategoryRepository extends BaseRepository<MenuCategory> {
  protected collectionKey = 'menuCategories';
  protected idKey: keyof MenuCategory = 'categoryId';
}
