
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import QuotePage from './pages/QuotePage';
import LoginPage from './pages/LoginPage';
import AgentsPage from './pages/AgentsPage';
import AboutPage from './pages/AboutPage';

const QuotePageWrapper = () => {
  const { type } = useParams();
  return <QuotePage key={type} />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/quote/:type" element={<QuotePageWrapper />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
