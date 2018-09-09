var timeModule;

function initialize() {
    setupPlayground();
    onStart();
    recursiveAnimateStart();
}

function setupPlayground() {
    var stage = Sprite3D.stage(),
        rx = 0,
        ry = 0,
        rz = 0,
        box = stage.appendChild(
            Sprite3D
            .box(100, ".box1")
            .rotate(rx += Math.random() * 7 - 3.5, ry += Math.random() * 7 - 3.5, 0)
            .update()
        );

    // let's use the "transitionEnd" event to drive our animation
    box.addEventListener(Sprite3D.prefix("TransitionEnd"), moveTheBox, false);
    //box.addEventListener( Sprite3D.prefix("transitionend"), moveTheBox, false );
    box.addEventListener("transitionend", moveTheBox, false);

    function moveTheBox(moveTheBox) {
        box.css(
            "Transition",
            "all " + (.2 + Math.random()) + "s ease-in-out",
            true // add a third argument and Sprite3D will add the current browser prefix to the property :)
        ).rotate(
            rx += Math.random() * 27 - 13.5,
            ry += Math.random() * 27 - 13.5,
            0
        ).scale(
            0.25 + Math.random() * 4,
            0.25 + Math.random() * 4,
            0.25 + Math.random() * 4
        ).update();
    }

    // start the animation after the page has been rendered
    setTimeout(moveTheBox, 500);
}

function recursiveAnimateStart() {
    requestAnimationFrame(recursiveAnimateStart);
    timeModule.update();
    onUpdate(timeModule.getDelta());
}

function onStart() {
    timeModule = new TimeDelta();
}

function onPause() {

}

function onUpdate(timeDelta) {
}

function onStop() {

}