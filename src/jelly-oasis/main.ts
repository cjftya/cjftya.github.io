import {
  Color,
  DirectionalLight,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
} from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { RendererManager } from '../core/renderer/RendererManager';
import { createTerrain, DEFAULT_TERRAIN_CONFIG } from './terrain/createTerrain';
import './styles.css';

const canvas = document.querySelector<HTMLCanvasElement>('#oasis-canvas');

if (!canvas) {
  throw new Error('Jelly Oasis canvas was not found.');
}

const scene = new Scene();
scene.background = new Color(0xdde8df);

const rendererManager = new RendererManager(canvas);
const renderer = rendererManager.renderer;
renderer.shadowMap.enabled = true;

const camera = new PerspectiveCamera(48, 1, 0.1, 900);
camera.position.set(135, 105, 155);

const controls = new MapControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 0, 0);
controls.minDistance = 28;
controls.maxDistance = 390;
controls.maxPolarAngle = Math.PI * 0.475;
controls.screenSpacePanning = false;

const hemisphereLight = new HemisphereLight(0xf0f5ec, 0x4d574c, 2.0);
scene.add(hemisphereLight);

const keyLight = new DirectionalLight(0xfff2d5, 2.6);
keyLight.position.set(-90, 135, 65);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -170;
keyLight.shadow.camera.right = 170;
keyLight.shadow.camera.top = 170;
keyLight.shadow.camera.bottom = -170;
keyLight.shadow.camera.near = 10;
keyLight.shadow.camera.far = 420;
scene.add(keyLight);

const terrain = createTerrain(DEFAULT_TERRAIN_CONFIG);
scene.add(terrain);

function resize(): void {
  const width = Math.max(canvas.clientWidth, 1);
  const height = Math.max(canvas.clientHeight, 1);

  rendererManager.resize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener(
  'pagehide',
  () => {
    resizeObserver.disconnect();
    controls.dispose();
    terrain.geometry.dispose();
    terrain.material.dispose();
    rendererManager.dispose();
  },
  { once: true },
);
