import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Team {
  id: number;
  name: string;
  logo?: string;
  score?: number;
}

interface Competition {
  id: number;
  name: string;
  country: string;
  type: string;
}

interface Match {
  id: number;
  date: string;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
  competition: Competition;
}

interface MatchesResponse {
  matches: Match[];
}

interface CompetitionGroup {
  name: string;
  matches: Match[];
}

interface Country {
  name: string;
  code: string;
  flag: string;
  leagues: string[];
  internationalCompetitions?: string[];
}

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="matches-container">
      <!-- Country Sidebar -->
      <div class="country-sidebar">
        <div class="sidebar-header">
          <h3>Ligen nach Land</h3>
          <div class="search-box">
            <input 
              type="text" 
              [(ngModel)]="countrySearch" 
              (input)="filterCountries()"
              placeholder="Land suchen..."
              class="search-input"
            >
            <i class="fas fa-search search-icon"></i>
          </div>
        </div>
        <div class="country-list">
          <div *ngFor="let country of filteredCountries" 
               class="country-item"
               [class.active]="selectedCountry === country"
               (click)="selectCountry(country)">
            <img [src]="country.flag" [alt]="country.name" class="country-flag">
            <div class="country-info">
              <span class="country-name">{{ country.name }}</span>
              <span class="leagues-count">{{ country.leagues.length }} Ligen</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="header-section">
          <div class="title-section">
            <h1>
              {{ selectedCountry ? selectedCountry.name + ' - Spiele' : 'Alle Spiele' }}
            </h1>
            <div class="stats">
              <span class="stat-item">
                <i class="fas fa-futbol"></i>
                {{ (selectedCountry ? filteredMatches : matches).length }} Spiele
              </span>
              <span class="stat-item">
                <i class="fas fa-trophy"></i>
                {{ groupedMatches.length }} Wettbewerbe
              </span>
            </div>
          </div>

          <!-- Date Selection -->
          <div class="date-controls">
            <div class="date-input-group">
              <input 
                type="date" 
                [(ngModel)]="selectedDate" 
                (change)="onDateSelect($event)"
                class="date-input"
              >
            </div>
            <div class="date-navigation">
              <button class="date-button" 
                      *ngFor="let filter of dateFilters" 
                      [class.active]="currentFilter === filter.value"
                      (click)="loadMatches(filter.value)">
                <i [class]="filter.icon"></i>
                {{ filter.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="quick-nav" *ngIf="groupedMatches.length > 1">
          <div class="nav-scroll">
            <button *ngFor="let group of groupedMatches" 
                    class="nav-button"
                    (click)="scrollToCompetition(group.name)">
              {{ group.name }}
              <span class="count">{{ group.matches.length }}</span>
            </button>
          </div>
        </div>

        <div class="matches-list" *ngIf="groupedMatches.length > 0">
          <div *ngFor="let group of groupedMatches" 
               class="competition-group"
               [id]="'competition-' + group.name">
            <div class="competition-header">
              <div class="competition-info">
                <h2>{{ group.name }}</h2>
                <span class="match-count">{{ group.matches.length }} Spiele</span>
              </div>
              <button class="expand-button" (click)="toggleCompetition(group.name)">
                <i class="fas" [class.fa-chevron-down]="!isCompetitionCollapsed(group.name)" 
                             [class.fa-chevron-right]="isCompetitionCollapsed(group.name)"></i>
              </button>
            </div>
            
            <div class="matches-grid" [class.collapsed]="isCompetitionCollapsed(group.name)">
              <div *ngFor="let match of group.matches" 
                   class="match-card" 
                   [routerLink]="['/match', match.id]"
                   [class.highlight]="match.status === 'Live'">
                <div class="match-header">
                  <div class="match-info">
                    <span class="match-time">
                      <i class="fas fa-calendar-alt"></i>
                      {{ match.date | date:'dd.MM.yyyy' }}
                      <i class="fas fa-clock"></i>
                      {{ match.date | date:'HH:mm' }}
                    </span>
                    <div class="match-status" [class]="match.status.toLowerCase()">
                      <i class="fas" [class.fa-circle]="match.status === 'Live'"
                                   [class.fa-check]="match.status === 'Beendet'"
                                   [class.fa-clock]="match.status === 'Scheduled'"></i>
                      {{ match.status }}
                    </div>
                  </div>
                  <button class="favorite-button" (click)="toggleFavorite($event, match.id)">
                    <i class="fas" [class.fa-star]="isFavorite(match.id)" 
                                 [class.fa-star-o]="!isFavorite(match.id)"></i>
                  </button>
                </div>
                
                <div class="match-teams">
                  <div class="team home">
                    <div class="team-info">
                      <div class="team-logo-container">
                        <img [src]="match.homeTeam.logo" 
                             [alt]="match.homeTeam.name" 
                             class="team-logo" 
                             *ngIf="match.homeTeam.logo"
                             (error)="onImageError($event)">
                        <div class="team-logo-placeholder" *ngIf="!match.homeTeam.logo">
                          {{ getTeamInitials(match.homeTeam.name) }}
                        </div>
                      </div>
                      <span class="team-name" [title]="match.homeTeam.name">
                        {{ match.homeTeam.name }}
                      </span>
                    </div>
                    <span class="score" *ngIf="match.status !== 'Scheduled'">
                      {{ match.homeTeam.score || 0 }}
                    </span>
                    <span class="score scheduled" *ngIf="match.status === 'Scheduled'">-</span>
                  </div>
                  <div class="team away">
                    <div class="team-info">
                      <div class="team-logo-container">
                        <img [src]="match.awayTeam.logo" 
                             [alt]="match.awayTeam.name" 
                             class="team-logo" 
                             *ngIf="match.awayTeam.logo"
                             (error)="onImageError($event)">
                        <div class="team-logo-placeholder" *ngIf="!match.awayTeam.logo">
                          {{ getTeamInitials(match.awayTeam.name) }}
                        </div>
                      </div>
                      <span class="team-name" [title]="match.awayTeam.name">
                        {{ match.awayTeam.name }}
                      </span>
                    </div>
                    <span class="score" *ngIf="match.status !== 'Scheduled'">
                      {{ match.awayTeam.score || 0 }}
                    </span>
                    <span class="score scheduled" *ngIf="match.status === 'Scheduled'">-</span>
                  </div>
                </div>

                <div class="match-footer">
                  <span class="view-details">
                    Details anzeigen
                    <i class="fas fa-arrow-right"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="(selectedCountry ? filteredMatches : matches).length === 0" class="no-matches">
          <i class="fas fa-calendar-times"></i>
          <p>Keine Spiele für dieses Datum gefunden</p>
          <small>Versuche ein anderes Datum oder komme später wieder</small>
          <div class="date-navigation">
            <button class="date-button" 
                    *ngFor="let filter of dateFilters" 
                    [class.active]="currentFilter === filter.value"
                    (click)="loadMatches(filter.value)">
              <i [class]="filter.icon"></i>
              {{ filter.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .matches-container {
      display: flex;
      gap: 24px;
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .country-sidebar {
      width: 200px;
      flex-shrink: 0;
      background: #1a1a1a;
      border-radius: 12px;
      border: 1px solid #242424;
      height: calc(100vh - 40px);
      position: sticky;
      top: 20px;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #242424;
    }

    .search-box {
      position: relative;
      margin-top: 12px;
    }

    .search-input {
      width: 100%;
      padding: 8px 12px 8px 32px;
      background: #242424;
      border: 1px solid #2d2d2d;
      border-radius: 6px;
      color: white;
      font-size: 13px;
      outline: none;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      border-color: #2d7a3d;
      box-shadow: 0 0 0 1px rgba(45, 122, 61, 0.2);
    }

    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
      font-size: 12px;
    }

    .country-item {
      padding: 8px;
      font-size: 13px;
    }

    .country-flag {
      width: 24px;
      height: 18px;
    }

    .country-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .country-name {
      color: #fff;
      font-size: 14px;
    }

    .leagues-count {
      color: #666;
      font-size: 12px;
    }

    .main-content {
      flex: 1;
      min-width: 0;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      background: #1a1a1a;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #242424;
    }

    .title-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    h1 {
      color: #fff;
      font-size: 28px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stats {
      display: flex;
      gap: 20px;
    }

    .stat-item {
      color: #888;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      background: #242424;
      padding: 4px 12px;
      border-radius: 20px;
    }

    .stat-item i {
      color: #2d7a3d;
    }

    .date-controls {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }

    .date-input-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .date-input {
      background: #242424;
      border: 1px solid #2d2d2d;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
    }

    .date-input:focus {
      border-color: #2d7a3d;
      box-shadow: 0 0 0 1px rgba(45, 122, 61, 0.2);
    }

    .date-navigation {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .date-button {
      padding: 8px 16px;
      border: none;
      border-radius: 20px;
      background: #242424;
      color: #888;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .date-button:hover {
      background: #2d7a3d;
      color: white;
    }

    .date-button.active {
      background: #2d7a3d;
      color: white;
    }

    .quick-nav {
      margin-bottom: 24px;
      background: #1a1a1a;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #242424;
    }

    .nav-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
      scrollbar-width: thin;
      scrollbar-color: #2d7a3d #242424;
    }

    .nav-scroll::-webkit-scrollbar {
      height: 6px;
    }

    .nav-scroll::-webkit-scrollbar-track {
      background: #242424;
      border-radius: 3px;
    }

    .nav-scroll::-webkit-scrollbar-thumb {
      background: #2d7a3d;
      border-radius: 3px;
    }

    .nav-button {
      white-space: nowrap;
      padding: 8px 16px;
      border: none;
      border-radius: 20px;
      background: #242424;
      color: #888;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-button:hover {
      background: #2d7a3d;
      color: white;
    }

    .nav-button .count {
      background: #1a1a1a;
      color: #888;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
    }

    .competition-group {
      background: #1a1a1a;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid #242424;
      transition: all 0.3s ease;
    }

    .competition-group:hover {
      border-color: #2d7a3d;
    }

    .competition-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #242424;
    }

    .competition-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .competition-header h2 {
      color: #fff;
      font-size: 18px;
      margin: 0;
    }

    .match-count {
      color: #888;
      font-size: 14px;
      background: #242424;
      padding: 4px 12px;
      border-radius: 20px;
    }

    .expand-button {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .expand-button:hover {
      background: #242424;
      color: white;
    }

    .matches-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      transition: all 0.3s ease;
    }

    .matches-grid.collapsed {
      display: none;
    }

    .match-card {
      background: #242424;
      border-radius: 8px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .match-card:hover {
      transform: translateY(-2px);
      background: #2a2a2a;
      border-color: #2d7a3d;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .match-card.highlight {
      border-color: #e74c3c;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .match-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .match-time {
      color: #888;
      font-size: 14px;
      background: #1a1a1a;
      padding: 6px 12px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .match-time i {
      color: #2d7a3d;
      font-size: 12px;
    }

    .match-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 4px;
      background: #1a1a1a;
      color: #888;
    }

    .match-status.live {
      background: #e74c3c;
      color: white;
    }

    .match-status.live i {
      animation: pulse 2s infinite;
    }

    .match-status.beendet {
      background: #2d7a3d;
      color: white;
    }

    .match-status i {
      font-size: 8px;
    }

    .favorite-button {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .favorite-button:hover {
      background: #1a1a1a;
      color: #f1c40f;
    }

    .favorite-button .fa-star {
      color: #f1c40f;
    }

    .match-teams {
      display: grid;
      gap: 12px;
    }

    .team {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #1a1a1a;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .team:hover {
      background: #242424;
    }

    .team-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .team-logo-container {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #242424;
      border-radius: 6px;
      overflow: hidden;
    }

    .team-logo {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }

    .team-logo-placeholder {
      color: #888;
      font-size: 12px;
      font-weight: bold;
    }

    .team-name {
      color: white;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .score {
      font-weight: bold;
      color: white;
      min-width: 32px;
      text-align: center;
      font-size: 18px;
      background: #242424;
      padding: 4px 12px;
      border-radius: 6px;
    }

    .score.scheduled {
      color: #888;
      background: transparent;
    }

    .match-footer {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #2a2a2a;
      display: flex;
      justify-content: flex-end;
    }

    .view-details {
      color: #2d7a3d;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .no-matches {
      text-align: center;
      padding: 60px;
      background: #1a1a1a;
      border-radius: 12px;
      color: #888;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      border: 1px solid #242424;
    }

    .no-matches i {
      font-size: 32px;
      color: #2d7a3d;
    }

    .no-matches p {
      color: white;
      font-size: 18px;
      margin: 0;
    }

    .no-matches small {
      color: #888;
      font-size: 14px;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    @media (max-width: 1024px) {
      .matches-container {
        flex-direction: column;
      }

      .country-sidebar {
        width: 100%;
        height: auto;
        position: static;
      }

      .country-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }
    }

    @media (max-width: 768px) {
      .date-controls {
        width: 100%;
      }

      .date-input-group {
        width: 100%;
      }

      .date-input {
        width: 100%;
      }

      .date-navigation {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 8px;
      }
    }
  `]
})
export class MatchesComponent implements OnInit {
  matches: Match[] = [];
  currentFilter: string = 'today';
  private collapsedCompetitions: Set<string> = new Set();
  private favorites: Set<number> = new Set();

  dateFilters = [
    { value: 'yesterday', label: 'Gestern', icon: 'fas fa-chevron-left' },
    { value: 'today', label: 'Heute', icon: 'fas fa-calendar-day' },
    { value: 'tomorrow', label: 'Morgen', icon: 'fas fa-chevron-right' }
  ];

  countrySearch: string = '';
  filteredCountries: Country[] = [];

  countries: Country[] = [
    {
      name: 'England',
      code: 'ENG',
      flag: 'https://media-4.api-sports.io/flags/gb.svg',
      leagues: [
        'Premier League',
        'Championship',
        'League One',
        'FA Cup',
        'Carabao Cup',
        'Community Shield'
      ],
      internationalCompetitions: [
        'UEFA Champions League',
        'UEFA Europa League',
        'UEFA Europa Conference League'
      ]
    },
    {
      name: 'Germany',
      code: 'GER',
      flag: 'https://media-4.api-sports.io/flags/de.svg',
      leagues: [
        'Bundesliga',
        '2. Bundesliga',
        'DFB Pokal',
        'Super Cup'
      ],
      internationalCompetitions: [
        'UEFA Champions League',
        'UEFA Europa League',
        'UEFA Europa Conference League'
      ]
    },
    {
      name: 'Spain',
      code: 'ESP',
      flag: 'https://media-4.api-sports.io/flags/es.svg',
      leagues: [
        'La Liga',
        'La Liga 2',
        'Copa del Rey',
        'Super Cup'
      ],
      internationalCompetitions: [
        'UEFA Champions League',
        'UEFA Europa League',
        'UEFA Europa Conference League'
      ]
    },
    {
      name: 'Italy',
      code: 'ITA',
      flag: 'https://media-4.api-sports.io/flags/it.svg',
      leagues: [
        'Serie A',
        'Serie B',
        'Coppa Italia',
        'Super Cup'
      ],
      internationalCompetitions: [
        'UEFA Champions League',
        'UEFA Europa League',
        'UEFA Europa Conference League'
      ]
    },
    {
      name: 'France',
      code: 'FRA',
      flag: 'https://media-4.api-sports.io/flags/fr.svg',
      leagues: [
        'Ligue 1',
        'Ligue 2',
        'Coupe de France',
        'Trophée des Champions'
      ],
      internationalCompetitions: [
        'UEFA Champions League',
        'UEFA Europa League',
        'UEFA Europa Conference League'
      ]
    },
    {
      name: 'Serbia',
      code: 'SRB',
      flag: 'https://media-4.api-sports.io/flags/rs.svg',
      leagues: [
        'Super Liga',
        'Prva Liga',
        'Serbian Cup'
      ],
      internationalCompetitions: [
        'UEFA Champions League',
        'UEFA Europa League',
        'UEFA Europa Conference League'
      ]
    }
  ];

  selectedCountry: Country | null = null;
  filteredMatches: Match[] = [];

  selectedDate: string = new Date().toISOString().split('T')[0];

  constructor(private apiService: ApiService) {}

  get groupedMatches(): CompetitionGroup[] {
    const matchesToGroup = this.selectedCountry ? this.filteredMatches : this.matches;
    const groups = new Map<string, Match[]>();
    
    matchesToGroup.forEach(match => {
      const competitionName = match.competition?.name || 'Andere Wettbewerbe';
      if (!groups.has(competitionName)) {
        groups.set(competitionName, []);
      }
      groups.get(competitionName)?.push(match);
    });

    return Array.from(groups.entries())
      .map(([name, matches]) => ({ name, matches }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  ngOnInit() {
    this.loadMatches('today');
    this.filteredCountries = this.countries;
    
    const savedFavorites = localStorage.getItem('favoriteMatches');
    if (savedFavorites) {
      this.favorites = new Set(JSON.parse(savedFavorites));
    }
  }

  onDateSelect(event: any) {
    const date = event.target.value;
    if (date) {
      this.currentFilter = 'custom';
      this.loadMatches('custom', date);
    }
  }

  loadMatches(filter: string, customDate?: string) {
    this.currentFilter = filter;
    let date = new Date();
    
    switch (filter) {
      case 'yesterday':
        date.setDate(date.getDate() - 1);
        break;
      case 'tomorrow':
        date.setDate(date.getDate() + 1);
        break;
      case 'custom':
        if (customDate) {
          date = new Date(customDate);
        }
        break;
      // 'today' is default, no need to modify date
    }

    const formattedDate = date.toISOString().split('T')[0];
    this.selectedDate = formattedDate;
    
    this.apiService.getFootballGames(formattedDate).subscribe({
      next: (response: MatchesResponse) => {
        this.matches = response.matches;
        if (this.selectedCountry) {
          this.filteredMatches = this.matches.filter(match => 
            this.selectedCountry?.leagues.some(league => 
              match.competition?.name?.includes(league)
            )
          );
        }
      },
      error: (error) => {
        console.error('Error loading matches:', error);
      }
    });
  }

  scrollToCompetition(competitionName: string) {
    const element = document.getElementById('competition-' + competitionName);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleCompetition(competitionName: string) {
    if (this.collapsedCompetitions.has(competitionName)) {
      this.collapsedCompetitions.delete(competitionName);
    } else {
      this.collapsedCompetitions.add(competitionName);
    }
  }

  isCompetitionCollapsed(competitionName: string): boolean {
    return this.collapsedCompetitions.has(competitionName);
  }

  toggleFavorite(event: Event, matchId: number) {
    event.stopPropagation(); // Verhindert Navigation zum Match
    if (this.favorites.has(matchId)) {
      this.favorites.delete(matchId);
    } else {
      this.favorites.add(matchId);
    }
    localStorage.setItem('favoriteMatches', JSON.stringify([...this.favorites]));
  }

  isFavorite(matchId: number): boolean {
    return this.favorites.has(matchId);
  }

  getTeamInitials(teamName: string): string {
    return teamName
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  selectCountry(country: Country) {
    if (this.selectedCountry === country) {
      this.selectedCountry = null;
      this.filteredMatches = this.matches;
    } else {
      this.selectedCountry = country;
      this.filteredMatches = this.matches.filter(match => 
        country.leagues.some(league => 
          match.competition?.name?.includes(league)
        )
      );
    }
  }

  filterCountries() {
    if (!this.countrySearch.trim()) {
      this.filteredCountries = this.countries;
    } else {
      const search = this.countrySearch.toLowerCase().trim();
      this.filteredCountries = this.countries.filter(country =>
        country.name.toLowerCase().includes(search) ||
        country.leagues.some(league => league.toLowerCase().includes(search))
      );
    }
  }

  filterMatchesByCountry(country: Country | null): void {
    this.selectedCountry = country;
    
    if (!country) {
      this.filteredMatches = this.matches;
      return;
    }

    this.filteredMatches = this.matches.filter(match => {
      // Wenn es ein internationaler Wettbewerb ist
      if (country.internationalCompetitions?.includes(match.competition.name)) {
        // Zeige nur wenn ein Team aus dem Land spielt
        return match.homeTeam.name.includes(country.name) || 
               match.awayTeam.name.includes(country.name);
      }

      // Für England und Premier League
      if (country.name === 'England' && match.competition.name === 'Premier League') {
        return match.competition.country === 'England';
      }

      // Für alle anderen Spiele: Zeige nur wenn das Land übereinstimmt
      return match.competition.country === country.name;
    });

    this.updateMatchGroups();
  }

  updateMatchGroups() {
    // Implementation of updateMatchGroups method
  }
} 