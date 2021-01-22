/**
 * Questa classe genera i centri di gravità delle emozioni.
 */
class FeelingGravity {
  constructor({feeling}) {
    this.feeling = feeling;
    this.setPosition();
  }

  run() {
    /**
     * The players with same feeling.
     */
    const filteredPlayers = [];

    for (const [, player] of players) {
      player.feeling === this.feeling && filteredPlayers.push(player);
    }

    for (const other of filteredPlayers) {
      /**
       *
       * @type {p5.Vector} force
       */
      const force = p5.Vector.sub(this.pos, other.pos);

      const distance = force.mag();

      if (distance > 10) {
        // Dovrebbe essere distanza alla seconda, ma poi fa movimenti non voluti
        force.setMag(G * other.feelingValue * 40 / distance);
        other.acc.add(force);
      } else other.stop();
    }

    started && this.feeling !== 'neutral' && this.draw();
  }

  draw() {
    push();
    let col = color(palette[this.feeling]);
    fill(col);
    textAlign(CENTER);
    textSize(23);
    text(this.feeling.toUpperCase(), this.pos.x, this.pos.y + 20);
    pop();
  }

  /**
   * Imposta la posizione del centro di gravità.
   *
   * Da richiamare al resize.
   */
  setPosition() {
    let hUnit = height/8;

    switch (this.feeling) {
      case 'neutral':
        this.pos = createVector(4 * width / 8, 4 * hUnit);
        break;
      case 'surprised':
        this.pos = createVector(1 * width / 8, 3 * hUnit);
        break;
      case 'happy':
        this.pos = createVector(4 * width / 8, 1 * hUnit);
        break;
      case 'angry':
        this.pos = createVector(7 * width / 8, 3 * hUnit);
        break;
      case 'disgusted':
        this.pos = createVector(7 * width / 8, 5.5 * hUnit);
        break;
      case 'sad':
        this.pos = createVector(4 * width / 8, 7 * hUnit);
        break;
      case 'fearful':
        this.pos = createVector(1 * width / 8, 5.5 * hUnit);
        break;
      default:
        console.warn(this.feeling + " is not a valid expression.")
        break;
    }
  }
}
