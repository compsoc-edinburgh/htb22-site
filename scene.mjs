import * as THREE from './lib/three.module.js'
import { OrbitControls } from './lib/OrbitControls.mjs'

import { EffectComposer } from './lib/postprocessing/EffectComposer.js';
import { RenderPass } from './lib/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './lib/postprocessing/UnrealBloomPass.js';



let camera, scene, renderer, composer, bloomPass;
let tentacles;
const TENTACLE_COUNT = 50


init();
animate();

function makeCube() {
    let geometry = new THREE.Geometry()

    /*
            x-   x+
             6----7
            /|   /|
        y+ 2----3 |
           | |  | |
           | 4--|-5 z-
           |/   |/
        y- 0----1 z+

    */

    geometry.vertices.push(
        new THREE.Vector3(-1, -1,  1), // 0
        new THREE.Vector3( 1, -1,  1), // 1
        new THREE.Vector3(-1,  1,  1), // 2
        new THREE.Vector3( 1,  1,  1), // 3
        new THREE.Vector3(-1, -1, -1), // 4
        new THREE.Vector3( 1, -1, -1), // 5
        new THREE.Vector3(-1,  1, -1), // 6
        new THREE.Vector3( 1,  1, -1), // 7
    )


    geometry.faces.push(
        // front
        new THREE.Face3(0, 3, 2),
        new THREE.Face3(0, 1, 3),
        // right
        new THREE.Face3(1, 7, 3),
        new THREE.Face3(1, 5, 7),
        // back
        new THREE.Face3(5, 6, 7),
        new THREE.Face3(5, 4, 6),
        // left
        new THREE.Face3(0, 2, 4),
        new THREE.Face3(4, 2, 6),
        // top
        new THREE.Face3(2, 3, 7),
        new THREE.Face3(2, 7, 6),
        // bottom
        new THREE.Face3(0, 5, 1),
        new THREE.Face3(0, 4, 5)
    )

    geometry.computeFaceNormals();


    return geometry
}

function makeTentacleGeometry(segments = 2) {
    let geometry = new THREE.Geometry()

    /*        5
             /|\
            / | \
        y+ 3-----4
           |  |  |
           |  2  |
           | / \ | z-
           |/   \|
        y- 0-----1 z+
           x-    x+
    */

    const segment_height = 4

    const makeSegment = level => {
        // the height of the new segment is the layer no. times the segment heigh
        const seg_h = level * segment_height
        let vertices = [
            new THREE.Vector3(-1,  seg_h,  1), // level + 0
            new THREE.Vector3( 1,  seg_h,  1), // level + 1
            new THREE.Vector3( 0,  seg_h, -1), // level + 2
        ]

        let scale = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).multiplyScalar(2.5)
        scale.y = 1
        vertices = vertices.map( v => v.add(scale) )

        level = level * 3

        /*
        let faces = [
            // front
            new THREE.Face3(0, 1, 4),
            new THREE.Face3(0, 4, 3),
            // back left
            new THREE.Face3(0, 3, 2),
            new THREE.Face3(2, 3, 5),
            // back right
            new THREE.Face3(1, 2, 4),
            new THREE.Face3(2, 5, 4),
        ]*/
            let faces = [
                // front
                new THREE.Face3(level - 3, level - 2, level + 1),
                new THREE.Face3(level - 3, level + 1, level    ),
                // back left
                new THREE.Face3(level - 3, level    , level - 1),
                new THREE.Face3(level - 1, level    , level + 2),
                // back right
                new THREE.Face3(level - 2, level - 1, level + 1),
                new THREE.Face3(level - 1, level + 2, level + 1),
            ]

        return [vertices, faces]
    }



    // the base
    geometry.vertices.push(
        new THREE.Vector3(-1,  0,  1), // 0
        new THREE.Vector3( 1,  0,  1), // 1
        new THREE.Vector3( 0,  0, -1), // 2
    )
    geometry.faces.push(
        new THREE.Face3(0, 2, 1)
    )

    // create the arrays that hold the vertices
    // TODO: refactor out
    const vtxs = []
    const faces = []

    // we have to start at one because segments start from one
    // this is because level 0 is the base, and doesn't need faces
    // below it.
    for (let i = 1; i <= segments; i++) {
        const [v_seg, f_seg] = makeSegment(i)

        vtxs.push(...v_seg)
        faces.push(...f_seg)
    }

    geometry.vertices.push(...vtxs)
    geometry.faces.push(...faces)

    // just the tip

    // tip holds the first vertex index of the top ring
    const tip = segments * 3
    geometry.vertices.push(
        new THREE.Vector3( 0, (segment_height * (segments + 2)), 1/3)
    )
    geometry.faces.push(
        new THREE.Face3(tip + 1, tip + 3, tip    ),
        new THREE.Face3(tip + 2, tip + 3, tip + 1),
        new THREE.Face3(tip    , tip + 3, tip + 2)
    )

    geometry.computeFaceNormals();


    return geometry
}

function makeAllTentacles(count) {
    let tentacles = []

    // The camera appears to be moving towards the negative Z direction along Z = 0
    // to prevent clipping, the X component should be clear from -.5, .5

    const get_x_pos = () => (2 + (6 * Math.random())) * ((Math.random() > .5 ? 1 : -1 ))

    window.get_x_pos = get_x_pos

    //const material = new THREE.MeshNormalMaterial()
    const material = new THREE.MeshLambertMaterial({color: 0xff0000})
    
    //material.wireframe = true

    for (let i = 0; i < count; i++) {
        let geometry = makeTentacleGeometry(3)

        let mesh = new THREE.Mesh( geometry, material )
        mesh.scale.set(0.6,0.6,0.6)

        mesh.position.set(get_x_pos(),0,i * -5)

        tentacles.push(mesh)
    }

    return tentacles
}

function init() {

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 )
    camera.position.z = 6
    camera.position.y = 1
    camera.rotateX(.4)
    window.camera = camera

    scene = new THREE.Scene()

    tentacles = makeAllTentacles(50)
    
    for (let mesh of tentacles) {
        scene.add( mesh )
    }

    const light = new THREE.PointLight( 0xff0000, 1, 50 )
    light.position.set( 0, 0.25, 3 )
    scene.add( light )

    renderer = new THREE.WebGLRenderer( {
        antialias: true,
        canvas: document.querySelector('canvas#c')
    } )
    renderer.setSize( window.innerWidth, window.innerHeight )

    //orbit = new OrbitControls( camera, renderer.domElement )

    composer = new EffectComposer( renderer )
    composer.addPass( new RenderPass( scene, camera ) )

    bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 0.0, 0.4, 0.85 )
    bloomPass.threshold = 0
    bloomPass.strength = 1.0
    bloomPass.radius = 0.25

    bloomPass.renderToScreen = true
    composer.addPass(bloomPass)
}

function animate() {

    requestAnimationFrame( animate )

    for (let mesh of tentacles) {
        mesh.position.z += 0.1
        if (mesh.position.z > 7) {
            mesh.position.z = TENTACLE_COUNT * -5
        }
    }

    composer.render()

}

function on_resize() {
    bloomPass.resolution = new THREE.Vector2(window.innerWidth, window.innerWidth)
    renderer.setSize( window.innerWidth, window.innerHeight )

    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
}

window.onresize = on_resize


