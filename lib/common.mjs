// Common functionality.

(function() {
    // Setup mobile navbar height
    let navPopout = document.querySelector('#navbarPopout');
    if (navPopout !== null) {
        navPopout.style = `top: -${navPopout.offsetHeight}px; opacity: 1;`
    }
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