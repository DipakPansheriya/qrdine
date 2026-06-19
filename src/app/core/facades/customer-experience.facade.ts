import { Injectable, signal, computed } from '@angular/core';
import { CustomerExperienceRepository } from '../repositories/customer-experience.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { CustomerExperienceService } from '../services/customer-experience.service';
import { Settings, CustomerExperience } from '../models';
import { firstValueFrom, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomerExperienceFacade {
  // Signals
  settings = signal<Settings | null>(null);
  experience = signal<CustomerExperience | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed signals
  styleVariables = computed(() => {
    return this.cxService.getStyleVariables(this.settings(), this.experience());
  });

  themeConfig = computed(() => {
    return this.cxService.resolveThemeConfig(this.settings(), this.experience());
  });

  private settingsSub: Subscription | null = null;
  private cxSub: Subscription | null = null;

  constructor(
    private settingsRepo: SettingsRepository,
    private cxRepo: CustomerExperienceRepository,
    private cxService: CustomerExperienceService
  ) {}

  /**
   * Listen to settings and experience document updates in Firestore in real-time.
   */
  loadExperience(restaurantId: string) {
    this.loading.set(true);
    this.error.set(null);

    if (this.settingsSub) this.settingsSub.unsubscribe();
    if (this.cxSub) this.cxSub.unsubscribe();

    this.settingsSub = this.settingsRepo.getByRestaurant(restaurantId).subscribe({
      next: (s) => {
        this.settings.set(s);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load branding settings');
        this.loading.set(false);
      }
    });

    this.cxSub = this.cxRepo.getByRestaurant(restaurantId).subscribe({
      next: (cx) => {
        this.experience.set(cx);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Failed to load customer experience settings');
      }
    });
  }

  /**
   * Clean up listeners when page changes.
   */
  destroy() {
    if (this.settingsSub) this.settingsSub.unsubscribe();
    if (this.cxSub) this.cxSub.unsubscribe();
  }
}
