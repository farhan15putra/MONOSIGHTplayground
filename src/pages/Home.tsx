import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import emblemSrc from '../assets/emblem.png';

// ─── Physics Constants ──────────────────────────────────────────────────────
const SPRING = 0.03      // Lebih kecil = partikel lebih "berat"/lambat balik
const DAMPING = 0.5     // Lebih kecil = partikel lebih "goyang" sebelum settle
const MOUSE_RADIUS = 90   // Radius jangkauan repulsi kursor (px)
const MOUSE_FORCE = 7     // Seberapa kencang partikel "lari" dari kursor
const SAMPLE_GAP = 3      // Jarak antar partikel (lebih kecil = lebih padat)
const PARTICLE_SIZE = 1.5 // Ukuran tiap titik partikel

const TAGS = [
  'Cylindrical Gallery', 'GLSL Shaders', 'Brush Reveal', 'Lens Distortion',
  'Vertex Shader', 'React Three Fiber', 'Motion Design', 'Parallax Depth', 'WebGL',
];

// ─── Particle Class ─────────────────────────────────────────────────────────
class Particle {
  x: number; y: number;
  tx: number; ty: number;
  vx = 0; vy = 0;

  constructor(tx: number, ty: number, W: number, H: number) {
    this.tx = tx; this.ty = ty;
    this.x = Math.random() * W;
    this.y = Math.random() * H;
  }

  update(mx: number, my: number) {
    this.vx += (this.tx - this.x) * SPRING;
    this.vy += (this.ty - this.y) * SPRING;

    const dx = this.x - mx;
    const dy = this.y - my;
    const d2 = dx * dx + dy * dy;
    if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
      const d = Math.sqrt(d2) || 1;
      const f = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) * MOUSE_FORCE;
      this.vx += (dx / d) * f;
      this.vy += (dy / d) * f;
    }

    this.vx *= DAMPING;
    this.vy *= DAMPING;
    this.x += this.vx;
    this.y += this.vy;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const particles = useRef<Particle[]>([]);
  const raf = useRef(0);
  const [exiting, setExiting] = useState(false);
  const navigate = useNavigate();

  const handleEnter = () => {
    if (exiting) return;
    setExiting(true);
    // Scatter all particles outward from center
    const canvas = canvasRef.current;
    if (canvas) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      particles.current.forEach((p) => {
        const angle = Math.atan2(p.y - cy, p.x - cx);
        const dist = Math.random() * Math.max(canvas.width, canvas.height);
        p.tx = cx + Math.cos(angle) * dist;
        p.ty = cy + Math.sin(angle) * dist;
      });
    }
    setTimeout(() => navigate('/playground'), 500);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    const init = () => {
      // Use window dimensions directly — canvas is always inset-0 w-full h-full
      // canvas.offsetWidth can be 0 during AnimatePresence mount, so never rely on it
      const W = window.innerWidth;
      const H = window.innerHeight - 80; // subtract navbar height
      canvas.width = W;
      canvas.height = H;

      const EMBLEM_SIZE = Math.round(Math.min(W * 0.26, H * 0.45, 260));
      const cx = W / 2;
      const cy = H * 0.38;

      const img = new Image();
      img.src = emblemSrc;
      img.onload = () => {
        const off = document.createElement('canvas');
        off.width = EMBLEM_SIZE;
        off.height = EMBLEM_SIZE;
        const oct = off.getContext('2d')!;

        oct.fillStyle = '#000';
        oct.fillRect(0, 0, EMBLEM_SIZE, EMBLEM_SIZE);
        oct.filter = 'brightness(0) invert(1)';
        oct.drawImage(img, 0, 0, EMBLEM_SIZE, EMBLEM_SIZE);

        const data = oct.getImageData(0, 0, EMBLEM_SIZE, EMBLEM_SIZE).data;
        const pts: Particle[] = [];

        for (let y = 0; y < EMBLEM_SIZE; y += SAMPLE_GAP) {
          for (let x = 0; x < EMBLEM_SIZE; x += SAMPLE_GAP) {
            const i = (y * EMBLEM_SIZE + x) * 4;
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness > 120) {
              const tx = cx - EMBLEM_SIZE / 2 + x;
              const ty = cy - EMBLEM_SIZE / 2 + y;
              pts.push(new Particle(tx, ty, W, H));
            }
          }
        }

        particles.current = pts;

        const draw = () => {
          ctx.clearRect(0, 0, W, H);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
          for (const p of particles.current) {
            p.update(mouse.current.x, mouse.current.y);
            ctx.fillRect(p.x - PARTICLE_SIZE / 2, p.y - PARTICLE_SIZE / 2, PARTICLE_SIZE, PARTICLE_SIZE);
          }
          raf.current = requestAnimationFrame(draw);
        };
        draw();
      };
    };

    rafId = requestAnimationFrame(init);

    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(raf.current);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
    };
  }, []);



  return (
    <div className="flex-1 relative w-full h-full overflow-hidden">

      {/* Grain texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px',
        }}
      />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* UI Layer — text starts at ~60% height (below emblem cluster) */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none pb-[18vh]">

        {/* MONOSIGHT */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: exiting ? 0 : 1, y: exiting ? -12 : 0 }}
          transition={{ delay: exiting ? 0 : 0.9, duration: exiting ? 0.3 : 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-syne text-5xl md:text-7xl lg:text-[7rem] font-bold tracking-[0.18em] text-white/90 uppercase leading-none mb-3"
        >
          MONOSIGHT
        </motion.h1>

        {/* Studio tag */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ delay: exiting ? 0 : 1.1, duration: 0.3 }}
          className="text-[9px] uppercase tracking-[0.65em] text-white/22 mb-9"
        >
          Studio · Experimental Playground
        </motion.p>

        {/* Ghost CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: exiting ? 0 : 1, y: exiting ? 20 : 0 }}
          transition={{ delay: exiting ? 0 : 1.3, duration: 0.4 }}
          className="pointer-events-auto"
          whileHover={!exiting ? { scale: 1.04 } : {}}
          whileTap={!exiting ? { scale: 0.96 } : {}}
        >
          <button
            onClick={handleEnter}
            className="group inline-flex items-center gap-3 border border-white/18 text-white/50 hover:text-white hover:border-white/45 px-8 py-3.5 rounded-full text-[11px] font-light tracking-[0.2em] uppercase transition-all duration-400 hover:shadow-[0_0_35px_rgba(255,255,255,0.07)] backdrop-blur-sm cursor-pointer"
          >
            Enter Playground
            <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>

      {/* Marquee */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-6 left-0 w-full overflow-hidden pointer-events-none"
      >
        <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {[...TAGS, ...TAGS].map((tag, i) => (
            <span key={i} className="text-[9px] uppercase tracking-[0.35em] text-white/12 font-light shrink-0">
              {tag} <span className="ml-6 opacity-50">·</span>
            </span>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
