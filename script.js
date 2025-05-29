let allMatches = [];

const teamEmojis = {
    'Arsenal': '🔴',
    'Chelsea': '🔵',
    'Liverpool': '🔴',
    'Manchester City': '🩵',
    'Manchester United': '🔴',
    'Tottenham': '⚪',
    'Newcastle': '⚫',
    'Brighton': '🔵',
    'Aston Villa': '🟣',
    'West Ham': '🔨',
    'Leicester': '🦊',
    'Everton': '🔵',
    'Crystal Palace': '🦅',
    'Brentford': '🐝',
    'Fulham': '⚪',
    'Southampton': '🔴',
    'Wolves': '🟠',
    'Burnley': '🟤',
    'Sheffield United': '🔴',
    'Luton': '🧡'
};

function getTeamEmoji(teamName) {
    for (const [team, emoji] of Object.entries(teamEmojis)) {
        if (teamName.toLowerCase().includes(team.toLowerCase())) {
            return emoji;
        }
    }
    return '⚽';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    let timePrefix = '';
    if (diffDays === 0) timePrefix = 'Today';
    else if (diffDays === 1) timePrefix = 'Tomorrow';
    else if (diffDays > 1 && diffDays < 7) timePrefix = `Match in ${diffDays} days`;
    else if (diffDays === -1) timePrefix = 'Match finished yesterday';
    else if (diffDays < -1 && diffDays > -7) timePrefix = `Match finished ${Math.abs(diffDays)} days ago`;

    return {
        formatted: date.toLocaleDateString('en-US', options),
        prefix: timePrefix
    };
}

function getMatchStatus(dateString, status) {
    const matchDate = new Date(dateString);
    const now = new Date();
    if (status && status.toLowerCase().includes('live')) return 'LIVE';
    if (matchDate < now) return 'FINISHED';
    if (Math.abs(matchDate - now) < 2 * 60 * 60 * 1000) return 'STARTING SOON';
    return 'SCHEDULED';
}

