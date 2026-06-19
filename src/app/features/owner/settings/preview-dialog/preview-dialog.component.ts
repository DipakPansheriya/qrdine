import { Component, Inject, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CustomerExperienceService } from '../../../../core/services/customer-experience.service';

@Component({
  selector: 'app-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './preview-dialog.component.html',
  styleUrls: ['./preview-dialog.component.scss']
})
export class PreviewDialogComponent {
  private dialogRef = inject(MatDialogRef<PreviewDialogComponent>);
  private cxService = inject(CustomerExperienceService);

  // Current active screen inside the phone simulator
  activeScreen = signal<'menu' | 'cart' | 'tracking' | 'success'>('menu');

  // Input settings passed from the settings dashboard forms
  settings = signal<any>(null);
  cx = signal<any>(null);
  restaurantName = signal<string>('My Restaurant');
  restaurantDesc = signal<string>('Delicious food made with love');

  // Computed style variables based on the active form settings
  styleVariables = computed(() => {
    return this.cxService.getStyleVariables(this.settings(), this.cx());
  });

  // Mock category index for simulator interaction
  selectedCategory = signal<number>(0);
  
  // Track visual active step indexes for tracking screen
  activeTrackStatus = signal<'Pending' | 'Preparing' | 'Ready'>('Preparing');

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    if (data) {
      this.settings.set(data.settings || {});
      this.cx.set(data.cx || {});
      this.restaurantName.set(data.restaurantName || 'My Restaurant');
      this.restaurantDesc.set(data.restaurantDesc || 'Delicious food made with love');
    }
  }

  setScreen(screen: 'menu' | 'cart' | 'tracking' | 'success') {
    this.activeScreen.set(screen);
  }

  close() {
    this.dialogRef.close();
  }

  getActiveStepIndex(status: string): number {
    if (status === 'Pending') return 1;
    if (status === 'Preparing') return 2;
    return 3;
  }

  getStepProgressPercent(status: string): number {
    if (status === 'Pending') return 33;
    if (status === 'Preparing') return 66;
    return 100;
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Pending': return 'Waiting for confirmation...';
      case 'Preparing': return 'Kitchen is preparing your food.';
      case 'Ready': return 'Your order is ready to be served!';
      default: return status;
    }
  }
}
