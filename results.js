document.addEventListener('DOMContentLoaded', function() {
  // Load results from localStorage
  const allResults = JSON.parse(localStorage.getItem('allQuizResults')) || [];
  
  if (!allResults || allResults.length === 0) {
    window.location.href = 'index.html';
    return;
  }
  
  // Set the results date
  document.getElementById('results-date').textContent = 
    `Completed on ${new Date(allResults[0].dateTaken).toLocaleString()}`;
  
  // Calculate summary statistics
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalScore = 0;
  
  allResults.forEach(result => {
    totalQuestions += result.totalQuestions;
    totalCorrect += result.score;
    totalScore += result.percentage;
  });
  
  const averageScore = Math.round(totalScore / allResults.length);
  
  // Update summary elements
  document.getElementById('total-quizzes').textContent = allResults.length;
  document.getElementById('total-questions').textContent = totalQuestions;
  document.getElementById('correct-answers').textContent = totalCorrect;
  document.getElementById('average-score').textContent = `${averageScore}%`;
  
  // Display individual quiz results
  const quizResultsContainer = document.getElementById('quiz-results');
  
  allResults.forEach((result, index) => {
    const quizResult = document.createElement('div');
    quizResult.className = 'quiz-result';
    
    quizResult.innerHTML = `
      <div class="quiz-result-header">
        <h3 class="quiz-result-title">${index + 1}. ${result.quizTitle}</h3>
        <div class="quiz-result-score">${result.percentage}% (${result.score}/${result.totalQuestions})</div>
      </div>
      <div class="time-display">Completed: ${new Date(result.dateTaken).toLocaleString()}</div>
      <div class="questions-section">
        <h4 style="color: #003865; margin-top: 0;">Question Details</h4>
        <div id="question-results-${index}">
          <!-- Questions will be inserted here -->
        </div>
      </div>
    `;
    
    quizResultsContainer.appendChild(quizResult);
    
    // Add individual questions
    const questionResults = document.getElementById(`question-results-${index}`);
    
    result.results.forEach((question, qIndex) => {
      const questionDiv = document.createElement('div');
      questionDiv.className = `question-result ${question.isCorrect ? 'correct' : 'incorrect'}`;
      
      questionDiv.innerHTML = `
        <div class="question-number">Question ${qIndex + 1}</div>
        <div style="margin-bottom: 8px;">${question.question}</div>
        <div class="answer-comparison">
          <div>
            <div class="answer-label">Your Answer:</div>
            <div class="${question.isCorrect ? 'correct-answer' : 'user-answer'}">
              ${question.userAnswer === "void" ? 'Void' : question.userAnswer || 'No answer provided'}
            </div>
          </div>
          ${question.isCorrect ? '' : `
          <div>
            <div class="answer-label">Correct Answer:</div>
            <div class="correct-answer">
              ${question.correctAnswer === "void" ? 'Void' : question.correctAnswer || 'Not provided'}
            </div>
          </div>
          `}
        </div>
      `;
      
      questionResults.appendChild(questionDiv);
    });
  });
  
  // Modal and download functionality
  const modal = document.getElementById('downloadModal');
  
  document.getElementById('download-results').addEventListener('click', () => {
    modal.style.display = 'block';
  });
  
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  document.getElementById('download-csv').addEventListener('click', () => {
    const csvContent = generateCSV(allResults);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'quiz_results.csv');
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    modal.style.display = 'none';
  });
  
  document.getElementById('download-pdf').addEventListener('click', () => {
    alert('PDF download functionality is not implemented yet.');
    modal.style.display = 'none';
  });
  
  function generateCSV(results) {
    let csvContent = "Quiz Title,Score,Percentage,Date Taken,Total Questions\n";
    
    results.forEach(result => {
      csvContent += `"${result.quizTitle}",${result.score},${result.percentage}%,"${new Date(result.dateTaken).toLocaleString()}",${result.totalQuestions}\n`;
    });
    
    csvContent += "\n\nDetailed Question Results\n";
    csvContent += "Quiz Title,Question Number,Question,Your Answer,Correct Answer,Result\n";
    
    results.forEach(result => {
      result.results.forEach((question, index) => {
        csvContent += `"${result.quizTitle}",${index + 1},"${question.question.replace(/"/g, '""')}","${
          question.userAnswer === "void" ? 'Void' : question.userAnswer.replace(/"/g, '""') || 'No answer provided'
        }","${
          question.correctAnswer === "void" ? 'Void' : question.correctAnswer.replace(/"/g, '""') || 'Not provided'
        }",${question.isCorrect ? 'Correct' : 'Incorrect'}\n`;
      });
    });
    
    return csvContent;
  }
});
