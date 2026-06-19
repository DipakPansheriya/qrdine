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
  status: 'active' | 'inactive';
  createdAt: any;
}

export interface Table {
  tableId: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'Disabled';
  qrCodeUrl?: string;
  createdAt: any;
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
  theme: 'light' | 'dark' | 'system';
  primaryColor?: string;
  taxIncludedInPrice: boolean;
  allowGuestCheckout: boolean;
  requireTableNumber: boolean;
}
