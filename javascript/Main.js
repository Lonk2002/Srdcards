import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import Scrollbar from './Scrollbar.js';
import JsonFetcher from './JsonFetcher.js';

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#ThreeJSCanvas'),
    alpha: true,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const canvas = renderer.domElement;

// --- KameraMain ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(1, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 350;
camera.position.y = 1;

let targetCameraY = camera.position.y;
const scrollSpeed = 0.5;
const maxScroll = 1.2;
const minScroll = -19;
window.addEventListener('wheel', (event) => {
    targetCameraY += event.deltaY < 0 ? scrollSpeed : -scrollSpeed;
    targetCameraY = Math.min(Math.max(targetCameraY, minScroll), maxScroll);
});
function updateCamera() {
    camera.position.y += (targetCameraY - camera.position.y) * 0.1;
    scrollbar.updateFromCamera(camera.position.y);
}
const scrollbar = new Scrollbar(maxScroll, minScroll);
window.addEventListener('customScroll', (event) => {
    targetCameraY = event.detail.targetCameraY;
});

let currentScene = scene;
let currentCam = camera;

// --- KameraSub ---
const sceneSub = new THREE.Scene();
const cameraSub = new THREE.PerspectiveCamera(1, window.innerWidth / window.innerHeight, 0.1, 1000);
cameraSub.position.set(0, 0, 350)

// --- Szenen wechsel ---
function switchToScene(newScene, newCamera) {
    if (newScene && newCamera) {
        currentScene = newScene;
        currentCam = newCamera;
        console.log('Szenenwechsel durchgeführt: ', currentScene, currentCam); 
    } else {
        console.error('Fehler: Ungültige Szene oder Kamera übergeben!');
    }
}
document.getElementById('backButton').addEventListener('click', () => {
    switchToScene(scene, camera);
});

// --- HDRI ---
const loader = new RGBELoader();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

const HDRI = new URL('../assets/scene_hdri.hdr', import.meta.url).href;
loader.load(HDRI, function(texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();
});

// --- Sedcards ---
const textureLoader = new THREE.TextureLoader();

// --- SedcardsHintergund ---
const sedcardBackgroundURL = new URL('../assets/sedcard.png', import.meta.url).href;
const sedcardBackgroundTexture = textureLoader.load(sedcardBackgroundURL);
sedcardBackgroundTexture.colorSpace = THREE.SRGBColorSpace;
const sedcardBackgroundGeometry = new THREE.PlaneGeometry(1.2, 1.2);
const sedcardBackgroundMaterial = new THREE.MeshStandardMaterial({
    map: sedcardBackgroundTexture,
    side: THREE.FrontSide,
    metalness: 1,
    roughness: 0.5
});

// --- HitBox ---
const hitboxGeometry = new THREE.PlaneGeometry(1.2 + 0.1, 1.2 + 0.1); 
const hitboxMaterial = new THREE.MeshBasicMaterial({ 
    color: 'blue',
    opacity: 0,
    transparent: true
});

