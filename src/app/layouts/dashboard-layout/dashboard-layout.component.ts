import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../shared/components/layout/header/header.component';
import { SidebarComponent } from '../../shared/components/layout/sidebar/sidebar.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, RouterModule, HeaderComponent, SidebarComponent],
  template: `
    <div class="dashboard-container">
      <app-header class="header" (toggleSidebar)="drawer.toggle()"></app-header>
      
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav 
          #drawer 
          class="sidenav" 
          [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'"
          [mode]="(isHandset$ | async) ? 'over' : 'side'"
          [opened]="(isHandset$ | async) === false">
          <app-sidebar></app-sidebar>
        </mat-sidenav>
        
        <mat-sidenav-content class="content">
          <div class="content-wrapper">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
    }
    .header {
      flex: 0 0 auto;
      z-index: 2;
    }
    .sidenav-container {
      flex: 1 1 auto;
      background: var(--surface-ground);
    }
    .sidenav {
      width: 250px;
    }
    .content {
      display: flex;
      flex-direction: column;
    }
    .content-wrapper {
      padding: 1.5rem;
      flex: 1 1 auto;
    }
  `]
})
export class DashboardLayoutComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );
}
