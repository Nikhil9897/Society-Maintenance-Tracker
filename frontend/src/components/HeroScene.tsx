import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { Sparkles, Layers, Maximize2, Move3D } from 'lucide-react';

// Color Palette for Architectural Elements
const COLORS = {
  deepInk: '#091322',
  slateNavy: '#132238',
  coolSteel: '#1e324d',
  accentBrass: '#C9A468',
  brightGold: '#DFBE82',
  warmGlow: '#F59E0B',
  cyanGlow: '#38BDF8',
  parchment: '#E8E4DC',
  glass: '#2a4365',
  ground: '#070f1c',
};

interface BlockDefinition {
  id: string;
  name: string;
  basePos: [number, number, number];
  size: [number, number, number];
  color: string;
  metalness: number;
  roughness: number;
  explodeOffset: [number, number, number];
  explodeRot: [number, number, number];
  isGlass?: boolean;
  isAccent?: boolean;
  isGlow?: boolean;
  glowColor?: string;
}

// Generate balanced, beautifully proportioned building cluster blocks
const createBuildingBlocks = (): BlockDefinition[] => {
  return [
    // ─── TOWER A: High-Rise Central Tower (Left-Center) ───
    {
      id: 'tower_a_podium',
      name: 'Tower A - Foundation & Lobby',
      basePos: [-0.8, -0.15, -0.2],
      size: [1.6, 0.55, 1.6],
      color: COLORS.slateNavy,
      metalness: 0.3,
      roughness: 0.6,
      explodeOffset: [-0.9, 0.2, -0.6],
      explodeRot: [0.06, -0.15, 0.04],
    },
    {
      id: 'tower_a_lobby_glass',
      name: 'Tower A - Glazed Atrium',
      basePos: [-0.8, -0.15, 0.62],
      size: [1.4, 0.48, 0.05],
      color: COLORS.accentBrass,
      metalness: 0.8,
      roughness: 0.2,
      explodeOffset: [-1.1, 0.35, 0.3],
      explodeRot: [0.04, 0.2, -0.06],
      isAccent: true,
    },
    {
      id: 'tower_a_floor_1_3',
      name: 'Tower A - Lower Residential Tier',
      basePos: [-0.8, 0.5, -0.2],
      size: [1.45, 0.75, 1.45],
      color: COLORS.deepInk,
      metalness: 0.25,
      roughness: 0.65,
      explodeOffset: [-1.2, 0.8, -0.7],
      explodeRot: [0.1, -0.2, 0.08],
    },
    {
      id: 'tower_a_floor_1_3_accent',
      name: 'Tower A - Floor 1-3 Brass Ribs',
      basePos: [-0.8, 0.5, 0.54],
      size: [1.47, 0.77, 0.04],
      color: COLORS.brightGold,
      metalness: 0.7,
      roughness: 0.25,
      explodeOffset: [-1.3, 0.95, 0.15],
      explodeRot: [0.08, 0.15, -0.04],
      isAccent: true,
    },
    {
      id: 'tower_a_floor_4_6',
      name: 'Tower A - Mid Residential Tier',
      basePos: [-0.8, 1.25, -0.2],
      size: [1.3, 0.75, 1.3],
      color: COLORS.slateNavy,
      metalness: 0.3,
      roughness: 0.55,
      explodeOffset: [-1.0, 1.6, -0.5],
      explodeRot: [-0.08, -0.25, 0.1],
    },
    {
      id: 'tower_a_balcony_mid',
      name: 'Tower A - Cantilever Balcony',
      basePos: [-0.1, 1.25, -0.2],
      size: [0.18, 0.09, 1.1],
      color: COLORS.accentBrass,
      metalness: 0.6,
      roughness: 0.3,
      explodeOffset: [0.4, 1.7, -0.25],
      explodeRot: [0.15, 0.08, 0.15],
      isAccent: true,
    },
    {
      id: 'tower_a_penthouse',
      name: 'Tower A - Executive Penthouse',
      basePos: [-0.8, 1.95, -0.2],
      size: [1.1, 0.65, 1.1],
      color: COLORS.deepInk,
      metalness: 0.4,
      roughness: 0.45,
      explodeOffset: [-0.8, 2.3, -0.3],
      explodeRot: [0.12, -0.3, 0.12],
    },
    {
      id: 'tower_a_crown',
      name: 'Tower A - Sky Terrace & Crown',
      basePos: [-0.8, 2.32, -0.2],
      size: [1.22, 0.07, 1.22],
      color: COLORS.brightGold,
      metalness: 0.9,
      roughness: 0.15,
      explodeOffset: [-0.7, 2.85, -0.2],
      explodeRot: [0.04, -0.35, 0.08],
      isAccent: true,
    },
    {
      id: 'tower_a_beacon',
      name: 'Tower A - Rooftop Heli-Structure',
      basePos: [-0.62, 2.46, -0.08],
      size: [0.36, 0.18, 0.36],
      color: COLORS.parchment,
      metalness: 0.5,
      roughness: 0.3,
      explodeOffset: [-0.5, 3.2, 0.1],
      explodeRot: [0.2, 0.15, -0.15],
      isGlow: true,
      glowColor: COLORS.warmGlow,
    },

    // ─── TOWER B: Mid-Rise Modern Wing (Right) ───
    {
      id: 'tower_b_base',
      name: 'Tower B - Commercial Base',
      basePos: [1.1, -0.15, 0.2],
      size: [1.3, 0.55, 1.4],
      color: COLORS.deepInk,
      metalness: 0.3,
      roughness: 0.6,
      explodeOffset: [1.1, 0.15, 0.6],
      explodeRot: [-0.08, 0.2, -0.08],
    },
    {
      id: 'tower_b_mid_tier',
      name: 'Tower B - Mid Residences',
      basePos: [1.1, 0.45, 0.2],
      size: [1.2, 0.65, 1.3],
      color: COLORS.slateNavy,
      metalness: 0.25,
      roughness: 0.6,
      explodeOffset: [1.4, 0.85, 0.7],
      explodeRot: [0.1, 0.25, -0.1],
    },
    {
      id: 'tower_b_upper_tier',
      name: 'Tower B - Sky Suites',
      basePos: [1.1, 1.05, 0.2],
      size: [1.05, 0.55, 1.15],
      color: COLORS.deepInk,
      metalness: 0.35,
      roughness: 0.5,
      explodeOffset: [1.6, 1.55, 0.65],
      explodeRot: [-0.12, 0.3, 0.08],
    },
    {
      id: 'tower_b_solar_roof',
      name: 'Tower B - Solar Canopy Deck',
      basePos: [1.1, 1.38, 0.2],
      size: [1.15, 0.05, 1.25],
      color: COLORS.accentBrass,
      metalness: 0.85,
      roughness: 0.2,
      explodeOffset: [1.8, 2.15, 0.6],
      explodeRot: [0.08, 0.35, -0.12],
      isAccent: true,
    },
    {
      id: 'tower_b_accent_vertical',
      name: 'Tower B - Architectural Fin',
      basePos: [1.76, 0.45, 0.2],
      size: [0.04, 1.6, 0.18],
      color: COLORS.brightGold,
      metalness: 0.8,
      roughness: 0.2,
      explodeOffset: [2.1, 1.05, 0.35],
      explodeRot: [0.0, 0.15, -0.2],
      isAccent: true,
    },

    // ─── SKY BRIDGE (Connecting Tower A & B) ───
    {
      id: 'skybridge_span',
      name: 'Inter-Tower Skybridge Link',
      basePos: [0.15, 1.02, -0.05],
      size: [0.7, 0.2, 0.32],
      color: COLORS.brightGold,
      metalness: 0.85,
      roughness: 0.2,
      explodeOffset: [0.2, 1.8, -0.8],
      explodeRot: [0.25, 0.35, 0.15],
      isAccent: true,
    },
    {
      id: 'skybridge_glass',
      name: 'Skybridge Glass Enclosure',
      basePos: [0.15, 1.02, -0.05],
      size: [0.68, 0.17, 0.35],
      color: COLORS.cyanGlow,
      metalness: 0.1,
      roughness: 0.1,
      explodeOffset: [0.2, 2.0, -1.0],
      explodeRot: [0.15, 0.5, 0.08],
      isGlow: true,
      glowColor: COLORS.cyanGlow,
    },

    // ─── WING C: Garden Villas & Clubhouse (Front-Left) ───
    {
      id: 'clubhouse_lower',
      name: 'Civic Clubhouse & Lounge',
      basePos: [-0.9, -0.2, 1.05],
      size: [1.1, 0.42, 0.85],
      color: COLORS.coolSteel,
      metalness: 0.3,
      roughness: 0.6,
      explodeOffset: [-1.2, -0.05, 1.5],
      explodeRot: [0.15, -0.2, -0.08],
    },
    {
      id: 'clubhouse_terrace',
      name: 'Rooftop Garden Terrace',
      basePos: [-0.9, 0.08, 1.05],
      size: [0.88, 0.18, 0.7],
      color: COLORS.slateNavy,
      metalness: 0.2,
      roughness: 0.7,
      explodeOffset: [-1.5, 0.5, 1.7],
      explodeRot: [0.2, -0.25, 0.04],
    },
    {
      id: 'clubhouse_pergola',
      name: 'Clubhouse Brass Canopy',
      basePos: [-0.9, 0.22, 1.05],
      size: [0.94, 0.04, 0.76],
      color: COLORS.accentBrass,
      metalness: 0.8,
      roughness: 0.25,
      explodeOffset: [-1.7, 0.95, 1.85],
      explodeRot: [0.25, -0.15, 0.08],
      isAccent: true,
    },

    // ─── WING D: North Townhouses (Back-Right) ───
    {
      id: 'wing_d_base',
      name: 'North Villa Block A',
      basePos: [1.15, -0.2, -1.0],
      size: [1.0, 0.45, 0.85],
      color: COLORS.coolSteel,
      metalness: 0.25,
      roughness: 0.65,
      explodeOffset: [1.4, 0.05, -1.4],
      explodeRot: [-0.15, 0.25, 0.1],
    },
    {
      id: 'wing_d_upper',
      name: 'North Villa Block B',
      basePos: [1.15, 0.15, -1.0],
      size: [0.78, 0.35, 0.7],
      color: COLORS.slateNavy,
      metalness: 0.3,
      roughness: 0.6,
      explodeOffset: [1.7, 0.7, -1.6],
      explodeRot: [-0.2, 0.35, -0.08],
    },
    {
      id: 'wing_d_roof',
      name: 'Villa Solar Overhang',
      basePos: [1.15, 0.36, -1.0],
      size: [0.84, 0.04, 0.76],
      color: COLORS.brightGold,
      metalness: 0.85,
      roughness: 0.2,
      explodeOffset: [1.9, 1.25, -1.8],
      explodeRot: [-0.08, 0.45, 0.15],
      isAccent: true,
    },

    // ─── COURTYARD & PODIUM MATRIX ───
    {
      id: 'podium_main',
      name: 'Central Society Plaza & Podium',
      basePos: [0.0, -0.45, 0.0],
      size: [4.0, 0.1, 3.5],
      color: COLORS.ground,
      metalness: 0.4,
      roughness: 0.8,
      explodeOffset: [0.0, -0.4, 0.0],
      explodeRot: [0.0, 0.03, 0.0],
    },
    {
      id: 'podium_accent_tile_left',
      name: 'West Walkway & Water Feature',
      basePos: [-0.1, -0.38, 0.75],
      size: [0.8, 0.03, 0.8],
      color: COLORS.cyanGlow,
      metalness: 0.1,
      roughness: 0.1,
      explodeOffset: [-0.15, -0.35, 1.1],
      explodeRot: [0.06, -0.15, 0.0],
      isGlow: true,
      glowColor: COLORS.cyanGlow,
    },
    {
      id: 'podium_accent_tile_right',
      name: 'East Promenade Brass Inlay',
      basePos: [0.25, -0.38, -0.8],
      size: [0.95, 0.03, 0.6],
      color: COLORS.brightGold,
      metalness: 0.8,
      roughness: 0.2,
      explodeOffset: [0.35, -0.35, -1.1],
      explodeRot: [-0.08, 0.15, 0.0],
      isAccent: true,
    },
  ];
};

