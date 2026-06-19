import { Injectable, signal, effect } from '@angular/core';
import { SettingsRepository } from '../repositories/settings.repository';
import { CustomerExperienceRepository } from '../repositories/customer-experience.repository';
import { AuthFacade } from './auth.facade';
import { Settings, CustomerExperience } from '../models';
import { firstValueFrom, Subscription, combineLatest } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class OwnerSettingsFacade {
  settings = signal<Settings | null>(null);
  experience = signal<CustomerExperience | null>(null);
  loading = signal<boolean>(false);

  private sub: Subscription | null = null;

  constructor(
    private settingsRepo: SettingsRepository,
    private cxRepo: CustomerExperienceRepository,
    private authFacade: AuthFacade,
    private snackBar: MatSnackBar
  ) {
    effect(() => {
      const user = this.authFacade.currentUser();
      if (user?.restaurantId) {
        this.loadData(user.restaurantId);
      }
    }, { allowSignalWrites: true });
  }

  private loadData(restaurantId: string) {
    this.loading.set(true);
    if (this.sub) this.sub.unsubscribe();
    this.sub = combineLatest([
      this.settingsRepo.getByRestaurant(restaurantId),
      this.cxRepo.getByRestaurant(restaurantId)
    ]).subscribe(([settings, cx]) => {
      this.settings.set(settings);
      this.experience.set(cx);
      this.loading.set(false);
    });
  }

  async saveSettings(data: Partial<Settings>) {
    try {
      this.loading.set(true);
      const user = this.authFacade.currentUser();
      if (!user?.restaurantId) throw new Error('Not authenticated');

      const current = this.settings();
      if (current && current.settingsId) {
        await firstValueFrom(this.settingsRepo.update(current.settingsId, { ...data, updatedAt: serverTimestamp() }));
      } else {
        const newSettings: Settings = {
          settingsId: '', restaurantId: user.restaurantId,
          restaurantName: data.restaurantName || '', 
          ...(data.logo ? { logo: data.logo } : {}),
          ...(data.coverImage ? { coverImage: data.coverImage } : {}),
          ...(data.description ? { description: data.description } : {}),
          ...(data.phone ? { phone: data.phone } : {}),
          ...(data.email ? { email: data.email } : {}),
          ...(data.address ? { address: data.address } : {}),
          ...(data.gstNumber ? { gstNumber: data.gstNumber } : {}),
          businessHours: data.businessHours || {
            monday: { open: '09:00', close: '22:00', enabled: true },
            tuesday: { open: '09:00', close: '22:00', enabled: true },
            wednesday: { open: '09:00', close: '22:00', enabled: true },
            thursday: { open: '09:00', close: '22:00', enabled: true },
            friday: { open: '09:00', close: '22:00', enabled: true },
            saturday: { open: '09:00', close: '22:00', enabled: true },
            sunday: { open: '09:00', close: '22:00', enabled: true }
          },
          gstPercentage: data.gstPercentage || 0, serviceChargePercentage: data.serviceChargePercentage || 0, currency: data.currency || 'INR',
          primaryColor: data.primaryColor || '#E53935', secondaryColor: data.secondaryColor || '#424242', accentColor: data.accentColor || '#FFC107',
          buttonStyle: data.buttonStyle || 'rounded', cardRadius: data.cardRadius || 'medium', themeMode: data.themeMode || 'Default',
          createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        };
        await firstValueFrom(this.settingsRepo.create(newSettings));
      }
      this.snackBar.open('Settings saved', 'Close', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open(e.message || 'Error saving settings', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async saveCustomerExperience(data: Partial<CustomerExperience>) {
    try {
      this.loading.set(true);
      const user = this.authFacade.currentUser();
      if (!user?.restaurantId) throw new Error('Not authenticated');

      const current = this.experience();
      if (current && current.experienceId) {
        await firstValueFrom(this.cxRepo.update(current.experienceId, { ...data, updatedAt: serverTimestamp() }));
      } else {
        const newCx: CustomerExperience = {
          experienceId: '', restaurantId: user.restaurantId,
          showRestaurantRating: data.showRestaurantRating ?? true,
          showPopularItems: data.showPopularItems ?? true,
          showFeaturedItems: data.showFeaturedItems ?? true,
          showSearchBar: data.showSearchBar ?? true,
          showCategoryTabs: data.showCategoryTabs ?? true,
          showPreparationTime: data.showPreparationTime ?? true,
          showDietaryTags: data.showDietaryTags ?? true,
          showFoodImages: data.showFoodImages ?? true,
          showRecommendations: data.showRecommendations ?? true,
          showCartAnimation: data.showCartAnimation ?? true,
          showWelcomeBanner: data.showWelcomeBanner ?? true,
          welcomeMessage: data.welcomeMessage || 'Welcome!',
          successMessage: data.successMessage || 'Thank you for your order.',
          emptyCartMessage: data.emptyCartMessage || 'Your cart is empty.',
          allowMultipleOrders: data.allowMultipleOrders ?? true,
          allowOrderNotes: data.allowOrderNotes ?? true,
          allowModifierSelection: data.allowModifierSelection ?? true,
          allowQuantityEditing: data.allowQuantityEditing ?? true,
          requireBillRequest: data.requireBillRequest ?? true,
          autoCloseSession: data.autoCloseSession ?? true,
          updatedAt: serverTimestamp()
        };
        await firstValueFrom(this.cxRepo.create(newCx));
      }
      this.snackBar.open('Customer Experience saved', 'Close', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open(e.message || 'Error saving settings', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }
}
