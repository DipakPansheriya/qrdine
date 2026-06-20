import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-register-success',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    RouterModule
  ],
  templateUrl: './register-success.component.html',
  styleUrl: './register-success.component.scss'
})
export class RegisterSuccessComponent {
  private router = inject(Router);
  isLoading = signal<boolean>(false);

  async proceedToLogin() {
    this.isLoading.set(true);
    // Simulate premium account initialization transition
    await new Promise(resolve => setTimeout(resolve, 800));
    this.router.navigate(['/login']);
  }
}
