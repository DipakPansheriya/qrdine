import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/layout/header/header.component';
import { SidebarComponent } from '../../shared/components/layout/sidebar/sidebar.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';
import { signal } from '@angular/core';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  template: `
    <div class="dashboard-shell">
      <!-- Sidebar -->
      <aside class="sidebar-area" [class.collapsed]="sidebarCollapsed()">
        <app-sidebar [isCollapsed]="sidebarCollapsed()"></app-sidebar>
      </aside>

      <!-- Main area (header + content) -->
      <div class="main-area">
        <app-header class="header-bar" (toggleSidebar)="toggleSidebar()"></app-header>
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-shell {
      display: flex;
      height: 100vh;
      width: 100%;
      overflow: hidden;
      background: #f8fafc;
    }

    /* Sidebar area */
    .sidebar-area {
      width: 240px;
      min-width: 240px;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      z-index: 20;
    }

    .sidebar-area.collapsed {
      width: 68px;
      min-width: 68px;
    }

    /* Main area */
    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }

    /* Header */
    .header-bar {
      flex: 0 0 64px;
      z-index: 10;
    }

    /* Page content */
    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    /* Mobile: sidebar slides over content */
    @media (max-width: 768px) {
      .sidebar-area {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        width: 240px !important;
        min-width: 240px !important;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        z-index: 100;
      }

      .sidebar-area.mobile-open {
        transform: translateX(0);
      }

      .sidebar-area.collapsed {
        width: 240px !important;
        min-width: 240px !important;
      }
    }
  `]
})
export class DashboardLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);

  sidebarCollapsed = signal(false);

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}
