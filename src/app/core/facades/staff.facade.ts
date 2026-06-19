import { Injectable, signal, computed, effect } from '@angular/core';
import { StaffRepository } from '../repositories/staff.repository';
import { AuthFacade } from './auth.facade';
import { Staff, Role } from '../models';
import { firstValueFrom, Subscription } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class StaffFacade {
  staffList = signal<Staff[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private staffSub: Subscription | null = null;

  constructor(
    private staffRepo: StaffRepository,
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
    this.staffSub = this.staffRepo.getByRestaurant(restaurantId).subscribe({
      next: (staff) => {
        this.staffList.set(staff);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading staff', err);
        this.error.set('Failed to load staff');
        this.loading.set(false);
      }
    });
  }

  async addStaff(staffData: Partial<Staff>) {
    try {
      this.loading.set(true);
      const user = this.authFacade.currentUser();
      if (!user || !user.restaurantId) throw new Error('Not authenticated');

      const newStaff: Staff = {
        staffId: '',
        restaurantId: user.restaurantId,
        name: staffData.name || '',
        email: staffData.email || '',
        phone: staffData.phone || '',
        role: staffData.role as Role || 'Waiter',
        status: staffData.status as any || 'ACTIVE',
        createdAt: serverTimestamp()
      };

      await firstValueFrom(this.staffRepo.create(newStaff));
      this.snackBar.open('Staff added successfully', 'Close', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open(e.message || 'Error adding staff', 'Close', { duration: 3000 });
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async updateStaff(id: string, staffData: Partial<Staff>) {
    try {
      this.loading.set(true);
      await firstValueFrom(this.staffRepo.update(id, { ...staffData, updatedAt: serverTimestamp() }));
      this.snackBar.open('Staff updated successfully', 'Close', { duration: 3000 });
    } catch (e: any) {
      this.snackBar.open(e.message || 'Error updating staff', 'Close', { duration: 3000 });
      throw e;
    } finally {
      this.loading.set(false);
    }
  }
}
