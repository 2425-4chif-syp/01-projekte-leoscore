import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="nav-links">
        <a routerLink="/matches" routerLinkActive="active">Matches</a>
        <a routerLink="/live-games" routerLinkActive="active">Live Games</a>
        <a routerLink="/standings" routerLinkActive="active">Standings</a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: #181818;
      padding: 16px;
      border-bottom: 1px solid #242424;
    }

    .nav-links {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      gap: 24px;
      justify-content: center;
    }

    a {
      color: #888;
      text-decoration: none;
      font-size: 16px;
      padding: 8px 16px;
      border-radius: 20px;
      transition: all 0.2s ease;
    }

    a:hover {
      color: white;
      background: #242424;
    }

    a.active {
      color: white;
      background: #2d7a3d;
    }
  `]
})
export class NavbarComponent {}

export default NavbarComponent; 
