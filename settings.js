// DOM Elements
const addQuizBtn = document.getElementById('addQuizBtn');
const manageQuizzesBtn = document.getElementById('manageQuizzesBtn');
const manageQuizzesSection = document.getElementById('manageQuizzesSection');
const addQuizModal = document.getElementById('addQuizModal');
const quizForm = document.getElementById('quizForm');
const quizList = document.getElementById('quizList');
const cancelAddQuiz = document.getElementById('cancelAddQuiz');
const questionsContainer = document.getElementById('questionsContainer');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const quizCategory = document.getElementById('quizCategory');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const newCategoryName = document.getElementById('newCategoryName');
const categoryList = document.getElementById('categoryList');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const quizSearch = document.getElementById('quizSearch');
const categoryFilter = document.getElementById('categoryFilter');
const selectAllBtn = document.getElementById('selectAllBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadQuizzes();
    setupEventListeners();
});

function setupEventListeners() {
    // Quiz Management
    addQuizBtn.addEventListener('click', () => {
        loadCategoriesIntoDropdown();
        addQuizModal.style.display = 'flex';
    });

    cancelAddQuiz.addEventListener('click', () => {
        addQuizModal.style.display = 'none';
        resetForm();
    });

    manageQuizzesBtn.addEventListener('click', () => {
        manageQuizzesSection.style.display = manageQuizzesSection.style.display === 'none' ? 'block' : 'none';
        loadQuizzes();
    });

    addQuestionBtn.addEventListener('click', addQuestion);
    quizForm.addEventListener('submit', handleQuizSubmit);

    // Category Management
    addCategoryBtn.addEventListener('click', addNewCategory);

    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.querySelector(`.tab-content[data-tab="${tab.dataset.tab}"]`).classList.add('active');
        });
    });

    // Modal close
    addQuizModal.addEventListener('click', e => {
        if (e.target === addQuizModal) {
            addQuizModal.style.display = 'none';
            resetForm();
        }
    });

    // Filter and bulk actions
    quizSearch.addEventListener('input', filterQuizzes);
    categoryFilter.addEventListener('change', filterQuizzes);
    selectAllBtn.addEventListener('click', toggleSelectAll);
    deleteSelectedBtn.addEventListener('click', deleteSelectedQuizzes);

    // Import/Export functionality
    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', importData);
}

