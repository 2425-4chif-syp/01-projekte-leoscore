import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'https://sportapi7.p.rapidapi.com/api'; // Basis-URL der API
  private headers = new HttpHeaders({
    'x-rapidapi-host': 'sportapi7.p.rapidapi.com',
    'x-rapidapi-key': 'e76819293dmsh626ac597282e32fp1e0d70jsn625395f58aea',
  });

  constructor(private http: HttpClient) {}

  getGames(): Observable<any> {
    return this.http.get(`${this.apiUrl}/games`, { headers: this.headers });
  }
}
