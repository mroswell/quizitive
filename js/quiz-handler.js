// Quiz handling functions
async function loadQuizzes() {
    try {
        // Empty the container first
        quizCardsContainer.innerHTML = `
            <div class="col-12 text-center loading-container">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        
        // Get GitHub repository information from URL
        const urlParts = window.location.hostname.split('.');
        let owner = urlParts[0];
        
        // Handle custom domains
        if (urlParts.indexOf('github.io') === -1) {
            // For custom domains, default to the repository name from the URL path
            owner = 'mroswell'; // Default fallback, replace with your GitHub username
        }
        
        // Get repository name from URL path
        let repo = window.location.pathname.split('/')[1];
        if (!repo || repo === '') {
            // If path is empty (e.g., username.github.io with no repo in path)
            repo = 'quizitive'; // Default fallback, replace with your repository name
        }
        
        try {
            // Fetch the list of quiz files from the quizzes directory on GitHub
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/quizzes`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch quizzes: ${response.status} ${response.statusText}`);
            }
            
            const files = await response.json();
            
            // Filter for JSON files
            const quizFiles = files.filter(file => file.name.endsWith('.json'));
            
            // Fetch each quiz file
            quizzes = await Promise.all(quizFiles.map(async file => {
                try {
                    const quizResponse = await fetch(file.download_url);
                    if (!quizResponse.ok) {
                        console.error(`Failed to fetch quiz ${file.name}: ${quizResponse.status} ${quizResponse.statusText}`);
                        return null;
                    }
                    const quiz = await quizResponse.json();
                    // Add the filename to the quiz object
                    quiz.filename = file.name;
                    return quiz;
                } catch (error) {
                    console.error(`Error processing quiz ${file.name}:`, error);
                    return null;
                }
            }));
            
            // Remove any null entries (failed fetches)
            quizzes = quizzes.filter(quiz => quiz !== null);
            
        } catch (error) {
            console.error('Error using GitHub API, falling back to direct file loading:', error);
            
            // Fallback: Direct file loading from the quizzes directory
            try {
                // Try to load a sample quiz file to see if direct loading works
                const response = await fetch('quizzes/example.json');
                if (response.ok) {
                    const quiz = await response.json();
                    quiz.filename = 'example.json';
                    quizzes = [quiz];
                    
                    // Try to find more quizzes with common names
                    const commonNames = ['quiz1.json', 'quiz2.json', 'geography.json', 'history.json', 'science.json'];
                    
                    // Load any additional quizzes that exist
                    await Promise.all(commonNames.map(async filename => {
                        try {
                            const response = await fetch(`quizzes/${filename}`);
                            if (response.ok) {
                                const quiz = await response.json();
                                quiz.filename = filename;
                                quizzes.push(quiz);
                            }
                        } catch (e) {
                            // Ignore errors for files that don't exist
                        }
                    }));
                } else {
                    throw new Error('Could not load example quiz');
                }
            } catch (directError) {
                console.error('Error with direct file loading too:', directError);
                
                // Last resort: Try to find any JSON files in the current directory
                const possibleQuizLocations = [
                    'quizzes/example.json',
                    'example.json',
                    './quizzes/example.json'
                ];
                
                for (const location of possibleQuizLocations) {
                    try {
                        const response = await fetch(location);
                        if (response.ok) {
                            const quiz = await response.json();
                            quiz.filename = location.split('/').pop();
                            quizzes = [quiz];
                            break;
                        }
                    } catch (e) {
                        // Continue to next location
                    }
                }
                
                if (quizzes.length === 0) {
                    throw new Error('Could not load any quizzes');
                }
            }
        }
        
        // Render quiz cards
        renderQuizCards();
    } catch (error) {
        console.error('Error loading quizzes:', error);
        quizCardsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <p>Error loading quizzes: ${error.message}</p>
                    <p>Please check that quiz files exist in the '/quizzes' directory and are in the correct JSON format.</p>
                    <p>If you're seeing this error, you may need to:</p>
                    <ol>
                        <li>Make sure you have at least one quiz file in the 'quizzes' directory</li>
                        <li>Verify that your quiz files are valid JSON in the GETMARKED format</li>
                        <li>Check browser console for more detailed error information</li>
                    </ol>
                </div>
            </div>
        `;
    }
}

