import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AppConfig } from '../app.config';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private headers = new HttpHeaders({
    'x-rapidapi-host': 'sportapi7.p.rapidapi.com',
    'x-rapidapi-key': AppConfig.apiKey,
  });

  constructor(private http: HttpClient) {}

  // Abrufen der Fußballspiele für ein bestimmtes Datum
  getFootballGames(date: string): Observable<any> {
    const url = `${AppConfig.apiBaseUrl}/v1/sport/football/scheduled-events/${date}`; // Dynamischer Endpunkt
    console.log('Football API Request URL:', url);

    return this.http.get(url, { headers: this.headers }).pipe(
      tap((response) => console.log('Football API Response:', response)),
      catchError((error) => {
        console.error('Error fetching football games:', error);
        throw error;
      })
    );
  }
}
