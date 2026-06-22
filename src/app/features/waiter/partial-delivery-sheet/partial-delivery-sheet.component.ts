import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-partial-delivery-sheet',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './partial-delivery-sheet.component.html',
  styleUrls: ['./partial-delivery-sheet.component.scss']
})
export class PartialDeliverySheetComponent {
  selectedIndexes: Set<number> = new Set();

  constructor(
    private bottomSheetRef: MatBottomSheetRef<PartialDeliverySheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { orderId: string, readyItems: any[] }
  ) {
    // Pre-select all by default
    this.data.readyItems.forEach(item => {
      this.selectedIndexes.add(item.originalIndex);
    });
  }

  toggleSelection(index: number, checked: boolean) {
    if (checked) {
      this.selectedIndexes.add(index);
    } else {
      this.selectedIndexes.delete(index);
    }
  }

  confirm() {
    this.bottomSheetRef.dismiss(Array.from(this.selectedIndexes));
  }

  cancel() {
    this.bottomSheetRef.dismiss(null);
  }
}
