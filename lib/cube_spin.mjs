import * as THREE from './three.module.js'

const DISPLACEMENT_ROT_MAX = Math.PI / 16;
const VP_SIZE = 0.9;

let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2, displacementDirty = true, oldSpinProgress = 0;

export function createSceneInfo() {
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.OrthographicCamera(-VP_SIZE, VP_SIZE, VP_SIZE, -VP_SIZE)
    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = 1;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    // Cube
    const cube = createLogoCube();
    cube.rotation.y = Math.PI / -4;
    cube.rotation.x = Math.PI / 4;
    scene.add(cube);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    directionalLight.position.x = -0.5;
    directionalLight.position.y = 1;
    directionalLight.position.z = 1;
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // Ambient light so it's not too dark
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    ambientLight.position.x = -0.5;
    ambientLight.position.y = 1;
    ambientLight.position.z = 1;
    scene.add(ambientLight);

    document.addEventListener("mousemove", updateMousePos);

    return {
        scene,
        camera,
        cube,
        spinProgress: 1,
        top: 0, // These will be overwritten anyway
        left: 0,
        width: window.innerHeight,
        height: window.innerHeight,
    };
}

export function animateSceneInfo(sceneInfo) {
    if (sceneInfo.spinProgress > 0) {
        if (sceneInfo.spinProgress != sceneInfo.oldSpinProgress) {
            sceneInfo.cube.rotation.y = (Math.PI / -4) + (sceneInfo.spinProgress * Math.PI * 2);
            sceneInfo.oldSpinProgress = sceneInfo.spinProgress;
        }
    } else if (displacementDirty || (sceneInfo.oldSpinProgress >= 0)) {
        let displacementX = (mouseX / window.innerWidth) * 2 - 1;
        let displacementY = ((mouseY / window.innerHeight) * 2 - 1);

        sceneInfo.cube.rotation.y = (Math.PI / -4) + (displacementX * DISPLACEMENT_ROT_MAX);
        sceneInfo.cube.rotation.x = (Math.PI / 4) + (displacementY * DISPLACEMENT_ROT_MAX);
        sceneInfo.oldSpinProgress = sceneInfo.spinProgress;
        displacementDirty = false;
    }

}

function createLogoCube() {
    const loader = new THREE.TextureLoader();
    loader.setPath('static/textures/');
    const textTexture = new THREE.MeshLambertMaterial({map: loader.load('text.png')});
    const eightTexture = new THREE.MeshLambertMaterial({map: loader.load('eight.png')});
    const unicornTexture = new THREE.MeshLambertMaterial({map: loader.load('unicorn.png')});
    const blackTexture = new THREE.MeshLambertMaterial({map: loader.load('black.png')});
    

    const geometry = new THREE.BoxGeometry();
    const cube = new THREE.Mesh(geometry, [
        eightTexture,
        eightTexture,
        textTexture,
        blackTexture,
        unicornTexture,
        unicornTexture,
    ]);

    return cube;
}

function updateMousePos(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    displacementDirty = true;
}