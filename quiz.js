// Quiz Interface JavaScript
// This connects to the settings system and manages quiz taking

// Global variables
let allQuizzes = [];
let filteredQuizzes = [];
let currentQuiz = null;
let userAnswers = {};
let completedQuizzes = new Set();
let quizResults = [];
let timer = null;
let startTime = null;

// DOM Elements
const categoryDropdown = document.getElementById('categoryDropdown');
const categorySelect = document.getElementById('categorySelect');
const questionLimit = document.getElementById('questionLimit');
const startQuizBtn = document.getElementById('startQuizBtn');
const quizInterface = document.getElementById('quizInterface');
const quizList = document.getElementById('quiz-list');
const remainingCount = document.getElementById('remaining-count');
const emptyState = document.getElementById('empty-state');
const quizDetails = document.getElementById('quiz-details');
const quizTitle = document.getElementById('quiz-title');
const quizDescription = document.getElementById('quiz-description');
const quizDateTime = document.getElementById('quiz-date-time');
const quizContent = document.getElementById('quiz-content');
const saveQuizBtn = document.getElementById('save-quiz');
const submitAllBtn = document.getElementById('submit-all-quizzes');
const progressIndicator = document.getElementById('progress-indicator');
const questionSearch = document.getElementById('question-search');
const closeQuizDetails = document.getElementById('close-quiz-details');
const timerDisplay = document.getElementById('timer');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadQuizzesFromStorage();
    loadCategoriesIntoDropdown();
    setupEventListeners();
    loadUserProgress();
});

function setupEventListeners() {
    startQuizBtn.addEventListener('click', startQuizSession);
    saveQuizBtn.addEventListener('click', saveCurrentQuiz);
    submitAllBtn.addEventListener('click', submitAllQuizzes);
    closeQuizDetails.addEventListener('click', closeCurrentQuiz);
    questionSearch.addEventListener('input', filterQuestions);
    
    // Category change event
    categorySelect.addEventListener('change', filterQuizzesByCategory);
}

function loadQuizzesFromStorage() {
    try {
        allQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        console.log('Loaded quizzes:', allQuizzes.length);
    } catch (error) {
        console.error('Error loading quizzes:', error);
        allQuizzes = [];
    }
}

