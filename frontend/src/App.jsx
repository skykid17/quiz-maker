import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import QuizListPage from './pages/QuizListPage'
import QuizDetailPage from './pages/QuizDetailPage'
import TakeQuizPage from './pages/TakeQuizPage'
import ReviewPage from './pages/ReviewPage'
import HistoryPage from './pages/HistoryPage'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<QuizListPage />} />
        <Route path="/quiz/new" element={<QuizListPage showImport={true} />} />
        <Route path="/quiz/:id" element={<QuizDetailPage />} />
        <Route path="/quiz/:id/take" element={<TakeQuizPage />} />
        <Route path="/quiz/:id/review/:attemptId" element={<ReviewPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Layout>
  )
}

export default App
