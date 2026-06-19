import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TableFacade } from '../../../../core/facades/table.facade';
import { AuthFacade } from '../../../../core/facades/auth.facade';
import { RestaurantRepository } from '../../../../core/repositories/restaurant.repository';
import { Table } from '../../../../core/models';
import { TableFormComponent } from '../table-form/table-form.component';
import { TableDeleteComponent } from '../table-delete/table-delete.component';
import { QrPreviewDialogComponent } from '../qr-preview-dialog/qr-preview-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './table-list.component.html',
  styleUrls: ['./table-list.component.scss']
})
export class TableListComponent implements OnInit {
  displayedColumns: string[] = ['tableNumber', 'capacity', 'status', 'createdAt', 'actions'];
  tables = this.tableFacade.tables;
  loading = this.tableFacade.loading;

  constructor(
    private tableFacade: TableFacade,
    private authFacade: AuthFacade,
    private restaurantRepo: RestaurantRepository,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.tableFacade.loadTables();
  }

  openEditDialog(table: Table) {
    this.dialog.open(TableFormComponent, {
      width: '500px',
      data: { isEditing: true, table }
    });
  }

  openDeleteDialog(table: Table) {
    this.dialog.open(TableDeleteComponent, {
      width: '400px',
      data: { table }
    });
  }

  async generateQR(table: Table) {
    if (!table.qrCodeUrl) {
      await this.tableFacade.generateTableQr(table);
      // Retrieve the updated table
      const updatedTable = this.tableFacade.tables().find(t => t.id === table.id);
      if (updatedTable) {
        this.viewQR(updatedTable);
      }
    }
  }

  async viewQR(table: Table) {
    let restaurantName = 'Restaurant';
    const user = this.authFacade.currentUser();
    if (user && user.restaurantId) {
      try {
        const rest = await firstValueFrom(this.restaurantRepo.getById(user.restaurantId));
        if (rest) restaurantName = rest.name;
      } catch (e) {
        console.error('Could not fetch restaurant name', e);
      }
    }

    this.dialog.open(QrPreviewDialogComponent, {
      width: '500px',
      data: { table, restaurantName },
      panelClass: 'qr-dialog-panel'
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'OCCUPIED': return 'status-occupied';
      case 'RESERVED': return 'status-reserved';
      case 'CLEANING': return 'status-cleaning';
      case 'DISABLED': return 'status-disabled';
      default: return 'status-disabled';
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return '';
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  }
}
