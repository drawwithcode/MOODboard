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

    this.draw();
  }

  draw() {
    push();
    color(0, 0, 0, .5);
    textAlign(CENTER);
    textSize(30);
    text(this.feeling.toUpperCase(), this.pos.x, this.pos.y + 20);
    pop();
  }

  /**
   * Imposta la posizione del centro di gravità.
   *
   * Da richiamare al resize.
   */
  setPosition() {
    switch (this.feeling) {
      case 'neutral':
        this.pos = createVector(4 * width / 8, 4 * height / 8);
        break;
      case 'happy':
        this.pos = createVector(1 * width / 8, 2 * height / 8);
        break;
      case 'sad':
        this.pos = createVector(4 * width / 8, 1 * height / 8);
        break;
      case 'angry':
        this.pos = createVector(7 * width / 8, 2 * height / 8);
        break;
      case 'fearful':
        this.pos = createVector(7 * width / 8, 6 * height / 8);
        break;
      case 'disgusted':
        this.pos = createVector(4 * width / 8, 7 * height / 8);
        break;
      case 'surprised':
        this.pos = createVector(1 * width / 8, 6 * height / 8);
        break;
    }
  }
}
