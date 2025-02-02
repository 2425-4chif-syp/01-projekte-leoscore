// Füge diese Funktion am Anfang hinzu
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Füge diese Funktion am Anfang der Datei hinzu
let allPlayers = new Set();

function initializeSearch() {
    const searchInput = document.getElementById('playerSearch');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const searchTerm = e.target.value.toLowerCase();

        searchTimeout = setTimeout(() => {
            if (searchTerm.length >= 2) {
                const filteredPlayers = Array.from(allPlayers)
                    .filter(player => player.toLowerCase().includes(searchTerm))
                    .slice(0, 5);

                if (filteredPlayers.length > 0) {
                    searchResults.innerHTML = filteredPlayers
                        .map(player => `
                            <div class="search-result-item">
                                <img src="${getPlayerImage(player)}" 
                                     onerror="this.src='https://via.placeholder.com/30?text=?'" 
                                     alt="${player}">
                                <span>${player}</span>
                            </div>
                        `)
                        .join('');
                    searchResults.classList.add('active');
                } else {
                    searchResults.innerHTML = '<div class="search-result-item">Keine Spieler gefunden</div>';
                    searchResults.classList.add('active');
                }
            } else {
                searchResults.classList.remove('active');
            }
        }, 300);
    });

    // Klick-Handler für Suchergebnisse
    searchResults.addEventListener('click', (e) => {
        const resultItem = e.target.closest('.search-result-item');
        if (resultItem) {
            const playerName = resultItem.querySelector('span').textContent;
            searchInput.value = playerName;
            searchResults.classList.remove('active');
            filterGamesByPlayer(playerName);
        }
    });

    // Schließe Suchergebnisse beim Klicken außerhalb
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.remove('active');
        }
    });
}

function filterGamesByPlayer(playerName) {
    const games = document.querySelectorAll('.game');
    games.forEach(game => {
        const gameContent = game.textContent.toLowerCase();
        const shouldShow = gameContent.includes(playerName.toLowerCase());
        game.style.display = shouldShow ? '' : 'none';
    });
}

function loadGames(date) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '<div class="loading">Lade Daten...</div>';

    const selectedDate = formatDate(date);
    const url = `https://sportapi7.p.rapidapi.com/api/v1/sport/darts/scheduled-events/${selectedDate}`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': 'e76819293dmsh626ac597282e32fp1e0d70jsn625395f58aea',
            'x-rapidapi-host': 'sportapi7.p.rapidapi.com'
        }
    };

    fetch(url, options)
        .then(response => response.json())
        .then(data => {
            if (data.events && data.events.length > 0) {
                // Sammle alle Spielernamen
                data.events.forEach(event => {
                    if (event.homeTeam?.name) allPlayers.add(event.homeTeam.name);
                    if (event.awayTeam?.name) allPlayers.add(event.awayTeam.name);
                });

                const tournaments = {};

                // Gruppiere Spiele nach Turnier
                data.events.forEach(event => {
                    const tournamentName = event.tournament?.name || 'Unbekannt';
                    if (!tournaments[tournamentName]) {
                        tournaments[tournamentName] = [];
                    }
                    tournaments[tournamentName].push(event);
                });

                // Erstelle Content Wrapper
                outputDiv.innerHTML = '<div class="content-wrapper"><div class="games-list-container compact"></div><div id="details"></div></div>';
                const gamesListContainer = outputDiv.querySelector('.games-list-container');
                const detailsDiv = outputDiv.querySelector('#details');

                // Erstelle Dropdowns für Turniere
                Object.keys(tournaments).forEach(tournamentName => {
                    const tournamentDiv = document.createElement('div');
                    tournamentDiv.classList.add('tournament');

                    const header = document.createElement('h3');
                    header.textContent = tournamentName;
                    header.classList.add('tournament-header');
                    header.addEventListener('click', () => {
                        const gameList = tournamentDiv.querySelector('.game-list');
                        gameList.classList.toggle('hidden');
                    });

                    const gameList = document.createElement('div');
                    gameList.classList.add('game-list');

                    tournaments[tournamentName].forEach(event => {
                        const homeTeam = event.homeTeam?.name || 'Unbekannt';
                        const awayTeam = event.awayTeam?.name || 'Unbekannt';
                        const homeScore = event.homeScore?.display ?? '-';
                        const awayScore = event.awayScore?.display ?? '-';
                        const status = event.status?.description || 'Unbekannt';
                        const round = event.roundInfo?.name || '';

                        const gameDiv = document.createElement('div');
                        gameDiv.classList.add('game');
                        gameDiv.dataset.eventId = event.id;
                        
                        const matchInfo = document.createElement('div');
                        matchInfo.classList.add('match-info');
                        matchInfo.innerHTML = `
                            <div class="teams">
                                <span class="team ${event.winnerCode === 1 ? 'winner' : ''}">
                                    ${getFlagEmoji(event.homeTeam?.country?.alpha2)} ${homeTeam}
                                </span>
                                <span class="vs">vs</span>
                                <span class="team ${event.winnerCode === 2 ? 'winner' : ''}">
                                    ${getFlagEmoji(event.awayTeam?.country?.alpha2)} ${awayTeam}
                                </span>
                            </div>
                            <div class="score-status">
                                <span class="score">${homeScore} : ${awayScore}</span>
                                <span class="status">${status}</span>
                            </div>
                            ${round ? `<div class="round">${round}</div>` : ''}
                        `;

                        gameDiv.appendChild(matchInfo);
                        gameDiv.addEventListener('click', () => {
                            document.querySelectorAll('.game').forEach(g => g.classList.remove('selected'));
                            gameDiv.classList.add('selected');
                            showDetails(event);
                        });
                        gameList.appendChild(gameDiv);
                    });

                    tournamentDiv.appendChild(header);
                    tournamentDiv.appendChild(gameList);
                    gamesListContainer.appendChild(tournamentDiv);
                });

                // Zeige das erste Spiel standardmäßig an
                const firstGame = gamesListContainer.querySelector('.game');
                if (firstGame) {
                    firstGame.click();
                }
            } else {
                outputDiv.innerHTML = 'Keine Spiele gefunden.';
            }
        })
        .catch(error => {
            outputDiv.innerHTML = `Fehler: ${error.message}`;
        });
}

