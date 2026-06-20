import { Component, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DashboardFacade } from '../../../core/facades/dashboard.facade';
import { AuthFacade } from '../../../core/facades/auth.facade';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent implements OnInit {
  facade = inject(DashboardFacade);
  private authFacade = inject(AuthFacade);

  // Greeting
  get greeting() {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
    return { text: 'Good Evening', emoji: '🌙' };
  }

  get ownerFirstName() {
    const name = this.authFacade.currentUser()?.displayName || 'Owner';
    return name.split(' ')[0];
  }

  get todayDate() {
    return new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  get todayShortDay() {
    return new Date().toLocaleDateString('en', { weekday: 'short' });
  }

  // KPI Card definitions
  get kpiCards() {
    const k = this.facade.kpi();
    return [
      { label: "Today's Orders", value: k.todayOrders, icon: 'receipt_long', bg: 'rgba(67,97,238,0.1)', color: '#4361ee', trend: 12, trendLabel: '+12% vs yesterday' },
      { label: "Today's Revenue", value: '₹' + k.todayRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 }), icon: 'currency_rupee', bg: 'rgba(16,185,129,0.1)', color: '#10b981', trend: 8, trendLabel: '+8% vs yesterday' },
      { label: 'Active Tables', value: k.activeTables + ' / ' + this.facade.tables().length, icon: 'table_restaurant', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', trend: 0, trendLabel: 'Live count' },
      { label: 'Menu Items', value: k.totalMenuItems, icon: 'menu_book', bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', trend: 0, trendLabel: 'All categories' },
      { label: 'Staff Members', value: k.totalStaff, icon: 'group', bg: 'rgba(236,72,153,0.1)', color: '#ec4899', trend: 0, trendLabel: 'Active staff' },
      { label: 'Avg Order Value', value: '₹' + k.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }), icon: 'analytics', bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9', trend: 5, trendLabel: '+5% vs yesterday' },
    ];
  }

  // Revenue chart helpers
  get noRevenue() {
    return this.facade.last7Days().every(p => p.value === 0);
  }

  getBarHeight(value: number): number {
    const max = Math.max(...this.facade.last7Days().map(p => p.value), 1);
    return Math.max((value / max) * 100, 4);
  }

  // Table status icon
  getTableIcon(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'OCCUPIED': return 'group';
      case 'RESERVED': return 'event_available';
      case 'CLEANING': return 'cleaning_services';
      default: return 'check_circle';
    }
  }

  // Resolve tableId → table number label (e.g. "T-01")
  getTableLabel(tableId: string): string {
    const table = this.facade.tables().find(t => t.id === tableId);
    return table ? table.tableNumber : '—';
  }

  // Open / closed calculation
  get isOpen(): boolean {
    const settings = this.facade.settings();
    if (!settings?.businessHours) return false;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = days[new Date().getDay()] as keyof typeof settings.businessHours;
    const dayHours = settings.businessHours[todayKey];
    if (!dayHours?.enabled) return false;
    const now = new Date();
    const [oh, om] = (dayHours.open || '09:00').split(':').map(Number);
    const [ch, cm] = (dayHours.close || '22:00').split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return nowMin >= oh * 60 + om && nowMin <= ch * 60 + cm;
  }

  get todayHours(): string {
    const settings = this.facade.settings();
    if (!settings?.businessHours) return '';
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = days[new Date().getDay()] as keyof typeof settings.businessHours;
    const dayHours = settings.businessHours[todayKey];
    if (!dayHours?.enabled) return 'Closed today';
    return `${dayHours.open} – ${dayHours.close}`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatTime(ts: any): string {
    if (!ts) return '—';
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  }

  // Staff breakdown display
  get staffRoles() {
    const b = this.facade.staffBreakdown();
    return [
      { label: 'Managers', count: b.managers, color: '#4361ee' },
      { label: 'Waiters', count: b.waiters, color: '#10b981' },
      { label: 'Kitchen', count: b.kitchen, color: '#f59e0b' },
      { label: 'Cashiers', count: b.cashiers, color: '#ec4899' },
    ];
  }

  // Quick nav cards
  quickNavCards = [
    { label: 'Menu Management', desc: 'Add categories & items', icon: 'menu_book', route: '/owner/menu', bg: 'rgba(67,97,238,0.1)', color: '#4361ee' },
    { label: 'Table Management', desc: 'Manage tables & QR codes', icon: 'table_bar', route: '/owner/tables', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    { label: 'Staff Management', desc: 'Add & manage your team', icon: 'group', route: '/owner/staff', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    { label: 'Restaurant Settings', desc: 'Hours, taxes & branding', icon: 'tune', route: '/owner/settings', bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
  ];

  ngOnInit() {}

  async updateStatus(orderId: string, status: string) {
    await this.facade.updateOrderStatus(orderId, status as any);
  }
}
