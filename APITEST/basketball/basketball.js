// Formatiere das Datum für die API
function formatDate(date) {
	return date.toISOString().split('T')[0];
}

// Sammlung aller Spieler
let allPlayers = new Set();

// Lade die Spiele für das ausgewählte Datum
async function loadGames(date) {
	const outputDiv = document.getElementById('output');
	outputDiv.innerHTML = '<div class="loading">Lade Daten...</div>';

	const selectedDate = formatDate(date);
	const url = `https://api-nba-v1.p.rapidapi.com/games?date=${selectedDate}`;
	const options = {
		method: 'GET',
		headers: {
			'X-RapidAPI-Key': 'e76819293dmsh626ac597282e32fp1e0d70jsn625395f58aea',
			'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
		}
	};

	try {
		const response = await fetch(url, options);
		const data = await response.json();

		if (data.response && data.response.length > 0) {
			// Erstelle Content Wrapper
			outputDiv.innerHTML = '<div class="content-wrapper"><div class="games-list-container compact"></div><div id="details"></div></div>';
			const gamesListContainer = outputDiv.querySelector('.games-list-container');

			// Erstelle die Spieleliste
			const gamesList = document.createElement('div');
			gamesList.className = 'game-list';

			data.response.forEach(game => {
				const gameElement = createGameElement(game);
				gamesList.appendChild(gameElement);
			});

			// Füge die Liste zum Container hinzu
			const tournamentDiv = document.createElement('div');
			tournamentDiv.className = 'tournament';
			tournamentDiv.innerHTML = `
				<h3 class="tournament-header">NBA Games - ${selectedDate}</h3>
			`;
			tournamentDiv.appendChild(gamesList);
			gamesListContainer.appendChild(tournamentDiv);

			// Füge Event Listener für Spieldetails hinzu
			addGameClickListeners();
		} else {
			outputDiv.innerHTML = '<div class="no-games">Keine Spiele an diesem Tag</div>';
		}
	} catch (error) {
		outputDiv.innerHTML = `Fehler: ${error.message}`;
	}
}

// Erstelle ein Spielelement
function createGameElement(game) {
	const gameDiv = document.createElement('div');
	gameDiv.className = 'game';
	gameDiv.dataset.gameId = game.id;

	const status = getGameStatus(game.status);
	const homeScore = game.scores.home.points || 0;
	const awayScore = game.scores.visitors.points || 0;

	gameDiv.innerHTML = `
		<div class="match-info">
			<div class="teams">
				<div class="team ${homeScore > awayScore ? 'winner' : ''}">
					${game.teams.home.name}
				</div>
				<div class="vs">vs</div>
				<div class="team ${awayScore > homeScore ? 'winner' : ''}">
					${game.teams.visitors.name}
				</div>
			</div>
			<div class="score-status">
				<div class="score">${homeScore} - ${awayScore}</div>
				<div class="status">${status}</div>
			</div>
		</div>
	`;

	return gameDiv;
}

// Zeige Spieldetails an
async function showDetails(gameId) {
	const detailsDiv = document.getElementById('details');
	detailsDiv.innerHTML = '<div class="loading">Lade Details...</div>';

	try {
		// Hole Spielstatistiken für beide Teams
		const statsUrl = `https://api-nba-v1.p.rapidapi.com/games/statistics?id=${gameId}`;
		// Hole Spielinformationen
		const gameUrl = `https://api-nba-v1.p.rapidapi.com/games?id=${gameId}`;
		// Hole Spieler-Statistiken
		const playersUrl = `https://api-nba-v1.p.rapidapi.com/players/statistics?game=${gameId}`;
		
		const options = {
			method: 'GET',
			headers: {
				'X-RapidAPI-Key': 'e76819293dmsh626ac597282e32fp1e0d70jsn625395f58aea',
				'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
			}
		};

		// Versuche zuerst die wichtigsten Daten zu laden
		const gameResponse = await fetch(gameUrl, options);
		const gameData = await gameResponse.json();

		if (!gameData.response || !gameData.response[0]) {
			throw new Error('Keine Spieldaten verfügbar');
		}

		// Lade dann die zusätzlichen Daten
		const [statsResponse, playersResponse] = await Promise.all([
			fetch(statsUrl, options).catch(() => ({ json: () => ({ response: [] }) })),
			fetch(playersUrl, options).catch(() => ({ json: () => ({ response: [] }) }))
		]);

		const statsData = await statsResponse.json();
		const playersData = await playersResponse.json();

		console.log('Game Data:', gameData);
		console.log('Stats Data:', statsData);
		console.log('Players Data:', playersData);

		const game = gameData.response[0];
		const stats = statsData.response || [];
		const players = playersData.response || [];

		detailsDiv.innerHTML = generateDetailedStats(game, stats, players);
	} catch (error) {
		console.error('Error:', error);
		detailsDiv.innerHTML = `
			<div class="error-message">
				<h3>Fehler beim Laden der Details</h3>
				<p>${error.message}</p>
				<p>Bitte versuchen Sie es später erneut.</p>
			</div>
		`;
	}
}

