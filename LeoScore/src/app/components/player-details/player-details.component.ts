import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FavoritesService } from '../../services/favorites.service';

interface PlayerDetails {
  id: number;
  name: string;
  shortName?: string;
  position?: {
    name: string;
  };
  team?: {
    id: number;
    name: string;
    logo?: string;
    country?: {
      name: string;
      flag?: string;
    };
  };
  country?: {
    name: string;
    flag?: string;
    alpha2?: string;
    alpha3?: string;
  };
  birthDate?: string;
  birthPlace?: string;
  height?: number;
  shirtNumber?: number;
  jerseyNumber?: string;
  preferredFoot?: string;
  age?: number;
  marketValue?: {
    value: number;
    currency: string;
  };
  contractUntil?: string;
  dateOfBirth?: number;
  photo?: string;
}

interface MatchStatistics {
  rating: number;
  [key: string]: any;
}

interface PlayerStatisticsMap {
  [matchId: string]: MatchStatistics;
}

interface PlayerMatch {
  id: number;
  date: string;
  tournament: string;
  season: {
    name: string;
  };
  homeTeam: {
    id: number;
    name: string;
    score: number;
  };
  awayTeam: {
    id: number;
    name: string;
    score: number;
  };
  playerTeamId: number;
  rating: number;
}

interface PlayerMatchesResponse {
  matches: PlayerMatch[];
  hasNextPage: boolean;
}

interface MonthGroup {
  name: string;
  matches: PlayerMatch[];
}

interface SeasonGroup {
  name: string;
  months: MonthGroup[];
}

