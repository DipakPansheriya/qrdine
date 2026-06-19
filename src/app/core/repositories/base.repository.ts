import { inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Firestore, collection, doc, collectionData, docData, addDoc, updateDoc, deleteDoc, setDoc } from '@angular/fire/firestore';

export abstract class BaseRepository<T> {
  protected firestore = inject(Firestore);
  protected abstract collectionKey: string;
  protected abstract idKey: keyof T;

  getAll(): Observable<T[]> {
    const collRef = collection(this.firestore, this.collectionKey);
    return collectionData(collRef, { idField: String(this.idKey) }) as Observable<T[]>;
  }

  getById(id: string): Observable<T | undefined> {
    const docRef = doc(this.firestore, `${this.collectionKey}/${id}`);
    return docData(docRef, { idField: String(this.idKey) }) as Observable<T | undefined>;
  }

  create(item: T, id?: string): Observable<void | any> {
    const collRef = collection(this.firestore, this.collectionKey);
    if (id) {
        const docRef = doc(this.firestore, `${this.collectionKey}/${id}`);
        return from(setDoc(docRef, item as any));
    }
    return from(addDoc(collRef, item as any));
  }

  update(id: string, item: Partial<T>): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionKey}/${id}`);
    return from(updateDoc(docRef, item as any));
  }

  delete(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.collectionKey}/${id}`);
    return from(deleteDoc(docRef));
  }
}
