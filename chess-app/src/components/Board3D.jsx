import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];
const SQ = 1; // square size in 3D units
const BOARD_Y = 0;
const PIECE_Y = 0.02;

const COLORS = {
  lightSquare: '#e8d0a8',
  darkSquare: '#b58863',
  selected: '#f7f769',
  legalMove: '#7cb342',
  lastMove: '#ced26b',
  boardEdge: '#5c3a1e',
  whitePiece: '#f5f5f0',
  blackPiece: '#2a2a2a',
  whitePieceAccent: '#e8e8e0',
  blackPieceAccent: '#1a1a1a',
};

// Convert algebraic (e.g. "e4") to 3D coords
function sqToPos(sq, flipped) {
  const fi = FILES.indexOf(sq[0]);
  const ri = RANKS.indexOf(sq[1]);
  const col = flipped ? 7 - fi : fi;
  const row = flipped ? 7 - ri : ri;
  return [(col - 3.5) * SQ, BOARD_Y, (row - 3.5) * SQ];
}

// ─── 3D PIECE GEOMETRIES ────────────────────────────────────────────────────

function PawnMesh({ color }) {
  const c = color === 'w' ? COLORS.whitePiece : COLORS.blackPiece;
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.3, 16]} />
        <meshStandardMaterial color={c} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={c} roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

function RookMesh({ color }) {
  const c = color === 'w' ? COLORS.whitePiece : COLORS.blackPiece;
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.4, 8]} />
        <meshStandardMaterial color={c} roughness={0.3} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.1, 8]} />
        <meshStandardMaterial color={c} roughness={0.3} metalness={0.15} />
      </mesh>
    </group>
  );
}

function KnightMesh({ color }) {
  const c = color === 'w' ? COLORS.whitePiece : COLORS.blackPiece;
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 0.4, 16]} />
        <meshStandardMaterial color={c} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0.05, 0.45, 0]} rotation={[0, 0, 0.3]} castShadow>
        <boxGeometry args={[0.12, 0.2, 0.14]} />
        <meshStandardMaterial color={c} roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

function BishopMesh({ color }) {
  const c = color === 'w' ? COLORS.whitePiece : COLORS.blackPiece;
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.18, 0.4, 16]} />
        <meshStandardMaterial color={c} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <coneGeometry args={[0.1, 0.2, 16]} />
        <meshStandardMaterial color={c} roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
}

function QueenMesh({ color }) {
  const c = color === 'w' ? COLORS.whitePiece : COLORS.blackPiece;
  const accent = color === 'w' ? '#d4af37' : '#c0392b';
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 0.44, 16]} />
        <meshStandardMaterial color={c} roughness={0.25} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.46, 0]} castShadow>
        <torusGeometry args={[0.1, 0.025, 8, 16]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.4} />
      </mesh>
    </group>
  );
}

function KingMesh({ color }) {
  const c = color === 'w' ? COLORS.whitePiece : COLORS.blackPiece;
  const accent = color === 'w' ? '#d4af37' : '#c0392b';
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.2, 0.5, 16]} />
        <meshStandardMaterial color={c} roughness={0.25} metalness={0.15} />
      </mesh>
      {/* Cross on top */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[0.04, 0.16, 0.04]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.12, 0.04, 0.04]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.4} />
      </mesh>
    </group>
  );
}

const PIECE_COMPONENTS = { p: PawnMesh, r: RookMesh, n: KnightMesh, b: BishopMesh, q: QueenMesh, k: KingMesh };

// ─── SINGLE SQUARE ──────────────────────────────────────────────────────────

function Square3D({ position, isLight, isSelected, isLegalMove, isLastMove, onClick }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  let color = isLight ? COLORS.lightSquare : COLORS.darkSquare;
  if (isSelected) color = COLORS.selected;
  else if (isLastMove) color = COLORS.lastMove;
  else if (hovered && isLegalMove) color = COLORS.legalMove;

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = isLegalMove ? 'pointer' : 'default'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      receiveShadow
    >
      <planeGeometry args={[SQ * 0.98, SQ * 0.98]} />
      <meshStandardMaterial color={color} roughness={0.8} />
      {/* Legal move indicator */}
      {isLegalMove && !isSelected && (
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[SQ * 0.12, 16]} />
          <meshBasicMaterial color={COLORS.legalMove} transparent opacity={0.7} />
        </mesh>
      )}
    </mesh>
  );
}