interface BuildingBlockMeshProps {
  block: BlockDefinition;
  isExploded: boolean;
  hoveredBlock: string | null;
  onPointerOver: (id: string) => void;
  onPointerOut: () => void;
}

const BuildingBlockMesh: React.FC<BuildingBlockMeshProps> = ({
  block,
  isExploded,
  hoveredBlock,
  onPointerOver,
  onPointerOut,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const isHovered = hoveredBlock === block.id;

  // Target values based on exploded state
  const targetPos = useMemo(() => {
    if (isExploded) {
      return new THREE.Vector3(
        block.basePos[0] + block.explodeOffset[0],
        block.basePos[1] + block.explodeOffset[1],
        block.basePos[2] + block.explodeOffset[2]
      );
    }
    return new THREE.Vector3(...block.basePos);
  }, [isExploded, block]);

  const targetRot = useMemo(() => {
    if (isExploded) {
      return new THREE.Euler(...block.explodeRot);
    }
    return new THREE.Euler(0, 0, 0);
  }, [isExploded, block]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Smooth spring-like lerp to target position and rotation
    const lerpFactor = Math.min(delta * 4.5, 0.25);
    meshRef.current.position.lerp(targetPos, lerpFactor);

    // Floating micro-oscillation when exploded
    if (isExploded) {
      const t = state.clock.getElapsedTime();
      const floatY = Math.sin(t * 1.8 + block.basePos[0] * 2.5 + block.basePos[2] * 2) * 0.03;
      meshRef.current.position.y += floatY * delta;

      const floatRotY = Math.cos(t * 1.2 + block.basePos[1] * 2) * 0.015;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRot.y + floatRotY,
        lerpFactor
      );
    } else {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.x, lerpFactor);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.y, lerpFactor);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRot.z, lerpFactor);
    }

    // Scale punch on hover
    const targetScale = isHovered ? 1.04 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 8
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={block.basePos}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver(block.id);
      }}
      onPointerOut={() => onPointerOut()}
    >
      <boxGeometry args={block.size} />
      <meshStandardMaterial
        color={
          isHovered
            ? COLORS.brightGold
            : block.isGlow
            ? block.glowColor || COLORS.warmGlow
            : block.color
        }
        metalness={block.metalness}
        roughness={block.roughness}
        emissive={
          block.isGlow
            ? block.glowColor || COLORS.warmGlow
            : isHovered
            ? COLORS.accentBrass
            : '#000000'
        }
        emissiveIntensity={block.isGlow ? 0.8 : isHovered ? 0.35 : 0.0}
        transparent={block.isGlow}
        opacity={block.isGlow ? 0.85 : 1.0}
      />
      {/* High-tech blueprint edges on blocks */}
      <Edges
        scale={1.002}
        threshold={15}
        color={
          isHovered
            ? COLORS.brightGold
            : block.isAccent
            ? COLORS.brightGold
            : 'rgba(232, 228, 220, 0.28)'
        }
      />
    </mesh>
  );
};