// --- JsonFetcher ---
let hitboxPlanes = [];
const fetcher = new JsonFetcher('https://sc.ins.gg/api/creatorsmetrics/1727083434387');
fetcher.fetchData()
    .then(data => {
        let xStart = -4.72;
        let yStart = 3.25;
        let xSpacing = 1.35; 
        let ySpacing = -2; 
        let maxPerRow = 8;
        let currentX = xStart;
        let currentY = yStart;
        let count = 0;
        data.forEach(person => {

            // --- Sedcards ---

            // --- sedcardBild ---
            const imageURL = `https://zap.insnetman.com/assets/${person.avatar_main}`;
            const personTexture = textureLoader.load(
                imageURL,
                () => console.log(`Bild geladen für: ${person.name}`),
                undefined,
                err => console.error(`Fehler beim Laden des Bildes für: ${person.name}`, err)
            );

            personTexture.colorSpace = THREE.SRGBColorSpace;

            // Material für das Sedcard-Bild
            const personMaterial = new THREE.MeshStandardMaterial({
                map: personTexture,
                transparent: true,
                side: THREE.FrontSide,
                metalness: 1,
                roughness: 0.8
            });

            // Geometrie für das Sedcard-Bild
            const sedcardGeometry = new THREE.PlaneGeometry(1.2, 1.2);
            const sedcardMesh = new THREE.Mesh(sedcardGeometry, personMaterial);
            sedcardMesh.position.set(currentX, currentY, 0);
            sedcardMesh.name = person.name;
            scene.add(sedcardMesh);

            // --- sedcardName ---
            const textCanvas = document.createElement('canvas');
            const textCtx = textCanvas.getContext('2d');
            textCanvas.width = 256 * 2;
            textCanvas.height = 256 * 2; 
            textCtx.font = '55px arial';
            textCtx.textAlign = 'center'; 
            textCtx.textBaseline = 'middle';
            textCtx.fillStyle = 'white';
            const text = person.name;
            textCtx.fillText(text, textCanvas.width / 2, textCanvas.height / 2);
            const textTexture = new THREE.CanvasTexture(textCanvas);
            textTexture.repeat.set(1, 0.3);
            textTexture.offset.set(0, 0.35);
            const textMaterial = new THREE.MeshStandardMaterial({
                map: textTexture,
                transparent: true,
                metalness: 1,
                roughness: 0.8
            });
            const textGeometry = new THREE.PlaneGeometry(1.5, 0.5);
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            sedcardMesh.add(textMesh);
            textMesh.position.set(0, -0.85, 0);

            // --- sedcardHintergrund ---
            const sedcardBackgroundMesh = new THREE.Mesh(sedcardBackgroundGeometry, sedcardBackgroundMaterial);
            sedcardMesh.add(sedcardBackgroundMesh);

            // --- hitbox ---
            const hitboxPlane = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitboxPlane.name = person.name + "_hitbox";
            scene.add(hitboxPlane);
            hitboxPlane.position.set(currentX, currentY, -2);
            hitboxPlanes.push(hitboxPlane);

            count++;
            if (count % maxPerRow === 0) {
                currentX = xStart;
                currentY += ySpacing;
            } else {
                currentX += xSpacing;
            }

            console.log('Name:', person.name, person.sort);
        });
        canvas.addEventListener('click', onMouseClick);
    })
    .catch(error => {
        console.error('Fehler:', error);
    });

// --- Raycaster & MousePosition ---
const LERP = 0.1;
const WINKEL = Math.PI / 5;
const raycaster = new THREE.Raycaster();
const mousePosition = new THREE.Vector2();
const targetQuaternion = new THREE.Quaternion();
let isMouseOver = false;
let currentIntersectedMeshName = null;

function updateMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    mousePosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mousePosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function checkIntersections() {
    raycaster.setFromCamera(mousePosition, camera);
    const intersects = raycaster.intersectObjects(hitboxPlanes);
    if (intersects.length > 0) {
        const { point, object } = intersects[0];
        currentIntersectedMeshName = object.name.replace("_hitbox", "");
        updateRotation(point, currentIntersectedMeshName);
        isMouseOver = true;
    } else {
        isMouseOver = false;
        currentIntersectedMeshName = null;
    }
}

function updateRotation(intersectPoint, meshName) {
    const sedcardMesh = scene.getObjectByName(meshName);
    if (!sedcardMesh) return;

    const direction = new THREE.Vector3().subVectors(intersectPoint, sedcardMesh.position).normalize();
    direction.z = 0;
    const currentFront = new THREE.Vector3(0, 0, 1);
    const cross = new THREE.Vector3().crossVectors(currentFront, direction);
    let angle = Math.acos(currentFront.dot(direction));
    angle = Math.min(angle, WINKEL);

    const quaternion = new THREE.Quaternion().setFromAxisAngle(cross.normalize(), angle);
    targetQuaternion.copy(quaternion);
}

function onMouseClick(event) {
    updateMousePosition(event);
    raycaster.setFromCamera(mousePosition, currentCam);
        const intersects = raycaster.intersectObjects(hitboxPlanes);

    if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const Creator = hitMesh.name.replace("_hitbox", "");
        console.log('Name des angeklickten Creators:', Creator);
        generateDetailView(Creator);
        generateDetailView(Creator);
        switchToScene(sceneSub, cameraSub); 
    }
}

canvas.addEventListener('click', onMouseClick);
canvas.addEventListener('mousemove', updateMousePosition);
canvas.addEventListener('mousemove', checkIntersections);

