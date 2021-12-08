const TIME = 1.0 * 1000;

let targets = undefined, start_time;

// returns true if tick should be called again next animation frame
export function tick(step) {
    if (targets === undefined) {
        start_time = step;
        targets = Array.from(document.querySelectorAll('.countUp'))
            .map(elem => ({
                elem,
                dest: parseInt(elem.attributes['data-countup-target'].value),
                suffix: elem.attributes['data-countup-suffix'] ? elem.attributes['data-countup-suffix'].value : ''
            })
        );
    }
    
    let time_elapsed = step - start_time;
    let progress = Math.min(time_elapsed / TIME, 1.0);
    for (var target of targets) {
        let desired = Math.round(progress * target.dest);
        target.elem.innerHTML = desired.toString() + target.suffix;
    }

    return time_elapsed < TIME;
}

export function reset() {
    targets = undefined;
    time_elapsed = 0.0;
}