// Dynamic Camera Rig that smoothly dollies out when exploded to keep all blocks perfectly framed
const CameraRig: React.FC<{ isExploded: boolean }> = ({ isExploded }) => {
  const targetPos = useMemo(() => {
    return isExploded ? new THREE.Vector3(7.4, 5.2, 7.4) : new THREE.Vector3(5.6, 3.8, 5.6);
  }, [isExploded]);

  useFrame((state, delta) => {
    state.camera.position.lerp(targetPos, Math.min(delta * 3.2, 0.15));
    state.camera.lookAt(0, isExploded ? 0.5 : 0.4, 0);
  });

  return null;
};

// Main interactive cluster group
const BuildingCluster: React.FC<{ isExploded: boolean; onToggle: () => void }> = ({
  isExploded,
  onToggle,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const blocks = useMemo(() => createBuildingBlocks(), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Gentle global rotation: slow continuous orbit
    const rotSpeed = isExploded ? 0.03 : 0.06;
    groupRef.current.rotation.y += delta * rotSpeed;
    groupRef.current.rotation.x = Math.sin(t * 0.35) * 0.025;
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {blocks.map((block) => (
        <BuildingBlockMesh
          key={block.id}
          block={block}
          isExploded={isExploded}
          hoveredBlock={hoveredBlock}
          onPointerOver={setHoveredBlock}
          onPointerOut={() => setHoveredBlock(null)}
        />
      ))}
    </group>
  );
};

export const HeroScene: React.FC = () => {
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  const handleToggle = () => {
    setIsExploded((prev) => !prev);
    setHasInteracted(true);
  };

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[580px] select-none cursor-pointer group flex items-center justify-center">
      <Canvas
        shadows
        camera={{ position: [5.6, 3.8, 5.6], fov: 38 }}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          color="#FFE8C0"
        />
        <directionalLight position={[-5, 3, -4]} intensity={0.7} color="#38BDF8" />
        <pointLight position={[0, 5, 0]} intensity={0.9} color="#F6F4EF" />
        <pointLight position={[-2, 1, 2]} intensity={0.6} color="#C9A468" />

        <Suspense fallback={null}>
          <CameraRig isExploded={isExploded} />
          <Float speed={1.1} rotationIntensity={0.08} floatIntensity={0.15}>
            <BuildingCluster isExploded={isExploded} onToggle={handleToggle} />
          </Float>
          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.6}
            scale={9}
            blur={2.4}
            far={5}
            color="#040914"
          />
          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 6}
          rotateSpeed={0.6}
        />
      </Canvas>

      {/* Floating Interactive HUD / Action Badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0c1626]/85 backdrop-blur-md border border-parchment/15 hover:border-brass/50 text-parchment text-xs font-mono transition-all duration-300 shadow-xl hover:scale-105 active:scale-95 group/btn"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isExploded ? 'bg-amber-400' : 'bg-brass'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isExploded ? 'bg-amber-400' : 'bg-brass'
              }`}
            />
          </span>

          <span className="font-medium text-parchment/90 group-hover/btn:text-brass transition-colors">
            {isExploded ? 'Recombine Building Cluster' : 'Disintegrate 3D Cluster'}
          </span>

          {isExploded ? (
            <Layers size={13} className="text-amber-400 animate-pulse" />
          ) : (
            <Maximize2 size={13} className="text-brass group-hover/btn:rotate-45 transition-transform" />
          )}
        </button>
      </div>

      {/* Minimal corner hint */}
      {!hasInteracted && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ink/70 border border-parchment/10 text-[11px] font-mono text-slate/80 backdrop-blur-xs">
          <Sparkles size={11} className="text-brass" />
          <span>Click anywhere to explode & recombine</span>
        </div>
      )}
    </div>
  );
};
