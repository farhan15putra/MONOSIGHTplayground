import { useRef, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { damp } from 'maath/easing';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: number;
  url: string;
  title: string;
}

interface ImageMeshProps {
  item: GalleryItem;
  index: number;
  total: number;
  scrollRef: React.MutableRefObject<ScrollState>;
  totalWidth: number;
}

interface ScrollState {
  current: number;
  target: number;
  velocity: number;
  /** 0 = fully stopped/flat, 1 = max scroll speed */
  strength: number;
  isDragging: boolean;
  lastX: number;
}

// ─── Gallery Data ─────────────────────────────────────────────────────────────

const SOURCE_ITEMS = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', title: 'ALPINE' },
  { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80', title: 'FOREST' },
  { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&q=80', title: 'OCEAN' },
  { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80', title: 'VALLEY' },
  { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80', title: 'SUMMIT' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80', title: 'DUSK' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80', title: 'PEAK' },
  { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80', title: 'TRAIL' },
];

const GALLERY_ITEMS: GalleryItem[] = SOURCE_ITEMS.map((s, i) => ({ ...s, id: i }));

// ─── Shaders ─────────────────────────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */ `
  uniform float uScrollStrength; // 0 = stopped/flat, 1 = fast scroll
  uniform float uCurvature;
  uniform float uStrength;
  uniform float uViewportWidth;
  uniform float uScrollVelocity;
  uniform float uOffset; // Tambahan untuk geser pusat

  varying vec2  vUv;
  varying float vDistToCenter;

  void main() {
    vUv = uv;

    vec4 worldPos = modelMatrix * vec4(position, 1.0);

    // Normalised X distance from screen center [-1, 1]
    // Ditambah uOffset untuk menggeser pusat efek
    float dist = (worldPos.x + uOffset) / (uViewportWidth * 0.5);
    vDistToCenter = dist;

    // ── Gaussian center-focus window ──────────────────────────────────────────
    // Only the strip(s) near X=0 get strong distortion.
    // exp(-x² * k): k=4 → FWHM ~1 strip wide; raise k for tighter focus.
    float centerGauss = exp(-dist * dist * 4.5);

    // ── Cylindrical bow (CEMBUNG) ─────────────────────────────────────────────
    // Gunakan cos supaya titik dist=0 (tengah) adalah titik tertinggi/maju.
    float zOffset = cos(dist * uCurvature) * uStrength
                    * uScrollStrength           // 0 saat diam
                    * centerGauss;              // fokus di tengah

    // ── Scroll-speed lean (shear on Y axis) ──────────────────────────────────
    float xLean = uScrollVelocity * position.y * 0.002 * centerGauss;

    vec3 pos = position;
    pos.z   += zOffset;
    pos.x   += xLean;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2      uTextureSize;
  uniform vec2      uPlaneSize;
  uniform float     uScrollStrength;
  uniform float     uScrollVelocity;
  uniform float     uOffset;
  uniform float     uParallax;

  varying vec2  vUv;
  varying float vDistToCenter;

  // Cover sampling — no stretching
  vec2 coverUv(vec2 uv, vec2 texSize, vec2 planeSize) {
    float tA = texSize.x / texSize.y;
    float pA = planeSize.x / planeSize.y;
    vec2 s = vec2(1.0);
    if (tA > pA) { s.x = pA / tA; } else { s.y = tA / pA; }
    return (uv - 0.5) * s + 0.5;
  }

  void main() {
    vec2 uv = coverUv(vUv, uTextureSize, uPlaneSize);

    // ── Parallax Effect ───────────────────────────────────────────────────────
    // Geser UV secara horizontal berdasarkan posisi strip di layar
    uv.x += vDistToCenter * uParallax;

    // Chromatic split (only while scrolling, only center)
    float split = uScrollVelocity * 0.003;
    float r = texture2D(uTexture, uv + vec2(split, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - vec2(split, 0.0)).b;
    vec3 col = vec3(r, g, b);

    // ── Monochrome base ───────────────────────────────────────────────────────
    float grey = dot(col, vec3(0.299, 0.587, 0.114));

    // Center focus — same Gaussian as vertex shader (k=4.5 → tight window)
    float centerGauss = exp(-vDistToCenter * vDistToCenter * 4.5);

    // Saturation = scroll speed × center proximity
    // → center strip goes full color on fast scroll, mono when stopped
    float satAmt = uScrollStrength * centerGauss;

    col = mix(vec3(grey), col, satAmt);

    // ── Dim off-center strips slightly ───────────────────────────────────────
    float brightness = mix(0.55, 1.0, centerGauss * 0.45 + 0.55);
    col *= brightness;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── Custom Shader Material ───────────────────────────────────────────────────

class CylindricalMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTexture: { value: null },
        uTextureSize: { value: new THREE.Vector2(600, 400) },
        uPlaneSize: { value: new THREE.Vector2(0.92, 2.6) },
        uScrollStrength: { value: 0 },
        uScrollVelocity: { value: 0 },
        uCurvature: { value: 1.6 },
        uStrength: { value: 2.2 },
        uViewportWidth: { value: 12 },
        uOffset: { value: 0 }, // 0 = Geser pusat ke kiri. Ganti ke -0.5 untuk geser ke kanan.
        uParallax: { value: 0.15 }, // Intensitas parallax
      },
    });
  }
}

extend({ CylindricalMaterial });

// ─── Layout Constants ─────────────────────────────────────────────────────────

const PLANE_W = 0.92;
const PLANE_H = 2.6;
const GAP = 0.08;
const STEP = PLANE_W + GAP;
const SEG_X = 28;
const SEG_Y = 36;

// ─── Image Mesh ───────────────────────────────────────────────────────────────

function ImageMesh({ item, index, total, scrollRef, totalWidth }: ImageMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<CylindricalMaterial>(null!);

  const texture = useTexture(item.url);
  texture.colorSpace = THREE.SRGBColorSpace;

  const { viewport } = useThree();

  const baseX = useMemo(() => {
    const bandWidth = total * STEP - GAP;
    return index * STEP - bandWidth / 2 + PLANE_W / 2;
  }, [index, total]);

  useFrame(() => {
    if (!meshRef.current || !matRef.current) return;
    const scroll = scrollRef.current;

    // Infinite modulo wrapping
    let raw = baseX - scroll.current;
    const half = totalWidth / 2;
    raw = ((raw + half) % totalWidth + totalWidth) % totalWidth - half;
    meshRef.current.position.x = raw;

    const u = matRef.current.uniforms;
    u.uTexture.value = texture;
    u.uScrollStrength.value = scroll.strength;
    u.uScrollVelocity.value = scroll.velocity;
    u.uViewportWidth.value = viewport.width;
    u.uOffset.value = 0.5; // Lo bisa ganti angka ini di sini juga buat tweak cepat
  });

  return (
    <mesh ref={meshRef} position={[baseX, 0, -2]}>
      <planeGeometry args={[PLANE_W, PLANE_H, SEG_X, SEG_Y]} />
      {/* @ts-ignore */}
      <cylindricalMaterial
        ref={matRef}
        key={CylindricalMaterial.name}
        uniforms-uTextureSize-value={[(texture.image as any)?.width ?? 600, (texture.image as any)?.height ?? 900]}
        uniforms-uPlaneSize-value={[PLANE_W, PLANE_H]}
        uniforms-uCurvature-value={1}
        uniforms-uStrength-value={1.6}
        uniforms-uParallax-value={0.3} // Ganti angka ini buat atur kencangnya parallax
      />
    </mesh>
  );
}

// ─── Scene Root ───────────────────────────────────────────────────────────────

function Scene({ scrollRef }: { scrollRef: React.MutableRefObject<ScrollState> }) {
  const totalWidth = GALLERY_ITEMS.length * STEP;

  // Internal damped strength object for maath damp()
  const strengthDamp = useRef({ value: 0 });

  useFrame((_, delta) => {
    const scroll = scrollRef.current;

    // Smooth-damp position
    const prevCurrent = scroll.current;
    damp(scroll, 'current', scroll.target, 0.075, delta);
    const rawVelocity = (scroll.current - prevCurrent) / Math.max(delta, 0.001);
    scroll.velocity = rawVelocity;

    // Map velocity → 0–1 strength, then damp it so it trails off smoothly
    const targetStrength = Math.min(Math.abs(rawVelocity) * 0.55, 1.0);
    damp(strengthDamp.current, 'value', targetStrength, 0.18, delta);
    scroll.strength = strengthDamp.current.value;
  });

  return (
    <>
      {GALLERY_ITEMS.map((item, i) => (
        <ImageMesh
          key={item.id}
          item={item}
          index={i}
          total={GALLERY_ITEMS.length}
          scrollRef={scrollRef}
          totalWidth={totalWidth}
        />
      ))}
    </>
  );
}

// ─── Scroll Handler Hook ──────────────────────────────────────────────────────

function useScrollHandler(scrollRef: React.MutableRefObject<ScrollState>) {
  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      scrollRef.current.target += (e.deltaY + e.deltaX) * 0.005;
    },
    [scrollRef]
  );

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      scrollRef.current.isDragging = true;
      scrollRef.current.lastX = e.clientX;
    },
    [scrollRef]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!scrollRef.current.isDragging) return;
      const dx = e.clientX - scrollRef.current.lastX;
      scrollRef.current.target -= dx * 0.01;
      scrollRef.current.lastX = e.clientX;
    },
    [scrollRef]
  );

  const onPointerUp = useCallback(() => {
    scrollRef.current.isDragging = false;
  }, [scrollRef]);

  return { onWheel, onPointerDown, onPointerMove, onPointerUp };
}

