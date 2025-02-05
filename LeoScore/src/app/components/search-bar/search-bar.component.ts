import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface SearchResult {
  id: number;
  name: string;
  type: 'player' | 'team';
  logo?: string;
  country?: {
    name: string;
  };
}

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <div class="search-input-wrapper">
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
          (focus)="onFocus()"
          (blur)="onBlur()"
          placeholder="Suche nach Spielern oder Teams..."
          class="search-input"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
      
      <div class="search-results" *ngIf="showResults && searchResults.length > 0">
        <div *ngFor="let result of searchResults" 
             class="search-result-item"
             (click)="selectResult(result)"
             (mousedown)="$event.preventDefault()">
          <div class="result-icon">
            <i class="fas" [class.fa-user]="result.type === 'player'" [class.fa-shield-alt]="result.type === 'team'"></i>
          </div>
          <div class="result-info">
            <div class="result-name">{{ result.name }}</div>
            <div class="result-details" *ngIf="result.country">
              {{ result.country.name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      position: relative;
    }

    .search-input-wrapper {
      position: relative;
      width: 100%;
    }

    .search-input {
      width: 100%;
      padding: 12px 20px 12px 45px;
      background: #1a1a1a;
      border: 1px solid #2d2d2d;
      border-radius: 25px;
      color: white;
      font-size: 16px;
      outline: none;
      transition: all 0.3s ease;
    }

    .search-input:focus {
      border-color: #2d7a3d;
      box-shadow: 0 0 0 2px rgba(45, 122, 61, 0.2);
      background: #242424;
    }

    .search-icon {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
      pointer-events: none;
    }

    .search-results {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: #1a1a1a;
      border: 1px solid #2d2d2d;
      border-radius: 12px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .search-result-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #2d2d2d;
      transition: background-color 0.2s ease;
    }

    .search-result-item:last-child {
      border-bottom: none;
    }

    .search-result-item:hover {
      background: #242424;
    }

    .result-icon {
      width: 36px;
      height: 36px;
      background: #2d7a3d;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      color: white;
    }

    .result-info {
      flex: 1;
    }

    .result-name {
      color: white;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .result-details {
      color: #888;
      font-size: 14px;
    }

    .team-name {
      color: #2d7a3d;
    }
  `]
})
export class SearchBarComponent implements OnInit {
  searchQuery = '';
  searchResults: SearchResult[] = [];
  showResults = false;
  searchTimeout: any;
  private isInputFocused = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('SearchBarComponent initialized');
  }

  onSearch() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      if (this.searchQuery.length >= 2) {
        // Zuerst nach Teams suchen
        this.apiService.searchTeams(this.searchQuery).subscribe(
          (response: any) => {
            const teams = response?.results?.teams?.map((team: any) => ({
              id: team.id,
              name: team.name,
              type: 'team' as const,
              country: team.country
            })) || [];

            // Dann nach Spielern suchen
            this.apiService.searchPlayers(this.searchQuery).subscribe(
              (playerResponse: any) => {
                const players = playerResponse?.results?.players?.map((player: any) => ({
                  id: player.id,
                  name: player.name,
                  type: 'player' as const,
                  country: player.country
                })) || [];

                // Kombiniere die Ergebnisse
                this.searchResults = [...teams, ...players];
                this.showResults = this.isInputFocused && this.searchResults.length > 0;
              }
            );
          }
        );
      } else {
        this.searchResults = [];
        this.showResults = false;
      }
    }, 300);
  }

  onFocus() {
    this.isInputFocused = true;
    if (this.searchResults.length > 0) {
      this.showResults = true;
    }
  }

  onBlur() {
    setTimeout(() => {
      this.isInputFocused = false;
      this.showResults = false;
    }, 200);
  }

  selectResult(result: SearchResult) {
    const route = result.type === 'team' ? '/team' : '/player';
    this.router.navigate([route, result.id])
      .then(() => {
        this.searchQuery = '';
        this.showResults = false;
        this.searchResults = [];
      })
      .catch(error => console.error(`Navigation error:`, error));
  }
} 