import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CustomerFacade } from '../../../core/facades/customer.facade';
import { ModifierDialogComponent } from '../modifier-dialog/modifier-dialog.component';
import { MenuItem } from '../../../core/models';

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './customer-menu.component.html',
  styleUrls: ['./customer-menu.component.scss']
})
export class CustomerMenuComponent implements OnInit {
  public facade = inject(CustomerFacade);
  private dialog = inject(MatDialog);

  searchQuery = signal<string>('');
  selectedCategoryIndex = signal<number>(0);

  // Computed filtered items based on search and selected category
  filteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const items = this.facade.items();
    const categories = this.facade.categories();
    
    // If searching, show all matching items across categories
    if (query) {
      return items.filter(i => 
        i.name.toLowerCase().includes(query) || 
        (i.description && i.description.toLowerCase().includes(query))
      );
    }
    
    // Otherwise filter by selected category
    if (categories.length > 0) {
      const activeCategoryId = categories[this.selectedCategoryIndex()]?.categoryId;
      return items.filter(i => i.categoryId === activeCategoryId);
    }
    
    return [];
  });

  // For micro-interactions on add buttons
  addedStates = signal<{ [itemId: string]: boolean }>({});

  ngOnInit() {}

  joinExistingSession() {
    this.facade.joinExistingTableSession();
  }

  async requestHelp() {
    await this.facade.requestAssistance();
    alert('Assistance requested. A waiter will be with you shortly.');
  }

  continueOrder() {
    this.facade.showSessionRestorePrompt.set(false);
  }

  onCategoryChange(index: number) {
    this.selectedCategoryIndex.set(index);
    this.searchQuery.set(''); // Clear search on category switch
    
    // Smooth scroll to items grid
    setTimeout(() => {
      document.querySelector('.items-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  getCategoryName(categoryId?: string): string {
    if (!categoryId) return 'Unknown';
    return this.facade.categories().find(c => c.categoryId === categoryId)?.name || 'Unknown';
  }

  get popularItems() {
    // Mock popular items: just take the first 4 items across the menu that are available
    return this.facade.items().slice(0, 4);
  }

  async addToCart(item: MenuItem) {
    // Trigger added animation state
    this.addedStates.update(s => ({ ...s, [item.itemId]: true }));
    setTimeout(() => {
      this.addedStates.update(s => ({ ...s, [item.itemId]: false }));
    }, 1500);

    const dialogRef = this.dialog.open(ModifierDialogComponent, {
      width: '90%',
      maxWidth: '400px',
      panelClass: 'center-dialog-panel',
      data: { item }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.facade.addToCart(result);
      }
    });
  }

  getMyOrdersWidgetBottom(): string {
    const hasCartItems = this.facade.cartItemCount() > 0;
    if (!hasCartItems) {
      return '24px';
    }
    const cartStyle = this.facade.experience()?.cartStyle || 'floating';
    if (cartStyle === 'mini') {
      return '120px';
    } else if (cartStyle === 'sticky') {
      return '100px';
    } else {
      return '124px';
    }
  }

  async onRequestBill() {
    const status = this.facade.session()?.billStatus;
    if (!status) {
      await this.facade.requestBill();
    }
  }

  getBillWidgetBottom(): string {
    const baseStr = this.getMyOrdersWidgetBottom();
    const basePx = parseInt(baseStr, 10);
    const hasOrders = this.facade.activeOrders().length > 0;
    if (hasOrders) {
      return `${basePx + 64}px`;
    }
    return baseStr;
  }
}
