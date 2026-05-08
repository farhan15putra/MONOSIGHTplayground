import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Playground from './pages/Playground';

function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/playground/:effectId?" element={<Playground />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
