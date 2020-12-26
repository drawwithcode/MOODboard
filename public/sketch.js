/* eslint-env browser */
// Create a new connection using socket.io (immported in index.html)
const socket = io();
let video;
/**
 * L'istanza di Player che rappresente il giocatore presente.
 *
 * @type {Player}
 */
let me;
/**
 * Tutti i giocatori presenti.
 * @type {Player[]}
 */
const players = [];
const scribble = new Scribble();

const DEBUG_MODE = true;

/**
 *
 * @type {{expressions: [string[]]}}
 */
const DEBUG = {
  expressions: [],
};

/**
 * Costante di attrazione gravitazionale.
 *
 * In natura equivale a 6.67E-11
 * @type {number}
 */
const G = 100;

const detectionOptions = new faceapi.TinyFaceDetectorOptions();

let detection;

/**
 * Palette delle emozioni
 *
 * @type {{string}}
 */
const palette = {
  happy: 'green',
  sad: 'blue',
  angry: 'red',
  fearful: 'aqua',
  disgusted: 'purple',
  surprised: 'brown',
  neutral: 'gray',
};

// neutral, happy, sad, angry, fearful, disgusted, surprised
const feelings = Object.keys(palette);

/**
 * These are the points in
 * @type {Map<string, Focus>}
 */
const gravityPoints = new Map();

async function preload() {
  // Loads facepi models
  const MODEL_URL = '/models';

  await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
  await faceapi.loadFaceExpressionModel(MODEL_URL);
  await faceapi.loadFaceLandmarkModel(MODEL_URL);

  console.debug('Models loaded');
}

/**
 * Esegue il riconoscimento facciale.
 *
 * La funzione è ricorsiva, chiama se stessa.
 *
 * @return {Promise<*|undefined>}
 */
async function detectFace() {
  if (video?.elt) {
    detection = await faceapi.detectSingleFace(video.elt,
        detectionOptions).
        withFaceLandmarks().
        withFaceExpressions();

    if (detection) {
      me.detection = detection;

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
  } else { // La cam non è attiva.

  }
  return detectFace();
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO, detectFace);
  video.hide();

  players.push(new Player({id: socket.id, x: width / 2, y: height / 2}));

  me = players[players.length - 1];

  // Crea le istanze dei focus point
  for (const feeling of feelings) {
    gravityPoints.set(feeling, new FeelingGravity({feeling: feeling}));
  }

  // const count = random(15, 30);
  // for (let i = 0; i < count; i++) {
  //   const x = random(width);
  //   const y = random(height);
  //   const feel = random(feelings);
  //
  //   players.push(new Player({x, y, feeling: feel, id: random()}));
  // }
}

function draw() {
  clear();

  for (const [, gravityPoint] of gravityPoints) {
    gravityPoint.run();
  }

  for (const player of players) {
    player.run();
  }
}

/**
 * Eseguita ogni volta che la finestra è ridimensionata.
 */
function windowResized() {
  // Ricalcolo le posizioni dei focus
  for (const [, gravityPoint] of gravityPoints) {
    gravityPoint.setPosition();
  }
}

/**
 * Riassegna casualmente le espressioni ai players.
 *
 * Solo per la fase di sviluppo.
 *
 * @param {boolean} auto indica se andare in loop la funzione.
 */
function shufflefeelings(auto = true) {
  for (const player of players) {
    player.feeling = random(feelings);
    player.feelingValue = random(.4, 1);
  }

  if (auto) {
    setTimeout(random(800, 5000), shufflefeelings);
  }
}
