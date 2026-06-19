import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TableFacade } from '../../../../core/facades/table.facade';
import { Table } from '../../../../core/models';

@Component({
  selector: 'app-table-delete',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './table-delete.component.html',
  styleUrls: ['./table-delete.component.scss']
})
export class TableDeleteComponent {
  isDeleting = false;

  constructor(
    private tableFacade: TableFacade,
    public dialogRef: MatDialogRef<TableDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table }
  ) {}

  async onConfirm() {
    if (!this.data.table.id) return;
    
    this.isDeleting = true;
    try {
      await this.tableFacade.deleteTable(this.data.table.id);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error deleting table:', error);
      this.isDeleting = false;
    }
  }
}
