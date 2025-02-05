import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Player {
  player: {
    name: string;
    shortName: string;
    position: string;
  };
  shirtNumber: number;
  position: string;
  substitute: boolean;
  statistics: {
    rating: number;
  };
  teamId: number;
}

interface StatisticItem {
  type: string;
  home: number;
  away: number;
}

interface StatisticsItem {
  name: string;
  key: string;
  home: string;
  away: string;
  homeValue: number;
  awayValue: number;
}

interface StatisticsGroup {
  groupName: string;
  statisticsItems: StatisticsItem[];
}

interface StatisticsPeriod {
  period: string;
  groups: StatisticsGroup[];
}

interface StatisticsResponse {
  statistics: StatisticsPeriod[];
}

@Component({
  selector: 'app-match-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="match-details">
      <!-- Navigation Tabs -->
      <div class="tabs">
        <button [class.active]="activeTab === 'statistics'" (click)="activeTab = 'statistics'">
          <i class="fas fa-chart-bar"></i> Statistiken
        </button>
        <button [class.active]="activeTab === 'lineups'" (click)="activeTab = 'lineups'">
          <i class="fas fa-users"></i> Aufstellungen
        </button>
      </div>

      <!-- Statistics View -->
      <div *ngIf="activeTab === 'statistics'" class="statistics">
        <div class="stat-item" *ngFor="let stat of statisticsList" [class.stat-header]="stat.isHeader">
          <ng-container *ngIf="stat.isHeader">
            <div class="stat-group-header">{{stat.name}}</div>
          </ng-container>
          <ng-container *ngIf="!stat.isHeader">
            <div class="stat-values">
              <div class="home-value">{{stat.homeValue}}</div>
              <div class="stat-name">{{stat.name}}</div>
              <div class="away-value">{{stat.awayValue}}</div>
            </div>
            <div class="stat-bar">
              <div class="home-bar" [style.width.%]="stat.homePercentage"></div>
              <div class="away-bar" [style.width.%]="stat.awayPercentage"></div>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Lineups View -->
      <div *ngIf="activeTab === 'lineups'" class="lineups">
        <!-- Home Team -->
        <div class="team">
          <div class="team-header">
            <h3>{{lineups?.home?.teamName || 'Heimmannschaft'}}</h3>
            <div class="formation">{{getFormation(lineups?.home?.players)}}</div>
          </div>
          
          <div class="pitch">
            <div class="players">
              <div class="player-row" *ngFor="let row of getFormationRows(lineups?.home?.players)">
                <div class="player" *ngFor="let player of row">
                  <div class="player-number">{{player.shirtNumber}}</div>
                  <div class="player-name">{{player.player?.name}}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bench">
            <h4>Auswechselspieler</h4>
            <div class="bench-players">
              <div class="bench-player" *ngFor="let player of getSubstitutes(lineups?.home?.players)">
                <div class="player-number">{{player.shirtNumber}}</div>
                <div class="player-name">{{player.player?.name}}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Away Team -->
        <div class="team">
          <div class="team-header">
            <h3>{{lineups?.away?.teamName || 'Auswärtsmannschaft'}}</h3>
            <div class="formation">{{getFormation(lineups?.away?.players)}}</div>
          </div>
          
          <div class="pitch">
            <div class="players">
              <div class="player-row" *ngFor="let row of getFormationRows(lineups?.away?.players)">
                <div class="player" *ngFor="let player of row">
                  <div class="player-number">{{player.shirtNumber}}</div>
                  <div class="player-name">{{player.player?.name}}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bench">
            <h4>Auswechselspieler</h4>
            <div class="bench-players">
              <div class="bench-player" *ngFor="let player of getSubstitutes(lineups?.away?.players)">
                <div class="player-number">{{player.shirtNumber}}</div>
                <div class="player-name">{{player.player?.name}}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .match-details {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #000000;
    }

    .tabs {
      display: flex;
      gap: 2px;
      margin-bottom: 20px;
      background: #121212;
      padding: 4px;
      border-radius: 8px;
      width: fit-content;
    }

    .tabs button {
      padding: 10px 20px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      transition: all 0.2s;
    }

    .tabs button.active {
      background: #2d7a3d;
      color: white;
    }

    /* Statistics Styles */
    .statistics {
      background: #000000;
      border-radius: 12px;
      padding: 0;
      max-width: 800px;
      margin: 0 auto;
    }

    .stat-item {
      background: #121212;
      padding: 16px 20px;
      border-bottom: 1px solid #1a1a1a;
    }

    .stat-item:last-child {
      border-bottom: none;
    }

    .stat-values {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 15px;
      margin-bottom: 8px;
      color: #2d7a3d;
      font-size: 15px;
    }

    .home-value {
      text-align: right;
      color: #2d7a3d;
      font-weight: 600;
      font-size: 15px;
    }

    .away-value {
      text-align: left;
      color: #2d7a3d;
      font-weight: 600;
      font-size: 15px;
    }

    .stat-name {
      color: #666;
      text-align: center;
      font-weight: 500;
      font-size: 13px;
      text-transform: uppercase;
    }

    .stat-bar {
      height: 4px;
      background: #1a1a1a;
      border-radius: 2px;
      display: flex;
      overflow: hidden;
      margin-top: 8px;
    }

    .home-bar {
      background: #2d7a3d;
      height: 100%;
      transition: width 0.3s ease;
    }

    .away-bar {
      background: #2d7a3d;
      height: 100%;
      transition: width 0.3s ease;
    }

    .stat-header {
      background: #000000 !important;
      padding: 24px 20px 12px 20px !important;
      border-bottom: none !important;
    }

    .stat-group-header {
      color: #2d7a3d;
      font-size: 15px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Lineups Styles */
    .lineups {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2px;
      background: #121212;
      border-radius: 12px;
      padding: 2px;
    }

    .team {
      background: #000000;
      border-radius: 10px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .team-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .formation {
      background: #121212;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 13px;
      color: #2d7a3d;
    }

    .pitch {
      background: #121212;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      aspect-ratio: 68/100;
      border: 1px solid #1a1a1a;
      flex-grow: 1;
      display: flex;
      align-items: center;
    }

    .players {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .player-row {
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 8px 0;
    }

    .player {
      background: #000000;
      padding: 8px 12px;
      border-radius: 6px;
      text-align: center;
      min-width: 100px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .player:hover {
      transform: translateY(-2px);
      background: #121212;
    }

    .player-number {
      font-weight: 600;
      color: #2d7a3d;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .player-name {
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }

    .bench {
      margin-top: 20px;
    }

    .bench h4 {
      color: #666;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 12px;
      text-transform: uppercase;
      padding: 0 4px;
    }

    .bench-players {
      display: grid;
      gap: 2px;
      background: #121212;
      padding: 2px;
      border-radius: 8px;
    }

    .bench-player {
      display: grid;
      grid-template-columns: 30px 1fr;
      padding: 10px 12px;
      background: #000000;
      border-radius: 6px;
      align-items: center;
      transition: transform 0.2s;
    }

    .bench-player:hover {
      transform: translateX(2px);
      background: #121212;
    }

    h3 {
      margin: 0;
      font-size: 15px;
      color: #2d7a3d;
      font-weight: 600;
    }

    h4 {
      margin: 0;
      font-size: 13px;
      color: #666;
    }
  `]
})
export class MatchDetailsComponent implements OnInit {
  activeTab: 'statistics' | 'lineups' = 'statistics';
  statistics: any;
  lineups: any;
  matchId!: number;
  statisticsList: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.matchId = +params['id'];
      this.loadMatchData();
    });
  }

  loadMatchData() {
    // Load statistics
    this.apiService.getMatchStatistics(this.matchId).subscribe({
      next: (response: StatisticsResponse) => {
        console.log('Raw Statistics Response:', JSON.stringify(response, null, 2));
        if (response?.statistics?.[0]?.groups) {
          // Alle Statistik-Gruppen verarbeiten
          this.statisticsList = response.statistics[0].groups.flatMap(group => {
            // Gruppentitel als Trenner hinzufügen
            const groupHeader = [{
              name: group.groupName,
              homeValue: '',
              awayValue: '',
              homePercentage: 0,
              awayPercentage: 0,
              isHeader: true
            }];

            // Statistiken der Gruppe mappen
            const groupStats = group.statisticsItems.map(item => ({
              name: item.name,
              homeValue: item.home,
              awayValue: item.away,
              homePercentage: this.getPercentage(item.homeValue, item.awayValue),
              awayPercentage: this.getPercentage(item.awayValue, item.homeValue),
              isHeader: false
            }));

            return [...groupHeader, ...groupStats];
          });

          console.log('Final statistics list:', this.statisticsList);
        }
      },
      error: (err) => console.error('Statistics Error:', err)
    });

    // Load lineups
    this.apiService.getMatchLineups(this.matchId).subscribe({
      next: (response) => {
        console.log('Raw Lineups:', response);
        if (response) {
          this.lineups = response;
        }
      },
      error: (err) => console.error('Lineups Error:', err)
    });
  }

  getPercentage(value: number, compareValue: number): number {
    if (!value && !compareValue) return 50;
    const total = (value || 0) + (compareValue || 0);
    if (total === 0) return 50;
    return ((value || 0) / total) * 100;
  }

  getFormationRows(players: any[]): any[][] {
    if (!players) return [];
    
    const starters = this.getStartingEleven(players);
    const formation = this.getFormation(players);
    const rows = formation.split('-').map(Number);
    
    rows.unshift(1); // Add goalkeeper
    
    let currentIndex = 0;
    const formationRows = [];
    
    for (const rowSize of rows) {
      const row = starters.slice(currentIndex, currentIndex + rowSize);
      formationRows.push(row);
      currentIndex += rowSize;
    }
    
    return formationRows;
  }

  getStartingEleven(players: any[]): any[] {
    if (!players) return [];
    return players.filter(p => !p.substitute).sort((a, b) => {
      const posOrder = { 'G': 1, 'D': 2, 'M': 3, 'F': 4 };
      return posOrder[a.position as keyof typeof posOrder] - posOrder[b.position as keyof typeof posOrder];
    });
  }

  getSubstitutes(players: any[]): any[] {
    if (!players) return [];
    return players.filter(p => p.substitute);
  }

  getFormation(players: any[]): string {
    if (!players) return '';
    const starters = this.getStartingEleven(players);
    const positions = starters.filter(p => p.position !== 'G').map(p => p.position);
    const defenders = positions.filter(p => p === 'D').length;
    const midfielders = positions.filter(p => p === 'M').length;
    const forwards = positions.filter(p => p === 'F').length;
    return `${defenders}-${midfielders}-${forwards}`;
  }
} 