import { Injectable, signal, effect } from '@angular/core';
import { TableRepository } from '../repositories/table.repository';
import { Table } from '../models';
import { AuthFacade } from './auth.facade';
import { firstValueFrom, Subscription } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class TableFacade {
  tables = signal<Table[]>([]);
  loading = signal<boolean>(false);
  selectedTable = signal<Table | null>(null);

  private tablesSub: Subscription | null = null;

  constructor(
    private tableRepo: TableRepository,
    private authFacade: AuthFacade
  ) {
    effect(() => {
      const user = this.authFacade.currentUser();
      if (user?.restaurantId) {
        this.subscribeToTables(user.restaurantId);
      } else {
        this.unsubscribe();
        this.tables.set([]);
      }
    }, { allowSignalWrites: true });
  }

  private subscribeToTables(restaurantId: string) {
    this.loading.set(true);
    this.unsubscribe();
    this.tablesSub = this.tableRepo.getByRestaurant(restaurantId).subscribe({
      next: (tables) => {
        this.tables.set(tables || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  private unsubscribe() {
    if (this.tablesSub) {
      this.tablesSub.unsubscribe();
      this.tablesSub = null;
    }
  }

  async loadTables() {
    // Realtime subscriptions are managed automatically via the constructor effect
  }

  async createTable(table: Partial<Table>): Promise<Table> {
    const user = this.authFacade.currentUser();
    if (!user?.restaurantId || !user.uid) throw new Error('No restaurant context');

    const newTable: Partial<Table> = {
      ...table,
      restaurantId: user.restaurantId,
      createdBy: user.uid,
      status: 'AVAILABLE', // Default to AVAILABLE
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const created = await firstValueFrom(this.tableRepo.create(newTable as Table));
    return created;
  }

  async updateTable(id: string, table: Partial<Table>): Promise<void> {
    const updateData: Partial<Table> = {
      ...table,
      updatedAt: serverTimestamp()
    };

    await firstValueFrom(this.tableRepo.update(id, updateData));
  }

  async deleteTable(id: string): Promise<void> {
    await firstValueFrom(this.tableRepo.delete(id));
  }

  async generateTableQr(table: Table): Promise<void> {
    if (!table.id) return;
    const user = this.authFacade.currentUser();
    if (!user) return;

    const qrCodeUrl = `${window.location.origin}/menu/${table.restaurantId}/${table.id}`;

    const updateData: Partial<Table> = {
      qrCodeUrl,
      lastGeneratedAt: serverTimestamp(),
      generatedBy: user.uid,
      updatedAt: serverTimestamp()
    };

    await firstValueFrom(this.tableRepo.update(table.id, updateData));
  }

  selectTable(table: Table | null) {
    this.selectedTable.set(table);
  }
}
