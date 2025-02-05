import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Favorite {
  id: number;
  name: string;
  type: 'player' | 'team';
  logo?: string;
  originalId: number;
}

export interface User {
  id: number;
  name: string;
  favorites: Favorite[];
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'leoscore_favorites';
  private readonly USER_KEY = 'leoscore_user';
  private readonly DEFAULT_TEAM_LOGO = 'assets/default-team-logo.png';
  private readonly DEFAULT_PLAYER_IMAGE = 'assets/default-player.png';

  private defaultUser: User = {
    id: 1,
    name: 'Test User',
    favorites: []
  };

  private currentUser = new BehaviorSubject<User>(this.defaultUser);
  private favorites = new BehaviorSubject<Favorite[]>([]);

  constructor() {
    this.loadFromStorage();
    this.cleanupInvalidFavorites();
  }

  private cleanupInvalidFavorites(): void {
    const currentFavorites = this.favorites.value;
    const validFavorites = currentFavorites.filter(fav => 
      fav.originalId && !isNaN(fav.originalId) && fav.name && fav.name !== 'undefined'
    );
    
    if (validFavorites.length !== currentFavorites.length) {
      this.favorites.next(validFavorites);
      this.updateUser(validFavorites);
      this.saveToStorage(validFavorites);
    }
  }

  private loadFromStorage(): void {
    // Lade User
    const savedUser = localStorage.getItem(this.USER_KEY);
    if (savedUser) {
      this.currentUser.next(JSON.parse(savedUser));
    }

    // Lade Favoriten
    const savedFavorites = localStorage.getItem(this.STORAGE_KEY);
    if (savedFavorites) {
      const favorites = JSON.parse(savedFavorites);
      this.favorites.next(favorites);
      this.defaultUser.favorites = favorites;
    }
  }

  getCurrentUser(): Observable<User> {
    return this.currentUser.asObservable();
  }

  getFavorites(): Observable<Favorite[]> {
    return this.favorites.asObservable();
  }

  addFavorite(item: Omit<Favorite, 'id'>): void {
    const newFavorite: Favorite = {
      ...item,
      id: Date.now(),
      originalId: item.originalId,
      logo: item.logo || undefined
    };

    const currentFavorites = this.favorites.value;
    
    // Prüfe ob das Item bereits als Favorit existiert
    const exists = currentFavorites.some(fav => 
      fav.type === item.type && 
      fav.originalId === item.originalId
    );

    if (!exists) {
      const updatedFavorites = [...currentFavorites, newFavorite];
      this.favorites.next(updatedFavorites);
      this.updateUser(updatedFavorites);
      this.saveToStorage(updatedFavorites);
    }
  }

  removeFavorite(originalId: number): void {
    const currentFavorites = this.favorites.value;
    const updatedFavorites = currentFavorites.filter(fav => fav.originalId !== originalId);
    
    this.favorites.next(updatedFavorites);
    this.updateUser(updatedFavorites);
    this.saveToStorage(updatedFavorites);
  }

  isFavorite(originalId: number): boolean {
    return this.favorites.value.some(fav => fav.originalId === originalId);
  }

  private updateUser(favorites: Favorite[]): void {
    const updatedUser = {
      ...this.currentUser.value,
      favorites
    };
    this.currentUser.next(updatedUser);
    localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
  }

  private saveToStorage(favorites: Favorite[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
  }
} 