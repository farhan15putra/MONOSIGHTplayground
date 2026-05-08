import { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Shader Logic ────────────────────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  
  varying vec2 vUv;

  // Simple noise function for liquid feel
  float noise(vec2 p) {
    return sin(p.x * 10.0 + uTime) * sin(p.y * 10.0 + uTime * 0.8);
  }

  void main() {
    vec2 uv = vUv;
    
    // Liquid distortion
    float n = noise(uv * 1.5 + noise(uv * 0.5));
    
    // Mix the 4 colors based on UV and noise
    vec3 mix1 = mix(uColor1, uColor2, uv.x + n * 0.2);
    vec3 mix2 = mix(uColor3, uColor4, uv.y - n * 0.2);
    
    vec3 finalColor = mix(mix1, mix2, (uv.x + uv.y) * 0.5 + n * 0.1);
    
    // Add subtle grain/noise for texture
    float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    finalColor += (grain - 0.5) * 0.05;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

class FluidMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uColor1: { value: new THREE.Color('#03AED2') }, // Blue
        uColor2: { value: new THREE.Color('#F8DE22') }, // Yellow
        uColor3: { value: new THREE.Color('#F45B26') }, // Orange
        uColor4: { value: new THREE.Color('#D12052') }, // Red
      },
    });
  }
}

extend({ FluidMaterial });

// ─── Component ───────────────────────────────────────────────────────────────

function Scene() {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      (meshRef.current.material as FluidMaterial).uniforms.uTime.value = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      {/* @ts-ignore */}
      <fluidMaterial />
    </mesh>
  );
}

export default function FigRootShader() {
  return (
    <div className="w-full h-full relative bg-white overflow-hidden">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Scene />
      </Canvas>
      
      {/* Overlay UI dari figroottes lo tapi dibikin rapi */}
      <div className="absolute inset-0 pointer-events-none p-12 flex flex-col justify-between">
        <div>
          <h1 className="text-black font-bold text-6xl tracking-tighter mix-blend-difference invert">
            FIGROOTS
          </h1>
          <p className="text-black/60 font-mono text-sm mt-4 tracking-widest uppercase">
            Color Spectrum & Fluid GLSL
          </p>
        </div>
        
        <div className="flex gap-4">
          {['#03AED2', '#F8DE22', '#F45B26', '#D12052'].map(color => (
            <div key={color} className="flex flex-col gap-2">
              <div 
                className="w-16 h-16 border border-black/10" 
                style={{ backgroundColor: color }} 
              />
              <span className="text-[10px] font-mono text-black/40">{color}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