// Initialisiere die Datepicker-Funktionalität
document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
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

function getPlayerImage(playerName) {
    // Entferne Sonderzeichen und Leerzeichen für die URL
    const cleanName = playerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `https://raw.githubusercontent.com/sportradar/darts-images/main/players/${cleanName}.png`;
}

function getFlagEmoji(countryCode) {
    if (!countryCode) return '';
    const codePoints = countryCode.toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// Füge diese Funktion hinzu, um zusätzliche Statistiken zu laden
async function loadEventStatistics(eventId) {
    const url = `https://sportapi7.p.rapidapi.com/api/v1/event/${eventId}/statistics`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': 'e76819293dmsh626ac597282e32fp1e0d70jsn625395f58aea',
            'x-rapidapi-host': 'sportapi7.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error);
        return null;
    }
}

// Aktualisiere die showDetails Funktion
async function showDetails(event) {
    const detailsDiv = document.getElementById('details');
    detailsDiv.classList.add('visible');

    // Lade zusätzliche Statistiken
    const statistics = await loadEventStatistics(event.id);
    
    const tournamentInfo = `
        <div class="detail-section">
            <h4>Turnierinformation</h4>
            <p>Turnier: ${event.tournament?.name || 'Unbekannt'}</p>
            <p>Runde: ${event.roundInfo?.name || 'Unbekannt'}</p>
            ${event.bestOfSets ? `<p>Best of ${event.bestOfSets} Sets</p>` : ''}
            ${event.bestOfLegs ? `<p>Best of ${event.bestOfLegs} Legs pro Set</p>` : ''}
            ${event.venue ? `<p>Austragungsort: ${event.venue.name}, ${event.venue.city}</p>` : ''}
        </div>
    `;

    const matchInfo = `
        <div class="detail-section">
            <h4>Spielinformation</h4>
            <div class="match-details">
                <div class="team-column ${event.winnerCode === 1 ? 'winner' : ''}">
                    <div class="player-header">
                        <img src="${getPlayerImage(event.homeTeam?.name || '')}" 
                             alt="${event.homeTeam?.name || 'Unbekannt'}"
                             class="player-image"
                             onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                        <div class="player-info">
                            <h5>
                                ${getFlagEmoji(event.homeTeam?.country?.alpha2)} 
                                ${event.homeTeam?.name || 'Unbekannt'}
                            </h5>
                            ${event.homeTeam?.country ? `<p class="country">${event.homeTeam.country.name}</p>` : ''}
                            ${event.homeTeam?.ranking ? `<p class="ranking">Weltrangliste: ${event.homeTeam.ranking}</p>` : ''}
                        </div>
                    </div>
                    <p class="score">Score: ${event.homeScore?.display || '-'}</p>
                </div>
                <div class="team-column ${event.winnerCode === 2 ? 'winner' : ''}">
                    <div class="player-header">
                        <img src="${getPlayerImage(event.awayTeam?.name || '')}" 
                             alt="${event.awayTeam?.name || 'Unbekannt'}"
                             class="player-image"
                             onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
                        <div class="player-info">
                            <h5>
                                ${getFlagEmoji(event.awayTeam?.country?.alpha2)} 
                                ${event.awayTeam?.name || 'Unbekannt'}
                            </h5>
                            ${event.awayTeam?.country ? `<p class="country">${event.awayTeam.country.name}</p>` : ''}
                            ${event.awayTeam?.ranking ? `<p class="ranking">Weltrangliste: ${event.awayTeam.ranking}</p>` : ''}
                        </div>
                    </div>
                    <p class="score">Score: ${event.awayScore?.display || '-'}</p>
                </div>
            </div>
            <div class="match-status">
                <p>Status: ${event.status?.description || 'Unbekannt'}</p>
                ${event.startTimestamp ? `<p>Startzeit: ${new Date(event.startTimestamp * 1000).toLocaleString()}</p>` : ''}
            </div>
        </div>
    `;

    const matchStatistics = statistics ? `
        <div class="detail-section">
            <h4>Detaillierte Statistiken</h4>
            <div class="detailed-stats">
                <div class="stats-grid">
                    <div class="stats-header">
                        <span class="player-name">${event.homeTeam?.name || 'Unbekannt'}</span>
                        <span class="stat-type">Statistik</span>
                        <span class="player-name">${event.awayTeam?.name || 'Unbekannt'}</span>
                    </div>
                    ${generateStatisticsRows(statistics, event)}
                </div>
            </div>
        </div>
    ` : '';

    const matchProgress = `
        <div class="detail-section">
            <h4>Spielverlauf</h4>
            <div class="match-progress">
                <div class="progress-info">
                    <div class="progress-text">
                        <span>Gesamtfortschritt (Best of ${event.bestOfSets || 7})</span>
                    </div>
                    <div class="progress-bar total-progress">
                        <div class="progress home-progress" style="width: ${(event.homeScore?.display / ((event.bestOfSets + 1) / 2)) * 100}%"></div>
                        <div class="progress away-progress" style="width: ${(event.awayScore?.display / ((event.bestOfSets + 1) / 2)) * 100}%"></div>
                    </div>
                    <div class="progress-labels">
                        <span>${event.homeTeam?.name || 'Unbekannt'}: ${event.homeScore?.display || 0}</span>
                        <span>${event.awayTeam?.name || 'Unbekannt'}: ${event.awayScore?.display || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const setScores = `
        <div class="detail-section">
            <h4>Set Details</h4>
            <div class="set-scores">
                ${generateSetScores(event)}
            </div>
        </div>
    `;

    detailsDiv.innerHTML = `
        ${tournamentInfo}
        ${matchInfo}
        ${matchStatistics}
        ${matchProgress}
        ${setScores}
    `;
}

function generateStatisticsRows(statistics, event) {
    if (!statistics) return '';

    const stats = [
        { label: '3-Dart Average', home: statistics.homeTeam?.average, away: statistics.awayTeam?.average },
        { label: 'First 9 Average', home: statistics.homeTeam?.firstNineAverage, away: statistics.awayTeam?.firstNineAverage },
        { label: '180s', home: statistics.homeTeam?.oneEighties, away: statistics.awayTeam?.oneEighties },
        { label: '140+ Würfe', home: statistics.homeTeam?.hundredFortyPlus, away: statistics.awayTeam?.hundredFortyPlus },
        { label: '100+ Würfe', home: statistics.homeTeam?.hundredPlus, away: statistics.awayTeam?.hundredPlus },
        { label: 'Checkout %', home: statistics.homeTeam?.checkoutPercentage, away: statistics.awayTeam?.checkoutPercentage },
        { label: 'Höchster Checkout', home: statistics.homeTeam?.highestCheckout, away: statistics.awayTeam?.highestCheckout },
        { label: 'Darts pro Leg', home: statistics.homeTeam?.dartsPerLeg, away: statistics.awayTeam?.dartsPerLeg }
    ];

    return stats.map(stat => `
        <div class="stat-row">
            <span class="stat-value">${stat.home || '-'}</span>
            <span class="stat-label">${stat.label}</span>
            <span class="stat-value">${stat.away || '-'}</span>
        </div>
    `).join('');
}

function generateSetScores(event) {
    let setScoresHtml = '';
    const maxSets = Math.max(
        ...Object.keys(event.homeScore || {})
            .filter(key => key.startsWith('period'))
            .map(key => parseInt(key.replace('period', '')))
    );

    for (let i = 1; i <= maxSets; i++) {
        const homeSetScore = event.homeScore[`period${i}`] || '-';
        const awaySetScore = event.awayScore[`period${i}`] || '-';
        
        setScoresHtml += `
            <div class="set-row">
                <div class="set-details">
                    ${generateSetDetails(event, i)}
                </div>
            </div>
        `;
    }

    return setScoresHtml;
}

function generateSetDetails(event, setNumber) {
    // Extrahiere Set-Informationen
    const homeLegs = event.homeScore?.[`period${setNumber}`] || 0;
    const awayLegs = event.awayScore?.[`period${setNumber}`] || 0;
    const totalLegs = homeLegs + awayLegs;

    return `
        <div class="set-info">
            <div class="set-number">Set ${setNumber}</div>
            <div class="set-score-main">
                <div class="player-score ${homeLegs > awayLegs ? 'winner' : ''}">
                    <span class="score-number">${homeLegs}</span>
                    <span class="player-name">${event.homeTeam?.name || 'Unbekannt'}</span>
                </div>
                <span class="score-divider">:</span>
                <div class="player-score ${awayLegs > awayLegs ? 'winner' : ''}">
                    <span class="score-number">${awayLegs}</span>
                    <span class="player-name">${event.awayTeam?.name || 'Unbekannt'}</span>
                </div>
            </div>
            <div class="leg-info">
                <div class="leg-count">
                    <span class="info-label">Legs gespielt:</span>
                    <span class="info-value">${totalLegs}</span>
                </div>
                <div class="set-progress">
                    <div class="progress-text">
                        <span>Fortschritt (Best of ${event.bestOfLegs || 5})</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress home-progress" style="width: ${(homeLegs / (homeLegs + awayLegs)) * 100}%"></div>
                        <div class="progress away-progress" style="width: ${(awayLegs / (homeLegs + awayLegs)) * 100}%"></div>
                    </div>
                    <div class="progress-labels">
                        <span>${event.homeTeam?.name || 'Unbekannt'}: ${homeLegs}</span>
                        <span>${event.awayTeam?.name || 'Unbekannt'}: ${awayLegs}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function findLastPlayedDate(playerName) {
    const today = new Date();
    let currentDate = new Date(today);
    
    // Search through the last 30 days
    for (let i = 0; i < 30; i++) {
        const formattedDate = formatDate(currentDate);
        const response = await fetch(`https://live.dartsdata.com/api/matches/${formattedDate}`);
        const data = await response.json();
        
        for (const tournament of data) {
            for (const game of tournament.Games) {
                if (game.Player1.toLowerCase().includes(playerName.toLowerCase()) || 
                    game.Player2.toLowerCase().includes(playerName.toLowerCase())) {
                    return formattedDate;
                }
            }
        }
        
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
    }
    return null;
}

async function searchPlayer(playerName) {
    const currentDate = document.getElementById('datePicker').value;
    const response = await fetch(`https://live.dartsdata.com/api/matches/${currentDate}`);
    const data = await response.json();
    
    let playerFound = false;
    
    // Check if player played on current date
    for (const tournament of data) {
        for (const game of tournament.Games) {
            if (game.Player1.toLowerCase().includes(playerName.toLowerCase()) || 
                game.Player2.toLowerCase().includes(playerName.toLowerCase())) {
                playerFound = true;
                filterGamesByPlayer(playerName);
                return;
            }
        }
    }
    
    // If player not found on current date, search for their last played date
    if (!playerFound) {
        const lastPlayedDate = await findLastPlayedDate(playerName);
        if (lastPlayedDate) {
            const message = `${playerName} hat nicht an diesem Tag gespielt. Letztes Spiel war am ${lastPlayedDate}`;
            alert(message);
            // Load games from the last played date
            document.getElementById('datePicker').value = lastPlayedDate;
            loadGames(lastPlayedDate);
            filterGamesByPlayer(playerName);
        } else {
            alert(`Keine Spiele für ${playerName} in den letzten 30 Tagen gefunden.`);
        }
    }
}

function initializeSearch() {
    const searchInput = document.getElementById('playerSearch');
    let debounceTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        const searchTerm = e.target.value.trim();
        
        if (searchTerm.length >= 3) {
            debounceTimeout = setTimeout(() => {
                searchPlayer(searchTerm);
            }, 500);
        }
    });
}
