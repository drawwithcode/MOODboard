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

    for (const feeling of feelings) {
      const value = expressions[feeling];
      /**
       * Cerchiamo di diminuire i neutral, favorendo le altre espressioni
       */
      const v = feeling === 'neutral' ? value * .6 : value;

      if (v > this.feelingValue) {
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
      const noiseX = (noise(a, frameCount/20) - .5) / noiseDivider;
      const noiseY = (noise(a, frameCount/20) - .5) / noiseDivider;
      vertex((cos(a) + noiseX) * larg / 2, (sin(a) + noiseY) * alt / 2);
    }
    endShape(CLOSE);
    pop();

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
  }
}
