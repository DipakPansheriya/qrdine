import { Injectable, signal, inject } from '@angular/core';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import { Restaurant } from '../models';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RestaurantFacade {
  private repository = inject(RestaurantRepository);

  // State
  private restaurantsSignal = signal<Restaurant[]>([]);
  private selectedRestaurantSignal = signal<Restaurant | null>(null);
  private loadingSignal = signal<boolean>(false);

  // Selectors
  readonly restaurants = this.restaurantsSignal.asReadonly();
  readonly selectedRestaurant = this.selectedRestaurantSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  // Actions
  loadAll(): void {
    this.loadingSignal.set(true);
    this.repository.getAll().subscribe({
      next: (data) => {
        this.restaurantsSignal.set(data);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false)
    });
  }

  loadById(id: string): void {
    this.loadingSignal.set(true);
    this.repository.getById(id).subscribe({
      next: (data) => {
        this.selectedRestaurantSignal.set(data || null);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false)
    });
  }

  create(restaurant: Restaurant): Observable<any> {
    return this.repository.create(restaurant).pipe(
      tap(() => this.loadAll())
    );
  }

  update(id: string, restaurant: Partial<Restaurant>): Observable<void> {
    return this.repository.update(id, restaurant).pipe(
      tap(() => {
        this.loadAll();
        if (this.selectedRestaurantSignal()?.restaurantId === id) {
          this.loadById(id);
        }
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.repository.delete(id).pipe(
      tap(() => this.loadAll())
    );
  }
}
