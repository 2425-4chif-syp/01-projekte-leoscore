import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesService, Favorite, User } from '../../services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="favorites-container">
      <div class="favorites-header">
        <div class="header-content">
          <h1>
            <i class="fas fa-star"></i>
            Meine Favoriten
          </h1>
          <p class="subtitle">Verfolge deine Lieblingsteams und -spieler</p>
        </div>
      </div>

      <div class="favorites-content" *ngIf="favorites.length > 0">
        <div class="favorites-section teams-section">
          <div class="section-header">
            <h2>
              <i class="fas fa-shield-alt"></i>
              Teams
            </h2>
            <span class="count">{{ teamFavorites.length }}</span>
          </div>
          
          <div class="favorites-grid">
            <div class="favorite-card" *ngFor="let team of teamFavorites" [routerLink]="['/team', team.originalId]">
              <div class="card-header">
                <div class="logo-container">
                  <img [src]="team.logo || DEFAULT_TEAM_LOGO" [alt]="team.name" (error)="handleImageError($event)">
                </div>
                <button class="remove-btn" (click)="removeFavorite($event, team)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="card-content">
                <h3>{{ team.name }}</h3>
              </div>
              <div class="card-footer">
                <span class="view-details">
                  Details anzeigen
                  <i class="fas fa-arrow-right"></i>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="favorites-section players-section">
          <div class="section-header">
            <h2>
              <i class="fas fa-user"></i>
              Spieler
            </h2>
            <span class="count">{{ playerFavorites.length }}</span>
          </div>
          
          <div class="favorites-grid">
            <div class="favorite-card" *ngFor="let player of playerFavorites" [routerLink]="['/player', player.originalId]">
              <div class="card-header">
                <div class="logo-container">
                  <img [src]="player.logo || DEFAULT_PLAYER_IMAGE" [alt]="player.name" (error)="handleImageError($event)">
                </div>
                <button class="remove-btn" (click)="removeFavorite($event, player)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="card-content">
                <h3>{{ player.name }}</h3>
              </div>
              <div class="card-footer">
                <span class="view-details">
                  Details anzeigen
                  <i class="fas fa-arrow-right"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="no-favorites" *ngIf="favorites.length === 0">
        <div class="empty-state">
          <i class="fas fa-star empty-icon"></i>
          <h2>Keine Favoriten vorhanden</h2>
          <p>Füge Teams oder Spieler zu deinen Favoriten hinzu, um sie hier zu sehen.</p>
          <button class="browse-btn" routerLink="/matches">
            <i class="fas fa-search"></i>
            Durchsuche Spiele
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .favorites-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .favorites-header {
      background: #121212;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 24px;
      border: 1px solid #242424;
    }

    .header-content {
      text-align: center;
    }

    h1 {
      color: #fff;
      font-size: 32px;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;

      i {
        color: #f1c40f;
      }
    }

    .subtitle {
      color: #888;
      margin: 8px 0 0 0;
      font-size: 16px;
    }

    .favorites-content {
      display: grid;
      gap: 24px;
    }

    .favorites-section {
      background: #121212;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #242424;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #242424;
    }

    h2 {
      color: #fff;
      font-size: 24px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;

      i {
        color: #2d7a3d;
        font-size: 20px;
      }
    }

    .count {
      background: #242424;
      color: #2d7a3d;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .favorites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }

    .favorite-card {
      background: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
      cursor: pointer;
      border: 1px solid #242424;

      &:hover {
        transform: translateY(-2px);
        border-color: #2d7a3d;
        
        .view-details {
          color: #2d7a3d;
        }
      }
    }

    .card-header {
      position: relative;
      padding: 20px;
      background: #242424;
      display: flex;
      justify-content: center;
    }

    .logo-container {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      overflow: hidden;
      background: #1a1a1a;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #2d7a3d;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .remove-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: #fff;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background: #e74c3c;
        transform: rotate(90deg);
      }

      i {
        font-size: 14px;
      }
    }

    .card-content {
      padding: 20px;
      text-align: center;
    }

    h3 {
      color: #fff;
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .card-footer {
      padding: 12px 20px;
      border-top: 1px solid #242424;
      text-align: center;
    }

    .view-details {
      color: #888;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: color 0.2s ease;

      i {
        font-size: 12px;
      }
    }

    .no-favorites {
      background: #121212;
      border-radius: 12px;
      padding: 60px 20px;
      text-align: center;
      border: 1px solid #242424;
    }

    .empty-state {
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 48px;
      color: #2d2d2d;
      margin-bottom: 24px;
    }

    .empty-state h2 {
      color: #fff;
      font-size: 24px;
      margin-bottom: 12px;
      justify-content: center;
    }

    .empty-state p {
      color: #888;
      margin-bottom: 24px;
    }

    .browse-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: #2d7a3d;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;

      &:hover {
        background: #236830;
        transform: translateY(-1px);
      }

      i {
        font-size: 14px;
      }
    }

    @media (max-width: 768px) {
      .favorites-header {
        padding: 24px;
      }

      h1 {
        font-size: 24px;
      }

      .favorites-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }
    }
  `]
})
export class FavoritesComponent implements OnInit {
  currentUser: User | null = null;
  favorites: Favorite[] = [];
  readonly DEFAULT_PLAYER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxMjEyMTIiLz4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIyMCIgZmlsbD0iIzJkN2EzZCIvPgogIDxwYXRoIGQ9Ik0yNSw4NiBDMjUsNjUgNzUsNjUgNzUsODYiIHN0cm9rZT0iIzJkN2EzZCIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxMCIvPgo8L3N2Zz4=';
  readonly DEFAULT_TEAM_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxMjEyMTIiLz4KICA8cGF0aCBkPSJNNTAsODAgTDIwLDQwIEw4MCw0MCBaIiBmaWxsPSIjMmQ3YTNkIi8+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSIzMCIgcj0iMTUiIGZpbGw9IiMyZDdhM2QiLz4KPC9zdmc+';

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.favoritesService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    this.favoritesService.getFavorites().subscribe(favorites => {
      this.favorites = favorites;
    });
  }

  get teamFavorites(): Favorite[] {
    return this.favorites.filter(fav => fav.type === 'team');
  }

  get playerFavorites(): Favorite[] {
    return this.favorites.filter(fav => fav.type === 'player');
  }

  removeFavorite(event: Event, favorite: Favorite): void {
    event.stopPropagation();
    if (favorite.originalId) {
      this.favoritesService.removeFavorite(favorite.originalId);
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const isTeamLogo = img.closest('.teams-section') !== null;
    img.src = isTeamLogo ? this.DEFAULT_TEAM_LOGO : this.DEFAULT_PLAYER_IMAGE;
  }
} 