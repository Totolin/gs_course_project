var objects = [];
var environment = {
    light: null,
    camera: null,
    plane: null,
    scene: null,
    controls: null,
    renderer: null
};

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {

    var element = document.body;

    var pointerlockchange = function ( event ) {

        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
            controlsEnabled = true;
            environment.controls.enabled = true;
            blocker.style.display = 'none';

        } else {

            environment.controls.enabled = false;

            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';

            instructions.style.display = '';

        }

    };

    var pointerlockerror = function ( event ) {

        instructions.style.display = '';

    };

    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    instructions.addEventListener( 'click', function ( event ) {

        instructions.style.display = 'none';

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();

    }, false );

} else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

init();
animate();

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;

var prevTime = performance.now();
var velocity = new THREE.Vector3();

function getRandom (min ,max) {
    return Math.floor(Math.random() * max) + min;
}

function createCamera() {
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    return camera
}

function createLight() {
    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    return light;
}

function createKeyboardHandler() {
    var onKeyDown = function ( event ) {

        switch ( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true; break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

            case 32: // space
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;

        }

    };

    var onKeyUp = function ( event ) {

        switch( event.keyCode ) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );
}

function createGround() {
    // Texture Loader (to load the image)
    var loader = new THREE.TextureLoader();

    // Create the ground material
    var ground_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: loader.load( 'images/grass.png' ) })
    );
    ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
    ground_material.map.repeat.set( 2.5, 2.5 );

    // Ground floor of the box
    var ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(500, 1, 500),
        ground_material,
        0 // mass
    );
    ground.receiveShadow = true;

    return ground;
}

function createWalls() {
    // All textures
    var texture_front = THREE.ImageUtils.loadTexture('images/front.bmp');
    var texture_back = THREE.ImageUtils.loadTexture('images/back.bmp');
    var texture_left = THREE.ImageUtils.loadTexture('images/right.bmp');
    var texture_right = THREE.ImageUtils.loadTexture('images/left.bmp');
    var texture_top = THREE.ImageUtils.loadTexture('images/top.bmp');

    // Walls to form a box
    var wall, wall_geom = new THREE.BoxGeometry(2, 500, 482);

    // Walls to return
    walls = [];

    wall = new Physijs.BoxMesh(
        wall_geom,
        new THREE.MeshLambertMaterial({map: texture_right}),
        0, { restitution: .2 }
    );
    wall.position.y = 250;
    wall.position.x = -240;
    wall.receiveShadow = true;
    wall.castShadow = true;
    walls.push(wall);

    wall = new Physijs.BoxMesh(
        wall_geom,
        new THREE.MeshLambertMaterial({map: texture_left}),
        0, { restitution: .2 }
    );
    wall.position.y = 250;
    wall.position.x = 240;
    wall.receiveShadow = true;
    wall.castShadow = true;
    walls.push(wall);


    wall = new Physijs.BoxMesh(
        wall_geom,
        new THREE.MeshLambertMaterial({map: texture_back}),
        0, { restitution: .2 }
    );
    wall.position.y = 250;
    wall.position.z = -240;
    wall.rotation.y = Math.PI / 2;
    wall.receiveShadow = true;
    wall.castShadow = true;
    walls.push(wall);

    wall = new Physijs.BoxMesh(
        wall_geom,
        new THREE.MeshLambertMaterial({map: texture_front}),
        0, { restitution: .2 }
    );
    wall.position.y = 250;
    wall.position.z = 240;
    wall.rotation.y = Math.PI / 2;
    wall.receiveShadow = true;
    wall.castShadow = true;
    walls.push(wall);

    wall = new Physijs.BoxMesh(
        wall_geom,
        new THREE.MeshLambertMaterial({map: texture_top}),
        0, { restitution: .2 }
    );
    wall.position.y = 450;
    wall.position.z = 0;
    wall.position.x = 0;
    wall.rotation.z = Math.PI / 2;
    wall.receiveShadow = true;
    wall.castShadow = true;
    walls.push(wall);

    return walls;
}

function createRoad() {
    // Texture Loader (to load the image)
    var loader = new THREE.TextureLoader();

    // Create the ground material
    var bumper_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: loader.load( 'images/plywood.jpg' ) })
    );

    // Bumpers to form a road
    var bumper,
        bumper_geom = new THREE.BoxGeometry(2, 1, 500);

    bumper = new Physijs.BoxMesh( bumper_geom, bumper_material, 0, { restitution: .2 } );
    bumper.position.y = 1;
    bumper.position.x = -24;
    bumper.receiveShadow = true;
    bumper.castShadow = true;
    environment.scene.add( bumper );

    bumper = new Physijs.BoxMesh( bumper_geom, bumper_material, 0, { restitution: .2 } );
    bumper.position.y = 1;
    bumper.position.x = 24;
    bumper.receiveShadow = true;
    bumper.castShadow = true;
    environment.scene.add( bumper );

    // Create the road material
    var road_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ map: loader.load( 'images/rocks.jpg' ) })
    );
    road_material.map.wrapS = road_material.map.wrapT = THREE.LoopRepeat;
    road_material.map.repeat.set( 10, 10 );

    // Ground floor of the box
    ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(50, 1, 500),
        road_material,
        0 // mass
    );
    ground.position.y = 0.5;
    ground.receiveShadow = true;

    environment.scene.add( ground );
}

