import express from 'express';
import QuizDraft from '../models/QuizDraft.js';
import Quiz from '../models/Quiz.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// List all drafts
router.get('/', async (req, res) => {
  try {
    const drafts = await QuizDraft.find()
      .sort({ updatedAt: -1 })
      .select('title questions currentStep createdAt updatedAt');
    
    const draftsWithCount = drafts.map(d => ({
      _id: d._id,
      title: d.title,
      questionCount: d.questions.length,
      currentStep: d.currentStep,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    }));
    
    res.json(draftsWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific draft
router.get('/:id', async (req, res) => {
  try {
    const draft = await QuizDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json(draft);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update draft
router.post('/', async (req, res) => {
  try {
    const { _id, ...draftData } = req.body;
    
    let draft;
    if (_id) {
      // Update existing draft
      draft = await QuizDraft.findByIdAndUpdate(
        _id,
        { ...draftData, updatedAt: new Date() },
        { new: true, upsert: true }
      );
    } else {
      // Create new draft
      draft = new QuizDraft(draftData);
      await draft.save();
    }
    
    res.json(draft);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete draft
router.delete('/:id', async (req, res) => {
  try {
    const draft = await QuizDraft.findByIdAndDelete(req.params.id);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json({ message: 'Draft deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish draft (convert to quiz)
router.post('/:id/publish', async (req, res) => {
  try {
    const draft = await QuizDraft.findById(req.params.id);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    
    // Validate minimum requirements
    if (!draft.questions || draft.questions.length === 0) {
      return res.status(400).json({ error: 'Quiz must have at least one question' });
    }
    
    // Create quiz from draft
    const quiz = new Quiz({
      title: draft.title,
      description: draft.description,
      timeLimit: draft.timeLimit,
      tags: draft.tags,
      questions: draft.questions,
      shareCode: draft.autoGenerateShareCode ? `QUIZ-${uuidv4().substring(0, 8).toUpperCase()}` : undefined
    });
    
    await quiz.save();
    
    // Delete the draft
    await QuizDraft.findByIdAndDelete(req.params.id);
    
    res.status(201).json({ quizId: quiz._id, quiz, message: 'Quiz published successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
