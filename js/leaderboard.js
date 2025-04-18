// Leaderboard functions
function showLeaderboard() {
    // Load leaderboard data
    loadLeaderboardData();
    
    // Show leaderboard view
    showView(leaderboardContainer);
}

function loadLeaderboardData() {
    // Get saved scores from local storage
    const scoresJson = localStorage.getItem('quizHubScores');
    const scores = scoresJson ? JSON.parse(scoresJson) : [];
    
    // Sort by percentage and time (descending percentage, ascending time)
    scores.sort((a, b) => {
        if (b.percentage !== a.percentage) {
            return b.percentage - a.percentage;
        }
        return a.time - b.time;
    });
    
    // Populate global leaderboard
    const globalLeaderboardBody = document.getElementById('global-leaderboard-body');
    globalLeaderboardBody.innerHTML = '';
    
    if (scores.length === 0) {
        globalLeaderboardBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No scores yet. Be the first to complete a quiz!</td>
            </tr>
        `;
        return;
    }
    
    scores.forEach((score, index) => {
        const date = new Date(score.date);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        const minutes = Math.floor(score.time / 60);
        const seconds = score.time % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const rowHtml = `
            <tr>
                <td>${index + 1}</td>
                <td>${score.user}</td>
                <td>${score.quiz}</td>
                <td>${score.score}/${score.totalQuestions} (${score.percentage}%)</td>
                <td>${formattedTime}</td>
                <td>${formattedDate}</td>
            </tr>
        `;
        
        globalLeaderboardBody.innerHTML += rowHtml;
    });
    
    // If logged in, show friends leaderboard (simplified - using the same data for demo)
    if (githubToken) {
        document.getElementById('friends-login-message').style.display = 'none';
        document.getElementById('friends-leaderboard-content').style.display = 'block';
        
        const friendsLeaderboardBody = document.getElementById('friends-leaderboard-body');
        friendsLeaderboardBody.innerHTML = globalLeaderboardBody.innerHTML;
    } else {
        document.getElementById('friends-login-message').style.display = 'block';
        document.getElementById('friends-leaderboard-content').style.display = 'none';
    }
}

// Add event listener for login button in friends leaderboard
document.querySelectorAll('.github-login-btn').forEach(button => {
    button.addEventListener('click', authenticateWithGitHub);
});
