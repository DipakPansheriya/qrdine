import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.scss']
})
export class ReceiptComponent implements OnInit {
  @Input() bill: any;
  @Input() settings: any;
  @Input() table: any;
  @Input() session: any;
  @Input() cashierName: string = 'System';
  
  today = new Date();

  ngOnInit() {}
}
