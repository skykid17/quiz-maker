import express from 'express';
import Attempt from '../models/Attempt.js';
import Quiz from '../models/Quiz.js';

const router = express.Router();

// Calculate score for an attempt
function calculateScore(quiz, answers) {
  let totalScore = 0;
  let totalPossible = quiz.questions.length;
  const answerResults = [];
  let skippedCount = 0;

  quiz.questions.forEach((question, index) => {
    const userAnswer = answers.find(a => a.questionId === question._id.toString());
    const correctOptions = question.answerOptions
      .filter(a => a.isCorrect)
      .map(a => a._id.toString());
    
    if (!userAnswer || userAnswer.selectedOptionIds.length === 0) {
      skippedCount++;
      answerResults.push({
        questionId: question._id.toString(),
        selectedOptionIds: [],
        correctOptionIds: correctOptions,
        pointsEarned: 0,
        isCorrect: false
      });
      return;
    }

    const selectedCorrect = userAnswer.selectedOptionIds.filter(id => correctOptions.includes(id));
    const selectedWrong = userAnswer.selectedOptionIds.filter(id => !correctOptions.includes(id));
    
    let pointsEarned = 0;
    const pointsPerCorrect = 1 / correctOptions.length;

    // Add points for correct selections
    pointsEarned += selectedCorrect.length * pointsPerCorrect;
    // Subtract points for wrong selections
    pointsEarned -= selectedWrong.length * pointsPerCorrect;
    // Ensure non-negative
    pointsEarned = Math.max(0, pointsEarned);

    totalScore += pointsEarned;
    
    answerResults.push({
      questionId: question._id.toString(),
      selectedOptionIds: userAnswer.selectedOptionIds,
      correctOptionIds: correctOptions,
      pointsEarned,
      isCorrect: pointsEarned >= 1 - 0.001 // Account for floating point
    });
  });

  return {
    score: totalScore,
    totalPoints: totalPossible,
    percentage: Math.round((totalScore / totalPossible) * 100 * 100) / 100,
    answers: answerResults,
    questionsSkipped: skippedCount
  };
}

// Get all attempts (history)
router.get('/', async (req, res) => {
  try {
    const attempts = await Attempt.find()
      .sort({ completedAt: -1 })
      .populate('quizId', 'title')
      .lean();
    
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attempts for a specific quiz
router.get('/quiz/:quizId', async (req, res) => {
  try {
    const attempts = await Attempt.find({ quizId: req.params.quizId })
      .sort({ completedAt: -1 });
    
    res.json(attempts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single attempt details
router.get('/:attemptId', async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate('quizId');
    
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit quiz attempt
router.post('/', async (req, res) => {
  try {
    const { quizId, answers, startedAt, mode } = req.body;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const completedAt = new Date();
    const duration = Math.floor((completedAt - new Date(startedAt)) / 1000);
    
    const scoreResult = calculateScore(quiz, answers);

    const attempt = new Attempt({
      quizId,
      answers: scoreResult.answers,
      score: scoreResult.score,
      totalPoints: scoreResult.totalPoints,
      percentage: scoreResult.percentage,
      startedAt,
      completedAt,
      duration,
      mode,
      questionsSkipped: scoreResult.questionsSkipped
    });

    await attempt.save();
    res.status(201).json(attempt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete attempt
router.delete('/:attemptId', async (req, res) => {
  try {
    const attempt = await Attempt.findByIdAndDelete(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    
    res.json({ message: 'Attempt deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
