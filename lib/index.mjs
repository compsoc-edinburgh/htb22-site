// Handles Logo & BG animation on index page

import * as LOGO_SCENE from './cube_spin.mjs';
import * as THREE from './three.module.js';
import * as BG_SCENE from './scene.mjs';
import * as COUNT_UP from './count_up.mjs';

let logoAnimYEnd, logoAnimStart, logoAnimEnd, logoEndTranslation, renderer, bgSceneInfo, logoSceneInfo, canvas, navbar, navbarLogo;
let doCountUp = false, countUpTriggered = false;


const startIndexAnim = (canvas) => {
    renderer = new THREE.WebGLRenderer({
        canvas
    })
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false
    
    bgSceneInfo = BG_SCENE.createSceneInfo(renderer);
    logoSceneInfo = LOGO_SCENE.createSceneInfo();

    recalcLogoAnimParams();
    logoAnim(0.0);

}

const logoAnim = (step) => {
    handleScroll();

    LOGO_SCENE.animateSceneInfo(logoSceneInfo);

    BG_SCENE.animateSceneInfo(bgSceneInfo);
    renderSceneInfo(bgSceneInfo);
    renderSceneInfo(logoSceneInfo);

    if (doCountUp) {
        doCountUp = COUNT_UP.tick(step);
    }
 
    window.requestAnimationFrame(logoAnim);
}

const handleScroll = () => {
    let progress = (window.scrollY / logoAnimYEnd);

    let currentStyle = logoAnimStart;
    if (progress >= 1.0) {
        currentStyle = logoAnimEnd;
        if (navbarLogo.style.opacity < 1) {
            navbar.className += ' withBg';
            navbarLogo.style.opacity = 1;
        }
        if (!countUpTriggered) {
            doCountUp = true;
            countUpTriggered = true;
        }
    } else if (progress <= 0.0) {
        currentStyle = logoAnimStart;
        if (navbarLogo.style.opacity > 0) {
            navbarLogo.style.opacity = 0;
            navbar.className = navbar.className.replace(" withBg", "");
        }
    } else {
        currentStyle = {
            top: logoAnimStart.top + (progress * logoEndTranslation.top),
            left: logoAnimStart.left + (progress * logoEndTranslation.left),
            height: logoAnimStart.height + (progress * logoEndTranslation.height),
            width: logoAnimStart.width + (progress * logoEndTranslation.width),
            invisible: false,
            spinProgress: progress
        };
        if (navbarLogo.style.opacity > 0) {
            navbarLogo.style.opacity = 0;
            navbar.className = navbar.className.replace(" withBg", "");
        }
    }

    logoSceneInfo = {
        ...logoSceneInfo,
        ...currentStyle,
    };
}

// Handle resize
const handleResize = () => {
    BG_SCENE.handleResize(bgSceneInfo);
    renderer.setSize(window.innerWidth, window.innerHeight);

    recalcLogoAnimParams();
}

// Calculate params for logo animation
const recalcLogoAnimParams = () => {
    navbar = document.querySelector('nav.navbar');
    navbarLogo = document.querySelector('#navbar-logo');
    let jumboPos = document.querySelector('#jumbotron-logo');

    // Start at jumbotron
    logoAnimStart = { top: jumboPos.offsetTop, left: jumboPos.offsetLeft, height: jumboPos.offsetWidth, width: jumboPos.offsetWidth, spinProgress: 0, invisible: false, };
    
    // End in navbar
    logoAnimEnd = { top: navbarLogo.offsetTop, left: navbarLogo.offsetLeft, height: navbarLogo.offsetHeight, width: navbarLogo.offsetHeight, spinProgress: 1, invisible: true };
    
    logoEndTranslation = { top: logoAnimEnd.top - logoAnimStart.top, left: logoAnimEnd.left - logoAnimStart.left, height: logoAnimEnd.height - logoAnimStart.height, width: logoAnimEnd.width - logoAnimStart.width };

    // Finish by the time jumbotron is out of view
    logoAnimYEnd = jumboPos.offsetHeight;
}

const renderSceneInfo = (sceneInfo) => {
    if (sceneInfo.invisible) {
        return;
    }
    renderer.clearDepth()
    const positiveYUpBottom = window.innerHeight - sceneInfo.top - sceneInfo.height;
    renderer.setViewport(sceneInfo.left, positiveYUpBottom, sceneInfo.width, sceneInfo.height);

    if (sceneInfo.composer) {
        sceneInfo.composer.render()
    } else {
        renderer.render(sceneInfo.scene, sceneInfo.camera)
    }
}

(() => {
    // Animate logo if we're on index page
    canvas = document.querySelector('#indexScene');
    if (canvas != null) {
        startIndexAnim(canvas);
        handleScroll();
        window.addEventListener('resize', handleResize);
        // window.addEventListener('scroll', handleScroll);
    }

    // Past projects carousel
    new Glide('.glide').mount()
})()