function renderQuizCards() {
    // Clear loading spinner
    quizCardsContainer.innerHTML = '';
    
    if (quizzes.length === 0) {
        quizCardsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    No quizzes found. Please add quiz files to the 'quizzes' directory.
                </div>
            </div>
        `;
        return;
    }
    
    // Create a card for each quiz
    quizzes.forEach((quiz, index) => {
        const metadata = quiz.metadata || {};
        const questionCount = quiz.questions ? quiz.questions.length : 0;
        const difficulty = metadata.Difficulty || 'Not specified';
        const topic = metadata.Topic || 'General';
        
//         const cardHtml = `
// <div class="quiz-row d-flex justify-content-start align-items-center px-3 py-3 mb-2 gap-3">
//                             <button class="btn btn-primary start-quiz-btn" data-quiz-index="${index}">
//                                 Start Quiz
//                             </button>
//                             <div class="quiz-title fw-semibold">
//         ${quiz.stimulus ? stripHtml(quiz.stimulus) : 'No description available'}  <span><i class="fas fa-question-circle"></i> ${questionCount} questions</span>
//     </div>
// </div>
        
//         `;

        const cardHtml = `
        <div class="quiz-list">
  <div class="quiz-row d-flex align-items-center px-3 py-3 mb-2">
    <div class="quiz-cell quiz-date text-muted small">
      ${date}
    </div>
    <div class="quiz-cell quiz-title flex-grow-1 fw-semibold">
        ${quiz.stimulus ? stripHtml(quiz.stimulus) : 'Quiz'}
    </div>
    <div class="quiz-cell quiz-questions text-muted small">
      <span>${questionCount} questions</span>
    </div>
    <div class="quiz-cell quiz-start">
      <button class="btn btn-sm btn-primary start-quiz-btn" data-quiz-index="${index}">Start Quiz</button>
    </div>
  </div>
</div>
        `;

        
        quizCardsContainer.innerHTML += cardHtml;
    });
    
    // Add event listeners to start buttons
    document.querySelectorAll('.start-quiz-btn').forEach(button => {
        button.addEventListener('click', () => {
            const quizIndex = parseInt(button.getAttribute('data-quiz-index'));
            startQuiz(quizIndex);
        });
    });
}

function startQuiz(quizIndex) {
    currentQuiz = quizzes[quizIndex];
    currentQuestionIndex = 0;
    userAnswers = Array(currentQuiz.questions.length).fill(null);
    
    // Update URL with quiz ID for sharing
    const quizFilename = currentQuiz.filename;
    const cleanFilename = quizFilename.replace('.json', '');
    window.history.pushState(null, '', `?quiz=${cleanFilename}`);
    
    // Reset and start the timer
    elapsedTime = 0;
    quizStartTime = new Date();
    if (quizTimer) clearInterval(quizTimer);
    quizTimer = setInterval(updateQuizTimer, 1000);
    
    // Show quiz container and hide others
    showView(quizContainer);
    
    // Render the first question
    renderQuestion();
}

function renderQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const totalQuestions = currentQuiz.questions.length;
    
    // Update progress
    document.getElementById('quiz-title').textContent = currentQuiz.title || 'Quiz';
    document.getElementById('quiz-description').textContent = stripHtml(currentQuiz.stimulus) || 'Take this quiz to test your knowledge.';
    document.getElementById('quiz-progress').style.width = `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`;
    
    // Render question text
    document.getElementById('question-text').innerHTML = question.prompt || 'No question text available';
    
    // Render options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    if (question.choices && Array.isArray(question.choices)) {
        question.choices.forEach((choice, index) => {
            const optionId = choice.id || String.fromCharCode(97 + index); // a, b, c, etc.
            const isSelected = userAnswers[currentQuestionIndex] && 
                              (Array.isArray(userAnswers[currentQuestionIndex]) 
                                  ? userAnswers[currentQuestionIndex].includes(optionId)
                                  : userAnswers[currentQuestionIndex] === optionId);
            
            const optionHtml = `
                <div class="option ${isSelected ? 'selected' : ''}" data-option-id="${optionId}">
                    <div class="d-flex align-items-center">
                        <span class="option-letter me-3">${optionId.toUpperCase()}.</span>
                        <div>${choice.content || 'No option text'}</div>
                    </div>
                </div>
            `;
            
            optionsContainer.innerHTML += optionHtml;
        });
        
        // Add event listeners to options
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => {
                selectOption(option.getAttribute('data-option-id'));
            });
        });
    } else {
        optionsContainer.innerHTML = '<p class="text-danger">No options available for this question.</p>';
    }
    
    // Hide feedback
    const feedbackContainer = document.getElementById('feedback-container');
    feedbackContainer.style.display = 'none';
    
    // Update navigation buttons
    document.getElementById('prev-button').disabled = currentQuestionIndex === 0;
    const nextButton = document.getElementById('next-button');
    nextButton.textContent = currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next';
}

