/* eslint-env browser */
// Create a new connection using socket.io (immported in index.html)
const socket = io();
let video;
let me;
const players = [];
const scribble = new Scribble();

/**
 * Costante di attrazione gravitazionale.
 *
 * In natura equivale a 6.67E-11
 * @type {number}
 */
const G = 66;

const detectionOptions = new faceapi.TinyFaceDetectorOptions();

let detection;

/**
 * Palette delle emozioni
 *
 * @type {{string}}
 */
const palette = {
  neutral: 'gray',
  happy: 'green',
  sad: 'blue',
  angry: 'red',
  fearful: 'aqua',
  disgusted: 'red',
  surprised: 'brown',
};

// neutral, happy, sad, angry, fearful, disgusted, surprised
const feelings = Object.keys(palette);

/**
 * These are the points in
 * @type {Map<string, Focus>}
 */
const gravityPoints = new Map();

/**
 * Runs (single) face detection and updates
 * @return {Promise<*|undefined>}
 */
async function detectFace() {
  detection = await faceapi.detectSingleFace(video.elt,
      detectionOptions).
      withFaceLandmarks().
      withFaceExpressions();

  if (detection) {
    me.expressions = detection.expressions;
    me.landmarks = detection.landmarks;

    clear();

    me.draw();

    /**
     * Mostriamo alcuni dati sull'espressione rilevata
     *
     * @todo cancellare quando non servirà
     */
    // textSize(20);
    // text(me.feeling + ', ' + me.feelingValue.toFixed(3), video.width / 2,
    //     video.height - 20);
  } else {
    // No face detected
  }

  return detectFace();
}

// Loads facepi models
// const MODEL_URL = '/models';
// faceapi.loadTinyFaceDetectorModel(MODEL_URL).then(function() {
//   faceapi.loadFaceExpressionModel(MODEL_URL);
//   faceapi.loadFaceLandmarkModel(MODEL_URL);
// });

function setup() {
  createCanvas(windowWidth, windowHeight);

  // video = createCapture(VIDEO);
  // video.id();
  // video.hide();
  players.push(new Face({id: socket.id}));

  me = players[players.length - 1];

  // Crea le istanze dei focus point
  for (const feeling of feelings) {
    gravityPoints.set(feeling, new Focus({feeling: feeling}));
  }

  const count = random(15, 30);
  for (let i = 0; i < count; i++) {
    const x = random(width);
    const y = random(height);
    const feel = random(feelings);

    players.push(new Face({x, y, feeling: feel, id: random()}));
  }
}

function draw() {
  clear();

  for (const [feeling, gravityPoint] of gravityPoints) {
    gravityPoint.run();
  }

  for (const player of players) {
    push();
    player.run();
    pop();
  }
}


function shufflefeelings() {
  for (const player of players) {
    player.feeling = random(feelings);
    player.feelingValue = random();
  }
}
function windowResized() {
  // Ricalcolo le posizioni dei focus
  for (const [, gravityPoint] of gravityPoints) {
    gravityPoint.setPosition();
  }
}
