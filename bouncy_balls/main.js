/**
 * Created by cristiantotolin on 30/03/2017.
 */

'use strict';

Physijs.scripts.worker = '../physijs_worker.js';
Physijs.scripts.ammo = 'bouncy_balls/js/ammo.js';

var initScene, render, createShape, loader, ground, ground_material;
var canJump;
var environment = {
    light: null,
    camera: null,
    plane: null,
    scene: null,
    controls: null,
    renderer: null
};

var generator = {
    material: null,
    shapes: null
};

var SHAPE_SPHERE    =   0,
    SHAPE_BOX       =   1,
    SHAPE_CYLINDER  =   2,
    SHAPE_CONE      =   3,
    SHAPE_GROUND    =   4,
    SHAPE_BORDER    =   5;

function createRenderer() {
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    return renderer;
}

function createScene() {
    var scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });
    scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
    scene.addEventListener(
        'update',
        function() {
            scene.simulate( undefined, 2 );
        }
    );
    return scene;
}

function createCamera() {
    // var camera = new THREE.PerspectiveCamera(
    //     35,
    //     window.innerWidth / window.innerHeight,
    //     1,
    //     1000
    // );
    // camera.position.set( 60, 50, 60 );
    // camera.lookAt( environment.scene.position );

    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    return camera;
}

function createLight() {
    var light = new THREE.DirectionalLight( 0xFFFFFF );
    light.position.set( 20, 40, -15 );
    light.target.position.copy( environment.scene.position );
    light.castShadow = true;
    light.shadowCameraLeft = -60;
    light.shadowCameraTop = -60;
    light.shadowCameraRight = 60;
    light.shadowCameraBottom = 60;
    light.shadowCameraNear = 20;
    light.shadowCameraFar = 200;
    light.shadowBias = -.0001;
    light.shadowMapWidth = light.shadowMapHeight = 2048;
    light.shadowDarkness = .7;
    return light;
}

function createObjectGenerator() {
    generator.shapes = {
        box         : new THREE.BoxGeometry( 3, 3, 3 ),
        sphere      : new THREE.SphereGeometry( 1.5, 32, 32),
        cylinder    : new THREE.CylinderGeometry( 2, 2, 1, 32 ),
        cone        : new THREE.CylinderGeometry( 0, 2, 4, 32 )
    };

    var friction = 0.8; // high friction
    var restitution = 2; // low restitution

    generator.material = {
        get : function() {
            return new Physijs.createMaterial(
                new THREE.MeshLambertMaterial({ opacity: 0, transparent: true }),
                friction,
                restitution
            );
        }
    };
}

initScene = function() {
    // Start TWEEN Engine
    TWEEN.start();

    // Renderer
    environment.renderer = createRenderer();
    document.body.appendChild( environment.renderer.domElement );

    // Scene
    environment.scene = createScene();

    // Camera
    environment.camera = createCamera();
    environment.scene.add( environment.camera );
    var controls = new THREE.PointerLockControls( environment.camera );
    environment.scene.add( controls.getObject() );

    // Camera controls
    environment.controls = new THREE.OrbitControls(environment.camera, environment.renderer.domElement);

    // Light
    environment.light = createLight();
    environment.scene.add( environment.light );

    // Loader
    loader = new THREE.TextureLoader();

    // Materials
    ground_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: loader.load( 'images/rocks.jpg' ) }),
        .8, // high friction
        .4 // low restitution
    );
    ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
    ground_material.map.repeat.set( 2.5, 2.5 );

    // Ground floor of the box
    ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(50, 1, 50),
        ground_material,
        0 // mass
    );
    ground.receiveShadow = true;
    ground.objectShape = SHAPE_GROUND;
    environment.scene.add( ground );

    // Bumpers to form a box
    var bumper,
        bumper_geom = new THREE.BoxGeometry(2, 1, 50);

    bumper = new Physijs.BoxMesh( bumper_geom, ground_material, 0, { restitution: .2 } );
    bumper.position.y = 1;
    bumper.position.x = -24;
    bumper.receiveShadow = true;
    bumper.castShadow = true;
    environment.scene.add( bumper );

    bumper = new Physijs.BoxMesh( bumper_geom, ground_material, 0, { restitution: .2 } );
    bumper.position.y = 1;
    bumper.position.x = 24;
    bumper.receiveShadow = true;
    bumper.castShadow = true;
    environment.scene.add( bumper );

    bumper = new Physijs.BoxMesh( bumper_geom, ground_material, 0, { restitution: .2 } );
    bumper.position.y = 1;
    bumper.position.z = -24;
    bumper.rotation.y = Math.PI / 2;
    bumper.receiveShadow = true;
    bumper.castShadow = true;
    environment.scene.add( bumper );

    bumper = new Physijs.BoxMesh( bumper_geom, ground_material, 0, { restitution: .2 } );
    bumper.position.y = 1;
    bumper.position.z = 24;
    bumper.rotation.y = Math.PI / 2;
    bumper.receiveShadow = true;
    bumper.castShadow = true;
    environment.scene.add( bumper );

    requestAnimataionFrame( render );
    environment.scene.simulate();

    // Create objects generator
    createObjectGenerator();
};

