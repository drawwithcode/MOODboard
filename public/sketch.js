// Create a new connection using socket.io (immported in index.html)
const socket = io();
let video;
let bgShader;
let font;
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

// eslint-disable-next-line prefer-const
let DEBUG_MODE = true;
let started = false;

let detection;
const detectionOptions = new faceapi.TinyFaceDetectorOptions();
/**
 * Costante di attrazione gravitazionale.
 *
 * In natura equivale a 6.67E-11
 * @type {number}
 */
const G = 100;

/**
 * Palette of color associated to each expression.
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
  neutral: '#9da7ab',
};

// neutral, happy, sad, angry, fearful, disgusted, surprised
const feelings = Object.keys(palette);

const summedFeelings = {
  prev: {},
  next: {},
  lastTimestamp: 0,
  interval: 600,
};

const bg = new p5((sketck) => {
  sketck.setup = function() {
    sketck.createCanvas(sketck.windowWidth, sketck.windowHeight, WEBGL).parent('#backgroundP5');
  };

  sketck.windowResized = function() {
    sketck.resizeCanvas(sketck.windowWidth, sketck.windowHeight);
    bgShader.setUniform('resolution', [width, height]);
  };
});

/**
 * These are the points in
 * @type {Map<string, GravityPoint>}
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
    const threshold = .9;

    const score = detection.detection._score;

    if (score < threshold) {
      DEBUG_MODE && console.debug('Uncertain detection');
      return detectFace();
    }

    me.detection = detection;

    me.broadcast();
  } else { // Nessuna rilevazione.
    DEBUG_MODE && console.warn('Invalid detection');
  }

  return detectFace();
}

const detectionButton = document.getElementById('start2');

/**
 * Funzione chiamata dal <button>
 */
function start() {
  detectionButton.remove();

  started = true;

  detectFace();
}

function preload() {
  bgShader = loadShader('shader.vert', 'shader.frag');
  font = loadFont('font/Karrik-Regular.woff');
}

async function setup() {
  createCanvas(windowWidth, windowHeight).parent('#faces');

  // Crea le istanze dei focus point
  for (const feeling of feelings) {
    gravityPoints.set(feeling, new GravityPoint({feeling: feeling}));
  }

  // Loads facepi models
  const MODEL_URL = '/models';

  await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
  await faceapi.loadFaceExpressionModel(MODEL_URL);
  await faceapi.loadFaceLandmarkModel(MODEL_URL);

  video = createCapture(VIDEO, function() {
    const start = document.getElementById('start');

    start.disabled = false;
    start.classList.remove('disabled');

    DEBUG_MODE && console.debug('Video is ready.');
  });

  video.hide();

  if (typeof socket.id !== 'undefined') {
    players.set(socket.id,
        new Player({id: socket.id, x: width / 2, y: height / 2}));

    me = players.get(socket.id);
  }

  setInterval(function() {
    const nextFeelings = {
      neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0,
    };

    for (const [, player] of players) {
      if (player.feelings) {
        for (const feeling of feelings) {
          nextFeelings[feeling] += player.feelings[feeling];
        }
      }
    }

    summedFeelings.prev = summedFeelings.next;
    summedFeelings.next = nextFeelings;
    summedFeelings.lastTimestamp = Date.now();
  }, summedFeelings.interval);

  bgShader.setUniform('resolution', [width, height]);
}

function draw() {
  clear();

  textFont(font);

  for (const [, gravityPoint] of gravityPoints) {
    gravityPoint.run();
  }

  for (const [, player] of players) {
    player.run();
  }

  bgShader.setUniform('time', millis() / 1000.0);

  const {prev, next, lastTimestamp, interval} = summedFeelings;

  if (prev && next) {
    bg.shader(bgShader);

    const now = Date.now();

    const amt = (now - lastTimestamp) / interval;

    for (const feeling of feelings) {
      const lerped = lerp(prev[feeling], next[feeling], amt);
      bgShader.setUniform(feeling, lerped);
    }

    bg.quad(-1, -1, 1, -1, 1, 1, -1, 1);
  }
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

function onPlayerUpdated(id, feelings, landmarks, dimensions) {
  if (!players.has(id)) {
    players.set(id, new Player({id, x: width / 2, y: height / 2}));
  }

  const player = players.get(id);

  player.expressions = feelings;
  player.dimensions = dimensions;

  // Fingiamo che sia un input di faceapi
  player.landmarks = {
    _positions: landmarks,
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