// Generiere Team-Statistiken
function generateTeamStats(homeStats, awayStats) {
	// Verwende die API-Statistiken direkt
	const home = homeStats.statistics ? homeStats.statistics[0] : {};
	const away = awayStats.statistics ? awayStats.statistics[0] : {};

	// Berechne 2-Punkte Statistiken für Home Team
	const home2pm = (home.fgm || 0) - (home.tpm || 0);
	const home2pa = (home.fga || 0) - (home.tpa || 0);
	const home2pp = home2pa > 0 ? ((home2pm / home2pa) * 100).toFixed(1) : "0";

	// Berechne 2-Punkte Statistiken für Away Team
	const away2pm = (away.fgm || 0) - (away.tpm || 0);
	const away2pa = (away.fga || 0) - (away.tpa || 0);
	const away2pp = away2pa > 0 ? ((away2pm / away2pa) * 100).toFixed(1) : "0";

	// Berechne Effizienz für alle Wurfarten
	const homeFgEff = home.fga > 0 ? ((home.fgm / home.fga) * 100).toFixed(1) : "0";
	const awayFgEff = away.fga > 0 ? ((away.fgm / away.fga) * 100).toFixed(1) : "0";
	
	const home3pEff = home.tpa > 0 ? ((home.tpm / home.tpa) * 100).toFixed(1) : "0";
	const away3pEff = away.tpa > 0 ? ((away.tpm / away.tpa) * 100).toFixed(1) : "0";
	
	const homeFtEff = home.fta > 0 ? ((home.ftm / home.fta) * 100).toFixed(1) : "0";
	const awayFtEff = away.fta > 0 ? ((away.ftm / away.fta) * 100).toFixed(1) : "0";

	return `
		${generateStatRow('Punkte', home.points || 0, away.points || 0)}
		${generateStatRow('Field Goals', 
			`${home.fgm || 0}/${home.fga || 0} (${homeFgEff}%)`,
			`${away.fgm || 0}/${away.fga || 0} (${awayFgEff}%)`)}
		${generateStatRow('2-Punkte',
			`${home2pm}/${home2pa} (${home2pp}%)`,
			`${away2pm}/${away2pa} (${away2pp}%)`)}
		${generateStatRow('3-Punkte',
			`${home.tpm || 0}/${home.tpa || 0} (${home3pEff}%)`,
			`${away.tpm || 0}/${away.tpa || 0} (${away3pEff}%)`)}
		${generateStatRow('Freiwürfe',
			`${home.ftm || 0}/${home.fta || 0} (${homeFtEff}%)`,
			`${away.ftm || 0}/${away.fta || 0} (${awayFtEff}%)`)}
		${generateStatRow('Offensive Rebounds', home.offReb || 0, away.offReb || 0)}
		${generateStatRow('Defensive Rebounds', home.defReb || 0, away.defReb || 0)}
		${generateStatRow('Gesamt Rebounds', home.totReb || 0, away.totReb || 0)}
		${generateStatRow('Assists', home.assists || 0, away.assists || 0)}
		${generateStatRow('Steals', home.steals || 0, away.steals || 0)}
		${generateStatRow('Blocks', home.blocks || 0, away.blocks || 0)}
		${generateStatRow('Turnover', home.turnovers || 0, away.turnovers || 0)}
		${generateStatRow('Persönliche Fouls', home.pFouls || 0, away.pFouls || 0)}
		${generateStatRow('Fastbreak Punkte', home.fastBreakPoints || 0, away.fastBreakPoints || 0)}
		${generateStatRow('Punkte in der Zone', home.pointsInPaint || 0, away.pointsInPaint || 0)}
		${generateStatRow('Größte Führung', home.biggestLead || 0, away.biggestLead || 0)}
		${generateStatRow('Second Chance Punkte', home.secondChancePoints || 0, away.secondChancePoints || 0)}
		${generateStatRow('Punkte nach Turnover', home.pointsOffTurnovers || 0, away.pointsOffTurnovers || 0)}
		${generateStatRow('Längster Lauf', home.longestRun || 0, away.longestRun || 0)}
		${generateStatRow('Plus/Minus', home.plusMinus || "0", away.plusMinus || "0")}
	`;
}

