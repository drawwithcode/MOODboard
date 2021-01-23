## Table of Contents
1. [Project Idea](#project-idea)
2. [Interaction](#interaction)
3. [Key features](#key-features)
4. [Miscellaneus](#miscellaneus)
5. [Teams](#teams)

## MOODboard

MOODboard is a project built in p5.js for the course **Creative Coding** at the Politecnico di Milano.

## Project Idea

 The main goal was to create an **interactive experience** where users can reconnect with their peers and other anonymous surfers through their emotions, to enable speculation around the theme of **sentient algorithms**.

## Interaction

 Users can see an **algorithmic representation** of their expression (neutral, happy, angry, sad, disgusted, surprised, fearful) that changes shape and color based on how they are feeling during that time. The representation is updated in **real-time**. Every user will be positioned according to their expression, creating **groups** based on shared emotion. The background will show a **generative artwork** that changes according to everyone's expression and the number of participants.

## Design challenges

### Algorithmic representation

First, we gave shape to the landmarks by connecting them with a stroke.
Then we decided on a palette that resonated with the mood we envisioned for the project, while also trying to use colors that were commonly coded with the emotions used.

```
const col = palette[this.feeling];
stroke(col);

noFill();
// rect(0, 0, this.dimensions.w, this.dimensions.h);
strokeWeight(5);
this._drawElement(this.leftEyebrow, false);
this._drawElement(this.rightEyebrow, false);
this._drawElement(this.nose, false);
this._drawElement(this.leftEye);
this._drawElement(this.rightEye);
this._drawElement(this.mouth);
noStroke();
```
####Palette


### Background

For the background, we decided very early in development that we wanted to design a **responsive generative artwork**. The artwork needed to further the connection between the users and their algorithmic representation. In order to achieve this result, we decided that we needed to show the **sum of the emotions** of every person in the room at any given time.

####Coding

After exploring the possibilities of p5.js in this scenario, we landed on an interesting project on openprocessing.org. The sketch seemed really fluid for a p5js project. In fact, we discovered that the main design was a **shader** coded in GLSL, a language that allows complex results with little computational load.
In order to understand GLSL, we used The book of shaders and GLSL Sandbox.
On GLSL Sandbox we found some shaders that had snippets that allowed us to get closer to our desired output. We used this sketch to be able to use the RGB color model instead of the default GLSL model. We then found this sketch which had an interesting parametric animation that we then modified to fit our needs.

The last hurdle we had was to pass information between the sketch and the shader.  Thankfully in *The book of shaders* we discovered the possibility to set a uniform from an external code. On the p5js documentation then we finally found the method to connect shaders and p5js sketches.

Using the data from Face.api we created **six uniforms** connected with each emotion. In the shader the emotions are shown as an array of horizontal stripes that grow with the variable.
The stripes are then animated with a **parametric equation**.

```
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

uniform float neutral;
uniform float happy;
uniform float sad;
uniform float angry;
uniform float fearful;
uniform float disgusted;
uniform float surprised;

#define RGB(r, g, b) vec3(r / 255.0, g / 255.0, b / 255.0)

const vec3 YELLOW = RGB(254.0, 190.0, 67.0);
const vec3 PINK = RGB(239.0, 108.0, 148.0);
const vec3 VIOLET = RGB(235.0, 154.0, 244.0);
const vec3 BLUE = RGB(83.0, 116.0, 231.0);
const vec3 WGREEN = RGB(216.0, 213.0, 85.0);
const vec3 CGREEN = RGB(117.0, 214.0, 144.0);
const vec3 GRAY = RGB(244.0, 244.0, 244.0);

vec3 band(vec2 pos) {
  float y = abs(pos.y) - 0.0;

  if (y < happy) return YELLOW;
  if (y < happy+angry) return PINK;
  if (y < happy+angry+sad) return BLUE;
  if (y < happy+angry+sad+fearful) return VIOLET;
  if (y < happy+angry+sad+fearful+disgusted) return CGREEN;
  if (y < happy+angry+sad+fearful+disgusted+surprised) return WGREEN;

  return GRAY;
}

void main() {

  //vec2 position = ( gl_FragCoord.xy / resolution.xy );
  vec2 position = (gl_FragCoord.xy / resolution.xy * 1.5) - vec2(0.0, 2.7);
  float X = position.x*20.;
  float Y = position.y*20.;
  float t = time*0.6;
  float o = sin(+cos(t+X/1.)+t+Y/6.-sin(X/(5.+cos(t*.1)-sin(X/10.+Y/10.))));
  //gl_FragColor = vec4( hsv2rgb(vec3( o*2, 1., .5)), 1. );

  gl_FragColor = vec4(band(position + vec2(0., cos(position.x*4. + o + time))), 4.0);
}
```

In order to have a **smoother transition** between each background state, we interpolated the parameters from Face.api that we had previously set to refresh every second.

```
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
        bgShader.setUniform('time', millis() / 1000.0);
 }
}
```

## Coding challenges

 We preferred to stick to **desktop** or **landscape mobile** because on portrait mobile the space was not enough for the experience. Besides the main frameworks and languages as HTML, CSS, p5.js, and socket.io we will use other libraries to achieve our goals, in particular face-api.js.

### Face recognition
The position of the avatar is calculated by the browser of each user, making the site faster.
The position is calculated on the basis of gravity points that apply forces to points with the same feeling.

```
class Player {
   constructor({
     x,
     y,
     feeling,
     id,
   } = {}) {
     this.id = id;
     this.pos = createVector(x, y);
     this.vel = createVector(0, 0);
     this.vel.limit(5);
     this.acc = createVector(0, 0);
     this.feeling = feeling;
     this.feelingValue = 1;

     this.dimensions = {
       h: 0,
       w: 0,
     };
   }

   stop() {
     this.vel.set(0, 0);
   }

   run() {
     // this.attract();
     this.updatePosition();
     this.draw();
   }

   draw() {
     // Se non c'è ancora un feeling associato, non disegnare.
     if (!this.feeling) {
       return;
     }

     push();

     translate(this.pos);

     translate(-this.dimensions.w / 2, -this.dimensions.h / 2);

     const col = palette[this.feeling];

     stroke(col);

     const faceWidth = 120;

     scale(
         faceWidth / this.dimensions.w,
         faceWidth / this.dimensions.w,
     );

     fill('white');
     push();
     this.drawPotato();
     pop();
     noFill();
     // rect(0, 0, this.dimensions.w, this.dimensions.h);
     strokeWeight(5);
     this._drawElement(this.leftEyebrow, false);
     this._drawElement(this.rightEyebrow, false);
     this._drawElement(this.nose, false);
     this._drawElement(this.leftEye);
     this._drawElement(this.rightEye);
     this._drawElement(this.mouth);
     noStroke();

     if (DEBUG_MODE) {
       textAlign(CENTER);
       textSize(40);
       text(this.feeling + ' ' + this.feelingValue.toFixed(2),
           this.dimensions.w / 2, this.dimensions.h + 20);
     }

     pop();
   }

   broadcast() {
     socket.emit('player.updated', this.feelings, this._landmarks,
         this.dimensions);
   }

   /**
    *
    * @param {p5.Vector} force
    */
   applyForce(force) {
     const acceleration = force.div(this.feelingValue);
     this.acc.add(acceleration);
   }

   updatePosition() {
     this.vel.add(this.acc);
     this.vel.limit(4.5);

     this.pos.add(this.vel);
     this.acc.set(0, 0);

     const bounceReduction = .6;

     if (this.pos.x < 0) {
       this.vel.mult(bounceReduction);
       this.vel.reflect(createVector(1, 0));
       this.pos.x = 0;
     } else if (this.pos.x > width) {
       this.vel.mult(bounceReduction);
       this.vel.reflect(createVector(1, 0));
       this.pos.x = width;
     }
     if (this.pos.y < 0) {
       this.vel.mult(bounceReduction);
       this.vel.reflect(createVector(0, 1));
       this.pos.y = 0;
     } else if (this.pos.y > height) {
       this.vel.mult(bounceReduction);
       this.vel.reflect(createVector(0, 1));
       this.pos.y = height;
     }
   }

   _drawElement(points, close = true) {
     for (let i = 0; i < points.length - 1; i++) {
       const pos = points[i];
       const next = points[i + 1];
       line(pos._x, pos._y, next._x, next._y);
     }
     close && line(
         points[0]._x, points[0]._y,
         points[points.length - 1]._x, points[points.length - 1]._y,
     );
   }

   set detection(detection) {
     this.dimensions = {
       h: detection.alignedRect.box._height,
       w: detection.alignedRect.box._width,
     };

     this.landmarks = detection.unshiftedLandmarks;
     this.expressions = detection.expressions;
   }

   set expressions(expressions) {
     this.feelings = expressions;

     this.feeling = '';
     this.feelingValue = 0;
     /**
      * Cerchiamo di diminuire i neutral, favorendo le altre espressioni
      */
     for (const feeling of feelings) {

       const value = feeling === 'neutral' ? expressions[feeling] * .4 : expressions[feeling];

       if (value > this.feelingValue) {
         this.feeling = feeling;
         this.feelingValue = value;
       }
     }
   }

   set landmarks({
     _positions,
   }) {
     this._landmarks = _positions;

     this.jaw = _positions.slice(0, 17);
     this.leftEyebrow = _positions.slice(17, 22);
     this.rightEyebrow = _positions.slice(22, 27);
     this.nose = _positions.slice(27, 36);
     this.leftEye = _positions.slice(36, 42);
     this.rightEye = _positions.slice(42, 48);
     this.mouth = _positions.slice(48, 68);
   }

   drawPotato() {
     // const points = this.jaw;

     const larg = this.dimensions.w;
     const alt = this.dimensions.h;

     push();
     noStroke();
     /**
      * alt/2.5 per centrare un po'
      */
     translate(larg / 2, alt / 2.5);
     scale(1, 1.2);

     const noiseDivider = 3;
     beginShape();
     for (let i = 0; i < 15; i++) {
       const a = TWO_PI * i / 15;
       const noiseX = (noise(a, frameCount / 20) - .5) / noiseDivider;
       const noiseY = (noise(a, frameCount / 20) - .5) / noiseDivider;
       vertex((cos(a) + noiseX) * larg / 2, (sin(a) + noiseY) * alt / 2);
     }
     endShape(CLOSE);
     pop();  
```

### Frag/Glsl
 In order to develop the generative artwork for the background we used this particular add on to p5 that

## Miscellaneus

Heroku: The perfect server turned out to be heroku as it allows you to have a working server directly connected to the github repository facilitating the work and development of the web app.

CSS: for the aspect of button and about

P5.js:

## Team

MOODboard was developed by:
Michele Bruno, Federica Laurencio, Valentina Pallacci, Federico Pozzi


## How to run

Be sure to have node installed: https://nodejs.org/

* install node dependencies: `npm install`
* run local server: `node server.js`
