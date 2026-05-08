import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Playground from './pages/Playground';

// ─── Page Transition Variants ───────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
};

// ─── AnimatedRoutes (needs to be inside Router for useLocation) ─────────────
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={location.pathname.split('/')[1] || 'home'}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 flex flex-col"
        style={{ transformOrigin: 'center center' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/playground/:effectId?" element={<Playground />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 flex flex-col pt-20">
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
}

export default App;
