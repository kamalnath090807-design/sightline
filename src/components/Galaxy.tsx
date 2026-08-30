import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';

export interface GalaxyProps {
  lightMode?: boolean;
  transparent?: boolean;
  mouseInteraction?: boolean;
  mouseRepulsion?: boolean;
  density?: number;
  glowIntensity?: number;
  saturation?: number;
  hueShift?: number;
  starSpeed?: number;
  speed?: number;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  repulsionStrength?: number;
  disableAnimation?: boolean;
  className?: string;
}

const vertexShader = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uDensity;
  uniform float uGlowIntensity;
  uniform float uSaturation;
  uniform float uHueShift;
  uniform float uStarSpeed;
  uniform float uSpeed;
  uniform float uTwinkleIntensity;
  uniform float uRotationSpeed;
  uniform float uRepulsionStrength;
  uniform float uLightMode;
  uniform float uTransparent;

  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }

  void main() {
    vec2 st = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    
    // Mouse Repulsion
    vec2 mouseNorm = (uMouse - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
    vec2 mouseDiff = st - mouseNorm;
    float mouseDist = length(mouseDiff);
    if (mouseDist < 0.6 && uRepulsionStrength > 0.0) {
      float repulse = (1.0 - smoothstep(0.0, 0.6, mouseDist)) * uRepulsionStrength * 0.08;
      st += normalize(mouseDiff + 0.0001) * repulse;
    }

    st *= rot(uTime * uRotationSpeed * 0.2);

    float t = uTime * uSpeed;
    vec3 col = vec3(0.0);

    // Multi-layer star field
    for (float i = 0.0; i < 4.0; i++) {
      float depth = fract(i * 0.25 + t * 0.05 * uStarSpeed);
      float scale = mix(22.0, 0.8, depth);
      float fade = depth * smoothstep(1.0, 0.8, depth);
      vec2 stLayer = st * scale + vec2(i * 13.5, i * 7.8);
      
      vec2 id = floor(stLayer);
      vec2 gv = fract(stLayer) - 0.5;
      
      float h = hash(id);
      if (h < uDensity * 0.75) {
        float twinkle = sin(uTime * (2.5 + h * 5.0)) * 0.5 + 0.5;
        float size = (0.02 + h * 0.045) * (1.0 + twinkle * uTwinkleIntensity);
        float d = length(gv - (vec2(hash(id + 1.0), hash(id + 2.0)) - 0.5) * 0.6);
        float star = smoothstep(size, 0.0, d) * fade;
        
        // Soft blue / cyan star tint
        vec3 starCol = vec3(
          0.65 + 0.25 * sin(uHueShift * 0.01 + h * 6.28),
          0.80 + 0.20 * cos(uHueShift * 0.01 + h * 6.28 + 1.0),
          1.0
        );
        col += star * starCol * uGlowIntensity * 3.8;
      }
    }

    // Atmospheric Nebula Glow
    float r = length(st);
    float glow = exp(-r * 2.0) * uGlowIntensity * 0.7;
    vec3 nebulaCol = vec3(
      0.12 + 0.18 * sin(uHueShift * 0.01),
      0.35 + 0.25 * cos(uHueShift * 0.01 + 0.8),
      0.85
    );
    col += glow * nebulaCol;

    // Saturation adjustment
    float gray = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(gray), col, uSaturation + 1.0);

    // Light Mode vs Dark Mode Blending
    if (uLightMode > 0.5) {
      // Light Mode: sophisticated pale blue atmosphere with distinct soft cobalt/cyan star particles
      vec3 lightBase = vec3(0.945, 0.968, 0.992); // Pale blue-white #F1F7FD
      vec3 starDust = vec3(0.04, 0.22, 0.62);   // Soft cobalt / cyan-blue
      float lum = clamp(dot(col, vec3(0.333)), 0.0, 1.0);
      vec3 finalCol = mix(lightBase, starDust, lum * 0.65);
      gl_FragColor = vec4(finalCol, 1.0);
    } else {
      // Dark Mode (LOCKED)
      vec3 darkBase = vec3(0.05, 0.06, 0.08); // Obsidian #0E0F12
      vec3 finalCol = darkBase + col * 0.85;
      gl_FragColor = vec4(finalCol, 1.0);
    }
  }
`;

export const Galaxy: React.FC<GalaxyProps> = ({
  lightMode = true,
  transparent = false,
  mouseInteraction = true,
  mouseRepulsion = true,
  density = 0.85,
  glowIntensity = 0.32,
  saturation = 0.35,
  hueShift = 210,
  starSpeed = 0.18,
  speed = 0.32,
  twinkleIntensity = 0.18,
  rotationSpeed = 0.02,
  repulsionStrength = 1.2,
  disableAnimation = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mousePosRef = useRef<[number, number]>([0, 0]);
  const targetMousePosRef = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = !disableAnimation && !prefersReducedMotion;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      powerPreference: 'high-performance',
      antialias: false,
    });

    const gl = renderer.gl;
    const canvas = gl.canvas;
    container.appendChild(canvas);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    const geometry = new Triangle(gl);

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [container.clientWidth, container.clientHeight] },
        uMouse: { value: [container.clientWidth * 0.5, container.clientHeight * 0.5] },
        uDensity: { value: density },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uHueShift: { value: hueShift },
        uStarSpeed: { value: shouldAnimate ? starSpeed : 0 },
        uSpeed: { value: shouldAnimate ? speed : 0 },
        uTwinkleIntensity: { value: shouldAnimate ? twinkleIntensity : 0 },
        uRotationSpeed: { value: shouldAnimate ? rotationSpeed : 0 },
        uRepulsionStrength: { value: mouseRepulsion && !prefersReducedMotion ? repulsionStrength : 0 },
        uLightMode: { value: lightMode ? 1.0 : 0.0 },
        uTransparent: { value: transparent ? 1.0 : 0.0 },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = [width, height];
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseInteraction) return;
      targetMousePosRef.current = [e.clientX, window.innerHeight - e.clientY];
    };

    if (mouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    let startTime = performance.now();

    const update = (now: number) => {
      if (shouldAnimate) {
        program.uniforms.uTime.value = (now - startTime) * 0.001;

        mousePosRef.current[0] += (targetMousePosRef.current[0] - mousePosRef.current[0]) * 0.08;
        mousePosRef.current[1] += (targetMousePosRef.current[1] - mousePosRef.current[1]) * 0.08;
        program.uniforms.uMouse.value = mousePosRef.current;

        renderer.render({ scene: mesh });
        animationFrameRef.current = requestAnimationFrame(update);
      } else {
        program.uniforms.uTime.value = 1.0;
        renderer.render({ scene: mesh });
      }
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    lightMode,
    transparent,
    mouseInteraction,
    mouseRepulsion,
    density,
    glowIntensity,
    saturation,
    hueShift,
    starSpeed,
    speed,
    twinkleIntensity,
    rotationSpeed,
    repulsionStrength,
    disableAnimation,
  ]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default Galaxy;
