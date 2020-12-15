/* eslint-env browser */
// Create a new connection using socket.io (imported in index.html)
const socket = io();
let video;
const me = new Face();
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

async function detectFace() {
  stroke(20);
  detection = await faceapi.detectSingleFace(video.elt,
      new faceapi.TinyFaceDetectorOptions()).
      withFaceLandmarks().
      withFaceExpressions();

  if (!detection) {
    console.log('no detections');
    return detectFace();
  }

  me.expressions = detection.expressions;
  me.landmarks = detection.landmarks;

  clear();

  stroke(
      lerpColor(color('white'), color(palette[me.feeling]), me.feelingValue),
  );

  me.draw();

  textSize(20);
  text(me.feeling + ', ' + me.feelingValue.toFixed(3), video.width/2, video.height - 20 );
  return detectFace();
}

async function preload() {
  const MODEL_URL = '/models';
  await faceapi.loadTinyFaceDetectorModel(MODEL_URL);
  await faceapi.loadFaceLandmarkModel(MODEL_URL);
  await faceapi.loadFaceExpressionModel(MODEL_URL);
}

async function setup() {
  createCanvas(windowWidth, windowHeight);

  video = createCapture(VIDEO, detectFace);
  video.id();
  video.hide();
}
