// Global variables
let quizzes = [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizStartTime = null;
let quizTimer = null;
let elapsedTime = 0;
let githubToken = null;
let githubUsername = null;

// DOM elements
const quizSelector = document.getElementById('quiz-selector');
const quizContainer = document.getElementById('quiz-container');
const resultsContainer = document.getElementById('results-container');
// const leaderboardContainer = document.getElementById('leaderboard-container');
const quizCardsContainer = document.getElementById('quiz-cards-container');

// Event listeners for navigation
document.getElementById('home-link').addEventListener('click', showQuizSelector);
// document.getElementById('leaderboard-link').addEventListener('click', showLeaderboard);
document.getElementById('back-to-quizzes').addEventListener('click', showQuizSelector);
document.getElementById('back-to-quizzes-results').addEventListener('click', showQuizSelector);
// document.getElementById('back-to-quizzes-leaderboard').addEventListener('click', showQuizSelector);

// Event listeners for quiz navigation
document.getElementById('prev-button').addEventListener('click', showPreviousQuestion);
document.getElementById('next-button').addEventListener('click', handleNextButton);
document.getElementById('retry-quiz').addEventListener('click', retryQuiz);
document.getElementById('review-answers').addEventListener('click', reviewAnswers);

// Login button
document.getElementById('login-button').addEventListener('click', authenticateWithGitHub);

// Copy results button
document.getElementById('copy-results').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href)
        .then(() => {
            alert('Results URL copied to clipboard!');
        })
        .catch(err => {
            console.error('Could not copy URL: ', err);
        });
});

// Init
initApp();

// ====== Main Functions ======

function initApp() {
    // Check for GitHub token in local storage
    checkGitHubAuth();
    
    // Load quizzes
    loadQuizzes().catch(error => {
        console.error('Fatal error loading quizzes:', error);
        quizCardsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <p>Error loading quizzes: ${error.message}</p>
                    <p>Please check the console for more details.</p>
                </div>
            </div>
        `;
    });
    
    // Check URL parameters for direct quiz access
    checkUrlParams();
}

// View management
function showView(viewElement) {
    // Hide all main views
    quizSelector.style.display = 'none';
    quizContainer.style.display = 'none';
    resultsContainer.style.display = 'none';
    // leaderboardContainer.style.display = 'none';
    
    // Show the requested view
    viewElement.style.display = 'block';
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    if (viewElement === quizSelector) {
        document.getElementById('home-link').classList.add('active');
    } 
    // else if (viewElement === leaderboardContainer) {
    //     document.getElementById('leaderboard-link').classList.add('active');
    }
}

function showQuizSelector() {
    // Stop quiz timer if running
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
    }
    
    // Reset URL
    window.history.pushState(null, '', window.location.pathname);
    
    // Show quiz selector view
    showView(quizSelector);
}

// URL parameter handling
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizParam = urlParams.get('quiz');
    
    if (quizParam) {
        // Look for matching quiz by filename
        const quizIndex = quizzes.findIndex(quiz => 
            quiz.filename && quiz.filename.replace('.json', '') === quizParam
        );
        
        if (quizIndex !== -1) {
            startQuiz(quizIndex);
        }
    }
}

// GitHub Authentication
function checkGitHubAuth() {
    githubToken = localStorage.getItem('githubToken');
    githubUsername = localStorage.getItem('githubUsername');
    
    if (githubToken) {
        document.getElementById('login-button').textContent = githubUsername || 'Logged In';
        document.getElementById('login-button').classList.add('btn-success');
        document.getElementById('login-button').classList.remove('btn-outline-light');
    }
}

function authenticateWithGitHub() {
    // For a real implementation, you would use OAuth with GitHub
    // This is a simplified version for demonstration
    
    // Mock authentication for demo
    githubToken = 'mock_token_' + Math.random().toString(36).substring(7);
    githubUsername = 'DemoUser' + Math.floor(Math.random() * 1000);
    
    localStorage.setItem('githubToken', githubToken);
    localStorage.setItem('githubUsername', githubUsername);
    
    document.getElementById('login-button').textContent = githubUsername;
    document.getElementById('login-button').classList.add('btn-success');
    document.getElementById('login-button').classList.remove('btn-outline-light');
    
    // Update leaderboard if visible
    // if (leaderboardContainer.style.display === 'block') {
    //     document.getElementById('friends-login-message').style.display = 'none';
    //     document.getElementById('friends-leaderboard-content').style.display = 'block';
    // }
}

// Helper function to strip HTML
function stripHtml(html) {
    // Create a temporary element
    const temp = document.createElement('div');
    temp.innerHTML = html;
    // Get the text content
    return temp.textContent || temp.innerText || '';
}
