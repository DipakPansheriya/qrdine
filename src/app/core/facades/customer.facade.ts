import { Injectable, signal, computed } from '@angular/core';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import { TableRepository } from '../repositories/table.repository';
import { CustomerSessionRepository } from '../repositories/customer-session.repository';
import { OrderRepository } from '../repositories/order.repository';
import { MenuCategoryRepository } from '../repositories/menu-category.repository';
import { MenuItemRepository } from '../repositories/menu-item.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { CustomerExperienceRepository } from '../repositories/customer-experience.repository';
import { Restaurant, Table, CustomerSession, MenuCategory, MenuItem, CartItem, Order, Settings, CustomerExperience } from '../models';
import { firstValueFrom, Subscription } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CustomerFacade {
  // State Signals
  restaurant = signal<Restaurant | null>(null);
  table = signal<Table | null>(null);
  session = signal<CustomerSession | null>(null);
  
  categories = signal<MenuCategory[]>([]);
  items = signal<MenuItem[]>([]);
  
  cartItems = signal<CartItem[]>([]);
  
  orders = signal<Order[]>([]);
  
  settings = signal<Settings | null>(null);
  experience = signal<CustomerExperience | null>(null);
  
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed Selectors
  cartItemCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));
  cartSubtotal = computed(() => this.cartItems().reduce((acc, item) => acc + item.totalPrice, 0));
  
  // Tax logic (assume flat 10% for mock or use settings, keeping simple for now)
  cartTax = computed(() => this.cartSubtotal() * 0.10); 
  cartGrandTotal = computed(() => this.cartSubtotal() + this.cartTax());

  activeOrders = computed(() => this.orders().filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.status)));
  pastOrders = computed(() => this.orders().filter(o => ['Delivered', 'Completed', 'Cancelled'].includes(o.status)));

  private ordersSub: Subscription | null = null;

  constructor(
    private restaurantRepo: RestaurantRepository,
    private tableRepo: TableRepository,
    private sessionRepo: CustomerSessionRepository,
    private categoryRepo: MenuCategoryRepository,
    private itemRepo: MenuItemRepository,
    private orderRepo: OrderRepository,
    private settingsRepo: SettingsRepository,
    private cxRepo: CustomerExperienceRepository
  ) {
    this.restoreCart();
  }

  // Initialization & Validation
  async initializeSession(restaurantId: string, tableId: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      // 1. Validate Restaurant
      const rest = await firstValueFrom(this.restaurantRepo.getById(restaurantId));
      if (!rest) throw new Error('RESTAURANT_NOT_FOUND');
      
      // 2. Validate Table
      const tbl = await firstValueFrom(this.tableRepo.getById(tableId));
      if (!tbl || tbl.restaurantId !== restaurantId) throw new Error('TABLE_NOT_FOUND');
      
      this.restaurant.set(rest);
      this.table.set(tbl);

      // 3. Setup Session
      const savedSessionId = sessionStorage.getItem(`qrdine_session_${tableId}`);
      let currentSessionId = '';
      if (savedSessionId) {
        const existingSession = await firstValueFrom(this.sessionRepo.getById(savedSessionId));
        if (existingSession && existingSession.status === 'Active') {
          this.session.set(existingSession);
          currentSessionId = savedSessionId;
        } else {
          currentSessionId = await this.createNewSession(restaurantId, tableId);
        }
      } else {
        currentSessionId = await this.createNewSession(restaurantId, tableId);
      }

      // 4. Load Menu and Settings
      await Promise.all([
        this.loadMenu(restaurantId),
        this.loadSettingsAndExperience(restaurantId)
      ]);

      // 5. Listen to Session Orders
      this.listenToOrders(currentSessionId);

      // Artificial delay for premium skeleton loading experience
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (err: any) {
      console.error(err);
      this.error.set(err.message || 'Failed to initialize session');
    } finally {
      this.loading.set(false);
    }
  }

  private async createNewSession(restaurantId: string, tableId: string): Promise<string> {
    // Generate simple unique ID
    const sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now();
    
    const newSession: CustomerSession = {
      sessionId,
      restaurantId,
      tableId,
      startTime: serverTimestamp(),
      customerCount: 1, // Default, could be asked in a dialog
      status: 'Active',
      currentBillAmount: 0
    };

    await firstValueFrom(this.sessionRepo.create(newSession, sessionId));
    this.session.set(newSession);
    sessionStorage.setItem(`qrdine_session_${tableId}`, sessionId);
    return sessionId;
  }

  private listenToOrders(sessionId: string) {
    if (this.ordersSub) this.ordersSub.unsubscribe();
    this.ordersSub = this.orderRepo.getBySession(sessionId).subscribe(orders => {
      // Sort orders by createdAt desc (newest first)
      const sorted = [...orders].sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      this.orders.set(sorted);
    });
  }

  private async loadMenu(restaurantId: string) {
    const cats$ = this.categoryRepo.getByRestaurant(restaurantId);
    const items$ = this.itemRepo.getByRestaurant(restaurantId);
    
    const [cats, items] = await Promise.all([
      firstValueFrom(cats$),
      firstValueFrom(items$)
    ]);

    // Sort categories
    cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    // Filter available items
    const availableItems = items.filter(i => i.availability === 'Available');

    this.categories.set(cats);
    this.items.set(availableItems);
  }

  private async loadSettingsAndExperience(restaurantId: string) {
    const [settings, cx] = await Promise.all([
      firstValueFrom(this.settingsRepo.getByRestaurant(restaurantId)),
      firstValueFrom(this.cxRepo.getByRestaurant(restaurantId))
    ]);
    
    this.settings.set(settings);
    this.experience.set(cx);
  }

  // Cart Management
  addToCart(item: CartItem) {
    this.cartItems.update(items => {
      // Very basic collision detection. Real app might check modifiers specifically.
      const existing = items.find(i => i.itemId === item.itemId && i.notes === item.notes);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalPrice += item.totalPrice;
        return [...items];
      }
      return [...items, item];
    });
    this.saveCart();
  }

  updateQuantity(index: number, delta: number) {
    this.cartItems.update(items => {
      const target = items[index];
      if (target) {
        target.quantity += delta;
        // recalculate price based on unit price (assuming total was quantity * unit)
        const unitPrice = target.totalPrice / (target.quantity - delta);
        target.totalPrice = target.quantity * unitPrice;
        
        if (target.quantity <= 0) {
          items.splice(index, 1);
        }
      }
      return [...items];
    });
    this.saveCart();
  }

  clearCart() {
    this.cartItems.set([]);
    this.saveCart();
  }

  private saveCart() {
    const tbl = this.table();
    if (tbl) {
      sessionStorage.setItem(`qrdine_cart_${tbl.id}`, JSON.stringify(this.cartItems()));
    }
  }

  private restoreCart() {
    // We can't restore perfectly in constructor because tableId isn't known yet.
    // It's called in initializeSession or implicitly if we know the table.
  }

  restoreCartForTable(tableId: string) {
    const saved = sessionStorage.getItem(`qrdine_cart_${tableId}`);
    if (saved) {
      this.cartItems.set(JSON.parse(saved));
    }
  }

  // Checkout
  async placeOrder(orderNotes: string): Promise<string> {
    const sess = this.session();
    const rest = this.restaurant();
    const tbl = this.table();
    
    if (!sess || !rest || !tbl || this.cartItems().length === 0) {
      throw new Error('Invalid order state');
    }

    this.loading.set(true);

    const orderId = 'ord_' + Math.random().toString(36).substring(2, 9) + Date.now();
    
    const newOrder: Order = {
      orderId,
      restaurantId: rest.restaurantId,
      tableId: tbl.id!,
      sessionId: sess.sessionId,
      orderNumber: Math.floor(1000 + Math.random() * 9000), // Random 4 digit
      items: [...this.cartItems()],
      subtotal: this.cartSubtotal(),
      tax: this.cartTax(),
      discount: 0,
      grandTotal: this.cartGrandTotal(),
      notes: orderNotes,
      status: 'Pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await firstValueFrom(this.orderRepo.create(newOrder, orderId));
      this.clearCart();
      return orderId;
    } catch (e) {
      console.error(e);
      throw new Error('Failed to place order');
    } finally {
      this.loading.set(false);
    }
  }
}
