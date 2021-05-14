export default class GameState {
  constructor() {
    this.chars = [];
    this.level = 1;
    this.score = null;
    this.record = null;
    this.playerTurn = true;
  }

  from(object) {
    this.chars.push({
      character: object.character,
      position: object.position,
    });
    // TODO: create object
    // return null;
  }
}
