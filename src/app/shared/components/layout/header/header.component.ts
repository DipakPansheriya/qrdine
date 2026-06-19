import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthFacade } from '../../../../core/facades/auth.facade';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, MatBadgeModule],
  template: `
    <header class="app-header">
      <!-- Left: Menu Toggle -->
      <div class="header-left">
        <button class="icon-btn toggle-btn" (click)="onToggleSidebar()">
          <mat-icon>menu</mat-icon>
        </button>

        <!-- Search bar -->
        <div class="search-wrap">
          <mat-icon class="s-icon">search</mat-icon>
          <input class="search-input" type="text" placeholder="Search anything...">
          <span class="kbd-hint">⌘K</span>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="header-right">
        <!-- Notification -->
        <button class="icon-btn notif-btn" matBadge="3" matBadgeColor="warn" matBadgeSize="small">
          <mat-icon>notifications_outlined</mat-icon>
        </button>

        <!-- Divider -->
        <div class="v-divider"></div>

        <!-- User menu -->
        <button class="user-btn" [matMenuTriggerFor]="userMenu">
          <div class="user-avatar" *ngIf="user() as u">
            {{ getInitials(u.displayName || u.email) }}
          </div>
          <div class="user-text" *ngIf="user() as u">
            <span class="user-name">{{ u.displayName || 'User' }}</span>
            <span class="user-role">{{ u.role }}</span>
          </div>
          <mat-icon class="chevron">expand_more</mat-icon>
        </button>

        <mat-menu #userMenu="matMenu" class="user-dropdown">
          <div class="menu-header" *ngIf="user() as u">
            <div class="menu-avatar">{{ getInitials(u.displayName || u.email) }}</div>
            <div>
              <p class="menu-name">{{ u.displayName || 'User' }}</p>
              <p class="menu-email">{{ u.email }}</p>
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item>
            <mat-icon>person_outline</mat-icon>
            <span>Profile</span>
          </button>
          <button mat-menu-item>
            <mat-icon>settings_outlined</mat-icon>
            <span>Account Settings</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item class="logout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign Out</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      background: #ffffff;
      border-bottom: 1px solid #f1f5f9;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    /* Left */
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 10px;
      background: #f8fafc;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .icon-btn:hover {
      background: #f1f5f9;
      color: #334155;
    }

    .toggle-btn {
      background: transparent;
    }

    .search-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.5rem 1rem;
      flex: 1;
      max-width: 380px;
      transition: all 0.2s;
    }

    .search-wrap:focus-within {
      border-color: #4361ee;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.08);
    }

    .s-icon {
      color: #94a3b8;
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.875rem;
      color: #334155;
    }

    .search-input::placeholder {
      color: #94a3b8;
    }

    .kbd-hint {
      font-size: 0.7rem;
      background: #e2e8f0;
      color: #64748b;
      padding: 2px 6px;
      border-radius: 5px;
      flex-shrink: 0;
    }

    /* Right */
    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .notif-btn {
      position: relative;
      color: #64748b;
    }

    .v-divider {
      width: 1px;
      height: 28px;
      background: #e2e8f0;
    }

    .user-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 0.4rem 0.75rem 0.4rem 0.4rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .user-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: linear-gradient(135deg, #4361ee, #7c3aed);
      color: white;
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.2;
    }

    .user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #1e293b;
    }

    .user-role {
      font-size: 0.68rem;
      color: #94a3b8;
    }

    .chevron {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      color: #94a3b8;
    }

    /* Dropdown menu */
    .menu-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
    }

    .menu-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #4361ee, #7c3aed);
      color: white;
      font-weight: 700;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .menu-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1e293b;
      margin: 0;
    }

    .menu-email {
      font-size: 0.75rem;
      color: #94a3b8;
      margin: 2px 0 0;
    }

    .logout-btn {
      color: #ef4444 !important;
    }

    @media (max-width: 768px) {
      .search-wrap {
        display: none;
      }
      .user-text {
        display: none;
      }
      .kbd-hint {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  private authFacade = inject(AuthFacade);
  user = this.authFacade.currentUser;

  @Output() toggleSidebar = new EventEmitter<void>();

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  logout() {
    this.authFacade.logout();
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  }
}