// Export/Import Functions
function exportData() {
    const data = {
        quizzes: JSON.parse(localStorage.getItem('quizzes') || '[]'),
        categories: JSON.parse(localStorage.getItem('categories') || '[]')
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `quiz_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!confirm('Importing data will overwrite your current quizzes and categories. Continue?')) {
        e.target.value = ''; // Reset file input
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!data.hasOwnProperty('quizzes') || !data.hasOwnProperty('categories')) {
                throw new Error('Invalid data format');
            }
            
            localStorage.setItem('quizzes', JSON.stringify(data.quizzes));
            localStorage.setItem('categories', JSON.stringify(data.categories));
            
            loadQuizzes();
            loadCategories();
            loadCategoriesIntoDropdown();
            
            alert('Data imported successfully!');
            e.target.value = ''; // Reset file input
        } catch (err) {
            console.error(err);
            alert('Error importing data: Invalid file format');
            e.target.value = ''; // Reset file input
        }
    };
    reader.readAsText(file);
}

// Existing functions from your original code remain unchanged below...
// (Include all your existing categoryFunctions, quizFunctions, questionFunctions, etc.)

// Category Functions
function loadCategories() {
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    categoryList.innerHTML = '';
    
    categories.forEach((category, index) => {
        const li = document.createElement('li');
        li.className = 'category-item';
        li.innerHTML = `
            <span>${category}</span>
            <div class="category-actions">
                <button class="btn btn-secondary btn-sm" onclick="editCategory(${index})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteCategory(${index})">Delete</button>
            </div>
        `;
        categoryList.appendChild(li);
    });
}

function loadCategoriesIntoDropdown() {
    quizCategory.innerHTML = '<option value="">Select a category</option>';
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        quizCategory.appendChild(option);
    });
}

function addNewCategory() {
    const categoryName = newCategoryName.value.trim();
    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }

    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    if (categories.includes(categoryName)) {
        alert('Category already exists');
        return;
    }

    categories.push(categoryName);
    localStorage.setItem('categories', JSON.stringify(categories));
    newCategoryName.value = '';
    loadCategories();
    loadCategoriesIntoDropdown();
}

function editCategory(index) {
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    const newName = prompt('Enter new category name:', categories[index]);
    
    if (newName && newName.trim() && !categories.includes(newName.trim())) {
        categories[index] = newName.trim();
        localStorage.setItem('categories', JSON.stringify(categories));
        loadCategories();
        loadCategoriesIntoDropdown();
    }
}

function deleteCategory(index) {
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const categoryToDelete = categories[index];
    
    // Check if any quizzes use this category
    const isCategoryInUse = quizzes.some(quiz => quiz.category === categoryToDelete);
    
    if (isCategoryInUse) {
        alert('Cannot delete this category because it is being used by one or more quizzes');
        return;
    }
    
    if (confirm(`Delete category "${categoryToDelete}"?`)) {
        categories.splice(index, 1);
        localStorage.setItem('categories', JSON.stringify(categories));
        loadCategories();
        loadCategoriesIntoDropdown();
    }
}

// Quiz Functions
function loadQuizzes() {
    quizList.innerHTML = '';
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');

    // Update category filter dropdown
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    quizzes.forEach((quiz, index) => {
        const li = document.createElement('li');
        li.className = 'quiz-item';
        
        const categoryDisplay = quiz.category && categories.includes(quiz.category) 
            ? quiz.category 
            : '<span style="color:#999">Uncategorized</span>';

        li.innerHTML = `
            <div>
                <label class="quiz-select">
                    <input type="checkbox" class="quiz-checkbox" data-index="${index}">
                </label>
                <strong>${quiz.title}</strong><br>
                <small>Category: ${categoryDisplay}</small><br>
                <small>${quiz.date} ${quiz.time || ''}</small>
            </div>
            <div class="quiz-actions">
                <button class="btn btn-secondary btn-sm" onclick="editQuiz(${index})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteQuiz(${index})">Delete</button>
            </div>
        `;
        li.dataset.category = quiz.category || 'Uncategorized';
        li.dataset.title = quiz.title.toLowerCase();
        quizList.appendChild(li);
    });
}

function filterQuizzes() {
    const searchTerm = quizSearch.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    document.querySelectorAll('.quiz-item').forEach(item => {
        const matchesSearch = item.dataset.title.includes(searchTerm);
        const matchesCategory = !selectedCategory || item.dataset.category === selectedCategory;
        
        item.style.display = (matchesSearch && matchesCategory) ? '' : 'none';
    });
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox');
    const allSelected = [...checkboxes].every(checkbox => checkbox.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allSelected;
    });
}

function deleteSelectedQuizzes() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('Please select at least one quiz to delete');
        return;
    }
    
    if (confirm(`Delete ${checkboxes.length} selected quiz(es)?`)) {
        const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        const indexesToDelete = [...checkboxes].map(checkbox => parseInt(checkbox.dataset.index));
        
        // Delete in reverse order to avoid index issues
        indexesToDelete.sort((a, b) => b - a).forEach(index => {
            quizzes.splice(index, 1);
        });
        
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
        loadQuizzes();
    }
}

function addQuestion() {
    const questionCount = questionsContainer.children.length + 1;
    const questionHTML = `
        <div class="question-item" data-question-id="${questionCount}">
            <div class="question-header">
                <span>Question ${questionCount}</span>
                <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.question-item').remove()">Remove</button>
            </div>
            <div class="form-group">
                <label>Question Text</label>
                <input type="text" class="form-control question-text">
            </div>
            <div class="question-type-selector">
                <div class="question-type-options">
                    <button type="button" class="question-type-btn active" data-type="multiple-choice">Multiple Choice</button>
                    <button type="button" class="question-type-btn" data-type="yes-no">Yes/No</button>
                    <button type="button" class="question-type-btn" data-type="short-answer">Short Answer</button>
                </div>
                
                <!-- Multiple Choice Question -->
                <div class="question-content active" data-type="multiple-choice">
                    <div class="form-group">
                        <label>Options (mark correct answer with radio button)</label>
                        <div id="options-container-${questionCount}">
                            <div class="option-input-group">
                                <input type="radio" name="correct-${questionCount}">
                                <input type="text" class="form-control option-text" placeholder="Option 1">
                            </div>
                            <div class="option-input-group">
                                <input type="radio" name="correct-${questionCount}">
                                <input type="text" class="form-control option-text" placeholder="Option 2">
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm" 
                                onclick="addOption('options-container-${questionCount}', 'correct-${questionCount}')">
                            Add Another Option
                        </button>
                        <!-- Void option - always available -->
                        <div class="option-input-group void-option">
                            <input type="radio" name="correct-${questionCount}">
                            <input type="text" class="form-control option-text" value="Void" readonly>
                        </div>
                    </div>
                </div>
                
                <!-- Yes/No Question -->
                <div class="question-content" data-type="yes-no">
                    <div class="form-group">
                        <label>Correct Answer</label>
                        <div>
                            <label class="yesno-option"><input type="radio" name="yn-${questionCount}" value="Yes"> Yes</label>
                            <label class="yesno-option"><input type="radio" name="yn-${questionCount}" value="No"> No</label>
                            <label class="yesno-option"><input type="radio" name="yn-${questionCount}" value="Void"> Void</label>
                        </div>
                    </div>
                </div>
                
                <!-- Short Answer Question -->
                <div class="question-content" data-type="short-answer">
                    <div class="form-group">
                        <label>Correct Answer</label>
                        <input type="text" class="form-control correct-answer">
                        <div style="margin-top: 10px;">
                            <label class="yesno-option">
                                <input type="checkbox" class="void-checkbox">
                                Mark as Void
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    questionsContainer.insertAdjacentHTML('beforeend', questionHTML);

    // Question type switching
    const questionItem = questionsContainer.lastElementChild;
    const typeButtons = questionItem.querySelectorAll('.question-type-btn');
    const contentDivs = questionItem.querySelectorAll('.question-content');

    typeButtons.forEach(button => {
        button.addEventListener('click', () => {
            typeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            contentDivs.forEach(div => div.classList.remove('active'));
            const activeContent = questionItem.querySelector(`.question-content[data-type="${button.dataset.type}"]`);
            activeContent.classList.add('active');
        });
    });
}

function addOption(containerId, radioName) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const optionCount = container.children.length + 1;
    const optionHTML = `
        <div class="option-input-group">
            <input type="radio" name="${radioName}">
            <input type="text" class="form-control option-text" placeholder="Option ${optionCount}">
        </div>
    `;
    container.insertAdjacentHTML('beforeend', optionHTML);
}

