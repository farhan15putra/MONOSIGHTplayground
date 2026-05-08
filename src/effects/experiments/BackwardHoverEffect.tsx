import { motion, useAnimationControls } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useRef } from 'react';

const parentVariants: Variants = {
  flip: {
    transition: { staggerChildren: 0.04 }
  },
  normal: {
    transition: { staggerChildren: 0.04 }
  }
};

const letterVariants: Variants = {
  flip: {
    rotateY: 180,
    color: "#71717a", // Darker zinc for stronger 3D depth
    transition: { duration: 0.3, ease: "backOut" }
  },
  normal: {
    rotateY: 0,
    color: "#ffffff",
    transition: { duration: 0.4, ease: "backOut" }
  }
};

export default function BackwardHoverEffect() {
  const text = "MONOSIGHT";
  const controls = useAnimationControls();
  const isAnimating = useRef(false);

  const handleWordHover = async () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    // Phase 1: Flip letters horizontally with stagger
    await controls.start("flip");
    
    // Phase 2: Wait a fraction of a second
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Phase 3: Restore to normal
    await controls.start("normal");
    
    isAnimating.current = false;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />

      {/* The Typography Container */}
      <motion.h1 
        variants={parentVariants}
        initial="normal"
        animate={controls}
        onMouseEnter={handleWordHover}
        className="text-4xl md:text-6xl font-black tracking-[0.25em] text-white flex perspective-[800px] cursor-crosshair"
      >
        {text.split('').map((char, i) => (
          <motion.span
            key={i}
            variants={letterVariants}
            className="inline-block select-none origin-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.h1>

      {/* Minimalist Instructions */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 text-zinc-600 uppercase tracking-[0.4em] text-[9px] font-medium pointer-events-none"
      >
        Hover the word
      </motion.div>
    </div>
  );
}
