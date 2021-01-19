// Create a new connection using socket.io (immported in index.html)
const socket = io();
let video;
let bgShader;

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

// eslint-disable-next-line prefer-const
let DEBUG_MODE = true;

/**
 * Qui si accumulano un po' di dati per il debug.
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
  happy: '#FEBE43',
  sad: '#5374E7',
  angry: '#EF6C94',
  fearful: '#EB9AF4',
  disgusted: '#ABD690',
  surprised: '#D8D555',
  neutral: '#DFDFDF',
};

// neutral, happy, sad, angry, fearful, disgusted, surprised
const feelings = Object.keys(palette);

const bg = new p5((sketck) => {
  sketck.setup = function() {
    sketck.createCanvas(sketck.windowWidth, sketck.windowHeight, WEBGL).parent('#backgroundP5');
  };
});

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
  if (!me) {
    console.warn('Probabilmente non c\'è ancora una connessione al server. Riproverò fra un secondo.');
    return setTimeout(detectFace, 500);
  } else if (!video) { // La cam non è attiva.
    console.warn('Probabilmente il permesso della webcam non è ancora stato concesso. Riproverò fra un secondo.');
    return setTimeout(detectFace, 1000);
  }

  detection = await faceapi.detectSingleFace(video.elt,
      detectionOptions).withFaceLandmarks().withFaceExpressions();

  if (detection) {
    /**
     * Grado di certezza affinché la rilevazione sia valida.
     *
     * Se face-api.js trova un volto ma ha un grando di certezza inferiore al
     * valore di threshold, la rilevazione ricomincia.
     *
     * @type {number}
     */
    const threshold = .8;

    const score = detection.detection._score;

    if (score < threshold) {
      DEBUG_MODE && console.debug('Uncertain detection');
      return detectFace();
    }

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
  } else { // Nessuna rilevazione.
    // DEBUG_MODE && console.warn('Invalid detection');
  }

  return detectFace();
}

/**
 * Funzione chiamata dal <button>
 */
function start() {
  const detectionButton = document.getElementById('start2');
  detectionButton.remove();
  detectFace();
}

function preload() {
  bgShader = loadShader('shader.vert', 'shader.frag');
}

async function setup() {
  createCanvas(windowWidth, windowHeight).parent('#faces');

  // Crea le istanze dei focus point
  for (const feeling of feelings) {
    gravityPoints.set(feeling, new FeelingGravity({feeling: feeling}));
  }

  // Loads facepi models
  const MODEL_URL = '/models';

  await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
  await faceapi.loadFaceExpressionModel(MODEL_URL);
  await faceapi.loadFaceLandmarkModel(MODEL_URL);

  video = createCapture(VIDEO, function() {
    document.getElementById('start').disabled = false;
    DEBUG_MODE && console.debug('Video is ready.');
  });

  video.hide();

  if (typeof socket.id !== 'undefined') {
    players.set(socket.id,
        new Player({id: socket.id, x: width / 2, y: height / 2}));

    me = players.get(socket.id);
  }

  setInterval(function() {
    const summedFeeling = {
      neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0,
    };

    for (const [, player] of players) {
      if (player.feelings) {
        for (const [f, value] of Object.entries(player.feelings)) {
          summedFeeling[f] += value;
        }
      }
    }

    for (const [f, v] of Object.entries(summedFeeling)) {
      bgShader.setUniform(f, v);
    }
  }, 400);
}

function draw() {
  const mm = mouseX / 100;

  bg.shader(bgShader);

  clear();

  for (const [, gravityPoint] of gravityPoints) {
    gravityPoint.run();
  }

  for (const [, player] of players) {
    player.run();
  }

  bgShader.setUniform('resolution', [width, height]);
  bgShader.setUniform('time', millis() / 1000.0);
  bgShader.setUniform('value', mm);

  bg.quad(-1, -1, 1, -1, 1, 1, -1, 1);
}

/**
 * Eseguita ogni volta che la finestra è ridimensionata.
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
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
  console.info('Player ' + id + ' left');
  players.delete(id);
}

socket.on('connect', function() {
  console.info('You are now connected. Your ID is ' + socket.id);

  if (typeof width !== 'undefined') {
    players.set(socket.id,
        new Player({id: socket.id, x: width / 2, y: height / 2}));

    me = players.get(socket.id);
  }
});

socket.on('player.updated', onPlayerUpdated);
socket.on('player.left', onPlayerLeft);