function loadCategoriesIntoDropdown() {
    try {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        categorySelect.innerHTML = '<option value="all">All Categories</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
        
        if (categories.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No categories available';
            categorySelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function filterQuizzesByCategory() {
    const selectedCategory = categorySelect.value;
    
    if (selectedCategory === 'all') {
        filteredQuizzes = [...allQuizzes];
    } else {
        filteredQuizzes = allQuizzes.filter(quiz => quiz.category === selectedCategory);
    }
}

function startQuizSession() {
    if (allQuizzes.length === 0) {
        alert('No quizzes available. Please create some quizzes first.');
        return;
    }
    
    filterQuizzesByCategory();
    
    if (filteredQuizzes.length === 0) {
        alert('No quizzes available for the selected category.');
        return;
    }
    
    // Limit the number of quizzes based on selection
    const limit = parseInt(questionLimit.value);
    if (limit < filteredQuizzes.length) {
        filteredQuizzes = shuffleArray([...filteredQuizzes]).slice(0, limit);
    }
    
    // Hide category dropdown and show quiz interface
    categoryDropdown.style.display = 'none';
    quizInterface.style.display = 'flex';
    
    // Initialize quiz session
    completedQuizzes.clear();
    userAnswers = {};
    quizResults = [];
    
    displayQuizList();
    startTimer();
    updateProgress();
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function displayQuizList() {
    quizList.innerHTML = '';
    
    filteredQuizzes.forEach((quiz, index) => {
        const quizItem = document.createElement('div');
        quizItem.className = `item ${completedQuizzes.has(index) ? 'completed' : ''}`;
        quizItem.onclick = () => selectQuiz(index);
        
        quizItem.innerHTML = `
            <div class="quiz-item-content">
                <div class="quiz-title">${quiz.title}</div>
                <div class="quiz-meta">
                    <span>${quiz.date || 'No date'}</span>
                    <span>${quiz.time || ''}</span>
                    <span>${quiz.category || 'Uncategorized'}</span>
                </div>
                <div class="quiz-description">${quiz.description || 'No description'}</div>
            </div>
        `;
        
        quizList.appendChild(quizItem);
    });
    
    updateRemainingCount();
}

function selectQuiz(index) {
    currentQuiz = { ...filteredQuizzes[index], index };
    displayQuizDetails();
    
    // Mark as selected visually
    document.querySelectorAll('.item').forEach((item, i) => {
        item.style.backgroundColor = i === index ? '#e3f2fd' : '';
    });
}

function displayQuizDetails() {
    if (!currentQuiz) return;
    
    emptyState.style.display = 'none';
    quizDetails.style.display = 'block';
    
    // Set quiz header info
    quizTitle.textContent = currentQuiz.title;
    quizDescription.textContent = currentQuiz.description || 'No description';
    quizDateTime.textContent = `${currentQuiz.date || 'No date'} ${currentQuiz.time || ''}`;
    
    // Display questions
    displayQuestions();
}

function displayQuestions() {
    if (!currentQuiz || !currentQuiz.questions) {
        quizContent.innerHTML = '<tr><td colspan="2">No questions available</td></tr>';
        return;
    }
    
    quizContent.innerHTML = '';
    
    currentQuiz.questions.forEach((question, qIndex) => {
        const row = document.createElement('tr');
        row.className = 'option-row';
        row.dataset.questionIndex = qIndex;
        
        // Answer cell - only contains actual answer options
        const answerCell = document.createElement('td');
        answerCell.className = 'answer-cell';
        answerCell.innerHTML = generateAnswerOptions(question, qIndex);
        
        // Question cell with integrated void checkbox
        const questionCell = document.createElement('td');
        questionCell.className = 'question-cell';
        
        // Create unique ID for the void checkbox
        const voidId = `q${currentQuiz.index}_${qIndex}_void`;
        
        questionCell.innerHTML = `
            <label class="void-checkbox-container">
                <input type="checkbox" id="${voidId}" 
                       class="void-checkbox" data-question="${qIndex}">
                <span class="question-text">${question.text}</span>
            </label>
        `;
        
        row.appendChild(answerCell);
        row.appendChild(questionCell);
        quizContent.appendChild(row);

        // Add event listener for the void checkbox
        const voidCheckbox = questionCell.querySelector('.void-checkbox');
        voidCheckbox.addEventListener('change', function() {
            // Unselect other options if void is checked
            if (this.checked) {
                const otherOptions = answerCell.querySelectorAll('input[type="radio"]');
                otherOptions.forEach(opt => opt.checked = false);
            }
        });

        // Add event listener to answer options
        answerCell.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.checked) {
                    voidCheckbox.checked = false;
                }
            });
        });
    });
    
    restoreAnswers();
}

function generateAnswerOptions(question, qIndex) {
    const quizIndex = currentQuiz.index;
    let html = '';
    
    if (question.type === 'multiple-choice') {
        question.options.forEach((option, optIndex) => {
            const inputId = `q${quizIndex}_${qIndex}_opt${optIndex}`;
            html += `
                <div class="checkbox-option">
                    <input type="radio" id="${inputId}" name="q${quizIndex}_${qIndex}" 
                           value="${optIndex}" data-question="${qIndex}" />
                    <label for="${inputId}">${option}</label>
                </div>
            `;
        });
    } 
    else if (question.type === 'yes-no') {
        const yesId = `q${quizIndex}_${qIndex}_yes`;
        const noId = `q${quizIndex}_${qIndex}_no`;
        
        html += `
            <div class="checkbox-option">
                <input type="radio" id="${yesId}" name="q${quizIndex}_${qIndex}" 
                       value="Yes" data-question="${qIndex}" />
                <label for="${yesId}">Yes</label>
            </div>
            <div class="checkbox-option">
                <input type="radio" id="${noId}" name="q${quizIndex}_${qIndex}" 
                       value="No" data-question="${qIndex}" />
                <label for="${noId}">No</label>
            </div>
        `;
    }
    
    return html;
}

