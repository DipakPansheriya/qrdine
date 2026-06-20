import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { MenuCategoryRepository } from '../repositories/menu-category.repository';
import { MenuItemRepository } from '../repositories/menu-item.repository';
import { MenuCategory, MenuItem } from '../models';
import { Observable, firstValueFrom, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthFacade } from './auth.facade';

@Injectable({ providedIn: 'root' })
export class MenuFacade {
  private categoryRepo = inject(MenuCategoryRepository);
  private itemRepo = inject(MenuItemRepository);
  private authFacade = inject(AuthFacade);

  // State
  private categoriesSignal = signal<MenuCategory[]>([]);
  private itemsSignal = signal<MenuItem[]>([]);
  private selectedCategoryIdSignal = signal<string | null>(null);
  private loadingSignal = signal<boolean>(false);

  // Subscriptions
  private categoriesSub: Subscription | null = null;
  private itemsSub: Subscription | null = null;

  // Selectors
  readonly categories = this.categoriesSignal.asReadonly();
  readonly items = this.itemsSignal.asReadonly();
  readonly selectedCategoryId = this.selectedCategoryIdSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  // Computed: Items for the currently selected category
  readonly selectedCategoryItems = computed(() => {
    const catId = this.selectedCategoryIdSignal();
    const allItems = this.itemsSignal();
    if (!catId) return [];
    return allItems.filter(item => item.categoryId === catId);
  });

  constructor() {
    effect(() => {
      const user = this.authFacade.currentUser();
      if (user?.restaurantId) {
        this.subscribeToMenuData(user.restaurantId);
      } else {
        this.unsubscribe();
        this.categoriesSignal.set([]);
        this.itemsSignal.set([]);
      }
    }, { allowSignalWrites: true });
  }

  private subscribeToMenuData(restaurantId: string) {
    this.loadingSignal.set(true);
    this.unsubscribe();

    this.categoriesSub = this.categoryRepo.getByRestaurant(restaurantId).subscribe({
      next: (categories) => {
        const sorted = (categories || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        this.categoriesSignal.set(sorted);
        
        if (sorted.length > 0 && !this.selectedCategoryIdSignal()) {
          this.selectedCategoryIdSignal.set(sorted[0].categoryId);
        }
        this.loadingSignal.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loadingSignal.set(false);
      }
    });

    this.itemsSub = this.itemRepo.getByRestaurant(restaurantId).subscribe({
      next: (items) => {
        this.itemsSignal.set(items || []);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  private unsubscribe() {
    if (this.categoriesSub) {
      this.categoriesSub.unsubscribe();
      this.categoriesSub = null;
    }
    if (this.itemsSub) {
      this.itemsSub.unsubscribe();
      this.itemsSub = null;
    }
  }

  // Actions
  loadMenuData(): void {
    // Realtime subscriptions are managed automatically via the constructor effect
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryIdSignal.set(categoryId);
  }

  // Category Actions
  createCategory(category: MenuCategory): Observable<any> {
    return this.categoryRepo.create(category);
  }

  updateCategory(id: string, data: Partial<MenuCategory>): Observable<void> {
    return this.categoryRepo.update(id, data);
  }

  deleteCategory(id: string): Observable<void> {
    return this.categoryRepo.delete(id).pipe(
      tap(() => {
        if (this.selectedCategoryIdSignal() === id) {
          this.selectedCategoryIdSignal.set(null);
        }
      })
    );
  }

  // Item Actions
  createItem(item: MenuItem): Observable<any> {
    return this.itemRepo.create(item);
  }

  updateItem(id: string, data: Partial<MenuItem>): Observable<void> {
    return this.itemRepo.update(id, data);
  }

  deleteItem(id: string): Observable<void> {
    return this.itemRepo.delete(id);
  }
}
