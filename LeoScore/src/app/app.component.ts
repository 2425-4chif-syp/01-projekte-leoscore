import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  games: any[] = []; // Spieleliste
  selectedDate: string = '2025-01-20'; // Standarddatum

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadFootballGames(this.selectedDate);
  }

  loadFootballGames(date: string): void {
    this.apiService.getFootballGames(date).subscribe({
      next: (data) => {
        if (data.events) {
          this.games = data.events.map((event: any) => ({
            homeTeam: event.homeTeam.name,
            awayTeam: event.awayTeam.name,
            homeScore: event.homeScore.display,
            awayScore: event.awayScore.display,
            startTime: this.formatTimestamp(event.startTimestamp),
          }));
        } else {
          this.games = [];
        }
      },
      error: (err) => {
        console.error('Error fetching football games:', err);
      },
    });
  }

  // Wandelt Unix-Timestamp in ein lesbares Datum/Zeit-Format
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp * 1000); // Multipliziere mit 1000, da Unix-Timestamps in Sekunden sind
    return date.toLocaleString(); // Gibt Datum und Zeit zurück
  }
}
