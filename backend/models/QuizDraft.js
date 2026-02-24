import mongoose from 'mongoose';

const answerOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
  rationale: { type: String, default: '' },
  imageUrl: { type: String, default: '' }
}, { _id: true });

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  hint: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  answerOptions: [answerOptionSchema],
  type: { type: String, enum: ['single', 'multiple'], default: 'single' }
}, { _id: true });

const draftSchema = new mongoose.Schema({
  title: { type: String, default: 'Untitled Quiz', maxlength: 200 },
  description: { type: String, maxlength: 1000, default: '' },
  timeLimit: { type: Number, min: 5, max: 180, default: null },
  tags: [{ type: String, maxlength: 30 }],
  autoGenerateShareCode: { type: Boolean, default: true },
  questions: [questionSchema],
  currentStep: { type: Number, min: 1, max: 3, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware
draftSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Infer question types
  this.questions.forEach(q => {
    const correctCount = q.answerOptions.filter(a => a.isCorrect).length;
    q.type = correctCount > 1 ? 'multiple' : 'single';
  });
  
  next();
});

const QuizDraft = mongoose.model('QuizDraft', draftSchema);

export default QuizDraft;
