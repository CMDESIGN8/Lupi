import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  useAnimations,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

export const DEFAULT_MODEL_URL = "/models/player-agree.glb";

// Altura final del personaje dentro de la escena
const TARGET_HEIGHT = 1.8;

/**
 * Calcula escala y offset para que el personaje quede:
 *  - centrado en X/Z
 *  - apoyado sobre y = -TARGET_HEIGHT / 2
 *  - a la altura TARGET_HEIGHT
 *
 * Mide SOLO el esqueleto (bones) cuando existe, porque los VFX/auras
 * (planos, partículas, cilindros de energía) inflan el bounding box
 * y hacían que el personaje "se fuera para arriba".
 */
function computeFit(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);

  // Recorrer bones y recolectar posiciones
  const bonePositions: THREE.Vector3[] = [];
  scene.traverse((obj) => {
    if ((obj as THREE.Bone).isBone) {
      bonePositions.push(obj.getWorldPosition(new THREE.Vector3()));
    }
  });

  let box: THREE.Box3;

  if (bonePositions.length >= 4) {
    box = new THREE.Box3().setFromPoints(bonePositions);
  } else {
    const skinnedMeshes: THREE.SkinnedMesh[] = [];
    scene.traverse((obj) => {
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
        skinnedMeshes.push(obj as THREE.SkinnedMesh);
      }
    });

    if (skinnedMeshes.length > 0) {
      box = new THREE.Box3();
      skinnedMeshes.forEach((m) => box.expandByObject(m));
    } else {
      box = new THREE.Box3().setFromObject(scene);
    }
  }

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const scale = size.y > 0 ? TARGET_HEIGHT / size.y : 1;

  const offset = new THREE.Vector3(
    -center.x * scale,
    -box.min.y * scale - TARGET_HEIGHT / 2,
    -center.z * scale
  );

  return { scale, offset };
}

function PlayerModel({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);

  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  // Escala y offset FIJOS. Todos los GLBs del personaje deben estar
  // exportados con: origen en los pies, escala 1 unidad = 1 metro,
  // bind pose idéntica (brazos abajo o T-pose, siempre la misma).
  const scale = 1;
  const offset = useMemo(() => new THREE.Vector3(0, -TARGET_HEIGHT / 2, 0), []);

  useEffect(() => {
    if (!actions) return;

    const actionNames = Object.keys(actions);
    const preferred =
      actionNames.find((n) => n.toLowerCase().includes("agree")) ??
      actionNames[0];

    if (!preferred) return;

    const action = actions[preferred];
    action?.reset().fadeIn(0.35).play();

    return () => {
      action?.fadeOut(0.25);
    };
  }, [actions]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.position.y = Math.sin(t * 1.2) * 0.025;
    group.current.rotation.y = Math.sin(t * 0.35) * 0.035;
  });

  return (
    <group ref={group} dispose={null}>
      <group scale={scale} position={offset}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

function PlayerLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
    </mesh>
  );
}

/**
 * Si un GLB no existe o falla al cargar,
 * mostramos el modelo por defecto en lugar de romper el Canvas.
 */
class ModelBoundary extends Component<
  { fallback: ReactNode; resetKey: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type Player3DProps = {
  className?: string;
  modelUrl?: string;
};

export function Player3D({
  className = "",
  modelUrl = DEFAULT_MODEL_URL,
}: Player3DProps) {
  const usingDefault = modelUrl === DEFAULT_MODEL_URL;

  return (
    <div className={`player-3d ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 32 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={1.8} />
        <directionalLight position={[2, 4, 4]} intensity={2.2} />
        <directionalLight position={[-3, 2, 2]} intensity={1} />

        <ModelBoundary
          resetKey={modelUrl}
          fallback={
            // Si ya estamos en el default y falla, no recursamos:
            // mostramos solo el loader para no romper el Canvas.
            usingDefault ? (
              <PlayerLoader />
            ) : (
              <Suspense fallback={<PlayerLoader />}>
                <PlayerModel url={DEFAULT_MODEL_URL} />
              </Suspense>
            )
          }
        >
          <Suspense fallback={<PlayerLoader />}>
            {/* SIN key: React reutiliza el mismo PlayerModel y
                useGLTF re-suspende cuando cambia `url`.
                Esto evita el salto al re-equipar el mismo skin. */}
            <PlayerModel url={modelUrl} />
          </Suspense>
        </ModelBoundary>

        <ContactShadows
          position={[0, -TARGET_HEIGHT / 2, 0]}
          opacity={0.35}
          scale={1}
          blur={2.5}
          far={3}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(DEFAULT_MODEL_URL);