/**
 *
 *
 */
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
    this.attract();
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

    const lerpedColor = lerpColor(
        color('white'), // Colore di partenza, se il valore fosse 0.
        color(col), // Colore se il valore fosse 1.
        this.feelingValue,
    );

    stroke(col);

    const faceWidth = 120;

    scale(
        faceWidth / this.dimensions.w,
        faceWidth / this.dimensions.w,
    );
    // scale(60/this.dimensions.w, this.dimensions.h * 60/ this.dimensions.w);
    // this.drawPhysicViz();
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

  /**
   * @todo capire se serve a qualcosa
   */
  attract() {
    players.forEach((other) => {
      if (other.feeling !== this.feeling || other.id === this.id) {
        return;
      }

      /**
       *
       * @type {p5.Vector} force
       */
      const force = p5.Vector.sub(this.pos, other.pos);

      let distance = force.mag();

      if (distance < 10) return;

      if (distance < 150) distance *= distance;

      /**
       * @todo decidere se lasciare diviso distance^2
       */
      force.setMag(
          G * this.feelingValue * other.feelingValue / pow(distance, 2));

      other.applyForce(force);
    });
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
      scribble.scribbleLine(pos._x, pos._y, next._x, next._y);
    }
    close && scribble.scribbleLine(
        points[0]._x, points[0]._y,
        points[points.length - 1]._x, points[points.length - 1]._y,
    );
  }

  set detection(detection) {
    this.landmarks = detection.unshiftedLandmarks;
    this.expressions = detection.expressions;
  }

  set expressions(expressions) {
    this.feelings = expressions;

    this.feeling = '';
    this.feelingValue = 0;

    for (const [feeling, value] of Object.entries(expressions)) {
      /**
       * Cerchiamo di diminuire i neutral, favorendo le altre espressioni
       */
      const v = feeling === 'neutral' ? value * .6 : value;

      if (v > this.feelingValue) {
        this.feeling = feeling;
        this.feelingValue = value;
      }
    }

    if (DEBUG_MODE) {
      DEBUG.expressions.push([this.feeling, this.feelingValue, expressions]);
    }
  }

  set landmarks({
    _positions,
    _imgDims: {
      _height,
      _width,
    },
  }) {
    this._landmarks = _positions;
    this.dimensions = {
      h: _height,
      w: _width,
    };

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

    beginShape();

    const larg = this.dimensions.w;
    const alt = this.dimensions.h;
    const noseX = this.nose[6]._x;
    const noseY = this.nose[6]._y;
    fill('white');
    noStroke();
    ellipseMode(CENTER);

    ellipse( larg/2, alt/2-10, larg+10, alt+10);

    // push();
    // translate(larg/2, alt/2);
    // beginShape();
    // for (let i = 0; i < 60; i++) {
    //   const a = TWO_PI * i / 60;
    //   vertex(cos(a) * larg /2 + noise(i/100), sin(a) * alt /2 * noise(i/100) );
    // }
    //
    // endShape();
    // pop();


    // for (var i = 0; i < points.length; i++) {


    // const point = points[i];
    //
    // let mult = 1;
    //       if (point._x < noseX) {
    //         mult = -1
    //       }
    //       vertex(point._x + noise(i/10, frameCount/100) * 70 * mult, point._y + noise(i/10, frameCount/100))
    //
    //     }

    endShape();
  }
}
