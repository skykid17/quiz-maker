// Validation functions

export function validateQuizTitle(title) {
  if (!title || title.trim().length === 0) {
    return 'Quiz title is required';
  }
  if (title.trim().length < 3) {
    return 'Quiz title must be at least 3 characters';
  }
  if (title.length > 200) {
    return 'Quiz title must not exceed 200 characters';
  }
  return null;
}

export function validateDescription(description) {
  if (description && description.length > 1000) {
    return 'Description must not exceed 1000 characters';
  }
  return null;
}

export function validateTimeLimit(timeLimit) {
  if (timeLimit !== null && timeLimit !== undefined && timeLimit !== '') {
    const num = parseInt(timeLimit);
    if (isNaN(num)) {
      return 'Time limit must be a number';
    }
    if (num < 5 || num > 180) {
      return 'Time limit must be between 5 and 180 minutes';
    }
  }
  return null;
}

export function validateTags(tags) {
  if (tags && tags.length > 10) {
    return 'Maximum 10 tags allowed';
  }
  if (tags) {
    for (let i = 0; i < tags.length; i++) {
      if (tags[i].length > 30) {
        return `Tag ${i + 1} must not exceed 30 characters`;
      }
    }
  }
  return null;
}

export function validateQuestion(question, allQuestions = []) {
  const errors = [];
  
  if (!question.question || question.question.trim().length === 0) {
    errors.push('Question text is required');
  } else if (question.question.trim().length < 10) {
    errors.push('Question text must be at least 10 characters');
  } else if (question.question.length > 500) {
    errors.push('Question text must not exceed 500 characters');
  }
  
  if (question.hint && question.hint.length > 300) {
    errors.push('Hint must not exceed 300 characters');
  }
  
  if (!question.answerOptions || question.answerOptions.length < 2) {
    errors.push('At least 2 answer options are required');
  } else if (question.answerOptions.length > 8) {
    errors.push('Maximum 8 answer options allowed');
  } else {
    const correctCount = question.answerOptions.filter(a => a.isCorrect).length;
    if (correctCount === 0) {
      errors.push('At least one correct answer is required');
    }
    
    // Check for duplicate option texts
    const optionTexts = question.answerOptions
      .map(a => a.text?.trim())
      .filter(Boolean);
    const uniqueTexts = new Set(optionTexts);
    if (optionTexts.length !== uniqueTexts.size) {
      errors.push('Option texts must be unique');
    }
    
    // Validate each option
    question.answerOptions.forEach((option, index) => {
      if (!option.text || option.text.trim().length === 0) {
        errors.push(`Option ${index + 1} text is required`);
      } else if (option.text.length > 200) {
        errors.push(`Option ${index + 1} text must not exceed 200 characters`);
      }
      
      if (option.rationale && option.rationale.length > 300) {
        errors.push(`Option ${index + 1} rationale must not exceed 300 characters`);
      }
    });
  }
  
  return errors;
}

export function validateOption(option, allOptions) {
  const errors = [];
  
  if (!option.text || option.text.trim().length === 0) {
    errors.push('Option text is required');
  } else if (option.text.length > 200) {
    errors.push('Option text must not exceed 200 characters');
  }
  
  // Check for duplicates among other options
  const duplicateCount = allOptions.filter(
    o => o.text?.trim().toLowerCase() === option.text?.trim().toLowerCase()
  ).length;
  
  if (duplicateCount > 1) {
    errors.push('Option text must be unique');
  }
  
  return errors;
}

// Utility functions

export function inferQuestionType(answerOptions) {
  const correctCount = answerOptions.filter(a => a.isCorrect).length;
  return correctCount > 1 ? 'multiple' : 'single';
}

export function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    return 'Supported image formats: JPG, PNG, GIF, WebP';
  }
  
  if (file.size > maxSize) {
    return 'Image size must not exceed 5MB';
  }
  
  return null;
}

export function generateQuizSummary(quizData) {
  const totalQuestions = quizData.questions?.length || 0;
  const totalOptions = quizData.questions?.reduce(
    (sum, q) => sum + (q.answerOptions?.length || 0), 
    0
  ) || 0;
  const multiSelectCount = quizData.questions?.filter(
    q => q.answerOptions?.filter(a => a.isCorrect).length > 1
  ).length || 0;
  const withImages = quizData.questions?.filter(
    q => q.imageUrl || q.answerOptions?.some(a => a.imageUrl)
  ).length || 0;
  
  return {
    totalQuestions,
    totalOptions,
    multiSelectCount,
    singleSelectCount: totalQuestions - multiSelectCount,
    withImages,
    withHints: quizData.questions?.filter(q => q.hint).length || 0,
    withRationales: quizData.questions?.filter(
      q => q.answerOptions?.some(a => a.rationale)
    ).length || 0
  };
}

export function createEmptyQuestion() {
  return {
    _id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    question: '',
    hint: '',
    imageUrl: '',
    answerOptions: [
      { _id: `opt_${Date.now()}_1`, text: '', isCorrect: false, rationale: '', imageUrl: '' },
      { _id: `opt_${Date.now()}_2`, text: '', isCorrect: false, rationale: '', imageUrl: '' }
    ]
  };
}

export function createEmptyOption() {
  return {
    _id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: '',
    isCorrect: false,
    rationale: '',
    imageUrl: ''
  };
}
