
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import QuotePage from './pages/QuotePage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/quote" element={<QuotePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