// Generiere detaillierte Statistiken
function generateDetailedStats(game, stats, players) {
	if (!game || !game.teams) {
		throw new Error('Ungültige Spieldaten');
	}

	const homeTeam = game.teams.home;
	const awayTeam = game.teams.visitors;
	const quarter = game.periods?.current;
	const status = getGameStatus(game.status);

	// Finde Team-Statistiken
	const homeStats = stats.find(s => s?.team?.id === homeTeam.id) || {};
	const awayStats = stats.find(s => s?.team?.id === awayTeam.id) || {};

	// Gruppiere Spieler nach Teams, falls verfügbar
	const homePlayers = Array.isArray(players) ? players.filter(p => p?.team?.id === homeTeam.id) : [];
	const awayPlayers = Array.isArray(players) ? players.filter(p => p?.team?.id === awayTeam.id) : [];

	return `
		<div class="detailed-stats">
			<div class="game-header">
				<div class="teams-header">
					<div class="team-header-info">
						<img src="${homeTeam.logo}" alt="${homeTeam.name}" class="team-logo">
						<h3>${homeTeam.name}</h3>
					</div>
					<div class="score-info">
						<div class="game-score">${game.scores?.home?.points || 0} - ${game.scores?.visitors?.points || 0}</div>
						<div class="game-status">
							<span class="status">${status}</span>
							${quarter ? `<span class="quarter">${quarter}. Viertel</span>` : ''}
						</div>
					</div>
					<div class="team-header-info">
						<img src="${awayTeam.logo}" alt="${awayTeam.name}" class="team-logo">
						<h3>${awayTeam.name}</h3>
					</div>
				</div>
			</div>
			
			<div class="stats-section">
				<div class="stats-header">
					<div class="team-name">${homeTeam.name}</div>
					<div class="stat-type">Team Statistiken</div>
					<div class="team-name">${awayTeam.name}</div>
				</div>
				
				<div class="stats-grid">
					${generateTeamStats(homeStats, awayStats)}
				</div>
			</div>

			${players.length > 0 ? `
				<div class="stats-section">
					<div class="stats-header">
						<div class="stat-type">Spieler Statistiken</div>
					</div>
					<div class="players-grid">
						${generateTopPlayers(homePlayers, awayPlayers)}
					</div>
				</div>
			` : ''}
		</div>
	`;
}

