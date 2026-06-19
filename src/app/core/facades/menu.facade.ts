import { Injectable, signal, computed, inject } from '@angular/core';
import { MenuCategoryRepository } from '../repositories/menu-category.repository';
import { MenuItemRepository } from '../repositories/menu-item.repository';
import { MenuCategory, MenuItem } from '../models';
import { Observable, firstValueFrom } from 'rxjs';
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

  // Actions
  loadMenuData(): void {
    const user = this.authFacade.currentUser();
    if (!user || !user.restaurantId) return;

    this.loadingSignal.set(true);

    // In a real Firestore setup with complex queries, we would add query constraints to BaseRepository
    // For MVP with basic BaseRepository, we fetch all and filter client side, or assume
    // we'll implement queries later. Let's assume we fetch all for now and filter by restaurantId.
    
    // We use firstValueFrom since collectionData is a hot observable
    Promise.all([
      firstValueFrom(this.categoryRepo.getAll()),
      firstValueFrom(this.itemRepo.getAll())
    ]).then(([categories, items]) => {
      // Filter by the current user's restaurant
      const myCategories = (categories || []).filter(c => c.restaurantId === user.restaurantId)
                                             .sort((a, b) => a.sortOrder - b.sortOrder);
      const myItems = (items || []).filter(i => i.restaurantId === user.restaurantId);
      
      this.categoriesSignal.set(myCategories);
      this.itemsSignal.set(myItems);
      
      if (myCategories.length > 0 && !this.selectedCategoryIdSignal()) {
        this.selectedCategoryIdSignal.set(myCategories[0].categoryId);
      }
      
      this.loadingSignal.set(false);
    }).catch(error => {
      console.error(error);
      this.loadingSignal.set(false);
    });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryIdSignal.set(categoryId);
  }

  // Category Actions
  createCategory(category: MenuCategory): Observable<any> {
    return this.categoryRepo.create(category).pipe(tap(() => this.loadMenuData()));
  }

  updateCategory(id: string, data: Partial<MenuCategory>): Observable<void> {
    return this.categoryRepo.update(id, data).pipe(tap(() => this.loadMenuData()));
  }

  deleteCategory(id: string): Observable<void> {
    return this.categoryRepo.delete(id).pipe(
      tap(() => {
        if (this.selectedCategoryIdSignal() === id) {
          this.selectedCategoryIdSignal.set(null);
        }
        this.loadMenuData();
      })
    );
  }

  // Item Actions
  createItem(item: MenuItem): Observable<any> {
    return this.itemRepo.create(item).pipe(tap(() => this.loadMenuData()));
  }

  updateItem(id: string, data: Partial<MenuItem>): Observable<void> {
    return this.itemRepo.update(id, data).pipe(tap(() => this.loadMenuData()));
  }

  deleteItem(id: string): Observable<void> {
    return this.itemRepo.delete(id).pipe(tap(() => this.loadMenuData()));
  }
}
