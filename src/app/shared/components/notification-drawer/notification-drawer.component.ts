import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationFacade } from '../../../core/facades/notification.facade';
import { Notification } from '../../../core/models';

@Component({
  selector: 'app-notification-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        style({ transform: 'translateX(0)' }),
        animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ],
  template: `
    <!-- Overlay -->
    <div class="overlay" *ngIf="isOpen" @fadeInOut (click)="close.emit()"></div>

    <!-- Drawer Panel -->
    <div class="drawer-panel" *ngIf="isOpen" @slideInOut>
      
      <!-- Header -->
      <div class="drawer-header">
        <div class="header-titles">
          <h2>Notifications</h2>
          <span class="badge" *ngIf="notifFacade.unreadCount() > 0">
            {{ notifFacade.unreadCount() }} New
          </span>
        </div>
        <div class="header-actions">
          <button mat-icon-button matTooltip="Mark all as read" 
                  *ngIf="notifFacade.unreadCount() > 0"
                  (click)="markAllAsRead()">
            <mat-icon>done_all</mat-icon>
          </button>
          <button mat-icon-button (click)="close.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="drawer-content">
        <!-- Empty State -->
        <div class="empty-state" *ngIf="notifFacade.notifications().length === 0">
          <mat-icon>notifications_off</mat-icon>
          <h3>All caught up!</h3>
          <p>You have no notifications at the moment.</p>
        </div>

        <!-- Notification List -->
        <div class="notification-list" *ngIf="notifFacade.notifications().length > 0">
          <div class="notif-card" 
               *ngFor="let notif of notifFacade.notifications()" 
               [ngClass]="[notif.priority.toLowerCase(), notif.isRead ? 'read' : 'unread']"
               (click)="markAsRead(notif)">
            
            <div class="notif-icon-wrap" [ngClass]="notif.priority.toLowerCase()">
              <mat-icon>{{ getIcon(notif.type) }}</mat-icon>
            </div>

            <div class="notif-details">
              <div class="notif-top">
                <h4>{{ notif.title }}</h4>
                <span class="time">{{ getRelativeTime(notif.createdAt) }}</span>
              </div>
              <p>{{ notif.message }}</p>
            </div>

            <div class="unread-dot" *ngIf="!notif.isRead"></div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(2px);
      z-index: 999;
    }

    .drawer-panel {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: 400px;
      max-width: 100vw;
      background: #ffffff;
      box-shadow: -4px 0 24px rgba(0,0,0,0.1);
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      background: #ffffff;

      .header-titles {
        display: flex;
        align-items: center;
        gap: 12px;

        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
        }

        .badge {
          background: #3b82f6;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }
      }

      .header-actions {
        display: flex;
        gap: 8px;
        mat-icon { color: #64748b; }
      }
    }

    .drawer-content {
      flex: 1;
      overflow-y: auto;
      background: #f8fafc;
      padding: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #94a3b8;
      text-align: center;
      padding: 40px;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 24px;
        opacity: 0.5;
      }

      h3 { margin: 0 0 8px; font-size: 1.2rem; color: #475569; }
      p { margin: 0; font-size: 0.95rem; }
    }

    .notification-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notif-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      gap: 16px;
      cursor: pointer;
      position: relative;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;

      &:hover {
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      }

      &.read {
        opacity: 0.75;
        background: #f8fafc;
      }

      /* Priority Styles */
      &.low .notif-icon-wrap { background: #f1f5f9; color: #64748b; }
      &.medium .notif-icon-wrap { background: #eff6ff; color: #3b82f6; }
      &.high .notif-icon-wrap { background: #fff7ed; color: #f97316; }
      &.critical .notif-icon-wrap { background: #fef2f2; color: #ef4444; }

      .notif-icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .notif-details {
        flex: 1;

        .notif-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;

          h4 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 700;
            color: #1e293b;
          }

          .time {
            font-size: 0.75rem;
            color: #94a3b8;
            font-weight: 500;
          }
        }

        p {
          margin: 0;
          font-size: 0.85rem;
          color: #475569;
          line-height: 1.5;
        }
      }

      .unread-dot {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #3b82f6;
      }
    }
  `]
})
export class NotificationDrawerComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  notifFacade = inject(NotificationFacade);

  getIcon(type: string): string {
    const iconMap: any = {
      'NEW_ORDER': 'local_fire_department',
      'ORDER_ACCEPTED': 'restaurant',
      'ORDER_PREPARING': 'blender',
      'ORDER_READY': 'room_service',
      'ITEM_READY': 'set_meal',
      'ORDER_DELIVERED': 'done_all',
      'BILL_REQUEST': 'receipt_long',
      'PAYMENT_SUCCESS': 'check_circle',
      'CALL_WAITER': 'front_hand',
      'WATER_REQUEST': 'water_drop',
      'CUTLERY_REQUEST': 'restaurant',
      'STAFF_CREATED': 'person_add',
      'SYSTEM_ALERT': 'warning'
    };
    return iconMap[type] || 'notifications';
  }

  getRelativeTime(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  markAsRead(notif: Notification) {
    if (!notif.isRead) {
      this.notifFacade.markAsRead(notif.id);
    }
  }

  markAllAsRead() {
    this.notifFacade.markAllAsRead();
  }
}
