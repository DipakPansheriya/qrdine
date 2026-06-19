import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { QRCodeModule } from 'angularx-qrcode';
import { QrUtilityService } from '../../../../core/services/qr-utility.service';
import { Table } from '../../../../core/models';

@Component({
  selector: 'app-qr-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, QRCodeModule],
  templateUrl: './qr-preview-dialog.component.html',
  styleUrls: ['./qr-preview-dialog.component.scss']
})
export class QrPreviewDialogComponent {
  
  constructor(
    public dialogRef: MatDialogRef<QrPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { table: Table; restaurantName: string },
    private qrUtility: QrUtilityService
  ) {}

  downloadPng() {
    this.qrUtility.downloadAsPng('qr-card-content', `table-${this.data.table.tableNumber}-qr.png`);
  }

  downloadPdf() {
    this.qrUtility.downloadAsPdf('qr-card-content', `table-${this.data.table.tableNumber}-qr.pdf`);
  }

  printQr() {
    this.qrUtility.printQr();
  }
}