function resetForm() {
    quizForm.reset();
    questionsContainer.innerHTML = '';
}

function editQuiz(index) {
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const quiz = quizzes[index];
    if (!quiz) return alert('Quiz not found');

    resetForm();
    loadCategoriesIntoDropdown();

    document.getElementById('quizTitle').value = quiz.title || '';
    document.getElementById('quizDescription').value = quiz.description || '';
    document.getElementById('quizDateTime').value = `${quiz.date}T${quiz.time || '00:00'}`;
    
    if (quiz.category) {
        const categorySelect = document.getElementById('quizCategory');
        for (let i = 0; i < categorySelect.options.length; i++) {
            if (categorySelect.options[i].value === quiz.category) {
                categorySelect.selectedIndex = i;
                break;
            }
        }
    }

    quiz.questions.forEach((q, i) => {
        addQuestion();
        const questionItem = questionsContainer.children[i];
        questionItem.querySelector('.question-text').value = q.text || '';

        const tabs = questionItem.querySelectorAll('.question-type-btn');
        const contents = questionItem.querySelectorAll('.question-content');
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        const activeTab = questionItem.querySelector(`.question-type-btn[data-type="${q.type}"]`);
        const activeContent = questionItem.querySelector(`.question-content[data-type="${q.type}"]`);
        if (activeTab && activeContent) {
            activeTab.classList.add('active');
            activeContent.classList.add('active');
        }

        if (q.type === 'multiple-choice') {
            const optionsContainer = questionItem.querySelector(`#options-container-${i+1}`) || 
                                   questionItem.querySelector('.question-options > div');
            if (optionsContainer) {
                optionsContainer.innerHTML = '';
                q.options.forEach((opt, idx) => {
                    const checked = (idx === q.correctIndex) ? 'checked' : '';
                    const questionId = questionItem.dataset.questionId;
                    const isVoid = (opt === 'Void');
                    const readonly = isVoid ? 'readonly' : '';
                    const optionHTML = `
                        <div class="option-input-group ${isVoid ? 'void-option' : ''}">
                            <input type="radio" name="correct-${questionId || i+1}" ${checked}>
                            <input type="text" class="form-control option-text" value="${opt}" ${readonly}>
                        </div>
                    `;
                    optionsContainer.insertAdjacentHTML('beforeend', optionHTML);
                });
            }
        } else if (q.type === 'yes-no') {
            const radioName = `yn-${i+1}`;
            const radios = questionItem.querySelectorAll(`input[type="radio"][name="${radioName}"]`);
            radios.forEach(radio => {
                if (radio.value === q.correctAnswer) radio.checked = true;
            });
        } else if (q.type === 'short-answer') {
            questionItem.querySelector('.correct-answer').value = q.correctAnswer || '';
            if (q.isVoid) {
                questionItem.querySelector('.void-checkbox').checked = true;
            }
        }
    });

    addQuizModal.style.display = 'flex';
}