// ─── 3D PIECE ON BOARD ──────────────────────────────────────────────────────

function Piece3D({ type, color, position, onClick }) {
  const Component = PIECE_COMPONENTS[type];
  if (!Component) return null;

  return (
    <group
      position={[position[0], PIECE_Y, position[2]]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'grab'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      <Component color={color} />
    </group>
  );
}

// ─── BOARD FRAME ────────────────────────────────────────────────────────────

function BoardFrame() {
  return (
    <group>
      {/* Board base */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[SQ * 8.4, 0.1, SQ * 8.4]} />
        <meshStandardMaterial color={COLORS.boardEdge} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Table surface */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[SQ * 10, 0.02, SQ * 10]} />
        <meshStandardMaterial color="#2a2520" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─── FILE/RANK LABELS ───────────────────────────────────────────────────────

function BoardLabels({ flipped }) {
  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const labels = [];

  // File labels (a-h) along bottom
  for (let i = 0; i < 8; i++) {
    labels.push(
      <Text
        key={`file-${i}`}
        position={[(i - 3.5) * SQ, -0.04, 4.4 * SQ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.18}
        color="#a08060"
        anchorX="center"
        anchorY="middle"
      >
        {files[i]}
      </Text>
    );
  }

  // Rank labels (1-8) along left
  for (let i = 0; i < 8; i++) {
    labels.push(
      <Text
        key={`rank-${i}`}
        position={[-4.4 * SQ, -0.04, (i - 3.5) * SQ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.18}
        color="#a08060"
        anchorX="center"
        anchorY="middle"
      >
        {ranks[i]}
      </Text>
    );
  }

  return <>{labels}</>;
}

// ─── SCENE SETUP ────────────────────────────────────────────────────────────

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} />
      <pointLight position={[0, 6, 0]} intensity={0.2} />
    </>
  );
}

// ─── MAIN 3D BOARD SCENE ────────────────────────────────────────────────────

function BoardScene({ game, selectedSquare, legalMoves, lastMove, onSquareClick, flipped }) {
  const files = flipped ? [...FILES].reverse() : FILES;
  const ranks = flipped ? [...RANKS].reverse() : RANKS;

  return (
    <>
      <SceneLighting />
      <BoardFrame />
      <BoardLabels flipped={flipped} />

      {/* Squares */}
      {ranks.map((rank, ri) =>
        files.map((file, fi) => {
          const sq = file + rank;
          const isLight = (ri + fi) % 2 === 0;
          const pos = sqToPos(sq, flipped);
          return (
            <Square3D
              key={sq}
              position={pos}
              isLight={isLight}
              isSelected={selectedSquare === sq}
              isLegalMove={legalMoves.includes(sq)}
              isLastMove={lastMove && (lastMove.from === sq || lastMove.to === sq)}
              onClick={() => onSquareClick(sq)}
            />
          );
        })
      )}

      {/* Pieces */}
      {ranks.map((rank) =>
        FILES.map((file) => {
          const sq = file + rank;
          const piece = game.get(sq);
          if (!piece) return null;
          const pos = sqToPos(sq, flipped);
          return (
            <Piece3D
              key={`piece-${sq}`}
              type={piece.type}
              color={piece.color}
              position={pos}
              onClick={() => onSquareClick(sq)}
            />
          );
        })
      )}

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI * 0.1}
        maxPolarAngle={Math.PI * 0.45}
        minDistance={6}
        maxDistance={14}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ─── EXPORTED COMPONENT ─────────────────────────────────────────────────────

export default function Board3D({
  game,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
  flipped,
  style,
}) {
  // Match 2D board sizing: responsive square size * 8 + label width
  const [size, setSize] = useState(598);
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const available = Math.min(vw - 54, 598); // 22 labels + 32 padding
      setSize(Math.max(280, available));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      className="board-3d"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 6, 5.5], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#1a1a1d');
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <BoardScene
          game={game}
          selectedSquare={selectedSquare}
          legalMoves={legalMoves || []}
          lastMove={lastMove}
          onSquareClick={onSquareClick || (() => {})}
          flipped={flipped || false}
        />
      </Canvas>
    </div>
  );
}
