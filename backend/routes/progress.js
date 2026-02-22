import express from 'express';
import Progress from '../models/Progress.js';

const router = express.Router();

// Get progress for a quiz
router.get('/:quizId', async (req, res) => {
  try {
    const progress = await Progress.findOne({ quizId: req.params.quizId });
    if (!progress) {
      return res.json(null);
    }
    
    // Convert Map to object for JSON serialization
    const progressObj = progress.toObject();
    progressObj.answers = Object.fromEntries(progress.answers || new Map());
    
    res.json(progressObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save progress
router.post('/:quizId', async (req, res) => {
  try {
    const { currentQuestionIndex, answers, skippedQuestions, mode } = req.body;
    
    // Convert answers object to Map
    const answersMap = new Map(Object.entries(answers || {}));
    
    const progress = await Progress.findOneAndUpdate(
      { quizId: req.params.quizId },
      {
        currentQuestionIndex,
        answers: answersMap,
        skippedQuestions,
        mode,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    const progressObj = progress.toObject();
    progressObj.answers = Object.fromEntries(progress.answers || new Map());
    
    res.json(progressObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear progress
router.delete('/:quizId', async (req, res) => {
  try {
    await Progress.findOneAndDelete({ quizId: req.params.quizId });
    res.json({ message: 'Progress cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