@Component({
  selector: 'app-player-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="player-details-container" *ngIf="playerDetails">
      <div class="player-header">
        <div class="player-info">
          <img [src]="playerDetails.photo || DEFAULT_PLAYER_IMAGE" [alt]="playerDetails.name" class="player-photo" (error)="handleImageError($event)">
          <div class="player-text">
            <h1>{{ playerDetails.name }}</h1>
            <div class="player-meta">
              <span *ngIf="playerDetails.position">{{ playerDetails.position.name }}</span>
              <span *ngIf="playerDetails.team">{{ playerDetails.team.name }}</span>
            </div>
          </div>
          <button class="favorite-btn" 
                  [class.is-favorite]="isFavorite" 
                  (click)="toggleFavorite()">
            <i class="fas" [class.fa-star]="isFavorite" [class.fa-star-o]="!isFavorite"></i>
            {{ isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen' }}
          </button>
        </div>
      </div>

      <div class="player-details">
        <div class="details-section">
          <h2>Persönliche Informationen</h2>
          <div class="details-grid">
            <div class="detail-item" *ngIf="playerDetails.birthDate">
              <span class="label">Geburtsdatum:</span>
              <span class="value">{{ playerDetails.birthDate | date }}</span>
            </div>
            <div class="detail-item" *ngIf="playerDetails.age">
              <span class="label">Alter:</span>
              <span class="value">{{ playerDetails.age }} Jahre</span>
            </div>
            <div class="detail-item" *ngIf="playerDetails.birthPlace">
              <span class="label">Geburtsort:</span>
              <span class="value">{{ playerDetails.birthPlace }}</span>
            </div>
            <div class="detail-item" *ngIf="playerDetails.height">
              <span class="label">Größe:</span>
              <span class="value">{{ playerDetails.height }} cm</span>
            </div>
            <div class="detail-item" *ngIf="playerDetails.preferredFoot">
              <span class="label">Bevorzugter Fuß:</span>
              <span class="value">{{ playerDetails.preferredFoot }}</span>
            </div>
          </div>
        </div>

        <div class="matches-section">
          <div class="section-header">
            <h2>Spielhistorie</h2>
          </div>

          <div class="date-filters">
            <div class="quick-filters">
              <button class="filter-btn" (click)="loadMatchesWithRange(20)">
                <i class="fas fa-history"></i>
                Letzte 20 Jahre
              </button>
              <button class="filter-btn" (click)="loadMatchesWithRange(10)">
                <i class="fas fa-history"></i>
                Letzte 10 Jahre
              </button>
              <button class="filter-btn" (click)="loadMatchesWithRange(5)">
                <i class="fas fa-history"></i>
                Letzte 5 Jahre
              </button>
              <button class="filter-btn" (click)="loadMatchesWithRange(3)">
                <i class="fas fa-history"></i>
                Letzte 3 Jahre
              </button>
              <button class="filter-btn" (click)="loadMatchesWithRange(1)">
                <i class="fas fa-history"></i>
                Dieses Jahr
              </button>
            </div>
            <div class="custom-date-range">
              <div class="date-input">
                <label>Von:</label>
                <input type="date" [(ngModel)]="fromDate" [max]="toDate">
              </div>
              <div class="date-input">
                <label>Bis:</label>
                <input type="date" [(ngModel)]="toDate" [min]="fromDate" [max]="today">
              </div>
              <button class="load-custom-btn" 
                      (click)="loadMatchesCustomRange()" 
                      [disabled]="isLoadingMatches">
                <i class="fas fa-search"></i>
                Zeitraum laden
              </button>
            </div>
          </div>

          <div class="loading-indicator" *ngIf="isLoadingMatches">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Lade Spiele...</span>
          </div>

          <div class="matches-content" *ngIf="matchesLoaded && matches.length > 0">
            <div *ngFor="let season of groupedMatches">
              <h3>{{ season.name }}</h3>
              <div *ngFor="let month of season.months">
                <h4>{{ month.name }}</h4>
                <div class="match-list">
                  <div class="match-item" *ngFor="let match of month.matches">
                    <div class="match-date">
                      <span class="day">{{ match.date | date:'dd' }}</span>
                      <span class="month">{{ match.date | date:'MMM' }}</span>
                    </div>
                    
                    <div class="match-details">
                      <div class="match-teams">
                        <div class="team-name" [class.highlight]="match.homeTeam.id === match.playerTeamId">
                          {{ match.homeTeam.name }}
                        </div>
                        <div class="match-score" *ngIf="match.homeTeam.score !== undefined">
                          {{ match.homeTeam.score }} - {{ match.awayTeam.score }}
                        </div>
                        <div class="team-name" [class.highlight]="match.awayTeam.id === match.playerTeamId">
                          {{ match.awayTeam.name }}
                        </div>
                      </div>
                      <div class="match-info">
                        <span class="tournament">{{ match.tournament }}</span>
                        <span class="rating" *ngIf="match.rating">
                          Bewertung: {{ match.rating.toFixed(1) }}
                        </span>
                        <span class="time">{{ match.date | date:'HH:mm' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="no-matches" *ngIf="matchesLoaded && matches.length === 0">
            <p>Keine Spiele im ausgewählten Zeitraum gefunden</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .player-details-container {
      padding: 20px;
      color: white;
    }

    .player-header {
      margin-bottom: 30px;
      padding: 20px;
      background: #121212;
      border-radius: 12px;
    }

    .player-info {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .player-text {
      flex: 1;
    }

    .player-text h1 {
      color: #2d7a3d;
      margin: 0 0 10px 0;
      font-size: 24px;
    }

    .player-meta {
      margin-bottom: 20px;
    }

    .player-photo {
      width: 120px;
      height: 120px;
      background: #1a1a1a;
      border-radius: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #2d7a3d;
    }

    .favorite-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      font-weight: 500;
      background: #242424;
      color: #888;

      &:hover {
        transform: translateY(-2px);
        background: #2d2d2d;
        color: #f1c40f;
      }

      &.is-favorite {
        background: #f1c40f;
        color: #2c3e50;

        &:hover {
          background: #f39c12;
        }

        i {
          animation: star-pulse 1.5s infinite;
        }
      }

      i {
        font-size: 16px;
        transition: transform 0.3s ease;
      }
    }

    @keyframes star-pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.2);
      }
      100% {
        transform: scale(1);
      }
    }

    .details-section {
      margin-bottom: 30px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      background: #1a1a1a;
      padding: 20px;
      border-radius: 8px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .label {
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .value {
      color: white;
      font-size: 16px;
    }

    .matches-section {
      background: #121212;
      border-radius: 12px;
      padding: 20px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .date-filters {
      margin: 20px 0;
      background: #1a1a1a;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #242424;
    }

    .quick-filters {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #242424;
    }

    .filter-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #242424;
      border: none;
      border-radius: 6px;
      color: #fff;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;

      &:hover {
        background: #2d7a3d;
        transform: translateY(-1px);
      }

      i {
        font-size: 12px;
      }
    }

    .custom-date-range {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .date-input {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        color: #888;
        font-size: 14px;
      }

      input {
        padding: 8px 12px;
        background: #242424;
        border: 1px solid #2d2d2d;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        outline: none;

        &:focus {
          border-color: #2d7a3d;
        }
      }
    }

    .load-custom-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #2d7a3d;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;

      &:hover:not(:disabled) {
        background: #236830;
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      i {
        font-size: 14px;
      }
    }

    .loading-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 20px;
      color: #888;
    }

    .matches-content {
      margin-bottom: 20px;
    }

    .match-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .match-item {
      display: flex;
      gap: 15px;
      background: #242424;
      border-radius: 6px;
      padding: 12px;
      transition: all 0.2s;
    }

    .match-item:hover {
      background: #2a2a2a;
    }

    .match-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 50px;
      padding: 5px;
      background: #1a1a1a;
      border-radius: 4px;
    }

    .day {
      font-size: 18px;
      font-weight: 500;
      color: white;
    }

    .month {
      font-size: 12px;
      color: #666;
    }

    .match-details {
      flex: 1;
    }

    .match-teams {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 10px;
      align-items: center;
      margin-bottom: 5px;
    }

    .team-name {
      font-size: 15px;
      color: white;
    }

    .team-name.highlight {
      color: #2d7a3d;
      font-weight: 500;
    }

    .match-score {
      font-size: 16px;
      font-weight: 500;
      color: #2d7a3d;
      padding: 0 10px;
    }

    .match-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #666;
    }

    .tournament {
      color: #2d7a3d;
    }

    .rating {
      background: #1a1a1a;
      padding: 2px 8px;
      border-radius: 4px;
      color: #2d7a3d;
    }

    .time {
      color: #666;
      font-size: 12px;
    }

    .no-matches {
      text-align: center;
      padding: 40px;
      background: #1a1a1a;
      border-radius: 8px;
      color: #888;
      margin-top: 20px;
    }

    @media (max-width: 768px) {
      .quick-filters {
        flex-direction: column;
      }

      .custom-date-range {
        flex-direction: column;
      }

      .date-input {
        width: 100%;
      }
    }
  `]
})
export class PlayerDetailsComponent implements OnInit {
  playerDetails: PlayerDetails | null = null;
  playerStats: PlayerStatisticsMap | null = null;
  playerMatches: PlayerMatchesResponse | null = null;
  playerId: number = 0;
  fromDate: string = '';
  toDate: string = '';
  today: string = new Date().toISOString().split('T')[0];
  showDebug: boolean = true;
  matches: PlayerMatch[] = [];
  private currentPlayerId: number = 0;
  private page: number = 0;
  private allMatches: PlayerMatch[] = [];
  isFavorite: boolean = false;
  isLoadingMatches: boolean = false;
  matchesLoaded: boolean = false;
  private currentPage: number = 0;
  readonly DEFAULT_PLAYER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxMjEyMTIiLz4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjM1IiByPSIyMCIgZmlsbD0iIzJkN2EzZCIvPgogIDxwYXRoIGQ9Ik0yNSw4NiBDMjUsNjUgNzUsNjUgNzUsODYiIHN0cm9rZT0iIzJkN2EzZCIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxMCIvPgo8L3N2Zz4=';
  readonly DEFAULT_TEAM_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxMjEyMTIiLz4KICA8cGF0aCBkPSJNNTAsODAgTDIwLDQwIEw4MCw0MCBaIiBmaWxsPSIjMmQ3YTNkIi8+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSIzMCIgcj0iMTUiIGZpbGw9IiMyZDdhM2QiLz4KPC9zdmc+';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private favoritesService: FavoritesService
  ) {
    // Setze Standarddatum auf heute
    this.toDate = new Date().toISOString().split('T')[0];
    // Setze Standarddatum auf vor einem Jahr
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    this.fromDate = lastYear.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const playerId = params['id'];
      if (playerId) {
        this.currentPlayerId = parseInt(playerId);
        this.loadPlayerDetails(this.currentPlayerId);
        this.isFavorite = this.favoritesService.isFavorite(this.currentPlayerId);
      }
    });
  }

  onFromDateChange(date: string) {
    console.log('From date changed:', date);
    this.fromDate = date;
  }

  onToDateChange(date: string) {
    console.log('To date changed:', date);
    this.toDate = date;
  }

  refreshData() {
    console.log('Refreshing data...');
    console.log('From:', this.fromDate);
    console.log('To:', this.toDate);
    console.log('Player ID:', this.playerId);
    this.loadPlayerData();
  }

  loadPlayerData() {
    console.log('Loading player data...');
    
    // Lade Spielerdetails
    this.apiService.getPlayerDetails(this.playerId).subscribe({
      next: (response) => {
        console.log('Player details loaded:', response);
        this.playerDetails = response.player;
      },
      error: (error) => {
        console.error('Error loading player details:', error);
      }
    });

    // Lade Statistiken für den gewählten Zeitraum
    this.apiService.getPlayerStatistics(this.playerId).subscribe({
      next: (response) => {
        console.log('Player statistics loaded:', response);
        this.playerStats = response.statistics;
      },
      error: (error) => {
        console.error('Error loading player statistics:', error);
      }
    });

    // Lade Spiele für den gewählten Zeitraum
    const fromDateStr = this.fromDate.split('T')[0];
    const toDateStr = this.toDate.split('T')[0];
    
    console.log(`Loading matches from ${fromDateStr} to ${toDateStr}`);
    
    this.apiService.getPlayerMatches(this.playerId, fromDateStr, toDateStr).subscribe({
      next: (response) => {
        console.log('Player matches loaded:', response);
        this.playerMatches = response;
      },
      error: (error) => {
        console.error('Error loading player matches:', error);
      }
    });
  }

  getStatistics() {
    if (!this.playerStats) return [];
    
    const stats = [];
    for (const [matchId, matchStats] of Object.entries(this.playerStats)) {
      if (matchStats && matchStats.rating) {
        stats.push({
          label: 'Durchschnittliche Bewertung',
          value: matchStats.rating.toFixed(1)
        });
      }
    }
    return stats;
  }

  setDateRange(range: 'all' | 'last20' | 'last10' | 'last5' | 'thisYear') {
    console.log('Setting date range:', range);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (range) {
      case 'all':
        this.fromDate = '2000-01-01';
        this.toDate = todayStr;
        break;
      case 'last20':
        const twentyYearsAgo = new Date();
        twentyYearsAgo.setFullYear(today.getFullYear() - 20);
        this.fromDate = twentyYearsAgo.toISOString().split('T')[0];
        this.toDate = todayStr;
        break;
      case 'last10':
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(today.getFullYear() - 10);
        this.fromDate = tenYearsAgo.toISOString().split('T')[0];
        this.toDate = todayStr;
        break;
      case 'last5':
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(today.getFullYear() - 5);
        this.fromDate = fiveYearsAgo.toISOString().split('T')[0];
        this.toDate = todayStr;
        break;
      case 'thisYear':
        this.fromDate = `${today.getFullYear()}-01-01`;
        this.toDate = todayStr;
        break;
    }
    
    console.log('New date range:', this.fromDate, 'to', this.toDate);
    if (this.currentPlayerId) {
      this.loadPlayerMatches(this.currentPlayerId);
    }
  }

  onDateChange() {
    console.log('Date changed:', this.fromDate, 'to', this.toDate);
    if (this.currentPlayerId) {
      this.loadPlayerMatches(this.currentPlayerId);
    }
  }

  private loadPlayerDetails(playerId: number) {
    this.apiService.getPlayerDetails(playerId).subscribe({
      next: (response) => {
        this.playerDetails = response;
        
        // Versuche das Spielerbild zu laden
        this.apiService.getPlayerImage(playerId).subscribe({
          next: (imageUrl) => {
            if (this.playerDetails && imageUrl) {
              this.playerDetails.photo = imageUrl;
            } else if (this.playerDetails) {
              // Wenn kein Bild verfügbar ist, verwende das Standard-SVG
              this.playerDetails.photo = this.DEFAULT_PLAYER_IMAGE;
            }
          },
          error: (error) => {
            console.error('Error loading player image:', error);
            // Bei einem Fehler verwenden wir das Standard-SVG
            if (this.playerDetails) {
              this.playerDetails.photo = this.DEFAULT_PLAYER_IMAGE;
            }
          }
        });
      },
      error: (error) => {
        console.error('Error loading player details:', error);
      }
    });
  }

  private loadPlayerMatches(playerId: number) {
    console.log('Loading matches for player:', playerId, 'from:', this.fromDate, 'to:', this.toDate);
    this.page = 0;
    this.allMatches = [];
    this.loadMatchesPage(playerId);
  }

  private loadMatchesPage(playerId: number) {
    this.apiService.getPlayerMatches(playerId, this.fromDate, this.toDate, this.page).subscribe({
      next: (response: PlayerMatchesResponse) => {
        console.log(`Received matches page ${this.page}:`, response);
        if (response && response.matches) {
          this.allMatches = [...this.allMatches, ...response.matches];
          
          // Wenn es weitere Seiten gibt und das älteste Spiel noch im Zeitraum liegt
          const oldestMatchDate = response.matches.length > 0 ? 
            new Date(response.matches[response.matches.length - 1].date) : null;
          const fromDate = new Date(this.fromDate);
          
          if (response.hasNextPage && oldestMatchDate && oldestMatchDate >= fromDate) {
            this.page++;
            console.log(`Loading next page ${this.page}...`);
            this.loadMatchesPage(playerId);
          } else {
            // Alle Spiele geladen
            this.matches = this.allMatches;
            console.log(`Loaded all ${this.matches.length} matches. Oldest match date: ${this.matches.length > 0 ? new Date(this.matches[this.matches.length - 1].date).toLocaleDateString() : 'none'}`);
          }
        } else {
          this.matches = this.allMatches;
          console.log('No matches found');
        }
      },
      error: (error) => {
        console.error('Error loading player matches:', error);
        this.matches = this.allMatches;
      }
    });
  }

  get groupedMatches(): SeasonGroup[] {
    if (!this.matches || this.matches.length === 0) {
      return [];
    }

    return this.matches.reduce((seasons: SeasonGroup[], match) => {
      const date = new Date(match.date);
      const season = this.getSeason(date);
      const monthKey = date.toLocaleString('de-DE', { month: 'long' });
      
      let seasonGroup = seasons.find(s => s.name === season);
      if (!seasonGroup) {
        seasonGroup = { name: season, months: [] };
        seasons.push(seasonGroup);
      }
      
      let monthGroup = seasonGroup.months.find(m => m.name === monthKey);
      if (!monthGroup) {
        monthGroup = { name: monthKey, matches: [] };
        seasonGroup.months.push(monthGroup);
      }
      
      monthGroup.matches.push(match);
      
      // Sortiere Matches nach Datum (neueste zuerst)
      monthGroup.matches.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Sortiere Monate (neueste zuerst)
      seasonGroup.months.sort((a, b) => {
        const monthA = new Date(Date.parse(`${a.name} 1, 2000`)).getMonth();
        const monthB = new Date(Date.parse(`${b.name} 1, 2000`)).getMonth();
        return monthB - monthA;
      });
      
      return seasons;
    }, []).sort((a, b) => b.name.localeCompare(a.name)); // Sortiere Saisons (neueste zuerst)
  }

  private getSeason(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Wenn wir in der zweiten Jahreshälfte sind (ab Juli),
    // dann ist es die Saison "2023/24", sonst "2022/23"
    if (month >= 6) { // Juli oder später
      return `${year}/${(year + 1).toString().slice(2)}`;
    } else {
      return `${year - 1}/${year.toString().slice(2)}`;
    }
  }

  toggleFavorite(): void {
    if (!this.playerDetails) return;

    if (this.isFavorite) {
      this.favoritesService.removeFavorite(this.playerDetails.id);
    } else {
      this.favoritesService.addFavorite({
        name: this.playerDetails.name,
        type: 'player',
        logo: this.playerDetails.photo,
        originalId: this.playerDetails.id
      });
    }
    this.isFavorite = !this.isFavorite;
  }

  loadMatchesWithRange(years: number): void {
    if (!this.playerDetails?.id || this.isLoadingMatches) return;
    
    const today = new Date();
    const startDate = new Date();
    startDate.setFullYear(today.getFullYear() - years);
    
    this.fromDate = startDate.toISOString().split('T')[0];
    this.toDate = today.toISOString().split('T')[0];

    this.loadMatchesCustomRange();
  }

  loadMatchesCustomRange(): void {
    if (!this.playerDetails?.id || this.isLoadingMatches) return;

    this.isLoadingMatches = true;
    this.matchesLoaded = false;
    this.currentPage = 0;
    this.allMatches = [];

    console.log('Loading matches from', this.fromDate, 'to', this.toDate);
    this.loadNextPage();
  }

  private loadNextPage(): void {
    this.apiService.getPlayerMatches(this.playerDetails!.id, this.fromDate, this.toDate, this.currentPage).subscribe({
      next: (response) => {
        console.log('Loaded matches page', this.currentPage, ':', response);
        if (response && Array.isArray(response.matches)) {
          this.allMatches = [...this.allMatches, ...response.matches];

          // Wenn es weitere Seiten gibt und das älteste Spiel noch im Zeitraum liegt
          const oldestMatchDate = response.matches.length > 0 ? 
            new Date(response.matches[response.matches.length - 1].date) : null;
          const fromDate = new Date(this.fromDate);
          
          if (response.hasNextPage && oldestMatchDate && oldestMatchDate >= fromDate) {
            this.currentPage++;
            console.log('Loading next page', this.currentPage);
            this.loadNextPage();
          } else {
            // Alle Spiele geladen
            this.matches = this.allMatches;
            this.matchesLoaded = true;
            this.isLoadingMatches = false;
            console.log(`Loaded all ${this.matches.length} matches`);
          }
        } else {
          this.matches = this.allMatches;
          this.matchesLoaded = true;
          this.isLoadingMatches = false;
        }
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.matches = this.allMatches;
        this.isLoadingMatches = false;
        this.matchesLoaded = true;
      }
    });
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const isTeamLogo = img.classList.contains('team-logo');
    img.src = isTeamLogo ? this.DEFAULT_TEAM_LOGO : this.DEFAULT_PLAYER_IMAGE;
  }
}

export default PlayerDetailsComponent; 