import { Injectable, signal, computed, effect } from '@angular/core';
import { UserRepository } from '../repositories/user.repository';
import { AuthFacade } from './auth.facade';
import { User, Role } from '../models';
import { firstValueFrom, Subscription } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { initializeApp, getApp, getApps } from '@angular/fire/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StaffFacade {
  staffList = signal<User[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private staffSub: Subscription | null = null;

  constructor(
    private userRepo: UserRepository,
    private authFacade: AuthFacade,
    private snackBar: MatSnackBar
  ) {
    effect(() => {
      const user = this.authFacade.currentUser();
      if (user?.restaurantId) {
        this.loadStaff(user.restaurantId);
      } else {
        this.staffList.set([]);
      }
    }, { allowSignalWrites: true });
  }

  private loadStaff(restaurantId: string) {
    this.loading.set(true);
    if (this.staffSub) this.staffSub.unsubscribe();
    this.staffSub = this.userRepo.getByRestaurant(restaurantId).subscribe({
      next: (staff) => {
        this.staffList.set(staff.filter(u => u.role !== 'Owner' && u.role !== 'Super Admin'));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading staff', err);
        this.error.set('Failed to load staff');
        this.loading.set(false);
      }
    });
  }

  async addStaff(staffData: Partial<User>) {
    try {
      this.loading.set(true);
      const user = this.authFacade.currentUser();
      if (!user || !user.restaurantId) throw new Error('Not authenticated');

      const tempPassword = 'Welcome@123';

      let secondaryApp;
      if (!getApps().find(app => app.name === 'SecondaryApp')) {
        secondaryApp = initializeApp(environment.firebaseConfig, 'SecondaryApp');
      } else {
        secondaryApp = getApp('SecondaryApp');
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      
      const credential = await createUserWithEmailAndPassword(secondaryAuth, staffData.email!, tempPassword);
      await signOut(secondaryAuth);
      
      const uid = credential.user.uid;

      const newStaff: User = {
        uid: uid,
        restaurantId: user.restaurantId,
        name: staffData.name || '',
        displayName: staffData.name || '',
        email: staffData.email || '',
        mobile: staffData.mobile || '',
        phone: staffData.mobile || '',
        role: staffData.role as Role || 'Waiter',
        status: staffData.status as any || 'ACTIVE',
        mustChangePassword: true,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      };

      await firstValueFrom(this.userRepo.create(newStaff, uid));
      this.snackBar.open(`Staff added. Password: ${tempPassword}`, 'Close', { duration: 6000 });
    } catch (e: any) {
      this.snackBar.open(e.message || 'Error adding staff', 'Close', { duration: 3000 });
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async updateStaff(id: string, staffData: Partial<User>) {
    try {
      this.loading.set(true);
      await firstValueFrom(this.userRepo.update(id, { ...staffData, updatedAt: serverTimestamp() }));
      this.snackBar.open('Staff updated successfully', 'Close', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open(e.message || 'Error updating staff', 'Close', { duration: 3000 });
      throw e;
    } finally {
      this.loading.set(false);
    }
  }
}
