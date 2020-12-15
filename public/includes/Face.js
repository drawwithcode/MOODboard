class Face {
  constructor() {

  }

  set expressions(expressions) {
    // const {angry, disgusted, fearful, happy, neutral, sad, surprised} = expressions;
    this.feeling = '';
    this.feelingValue = 0;

    for (const [feeling, value] of Object.entries(expressions)) {
      if (value > this.feelingValue) {
        this.feeling = feeling;
        this.feelingValue = value;
      }
    }
  }

  set landmarks({_positions}) {
    this.shape = _positions.slice(0, 17);
    this.leftEyebrow = _positions.slice(17, 22);
    this.rightEyebrow = _positions.slice(22, 27);
    this.nose = _positions.slice(27, 36);
    this.leftEye = _positions.slice(36, 42);
    this.rightEye = _positions.slice(42, 48);
    this.mouth = _positions.slice(48, 68);
  }

  draw() {
    this._drawElement(this.shape, false);
    this._drawElement(this.leftEyebrow, false);
    this._drawElement(this.rightEyebrow, false);
    this._drawElement(this.nose, false);
    this._drawElement(this.leftEye);
    this._drawElement(this.rightEye);
    this._drawElement(this.mouth);
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
}

