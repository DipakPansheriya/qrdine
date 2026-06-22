import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { AuthFacade } from './auth.facade';
import { OwnerSettingsFacade } from './owner-settings.facade';
import { Notification } from '../models';
import { NotificationSoundService } from '../services/notification-sound.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationFacade {
  private notificationService = inject(NotificationService);
  private authFacade = inject(AuthFacade);
  private settingsFacade = inject(OwnerSettingsFacade);
  private soundService = inject(NotificationSoundService);
  private snackBar = inject(MatSnackBar);

  private notificationsSignal = signal<Notification[]>([]);
  private unreadCountSignal = computed(() => this.notificationsSignal().filter(n => !n.isRead).length);
  
  // Expose signals
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = this.unreadCountSignal;
  readonly hasUnread = computed(() => this.unreadCountSignal() > 0);

  private knownNotificationIds = new Set<string>();

  constructor() {
    effect(() => {
      const user = this.authFacade.currentUser();
      const settings = this.settingsFacade.settings();
      const enableRealtime = settings?.notificationSettings?.enableRealtimeNotifications ?? true;
      
      if (user?.restaurantId && enableRealtime) {
        this.notificationService.getNotifications(user.restaurantId, user.role, user.uid)
          .subscribe(notifs => {
            const relevantNotifs = notifs.filter(n => {
              if (n.targetRole === 'All') return true;
              if (n.targetRole?.toLowerCase() === user.role.toLowerCase()) return true;
              if (user.uid && n.targetUserId === user.uid) return true;
              return false;
            });
            
            this.handleNewNotifications(relevantNotifs);
            this.notificationsSignal.set(relevantNotifs);
          });
      } else {
        this.notificationsSignal.set([]);
        this.knownNotificationIds.clear();
      }
    }, { allowSignalWrites: true });
  }

  private handleNewNotifications(newNotifs: Notification[]) {
    const settings = this.settingsFacade.settings();
    const enableSound = settings?.notificationSettings?.enableSound ?? true;
    const enableToast = settings?.notificationSettings?.enableToastNotifications ?? true;
    
    // Check if there are truly new, unread notifications
    for (const notif of newNotifs) {
      if (!this.knownNotificationIds.has(notif.id)) {
        this.knownNotificationIds.add(notif.id);
        
        // Only trigger sounds/toasts if the notification is actually new (e.g. created in the last 15 seconds)
        // This prevents a bombardment of old notifications on a hard refresh.
        const createdTs = notif.createdAt?.toDate ? notif.createdAt.toDate().getTime() : new Date(notif.createdAt).getTime();
        const isRecent = (Date.now() - createdTs) < 15000;

        if (!notif.isRead && isRecent) {
          if (enableSound) {
            this.soundService.playSoundForNotification(notif.type, notif.priority);
          }
          if (enableToast) {
            this.showToast(notif);
          }
        }
      }
    }
  }

  private showToast(notif: Notification) {
    const iconMap: any = {
      'NEW_ORDER': '🔥',
      'ORDER_READY': '🍽',
      'ITEM_READY': '🍽',
      'CALL_WAITER': '👋',
      'WATER_REQUEST': '💧',
      'CUTLERY_REQUEST': '🍴',
      'BILL_REQUEST': '🧾',
      'PAYMENT_SUCCESS': '✅',
      'CRITICAL': '⚠️'
    };
    
    const icon = notif.priority === 'CRITICAL' ? iconMap['CRITICAL'] : (iconMap[notif.type] || '🔔');
    const toastMessage = `${icon} ${notif.title}\n${notif.message}`;

    this.snackBar.open(toastMessage, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`toast-${notif.priority.toLowerCase()}`, 'notification-toast']
    });
  }

  async sendNotification(data: Partial<Notification>) {
    const user = this.authFacade.currentUser();
    if (!user?.restaurantId) return;
    
    await this.notificationService.createNotification({
      ...data,
      restaurantId: user.restaurantId
    });
  }

  async markAsRead(id: string) {
    await this.notificationService.markAsRead(id);
  }

  async markAllAsRead() {
    const user = this.authFacade.currentUser();
    if (user?.restaurantId) {
      await this.notificationService.markAllAsRead(user.restaurantId, user.role, user.uid);
    }
  }
}
