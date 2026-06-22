import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { NotificationFacade } from '../../../core/facades/notification.facade';

@Component({
  selector: 'app-owner-notifications',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule, MatInputModule, MatSelectModule, MatFormFieldModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Notification History</h1>
          <p class="page-subtitle">View and manage all system notifications</p>
        </div>
        <button mat-flat-button color="primary" (click)="notifFacade.markAllAsRead()">
          <mat-icon>done_all</mat-icon> Mark All as Read
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content class="filter-grid">
          <mat-form-field appearance="outline">
            <mat-label>Search</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput placeholder="Search titles or messages..." [(ngModel)]="searchQuery">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select [(ngModel)]="priorityFilter">
              <mat-option value="ALL">All Priorities</mat-option>
              <mat-option value="CRITICAL">Critical</mat-option>
              <mat-option value="HIGH">High</mat-option>
              <mat-option value="MEDIUM">Medium</mat-option>
              <mat-option value="LOW">Low</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter">
              <mat-option value="ALL">All</mat-option>
              <mat-option value="UNREAD">Unread</mat-option>
              <mat-option value="READ">Read</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Results -->
      <div class="notif-grid">
        <div class="empty-state" *ngIf="filteredNotifications().length === 0">
          <mat-icon>notifications_off</mat-icon>
          <h3>No notifications found</h3>
          <p>Try adjusting your filters.</p>
        </div>

        <mat-card class="notif-card" *ngFor="let notif of filteredNotifications()" [ngClass]="[notif.priority.toLowerCase(), notif.isRead ? 'read' : 'unread']">
          <mat-card-content>
            <div class="card-header">
              <div class="icon-wrap" [ngClass]="notif.priority.toLowerCase()">
                <mat-icon>{{ getIcon(notif.type) }}</mat-icon>
              </div>
              <div class="meta">
                <h4>{{ notif.title }}</h4>
                <span class="time">{{ getRelativeTime(notif.createdAt) }}</span>
              </div>
              <div class="actions">
                <span class="priority-badge" [ngClass]="notif.priority.toLowerCase()">{{ notif.priority }}</span>
              </div>
            </div>
            
            <p class="message">{{ notif.message }}</p>
            
            <div class="card-footer">
              <div class="tags">
                <span class="tag role" *ngIf="notif.targetRole"><mat-icon>people</mat-icon> {{ notif.targetRole }}</span>
                <span class="tag type"><mat-icon>label</mat-icon> {{ notif.type.replace('_', ' ') }}</span>
              </div>
              <button mat-button color="primary" *ngIf="!notif.isRead" (click)="notifFacade.markAsRead(notif.id)">
                Mark as Read
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

    </div>
  `,
  styles: [`
    .page-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      .page-title {
        font-size: 1.75rem;
        font-weight: 800;
        margin: 0;
        color: #1e293b;
      }
      .page-subtitle {
        margin: 4px 0 0;
        color: #64748b;
      }
    }

    .filter-card {
      margin-bottom: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);

      .filter-grid {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        gap: 16px;
        padding: 16px 16px 0;
      }
      
      mat-form-field {
        width: 100%;
      }
    }

    .notif-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      background: white;
      border-radius: 12px;
      color: #94a3b8;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      h3 { margin: 0 0 8px; font-size: 1.25rem; color: #475569; }
      p { margin: 0; }
    }

    .notif-card {
      border-radius: 12px;
      transition: all 0.2s;
      border-left: 4px solid transparent;

      &.unread {
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      &.read {
        opacity: 0.8;
        background: #f8fafc;
        box-shadow: none;
        border: 1px solid #e2e8f0;
      }

      &.critical { border-left-color: #ef4444; }
      &.high { border-left-color: #f97316; }
      &.medium { border-left-color: #3b82f6; }
      &.low { border-left-color: #94a3b8; }

      .card-header {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 12px;

        .icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.critical { background: #fef2f2; color: #ef4444; }
          &.high { background: #fff7ed; color: #f97316; }
          &.medium { background: #eff6ff; color: #3b82f6; }
          &.low { background: #f1f5f9; color: #64748b; }
        }

        .meta {
          flex: 1;
          h4 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
          .time { font-size: 0.85rem; color: #64748b; }
        }
      }

      .priority-badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 20px;
        text-transform: uppercase;

        &.critical { background: #fef2f2; color: #ef4444; }
        &.high { background: #fff7ed; color: #f97316; }
        &.medium { background: #eff6ff; color: #3b82f6; }
        &.low { background: #f1f5f9; color: #64748b; }
      }

      .message {
        margin: 0 0 16px 64px;
        font-size: 1rem;
        color: #334155;
        line-height: 1.5;
      }

      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-left: 64px;
        padding-top: 12px;
        border-top: 1px solid #f1f5f9;

        .tags {
          display: flex;
          gap: 8px;

          .tag {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            background: #f1f5f9;
            padding: 4px 10px;
            border-radius: 6px;

            mat-icon {
              font-size: 14px;
              width: 14px;
              height: 14px;
            }
          }
        }
      }
    }

    @media (max-width: 768px) {
      .filter-grid {
        grid-template-columns: 1fr !important;
      }
      .message, .card-footer {
        margin-left: 0 !important;
      }
    }
  `]
})
export class OwnerNotificationsComponent {
  notifFacade = inject(NotificationFacade);

  searchQuery = signal('');
  priorityFilter = signal('ALL');
  statusFilter = signal('ALL');

  filteredNotifications = computed(() => {
    let notifs = this.notifFacade.notifications();
    
    const search = this.searchQuery().toLowerCase();
    const priority = this.priorityFilter();
    const status = this.statusFilter();

    if (search) {
      notifs = notifs.filter(n => n.title.toLowerCase().includes(search) || n.message.toLowerCase().includes(search));
    }
    if (priority !== 'ALL') {
      notifs = notifs.filter(n => n.priority === priority);
    }
    if (status !== 'ALL') {
      const isReadReq = status === 'READ';
      notifs = notifs.filter(n => n.isRead === isReadReq);
    }

    return notifs;
  });

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
}
