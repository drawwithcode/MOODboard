/* eslint-env browser */
// Create a new connection using socket.io (immported in index.html)
const socket = io();
let video;
const detecting = false;
/**
 * L'istanza di Player che rappresente il giocatore presente.
 *
 * @type {Player}
 */
let me;
/**
 * Tutti i giocatori presenti.
 * @type {Map<string, Player>}
 */
const players = new Map;
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
 * @type {Map<string, FeelingGravity>}
 */
const gravityPoints = new Map();

/**
 * Esegue il riconoscimento facciale.
 *
 * La funzione è ricorsiva, chiama se stessa.
 *
 * @return {Promise<*|undefined>}
 */
async function detectFace() {
  if (video?.elt && me) {
    detection = await faceapi.detectSingleFace(video.elt,
        detectionOptions).
        withFaceLandmarks().
        withFaceExpressions();

    if (detection) {
      me.detection = detection;

      me.broadcast();

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

/**
 * Funzione chiamata dal <button>
 */
function start() {
  loop();
}

async function setup() {
  createCanvas(windowWidth, windowHeight);


  // Crea le istanze dei focus point
  for (const feeling of feelings) {
    gravityPoints.set(feeling, new FeelingGravity({feeling: feeling}));
  }

  noLoop();

  // Loads facepi models
  const MODEL_URL = '/models';

  await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
  await faceapi.loadFaceExpressionModel(MODEL_URL);
  await faceapi.loadFaceLandmarkModel(MODEL_URL);

  video = createCapture(VIDEO, function() {
    document.getElementById('start').disabled = false;
    detectFace();
  });

  video.hide();
}

function draw() {
  clear();

  for (const [, gravityPoint] of gravityPoints) {
    gravityPoint.run();
  }

  for (const [, player] of players) {
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

function onPlayerJoined(id) {
  console.debug('Player joined');
  players.set(id, new Player({id}));
}

function onPlayerUpdated(id, feelings, landmarks, dimensions) {
  if (!players.has(id)) {
    players.set(id, new Player({id}));
  }

  const player = players.get(id);

  player.expressions = feelings;

  // Fingiamo che sia un input di faceapi
  player.landmarks = {
    _positions: landmarks,
    _imgDims: {_height: dimensions.h, _width: dimensions.w},
  };
}

function onPlayerLeft(id) {
  console.debug('Player left');

  players.delete(id);
}

socket.on('connect', function() {
  console.log('I am connected', socket.id);
  players.set(socket.id,
      new Player({id: socket.id, x: width / 2, y: height / 2}));

  me = players.get(socket.id);
});

socket.on('player.joined', onPlayerJoined);
socket.on('player.updated', onPlayerUpdated);
socket.on('player.left', onPlayerLeft);
