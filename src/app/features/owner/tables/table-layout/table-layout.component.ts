import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TableListComponent } from '../table-list/table-list.component';
import { TableFormComponent } from '../table-form/table-form.component';

@Component({
  selector: 'app-table-layout',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, TableListComponent],
  templateUrl: './table-layout.component.html',
  styleUrls: ['./table-layout.component.scss']
})
export class TableLayoutComponent {
  constructor(private dialog: MatDialog) {}

  openCreateTableDialog() {
    this.dialog.open(TableFormComponent, {
      width: '500px',
      data: { isEditing: false }
    });
  }
}