function generateRandomTree() {
    // Texture Loader (to load the image)
    var loader = new THREE.TextureLoader();

    // Tree texture
    var texture = loader.load( 'images/wood.jpg' );

    // Generate a random tree
    var tree = new THREE.Tree({
        generations : 4,        // # for branch' hierarchy
        length      : 7.0,      // length of root branch
        uvLength    : 16.0,     // uv.v ratio against geometry length (recommended is generations * length)
        radius      : 0.2,      // radius of root branch
        radiusSegments : 8,     // # of radius segments for each branch geometry
        heightSegments : 20      // # of height segments for each branch geometry
    });

    var geometry = THREE.TreeGeometry.build(tree);

    var mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshPhongMaterial({
            map: texture
        })
    );

    return mesh;
}

function createTrees() {

    var trees = [], tree;

    // Initial generation positions
    var position_x = 30;
    var position_z = 80;

    for (var i=0; i<25; i++) {

        tree = generateRandomTree();
        tree.position.x = position_x;
        tree.position.z = position_z;
        trees.push(tree);

        tree = generateRandomTree();
        tree.position.x = position_x - 62;
        tree.position.z = position_z;
        trees.push(tree);

        position_z -= 15;
    }

    return trees;
}

function createBuildings() {
    var geometry, texture;
    var buildings = [];

    var addBuilding = function (geo, tex, x, y, z, repeat) {
        var material = new THREE.MeshLambertMaterial({map: tex});

        if (repeat) {
            material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
            material.map.repeat.set( 1.2, 1 );
        }

        var building = new Physijs.BoxMesh(
            geo, material
        );
        building.position.x = x;
        building.position.y = y;
        building.position.z = z;

        buildings.push(building);
    };

    geometry = new THREE.BoxGeometry(50, 70, 50);
    texture = THREE.ImageUtils.loadTexture('images/building1.jpg');
    addBuilding(geometry, texture, 100, 30, 0);

    geometry = new THREE.BoxGeometry(150, 90, 50);
    texture = THREE.ImageUtils.loadTexture('images/building2.jpg');
    addBuilding(geometry, texture, 12, 45, 100);

    geometry = new THREE.BoxGeometry(50, 90, 100);
    texture = THREE.ImageUtils.loadTexture('images/building3.jpg');
    addBuilding(geometry, texture, 100, 45, -100);

    geometry = new THREE.BoxGeometry(50, 90, 100);
    texture = THREE.ImageUtils.loadTexture('images/building5.jpg');
    addBuilding(geometry, texture, -100, 45, -100);

    geometry = new THREE.BoxGeometry(50, 190, 100);
    texture = THREE.ImageUtils.loadTexture('images/building6.jpg');
    addBuilding(geometry, texture, -100, 95, 30, true);

    return buildings;
}

function init() {

    // Initial scene
    environment.scene = new THREE.Scene();

    // Perspective camera
    environment.camera = createCamera();

    // Some fog
    environment.scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

    // Lighting
    var light = createLight();
    environment.scene.add( light );

    // Controls
    environment.controls = new THREE.PointerLockControls( environment.camera );
    environment.scene.add( environment.controls.getObject() );

    // Key events
    createKeyboardHandler();

    // Raycaster : Raycasting is used for mouse picking (working out what objects in the 3d space the mouse is over)
    environment.raycaster = new THREE.Raycaster(
        new THREE.Vector3(),
        new THREE.Vector3( 0, - 1, 0 ),
        0, 10
    );

    // Add a ground
    var ground = createGround();
    environment.scene.add( ground );

    // Add walls
    var walls = createWalls();
    walls.forEach(function(wall) {
        environment.scene.add( wall );
    });

    // Add buildings
    var buildings = createBuildings();
    buildings.forEach(function(building) {
        environment.scene.add( building );
    });

    // Add tree
    var trees = createTrees();
    trees.forEach(function(tree) {
        environment.scene.add( tree );
    });

    // Create a road
    createRoad();

    // Add renderer
    environment.renderer = new THREE.WebGLRenderer();
    environment.renderer.setClearColor( 0xffffff );
    environment.renderer.setPixelRatio( window.devicePixelRatio );
    environment.renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( environment.renderer.domElement );

    // Add onResize event
    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {
    environment.camera.aspect = window.innerWidth / window.innerHeight;
    environment.camera.updateProjectionMatrix();
    environment.renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {

    requestAnimationFrame( animate );

    if ( controlsEnabled ) {
        environment.raycaster.ray.origin.copy( environment.controls.getObject().position );
        environment.raycaster.ray.origin.y -= 10;

        var intersections = environment.raycaster.intersectObjects( objects );

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
            velocity.x = Math.max( 0, velocity.x );

            canJump = true;
        }

        environment.controls.getObject().translateX( velocity.x * delta );
        environment.controls.getObject().translateY( velocity.y * delta );
        environment.controls.getObject().translateZ( velocity.z * delta );

        if ( environment.controls.getObject().position.y < 10 ) {

            velocity.y = 0;
            environment.controls.getObject().position.y = 10;

            canJump = true;

        }

        prevTime = time;

    }

    environment.renderer.render( environment.scene, environment.camera );

}