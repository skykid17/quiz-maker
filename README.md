# Quiz Maker Application

A full-stack quiz maker application built with React, Node.js/Express, and MongoDB.

## Features

- **Quiz Management**: Import, create, edit, and delete quizzes
- **Multiple Question Types**: Single-choice and multi-select questions with automatic detection
- **Scoring Modes**: 
  - Immediate feedback (see answers after each question)
  - End feedback (see all results after completion)
- **Progress Persistence**: Resume quizzes where you left off
- **Skip Questions**: Skip and return later with warning on submission
- **Hints**: Optional hints for questions (tracked in scoring)
- **Attempt History**: Review past attempts with detailed rationales
- **Import/Export**: JSON file upload/paste and shareable codes
- **Quiz Sharing**: Share quizzes via encoded share codes

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express
- **Database**: MongoDB (with local persistence)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

**Option 1: Run both separately**

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option 2: Using Zo Computer services**

The backend is registered as a persistent service. Access the frontend at the dev server URL.

### Environment Variables

Backend (set in environment or `.env`):
- `PORT`: Server port (default: 3001)
- `MONGODB_URI`: MongoDB connection string (default: mongodb://localhost:27017/quiz-maker)

## Quiz JSON Format

```json
{
  "title": "My Quiz",
  "questions": [
    {
      "text": "What is 2 + 2?",
      "hint": "Think about addition",
      "answerOptions": [
        {
          "text": "4",
          "isCorrect": true,
          "rationale": "2 + 2 equals 4"
        },
        {
          "text": "5",
          "isCorrect": false,
          "rationale": "5 is incorrect"
        }
      ]
    }
  ]
}
```

## Scoring

- Each question is worth 1 mark
- Multi-select questions: Points divided equally among correct options
- Skipped questions: 0 points
- Hints tracked but don't affect score

## API Endpoints

### Quizzes
- `GET /api/quizzes` - List all quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes` - Create quiz
- `PUT /api/quizzes/:id` - Update quiz
- `DELETE /api/quizzes/:id` - Delete quiz
- `POST /api/quizzes/import` - Import quiz from JSON
- `POST /api/quizzes/:id/duplicate` - Duplicate quiz
- `GET /api/quizzes/:id/export` - Export quiz as JSON

### Progress
- `GET /api/progress/:quizId` - Get progress for quiz
- `POST /api/progress/:quizId` - Save progress
- `DELETE /api/progress/:quizId` - Clear progress

### Attempts
- `GET /api/attempts` - List all attempts
- `GET /api/attempts/:id` - Get attempt by ID
- `GET /api/attempts/quiz/:quizId` - Get attempts for quiz
- `POST /api/attempts` - Submit new attempt
- `DELETE /api/attempts/:id` - Delete attempt

## Project Structure

```
quiz-maker/
├── backend/
│   ├── models/
│   │   ├── Quiz.js
│   │   ├── Progress.js
│   │   └── Attempt.js
│   ├── routes/
│   │   ├── quizzes.js
│   │   ├── progress.js
│   │   └── attempts.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── ImportModal.jsx
    │   │   └── ShareModal.jsx
    │   ├── pages/
    │   │   ├── QuizListPage.jsx
    │   │   ├── QuizDetailPage.jsx
    │   │   ├── TakeQuizPage.jsx
    │   │   ├── ReviewPage.jsx
    │   │   └── HistoryPage.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```
