export default class GameState {
  constructor() {
    this.chars = [];
    this.level = 1;
    this.score = 0;
    this.record = 0;
    this.playerTurn = null;
  }

  from(object) {
    this.chars.push({
      character: object.character,
      position: object.position,
    });
  }
}
