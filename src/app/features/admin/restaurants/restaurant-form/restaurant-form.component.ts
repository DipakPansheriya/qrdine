import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RestaurantFacade } from '../../../../core/facades/restaurant.facade';
import { RestaurantRepository } from '../../../../core/repositories/restaurant.repository';
import { Restaurant } from '../../../../core/models';

@Component({
  selector: 'app-restaurant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './restaurant-form.component.html',
  styleUrl: './restaurant-form.component.scss'
})
export class RestaurantFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private facade = inject(RestaurantFacade);
  private repo = inject(RestaurantRepository);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = false;
  restaurantId: string | null = null;
  
  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    email: ['', [Validators.email]],
    phone: [''],
    currency: ['USD', Validators.required],
    timezone: ['UTC', Validators.required],
    status: ['active', Validators.required]
  });

  ngOnInit() {
    this.restaurantId = this.route.snapshot.paramMap.get('id');
    if (this.restaurantId) {
      this.isEditMode = true;
      this.repo.getById(this.restaurantId).subscribe(restaurant => {
        if (restaurant) {
          this.form.patchValue(restaurant);
        }
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    const data = this.form.value;
    
    if (this.isEditMode && this.restaurantId) {
      data.updatedAt = new Date().toISOString();
      this.facade.update(this.restaurantId, data).subscribe(() => {
        this.router.navigate(['/admin/restaurants']);
      });
    } else {
      data.createdAt = new Date().toISOString();
      data.updatedAt = data.createdAt;
      this.facade.create(data as Restaurant).subscribe(() => {
        this.router.navigate(['/admin/restaurants']);
      });
    }
  }
}
