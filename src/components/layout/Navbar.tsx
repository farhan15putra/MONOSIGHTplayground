import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { FlaskConical, LayoutGrid } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const links = [
    { name: 'Home', path: '/', icon: <LayoutGrid className="w-4 h-4" /> },
    { name: 'Playground', path: '/playground', icon: <FlaskConical className="w-4 h-4" /> },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        <Link to="/" className="text-xl font-bold tracking-tighter text-foreground flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center overflow-hidden">
            <div className="w-2 h-2 bg-background rounded-full animate-pulse" />
          </div>
          MONOSIGHT<span className="text-muted-foreground font-light text-sm ml-1 uppercase">Playground</span>
        </Link>
        
        <nav className="flex items-center gap-2 glass px-4 py-2 rounded-full shadow-2xl shadow-black/20">
          {links.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  isActive ? "text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-foreground rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {link.icon}
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
