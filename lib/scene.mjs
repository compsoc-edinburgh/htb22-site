// Background scene for HTB21.
// Terrain generated from perlin noise scrolling past camera

import * as THREE from './three.module.js'

import { SimplexNoise } from './perlin.module.js';

import { ShaderPass } from './postprocessing/ShaderPass.js';
import { FXAAShader } from './shaders/FXAAShader.js';
import { UnrealBloomPass } from './postprocessing/UnrealBloomPass.js';
import { WireframeGeometry2 } from './lines/WireframeGeometry2.js';
import { LineMaterial } from './lines/LineMaterial.js';
import { EffectComposer } from './postprocessing/EffectComposer.js';
import { RenderPass } from './postprocessing/RenderPass.js';

// Plane & Terrain setup
const PLANE_DIST = 3000;
const N_PLANES = 10;
const PLANE_DIVS_DEPTH = 21 / N_PLANES;
const PLANE_DIVS_WIDTH = 13; // If this is even, it looks like there's a straight line down the center.

// Scene setup
const CAMERA_HEIGHT = 150;
const TERRAIN_SPEED = 2;

// Noise parameters
const PEAK = 90;
const SMOOTHING = 750;

// ---
const perlin = new SimplexNoise(Math);
const DEPTH_PER_PLANE = PLANE_DIST / N_PLANES;

// Create scene
export function createSceneInfo(renderer) {
    const scene = new THREE.Scene()

    // Camera
    // At (-1, CAMERA_HEIGHT, 0), looking straight down the +x axis.
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 3000)
    camera.position.x = -1
    camera.position.y = CAMERA_HEIGHT
    camera.lookAt(new THREE.Vector3(0, CAMERA_HEIGHT, 0))

    scene.add(camera)

    // Terrain (multiple planes)
    let sceneInfo = {
        scene,
        camera,
        perlinOffset: 0,
        top: 0,
        left: 0,
        terrainMeshes: [],
        width: window.innerWidth,
        height: window.innerHeight,
        invisible: false,
    };

    for (var i = 0; i < N_PLANES; i++) {
        const terrain = createTerrain(i * DEPTH_PER_PLANE, sceneInfo)
        sceneInfo.terrainMeshes.push(terrain);
        scene.add(terrain);
    }

    // Fog
    const fog = new THREE.Fog(0x000000, 500, PLANE_DIST * ((N_PLANES - 1) / N_PLANES));
    scene.fog = fog;

    // Add on resize hook
    window.addEventListener('onresize', handleResize);

    sceneInfo.composer = new EffectComposer(renderer);
    sceneInfo.composer.addPass(new RenderPass(scene, camera));

    // Bloom
    sceneInfo.bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.4, 0.1, 0.0 )
    sceneInfo.bloomPass.threshold = 0.3
    sceneInfo.bloomPass.strength = 0.6
    sceneInfo.bloomPass.radius = 0.4

    // FXAA
    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = renderer.getPixelRatio();
    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( renderer.domElement.offsetWidth * pixelRatio );
    fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( renderer.domElement.offsetHeight * pixelRatio );

    sceneInfo.composer.addPass(sceneInfo.bloomPass)
    sceneInfo.composer.addPass(fxaaPass);

    return sceneInfo;
}

// Animate scene
export function animateSceneInfo(sceneInfo) {
    // Move each terrain forward
    for (var i = 0; i < sceneInfo.terrainMeshes.length; i++) {
        let plane = sceneInfo.terrainMeshes[i];
        plane.position.x -= TERRAIN_SPEED;

        // If behind camera
        if (plane.position.x <= -DEPTH_PER_PLANE) {
            // Move to end & regen verts
            plane.position.x = (N_PLANES - 1) * DEPTH_PER_PLANE;
            genTerrainVerts(plane, sceneInfo);
        }
    }
}

// Handle a resize
export function handleResize(sceneInfo) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    sceneInfo.camera.aspect = width / height;
    sceneInfo.camera.updateProjectionMatrix();

    // LineMaterial needs to know the resolution to display properly
    for (var i = 0; i < sceneInfo.terrainMeshes.length; i++) {
        let plane = sceneInfo.terrainMeshes[i];
        plane.children[0].material.resolution.set(window.innerWidth, window.innerHeight);
    }

    sceneInfo.width = width;
    sceneInfo.height = height;

    sceneInfo.composer.setSize(width, height);
    sceneInfo.bloomPass.resolution.set(width, height);
}

// Create a single plane object to be used for terrain
// Also generates its vertices
function createTerrain(offset, sceneInfo) {
    // Plane
    var planeGeom = new THREE.PlaneBufferGeometry(DEPTH_PER_PLANE, 4000, PLANE_DIVS_DEPTH, PLANE_DIVS_WIDTH);
    var planeMesh = new THREE.Mesh(planeGeom, new THREE.MeshBasicMaterial({
        color: 0x094662,
    }))
    planeMesh.position.x = offset;
    planeMesh.rotation.x = -Math.PI / 2;

    // Outline
    const outlineGeom = new WireframeGeometry2(planeGeom);
    const outlineMat = new LineMaterial({
        color: 0x378AB0,
        linewidth: 5,
        fog: true,
    });
    outlineMat.resolution.set(sceneInfo.width, sceneInfo.height);
    const outlineMesh = new THREE.Mesh(outlineGeom, outlineMat);
    
    planeMesh.add(outlineMesh);
    genTerrainVerts(planeMesh, sceneInfo);

    return planeMesh;
}

// Populate a plane's vertices with random noise
// Stateful, if called multiple times it will keep track of progress on the x axis
// Note that this manipulates the Z axis of the vertices, as the plane is rotated so that Z = Up.
function genTerrainVerts(plane, sceneInfo) {
    var vertices = plane.geometry.attributes.position.array;
    for (var i = 0; i <= vertices.length; i += 3) {
        vertices[i+2] = PEAK * perlin.noise(
            ((sceneInfo.perlinOffset + vertices[i])) / SMOOTHING, 
            ((vertices[i+1])) / SMOOTHING
        );
    }

    plane.geometry.attributes.position.needsUpdate = true;

    // Update wireframe
    plane.children[0].geometry = new WireframeGeometry2(plane.geometry);

    sceneInfo.perlinOffset += DEPTH_PER_PLANE;
}