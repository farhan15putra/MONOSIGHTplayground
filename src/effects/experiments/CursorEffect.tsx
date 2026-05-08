import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export default function CursorEffect() {
  const cursorRef = useRef<HTMLDivElement>(null);
  
  // Custom cursor position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring physics for cursor
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);
  
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      // Offset by half the cursor size to center it
      mouseX.set(e.clientX - 16);
      mouseY.set(e.clientY - 16);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.interactive')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden group cursor-none">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* The Custom Cursor */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 flex items-center justify-center mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isHovering ? 2.5 : 1,
          backgroundColor: isHovering ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.8)',
        }}
        transition={{ duration: 0.2 }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg text-center">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold tracking-tight text-white">Magnetic Custom Cursor</h2>
          <p className="text-zinc-400">
            Move your mouse around. Hover over the interactive elements below to see the spring physics and blending modes in action.
          </p>
        </div>

        <div className="flex gap-4">
          <button className="interactive px-6 py-3 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors">
            Hover Me
          </button>
          <button className="interactive px-6 py-3 rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors">
            Or Me
          </button>
        </div>
        
        <div className="p-8 mt-4 border border-dashed border-white/20 rounded-2xl interactive w-full">
          <p className="text-sm text-zinc-500 font-mono">
            Large Interactive Drop Zone
          </p>
        </div>
      </div>
    </div>
  );
}
