import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative px-6 w-full h-full">
      {/* Background radial gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-foreground/5 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto text-center z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-8 uppercase tracking-widest"
        >
          <Sparkles className="w-3 h-3" />
          Experimental Playground
        </motion.div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-balance mb-6 uppercase">
          Monosight <span className="text-muted-foreground font-light italic">Playground</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance leading-relaxed">
          MONOSIGHT Playground is our dedicated creative space for exploring interactions, motion systems, shaders, and UI experimentations before they reach production.
        </p>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            to="/playground" 
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-full font-medium transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Enter Playground
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
