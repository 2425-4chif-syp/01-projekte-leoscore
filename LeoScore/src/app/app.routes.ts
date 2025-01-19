import { Routes } from '@angular/router';
import { LiveGamesComponent } from './components/live-games/live-games.component';
import { StandingsComponent } from './components/standings/standings.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/live-games', pathMatch: 'full' },
  { path: 'live-games', component: LiveGamesComponent },
  { path: 'standings', component: StandingsComponent },
];
