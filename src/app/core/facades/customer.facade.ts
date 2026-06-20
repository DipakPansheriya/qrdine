import { Injectable, signal, computed, inject } from '@angular/core';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import { TableRepository } from '../repositories/table.repository';
import { CustomerSessionRepository } from '../repositories/customer-session.repository';
import { OrderRepository } from '../repositories/order.repository';
import { MenuCategoryRepository } from '../repositories/menu-category.repository';
import { MenuItemRepository } from '../repositories/menu-item.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { CustomerExperienceRepository } from '../repositories/customer-experience.repository';
import { CustomerExperienceService } from '../services/customer-experience.service';
import { Restaurant, Table, CustomerSession, MenuCategory, MenuItem, CartItem, Order, Settings, CustomerExperience } from '../models';
import { firstValueFrom, Subscription } from 'rxjs';
import { serverTimestamp, Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class CustomerFacade {
  private firestore = inject(Firestore);

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

  // New signals for restore session & duplicate session management
  showSessionRestorePrompt = signal<boolean>(false);
  showDuplicateSessionWarning = signal<boolean>(false);
  activeTableSessionId = signal<string | null>(null);

  // Computed Selectors
  cartItemCount = computed(() => this.cartItems().reduce((acc, item) => acc + item.quantity, 0));
  cartSubtotal = computed(() => this.cartItems().reduce((acc, item) => acc + item.totalPrice, 0));
  
  // Tax logic (assume flat 10% for mock or use settings, keeping simple for now)
  cartTax = computed(() => this.cartSubtotal() * (this.settings()?.gstPercentage ? (this.settings()!.gstPercentage / 100) : 0.10)); 
  cartGrandTotal = computed(() => this.cartSubtotal() + this.cartTax() + (this.settings()?.serviceChargePercentage ? (this.cartSubtotal() * this.settings()!.serviceChargePercentage / 100) : 0));

  activeOrders = computed(() => this.orders().filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.status)));
  pastOrders = computed(() => this.orders().filter(o => ['Delivered', 'Completed', 'Cancelled'].includes(o.status)));

  // Style variables driving the customer view dynamic layout
  styleVariables = computed(() => this.cxService.getStyleVariables(this.settings(), this.experience()));

  private ordersSub: Subscription | null = null;
  private settingsSub: Subscription | null = null;
  private cxSub: Subscription | null = null;

  constructor(
    private restaurantRepo: RestaurantRepository,
    private tableRepo: TableRepository,
    private sessionRepo: CustomerSessionRepository,
    private categoryRepo: MenuCategoryRepository,
    private itemRepo: MenuItemRepository,
    private orderRepo: OrderRepository,
    private settingsRepo: SettingsRepository,
    private cxRepo: CustomerExperienceRepository,
    private cxService: CustomerExperienceService
  ) {
    this.restoreCart();
  }

  // Initialization & Validation
  async initializeSession(restaurantId: string, tableId: string) {
    this.loading.set(true);
    this.error.set(null);
    this.showSessionRestorePrompt.set(false);
    this.showDuplicateSessionWarning.set(false);
    this.activeTableSessionId.set(null);

    try {
      // 1. Validate Restaurant
      const rest = await firstValueFrom(this.restaurantRepo.getById(restaurantId));
      if (!rest) throw new Error('RESTAURANT_NOT_FOUND');
      
      // 2. Validate Table
      const tbl = await firstValueFrom(this.tableRepo.getById(tableId));
      if (!tbl || tbl.restaurantId !== restaurantId) throw new Error('TABLE_NOT_FOUND');
      tbl.id = tableId; // Ensure ID is set for routing and queries
      
      this.restaurant.set(rest);
      this.table.set(tbl);

      // Load Settings and Experience first to check configurations
      await this.loadSettingsAndExperience(restaurantId);

      // 3. Setup Session (BUG 3: localStorage)
      const savedSessionKey = `qrdine_session_${tableId}`;
      const savedSessionId = localStorage.getItem(savedSessionKey);
      let currentSessionId = '';

      const isOccupied = tbl.status === 'OCCUPIED';
      const activeSessionIdOnTable = tbl.activeSessionId;

      if (isOccupied && activeSessionIdOnTable) {
        // Table already occupied
        if (savedSessionId === activeSessionIdOnTable) {
          // Returning customer device scanning the same table QR
          const existingSession = await firstValueFrom(this.sessionRepo.getById(savedSessionId));
          if (existingSession && existingSession.status === 'Active') {
            // Check timeout if configured (FEATURE 2)
            const timeoutRule = this.experience()?.sessionTimeout || 'Never';
            let hasTimedOut = false;
            if (timeoutRule !== 'Never') {
              const timeoutMs = parseInt(timeoutRule, 10) * 60 * 1000;
              const startTimeMs = existingSession.startTime?.toMillis ? existingSession.startTime.toMillis() : new Date(existingSession.startTime).getTime();
              if (Date.now() - startTimeMs > timeoutMs) {
                hasTimedOut = true;
              }
            }

            if (!hasTimedOut) {
              this.session.set(existingSession);
              currentSessionId = savedSessionId;
              this.showSessionRestorePrompt.set(true);
            } else {
              // Create new session due to timeout
              currentSessionId = await this.createNewSession(restaurantId, tableId);
            }
          } else {
            currentSessionId = await this.createNewSession(restaurantId, tableId);
          }
        } else {
          // Different customer/device scanning the QR (FEATURE 1)
          const allowMultiple = this.experience()?.allowMultipleOrders ?? true;
          if (!allowMultiple) {
            this.showDuplicateSessionWarning.set(true);
            this.activeTableSessionId.set(activeSessionIdOnTable);
            this.loading.set(false);
            return; // Halt and show warning
          } else {
            currentSessionId = await this.createNewSession(restaurantId, tableId);
          }
        }
      } else {
        // Table is available or not occupied
        if (savedSessionId) {
          const existingSession = await firstValueFrom(this.sessionRepo.getById(savedSessionId));
          if (existingSession && existingSession.status === 'Active') {
            // Check timeout if configured (FEATURE 2)
            const timeoutRule = this.experience()?.sessionTimeout || 'Never';
            let hasTimedOut = false;
            if (timeoutRule !== 'Never') {
              const timeoutMs = parseInt(timeoutRule, 10) * 60 * 1000;
              const startTimeMs = existingSession.startTime?.toMillis ? existingSession.startTime.toMillis() : new Date(existingSession.startTime).getTime();
              if (Date.now() - startTimeMs > timeoutMs) {
                hasTimedOut = true;
              }
            }

            if (!hasTimedOut) {
              this.session.set(existingSession);
              currentSessionId = savedSessionId;
            } else {
              currentSessionId = await this.createNewSession(restaurantId, tableId);
            }
          } else {
            currentSessionId = await this.createNewSession(restaurantId, tableId);
          }
        } else {
          currentSessionId = await this.createNewSession(restaurantId, tableId);
        }
      }

      // Load Menu
      await this.loadMenu(restaurantId);

      // Restore cart items
      this.restoreCartForTable(tableId);

      // Listen to Session Orders
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

  async joinExistingTableSession() {
    const existingSessionId = this.activeTableSessionId();
    const tbl = this.table();
    if (existingSessionId && tbl) {
      localStorage.setItem(`qrdine_session_${tbl.id!}`, existingSessionId);
      const existingSession = await firstValueFrom(this.sessionRepo.getById(existingSessionId));
      if (existingSession) {
        this.session.set(existingSession);
        this.showDuplicateSessionWarning.set(false);
        this.restoreCartForTable(tbl.id!);
        this.listenToOrders(existingSessionId);
      }
    }
  }

  async requestAssistance() {
    const tbl = this.table();
    const rest = this.restaurant();
    const sess = this.session();
    if (tbl && rest) {
      const requestId = 'req_' + Math.random().toString(36).substring(2, 9) + Date.now();
      const request = {
        requestId,
        restaurantId: rest.restaurantId,
        tableId: tbl.id!,
        sessionId: sess?.sessionId || tbl.activeSessionId || '',
        type: 'Need Assistance',
        status: 'Pending',
        createdAt: serverTimestamp()
      };
      
      const collRef = collection(this.firestore, 'requests');
      await addDoc(collRef, request);
    }
  }

  private async createNewSession(restaurantId: string, tableId: string): Promise<string> {
    const sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now();
    
    const newSession: CustomerSession = {
      sessionId,
      restaurantId,
      tableId,
      startTime: serverTimestamp(),
      customerCount: 1,
      status: 'Active',
      currentBillAmount: 0
    };

    await firstValueFrom(this.sessionRepo.create(newSession, sessionId));
    this.session.set(newSession);
    localStorage.setItem(`qrdine_session_${tableId}`, sessionId);
    return sessionId;
  }

  private listenToOrders(sessionId: string) {
    if (this.ordersSub) this.ordersSub.unsubscribe();
    this.ordersSub = this.orderRepo.getBySession(sessionId).subscribe(orders => {
      const sorted = [...orders].sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
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

    cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const availableItems = items.filter(i => i.availability === 'Available');

    this.categories.set(cats);
    this.items.set(availableItems);
  }

  private loadSettingsAndExperience(restaurantId: string): Promise<void> {
    if (this.settingsSub) this.settingsSub.unsubscribe();
    if (this.cxSub) this.cxSub.unsubscribe();

    return new Promise<void>((resolve, reject) => {
      let loadedSettings = false;
      let loadedCx = false;
      let hasResolved = false;

      const resolveIfAllDone = () => {
        if (loadedSettings && loadedCx && !hasResolved) {
          hasResolved = true;
          resolve();
        }
      };

      this.settingsSub = this.settingsRepo.getByRestaurant(restaurantId).subscribe({
        next: (s) => {
          this.settings.set(s);
          loadedSettings = true;
          resolveIfAllDone();
        },
        error: (err) => {
          console.error(err);
          if (!hasResolved) {
            hasResolved = true;
            reject(err);
          }
        }
      });

      this.cxSub = this.cxRepo.getByRestaurant(restaurantId).subscribe({
        next: (cx) => {
          this.experience.set(cx);
          loadedCx = true;
          resolveIfAllDone();
        },
        error: (err) => {
          console.error(err);
          if (!hasResolved) {
            hasResolved = true;
            reject(err);
          }
        }
      });
    });
  }

  // Cart Management
  addToCart(item: CartItem) {
    this.cartItems.update(items => {
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
      localStorage.setItem(`qrdine_cart_${tbl.id}`, JSON.stringify(this.cartItems()));
    }
  }

  private restoreCart() {
    // Restored dynamically per table
  }

  restoreCartForTable(tableId: string) {
    const saved = localStorage.getItem(`qrdine_cart_${tableId}`);
    if (saved) {
      this.cartItems.set(JSON.parse(saved));
    } else {
      this.cartItems.set([]);
    }
  }

  // Checkout
  async placeOrder(orderNotes: string, customerName?: string): Promise<string> {
    const sess = this.session();
    const rest = this.restaurant();
    const tbl = this.table();
    
    if (!sess || !rest || !tbl || this.cartItems().length === 0) {
      throw new Error('Invalid order state');
    }

    // Allow Reorder configuration check (FEATURE 2)
    const allowReorder = this.experience()?.allowReorder ?? true;
    if (!allowReorder && this.orders().length > 0) {
      throw new Error('Reordering is disabled for this table session.');
    }

    this.loading.set(true);

    const orderId = 'ord_' + Math.random().toString(36).substring(2, 9) + Date.now();
    const finalCustomerName = customerName || localStorage.getItem('qrdine_customer_name') || 'Guest';
    
    const newOrder: Order = {
      orderId,
      restaurantId: rest.restaurantId,
      tableId: tbl.id!,
      sessionId: sess.sessionId,
      orderNumber: Math.floor(1000 + Math.random() * 9000),
      items: [...this.cartItems()],
      subtotal: this.cartSubtotal(),
      tax: this.cartTax(),
      discount: 0,
      grandTotal: this.cartGrandTotal(),
      notes: orderNotes,
      status: 'Pending',
      customerName: finalCustomerName, // BUG 4
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      await firstValueFrom(this.orderRepo.create(newOrder, orderId));
      
      // Auto Occupy Table on First Order (BUG 5 / FEATURE 2)
      const autoOccupy = this.experience()?.autoOccupyTable ?? true;
      if (autoOccupy && tbl.status !== 'OCCUPIED') {
        await firstValueFrom(this.tableRepo.update(tbl.id!, {
          status: 'OCCUPIED',
          activeSessionId: sess.sessionId
        }));
      }

      // Store active session details in localStorage (BUG 3)
      localStorage.setItem(`qrdine_active_order_${tbl.id!}`, JSON.stringify({
        restaurantId: rest.restaurantId,
        tableId: tbl.id!,
        orderId: orderId,
        sessionId: sess.sessionId
      }));

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
