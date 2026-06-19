import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { OwnerSettingsFacade } from '../../../../core/facades/owner-settings.facade';

@Component({
  selector: 'app-settings-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule, MatIconModule
  ],
  templateUrl: './settings-dashboard.component.html',
  styleUrls: ['./settings-dashboard.component.scss']
})
export class SettingsDashboardComponent implements OnInit {
  public facade = inject(OwnerSettingsFacade);
  private fb = inject(FormBuilder);

  activeTab = 'general';

  generalForm: FormGroup;
  hoursForm: FormGroup;
  taxForm: FormGroup;
  brandingForm: FormGroup;
  cxForm: FormGroup;

  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Preview Signals
  previewSettings = signal<any>({});
  previewCx = signal<any>({});

  currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
  ];

  buttonStyles = [
    { value: 'rounded', label: 'Rounded', radius: '10px' },
    { value: 'pill', label: 'Pill', radius: '50px' },
    { value: 'square', label: 'Square', radius: '4px' },
  ];

  cardRadii = [
    { value: 'small', label: 'Small', radius: '6px' },
    { value: 'medium', label: 'Medium', radius: '12px' },
    { value: 'large', label: 'Large', radius: '20px' },
  ];

  uiToggles = [
    { key: 'showWelcomeBanner', label: 'Welcome Banner', desc: 'Show hero section at the top', icon: '🏠' },
    { key: 'showRestaurantRating', label: 'Restaurant Rating', desc: 'Display star rating', icon: '⭐' },
    { key: 'showSearchBar', label: 'Search Bar', desc: 'Let customers search dishes', icon: '🔍' },
    { key: 'showCategoryTabs', label: 'Category Tabs', desc: 'Horizontal category filter', icon: '🏷️' },
    { key: 'showPopularItems', label: 'Popular Items', desc: 'Show a popular dishes section', icon: '🔥' },
    { key: 'showFoodImages', label: 'Food Images', desc: 'Display dish photos on cards', icon: '🖼️' },
    { key: 'showDietaryTags', label: 'Dietary Tags', desc: 'Veg/Non-Veg badges on items', icon: '🌱' },
  ];

  orderToggles = [
    { key: 'allowMultipleOrders', label: 'Multiple Orders', desc: 'Customers can place several orders', icon: '📋' },
    { key: 'allowOrderNotes', label: 'Order Notes', desc: 'Customers can add special instructions', icon: '📝' },
    { key: 'requireBillRequest', label: 'Bill Request', desc: 'Require explicit bill request', icon: '🧾' },
    { key: 'autoCloseSession', label: 'Auto-Close Session', desc: 'Close session after payment', icon: '⏱️' },
  ];

  constructor() {
    this.generalForm = this.fb.group({
      restaurantName: ['', Validators.required],
      description: [''],
      phone: [''],
      email: ['', Validators.email],
      address: [''],
      gstNumber: ['']
    });

    this.hoursForm = this.fb.group({});
    this.days.forEach(day => {
      this.hoursForm.addControl(day, this.fb.group({
        open: ['09:00'],
        close: ['22:00'],
        enabled: [true]
      }));
    });

    this.taxForm = this.fb.group({
      gstPercentage: [0],
      serviceChargePercentage: [0],
      currency: ['INR']
    });

    this.brandingForm = this.fb.group({
      primaryColor: ['#E53935'],
      secondaryColor: ['#424242'],
      accentColor: ['#FFC107'],
      buttonStyle: ['rounded'],
      cardRadius: ['medium'],
      themeMode: ['Default']
    });

    this.cxForm = this.fb.group({
      showRestaurantRating: [true],
      showPopularItems: [true],
      showFeaturedItems: [true],
      showSearchBar: [true],
      showCategoryTabs: [true],
      showPreparationTime: [true],
      showDietaryTags: [true],
      showFoodImages: [true],
      showRecommendations: [true],
      showCartAnimation: [true],
      showWelcomeBanner: [true],
      welcomeMessage: ['Welcome!'],
      successMessage: ['Thank you for your order.'],
      emptyCartMessage: ['Your cart is waiting for delicious food.'],
      allowMultipleOrders: [true],
      allowOrderNotes: [true],
      allowModifierSelection: [true],
      allowQuantityEditing: [true],
      requireBillRequest: [true],
      autoCloseSession: [true]
    });

    // Sync preview signals with form values
    this.brandingForm.valueChanges.subscribe(val => this.previewSettings.set(val));
    this.cxForm.valueChanges.subscribe(val => this.previewCx.set(val));

    // Populate forms when data loads
    effect(() => {
      const s = this.facade.settings();
      if (s) {
        this.generalForm.patchValue(s);
        this.hoursForm.patchValue(s.businessHours || {});
        this.taxForm.patchValue(s);
        this.brandingForm.patchValue(s);
        this.previewSettings.set(this.brandingForm.value);
      }
    });

    effect(() => {
      const cx = this.facade.experience();
      if (cx) {
        this.cxForm.patchValue(cx);
        this.previewCx.set(this.cxForm.value);
      }
    });
  }

  ngOnInit() {}

  setTab(tab: string) {
    this.activeTab = tab;
  }

  async saveSettings() {
    if (this.generalForm.invalid || this.taxForm.invalid) return;

    const settingsData = {
      ...this.generalForm.value,
      businessHours: this.hoursForm.value,
      ...this.taxForm.value,
      ...this.brandingForm.value
    };

    await this.facade.saveSettings(settingsData);
  }

  async saveCx() {
    await this.facade.saveCustomerExperience(this.cxForm.value);
  }
}