function saveCurrentQuiz() {
    if (!currentQuiz) return;
    
    const quizIndex = currentQuiz.index;
    const answers = {};
    let allAnswered = true;
    
    currentQuiz.questions.forEach((question, qIndex) => {
        const voidCheckbox = document.querySelector(`.void-checkbox[data-question="${qIndex}"]`);
        
        if (voidCheckbox && voidCheckbox.checked) {
            // Handle void selection
            answers[qIndex] = {
                type: question.type,
                answer: 'void',
                isVoid: true,
                isCorrect: question.correctAnswer === 'Void' // Check if void is the correct answer
            };
        } else {
            // Handle normal answers
            if (question.type === 'multiple-choice' || question.type === 'yes-no') {
                const selectedInput = document.querySelector(`input[name="q${quizIndex}_${qIndex}"]:checked`);
                if (selectedInput) {
                    answers[qIndex] = {
                        type: question.type,
                        answer: selectedInput.value,
                        isVoid: false,
                        isCorrect: checkAnswerCorrectness(question, selectedInput.value)
                    };
                } else {
                    allAnswered = false;
                }
            } else if (question.type === 'short-answer') {
                const textArea = document.querySelector(`#q${quizIndex}_${qIndex}_text`);
                if (textArea && textArea.value.trim()) {
                    answers[qIndex] = {
                        type: question.type,
                        answer: textArea.value.trim(),
                        isVoid: false,
                        isCorrect: textArea.value.trim().toLowerCase() === question.correctAnswer.toLowerCase()
                    };
                } else {
                    allAnswered = false;
                }
            }
        }
    });
    
    userAnswers[quizIndex] = answers; // Save answers for the current quiz
    
    if (allAnswered) {
        completedQuizzes.add(quizIndex);
        const result = calculateQuizScore(currentQuiz, answers);
        quizResults[quizIndex] = result;
    }
    
    displayQuizList();
    updateProgress();
    saveUserProgress();
}

function checkAnswerCorrectness(question, userAnswer) {
    if (question.type === 'multiple-choice') {
        return parseInt(userAnswer) === question.correctIndex;
    } else if (question.type === 'yes-no') {
        return userAnswer === question.correctAnswer;
    }
    return false;
}

function calculateQuizScore(quiz, answers) {
    let correct = 0;
    let total = 0;
    let voidCount = 0;

    quiz.questions.forEach((question, qIndex) => {
        const userAnswer = answers[qIndex];
        if (!userAnswer) return;

        total++;
        
        if (userAnswer.isVoid) {
            voidCount++;
            if (userAnswer.isCorrect) correct++;
        } else {
            if (userAnswer.isCorrect) correct++;
        }
    });

    return {
        correct,
        total,
        voidCount,
        score: correct,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0
    };
}

function restoreAnswers() {
    if (!currentQuiz || !userAnswers[currentQuiz.index]) return;
    
    const answers = userAnswers[currentQuiz.index];
    const quizIndex = currentQuiz.index;
    
    Object.keys(answers).forEach(qIndex => {
        const answer = answers[qIndex];
        
        if (answer.isVoid) {
            const voidCheckbox = document.querySelector(`.void-checkbox[data-question="${qIndex}"]`);
            if (voidCheckbox) voidCheckbox.checked = true;
        } else if (answer.type === 'multiple-choice' || answer.type === 'yes-no') {
            const input = document.querySelector(`input[name="q${quizIndex}_${qIndex}"][value="${answer.answer}"]`);
            if (input) input.checked = true;
        } else if (answer.type === 'short-answer') {
            const textArea = document.querySelector(`#q${quizIndex}_${qIndex}_text`);
            if (textArea) textArea.value = answer.answer || '';
        }
    });
}

function closeCurrentQuiz() {
    currentQuiz = null;
    emptyState.style.display = 'flex';
    quizDetails.style.display = 'none';
    
    // Clear selection highlighting
    document.querySelectorAll('.item').forEach(item => {
        item.style.backgroundColor = '';
    });
}

function updateRemainingCount() {
    const remaining = filteredQuizzes.length - completedQuizzes.size;
    remainingCount.textContent = `${remaining} left`;
}

function updateProgress() {
    const completed = completedQuizzes.size;
    const total = filteredQuizzes.length;
    progressIndicator.textContent = `${completed}/${total} quizzes completed`;
    updateRemainingCount();
}

