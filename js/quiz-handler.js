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
        
        // Hard-code quiz file paths for now
        const quizFiles = [
            'quizzes/example.json'
        ];
        
        // Reset quizzes array
        quizzes = [];
        
        // Fetch each quiz file
        for (const filePath of quizFiles) {
            try {
                const quizResponse = await fetch(filePath);
                if (quizResponse.ok) {
                    const quiz = await quizResponse.json();
                    quiz.filename = filePath.split('/').pop();
                    quizzes.push(quiz);
                }
            } catch (error) {
                console.error(`Error loading quiz ${filePath}:`, error);
            }
        }
        
        // Render quiz cards
        renderQuizCards();
    } catch (error) {
        console.error('Error loading quizzes:', error);
        quizCardsContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Error loading quizzes: ${error.message}
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
        
        const cardHtml = `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="quiz-card shadow-sm">
                    <div class="quiz-card-header">
                        <h3 class="h5 mb-0">${quiz.title || 'Unnamed Quiz'}</h3>
                    </div>
                    <div class="quiz-card-body">
                        <p class="mb-3">${quiz.stimulus ? stripHtml(quiz.stimulus) : 'No description available'}</p>
                        <div class="d-flex justify-content-between mb-3">
                            <span class="badge bg-secondary">${difficulty}</span>
                            <span class="badge bg-info">${topic}</span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-question-circle"></i> ${questionCount} questions</span>
                            <button class="btn btn-primary start-quiz-btn" data-quiz-index="${index}">
                                Start Quiz
                            </button>
                        </div>
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
