import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { UserRepository } from '../../../core/repositories/user.repository';
import { RestaurantRepository } from '../../../core/repositories/restaurant.repository';
import { User, Restaurant, Role } from '../../../core/models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-debug-setup',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  templateUrl: './debug-setup.component.html',
  styleUrl: './debug-setup.component.scss'
})
export class DebugSetupComponent {
  private auth = inject(Auth);
  private userRepo = inject(UserRepository);
  private restaurantRepo = inject(RestaurantRepository);
  private router = inject(Router);

  isWorking = false;
  message = '';

  async seedUser(role: Role, email: string) {
    this.isWorking = true;
    this.message = `Creating ${role}...`;
    const password = 'password123'; // Default password for testing

    try {
      let uid = '';
      
      try {
        // Try to create the user in Auth
        const cred = await createUserWithEmailAndPassword(this.auth, email, password);
        uid = cred.user.uid;
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          // If already exists, just sign in
          this.message = `Auth exists. Signing in as ${role}...`;
          const cred = await signInWithEmailAndPassword(this.auth, email, password);
          uid = cred.user.uid;
        } else {
          throw authError;
        }
      }

      this.message = `Wiring up Firestore profile for ${role}...`;
      const restaurantId = 'res_test_123';

      // 1. Create a dummy restaurant if Owner or Super Admin (to ensure it exists)
      if (role === 'Owner' || role === 'Super Admin') {
         const dummyRest: Restaurant = {
           restaurantId,
           name: 'The Great Test Cafe',
           slug: 'test-cafe',
           currencyCode: 'USD',
           currencySymbol: '$',
           timezone: 'UTC',
           status: 'active',
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString()
         };
         // Use the repository create with explicit ID
         await this.restaurantRepo.create(dummyRest, restaurantId).toPromise();
      }

      // 2. Create the user document with explicitly set ID (the uid)
      const userDoc: User = {
        uid,
        email,
        role,
        displayName: `Test ${role}`,
        restaurantId: role !== 'Super Admin' ? restaurantId : undefined
      };

      await this.userRepo.create(userDoc, uid).toPromise();

      this.message = `Success! Logged in as ${role}. Redirecting...`;
      setTimeout(() => {
        this.routeUserByRole(role);
      }, 1000);

    } catch (err: any) {
      this.message = 'Error: ' + err.message;
    } finally {
      this.isWorking = false;
    }
  }

  private routeUserByRole(role: Role) {
    switch (role) {
      case 'Super Admin':
        this.router.navigate(['/admin']);
        break;
      case 'Owner':
      case 'Manager':
        this.router.navigate(['/owner']);
        break;
      case 'Waiter':
      case 'Kitchen':
      case 'Cashier':
        this.router.navigate(['/staff']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
