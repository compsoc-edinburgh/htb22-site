// Common functionality.

// Setup mobile navbar height
let navPopout = document.querySelector('#navbarPopout');
const setMobileNavbarHeight = () => {
    if (navPopout !== null) {
        navPopout.style = `top: -${navPopout.offsetHeight * 2}px; opacity: 1;`
    }
}

(function() {
    setMobileNavbarHeight();

    window.addEventListener('resize', setMobileNavbarHeight);
})()

// Used by mobile navbar
window.toggleActive = function(selector) {
    let el = document.querySelector(selector)

    if (el.className.includes("active")) {
        el.className = el.className.replace(" active", "")
    } else {
        el.className = el.className + " active"
    }
}