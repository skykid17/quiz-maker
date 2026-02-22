import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  currentQuestionIndex: { type: Number, default: 0 },
  answers: { type: Map, of: [String], default: {} }, // questionId -> [optionIds]
  skippedQuestions: [{ type: String }], // questionIds
  mode: { type: String, enum: ['immediate', 'end'], default: 'end' },
  startedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure one progress per quiz
progressSchema.index({ quizId: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
