import GamePlay from './GamePlay';
import thems from './themes';
import PositionedCharacter from './PositionedCharacter';
import { generateTeam, generatePosition } from './generators';
import GameState from './GameState';
import {
  getPlayerType, getPlayerTypeName, getEnemyType,
  getEnemyTypeName, convertCoordinates,
} from './utils';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.gameState = new GameState();
    this.level = 1;
  }

  canIDo(index, action) {
    const { chars } = this.gameState;
    if (!this.currentIndex && this.currentIndex !== 0) {
      return false;
    }
    const charIndex = chars.findIndex(
      (e) => e.position === this.currentIndex,
    );
    const charWithPosition = chars[charIndex];
    const charPosition = convertCoordinates(charWithPosition.position);
    const cellPosition = convertCoordinates(index);

    const { attackRange } = charWithPosition.character;
    const distance = charWithPosition.character.movement;
    const distanceX = Math.abs(charPosition.x - cellPosition.x);
    const distanceY = Math.abs(charPosition.y - cellPosition.y);

    const inRange = distanceX <= attackRange && distanceY <= attackRange;
    const isAttack = action === 'attack';
    if (isAttack && inRange) {
      return true;
    }
    const inDistance = distanceX <= distance && distanceY <= distance;
    const instraight = distanceX === 0 || distanceY === 0;
    const inDiagonal = distanceX === distanceY;
    const isМovement = action === 'go';
    if (isМovement && inDistance && (instraight || inDiagonal)) {
      return true;
    }
    return false;
  }

  init() {
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));
    this.gamePlay.addSaveGameListener(this.onSaveGameClick.bind(this));
    this.gamePlay.addLoadGameListener(this.onLoadGameClick.bind(this));
    this.gameState.playerTurn = true;
    this.gamePlay.drawUi(thems[this.level]);
    this.gamePlay.redrawPositions(this.gameState.chars);
  }

  onSaveGameClick() {
    this.stateService.save(this.gameState);
  }

  onLoadGameClick() {
    const state = this.stateService.load();
    this.gameState.playerTurn = true;
    this.currentIndex = null;
    if (!state) {
      return;
    }
    this.gameState.record = state.record;
    if (!state.chars) {
      return;
    }
    this.gameState.chars = [];
    this.gameState.level = state.level;
    this.level = this.gameState.level;
    this.gameState.score = state.score;
    state.chars.forEach((elem) => {
      const {
        type, level, health, attack, defence,
      } = elem.character;
      const { position } = elem;
      const typeName = [...getPlayerTypeName(), ...getEnemyTypeName()];
      const ind = typeName.findIndex((e) => e === type);
      const Charclass = [...getPlayerType(), ...getEnemyType()];
      const newCharacter = new Charclass[ind](level);
      const char = { character: newCharacter, position };
      char.character.health = health;
      char.character.attack = attack;
      char.character.defence = defence;
      this.gameState.from(char);
    });
    this.gamePlay.drawUi(thems[this.level]);
    this.gamePlay.redrawPositions(this.gameState.chars);
  }

  onNewGameClick() {
    this.toDefault();
    this.init();
    this.gameState.score = 0;
    this.level = 1;
    this.gameState.chars = [];
    this.playerTeam = generateTeam(getPlayerType(), this.level, 2);
    this.playerTeam.forEach((char) => {
      const generator = generatePosition('player', this.gameState);
      const generatorValue = generator.next().value;
      const obj = new PositionedCharacter(char, generatorValue);
      this.gameState.from(obj);
    });
    this.enemyTeam = generateTeam(getEnemyType(), this.level, 2);
    this.enemyTeam.forEach((char) => {
      const generator = generatePosition('enemy', this.gameState);
      const generatorValue = generator.next().value;
      const obj = new PositionedCharacter(char, generatorValue);
      this.gameState.from(obj);
    });
    this.gamePlay.drawUi(thems[this.level]);
    this.gamePlay.redrawPositions(this.gameState.chars);
    this.gameState.playerTurn = true;
    this.gameState.level = 1;
  }

  async attack(char, index, charInd) {
    const character = char;
    const { chars } = this.gameState;
    const currenCharInd = chars.findIndex(
      (e) => e.position === this.currentIndex,
    );
    const currentChar = chars[currenCharInd].character;
    const currentDamage = currentChar.attack - char.defence;
    const maxDamage = currentChar.attack * 0.1;
    const damage = Math.max(currentDamage, maxDamage);
    const formattedDamage = damage.toFixed();
    character.health -= formattedDamage;

    await this.gamePlay.showDamage(index, formattedDamage);
    this.gamePlay.redrawPositions(chars);
    this.gamePlay.deselectCell(index);

    if (character.health <= 0) {
      chars.splice(charInd, 1);
      this.gamePlay.redrawPositions(chars);
    }

    const anyEnemy = chars.find((elem) => {
      const enemyTypeName = getEnemyTypeName();
      return enemyTypeName.includes(elem.character.type);
    });
    const isNoEnemies = anyEnemy === undefined;

    if (isNoEnemies) {
      this.endOfRound(chars);
    }
    if (this.currentIndex) {
      this.gamePlay.deselectCell(this.currentIndex);
    }
    this.currentIndex = null;
    this.enemyTurn();
  }

  go(index) {
    const CurrentCharInd = this.gameState.chars
      .findIndex((e) => e.position === this.currentIndex);
    this.gameState.chars[CurrentCharInd].position = index;
    this.gamePlay.deselectCell(index);
    this.gamePlay.deselectCell(this.currentIndex);
    this.currentIndex = null;
    this.gamePlay.redrawPositions(this.gameState.chars);
    this.enemyTurn();
  }

  endOfRound(chars) {
    const isLastLevel = this.level === 4;
    this.checkRecord();
    if (isLastLevel) {
      chars.forEach((elem) => {
        (this.gameState.score += elem.character.health);
      });
      this.stop = true;
      GamePlay.showMessage(`Ты выиграл! Сыграем еще? Твой счет:${this.gameState.score}. Твой рекорд:${this.gameState.record}`);
      this.onNewGameClick();
      return;
    }
    this.levelUpGame();
    GamePlay.showMessage(`Еще раунд? Твой счет:${this.gameState.score}. Твой рекорд:${this.gameState.record}`);
  }

  onCellClick(index) {
    const { chars } = this.gameState;
    const charInd = chars.findIndex((e) => e.position === index);

    if (this.gameState.playerTurn !== true || chars.length === 0) {
      return;
    }

    const isCharacterSelected = this.currentIndex !== null;
    const isCharInCell = charInd !== -1;
    let isPlayerInCell = false;
    let char = null;
    if (isCharInCell) {
      char = chars[charInd].character;
      isPlayerInCell = getPlayerTypeName().includes(char.type);
    }
    const isEnemyInCell = isCharInCell && !isPlayerInCell;

    if (isCharacterSelected && isPlayerInCell) {
      this.gamePlay.deselectCell(this.currentIndex);
      this.gamePlay.selectCell(index);
      this.currentIndex = index;
      return;
    }
    if (!isCharacterSelected && isPlayerInCell) {
      this.gamePlay.selectCell(index);
      this.currentIndex = index;
    }

    const isAttack = isCharacterSelected && isEnemyInCell;
    if (isAttack && this.canIDo(index, 'attack')) {
      this.attack(char, index, charInd);
      return;
    }
    if (isAttack && !this.canIDo(index, 'attack')) {
      GamePlay.showError('Слишком далеко для атаки!');
      return;
    }

    const isGo = isCharacterSelected && !isCharInCell;
    if (isGo && this.canIDo(index, 'go')) {
      this.go(index);
    }
  }

  onCellEnter(index) {
    const { chars } = this.gameState;
    const charInd = chars.findIndex((e) => e.position === index);
    const isCharInCell = charInd !== -1;
    let isPlayerInCell = false;
    let char = null;

    if (isCharInCell) {
      char = chars[charInd].character;
      isPlayerInCell = getPlayerTypeName().includes(char.type);
    }
    const isEnemyInCell = isCharInCell && !isPlayerInCell;

    if (this.gameState.playerTurn === false) {
      return;
    }

    if (isCharInCell) {
      char = chars[charInd].character;
      this.gamePlay.showCellTooltip(
        `🎖 ${char.level} ⚔ ${char.attack} 🛡 ${char.defence} ❤ ${char.health}`,
        index,
      );
    }

    if (isCharInCell && isPlayerInCell) {
      this.gamePlay.setCursor('pointer');
      return;
    }

    const iCanAttack = this.canIDo(index, 'attack');
    if (isEnemyInCell && iCanAttack) {
      this.gamePlay.setCursor('crosshair');
      this.gamePlay.selectCell(index, 'red');
      return;
    }
    if (isEnemyInCell && !iCanAttack) {
      this.gamePlay.setCursor('not-allowed');
      return;
    }

    const iCanGo = this.canIDo(index, 'go');
    if (!isCharInCell && iCanGo) {
      this.gamePlay.setCursor('pointer');
      this.gamePlay.selectCell(index, 'green');
      return;
    }
    this.gamePlay.setCursor('auto');
  }

  onCellLeave(index) {
    if (!(index === this.currentIndex)) {
      this.gamePlay.deselectCell(index);
    }
  }

  toDefault() {
    this.gameState.chars = [];
    this.currentIndex = null;
    if (this.currentIndex || this.currentIndex === 0) {
      this.gamePlay.deselectCell(this.currentIndex);
    }
    this.gamePlay.cellClickListeners = [];
    this.gamePlay.cellEnterListeners = [];
    this.gamePlay.cellLeaveListeners = [];
    this.gamePlay.newGameListeners = [];
    this.gamePlay.saveGameListeners = [];
    this.gamePlay.loadGameListeners = [];
  }

  addTeam(team, char) {
    const generator = generatePosition(team, this.gameState);
    const generatorValue = generator.next().value;
    const obj = new PositionedCharacter(char, generatorValue);
    this.gameState.from(obj);
  }

  levelUpGame() {
    const { chars } = this.gameState;
    this.stop = true;
    // eslint-disable-next-line no-return-assign
    chars.forEach((elem) => {
      this.gameState.score += elem.character.health;
    });
    this.checkRecord();
    chars.forEach((char) => {
      char.character.levelUp();
      // eslint-disable-next-line no-param-reassign
      const getPosition = generatePosition('player', this.gameState);
      // eslint-disable-next-line no-param-reassign
      char.position = getPosition.next().value;
    });
    const numberOfCharsPl = Math.min(this.level, 2);
    const playerTeam = generateTeam(getPlayerType(),
      this.level, numberOfCharsPl);
    playerTeam.forEach((char) => {
      this.addTeam('player', char);
    });
    this.level += 1;
    const numberOfCharsEn = chars.length;
    const enemyTeam = generateTeam(getEnemyType(),
      this.level, numberOfCharsEn);
    enemyTeam.forEach((char) => {
      this.addTeam('enemy', char);
    });
    this.gamePlay.drawUi(thems[this.level]);
    this.gamePlay.redrawPositions(chars);
    this.gameState.level = this.level;
  }

  tryEnemyAttack(currentEnemy, teamPlayer) {
    const { chars } = this.gameState;
    for (let j = 0; j < teamPlayer.length; j += 1) {
      const currentPlayer = teamPlayer[j];
      const plIndex = currentPlayer.position;
      this.currentIndex = currentEnemy.position;
      if (!this.canIDo(plIndex, 'attack')) {
      // eslint-disable-next-line no-continue
        continue;
      }
      const { attack, defence } = currentEnemy.character;

      const currentDamage = attack - defence;
      const maxDamage = attack * 0.1;
      const damage = Math.max(currentDamage, maxDamage);
      const formattedDamage = damage.toFixed();
      currentPlayer.character.health -= formattedDamage;
      // eslint-disable-next-line no-await-in-loop
      this.gamePlay.showDamage(plIndex, formattedDamage);

      this.doTurn = true;
      if (teamPlayer[j].character.health >= 0) {
        break;
      }
      const charInd = chars.findIndex(
        (elem) => elem.position === plIndex,
      );
      chars.splice(charInd, 1);
      this.gamePlay.redrawPositions(chars);
      this.currentIndex = null;

      const playerTypeName = getPlayerTypeName();
      const playerChar = chars.findIndex(
        (e) => playerTypeName.includes(e.character.type),
      );
      const isNoPlayerChar = playerChar === -1;
      if (isNoPlayerChar) {
        GamePlay.showMessage('Ты проиграл');
        this.onNewGameClick();
      }
    }
  }

  enemyMoveOn(currentEnemy) {
    const { chars } = this.gameState;
    const enemy = currentEnemy;
    const { movement } = enemy.character;
    let newPos;
    let charInCell;
    do {
      const coordinates = convertCoordinates(this.currentIndex);
      const randomStepX = Math.floor(Math.random() * movement);
      const stepX = Math.max(randomStepX, 1);
      coordinates.x = Math.max(coordinates.x - stepX, 0);
      const min = Math.ceil(-movement);
      const max = Math.floor(movement);
      const stepY = Math.random() * (max - min + 1);
      coordinates.y += Math.floor(stepY) + min;
      if (coordinates.y > 7) {
        coordinates.y = 7;
      }
      if (coordinates.y < 0) {
        coordinates.y = 0;
      }
      newPos = (coordinates.y) * 8 + (coordinates.x);
      this.doTurn = true;
      // eslint-disable-next-line no-loop-func
      charInCell = chars.findIndex((e) => e.position === newPos);
    } while (charInCell !== -1);
    enemy.position = newPos;
    this.currentIndex = null;
    this.gamePlay.redrawPositions(chars);
  }

  enemyTurn() {
    if (this.stop === true) {
      this.stop = false;
      return;
    }

    const { chars } = this.gameState;
    this.currentIndex = null;
    const teamEnemy = [];
    const teamPlayer = [];
    chars.forEach((elem) => {
      if (getEnemyTypeName().includes(elem.character.type)) {
        teamEnemy.push(elem);
      } else {
        teamPlayer.push(elem);
      }
    });

    this.doTurn = false;
    for (let i = 0; i < teamEnemy.length; i += 1) {
      this.tryEnemyAttack(teamEnemy[i], teamPlayer);
      if (this.doTurn === true) {
        break;
      }
    }
    if (this.doTurn === true) {
      this.currentIndex = null;
      return;
    }

    for (let i = 0; i < teamEnemy.length; i += 1) {
      this.currentIndex = teamEnemy[i].position;
      this.enemyMoveOn(teamEnemy[i]);
      if (this.doTurn === true) {
        this.gameState.playerTurn = true;
        break;
      }
    }
  }

  checkRecord() {
    const state = this.stateService.load();
    this.gameState.record = state.record;
    if (this.gameState.score > state.record) {
      this.gameState.record = this.gameState.score;
      state.record = this.gameState.score;
      this.stateService.save(state);
    }
  }
}