render = function() {
    requestAnimationFrame( render );

    if ( controlsEnabled ) {
        raycaster.ray.origin.copy( controls.getObject().position );
        raycaster.ray.origin.y -= 10;

        var intersections = raycaster.intersectObjects( objects );

        var isOnObject = intersections.length > 0;

        var time = performance.now();
        var delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

        if ( moveForward ) velocity.z -= 400.0 * delta;
        if ( moveBackward ) velocity.z += 400.0 * delta;

        if ( moveLeft ) velocity.x -= 400.0 * delta;
        if ( moveRight ) velocity.x += 400.0 * delta;

        if ( isOnObject === true ) {
            velocity.y = Math.max( 0, velocity.y );

            canJump = true;
        }

        controls.getObject().translateX( velocity.x * delta );
        controls.getObject().translateY( velocity.y * delta );
        controls.getObject().translateZ( velocity.z * delta );

        if ( controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

            canJump = true;

        }

        prevTime = time;

    }


    environment.renderer.render( environment.scene, environment.camera );
    environment.controls.update();
};

function generateShape() {
    var shape;

    // Create a random shape
    var randomShape = Math.floor(Math.random() * 4);

    // Set object's shape based on random value
    switch ( randomShape ) {
        case SHAPE_SPHERE:
            shape = new Physijs.SphereMesh(
                generator.shapes.sphere,
                generator.material.get()
            );
            break;

        case SHAPE_BOX:
            shape = new Physijs.BoxMesh(
                generator.shapes.box,
                generator.material.get()
            );
            break;

        case SHAPE_CYLINDER:
            shape = new Physijs.CylinderMesh(
                generator.shapes.cylinder,
                generator.material.get()
            );
            break;

        case SHAPE_CONE:
            shape = new Physijs.ConeMesh(
                generator.shapes.cone,
                generator.material.get()
            );
            break;

    }

    // Add properties to it
    shape.material.color.setRGB( Math.random() * 100 / 100, Math.random() * 100 / 100, Math.random() * 100 / 100 );
    shape.castShadow = true;
    shape.receiveShadow = true;
    shape.objectShape = randomShape;
    shape.position.set(5, 20, 5);
    shape.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );

    // Callback upon collision with another object
    shape.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal ) {

        var bounce = function() {
            console.log('Collisions');
            shape.setLinearVelocity(relative_velocity);
            shape.lastCollision = new Date();
        };

        if (shape.objectShape === SHAPE_SPHERE && other_object.objectShape === SHAPE_GROUND) {
            if (!shape.lastCollision) {
                // Add a date property for the last known collision
                bounce();
            }

            // Reject quick collisions
            if (new Date() - shape.lastCollision >= 200) {
                bounce();
            }
        }
    });
    return shape;

}

// Keyboard event listener (pressing ENTER should create a shape)
function handleKeyDown(event) {
    if (event.keyCode === 13) {
        // Generate a random shape
        var shape = generateShape();

        // Add it to the scene
        environment.scene.add( shape );

        // Tell TWEEN to smoothly form the object from transparency
        new TWEEN.Tween(shape.material).to({opacity: 1}, 500).start();
    }
}

window.addEventListener('keydown', handleKeyDown, false);
window.onload = initScene;
