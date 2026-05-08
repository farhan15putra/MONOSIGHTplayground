import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Box, Sparkles, Layers, Paintbrush, Grid3X3 } from 'lucide-react';

// Example experiments
import BrushRevealEffect from '../effects/experiments/BrushRevealEffect';
import BackwardHoverEffect from '../effects/experiments/BackwardHoverEffect';
import CylindricalGallery from '../effects/experiments/CylindricalGallery';
import FigRoots from '../effects/experiments/figroot';

const EXPERIMENTS = [
  {
    id: 'brush-reveal',
    name: 'Cinematic Brush Reveal',
    description: 'A fluid, watercolor-like brush that reveals a hidden luxury layout beneath a matte surface.',
    icon: <Paintbrush className="w-5 h-5" />,
    component: BrushRevealEffect
  },
  {
    id: 'backward-hover',
    name: 'Backward Hover Typography',
    description: 'A premium typographic interaction where letters flip 180 degrees backwards upon hover.',
    icon: <Layers className="w-5 h-5" />,
    component: BackwardHoverEffect
  },
  {
    id: 'cylindrical-gallery',
    name: 'Cylindrical Gallery',
    description: 'Aristide Benoist-style horizontal gallery with cylindrical lens distortion, smooth-damped scroll, and velocity-reactive vertex shaders.',
    icon: <Box className="w-5 h-5" />,
    component: CylindricalGallery
  },
  {
    id: 'glsl-shaders',
    name: 'GLSL Shaders',
    description: 'Custom fragment shaders for image distortions.',
    icon: <Sparkles className="w-5 h-5" />,
    component: () => <div className="p-8 text-center text-muted-foreground">Shader Effect Placeholder</div>
  },
  {
    id: 'figroots',
    name: 'FigRoots Identity',
    description: 'A structured color branding board with smooth motion reveals.',
    icon: <Grid3X3 className="w-5 h-5" />,
    component: FigRoots
  }
];

export default function Playground() {
  const { effectId } = useParams();
  
  const activeExperiment = EXPERIMENTS.find(e => e.id === effectId) || null;

  return (
    <div className="flex-1 flex h-[calc(100vh-5rem)] overflow-hidden bg-background relative selection:bg-primary selection:text-background">
      {/* Global Noise Overlay */}
      <div className="noise-bg mix-blend-overlay" />
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
        backgroundSize: `4rem 4rem`
      }} />

      {/* Sidebar */}
      <aside className="w-[340px] border-r border-white/10 flex flex-col bg-background/80 backdrop-blur-3xl z-10">
        <div className="p-6 border-b border-white/10 flex items-end justify-between">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-1">Index</h2>
            <p className="text-xl font-bold tracking-tight">Experiments_</p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">v2.0</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {EXPERIMENTS.map((exp, index) => {
            const isActive = effectId === exp.id;
            return (
              <Link
                key={exp.id}
                to={`/playground/${exp.id}`}
                className={cn(
                  "group relative flex flex-col gap-2 p-4 border border-transparent transition-all duration-300 overflow-hidden",
                  isActive ? "bg-white/[0.03] border-white/10" : "hover:bg-white/[0.02]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-line"
                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary z-20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center border transition-colors duration-300",
                    isActive ? "border-primary/50 text-primary bg-primary/10" : "border-white/10 text-muted-foreground group-hover:border-white/30"
                  )}>
                    {exp.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={cn("font-semibold text-sm tracking-wide transition-colors", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                        {exp.name}
                      </h3>
                      <span className="text-[9px] font-mono text-muted-foreground/50">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>
                
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="relative z-10 pl-12 text-xs text-muted-foreground/80 leading-relaxed font-mono"
                  >
                    {exp.description}
                  </motion.div>
                )}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col bg-black">
        {/* Top Gradient Fade */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-background/50 to-transparent pointer-events-none z-10" />

        {activeExperiment ? (
          <div className="flex-1 flex flex-col relative w-full h-full">
            <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
               <div className="glass px-3 py-1.5 border border-white/10 flex items-center gap-2">
                 <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Live // {activeExperiment.id}</span>
              </div>
            </div>
            
            <div className="flex-1 relative w-full h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeExperiment.id}
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(10px)' }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full h-full"
                >
                  <activeExperiment.component />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center relative p-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-xl w-full text-center relative z-10 mix-blend-difference"
            >
              <div className="inline-flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <div className="w-24 h-24 border border-white/20 flex items-center justify-center relative bg-background/50 backdrop-blur-xl rotate-45 group hover:border-primary/50 transition-colors duration-700">
                  <Sparkles className="w-8 h-8 text-white group-hover:text-primary transition-colors duration-700 -rotate-45" />
                </div>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">
                Aesthetic <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">Playground</span>
              </h2>
              
              <p className="text-lg text-muted-foreground/80 font-mono text-balance max-w-md mx-auto leading-relaxed">
                Select an interaction pattern from the index to begin compiling the environment.
              </p>

              <div className="mt-12 flex items-center justify-center gap-4 text-xs font-mono text-muted-foreground/50 uppercase tracking-[0.2em]">
                <span>Awaiting Input</span>
                <span className="w-12 h-[1px] bg-white/20" />
                <span className="animate-pulse">_</span>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

