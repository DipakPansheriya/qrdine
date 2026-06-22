import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyService } from '../../../core/services/currency.service';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.scss']
})
export class ReceiptComponent implements OnInit {
  public currency = inject(CurrencyService);
  @Input() bill: any;
  @Input() settings: any;
  @Input() table: any;
  @Input() session: any;
  @Input() cashierName: string = 'System';
  
  today = new Date();

  ngOnInit() {}
}