function selectOption(optionId) {
    const question = currentQuiz.questions[currentQuestionIndex];
    const isMRQ = currentQuiz.category === 'MRQ';
    
    // For Multiple Response Questions (MRQ), handle multiple selections
    if (isMRQ) {
        if (!userAnswers[currentQuestionIndex]) {
            userAnswers[currentQuestionIndex] = [];
        }
        
        // Toggle selection
        if (userAnswers[currentQuestionIndex].includes(optionId)) {
            userAnswers[currentQuestionIndex] = userAnswers[currentQuestionIndex].filter(id => id !== optionId);
        } else {
            userAnswers[currentQuestionIndex].push(optionId);
        }
    } else {
        // For Multiple Choice Questions (MCQ), only one selection
        userAnswers[currentQuestionIndex] = optionId;
    }
    
    // Update UI for selected options
    document.querySelectorAll('.option').forEach(option => {
        const currentOptionId = option.getAttribute('data-option-id');
        
        if (isMRQ) {
            // For MRQ, toggle selected class based on whether the option is in the selected array
            option.classList.toggle('selected', userAnswers[currentQuestionIndex].includes(currentOptionId));
        } else {
            // For MCQ, only one option can be selected
            option.classList.toggle('selected', currentOptionId === optionId);
        }
    });
    
    // Provide immediate feedback if configured
    if (question.feedback) {
        const feedbackContainer = document.getElementById('feedback-container');
        const feedbackText = document.getElementById('feedback-text');
        const correctAnswers = question.answers && question.answers[0] ? question.answers[0] : [];
        
        let isCorrect;
        if (isMRQ) {
            // Check if arrays have the same elements (regardless of order)
            const selectedSet = new Set(userAnswers[currentQuestionIndex]);
            const correctSet = new Set(correctAnswers);
            isCorrect = selectedSet.size === correctSet.size && 
                        [...selectedSet].every(value => correctSet.has(value));
        } else {
            // For MCQ, simple equality check
            isCorrect = correctAnswers.includes(optionId);
        }
        
        // Display appropriate feedback
        if (isCorrect) {
            feedbackContainer.className = 'feedback-container feedback-correct';
            feedbackText.innerHTML = question.feedback.correct || 'Correct!';
        } else {
            feedbackContainer.className = 'feedback-container feedback-incorrect';
            feedbackText.innerHTML = question.feedback.incorrect || 'Incorrect. Try again.';
        }
        
        feedbackContainer.style.display = 'block';
    }
}

function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function handleNextButton() {
    const totalQuestions = currentQuiz.questions.length;
    
    // If no answer selected yet, prompt user
    if (!userAnswers[currentQuestionIndex]) {
        alert('Please select an answer before proceeding.');
        return;
    }
    
    // If last question, finish quiz
    if (currentQuestionIndex === totalQuestions - 1) {
        finishQuiz();
        return;
    }
    
    // Otherwise, go to next question
    currentQuestionIndex++;
    renderQuestion();
}

function updateQuizTimer() {
    elapsedTime = Math.floor((new Date() - quizStartTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    document.getElementById('quiz-timer').textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function finishQuiz() {
    // Stop timer
    if (quizTimer) {
        clearInterval(quizTimer);
        quizTimer = null;
    }
    
    // Calculate score
    const score = calculateScore();
    const totalQuestions = currentQuiz.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Update results view
    document.getElementById('correct-answers').textContent = score;
    document.getElementById('total-questions').textContent = totalQuestions;
    document.getElementById('percentage').textContent = `${percentage}%`;
    
    // Set message based on score
    let resultMessage;
    if (percentage >= 90) {
        resultMessage = 'Outstanding! You have mastered this topic!';
    } else if (percentage >= 70) {
        resultMessage = 'Great job! You have a solid understanding.';
    } else if (percentage >= 50) {
        resultMessage = 'Good effort! Keep studying to improve.';
    } else {
        resultMessage = 'Keep practicing! You\'ll improve with more study.';
    }
    document.getElementById('result-message').textContent = resultMessage;
    
    // Update share links
    const quizName = encodeURIComponent(currentQuiz.title || 'Quiz');
    const scoreText = encodeURIComponent(`I scored ${percentage}% (${score}/${totalQuestions}) on the ${currentQuiz.title || 'Quiz'}!`);
    const url = encodeURIComponent(window.location.href);
    
    document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${scoreText}`;
    document.getElementById('share-twitter').href = `https://twitter.com/intent/tweet?text=${scoreText}&url=${url}`;
    document.getElementById('share-linkedin').href = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${quizName}&summary=${scoreText}`;
    document.getElementById('share-whatsapp').href = `https://wa.me/?text=${scoreText} ${url}`;
    
    // Show results view
    showView(resultsContainer);
    
    // Save score to local storage if logged in
    if (githubToken) {
        saveScore(score, totalQuestions, elapsedTime);
    }
}

function calculateScore() {
    let score = 0;
    
    currentQuiz.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswers = question.answers && question.answers[0] ? question.answers[0] : [];
        
        if (currentQuiz.category === 'MRQ') {
            // For MRQ, all selected options must match correct answers
            if (userAnswer && Array.isArray(userAnswer)) {
                const userSet = new Set(userAnswer);
                const correctSet = new Set(correctAnswers);
                
                if (userSet.size === correctSet.size && 
                    [...userSet].every(value => correctSet.has(value))) {
                    score++;
                }
            }
        } else {
            // For MCQ, the selected option must be in correct answers
            if (userAnswer && correctAnswers.includes(userAnswer)) {
                score++;
            }
        }
    });
    
    return score;
}

function saveScore(score, totalQuestions, time) {
    // Get existing scores from local storage
    const scoresJson = localStorage.getItem('quizHubScores');
    const scores = scoresJson ? JSON.parse(scoresJson) : [];
    
    // Add new score
    scores.push({
        quiz: currentQuiz.title || 'Unnamed Quiz',
        score: score,
        totalQuestions: totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100),
        time: time,
        date: new Date().toISOString(),
        user: githubUsername || 'Anonymous'
    });
    
    // Save back to local storage
    localStorage.setItem('quizHubScores', JSON.stringify(scores));
}

