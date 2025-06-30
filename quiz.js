// Quiz Interface JavaScript
// Updated with proper void answer handling

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
    categorySelect.addEventListener('change', filterQuizzesByCategory);
}

function loadQuizzesFromStorage() {
    try {
        allQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
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
    filteredQuizzes = selectedCategory === 'all' 
        ? [...allQuizzes] 
        : allQuizzes.filter(quiz => quiz.category === selectedCategory);
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
    
    const limit = parseInt(questionLimit.value);
    if (limit < filteredQuizzes.length) {
        filteredQuizzes = shuffleArray([...filteredQuizzes]).slice(0, limit);
    }
    
    categoryDropdown.style.display = 'none';
    quizInterface.style.display = 'flex';
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
    
    document.querySelectorAll('.item').forEach((item, i) => {
        item.style.backgroundColor = i === index ? '#e3f2fd' : '';
    });
}

function displayQuizDetails() {
    if (!currentQuiz) return;
    
    emptyState.style.display = 'none';
    quizDetails.style.display = 'block';
    quizTitle.textContent = currentQuiz.title;
    quizDescription.textContent = currentQuiz.description || 'No description';
    quizDateTime.textContent = `${currentQuiz.date || 'No date'} ${currentQuiz.time || ''}`;
    displayQuestions();
}

function displayQuestions() {
    if (!currentQuiz?.questions) {
        quizContent.innerHTML = '<tr><td colspan="2">No questions available</td></tr>';
        return;
    }
    
    quizContent.innerHTML = '';
    
    currentQuiz.questions.forEach((question, qIndex) => {
        const row = document.createElement('tr');
        row.className = 'option-row';
        row.dataset.questionIndex = qIndex;
        
        const answerCell = document.createElement('td');
        answerCell.className = 'answer-cell';
        answerCell.innerHTML = generateAnswerOptions(question, qIndex);
        
        const questionCell = document.createElement('td');
        questionCell.className = 'question-cell';
        const voidId = `q${currentQuiz.index}_${qIndex}_void`;
        
        questionCell.innerHTML = `
            <label class="void-checkbox-container">
                <input type="checkbox" id="${voidId}" class="void-checkbox" data-question="${qIndex}">
                <span class="question-text">${question.text}</span>
            </label>
        `;
        
        row.appendChild(answerCell);
        row.appendChild(questionCell);
        quizContent.appendChild(row);

        const voidCheckbox = questionCell.querySelector('.void-checkbox');
        voidCheckbox.addEventListener('change', function() {
            if (this.checked) {
                answerCell.querySelectorAll('input[type="radio"]').forEach(opt => opt.checked = false);
                answerCell.querySelectorAll('textarea').forEach(t => t.value = '');
            }
        });

        answerCell.querySelectorAll('input[type="radio"], textarea').forEach(input => {
            input.addEventListener('change', function() {
                if (this.checked || this.tagName === 'TEXTAREA') {
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
                           value="${optIndex}" data-question="${qIndex}">
                    <label for="${inputId}">${option}</label>
                </div>
            `;
        });
    } else if (question.type === 'yes-no') {
        html += `
            <div class="checkbox-option">
                <input type="radio" id="q${quizIndex}_${qIndex}_yes" name="q${quizIndex}_${qIndex}" 
                       value="Yes" data-question="${qIndex}">
                <label for="q${quizIndex}_${qIndex}_yes">Yes</label>
            </div>
            <div class="checkbox-option">
                <input type="radio" id="q${quizIndex}_${qIndex}_no" name="q${quizIndex}_${qIndex}" 
                       value="No" data-question="${qIndex}">
                <label for="q${quizIndex}_${qIndex}_no">No</label>
            </div>
        `;
    } else if (question.type === 'short-answer') {
        html += `
            <div class="checkbox-option">
                <textarea id="q${quizIndex}_${qIndex}_text" class="short-answer" 
                          data-question="${qIndex}" placeholder="Enter your answer"></textarea>
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
        const answer = { type: question.type };
        
        if (voidCheckbox?.checked) {
            answer.answer = 'Void';
            answer.isVoid = true;
            answer.isCorrect = (question.correctAnswer === 'Void');
        } else {
            if (question.type === 'multiple-choice' || question.type === 'yes-no') {
                const selectedInput = document.querySelector(`input[name="q${quizIndex}_${qIndex}"]:checked`);
                if (selectedInput) {
                    answer.answer = selectedInput.value;
                    answer.isVoid = false;
                    answer.isCorrect = checkAnswerCorrectness(question, selectedInput.value);
                } else {
                    allAnswered = false;
                    return;
                }
            } else if (question.type === 'short-answer') {
                const textArea = document.querySelector(`#q${quizIndex}_${qIndex}_text`);
                if (textArea?.value.trim()) {
                    answer.answer = textArea.value.trim();
                    answer.isVoid = false;
                    answer.isCorrect = checkAnswerCorrectness(question, textArea.value.trim());
                } else {
                    allAnswered = false;
                    return;
                }
            }
        }
        
        answers[qIndex] = answer;
    });
    
    userAnswers[quizIndex] = answers;
    
    if (allAnswered) {
        completedQuizzes.add(quizIndex);
        quizResults[quizIndex] = calculateQuizScore(currentQuiz, answers);
    }
    
    displayQuizList();
    updateProgress();
    saveUserProgress();
}

function checkAnswerCorrectness(question, userAnswer) {
    if (userAnswer === 'Void') {
        // Void is correct if the question's correct answer is Void
        return question.correctAnswer === 'Void';
    }
    
    if (question.type === 'multiple-choice') {
        return parseInt(userAnswer) === question.correctIndex;
    } else if (question.type === 'yes-no') {
        return userAnswer === question.correctAnswer;
    } else if (question.type === 'short-answer') {
        return userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
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
            if (userAnswer.isCorrect) {
                correct++;
            }
        } else if (userAnswer.isCorrect) {
            correct++;
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
    
    document.querySelectorAll('.item').forEach(item => {
        item.style.backgroundColor = '';
    });
}

function updateRemainingCount() {
    remainingCount.textContent = `${filteredQuizzes.length - completedQuizzes.size} left`;
}

function updateProgress() {
    progressIndicator.textContent = `${completedQuizzes.size}/${filteredQuizzes.length} quizzes completed`;
    updateRemainingCount();
}

function filterQuestions() {
    const searchTerm = questionSearch.value.toLowerCase();
    document.querySelectorAll('#quiz-content tr').forEach(row => {
        const questionText = row.querySelector('.question-text');
        if (questionText) {
            row.style.display = questionText.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
        }
    });
}

function startTimer() {
    startTime = new Date();
    timerDisplay.style.display = 'block';
    
    timer = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `Time: ${minutes}:${seconds}`;
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
    
    if (completedQuizzes.size < filteredQuizzes.length && 
        !confirm(`You have only completed ${completedQuizzes.size} out of ${filteredQuizzes.length} quizzes. Submit anyway?`)) {
        return;
    }
    
    const finalResults = generateDetailedResults();
    stopTimer();
    saveFinalResults(finalResults);
    window.location.href = 'results.html';
}

function generateDetailedResults() {
    return filteredQuizzes.map((quiz, index) => {
        if (!completedQuizzes.has(index) || !quizResults[index] || !userAnswers[index]) {
            return null;
        }

        const quizResult = quizResults[index];
        const answers = userAnswers[index];
        
        const detailedResults = quiz.questions.map((question, qIndex) => {
            const userAnswer = answers[qIndex];
            
            let userAnswerText = 'No answer provided';
            let correctAnswer = question.correctAnswer;
            let isCorrect = false;
            let isVoid = false;

            if (userAnswer) {
                isVoid = userAnswer.isVoid;
                
                if (isVoid) {
                    userAnswerText = 'Void';
                    isCorrect = userAnswer.isCorrect;
                    correctAnswer = 'Void';
                } else {
                    userAnswerText = userAnswer.answer;
                    isCorrect = userAnswer.isCorrect;
                }
                
                if (question.type === 'multiple-choice' && !isVoid) {
                    correctAnswer = question.options[question.correctIndex];
                }
            }

            return {
                question: question.text,
                userAnswer: userAnswerText,
                correctAnswer: correctAnswer,
                isCorrect: isCorrect,
                isVoid: isVoid
            };
        }).filter(Boolean);

        return {
            quizTitle: quiz.title,
            score: quizResult.score,
            totalQuestions: quizResult.total,
            percentage: quizResult.percentage,
            dateTaken: new Date().toISOString(),
            results: detailedResults,
            voidCount: quizResult.voidCount
        };
    }).filter(Boolean);
}

function saveFinalResults(results) {
    try {
        const existingResults = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        existingResults.push(...results);
        localStorage.setItem('quizHistory', JSON.stringify(existingResults));
    } catch (error) {
        console.error('Error saving final results:', error);
    }
}

function saveUserProgress() {
    try {
        localStorage.setItem('quizProgress', JSON.stringify({
            userAnswers,
            completedQuizzes: Array.from(completedQuizzes),
            quizResults,
            startTime
        }));
    } catch (error) {
        console.error('Error saving user progress:', error);
    }
}

function loadUserProgress() {
    try {
        const progress = JSON.parse(localStorage.getItem('quizProgress') || '{}');
        if (progress.userAnswers) {
            userAnswers = progress.userAnswers || {};
            completedQuizzes = new Set(progress.completedQuizzes || []);
            quizResults = progress.quizResults || [];
            startTime = progress.startTime ? new Date(progress.startTime) : null;
            
            if (startTime && (new Date() - startTime) / 1000 < 3600) {
                startTimer();
            }
        }
    } catch (error) {
        console.error('Error loading user progress:', error);
    }
}
