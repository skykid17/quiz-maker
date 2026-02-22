import mongoose from 'mongoose';

const attemptAnswerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  selectedOptionIds: [{ type: String }],
  correctOptionIds: [{ type: String }],
  pointsEarned: { type: Number, default: 0 },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: [attemptAnswerSchema],
  score: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date, default: Date.now },
  duration: { type: Number, default: 0 }, // seconds
  mode: { type: String, enum: ['immediate', 'end'], required: true },
  questionsSkipped: { type: Number, default: 0 }
});

const Attempt = mongoose.model('Attempt', attemptSchema);

export default Attempt;