function filterQuestions() {
    const searchTerm = questionSearch.value.toLowerCase();
    const rows = document.querySelectorAll('#quiz-content tr');
    
    rows.forEach(row => {
        const questionText = row.querySelector('.question-text');
        if (questionText) {
            const matches = questionText.textContent.toLowerCase().includes(searchTerm);
            row.style.display = matches ? '' : 'none';
        }
    });
}

function startTimer() {
    startTime = new Date();
    timerDisplay.style.display = 'block';
    
    timer = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
    timerDisplay.style.display = 'none';
}

function submitAllQuizzes() {
    if (completedQuizzes.size === 0) {
        alert('No quizzes completed yet!');
        return;
    }
    
    if (completedQuizzes.size < filteredQuizzes.length) {
        if (!confirm(`You have only completed ${completedQuizzes.size} out of ${filteredQuizzes.length} quizzes. Submit anyway?`)) {
            return;
        }
    }
    
    // Generate final results
    const finalResults = generateDetailedResults();
    
    // Stop timer
    stopTimer();
    
    // Save final results and redirect to results page
    saveFinalResults(finalResults);
    
    // Redirect to results page
    window.location.href = 'results.html';
}

function generateDetailedResults() {
    const results = [];
    
    filteredQuizzes.forEach((quiz, index) => {
        if (completedQuizzes.has(index) && quizResults[index] && userAnswers[index]) {
            const quizResult = quizResults[index];
            const answers = userAnswers[index];
            
            const detailedResults = quiz.questions.map((question, qIndex) => {
                const userAnswer = answers[qIndex];
                let isCorrect = false;
                let correctAnswer = '';
                let userAnswerText = 'No answer provided';
                let isVoid = false;
                
                if (userAnswer) {
                    isVoid = userAnswer.isVoid;
                    isCorrect = userAnswer.isCorrect;
                    
                    if (isVoid) {
                        userAnswerText = 'Void';
                        correctAnswer = question.correctAnswer === 'Void' ? 'Void' : question.correctAnswer;
                    } else {
                        if (question.type === 'multiple-choice') {
                            correctAnswer = question.options[question.correctIndex];
                            userAnswerText = question.options[parseInt(userAnswer.answer)] || 'Invalid answer';
                        } else if (question.type === 'yes-no') {
                            correctAnswer = question.correctAnswer;
                            userAnswerText = userAnswer.answer;
                        } else if (question.type === 'short-answer') {
                            correctAnswer = question.correctAnswer;
                            userAnswerText = userAnswer.answer;
                        }
                    }
                }
                
                return {
                    question: question.text,
                    userAnswer: userAnswerText,
                    correctAnswer: correctAnswer,
                    isCorrect: isCorrect,
                    isVoid: isVoid
                };
            });
            
            results.push({
                quizTitle: quiz.title,
                score: quizResult.score,
                totalQuestions: quizResult.total,
                percentage: quizResult.percentage,
                dateTaken: new Date().toISOString(),
                results: detailedResults
            });
        }
    });
    
    return results;
}

function saveFinalResults(results) {
    try {
        localStorage.setItem('allQuizResults', JSON.stringify(results));
        
        // Also save to quiz results history
        const savedResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        savedResults.push({
            timestamp: new Date().toISOString(),
            sessionId: Date.now(),
            results: results,
            totalQuizzes: results.length,
            averageScore: results.reduce((sum, r) => sum + r.percentage, 0) / results.length
        });
        localStorage.setItem('quizResults', JSON.stringify(savedResults));
    } catch (error) {
        console.error('Error saving results:', error);
    }
}

function saveUserProgress() {
    try {
        const progress = {
            userAnswers,
            completedQuizzes: Array.from(completedQuizzes),
            quizResults,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('quizProgress', JSON.stringify(progress));
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

function loadUserProgress() {
    try {
        const progress = JSON.parse(localStorage.getItem('quizProgress') || '{}');
        if (progress.userAnswers) {
            userAnswers = progress.userAnswers;
            completedQuizzes = new Set(progress.completedQuizzes || []);
            quizResults = progress.quizResults || [];
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

// Export functions for potential external use
window.quizInterface = {
    startQuizSession,
    saveCurrentQuiz,
    submitAllQuizzes,
    loadQuizzesFromStorage
};