function deleteQuiz(index) {
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    if (confirm(`Delete quiz "${quizzes[index].title}"?`)) {
        quizzes.splice(index, 1);
        localStorage.setItem('quizzes', JSON.stringify(quizzes));
        loadQuizzes();
    }
}

function handleQuizSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('quizTitle').value.trim();
    const description = document.getElementById('quizDescription').value.trim();
    const dateTime = document.getElementById('quizDateTime').value;
    const category = document.getElementById('quizCategory').value;

    if (!title) {
        alert('Quiz title is required.');
        return;
    }

    const questions = [];
    const questionItems = questionsContainer.querySelectorAll('.question-item');

    if (questionItems.length === 0) {
        alert('Please add at least one question.');
        return;
    }

    questionItems.forEach((qItem, i) => {
        const qText = qItem.querySelector('.question-text').value.trim();
        if (!qText) {
            alert(`Question ${i + 1}: Text is required.`);
            return;
        }

        const activeTab = qItem.querySelector('.question-type-btn.active');
        if (!activeTab) {
            alert(`Question ${i + 1}: Select a question type.`);
            return;
        }
        const qType = activeTab.dataset.type;

        if (qType === 'multiple-choice') {
            const options = [...qItem.querySelectorAll('.option-text')].map(opt => opt.value.trim());
            if (options.length < 2) {
                alert(`Question ${i + 1}: Multiple Choice needs at least 2 options.`);
                return;
            }
            const correctIndex = [...qItem.querySelectorAll(`input[type="radio"]`)].findIndex(r => r.checked);
            if (correctIndex === -1) {
                alert(`Question ${i + 1}: Select the correct answer.`);
                return;
            }
            questions.push({ 
                text: qText, 
                type: qType, 
                options, 
                correctIndex,
                hasVoid: options[correctIndex] === 'Void'
            });
        } 
        else if (qType === 'yes-no') {
            const answer = qItem.querySelector(`input[type="radio"]:checked`)?.value;
            if (!answer) {
                alert(`Question ${i + 1}: Select Yes, No, or Void.`);
                return;
            }
            questions.push({ 
                text: qText, 
                type: qType, 
                correctAnswer: answer,
                isVoid: answer === 'Void'
            });
        }
        else if (qType === 'short-answer') {
            const answer = qItem.querySelector('.correct-answer').value.trim();
            if (!answer) {
                alert(`Question ${i + 1}: Provide correct answer.`);
                return;
            }
            const isVoid = qItem.querySelector('.void-checkbox').checked;
            questions.push({ 
                text: qText, 
                type: qType, 
                correctAnswer: answer,
                isVoid
            });
        }
    });

    const newQuiz = {
        title,
        description,
        category,
        date: dateTime.split('T')[0],
        time: dateTime.split('T')[1] || '00:00',
        questions
    };

    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    const existingIndex = quizzes.findIndex(q => q.title === title);
    
    if (existingIndex !== -1) {
        quizzes[existingIndex] = newQuiz;
    } else {
        quizzes.push(newQuiz);
    }

    localStorage.setItem('quizzes', JSON.stringify(quizzes));
    alert('Quiz saved successfully!');
    addQuizModal.style.display = 'none';
    resetForm();
    loadQuizzes();
}

// Global functions
window.editQuiz = editQuiz;
window.deleteQuiz = deleteQuiz;
window.deleteCategory = deleteCategory;
window.addOption = addOption;
window.editCategory = editCategory;