// Generiere Top-Spieler
function generateTopPlayers(homePlayers, awayPlayers) {
	// Sortiere Spieler nach Spielzeit
	const sortedHomePlayers = homePlayers.sort((a, b) => (b.min || 0) - (a.min || 0));
	const sortedAwayPlayers = awayPlayers.sort((a, b) => (b.min || 0) - (a.min || 0));

	const generatePlayerCard = (player) => {
		const efficiency = calculateEfficiency(player);
		return `
			<div class="player-stats ${player.min > 0 ? 'played' : 'bench'}">
				<div class="player-header">
					<div class="player-name">${player.player.firstname} ${player.player.lastname}</div>
					<div class="player-number">#${player.player.jerseyNumber || '-'}</div>
				</div>
				<div class="player-main-stats">
					<div class="stat-group">
						<span class="stat-label">MIN</span>
						<span class="stat-value">${player.min || 0}</span>
					</div>
					<div class="stat-group">
						<span class="stat-label">PTS</span>
						<span class="stat-value">${player.points || 0}</span>
					</div>
					<div class="stat-group">
						<span class="stat-label">REB</span>
						<span class="stat-value">${player.totReb || 0}</span>
					</div>
					<div class="stat-group">
						<span class="stat-label">AST</span>
						<span class="stat-value">${player.assists || 0}</span>
					</div>
				</div>
				<div class="player-detailed-stats">
					<div class="stats-row">
						<div class="stat-group">
							<span class="stat-label">FG</span>
							<span class="stat-value">${player.fgm || 0}/${player.fga || 0}</span>
						</div>
						<div class="stat-group">
							<span class="stat-label">3PT</span>
							<span class="stat-value">${player.tpm || 0}/${player.tpa || 0}</span>
						</div>
						<div class="stat-group">
							<span class="stat-label">FT</span>
							<span class="stat-value">${player.ftm || 0}/${player.fta || 0}</span>
						</div>
					</div>
					<div class="stats-row">
						<div class="stat-group">
							<span class="stat-label">OFF REB</span>
							<span class="stat-value">${player.offReb || 0}</span>
						</div>
						<div class="stat-group">
							<span class="stat-label">DEF REB</span>
							<span class="stat-value">${player.defReb || 0}</span>
						</div>
					</div>
					<div class="stats-row">
						<div class="stat-group">
							<span class="stat-label">STL</span>
							<span class="stat-value">${player.steals || 0}</span>
						</div>
						<div class="stat-group">
							<span class="stat-label">BLK</span>
							<span class="stat-value">${player.blocks || 0}</span>
						</div>
						<div class="stat-group">
							<span class="stat-label">TO</span>
							<span class="stat-value">${player.turnovers || 0}</span>
						</div>
					</div>
					<div class="stats-row">
						<div class="stat-group">
							<span class="stat-label">PF</span>
							<span class="stat-value">${player.pFouls || 0}</span>
						</div>
						<div class="stat-group">
							<span class="stat-label">+/-</span>
							<span class="stat-value ${player.plusMinus > 0 ? 'positive' : player.plusMinus < 0 ? 'negative' : ''}">${player.plusMinus || 0}</span>
						</div>
						<div class="stat-group">
							<span class="stat-label">EFF</span>
							<span class="stat-value">${efficiency}</span>
						</div>
					</div>
				</div>
			</div>
		`;
	};

	return `
		<div class="teams-container">
			<div class="team-players">
				<div class="team-header">Home Team</div>
				<div class="players-grid">
					${sortedHomePlayers.map(player => generatePlayerCard(player)).join('')}
				</div>
			</div>
			<div class="team-players">
				<div class="team-header">Away Team</div>
				<div class="players-grid">
					${sortedAwayPlayers.map(player => generatePlayerCard(player)).join('')}
				</div>
			</div>
		</div>
	`;
}

// Hilfsfunktion zur Berechnung der Effizienz
function calculateEfficiency(player) {
	const efficiency = (player.points || 0) + 
					  (player.totReb || 0) + 
					  (player.assists || 0) + 
					  (player.steals || 0) + 
					  (player.blocks || 0) - 
					  ((player.fga || 0) - (player.fgm || 0)) - 
					  ((player.fta || 0) - (player.ftm || 0)) - 
					  (player.turnovers || 0);
	return efficiency;
}

// Generiere eine Statistik-Zeile
function generateStatRow(label, homeValue, awayValue) {
	return `
		<div class="stat-row">
			<div class="stat-value">${homeValue}</div>
			<div class="stat-label">${label}</div>
			<div class="stat-value">${awayValue}</div>
		</div>
	`;
}

// Füge Click-Listener für Spiele hinzu
function addGameClickListeners() {
	const games = document.querySelectorAll('.game');
	games.forEach(game => {
		game.addEventListener('click', (event) => {
			// Entferne vorherige Auswahl
			document.querySelectorAll('.game').forEach(g => g.classList.remove('selected'));
			// Markiere ausgewähltes Spiel
			game.classList.add('selected');
			// Zeige Details
			showDetails(game.dataset.gameId);
		});
	});
}

// Ermittle den Spielstatus
function getGameStatus(status) {
	const statusMap = {
		1: "Noch nicht begonnen",
		2: "Live",
		3: "Beendet"
	};
	return statusMap[status.code] || status.long;
}

