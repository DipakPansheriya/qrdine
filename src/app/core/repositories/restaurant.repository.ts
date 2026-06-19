import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Restaurant } from '../models';

@Injectable({ providedIn: 'root' })
export class RestaurantRepository extends BaseRepository<Restaurant> {
  protected collectionKey = 'restaurants';
  protected idKey: keyof Restaurant = 'restaurantId';
}
