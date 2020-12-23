/**
 * Questa classe genera i centri di gravità delle emozioni.
 */
class Focus {
  constructor({feeling}) {
    this.feeling = feeling;
    this.setPosition();
  }

  run() {
    /**
     * The players with same feeling.
     */
    const filteredPlayers = players.filter(function(p) {
      return p.feeling === this.feeling;
    }, this);

    /**
     * Apply force to each player
     */
    for (const filteredPlayer of filteredPlayers) {
      const distance = dist(filteredPlayer.pos.x, filteredPlayer.pos.y,
          this.pos.x, this.pos.y);
      if (distance > 10) {
        const force = p5.Vector.sub(this.pos, filteredPlayer.pos);
        filteredPlayer.acc.add(force);
      } else filteredPlayer.stop();
    }
  }

  draw() {
    push();
    fill(palette[this.feeling]);
    ellipse(this.pos.x, this.pos.y, 20);
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
