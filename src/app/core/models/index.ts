export interface Restaurant {
  restaurantId: string;
  name: string;
  slug: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  currency: string;
  timezone: string;
  address?: string;
  openingHours?: any;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

export type Role = 'Super Admin' | 'Owner' | 'Manager' | 'Waiter' | 'Kitchen' | 'Cashier' | 'Customer';

export interface User {
  uid: string;
  email: string;
  password?: string; // For mock local storage authentication
  displayName?: string;
  role: Role;
  restaurantId?: string; // Null for Super Admin
}

export interface Staff {
  staffId: string;
  restaurantId: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: any;
  updatedAt?: any;
}

export interface Table {
  id?: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'DISABLED';
  qrCodeUrl?: string;
  lastGeneratedAt?: any;
  generatedBy?: string;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface CustomerSession {
  sessionId: string;
  restaurantId: string;
  tableId: string;
  startTime: any;
  endTime?: any;
  customerCount: number;
  status: 'Active' | 'Completed' | 'Cancelled';
  currentBillAmount: number;
}

export interface MenuCategory {
  categoryId: string;
  restaurantId: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  status: 'active' | 'inactive';
}

export interface MenuItem {
  itemId: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  price: number;
  discountPrice?: number;
  vegType: 'Veg' | 'Non Veg' | 'Egg';
  availability: 'Available' | 'Out Of Stock' | 'Hidden';
  preparationTime?: number;
  taxPercentage: number;
  createdAt: any;
  updatedAt: any;
}

export interface ModifierGroup {
  modifierGroupId: string;
  itemId: string;
  name: string;
  selectionType: 'single' | 'multiple';
  required: boolean;
  maxSelections?: number;
  options: { name: string; price: number }[];
}

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: { groupName: string; optionName: string; price: number }[];
  notes?: string;
  totalPrice: number;
}

export interface Cart {
  cartId: string;
  sessionId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  notes?: string;
}

export interface Order {
  orderId: string;
  restaurantId: string;
  tableId: string;
  sessionId: string;
  orderNumber: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  notes?: string;
  status: 'Pending' | 'Accepted' | 'Preparing' | 'Ready' | 'Delivered' | 'Completed' | 'Cancelled' | 'Refunded';
  createdAt: any;
  updatedAt: any;
}

export interface CustomerRequest {
  requestId: string;
  restaurantId: string;
  tableId: string;
  sessionId: string;
  type: 'Call Waiter' | 'Request Water' | 'Request Cutlery' | 'Need Assistance' | 'Request Bill';
  status: 'Pending' | 'Resolved';
  createdAt: any;
}

export interface Payment {
  paymentId: string;
  transactionId?: string;
  restaurantId: string;
  sessionId: string;
  amount: number;
  method: 'Cash' | 'Mock UPI' | 'Mock Credit Card' | 'Mock Debit Card' | 'Mock Wallet';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: any;
}

export interface Feedback {
  feedbackId: string;
  restaurantId: string;
  sessionId: string;
  rating: number;
  comment?: string;
  createdAt: any;
}


export interface Subscription {
  subscriptionId: string;
  restaurantId: string;
  plan: 'BASIC' | 'PREMIUM' | 'PRO';
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  startDate: any;
  endDate?: any;
}

export interface Settings {
  settingsId: string;
  restaurantId: string;
  // General Info
  restaurantName: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  // Business Hours
  businessHours: {
    monday: { open: string; close: string; enabled: boolean };
    tuesday: { open: string; close: string; enabled: boolean };
    wednesday: { open: string; close: string; enabled: boolean };
    thursday: { open: string; close: string; enabled: boolean };
    friday: { open: string; close: string; enabled: boolean };
    saturday: { open: string; close: string; enabled: boolean };
    sunday: { open: string; close: string; enabled: boolean };
  };
  // Tax Settings
  gstPercentage: number;
  serviceChargePercentage: number;
  currency: string;
  // Branding
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill' | 'floating';
  cardRadius: 'small' | 'medium' | 'large';
  themeMode: 'Default' | 'Orange' | 'Green' | 'Red' | 'Custom';
  typographyStyle?: 'Modern Sans' | 'Classic Serif' | 'Playful Rounded' | 'Elegant Editorial';
  themePreset?: 'Classic Restaurant' | 'Modern Cafe' | 'Luxury Dining' | 'Fast Food' | 'Minimal' | 'Custom';
  createdAt: any;
  updatedAt: any;
}

export interface CustomerExperience {
  experienceId: string;
  restaurantId: string;
  // Controls
  showRestaurantRating: boolean;
  showPopularItems: boolean;
  showFeaturedItems: boolean;
  showSearchBar: boolean;
  showCategoryTabs: boolean;
  showPreparationTime: boolean;
  showDietaryTags: boolean;
  showFoodImages: boolean;
  showRecommendations: boolean;
  showCartAnimation: boolean;
  showWelcomeBanner: boolean;
  // Messages
  welcomeMessage: string;
  successMessage: string;
  emptyCartMessage: string;
  // Rules
  allowMultipleOrders: boolean;
  allowOrderNotes: boolean;
  allowModifierSelection: boolean;
  allowQuantityEditing: boolean;
  requireBillRequest: boolean;
  autoCloseSession: boolean;
  // Extended configuration fields
  welcomeSubtitle?: string;
  restaurantTagline?: string;
  cardShadow?: 'none' | 'subtle' | 'shadow';
  imageStyle?: 'square' | 'rounded' | 'circle';
  compactMode?: boolean;
  largeMode?: boolean;
  cartStyle?: 'floating' | 'sticky' | 'mini';
  orderTrackingStyle?: 'timeline' | 'stepper' | 'cards';
  primaryButtonLabel?: string;
  checkoutButtonLabel?: string;
  updatedAt: any;
}

export interface AuditLog {
  logId: string;
  restaurantId: string;
  userId: string;
  userName: string;
  action: 'Settings Updated' | 'Branding Changed' | 'Customer Experience Updated' | 'Staff Created' | 'Staff Updated' | 'Staff Disabled';
  details: any;
  createdAt: any;
}
