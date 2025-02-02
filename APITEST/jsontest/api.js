document.getElementById('fetchDataButton').addEventListener('click', async () => {
	const options = {
		method: 'GET',
		headers: {
			'x-rapidapi-key': 'e76819293dmsh626ac597282e32fp1e0d70jsn625395f58aea',
			'x-rapidapi-host': 'sportapi7.p.rapidapi.com'
		}
	};

	const outputDiv = document.getElementById('output');
	outputDiv.textContent = 'Lade Daten...';
	let output = '';

	try {
		// 1. Hole alle Darts-Spieler
		const playersUrl = 'https://sportapi7.p.rapidapi.com/api/v1/sport/darts/players';
		const playersResponse = await fetch(playersUrl, options);
		const playersData = await playersResponse.json();
		
		output += "=== DARTS SPIELER ===\n\n";
		if (playersData.players) {
			playersData.players.forEach(player => {
				output += `Spieler: ${player.name}\n`;
				output += `ID: ${player.id}\n`;
				output += `Land: ${player.country?.name || 'Unbekannt'}\n`;
				output += `Team: ${player.team?.name || 'Kein Team'}\n`;
				output += "------------------------\n";
			});
		}

		// 2. Hole alle Darts-Turniere
		const tournamentsUrl = 'https://sportapi7.p.rapidapi.com/api/v1/sport/darts/unique-tournaments';
		const tournamentsResponse = await fetch(tournamentsUrl, options);
		const tournamentsData = await tournamentsResponse.json();

		output += "\n=== DARTS TURNIERE ===\n\n";
		if (tournamentsData.tournaments) {
			tournamentsData.tournaments.forEach(tournament => {
				output += `Turnier: ${tournament.name}\n`;
				output += `ID: ${tournament.id}\n`;
				output += `Land: ${tournament.country?.name || 'International'}\n`;
				output += "------------------------\n";
			});
		}

		// 3. Hole alle Darts-Teams
		const teamsUrl = 'https://sportapi7.p.rapidapi.com/api/v1/sport/darts/teams';
		const teamsResponse = await fetch(teamsUrl, options);
		const teamsData = await teamsResponse.json();

		output += "\n=== DARTS TEAMS ===\n\n";
		if (teamsData.teams) {
			teamsData.teams.forEach(team => {
				output += `Team: ${team.name}\n`;
				output += `ID: ${team.id}\n`;
				output += `Land: ${team.country?.name || 'Unbekannt'}\n`;
				output += "------------------------\n";
			});
		}

		// 4. Beispiel für die komplette URL mit IDs
		output += "\n=== BEISPIEL URLs ===\n\n";
		if (playersData.players?.[0] && tournamentsData.tournaments?.[0] && teamsData.teams?.[0]) {
			const examplePlayer = playersData.players[0];
			const exampleTournament = tournamentsData.tournaments[0];
			const exampleTeam = teamsData.teams[0];

			output += "Beispiel URL mit IDs:\n";
			output += `https://sportapi7.p.rapidapi.com/api/v1/player/${examplePlayer.id}/unique-tournament/${exampleTournament.id}/team/${exampleTeam.id}/events/30/1\n\n`;
			output += "Parameter Erklärung:\n";
			output += `- Spieler ID: ${examplePlayer.id} (${examplePlayer.name})\n`;
			output += `- Turnier ID: ${exampleTournament.id} (${exampleTournament.name})\n`;
			output += `- Team ID: ${exampleTeam.id} (${exampleTeam.name})\n`;
			output += "- Span: 30 (Tage)\n";
			output += "- Page: 1 (Seitennummer)\n";
		}

		outputDiv.textContent = output;

	} catch (error) {
		outputDiv.textContent = `Fehler: ${error.message}`;
		console.error(error);
	}
});