function retryQuiz() {
    // Reset user answers
    userAnswers = Array(currentQuiz.questions.length).fill(null);
    currentQuestionIndex = 0;
    
    // Reset and start timer
    elapsedTime = 0;
    quizStartTime = new Date();
    if (quizTimer) clearInterval(quizTimer);
    quizTimer = setInterval(updateQuizTimer, 1000);
    
    // Show quiz view
    showView(quizContainer);
    renderQuestion();
}

function reviewAnswers() {
    // Show quiz container with review mode
    showView(quizContainer);
    
    // Start from the first question
    currentQuestionIndex = 0;
    renderQuestionWithAnswers();
}

function renderQuestionWithAnswers() {
    // First render the question normally
    renderQuestion();
    
    const question = currentQuiz.questions[currentQuestionIndex];
    const correctAnswers = question.answers && question.answers[0] ? question.answers[0] : [];
    const userAnswer = userAnswers[currentQuestionIndex];
    
    // Then highlight correct and incorrect answers
    document.querySelectorAll('.option').forEach(option => {
        const optionId = option.getAttribute('data-option-id');
        
        if (currentQuiz.category === 'MRQ') {
            // For MRQ
            if (correctAnswers.includes(optionId)) {
                option.classList.add('correct');
            } else if (userAnswer && userAnswer.includes(optionId)) {
                option.classList.add('incorrect');
            }
        } else {
            // For MCQ
            if (correctAnswers.includes(optionId)) {
                option.classList.add('correct');
            } else if (optionId === userAnswer) {
                option.classList.add('incorrect');
            }
        }
    });
    
    // Show feedback
    const feedbackContainer = document.getElementById('feedback-container');
    const feedbackText = document.getElementById('feedback-text');
    
    // Determine if the answer was correct
    let isCorrect;
    if (currentQuiz.category === 'MRQ') {
        if (userAnswer && Array.isArray(userAnswer)) {
            const userSet = new Set(userAnswer);
            const correctSet = new Set(correctAnswers);
            isCorrect = userSet.size === correctSet.size && 
                        [...userSet].every(value => correctSet.has(value));
        } else {
            isCorrect = false;
        }
    } else {
        isCorrect = userAnswer && correctAnswers.includes(userAnswer);
    }
    
    // Display appropriate feedback
    if (question.feedback) {
        if (isCorrect) {
            feedbackContainer.className = 'feedback-container feedback-correct';
            feedbackText.innerHTML = question.feedback.correct || 'Correct!';
        } else {
            feedbackContainer.className = 'feedback-container feedback-incorrect';
            feedbackText.innerHTML = question.feedback.incorrect || 'Incorrect.';
        }
        
        feedbackContainer.style.display = 'block';
    }
    
    // Change next button text
    const nextButton = document.getElementById('next-button');
    nextButton.textContent = currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Finish Review' : 'Next Question';
    
    // Remove click events from options
    document.querySelectorAll('.option').forEach(option => {
        const clone = option.cloneNode(true);
        option.parentNode.replaceChild(clone, option);
    });
}
