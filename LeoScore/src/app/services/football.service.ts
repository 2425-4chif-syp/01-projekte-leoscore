import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FootballService {
  private baseUrl = 'YOUR_API_BASE_URL'; // Replace with your actual API base URL

  constructor(private http: HttpClient) {}

  getMatchStatistics(matchId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/statistics/${matchId}`);
  }

  getMatchLineups(matchId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/lineups/${matchId}`);
  }

  getPlayerStatistics(playerId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/player/${playerId}/statistics`);
  }
} 