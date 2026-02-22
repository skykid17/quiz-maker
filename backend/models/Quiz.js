import mongoose from 'mongoose';

const answerOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  rationale: { type: String, default: '' }
}, { _id: true });

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  hint: { type: String, default: '' },
  answerOptions: [answerOptionSchema],
  type: { type: String, enum: ['single', 'multiple'], required: true }
}, { _id: true });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, default: 'Untitled Quiz' },
  questions: [questionSchema],
  shareCode: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate share code before saving if not exists
quizSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
