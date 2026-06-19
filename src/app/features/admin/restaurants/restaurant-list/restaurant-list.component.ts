import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RestaurantFacade } from '../../../../core/facades/restaurant.facade';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule, RouterModule],
  templateUrl: './restaurant-list.component.html',
  styleUrl: './restaurant-list.component.scss'
})
export class RestaurantListComponent implements OnInit {
  private facade = inject(RestaurantFacade);
  private router = inject(Router);

  restaurants = this.facade.restaurants;
  isLoading = this.facade.isLoading;

  displayedColumns: string[] = ['name', 'slug', 'status', 'actions'];

  ngOnInit() {
    this.facade.loadAll();
  }

  addRestaurant() {
    this.router.navigate(['/admin/restaurants/new']);
  }

  editRestaurant(id: string) {
    this.router.navigate(['/admin/restaurants', id, 'edit']);
  }

  viewDetails(id: string) {
    this.router.navigate(['/admin/restaurants', id]);
  }

  deleteRestaurant(id: string) {
    if (confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) {
      this.facade.delete(id).subscribe();
    }
  }
}
