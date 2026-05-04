
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AgentAuthProvider } from './contexts/AgentAuthContext';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import LandingPage from './pages/LandingPage';
import QuotePage from './pages/QuotePage';
import LoginPage from './pages/LoginPage';
import AgentsPage from './pages/AgentsPage';
import AgentQuotePage from './pages/AgentQuotePage';
import AboutPage from './pages/AboutPage';

const QuotePageWrapper = () => {
  const { type } = useParams();
  return <QuotePage key={type} />;
};

const StandardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col h-screen overflow-hidden">
    <Header />
    <main className="flex-1 overflow-hidden">{children}</main>
    <ChatInterface />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <AgentAuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<StandardLayout><LandingPage /></StandardLayout>} />
            <Route path="/quote/:type" element={<StandardLayout><QuotePageWrapper /></StandardLayout>} />
            <Route path="/login" element={<StandardLayout><LoginPage /></StandardLayout>} />
            <Route path="/agents" element={<StandardLayout><AgentsPage /></StandardLayout>} />
            <Route path="/about" element={<StandardLayout><AboutPage /></StandardLayout>} />
            {/* Per-agent quote site (under /agent so it can't collide with named routes) */}
            <Route path="/agent/:agent" element={<AgentQuotePage />} />
          </Routes>
        </Router>
      </AgentAuthProvider>
    </AuthProvider>
  );
}

export default App;
