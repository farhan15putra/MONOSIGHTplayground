import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';

interface BrushPoint {
  x: number;
  y: number;
  time: number;
  size: number;
}

export default function BrushRevealEffect() {
  const containerRef = useRef<HTMLDivElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, visible: false });

  useEffect(() => {
    const container = containerRef.current;
    const webglCanvas = webglCanvasRef.current;
    const paintCanvas = paintCanvasRef.current;
    if (!container || !webglCanvas || !paintCanvas) return;

    // ─────────────────────────────────────────────────────────────
    //  A) THREE.JS – Water Distortion Image Layer (z=0, below)
    // ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ canvas: webglCanvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // This Vector2 is the ACTUAL VALUE — we animate it with GSAP and
    // the uniform reads from it directly via reference
    const mouseVec2 = new THREE.Vector2(0.5, 0.5);

    const uniforms = {
      uTexture: { value: null as THREE.Texture | null },
      uTexRes: { value: new THREE.Vector2(1, 1) },
      uRes: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      uMouse: { value: mouseVec2 },   // ← { value: ... } wrapper is required
      uTime: { value: 0.0 },
    };

    const textCanvas = document.createElement('canvas');
    textCanvas.width = 2048;
    textCanvas.height = 1024;
    const tCtx = textCanvas.getContext('2d');
    if (tCtx) {
      tCtx.fillStyle = '#000000';
      tCtx.fillRect(0, 0, textCanvas.width, textCanvas.height);

      tCtx.fillStyle = '#ffffff';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      tCtx.font = '900 180px "Inter", system-ui, sans-serif';
      tCtx.letterSpacing = '30px';
      tCtx.fillText('MONOSIGHT', textCanvas.width / 2, textCanvas.height / 2);

      tCtx.fillStyle = '#ffffffff';
      tCtx.textAlign = 'center';
      tCtx.textBaseline = 'middle';
      tCtx.font = '300 36px "Inter", system-ui, sans-serif';
      tCtx.letterSpacing = '50px';
      tCtx.fillText('EFFECT PLAYGROUND', textCanvas.width / 2, textCanvas.height / 1.5);
    }

    const texture = new THREE.CanvasTexture(textCanvas);
    texture.minFilter = THREE.LinearFilter;
    uniforms.uTexture.value = texture;
    uniforms.uTexRes.value.set(textCanvas.width, textCanvas.height);

    const vert = `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `;

    const frag = `
      uniform sampler2D uTexture;
      uniform vec2 uTexRes;
      uniform vec2 uRes;
      uniform vec2 uMouse;
      uniform float uTime;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
                   mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
      }

      void main() {
        vec2 uv = vUv;
        float sr = uRes.x / uRes.y;
        float tr = uTexRes.x / uTexRes.y;
        vec2 cUv = uv;
        if (sr > tr) { float s = tr/sr; cUv.y = (uv.y-0.5)*s+0.5; }
        else          { float s = sr/tr; cUv.x = (uv.x-0.5)*s+0.5; }

        // Aspect-correct space for distance calc
        vec2 st    = vec2(uv.x * sr, uv.y);
        vec2 mouse = vec2(uMouse.x * sr, uMouse.y);
        float d    = distance(st, mouse);

        // Proximity falloff (0 far → 1 near cursor)
        float prox = smoothstep(0.55, 0.0, d);

        // Organic noise turbulence
        float n1 = noise(uv * 7.0 + uTime * 0.35);
        float n2 = noise(uv * 4.5 - uTime * 0.28 + 3.7);

        // Concentric ripple rings from cursor
        float ring  = sin(d * 28.0 - uTime * 4.0) * 0.5 + 0.5;
        float ring2 = sin(d * 16.0 - uTime * 3.0 + 1.2) * 0.5 + 0.5;
        float wave  = mix(ring, ring2, n1) * prox;

        // Direction away from cursor for displacement
        vec2 dir = normalize(uv - uMouse + 0.0001);

        // Combined displacement: ripple rings + noise turbulence
        float disp = wave * 0.013 + (n1*0.55 + n2*0.45) * prox * 0.009;
        vec2 displaced = cUv + dir * disp;

        gl_FragColor = texture2D(uTexture, displaced);
      }
    `;

    const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms });
    const geo = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geo, mat));

    let glRaf: number;
    let t = 0;
    const glLoop = () => {
      t += 0.016;
      uniforms.uTime.value = t;
      renderer.render(scene, camera);
      glRaf = requestAnimationFrame(glLoop);
    };
    glLoop();

    // ─────────────────────────────────────────────────────────────
    //  B) CANVAS 2D – White Paint Erase Mask (z=10, above)
    // ─────────────────────────────────────────────────────────────
    const ctx = paintCanvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    let W = 0, H = 0;

    const resizeAll = () => {
      W = container.clientWidth;
      H = container.clientHeight;
      // Resize WebGL
      renderer.setSize(W, H);
      uniforms.uRes.value.set(W, H);
      // Resize 2D canvas
      paintCanvas.width = W * dpr;
      paintCanvas.height = H * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeAll();
    window.addEventListener('resize', resizeAll);

    const points = { current: [] as BrushPoint[] };
    let lastPos: { x: number; y: number } | null = null;

    const addPoint = (x: number, y: number) => {
      points.current.push({ x, y, time: Date.now(), size: 85 + Math.random() * 30 });
    };

    let paintRaf: number;
    const MAX_AGE = 1600;

    const paintLoop = () => {
      const now = Date.now();
      points.current = points.current.filter(p => now - p.time < MAX_AGE);

      // Full white paint layer
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#f5f2ee';
      ctx.fillRect(0, 0, W, H);

      // Erase brush strokes (punch transparent holes)
      ctx.globalCompositeOperation = 'destination-out';
      for (const p of points.current) {
        const age = now - p.time;
        const life = Math.max(0, 1 - age / MAX_AGE);
        const ease = Math.pow(life, 2.0);
        const r = p.size * ease;
        if (r < 1) continue;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(0.45, 'rgba(0,0,0,0.75)');
        grad.addColorStop(0.8, 'rgba(0,0,0,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      paintRaf = requestAnimationFrame(paintLoop);
    };
    paintLoop();

    // ─────────────────────────────────────────────────────────────
    //  C) MOUSE EVENTS
    // ─────────────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      setHasInteracted(true);
      const rect = container.getBoundingClientRect();
      const lx = e.clientX - rect.left;
      const ly = e.clientY - rect.top;

      // 1. Update cursor ring position (instant)
      setCursorPos({ x: lx, y: ly, visible: true });

      // 2. Move water distortion toward cursor (lagged for organic feel)
      gsap.to(mouseVec2, {
        x: lx / W,
        y: 1.0 - ly / H,        // flip Y for WebGL
        duration: 0.9,
        ease: 'power2.out',
      });

      // 3. Add brush stroke points for paint erase
      if (lastPos) {
        const dist = Math.hypot(lx - lastPos.x, ly - lastPos.y);
        const steps = Math.max(1, Math.floor(dist / 10));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          addPoint(
            lastPos.x + (lx - lastPos.x) * t,
            lastPos.y + (ly - lastPos.y) * t,
          );
        }
      } else {
        addPoint(lx, ly);
      }
      lastPos = { x: lx, y: ly };
    };

    const onLeave = () => {
      lastPos = null;
      setCursorPos(p => ({ ...p, visible: false }));
    };

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('resize', resizeAll);
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(glRaf);
      cancelAnimationFrame(paintRaf);
      geo.dispose();
      mat.dispose();
      uniforms.uTexture.value?.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden cursor-none">

      {/* WebGL: liquid water image (behind) */}
      <canvas ref={webglCanvasRef} className="absolute inset-0 z-0 w-full h-full block" />

      {/* Removed old MONOSIGHT text layer */}

      {/* Canvas 2D: white paint mask (in front, erased by brush) */}
      <canvas ref={paintCanvasRef} className="absolute inset-0 z-10 w-full h-full block pointer-events-none" />

      {/* Hint */}
      <AnimatePresence>
        {!hasInteracted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          >
            <span className="text-zinc-500 uppercase tracking-[0.5em] text-[10px] font-medium">
              Gerakkan Kursor
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom cursor ring */}
      <motion.div
        animate={{
          left: cursorPos.x,
          top: cursorPos.y,
          opacity: cursorPos.visible ? 1 : 0,
          scale: cursorPos.visible ? 1 : 0.3,
        }}
        style={{ transform: 'translate(-50%, -50%)' }}
        transition={{ type: 'tween', duration: 0 }}
        className="absolute top-0 left-0 z-50 pointer-events-none w-10 h-10 rounded-full border border-zinc-400/50 mix-blend-multiply"
      />
    </div>
  );
}