function displayMatches(matches) {
    const container = document.getElementById('matches-container');
    const loading = document.getElementById('loading');
    loading.style.display = 'none';

    if (!matches || matches.length === 0) {
        container.innerHTML = `
            <div class="no-matches">
                <i class="fas fa-calendar-times"></i>
                <h3>No matches found</h3>
                <p>There are no upcoming Premier League matches at the moment.</p>
                <p style="margin-top: 10px; font-size: 0.9rem; opacity: 0.7;">The season might be on break or matches might be rescheduled.</p>
            </div>
        `;
        return;
    }

    document.getElementById('total-matches').textContent = matches.length;

    const thisWeek = matches.filter(match => {
        const matchDate = new Date(match.dateEvent + 'T' + (match.strTime || '15:00:00'));
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return matchDate <= weekFromNow;
    }).length;

    document.getElementById('today-matches').textContent = thisWeek;
    document.getElementById('live-matches').textContent = matches.filter(match =>
        getMatchStatus(match.dateEvent + 'T' + (match.strTime || '15:00:00'), match.strStatus) === 'LIVE'
    ).length;

    container.innerHTML = '';

    matches.forEach((match, index) => {
        const matchDateTime = match.dateEvent + 'T' + (match.strTime || '15:00:00');
        const dateInfo = formatDate(matchDateTime);
        const status = getMatchStatus(matchDateTime, match.strStatus);

        const matchCard = document.createElement('div');
        matchCard.className = 'match-card';
        matchCard.style.animationDelay = `${index * 0.1}s`;

        matchCard.innerHTML = `
            <div class="match-status">${status}</div>

            <div class="teams-container">
                <div class="team">
                    <div class="team-logo">${getTeamEmoji(match.strHomeTeam)}</div>
                    <div class="team-name">${match.strHomeTeam}</div>
                </div>

                <div class="vs-divider">
                    <div class="vs-line"></div>
                    <div class="vs-text">VS</div>
                    <div class="vs-line"></div>
                </div>

                <div class="team">
                    <div class="team-logo">${getTeamEmoji(match.strAwayTeam)}</div>
                    <div class="team-name">${match.strAwayTeam}</div>
                </div>
            </div>

            <div class="match-details">
                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-calendar"></i></div>
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${dateInfo.formatted.split(',')[0]}<br>${dateInfo.formatted.split(',')[1]}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-clock"></i></div>
                    <div class="detail-label">Time</div>
                    <div class="detail-value">${match.strTime || '15:00'}<br>${dateInfo.prefix}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-trophy"></i></div>
                    <div class="detail-label">League</div>
                    <div class="detail-value">Premier<br>League</div>
                </div>

                <div class="detail-item">
                    <div class="detail-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <div class="detail-label">Venue</div>
                    <div class="detail-value">${match.strVenue || 'TBA'}</div>
                </div>
            </div>
        `;

        container.appendChild(matchCard);
    });
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-message').innerHTML = `
        <strong>Oops! Something went wrong</strong><br>
        ${message}<br>
        <small>Please check your internet connection and try again.</small>
    `;
}

async function loadMatches() {
    try {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('error').style.display = 'none';

        const endpoints = [
            'https://www.thesportsdb.com/api/v1/json/3/eventsround.php?id=4328&r=38&s=2024-2025',
            'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328',
        ];

        let allMatches = [];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (data.events && Array.isArray(data.events)) {
                    allMatches = allMatches.concat(data.events);
                }
            } catch (err) {
                console.warn(`Failed to fetch from ${endpoint}:`, err);
            }
        }

        if (allMatches.length === 0) {
            allMatches = generateSampleMatches();
        }

        const uniqueMatches = allMatches.filter((match, index, self) =>
            index === self.findIndex(m => m.idEvent === match.idEvent)
        );

        const now = new Date();
        const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
        const oneWeekBeforeUtc = nowUtc - 7 * 24 * 60 * 60 * 1000;
        const oneWeekAfterUtc = nowUtc + 7 * 24 * 60 * 60 * 1000;

        function parseMatchDateUtc(match) {
            const datePart = match.dateEvent;
            let timePart = match.strTime || '12:00:00';
            if (timePart.length === 5) timePart += ':00';
            const utcString = `${datePart}T${timePart}Z`;
            const parsedTime = Date.parse(utcString);
            return isNaN(parsedTime) ? null : parsedTime;
        }

        const filteredMatches = uniqueMatches.filter(match => {
            const matchUtcTime = parseMatchDateUtc(match);
            if (!matchUtcTime) return false;
            const status = getMatchStatus(match.dateEvent + 'T' + (match.strTime || '15:00:00'), match.strStatus);
            return (
                (matchUtcTime >= oneWeekBeforeUtc && matchUtcTime <= oneWeekAfterUtc) ||
                status === 'LIVE'
            );
        });

        const sortedMatches = filteredMatches.sort((a, b) => {
            const aTime = parseMatchDateUtc(a);
            const bTime = parseMatchDateUtc(b);
            return aTime - bTime;
        });

        const upcomingMatches = sortedMatches.slice(0, 12);
        displayMatches(upcomingMatches);
    } catch (error) {
        console.error('Error loading matches:', error);
        showError('Failed to load match data from TheSportsDB API. This might be due to network issues or API limitations.');
    }
}

function generateSampleMatches() {
    const teams = [
        'Manchester City', 'Arsenal', 'Liverpool', 'Manchester United',
        'Newcastle United', 'Tottenham Hotspur', 'Brighton & Hove Albion',
        'Aston Villa', 'Chelsea', 'West Ham United', 'Crystal Palace',
        'Brentford', 'Fulham', 'Wolverhampton Wanderers', 'Everton',
        'Leicester City', 'Southampton', 'Nottingham Forest'
    ];

    const venues = [
        'Etihad Stadium', 'Emirates Stadium', 'Anfield', 'Old Trafford',
        'St. James\' Park', 'Tottenham Hotspur Stadium', 'Amex Stadium',
        'Villa Park', 'Stamford Bridge', 'London Stadium'
    ];

    const sampleMatches = [];
    const today = new Date();

    for (let i = 0; i < 8; i++) {
        const matchDate = new Date(today);
        matchDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1);

        const homeTeam = teams[Math.floor(Math.random() * teams.length)];
        let awayTeam = teams[Math.floor(Math.random() * teams.length)];
        while (awayTeam === homeTeam) {
            awayTeam = teams[Math.floor(Math.random() * teams.length)];
        }

        sampleMatches.push({
            idEvent: `sample_${i}`,
            strHomeTeam: homeTeam,
            strAwayTeam: awayTeam,
            dateEvent: matchDate.toISOString().split('T')[0],
            strTime: ['12:30:00', '15:00:00', '17:30:00'][Math.floor(Math.random() * 3)],
            strVenue: venues[Math.floor(Math.random() * venues.length)],
            strStatus: 'Not Started'
        });
    }

    return sampleMatches;
}

window.addEventListener('load', loadMatches);
setInterval(loadMatches, 5 * 60 * 1000);
