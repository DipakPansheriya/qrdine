import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, collectionData, doc, updateDoc, deleteDoc, setDoc, getDocs, writeBatch, orderBy, limit } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Notification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private firestore = inject(Firestore);
  private collectionKey = 'notifications';

  getNotifications(restaurantId: string, role: string, userId?: string): Observable<Notification[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    // Role matching: either targetRole is 'All', or targetRole is the specific role.
    // However, Firestore doesn't support an OR query elegantly with 'in'. 
    // Wait, targetRole 'All' is rare. For now we will query where restaurantId == X, and filter the rest in the facade.
    // Actually, querying just by restaurantId is safe enough for a small-medium app, and we do the rest client-side to ensure real-time performance without complex composite indexes.
    const q = query(
      collRef, 
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc'),
      limit(100) // Keep it light
    );
    return collectionData(q, { idField: 'id' }) as Observable<Notification[]>;
  }

  async createNotification(notification: Partial<Notification>): Promise<string> {
    const collRef = collection(this.firestore, this.collectionKey);
    const docRef = doc(collRef);
    const newNotif: Notification = {
      ...notification,
      id: docRef.id,
      isRead: false,
      createdAt: new Date() as any
    } as Notification;
    await setDoc(docRef, newNotif);
    return docRef.id;
  }

  async markAsRead(id: string): Promise<void> {
    const docRef = doc(this.firestore, `${this.collectionKey}/${id}`);
    await updateDoc(docRef, { isRead: true });
  }

  async markAllAsRead(restaurantId: string, role: string, userId?: string): Promise<void> {
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(
      collRef, 
      where('restaurantId', '==', restaurantId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);
    
    // We filter in memory for the role/userId before batch updating
    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data() as Notification;
      let shouldMark = false;
      if (data.targetRole === 'All') shouldMark = true;
      else if (data.targetRole?.toLowerCase() === role?.toLowerCase()) shouldMark = true;
      else if (userId && data.targetUserId === userId) shouldMark = true;

      if (shouldMark) {
        batch.update(docSnap.ref, { isRead: true });
      }
    });

    await batch.commit();
  }

  async deleteOldNotifications(restaurantId: string): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const collRef = collection(this.firestore, this.collectionKey);
    const q = query(
      collRef,
      where('restaurantId', '==', restaurantId),
      where('createdAt', '<', ninetyDaysAgo)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }
}
