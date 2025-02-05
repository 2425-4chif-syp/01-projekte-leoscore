import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { retry, map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://api.example.com'; // Replace with your actual API base URL
  private headers = new HttpHeaders();

  constructor(private http: HttpClient) {
    // Initialize headers
    this.headers = this.headers.set('Authorization', 'Bearer ' + localStorage.getItem('token'));
  }

  getTeamDetails(teamId: number): Observable<any> {
    const url = `${this.baseUrl}/team/${teamId}`;
    console.log('Team Details API Request URL:', url);

    return this.http.get(url, {
      headers: this.headers,
      observe: 'response'  // Get full response including headers
    }).pipe(
      retry(1),
      map(response => {
        console.log('Full Team Details Response:', response);
        if (response.status === 404 || !response.body) {
          console.log('No team data available, returning empty object');
          return {};
        }
        return response.body;
      }),
      catchError(error => {
        console.error('Error fetching team details:', error);
        return of({});
      })
    );
  }

  getPlayerDetails(playerId: number): Observable<any> {
    if (!playerId) {
      return of({});
    }

    const url = `${this.baseUrl}/player/${playerId}`;
    console.log('Player Details API Request URL:', url);

    return this.http.get(url, {
      headers: this.headers,
      observe: 'response'
    }).pipe(
      retry(1),
      map(response => {
        console.log('Full Player Details Response:', response);
        if (response.status === 404 || !response.body) {
          console.log('No player data available, returning empty object');
          return {};
        }

        // Transform the response to include all available player details
        const playerData = response.body as any;
        const player = playerData.player || playerData;

        return {
          id: player.id,
          name: player.name,
          shortName: player.shortName,
          position: player.position ? {
            name: typeof player.position === 'string' ? player.position : player.position.name
          } : undefined,
          team: player.team ? {
            id: player.team.id,
            name: player.team.name,
            logo: player.team.logo,
            country: player.team.country ? {
              name: player.team.country.name,
              flag: player.team.country.flag
            } : undefined
          } : undefined,
          country: player.country ? {
            name: player.country.name,
            flag: player.country.flag,
            alpha2: player.country.alpha2,
            alpha3: player.country.alpha3
          } : undefined,
          birthDate: player.dateOfBirthTimestamp ? 
            new Date(player.dateOfBirthTimestamp * 1000).toISOString() : undefined,
          height: player.height,
          shirtNumber: player.shirtNumber || (player.jerseyNumber ? parseInt(player.jerseyNumber) : undefined),
          jerseyNumber: player.jerseyNumber,
          preferredFoot: player.preferredFoot,
          marketValue: player.proposedMarketValue ? {
            value: player.proposedMarketValue,
            currency: player.proposedMarketValueRaw?.currency || 'EUR'
          } : undefined,
          contractUntil: player.contractUntilTimestamp ? 
            new Date(player.contractUntilTimestamp * 1000).toISOString() : undefined,
          age: player.age || (player.dateOfBirthTimestamp ? 
            this.calculateAge(new Date(player.dateOfBirthTimestamp * 1000).toISOString()) : undefined)
        };
      }),
      catchError(error => {
        console.error('Error fetching player details:', error);
        return of({});
      })
    );
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  getTeamMatches(teamId: number, fromDate?: string, toDate?: string, page: number = 0): Observable<any> {
    const url = `${this.baseUrl}/team/${teamId}/events/last/${page + 1}`;
    console.log('Team Events API Request URL:', url);

    // Wenn keine Daten angegeben sind, verwende Standard (20 Jahre)
    if (!fromDate || !toDate) {
      const today = new Date();
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(today.getFullYear() - 20);
      
      fromDate = twentyYearsAgo.toISOString().split('T')[0];
      toDate = today.toISOString().split('T')[0];
    }

    const params = new HttpParams()
      .set('from', fromDate)
      .set('to', toDate)
      .set('page_size', '100'); // Erhöhe die Anzahl der Spiele pro Seite

    console.log('Loading matches with params:', { fromDate, toDate, page });

    return this.http.get<TeamEventsResponse>(url, {
      headers: this.headers,
      params: params
    }).pipe(
      retry(1),
      map(response => {
        console.log('Team Events Response:', response);
        if (!response || !response.events) {
          console.log('No team events available, returning empty array');
          return {
            matches: [],
            hasNextPage: false
          };
        }

        return {
          matches: response.events.map(event => ({
            id: event.id,
            date: event.startTimestamp ? new Date(event.startTimestamp * 1000).toISOString() : null,
            tournament: event.tournament?.name,
            season: event.season?.name,
            round: event.roundInfo?.name,
            status: event.status?.type,
            homeTeam: {
              id: event.homeTeam?.id,
              name: event.homeTeam?.name,
              score: event.homeScore?.current
            },
            awayTeam: {
              id: event.awayTeam?.id,
              name: event.awayTeam?.name,
              score: event.awayScore?.current
            }
          })),
          hasNextPage: response.hasNextPage
        };
      }),
      catchError(error => {
        console.error('Error fetching team matches:', error);
        return of({
          matches: [],
          hasNextPage: false
        });
      })
    );
  }

  getPlayerMatches(playerId: number, fromDate?: string, toDate?: string, page: number = 0): Observable<any> {
    const url = `${this.baseUrl}/player/${playerId}/events/last/${page + 1}`;
    console.log('Player Events API Request URL:', url);

    // Wenn keine Daten angegeben sind, verwende Standard (20 Jahre)
    if (!fromDate || !toDate) {
      const today = new Date();
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(today.getFullYear() - 20);
      
      fromDate = twentyYearsAgo.toISOString().split('T')[0];
      toDate = today.toISOString().split('T')[0];
    }

    const params = new HttpParams()
      .set('from', fromDate)
      .set('to', toDate)
      .set('page_size', '100'); // Erhöhe die Anzahl der Spiele pro Seite

    console.log('Loading player matches with params:', { fromDate, toDate, page });

    return this.http.get<PlayerEventsResponse>(url, {
      headers: this.headers,
      params: params
    }).pipe(
      retry(1),
      map(response => {
        console.log('Player Events Response:', response);
        if (!response || !response.events) {
          console.log('No player events available, returning empty array');
          return {
            matches: [],
            hasNextPage: false
          };
        }

        return {
          matches: response.events.map(event => ({
            id: event.id,
            date: event.startTimestamp ? new Date(event.startTimestamp * 1000).toISOString() : null,
            tournament: event.tournament?.name,
            season: event.season?.name,
            round: event.roundInfo?.name,
            status: event.status?.type,
            homeTeam: {
              id: event.homeTeam?.id,
              name: event.homeTeam?.name,
              score: event.homeScore?.current
            },
            awayTeam: {
              id: event.awayTeam?.id,
              name: event.awayTeam?.name,
              score: event.awayScore?.current
            },
            playerTeamId: response.playedForTeamMap[event.id],
            rating: response.statisticsMap[event.id]?.rating
          })),
          hasNextPage: response.hasNextPage
        };
      }),
      catchError(error => {
        console.error('Error fetching player matches:', error);
        return of({
          matches: [],
          hasNextPage: false
        });
      })
    );
  }

  getMatchStatistics(matchId: number): Observable<any> {
    const url = `${this.baseUrl}/event/${matchId}/statistics`;
    console.log('Statistics API Request URL:', url);

    return this.http.get(url, {
      headers: this.headers
    }).pipe(
      retry(1),
      map(response => {
        console.log('Raw Statistics Response:', JSON.stringify(response, null, 2));
        return response || {};
      }),
      catchError(error => {
        console.error('Error fetching match statistics:', error);
        return of({});
      })
    );
  }

  getMatchLineups(matchId: number): Observable<any> {
    const url = `${this.baseUrl}/event/${matchId}/lineups`;
    console.log('Lineups API Request URL:', url);
    
    return this.http.get(url, {
      headers: this.headers
    }).pipe(
      retry(1),
      map(response => {
        console.log('Raw Lineups Response:', JSON.stringify(response, null, 2));
        return response || {};
      }),
      catchError(error => {
        console.error('Error fetching match lineups:', error);
        return of({});
      })
    );
  }

  getMatchDetails(matchId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/event/${matchId}`, { 
      headers: this.headers 
    }).pipe(
      retry(1),
      map(response => {
        console.log('Match Details Response:', response);
        return response || {};
      }),
      catchError(error => {
        console.error('Error fetching match details:', error);
        return of({});
      })
    );
  }
} 