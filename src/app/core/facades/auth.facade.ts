import { Injectable, signal, inject } from '@angular/core';
import { UserRepository } from '../repositories/user.repository';
import { RestaurantRepository } from '../repositories/restaurant.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { SettingsRepository } from '../repositories/settings.repository';
import { User, Restaurant, Subscription, Settings } from '../models';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, authState } from '@angular/fire/auth';
import { serverTimestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private userRepository = inject(UserRepository);
  private restaurantRepository = inject(RestaurantRepository);
  private subscriptionRepository = inject(SubscriptionRepository);
  private settingsRepository = inject(SettingsRepository);
  private auth = inject(Auth);
  private router = inject(Router);
  
  // State
  private currentUserSignal = signal<User | null>(null);
  private loadingSignal = signal<boolean>(false);
  
  // Selectors
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  constructor() {
    this.restoreSession();
  }
  
  // Actions
  login(email: string, password: string): Observable<User | undefined> {
    this.loadingSignal.set(true);
    
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(credential => {
        return this.userRepository.getById(credential.user.uid).pipe(
          switchMap(user => {
            if (!user) {
              throw new Error('USER_DOCUMENT_MISSING');
            }
            return from(this.userRepository.update(user.uid, { lastLoginAt: serverTimestamp() })).pipe(
              switchMap(() => of(user))
            );
          })
        );
      }),
      tap(user => {
        if (user) {
          this.currentUserSignal.set(user);
        }
        this.loadingSignal.set(false);
      }),
      catchError(error => {
        this.loadingSignal.set(false);
        throw error;
      })
    );
  }

  registerOwner(email: string, password: string, restaurantName: string, fullName: string, phone: string): Observable<any> {
    this.loadingSignal.set(true);
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(credential => {
        const uid = credential.user.uid;
        // The UID acts as the restaurant ID for a 1-to-1 owner relation, or we generate one. 
        // We'll use uid as the restaurant ID for simplicity, or generate a random one.
        const restaurantId = 'res_' + uid;
        
        const newRestaurant: Restaurant = {
          restaurantId,
          name: restaurantName,
          slug: restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          email: email,
          phone: phone,
          currency: 'USD',
          timezone: 'UTC',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const newUser: User = {
          uid,
          email,
          name: fullName,
          displayName: fullName,
          mobile: phone,
          phone: phone,
          role: 'Owner',
          status: 'ACTIVE',
          restaurantId
        };

        const newSubscription: Subscription = {
          subscriptionId: 'sub_' + uid,
          restaurantId,
          plan: 'BASIC',
          status: 'ACTIVE',
          startDate: new Date().toISOString()
        };

        const newSettings: Settings = {
          settingsId: 'set_' + uid,
          restaurantId,
          restaurantName: restaurantName,
          businessHours: {
            monday: { open: '09:00', close: '22:00', enabled: true },
            tuesday: { open: '09:00', close: '22:00', enabled: true },
            wednesday: { open: '09:00', close: '22:00', enabled: true },
            thursday: { open: '09:00', close: '22:00', enabled: true },
            friday: { open: '09:00', close: '22:00', enabled: true },
            saturday: { open: '09:00', close: '22:00', enabled: true },
            sunday: { open: '09:00', close: '22:00', enabled: true }
          },
          gstPercentage: 0,
          serviceChargePercentage: 0,
          currency: 'INR',
          primaryColor: '#E53935',
          secondaryColor: '#424242',
          accentColor: '#FFC107',
          buttonStyle: 'rounded',
          cardRadius: 'medium',
          themeMode: 'Default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        return from(Promise.all([
          this.restaurantRepository.create(newRestaurant, newRestaurant.restaurantId).toPromise(),
          this.userRepository.create(newUser, newUser.uid).toPromise(),
          this.subscriptionRepository.create(newSubscription, newSubscription.subscriptionId).toPromise(),
          this.settingsRepository.create(newSettings, newSettings.settingsId).toPromise()
        ]));
      }),
      tap(() => this.loadingSignal.set(false)),
      catchError(error => {
        this.loadingSignal.set(false);
        throw error;
      })
    );
  }

  logout(): void {
    from(signOut(this.auth)).subscribe(() => {
      this.currentUserSignal.set(null);
      this.router.navigate(['/login']);
    });
  }

  private restoreSession(): void {
    authState(this.auth).pipe(
      switchMap(firebaseUser => {
        if (firebaseUser) {
          return this.userRepository.getById(firebaseUser.uid).pipe(
            catchError(err => {
              console.error('Failed to restore user session from Firestore', err);
              // If token exception or permission error, force logout
              this.logout();
              return of(null);
            })
          );
        }
        return of(null);
      })
    ).subscribe({
      next: (user) => {
        this.currentUserSignal.set(user || null);
        
        // If Firebase thinks we are logged in, but we have no Firestore user document, force logout
        if (!user && this.auth.currentUser) {
          this.logout();
        }
      },
      error: (err) => {
        console.error('Auth state subscription error', err);
        this.logout();
      }
    });
  }
}
