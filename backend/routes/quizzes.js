import express from 'express';
import Quiz from '../models/Quiz.js';
import Progress from '../models/Progress.js';
import Attempt from '../models/Attempt.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Validate quiz data
function validateQuizData(data) {
  const errors = [];
  
  if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push('At least one question is required');
    return errors;
  }

  data.questions.forEach((q, qIndex) => {
    // Accept both 'text' and 'question' as the question text field
    const questionText = q.text || q.question;
    if (!questionText || typeof questionText !== 'string') {
      errors.push(`Question ${qIndex + 1}: question text is required`);
    }
    
    if (!q.answerOptions || !Array.isArray(q.answerOptions)) {
      errors.push(`Question ${qIndex + 1}: answerOptions array is required`);
      return;
    }
    
    if (q.answerOptions.length < 2 || q.answerOptions.length > 6) {
      errors.push(`Question ${qIndex + 1}: must have 2-6 answer options`);
    }
    
    const correctCount = q.answerOptions.filter(a => a.isCorrect === true).length;
    if (correctCount === 0) {
      errors.push(`Question ${qIndex + 1}: at least one correct answer is required`);
    }
    
    q.answerOptions.forEach((a, aIndex) => {
      if (!a.text || typeof a.text !== 'string') {
        errors.push(`Question ${qIndex + 1}, Option ${aIndex + 1}: option text is required`);
      }
    });
  });

  return errors;
}

// Infer question type from answer options
function inferQuestionType(answerOptions) {
  const correctCount = answerOptions.filter(a => a.isCorrect === true).length;
  return correctCount > 1 ? 'multiple' : 'single';
}

// Normalize question data (accept both 'text' and 'question' fields)
function normalizeQuestion(q) {
  return {
    question: q.text || q.question,
    hint: q.hint || '',
    answerOptions: q.answerOptions.map(a => ({
      text: a.text,
      isCorrect: a.isCorrect,
      rationale: a.rationale || ''
    })),
    type: inferQuestionType(q.answerOptions)
  };
}

// List all quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({}, 'title questions createdAt updatedAt shareCode')
      .sort({ updatedAt: -1 })
      .lean();

    // Get attempt stats for each quiz
    const quizsWithStats = await Promise.all(quizzes.map(async (quiz) => {
      const attempts = await Attempt.find({ quizId: quiz._id });
      const bestScore = attempts.length > 0 
        ? Math.max(...attempts.map(a => a.percentage)) 
        : null;
      const lastAttempt = attempts.length > 0 
        ? attempts.sort((a, b) => b.completedAt - a.completedAt)[0].completedAt 
        : null;

      return {
        ...quiz,
        questionCount: quiz.questions.length,
        attemptCount: attempts.length,
        bestScore,
        lastAttempt
      };
    }));

    res.json(quizsWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get quiz by ID
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Get attempt history
    const attempts = await Attempt.find({ quizId: quiz._id })
      .sort({ completedAt: -1 })
      .select('score totalPoints percentage completedAt duration mode questionsSkipped');

    res.json({ quiz, attempts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new quiz
router.post('/', async (req, res) => {
  try {
    const { title, questions, shareCode } = req.body;
    
    // Validate
    const errors = validateQuizData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Process questions and infer types
    const processedQuestions = questions.map(normalizeQuestion);

    const quiz = new Quiz({
      title: title || 'Untitled Quiz',
      questions: processedQuestions,
      shareCode: shareCode || undefined
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update quiz (rename)
router.put('/:id', async (req, res) => {
  try {
    const { title } = req.body;
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { title, updatedAt: new Date() },
      { new: true }
    );
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete quiz
router.delete('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Delete associated progress and attempts
    await Progress.deleteMany({ quizId: req.params.id });
    await Attempt.deleteMany({ quizId: req.params.id });
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import quiz from JSON
router.post('/import', async (req, res) => {
  try {
    const quizData = req.body;
    
    // Validate
    const errors = validateQuizData(quizData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Process questions
    const processedQuestions = quizData.questions.map(normalizeQuestion);

    const quiz = new Quiz({
      title: quizData.title || 'Untitled Quiz',
      questions: processedQuestions
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export quiz as JSON
router.get('/:id/export', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const exportData = {
      title: quiz.title,
      questions: quiz.questions.map(q => ({
        question: q.question,
        hint: q.hint,
        answerOptions: q.answerOptions.map(a => ({
          text: a.text,
          isCorrect: a.isCorrect,
          rationale: a.rationale
        }))
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${quiz.title.replace(/[^a-z0-9]/gi, '_')}.json"`);
    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate share code
router.post('/:id/share', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (!quiz.shareCode) {
      quiz.shareCode = `QUIZ-${uuidv4().substring(0, 8).toUpperCase()}`;
      await quiz.save();
    }

    res.json({ shareCode: quiz.shareCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shared quiz by code
router.get('/shared/:code', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ shareCode: req.params.code });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Duplicate quiz
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Quiz.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const quiz = new Quiz({
      title: `${original.title} (Copy)`,
      questions: original.questions
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