function generateDetailView(creatorName) {
    if (!fetcher.data) {
        console.error('Fehler: fetcher.data ist nicht definiert. Die Daten sind möglicherweise noch nicht geladen.');
        console.log('fetcher:', fetcher);
        return;
    }
    
    while (sceneSub.children.length > 0) {
        sceneSub.remove(sceneSub.children[0]);
    }
    const selectedPersonData = fetcher.data.find(person => person.name === creatorName);
    if (selectedPersonData) {
        console.log(`Daten gefunden für: ${selectedPersonData.name}`);

        // --- HDRI ---
        const subHDRI = new URL('../assets/scene_hdri.hdr', import.meta.url).href;
        loader.load(subHDRI, function(texture) {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            sceneSub.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
        });

        // --- Creator Bild ---
        const subURL = `https://zap.insnetman.com/assets/${selectedPersonData.avatar_main}`;
        const subTexture = textureLoader.load(subURL,
            
        );
        subTexture.colorSpace = THREE.SRGBColorSpace;
        subTexture.offset.set(0.1, 0);
        subTexture.repeat.set(0.8, 1);
        const subGeometry = new THREE.PlaneGeometry(4, 4);
        const subMaterial = new THREE.MeshStandardMaterial({
            map: subTexture,
            transparent: true,
            side: THREE.FrontSide,
            metalness: 1,
            roughness: 0.8
        });
        const subMesh = new THREE.Mesh(subGeometry, subMaterial);
        subMesh.name = `bild`;
        subMesh.position.set(2.5, 1, 0);
        sceneSub.add(subMesh);

        // --- Creator Info Text ---

        // --- DECODE ---
        function decodeHtmlEntities(html) {
            const txt = document.createElement('textarea');
            txt.innerHTML = html;
            return txt.value;
        }
        const infoCanvas = document.createElement('canvas');
        const infoCtx = infoCanvas.getContext('2d');
        infoCanvas.width = 1024; 
        infoCanvas.height = 1024; 
        infoCtx.font = '20px Arial'; 
        infoCtx.textAlign = 'center';
        infoCtx.textBaseline = 'top'; 
        infoCtx.fillStyle = 'white';
        const infotext = selectedPersonData.bio_de;
        const decodedText = decodeHtmlEntities(infotext).replace(/<[^>]*>/g, "");
        wrapText(infoCtx, decodedText, infoCanvas.width / 2, 20, infoCanvas.width - 40, 45); 
        const infoTexture = new THREE.CanvasTexture(infoCanvas);
        const infoMaterial = new THREE.MeshStandardMaterial({
            map: infoTexture,
            transparent: true,
            metalness: 1,
            roughness: 0.8
        });
        const infogeometry = new THREE.PlaneGeometry(6, 6);
        const infoMesh = new THREE.Mesh(infogeometry, infoMaterial);
        infoMesh.position.set(0, -5, 0);
        subMesh.add(infoMesh);

        function wrapText(context, text, x, y, maxWidth, lineHeight) {
            const words = text.split(' ');
            let line = '';

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;

                if (testWidth > maxWidth && n > 0) {
                    context.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, y);
        }

        // --- Hitbox für Text und Creator Bild --- 
        const hitboxBildGeo = new THREE.PlaneGeometry(4.2, 4.2);
        const hitboxBildMaterial = new THREE.MeshBasicMaterial({
            color: 'red',
            transparent: true,
            opacity: 0.4,
            side: THREE.FrontSide, 
        });

        const hitboxBildMesh = new THREE.Mesh(hitboxBildGeo, hitboxBildMaterial);
        hitboxBildMesh.name = `hitbox_bild`;
        hitboxBildMesh.position.set(2.5, 1, -1); 
        sceneSub.add(hitboxBildMesh);

        // --- Platforms ---
        const channels = selectedPersonData.sedcard_channels;
        const columns = 2; 
        const rowSpacing = 1.2;
        const columnSpacing = 2.2; 
        const startX = -4.45; 
        const startY = 1.6; 
        const scaleFactor = 0.7;

        function formatNumber(value) {
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
            }
            return value;
        }

        channels.forEach((channelData, index) => {
            const platformData = channelData.v2_channels_id;
            const platform = platformData.platform; 
            const username = platformData.platform_username;
            let followers = platformData.metrics?.[0]?.followers || "N/A";
            if (followers !== "N/A" && !isNaN(followers)) {
                followers = formatNumber(parseInt(followers));
            }

            const platformCanvas = document.createElement('canvas');
            const platformCtx = platformCanvas.getContext('2d');
            platformCanvas.width = 1024;
            platformCanvas.height = 256;
            platformCtx.clearRect(0, 0, platformCanvas.width, platformCanvas.height);
            platformCtx.globalAlpha = 1.0;
            platformCtx.font = 'bold 80px Arial';
            platformCtx.fillStyle = 'black';
            platformCtx.textAlign = 'left';
            platformCtx.textBaseline = 'top';
            platformCtx.fillText(platform.toUpperCase(), 20, 20);
            platformCtx.font = 'bold 60px Arial';
            platformCtx.fillStyle = 'white';
            const detailsText = `${username}\nFollowers: ${followers}`;
            const lines = detailsText.split('\n');
            lines.forEach((line, lineIndex) => {
                platformCtx.fillText(line, 20, 120 + lineIndex * 60);
            });
            const platformTexture = new THREE.CanvasTexture(platformCanvas);
            const platformMaterial = new THREE.MeshBasicMaterial({
                map: platformTexture,
                transparent: true,
            });

            const platformGeometry = new THREE.PlaneGeometry(2.5, 1.0);
            const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
            const row = Math.floor(index / columns);
            const column = index % columns;     
            const posX = startX + column * columnSpacing;
            const posY = startY - row * rowSpacing;
            const sedcardBackgroundTexture = textureLoader.load(sedcardBackgroundURL);
            sedcardBackgroundTexture.colorSpace = THREE.SRGBColorSpace;
            const sedcardBackgroundGeometry = new THREE.PlaneGeometry(platformGeometry.parameters.width + 0.4, platformGeometry.parameters.height + 0.4);
            const sedcardBackgroundMaterial = new THREE.MeshStandardMaterial({
                map: sedcardBackgroundTexture,
                side: THREE.FrontSide,
                metalness: 1,
                roughness: 0.5,
            });

            const backgroundMesh = new THREE.Mesh(sedcardBackgroundGeometry, sedcardBackgroundMaterial);
            backgroundMesh.name = `background_${username}`;
            backgroundMesh.position.set(posX, posY, -0.01);
            backgroundMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
            sceneSub.add(backgroundMesh);
            platformMesh.position.set(0, 0, 0);
            backgroundMesh.add(platformMesh);

            const hitboxGeometry = new THREE.PlaneGeometry(platformGeometry.parameters.width - 0.35, platformGeometry.parameters.height + 0.1);
            const hitboxMaterial = new THREE.MeshBasicMaterial({
                color: 'red',
                transparent: true,
                opacity: 0.4,
                side: THREE.FrontSide, 
            });

            const hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitboxMesh.name = `hitbox_${username}`;
            hitboxMesh.position.set(posX, posY, -0.1); 
            sceneSub.add(hitboxMesh);
        });

        // --- sedcardName ---
        const nameCanvas = document.createElement('canvas');
        const textCtx = nameCanvas.getContext('2d');
        nameCanvas.width = 256 * 4;
        nameCanvas.height = 256 * 4; 
        textCtx.font = '120px arial';
        textCtx.textAlign = 'left'; 
        textCtx.textBaseline = 'middle';
        textCtx.fillStyle = 'white';
        const text = selectedPersonData.name;
        textCtx.fillText(text, 10, nameCanvas.height / 2);
        const textTexture = new THREE.CanvasTexture(nameCanvas);
        textTexture.repeat.set(1, 0.3);
        textTexture.offset.set(0, 0.35);
        const textMaterial = new THREE.MeshStandardMaterial({
            map: textTexture,
            transparent: true,
            metalness: 1,
            roughness: 0.8
        });
        const textGeometry = new THREE.PlaneGeometry(1.5*2.8, 0.5*2.8);
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        sceneSub.add(textMesh);
        textMesh.position.set(-3.4, 2.5, 0);
        
    }
}

// --- Animation ---
function animate() {
    requestAnimationFrame(animate);
    if (isMouseOver && currentIntersectedMeshName) {
        const sedcardMesh = scene.getObjectByName(currentIntersectedMeshName);
        if (sedcardMesh) {
            sedcardMesh.quaternion.slerp(targetQuaternion, LERP);
        }
    } else {
        hitboxPlanes.forEach(hitbox => {
            const meshName = hitbox.name.replace("_hitbox", "");
            const sedcardMesh = scene.getObjectByName(meshName);
            if (sedcardMesh) {
                sedcardMesh.quaternion.slerp(new THREE.Quaternion(), LERP);
            }
        });
    }
    updateCamera();
    renderer.render(currentScene, currentCam);
}

animate();