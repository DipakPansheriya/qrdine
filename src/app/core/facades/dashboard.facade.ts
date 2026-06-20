import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AuthFacade } from './auth.facade';
import { MenuFacade } from './menu.facade';
import { TableFacade } from './table.facade';
import { StaffFacade } from './staff.facade';
import { OwnerSettingsFacade } from './owner-settings.facade';
import { OrderRepository } from '../repositories/order.repository';
import { TableRepository } from '../repositories/table.repository';
import { CustomerSessionRepository } from '../repositories/customer-session.repository';
import { Order } from '../models';
import { Subscription, firstValueFrom } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';

export interface DashboardKpi {
  todayOrders: number;
  todayRevenue: number;
  activeTables: number;
  totalMenuItems: number;
  totalStaff: number;
  avgOrderValue: number;
}

export interface RevenuePoint {
  label: string;
  value: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private authFacade = inject(AuthFacade);
  private menuFacade = inject(MenuFacade);
  private tableFacade = inject(TableFacade);
  private staffFacade = inject(StaffFacade);
  private settingsFacade = inject(OwnerSettingsFacade);
  private orderRepo = inject(OrderRepository);
  private tableRepo = inject(TableRepository);
  private sessionRepo = inject(CustomerSessionRepository);

  // State
  loading = signal(true);
  allOrders = signal<Order[]>([]);
  private orderSub: Subscription | null = null;

  // Computed KPIs
  kpi = computed<DashboardKpi>(() => {
    const orders = this.allOrders();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => {
      const ts = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return ts >= today;
    });

    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const activeTables = this.tableFacade.tables().filter(t => t.status === 'OCCUPIED').length;
    const totalMenuItems = this.menuFacade.items().length;
    const totalStaff = this.staffFacade.staffList().length;
    const avgOrderValue = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

    return { todayOrders: todayOrders.length, todayRevenue, activeTables, totalMenuItems, totalStaff, avgOrderValue };
  });

  // Computed: Recent Orders (last 10)
  recentOrders = computed(() =>
    [...this.allOrders()]
      .sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return tB - tA;
      })
      .slice(0, 10)
  );

  // Computed: Today's revenue chart (last 7 days)
  last7Days = computed<RevenuePoint[]>(() => {
    const orders = this.allOrders();
    const points: RevenuePoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayOrders = orders.filter(o => {
        const ts = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
        return ts >= d && ts < next;
      });
      const value = dayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      points.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), value });
    }
    return points;
  });

  // Computed: Table status groups
  tables = this.tableFacade.tables;

  // Computed: Staff breakdown
  staffBreakdown = computed(() => {
    const list = this.staffFacade.staffList();
    return {
      total: list.length,
      managers: list.filter(s => s.role === 'Manager').length,
      waiters: list.filter(s => s.role === 'Waiter').length,
      kitchen: list.filter(s => s.role === 'Kitchen').length,
      cashiers: list.filter(s => s.role === 'Cashier').length,
    };
  });

  // Computed: QR status
  qrStatus = computed(() => {
    const tables = this.tableFacade.tables();
    return {
      total: tables.length,
      generated: tables.filter(t => !!t.qrCodeUrl).length,
      missing: tables.filter(t => !t.qrCodeUrl).length,
    };
  });

  // Computed: Top menu items (by order frequency)
  topMenuItems = computed(() => {
    const orders = this.allOrders();
    const items = this.menuFacade.items();
    const countMap: Record<string, { count: number; revenue: number }> = {};

    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (!countMap[item.itemId]) countMap[item.itemId] = { count: 0, revenue: 0 };
        countMap[item.itemId].count += item.quantity;
        countMap[item.itemId].revenue += item.totalPrice;
      });
    });

    return items
      .map(item => ({
        ...item,
        orderCount: countMap[item.itemId]?.count || 0,
        revenue: countMap[item.itemId]?.revenue || 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);
  });

  // Computed: Onboarding checklist
  onboardingChecklist = computed(() => {
    const tables = this.tableFacade.tables();
    const items = this.menuFacade.items();
    const cats = this.menuFacade.categories();
    const staff = this.staffFacade.staffList();

    const steps = [
      { label: 'Restaurant Profile Created', done: true, route: '/owner/settings' },
      { label: 'First Table Added', done: tables.length > 0, route: '/owner/tables' },
      { label: 'QR Code Generated', done: tables.some(t => !!t.qrCodeUrl), route: '/owner/tables' },
      { label: 'Menu Category Added', done: cats.length > 0, route: '/owner/menu' },
      { label: 'Menu Item Added', done: items.length > 0, route: '/owner/menu' },
      { label: 'Staff Member Added', done: staff.length > 0, route: '/owner/staff' },
    ];
    const done = steps.filter(s => s.done).length;
    return { steps, percent: Math.round((done / steps.length) * 100), allDone: done === steps.length };
  });

  // Selectors passthrough
  settings = this.settingsFacade.settings;
  experience = this.settingsFacade.experience;
  categories = this.menuFacade.categories;
  menuItems = this.menuFacade.items;

  constructor() {
    effect(() => {
      const user = this.authFacade.currentUser();
      if (user?.restaurantId) {
        this.loadAll(user.restaurantId);
      }
    }, { allowSignalWrites: true });
  }

  private loadAll(restaurantId: string) {
    this.loading.set(true);
    // Load from existing facades
    this.menuFacade.loadMenuData();
    this.tableFacade.loadTables();

    // Load orders (realtime)
    if (this.orderSub) this.orderSub.unsubscribe();
    this.orderSub = this.orderRepo.getByRestaurant(restaurantId).subscribe({
      next: (orders) => {
        this.allOrders.set(orders);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  async updateOrderStatus(orderId: string, status: Order['status']) {
    try {
      await firstValueFrom(this.orderRepo.update(orderId, { status, updatedAt: serverTimestamp() }));
      
      // Auto Free Table on Payment/Completion (BUG 5 / FEATURE 2)
      if (status === 'Completed' || status === 'Cancelled') {
        const order = this.allOrders().find(o => o.orderId === orderId);
        if (order) {
          const autoFree = this.experience()?.autoFreeTable ?? true;
          if (autoFree) {
            // Update table to AVAILABLE and clear session ID
            await firstValueFrom(this.tableRepo.update(order.tableId, {
              status: 'AVAILABLE',
              activeSessionId: ''
            }));

            // Close the customer session
            if (order.sessionId) {
              await firstValueFrom(this.sessionRepo.update(order.sessionId, {
                status: status === 'Completed' ? 'Completed' : 'Cancelled',
                endTime: serverTimestamp()
              }));
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  }
}
