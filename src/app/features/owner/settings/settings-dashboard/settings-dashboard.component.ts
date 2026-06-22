import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { OwnerSettingsFacade } from '../../../../core/facades/owner-settings.facade';
import { CustomerExperienceService } from '../../../../core/services/customer-experience.service';
import { PreviewDialogComponent } from '../preview-dialog/preview-dialog.component';

@Component({
  selector: 'app-settings-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule, MatIconModule,
    MatDialogModule
  ],
  templateUrl: './settings-dashboard.component.html',
  styleUrls: ['./settings-dashboard.component.scss']
})
export class SettingsDashboardComponent implements OnInit {
  public facade = inject(OwnerSettingsFacade);
  private fb = inject(FormBuilder);
  private cxService = inject(CustomerExperienceService);
  private dialog = inject(MatDialog);

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

  // Resolved dynamic styles for settings page phone preview
  styleVariables = computed(() => this.cxService.getStyleVariables(this.previewSettings(), this.previewCx()));

  currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
  ];

  themePresets = ['Classic Restaurant', 'Modern Cafe', 'Luxury Dining', 'Fast Food', 'Minimal', 'Custom'];
  typographyStyles = ['Modern Sans', 'Classic Serif', 'Playful Rounded', 'Elegant Editorial'];

  buttonStyles = [
    { value: 'rounded', label: 'Rounded', radius: '10px' },
    { value: 'pill', label: 'Pill', radius: '50px' },
    { value: 'square', label: 'Square', radius: '4px' },
    { value: 'floating', label: 'Floating', radius: '30px' },
  ];

  cardRadii = [
    { value: 'small', label: 'Small', radius: '6px' },
    { value: 'medium', label: 'Medium', radius: '12px' },
    { value: 'large', label: 'Large', radius: '20px' },
  ];

  cardShadows = [
    { value: 'none', label: 'None' },
    { value: 'subtle', label: 'Subtle' },
    { value: 'shadow', label: 'Shadow' }
  ];

  imageStyles = [
    { value: 'square', label: 'Square' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'circle', label: 'Circle' }
  ];

  cartStyles = [
    { value: 'floating', label: 'Floating Bottom Cart' },
    { value: 'sticky', label: 'Sticky Cart' },
    { value: 'mini', label: 'Mini Cart' }
  ];

  trackingStyles = [
    { value: 'timeline', label: 'Timeline Tracker' },
    { value: 'stepper', label: 'Stepper Tracker' },
    { value: 'cards', label: 'Cards Tracker' }
  ];

  uiToggles = [
    { key: 'showWelcomeBanner', label: 'Welcome Banner', desc: 'Show hero section at the top', icon: '🏠' },
    { key: 'showRestaurantRating', label: 'Restaurant Rating', desc: 'Display star rating', icon: '⭐' },
    { key: 'showSearchBar', label: 'Search Bar', desc: 'Let customers search dishes', icon: '🔍' },
    { key: 'showCategoryTabs', label: 'Category Tabs', desc: 'Horizontal category filter', icon: '🏷️' },
    { key: 'showPopularItems', label: 'Popular Items', desc: 'Show a popular dishes section', icon: '🔥' },
    { key: 'showFeaturedItems', label: 'Featured Dishes', desc: 'Show special featured items section', icon: '🌟' },
    { key: 'showFoodImages', label: 'Food Images', desc: 'Display dish photos on cards', icon: '🖼️' },
    { key: 'showDietaryTags', label: 'Dietary Tags', desc: 'Veg/Non-Veg badges on items', icon: '🌱' },
    { key: 'showPreparationTime', label: 'Preparation Time', desc: 'Display estimated wait time on dishes', icon: '🕒' },
    { key: 'showRecommendations', label: 'Recommendations', desc: 'Suggest dishes to pair with selections', icon: '👍' },
    { key: 'showCartAnimation', label: 'Cart Animation', desc: 'Show animation when item added to cart', icon: '✨' },
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
      logo: [''],
      coverImage: [''],
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
      serviceChargePercentage: [0, [Validators.min(0), Validators.max(100)]],
      currencyCode: ['INR'],
      currencySymbol: ['₹']
    });

    this.brandingForm = this.fb.group({
      primaryColor: ['#E53935'],
      secondaryColor: ['#424242'],
      accentColor: ['#FFC107'],
      buttonStyle: ['rounded'],
      cardRadius: ['medium'],
      themeMode: ['Default'],
      themePreset: ['Classic Restaurant'],
      typographyStyle: ['Modern Sans']
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
      autoCloseSession: [true],
      welcomeSubtitle: [''],
      restaurantTagline: [''],
      cardShadow: ['subtle'],
      imageStyle: ['rounded'],
      compactMode: [false],
      largeMode: [false],
      cartStyle: ['floating'],
      orderTrackingStyle: ['timeline'],
      primaryButtonLabel: ['Add'],
      checkoutButtonLabel: ['Place Order'],
      allowReorder: [true],
      requireCustomerName: [true],
      autoOccupyTable: [true],
      autoFreeTable: [true],
      sessionTimeout: ['Never']
    });

    // When themePreset changes, if it's not 'Custom', patch the brandingForm colors/styles!
    this.brandingForm.get('themePreset')?.valueChanges.subscribe(presetName => {
      if (presetName && presetName !== 'Custom') {
        const themeConfig = this.cxService.resolveThemeConfig({ themePreset: presetName } as any, null);
        this.brandingForm.patchValue({
          primaryColor: themeConfig.primaryColor,
          secondaryColor: themeConfig.secondaryColor,
          accentColor: themeConfig.accentColor,
          buttonStyle: themeConfig.buttonStyle,
          cardRadius: themeConfig.cardRadius,
          typographyStyle: themeConfig.typographyStyle
        }, { emitEvent: false });
      }
    });

    // If any custom color/style changes, set preset to Custom
    ['primaryColor', 'secondaryColor', 'accentColor', 'buttonStyle', 'cardRadius', 'typographyStyle'].forEach(field => {
      this.brandingForm.get(field)?.valueChanges.subscribe(() => {
        const currentPreset = this.brandingForm.get('themePreset')?.value;
        if (currentPreset !== 'Custom') {
          this.brandingForm.get('themePreset')?.setValue('Custom', { emitEvent: false });
        }
      });
    });

    // Mutual exclusivity for compactMode and largeMode
    this.cxForm.get('compactMode')?.valueChanges.subscribe(val => {
      if (val && this.cxForm.get('largeMode')?.value) {
        this.cxForm.get('largeMode')?.setValue(false, { emitEvent: false });
      }
    });
    this.cxForm.get('largeMode')?.valueChanges.subscribe(val => {
      if (val && this.cxForm.get('compactMode')?.value) {
        this.cxForm.get('compactMode')?.setValue(false, { emitEvent: false });
      }
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

  openPreviewDialog() {
    this.dialog.open(PreviewDialogComponent, {
      width: '95vw',
      maxWidth: '1100px',
      height: '90vh',
      panelClass: 'custom-preview-dialog',
      data: {
        settings: {
          ...this.brandingForm.value,
          logo: this.generalForm.get('logo')?.value,
          coverImage: this.generalForm.get('coverImage')?.value
        },
        cx: this.cxForm.value,
        restaurantName: this.generalForm.get('restaurantName')?.value || 'My Restaurant',
        restaurantDesc: this.generalForm.get('description')?.value || 'Delicious food made with love'
      }
    });
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
