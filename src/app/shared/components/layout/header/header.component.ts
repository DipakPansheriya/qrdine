import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthFacade } from '../../../../core/facades/auth.facade';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule],
  template: `
    <mat-toolbar color="primary" class="dashboard-header">
      <button mat-icon-button (click)="onToggleSidebar()">
        <mat-icon>menu</mat-icon>
      </button>
      <div class="search-bar">
        <mat-icon class="search-icon">search</mat-icon>
        <input type="text" placeholder="Search here...">
      </div>
      
      <span class="spacer"></span>
      
      <button mat-icon-button class="notification-btn">
        <mat-icon>notifications_none</mat-icon>
      </button>
      
      <button mat-button [matMenuTriggerFor]="userMenu" class="user-chip">
        <span class="greeting" *ngIf="user() as u">Hello, {{ u.displayName || 'User' }}</span>
        <div class="avatar-circle">
          <mat-icon>person</mat-icon>
        </div>
      </button>
      
      <mat-menu #userMenu="matMenu">
        <button mat-menu-item>
          <mat-icon>person</mat-icon>
          <span>Profile Settings</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()">
          <mat-icon>exit_to_app</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .dashboard-header {
      background: var(--surface-ground);
      color: var(--text-primary);
      z-index: 10;
      padding: 0 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }
    .search-bar {
      display: flex;
      align-items: center;
      background: #ffffff;
      border-radius: 20px;
      padding: 0.25rem 1rem;
      margin-left: 1rem;
      width: 300px;
      max-width: 100%;
      border: 1px solid var(--surface-border);
    }
    .search-icon {
      color: var(--text-muted);
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
      margin-right: 0.5rem;
    }
    .search-bar input {
      border: none;
      outline: none;
      background: transparent;
      width: 100%;
      color: var(--text-primary);
    }
    .spacer {
      flex: 1 1 auto;
    }
    .notification-btn {
      color: var(--brand-accent);
      background: rgba(232, 121, 149, 0.1);
      margin-right: 1rem;
    }
    .user-chip {
      background: var(--brand-primary);
      color: #ffffff;
      border-radius: 30px;
      padding: 4px 4px 4px 16px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      height: 40px;
    }
    .greeting {
      font-weight: 500;
      font-size: 0.875rem;
    }
    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-circle mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }
    @media (max-width: 768px) {
      .search-bar {
        display: none;
      }
      .greeting {
        display: none;
      }
      .user-chip {
        padding: 4px;
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
}
