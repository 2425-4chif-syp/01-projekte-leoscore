import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FavoritesService } from '../../services/favorites.service';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

interface TeamDetails {
  id: number;
  name: string;
  logo?: string;
  country?: {
    name: string;
    flag: string;
  };
  team?: {
    name: string;
    shortName: string;
    gender: string;
  };
  sport?: {
    name: string;
  };
}

interface TeamMatch {
  id: number;
  date: string;
  homeTeam: {
    name: string;
    score: number | null;
  };
  awayTeam: {
    name: string;
    score: number | null;
  };
  status: string;
  competition: {
    name: string;
  };
}

interface TeamMatchResponse {
  id: number;
  startTimestamp: number;
  homeTeam: {
    name: string;
  };
  awayTeam: {
    name: string;
  };
  homeScore: {
    current: number;
  };
  awayScore: {
    current: number;
  };
  status: {
    type: string;
  };
  tournament: {
    name: string;
  };
}

interface TeamMatchesResponse {
  events: TeamMatchResponse[];
  hasNextPage: boolean;
}

interface MonthGroup {
  name: string;
  matches: TeamMatch[];
}

interface SeasonGroup {
  name: string;
  months: MonthGroup[];
}

@Component({
  selector: 'app-team-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="team-details-container" *ngIf="teamDetails">
      <!-- Team Header -->
      <div class="team-header">
        <div class="team-main-info">
          <div class="team-logo-section">
            <img [src]="teamDetails.logo || DEFAULT_TEAM_LOGO" 
                 [alt]="getTeamName()" 
                 class="team-logo"
                 (error)="handleImageError($event)">
          </div>
          <div class="team-info-section">
            <h1>{{ getTeamName() }}</h1>
            <div class="team-meta" *ngIf="teamDetails.country">
              <img [src]="teamDetails.country.flag" [alt]="teamDetails.country.name" class="country-flag">
              <span>{{ teamDetails.country.name }}</span>
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

      <!-- Matches Section -->
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

        <div class="matches-content" *ngIf="!isLoadingMatches && groupedMatches.length > 0">
          <div *ngFor="let season of groupedMatches" class="season-group">
            <h3 class="season-header">{{ season.name }}</h3>
            <div *ngFor="let month of season.months" class="month-group">
              <h4 class="month-header">{{ month.name }}</h4>
              <div class="match-list">
                <div *ngFor="let match of month.matches" class="match-card">
                  <div class="match-date">
                    <span class="day">{{ match.date | date:'dd' }}</span>
                    <span class="month">{{ match.date | date:'MMM' }}</span>
                  </div>
                  
                  <div class="match-details">
                    <div class="match-teams">
                      <div class="team home" [class.highlight]="match.homeTeam.name === getTeamName()">
                        <span class="team-name">{{ match.homeTeam.name }}</span>
                        <span class="score">{{ match.homeTeam.score || 0 }}</span>
                      </div>
                      <div class="score-separator">-</div>
                      <div class="team away" [class.highlight]="match.awayTeam.name === getTeamName()">
                        <span class="score">{{ match.awayTeam.score || 0 }}</span>
                        <span class="team-name">{{ match.awayTeam.name }}</span>
                      </div>
                    </div>
                    <div class="match-info">
                      <span class="competition" *ngIf="match.competition">
                        {{ match.competition.name }}
                      </span>
                      <span class="time">{{ match.date | date:'HH:mm' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="no-matches" *ngIf="!isLoadingMatches && groupedMatches.length === 0">
          <p>Keine Spiele im ausgewählten Zeitraum gefunden</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .team-details-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .team-header {
      background: #121212;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #242424;
    }

    .team-main-info {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .team-logo-section {
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
    }

    .team-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 12px;
    }

    .team-info-section {
      flex: 1;
    }

    h1 {
      color: #fff;
      font-size: 32px;
      margin: 0 0 12px 0;
    }

    .team-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #888;
    }

    .country-flag {
      width: 24px;
      height: 16px;
      object-fit: cover;
      border-radius: 2px;
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

    .matches-section {
      background: #121212;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #242424;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    h2 {
      color: #fff;
      font-size: 24px;
      margin: 0;
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
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px;
      color: #888;
      
      i {
        font-size: 24px;
        color: #2d7a3d;
      }
    }

    .season-group {
      margin-bottom: 32px;
    }

    .season-header {
      color: #2d7a3d;
      font-size: 20px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #242424;
    }

    .month-group {
      margin-bottom: 24px;
    }

    .month-header {
      color: #888;
      font-size: 16px;
      margin-bottom: 16px;
    }

    .match-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .match-card {
      display: flex;
      gap: 16px;
      background: #1a1a1a;
      padding: 16px;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        background: #242424;
        transform: translateY(-1px);
      }
    }

    .match-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 48px;
      padding: 8px;
      background: #242424;
      border-radius: 6px;
    }

    .day {
      font-size: 18px;
      font-weight: 500;
      color: #fff;
    }

    .month {
      font-size: 12px;
      color: #888;
    }

    .match-details {
      flex: 1;
    }

    .match-teams {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .team {
      display: flex;
      align-items: center;
      gap: 12px;

      &.home {
        flex: 1;
        justify-content: flex-end;
      }

      &.away {
        flex: 1;
        justify-content: flex-start;
      }

      &.highlight .team-name {
        color: #2d7a3d;
        font-weight: 500;
      }
    }

    .team-name {
      color: #fff;
      font-size: 14px;
    }

    .score {
      font-weight: 500;
      color: #2d7a3d;
      font-size: 16px;
    }

    .score-separator {
      color: #888;
      font-weight: 500;
    }

    .match-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }

    .competition {
      color: #2d7a3d;
    }

    .time {
      color: #888;
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
      .team-main-info {
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
      }

      .team-meta {
        justify-content: center;
      }

      .match-card {
        flex-direction: column;
      }

      .match-date {
        align-self: center;
      }

      .match-teams {
        flex-direction: column;
        gap: 8px;
      }

      .team.home, .team.away {
        justify-content: center;
      }

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
export class TeamDetailsComponent implements OnInit {
  teamDetails: TeamDetails | null = null;
  matches: TeamMatch[] = [];
  isLoadingMatches: boolean = false;
  matchesLoaded: boolean = false;
  isFavorite: boolean = false;
  fromDate: string = '';
  toDate: string = '';
  today: string = new Date().toISOString().split('T')[0];
  
  private currentPage: number = 0;
  private allMatches: TeamMatch[] = [];
  readonly DEFAULT_TEAM_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxMjEyMTIiLz4KICA8cGF0aCBkPSJNNTAsODAgTDIwLDQwIEw4MCw0MCBaIiBmaWxsPSIjMmQ3YTNkIi8+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSIzMCIgcj0iMTUiIGZpbGw9IiMyZDdhM2QiLz4KPC9zdmc+';
  
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private favoritesService: FavoritesService
  ) {
    // Setze Standarddatum auf heute
    this.toDate = this.today;
    // Setze Standarddatum auf vor einem Jahr
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    this.fromDate = lastYear.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const teamId = params['id'];
      if (teamId) {
        this.loadTeamDetails(parseInt(teamId));
      }
    });
  }

  getTeamName(): string {
    if (this.teamDetails?.team?.name) {
      return this.teamDetails.team.name;
    }
    if (this.teamDetails?.name) {
      return this.teamDetails.name;
    }
    return 'Team nicht gefunden';
  }

  loadMatches(): void {
    if (!this.teamDetails?.id || this.isLoadingMatches) return;

    this.isLoadingMatches = true;
    
    // Setze das Datum auf 20 Jahre zurück
    const today = new Date();
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(today.getFullYear() - 20);
    
    const fromDate = twentyYearsAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];

    this.apiService.getTeamMatches(this.teamDetails.id, fromDate, toDate).subscribe({
      next: (response: TeamMatchesResponse) => {
        console.log('Loaded matches:', response);
        if (response && response.events && Array.isArray(response.events)) {
          this.matches = response.events.map((match: TeamMatchResponse) => ({
            id: match.id,
            date: new Date(match.startTimestamp * 1000).toISOString(),
            homeTeam: {
              name: match.homeTeam?.name || 'Unbekannt',
              score: match.homeScore?.current ?? null
            },
            awayTeam: {
              name: match.awayTeam?.name || 'Unbekannt',
              score: match.awayScore?.current ?? null
            },
            status: match.status?.type || 'unknown',
            competition: {
              name: match.tournament?.name || 'Unbekannter Wettbewerb'
            }
          }));

          // Sortiere die Spiele nach Datum (neueste zuerst)
          this.matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Gruppiere die Spiele nach Saison und Monat
          this.groupMatches();
        }
        this.matchesLoaded = true;
        this.isLoadingMatches = false;
      },
      error: (error) => {
        console.error('Error loading matches:', error);
        this.matches = [];
        this.isLoadingMatches = false;
      }
    });
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.DEFAULT_TEAM_LOGO;
  }

  private loadTeamDetails(teamId: number) {
    console.log('Loading team details for ID:', teamId);
    this.apiService.getTeamDetails(teamId).subscribe({
      next: (response) => {
        console.log('Team details response:', response);
        const teamData = response.team || response;
        
        if (!teamData) {
          console.error('No team data available');
          return;
        }
        
        this.teamDetails = {
          id: teamId, // Verwende die ursprüngliche teamId
          name: teamData.name || 'Unbekanntes Team',
          logo: teamData.logo,
          country: teamData.country,
          team: {
            name: teamData.name || 'Unbekanntes Team',
            shortName: teamData.shortName || '',
            gender: teamData.gender || ''
          },
          sport: teamData.sport
        };
        
        // Prüfe den Favoritenstatus
        this.isFavorite = this.favoritesService.isFavorite(teamId);
        
        // Lade das Teambild
        this.apiService.getTeamImage(teamId).subscribe({
          next: (imageUrl) => {
            if (this.teamDetails && imageUrl) {
              this.teamDetails.logo = imageUrl;
            }
          },
          error: () => {
            if (this.teamDetails) {
              this.teamDetails.logo = this.DEFAULT_TEAM_LOGO;
            }
          },
          complete: () => {
            // Lade die Spiele erst nachdem alle Details geladen sind
            console.log('Team details loaded successfully, loading matches...');
            this.loadMatchesWithRange(1);
          }
        });
      },
      error: (error) => {
        console.error('Error loading team details:', error);
      }
    });
  }

  toggleFavorite(): void {
    if (!this.teamDetails) return;

    if (this.isFavorite) {
      this.favoritesService.removeFavorite(this.teamDetails.id);
      this.isFavorite = false;
    } else {
      this.favoritesService.addFavorite({
        originalId: this.teamDetails.id,
        type: 'team',
        name: this.getTeamName(),
        logo: this.teamDetails.logo || this.DEFAULT_TEAM_LOGO
      });
      this.isFavorite = true;
    }
  }

  loadMatchesWithRange(years: number): void {
    if (!this.teamDetails?.id) {
      console.log('No team ID available');
      return;
    }

    this.isLoadingMatches = true;
    this.matches = [];
    this._groupedMatches = [];
    this.currentPage = 0;
    
    const today = new Date();
    const startDate = new Date();
    startDate.setFullYear(today.getFullYear() - years);
    startDate.setMonth(today.getMonth());
    startDate.setDate(today.getDate());
    startDate.setHours(0, 0, 0, 0);
    
    this.fromDate = startDate.toISOString().split('T')[0];
    this.toDate = today.toISOString().split('T')[0];
    
    console.log(`Loading matches for the last ${years} years:`, {
      teamId: this.teamDetails.id,
      fromDate: this.fromDate,
      toDate: this.toDate
    });
    
    this.loadMatchesPage(this.teamDetails.id);
  }

  private loadMatchesPage(teamId: number): void {
    if (!teamId) {
      console.error('No team ID provided for loading matches');
      return;
    }

    console.log('Loading matches page', this.currentPage);
    this.isLoadingMatches = true;

    this.apiService.getTeamMatches(teamId, this.fromDate, this.toDate, this.currentPage)
      .pipe(
        catchError(error => {
          console.error('Error loading matches:', error);
          return of({ events: [], hasNextPage: false });
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Loading page', this.currentPage, 'received matches:', response);
          
          if (response && Array.isArray(response.events)) {
            // Transformiere die Events in das TeamMatch Format
            const transformedMatches = response.events.map((event: TeamMatchResponse) => ({
              id: event.id,
              date: event.startTimestamp ? new Date(event.startTimestamp * 1000).toISOString() : '',
              homeTeam: {
                name: event.homeTeam?.name || 'Unknown Team',
                score: event.homeScore?.current ?? null
              },
              awayTeam: {
                name: event.awayTeam?.name || 'Unknown Team',
                score: event.awayScore?.current ?? null
              },
              status: event.status?.type || 'unknown',
              competition: {
                name: event.tournament?.name || 'Unknown Competition'
              }
            }));

            // Füge die transformierten Spiele zum Array hinzu
            this.allMatches = [...this.allMatches, ...transformedMatches];

            // Wenn es weitere Seiten gibt, lade diese
            if (response.hasNextPage) {
              this.currentPage++;
              this.loadMatchesPage(teamId);
            } else {
              // Wenn alle Seiten geladen sind, gruppiere die Spiele
              this.matches = this.allMatches;
              this.groupMatches();
              this.isLoadingMatches = false;
              this.matchesLoaded = true;
            }
          } else {
            console.error('Invalid matches response format:', response);
            this.isLoadingMatches = false;
            this.matchesLoaded = true;
          }
        },
        error: (error) => {
          console.error('Error loading matches:', error);
          this.isLoadingMatches = false;
          this.matchesLoaded = true;
        }
      });
  }

  loadMatchesCustomRange(): void {
    if (!this.teamDetails?.id) {
      console.log('No team ID available');
      return;
    }

    if (this.isLoadingMatches) {
      console.log('Already loading matches');
      return;
    }

    this.isLoadingMatches = true;
    this.matches = [];
    this.currentPage = 0;

    console.log('Loading matches with custom range for team', this.teamDetails.id, 'from', this.fromDate, 'to', this.toDate);
    
    this.apiService.getTeamMatches(this.teamDetails.id, this.fromDate, this.toDate, this.currentPage)
      .pipe(
        catchError(error => {
          console.error('Error loading matches:', error);
          return of({ events: [], hasNextPage: false });
        })
      )
      .subscribe({
        next: (response: TeamMatchesResponse) => {
          console.log('Received matches response:', response);
          if (response && response.events) {
            this.matches = response.events.map((match: TeamMatchResponse) => ({
              id: match.id,
              date: new Date(match.startTimestamp * 1000).toISOString(),
              homeTeam: {
                name: match.homeTeam?.name || 'Unbekannt',
                score: match.homeScore?.current ?? null
              },
              awayTeam: {
                name: match.awayTeam?.name || 'Unbekannt',
                score: match.awayScore?.current ?? null
              },
              status: match.status?.type || 'unknown',
              competition: {
                name: match.tournament?.name || 'Unbekannter Wettbewerb'
              }
            }));

            // Sortiere die Spiele nach Datum (neueste zuerst)
            this.matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Gruppiere die Spiele nach Saison und Monat
            this.groupMatches();
            
            console.log('Successfully loaded and processed matches:', this.matches.length);
          }
        },
        error: (error) => {
          console.error('Error in match subscription:', error);
          this.matches = [];
        },
        complete: () => {
          this.matchesLoaded = true;
          this.isLoadingMatches = false;
          console.log('Match loading completed');
        }
      });
  }

  private groupMatches(): void {
    if (!this.matches || this.matches.length === 0) {
      this._groupedMatches = [];
      return;
    }

    console.log('Grouping matches:', this.matches.length);
    
    // Gruppiere die Spiele nach Saison und Monat
    const groupedMatches: { [key: string]: { [key: string]: TeamMatch[] } } = {};
    
    this.matches.forEach(match => {
      const date = new Date(match.date);
      const year = date.getFullYear();
      const month = date.toLocaleString('de-DE', { month: 'long' });
      
      // Bestimme die Saison basierend auf dem Monat
      let season: string;
      if (date.getMonth() >= 6) { // Ab Juli neue Saison
        season = `${year}/${(year + 1).toString().slice(2)}`;
      } else {
        season = `${year - 1}/${year.toString().slice(2)}`;
      }
      
      if (!groupedMatches[season]) {
        groupedMatches[season] = {};
      }
      if (!groupedMatches[season][month]) {
        groupedMatches[season][month] = [];
      }
      
      groupedMatches[season][month].push(match);
    });

    // Konvertiere das gruppierte Objekt in ein Array und sortiere es
    this._groupedMatches = Object.entries(groupedMatches)
      .sort((a, b) => {
        // Extrahiere das erste Jahr aus der Saison (z.B. "2023" aus "2023/24")
        const yearA = parseInt(a[0].split('/')[0]);
        const yearB = parseInt(b[0].split('/')[0]);
        return yearB - yearA;
      })
      .map(([seasonName, months]) => ({
        name: seasonName,
        months: Object.entries(months)
          .map(([monthName, matches]) => ({
            name: monthName,
            matches: matches.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )
          }))
          .sort((a, b) => {
            // Sortiere Monate nach dem Datum des ersten Spiels in jedem Monat
            const dateA = new Date(a.matches[0].date);
            const dateB = new Date(b.matches[0].date);
            return dateB.getTime() - dateA.getTime();
          })
      }));

    console.log('Grouped matches result:', {
      totalMatches: this.matches.length,
      seasons: this._groupedMatches.length,
      groupedMatches: this._groupedMatches
    });
  }

  get groupedMatches(): SeasonGroup[] {
    return this._groupedMatches;
  }

  set groupedMatches(value: SeasonGroup[]) {
    this._groupedMatches = value;
  }

  private _groupedMatches: SeasonGroup[] = [];
} 