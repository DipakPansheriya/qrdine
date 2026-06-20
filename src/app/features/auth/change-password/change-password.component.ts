import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '../../../core/facades/auth.facade';
import { Router } from '@angular/router';
import { Auth, updatePassword } from '@angular/fire/auth';
import { UserRepository } from '../../../core/repositories/user.repository';
import { firstValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private authFacade = inject(AuthFacade);
  private auth = inject(Auth);
  private userRepo = inject(UserRepository);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  isLoading = false;
  errorMessage = '';

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  async changePassword() {
    if (this.passwordForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('No active user found. Please login again.');

      const newPassword = this.passwordForm.value.newPassword;
      await updatePassword(user, newPassword);

      // Update Firestore mustChangePassword flag
      const firestoreUser = this.authFacade.currentUser();
      if (firestoreUser) {
        await firstValueFrom(this.userRepo.update(firestoreUser.uid, { mustChangePassword: false }));
        
        this.snackBar.open('Password updated successfully!', 'Close', { duration: 3000 });
        
        // Route to their respective dashboard
        this.routeUserByRole(firestoreUser.role);
      }
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        this.errorMessage = 'Please log out and log back in to change your password.';
      } else {
        this.errorMessage = err.message || 'Failed to change password.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private routeUserByRole(role: string) {
    switch (role) {
      case 'Super Admin': this.router.navigate(['/admin']); break;
      case 'Owner':
      case 'Manager': this.router.navigate(['/owner']); break;
      case 'Waiter': this.router.navigate(['/waiter/dashboard']); break;
      case 'Kitchen': this.router.navigate(['/kitchen/orders']); break;
      case 'Cashier': this.router.navigate(['/cashier/dashboard']); break;
      default: this.router.navigate(['/login']);
    }
  }
}
