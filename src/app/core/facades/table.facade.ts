import { Injectable, signal } from '@angular/core';
import { TableRepository } from '../repositories/table.repository';
import { Table } from '../models';
import { AuthFacade } from './auth.facade';
import { firstValueFrom } from 'rxjs';
import { serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class TableFacade {
  tables = signal<Table[]>([]);
  loading = signal<boolean>(false);
  selectedTable = signal<Table | null>(null);

  constructor(
    private tableRepo: TableRepository,
    private authFacade: AuthFacade
  ) {}

  async loadTables() {
    this.loading.set(true);
    try {
      const user = this.authFacade.currentUser();
      if (!user?.restaurantId) return;

      const tables$ = this.tableRepo.getByRestaurant(user.restaurantId);
      const tables = await firstValueFrom(tables$);
      this.tables.set(tables);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async createTable(table: Partial<Table>): Promise<Table> {
    const user = this.authFacade.currentUser();
    if (!user?.restaurantId || !user.uid) throw new Error('No restaurant context');

    const newTable: Partial<Table> = {
      ...table,
      restaurantId: user.restaurantId,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const created = await firstValueFrom(this.tableRepo.create(newTable as Table));
    await this.loadTables();
    return created;
  }

  async updateTable(id: string, table: Partial<Table>): Promise<void> {
    const updateData: Partial<Table> = {
      ...table,
      updatedAt: serverTimestamp()
    };
    
    await firstValueFrom(this.tableRepo.update(id, updateData));
    await this.loadTables();
  }

  async deleteTable(id: string): Promise<void> {
    await firstValueFrom(this.tableRepo.delete(id));
    await this.loadTables();
  }

  async generateTableQr(table: Table): Promise<void> {
    if (!table.id) return;
    const user = this.authFacade.currentUser();
    if (!user) return;

    // The current environment url would ideally come from environment.ts, but we use hardcoded as requested
    const qrCodeUrl = `http://localhost:4200/menu/${table.restaurantId}/${table.id}`;

    const updateData: Partial<Table> = {
      qrCodeUrl,
      lastGeneratedAt: serverTimestamp(),
      generatedBy: user.uid,
      updatedAt: serverTimestamp()
    };

    await firstValueFrom(this.tableRepo.update(table.id, updateData));
    await this.loadTables();
  }

  selectTable(table: Table | null) {
    this.selectedTable.set(table);
  }
}
