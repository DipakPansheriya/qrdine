import { Order, CartItem } from '../models';

export function calculateOrderStatus(items: CartItem[]): Order['status'] {
  if (!items || items.length === 0) return 'Pending';

  const total = items.length;
  
  const deliveredCount = items.filter(i => i.deliveryStatus === 'Delivered').length;
  const readyCount = items.filter(i => i.kitchenStatus === 'Ready').length;
  const preparingCount = items.filter(i => i.kitchenStatus === 'Preparing').length;

  if (deliveredCount === total) {
    return 'Delivered';
  } else if (deliveredCount > 0) {
    return 'Partially Delivered';
  } else if (readyCount === total) {
    return 'Ready';
  } else if (readyCount > 0) {
    // Some are ready, others could be delivered, preparing, or pending
    if (deliveredCount + readyCount === total) return 'Ready'; // If some delivered and rest ready, it's effectively ready/delivered from kitchen perspective, but keep it Ready if not all delivered. Actually, Partially Delivered is already checked above.
    return 'Partially Ready';
  } else if (preparingCount > 0) {
    return 'Preparing';
  } else {
    // If no items are preparing, ready, or delivered, it's Pending
    return 'Pending';
  }
}