// Initialisiere die Seite
document.addEventListener('DOMContentLoaded', () => {
	const today = new Date();
	const datePicker = document.getElementById('datePicker');
	
	// Setze das Datum auf heute
	datePicker.value = formatDate(today);
	
	// Lade die Spiele für heute
	loadGames(today);

	// Event-Listener für Datums-Änderungen
	datePicker.addEventListener('change', (e) => {
		loadGames(new Date(e.target.value));
	});

	// Schnellzugriff-Buttons für Navigation
	document.getElementById('prevDay').addEventListener('click', () => {
		const currentDate = new Date(datePicker.value);
		currentDate.setDate(currentDate.getDate() - 1);
		datePicker.value = formatDate(currentDate);
		loadGames(currentDate);
	});

	document.getElementById('today').addEventListener('click', () => {
		const today = new Date();
		datePicker.value = formatDate(today);
		loadGames(today);
	});

	document.getElementById('nextDay').addEventListener('click', () => {
		const currentDate = new Date(datePicker.value);
		currentDate.setDate(currentDate.getDate() + 1);
		datePicker.value = formatDate(currentDate);
		loadGames(currentDate);
	});
});

// Füge diese Funktionen am Anfang der Datei hinzu
let standingsLoaded = false;

document.getElementById('showStandings').addEventListener('click', async () => {
	const standingsContainer = document.getElementById('standingsContainer');
	const outputDiv = document.getElementById('output');
	
	if (standingsContainer.style.display === 'none') {
		outputDiv.style.display = 'none';
		standingsContainer.style.display = 'block';
		
		if (!standingsLoaded) {
			await loadStandings();
			standingsLoaded = true;
		}
	} else {
		standingsContainer.style.display = 'none';
		outputDiv.style.display = 'block';
	}
});

async function loadStandings() {
	const options = {
		method: 'GET',
		headers: {
			'X-RapidAPI-Key': 'f8757f0b95msh1e5803cf4833457p1c0aa2jsn3cbdf5e4d6ad',
			'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
		}
	};

	try {
		const response = await fetch('https://api-nba-v1.p.rapidapi.com/standings?league=standard&season=2023', options);
		const data = await response.json();

		console.log('Standings Data:', data); // Debug-Ausgabe

		if (data.response && data.response.length > 0) {
			// Teile die Teams nach Conferences auf
			const eastTeams = data.response.filter(team => team.conference && team.conference.name === 'east')
				.sort((a, b) => b.win.percentage - a.win.percentage);
			const westTeams = data.response.filter(team => team.conference && team.conference.name === 'west')
				.sort((a, b) => b.win.percentage - a.win.percentage);

			// Fülle die Tabellen
			fillConferenceTable('eastTable', eastTeams);
			fillConferenceTable('westTable', westTeams);
		} else {
			throw new Error('Keine Standings-Daten verfügbar');
		}
	} catch (error) {
		console.error('Fehler beim Laden der Standings:', error);
		document.querySelector('.standings-container').innerHTML = 
			'<div class="error-message">Fehler beim Laden der Tabellen. Bitte versuchen Sie es später erneut.</div>';
	}
}

function fillConferenceTable(tableId, teams) {
	const tbody = document.querySelector(`#${tableId} tbody`);
	tbody.innerHTML = '';

	teams.forEach((team, index) => {
		const row = document.createElement('tr');
		
		// Bestimme die Playoff/Play-In Position
		if (index < 6) {
			row.classList.add('playoff-spot');
		} else if (index < 10) {
			row.classList.add('playin-spot');
		}

		// Berechne die Streak-Klasse und Text
		const streakClass = parseInt(team.streak) > 0 ? 'streak-positive' : 'streak-negative';
		const streakText = `${parseInt(team.streak) > 0 ? 'W' : 'L'}${Math.abs(parseInt(team.streak))}`;

		// Berechne die letzten 10 Spiele
		const last10Wins = team.win.lastTen || 0;
		const last10 = `${last10Wins}-${10 - last10Wins}`;

		row.innerHTML = `
			<td>${index + 1}</td>
			<td>
				<div class="team-cell">
					<img src="${getTeamLogo(team.team.id)}" alt="${team.team.nickname}" class="team-logo">
					<span class="team-name">${team.team.nickname}</span>
				</div>
			</td>
			<td>${team.win.total}</td>
			<td>${team.loss.total}</td>
			<td>${(team.win.percentage * 100).toFixed(1)}%</td>
			<td>${team.gamesBehind || '-'}</td>
			<td>${last10}</td>
			<td class="${streakClass}">${streakText}</td>
		`;

		tbody.appendChild(row);
	});
}

function getTeamLogo(teamId) {
	// Verwende die offizielle NBA CDN URL für Team-Logos
	return `https://cdn.nba.com/teams/logos/${teamId}/global/L/logo.svg`;
}