// ─── Custom Cursor ────────────────────────────────────────────────────────────

function CursorIndicator() {
  const cursorRef = useRef<HTMLDivElement>(null!);
  const posRef = useRef({ x: -200, y: -200 });
  const smoothRef = useRef({ x: -200, y: -200 });
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    smoothRef.current.x += (posRef.current.x - smoothRef.current.x) * 0.1;
    smoothRef.current.y += (posRef.current.y - smoothRef.current.y) * 0.1;
    if (cursorRef.current) {
      cursorRef.current.style.transform =
        `translate(${smoothRef.current.x - 28}px, ${smoothRef.current.y - 28}px)`;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => { posRef.current.x = e.clientX; posRef.current.y = e.clientY; };
    window.addEventListener('mousemove', move);
    rafRef.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(rafRef.current); };
  }, [animate]);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 w-14 h-14 z-50 flex items-center justify-center"
      style={{ willChange: 'transform' }}
    >
      <div
        className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(6px)' }}
      >
        <span className="text-[7px] font-mono text-white/35 uppercase tracking-widest">drag</span>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function CylindricalGallery() {
  const scrollRef = useRef<ScrollState>({
    current: 0,
    target: 0,
    velocity: 0,
    strength: 0,
    isDragging: false,
    lastX: 0,
  });

  const { onWheel, onPointerDown, onPointerMove, onPointerUp } = useScrollHandler(scrollRef);

  const attachListeners = useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return;
      el.addEventListener('wheel', onWheel, { passive: false });
      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', onPointerUp);
      el.addEventListener('pointerleave', onPointerUp);
    },
    [onWheel, onPointerDown, onPointerMove, onPointerUp]
  );

  return (
    <div
      ref={attachListeners}
      className="w-full h-full relative select-none overflow-hidden cursor-none"
      style={{ background: '#0a0a0a', touchAction: 'none' }}
    >
      {/* WebGL */}
      <Canvas
        camera={{ fov: 52, position: [0, 0, 6], near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 2]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <color attach="background" args={['#0a0a0a']} />
        <Scene scrollRef={scrollRef} />
      </Canvas>

      {/* Label */}
      <div className="pointer-events-none absolute inset-0 flex items-end pb-14 px-10 z-40">
        <div className="mix-blend-difference">
          <p className="text-[5px] font-mono uppercase tracking-[0.35em] text-white/30 mb-2">
            ∞ &nbsp;Infinite Loop
          </p>
          <h2
            className="text-4xl font-light tracking-tighter text-white leading-none"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            GALLERY
          </h2>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[9px] font-mono text-white/20 tracking-widest">
            {GALLERY_ITEMS.length.toString().padStart(2, '0')} WORKS
          </p>
          <p className="text-[9px] font-mono text-white/15 mt-1 uppercase tracking-[0.2em]">
            Scroll → drag → loop
          </p>
        </div>
      </div>

      {/* Radial vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: 'radial-gradient(ellipse 60% 110% at 50% 50%, transparent 10%, rgba(10,10,10,0.88) 100%)',
        }}
      />

      {/* Edge fades — hides the infinite-loop teleport */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-20"
        style={{ width: '13%', background: 'linear-gradient(to right, #0a0a0a, transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-20"
        style={{ width: '13%', background: 'linear-gradient(to left, #0a0a0a, transparent)' }}
      />

      {/* Top badge */}
      <div className="absolute top-6 left-6 z-30 flex items-center gap-3">
        <div
          className="px-3 py-1.5 flex items-center gap-2 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/35">
            Cylindrical Gallery · ∞ Loop
          </span>
        </div>
      </div>

      <CursorIndicator />
    </div>
  );
}
