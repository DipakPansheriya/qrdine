import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = this.authFacade.isLoading;
  errorMessage = '';

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    this.authFacade.login(email, password).subscribe({
      next: (user: User | undefined) => {
        if (user) {
          if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
            this.errorMessage = 'Your account has been disabled.';
            this.authFacade.logout();
            return;
          }
          if (user.status === 'PENDING') {
            this.errorMessage = 'Account pending activation.';
            this.authFacade.logout();
            return;
          }
          if (user.mustChangePassword) {
            this.router.navigate(['/change-password']);
            return;
          }
          this.routeUserByRole(user.role);
        }
      },
      error: (err: any) => {
        if (err.message === 'USER_DOCUMENT_MISSING') {
          this.errorMessage = 'Account exists in Authentication but has no Role/Profile in the Database. Please contact support or create the user document manually in Firestore.';
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          this.errorMessage = 'Invalid email or password.';
        } else {
          this.errorMessage = 'An error occurred during login. ' + (err.message || '');
        }
      }
    });
  }

  private routeUserByRole(role: string) {
    switch (role) {
      case 'Super Admin':
        this.router.navigate(['/admin']);
        break;
      case 'Owner':
      case 'Manager':
        this.router.navigate(['/owner']);
        break;
      case 'Waiter':
        this.router.navigate(['/waiter/dashboard']);
        break;
      case 'Kitchen':
        this.router.navigate(['/kitchen/orders']);
        break;
      case 'Cashier':
        this.router.navigate(['/cashier/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
