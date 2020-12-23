/* eslint-env browser */
// Create a new connection using socket.io (immported in index.html)

const socket = io();

let video;

const detectionOptions = new faceapi.TinyFaceDetectorOptions();

let me;
const players = [];

const scribble = new Scribble();

let detection;

const palette = {
  neutral: 'gray',
  happy: 'green',
  sad: 'blue',
  angry: 'red',
  fearful: 'torquoise',
  disgusted: 'red',
  surprised: 'orange',
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

  me = new Face();

  // Crea le istanze dei focus point
  for (const feeling of feelings) {
    gravityPoints.set(feeling, new Focus({feeling: feeling}));
  }

  for (let i = 0; i < 30; i++) {
    const x = random(width);
    const y = random(height);
    const feel = random(feelings);

    players.push(new Face({x, y, feeling: feel}));
  }
}

function draw() {
  clear();

  for (const [feeling, gravityPoint] of gravityPoints) {
    gravityPoint.run();
    gravityPoint.draw();
  }

  for (const player of players) {
    push();
    player.updatePosition();
    player.draw();
    pop();
  }
}

function windowResized() {
  // Ricalcolo le posizioni dei focus
  for (const [, gravityPoint] of gravityPoints) {
    gravityPoint.setPosition();
  }
}

window.palette = palette;
window.feelings = feelings;
