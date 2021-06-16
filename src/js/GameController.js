import GamePlay from './GamePlay';
import thems from './themes';
import PositionedCharacter from './PositionedCharacter';
import Bowman from './caracters/bowman';
import Swordsman from './caracters/swordsman';
import Magician from './caracters/magician';
import Daemon from './caracters/daemon';
import Undead from './caracters/undead';
import Vampire from './caracters/vampire';
import { generateTeam, generatePosition } from './generators';
import GameState from './GameState';

function getPlayerType() {
  return [Swordsman, Bowman, Magician];
}

function getPlayerTypeName() {
  return ['swordsman', 'bowman', 'magician'];
}

function getEnemyType() {
  return [Daemon, Undead, Vampire];
}

function getEnemyTypeName() {
  return ['daemon', 'undead', 'vampire'];
}

function convertCoordinates(index) {
  return {
    x: index % 8,
    y: ((index - (index % 8)) / 8),
  };
}

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.gameState = new GameState();
    this.level = 1;
  }

  canIDo(index, action) {
    const charInd = this.gameState.chars.findIndex((elem) => elem.position === this.currentIndex);
    const charPos = convertCoordinates(this.gameState.chars[charInd].position);
    const cellPos = convertCoordinates(index);
    const { attackRange } = this.gameState.chars[charInd].character;
    const distance = this.gameState.chars[charInd].character.movement;
    const distx = Math.abs(charPos.x - cellPos.x);
    const disty = Math.abs(charPos.y - cellPos.y);
    if ((action === 'attack') && distx <= attackRange && disty <= attackRange) {
      return true;
    }
    const distanceСtrl = distx === disty || distx === 0 || disty === 0;
    if (action === 'go' && distx <= distance && disty <= distance && distanceСtrl) {
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
      const ind = typeName.findIndex((element) => element === type);
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
    const currenCharInd = this.gameState.chars
      .findIndex((elem) => elem.position === this.currentIndex);
    const currentChar = this.gameState.chars[currenCharInd].character;
    const damage = Math.max(currentChar.attack - char.defence,
      currentChar.attack * 0.1).toFixed();
    character.health -= damage;
    await this.gamePlay.showDamage(index, damage);
    this.gamePlay.redrawPositions(this.gameState.chars);
    this.gamePlay.deselectCell(index);

    if (character.health <= 0) {
      this.gameState.chars.splice(charInd, 1);
      this.gamePlay.redrawPositions(this.gameState.chars);
    }

    if (this.gameState.chars.findIndex(
      (elem) => getEnemyTypeName().includes(elem.character.type),
    ) === -1) {
      if (this.level === 4) {
        this.gameState.chars.forEach((elem) => {
          (this.gameState.score += elem.character.health);
        });
        this.saveRecord();
        this.stop = true;
        GamePlay.showMessage(`Ты выиграл! Сыграем еще? Твой счет:${this.gameState.score} Твой рекорд:${this.gameState.record}`);
        this.onNewGameClick();
        return;
      }
      this.levelUpGame();
      GamePlay.showMessage(`Еще раунд? Твой счет:${this.gameState.score} Твой рекорд:${this.gameState.record}`);
    }
    if (this.currentIndex) {
      this.gamePlay.deselectCell(this.currentIndex);
    }
    this.currentIndex = null;
    this.enemyTurn();
  }

  go(index) {
    const CurrentCharInd = this.gameState.chars
      .findIndex((elem) => elem.position === this.currentIndex);
    this.gameState.chars[CurrentCharInd].position = index;
    this.gamePlay.deselectCell(index);
    this.gamePlay.deselectCell(this.currentIndex);
    this.currentIndex = null;
    this.gamePlay.redrawPositions(this.gameState.chars);
    this.enemyTurn();
  }

  onCellClick(index) {
    if (this.gameState.playerTurn !== true) {
      return;
    }
    const charInd = this.gameState.chars.findIndex((elem) => elem.position === index);
    if (this.currentIndex || this.currentIndex === 0) {
      if (charInd !== -1) {
        const char = this.gameState.chars[charInd].character;
        if (getPlayerTypeName().includes(char.type)) {
          if (this.gamePlay) {
            this.gamePlay.deselectCell(this.currentIndex);
            this.gamePlay.selectCell(index);
          }
          this.currentIndex = index;
          return;
        }
        if (this.canIDo(index, 'attack')) {
          this.attack(char, index, charInd);
          return;
        }
        GamePlay.showError('Слишком далеко для атаки!');
        return;
      }
      if (this.canIDo(index, 'go')) {
        this.go(index);
      }
      return;
    }
    if (charInd !== -1) {
      const char = this.gameState.chars[charInd].character;
      if (getPlayerTypeName().includes(char.type)) {
        this.gamePlay.selectCell(index);
        this.currentIndex = index;
      }
    }
  }

  onCellEnter(index) {
    const charInd = this.gameState.chars.findIndex((elem) => elem.position === index);
    if (charInd !== -1) {
      const char = this.gameState.chars[charInd].character;
      this.gamePlay.showCellTooltip(`🎖 ${char.level} ⚔ ${char.attack} 🛡 ${char.defence} ❤ ${char.health}`, index);
      if (this.gameState.playerTurn === true
        && getPlayerTypeName().includes(char.type)
      ) {
        this.gamePlay.setCursor('pointer');
        return;
      }
      if (this.currentIndex || this.currentIndex === 0) {
        if (this.canIDo(index, 'attack')) {
          this.gamePlay.setCursor('crosshair');
          this.gamePlay.selectCell(index, 'red');
          return;
        }
        this.gamePlay.setCursor('not-allowed');
        return;
      }
      this.gamePlay.setCursor('not-allowed');
      return;
    }
    if (this.currentIndex || this.currentIndex === 0) {
      if (this.canIDo(index, 'go')) {
        this.gamePlay.setCursor('pointer');
        this.gamePlay.selectCell(index, 'green');
        return;
      }
      this.gamePlay.setCursor('auto');
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
    this.stop = true;
    // eslint-disable-next-line no-return-assign
    this.gameState.chars.forEach((elem) => this.gameState.score += elem.character.health);
    this.saveRecord();
    this.gameState.chars.forEach((char) => {
      char.character.levelUp();
      // eslint-disable-next-line no-param-reassign
      const getPosition = generatePosition('player', this.gameState);
      // eslint-disable-next-line no-param-reassign
      char.position = getPosition.next().value;
    });
    const numberOfCharsPl = Math.min(this.level, 2);
    const playerTeam = generateTeam(getPlayerType(), this.level, numberOfCharsPl);
    playerTeam.forEach((char) => {
      this.addTeam('player', char);
    });
    this.level += 1;
    const numberOfCharsEn = this.gameState.chars.length;
    const enemyTeam = generateTeam(getEnemyType(), this.level, numberOfCharsEn);
    enemyTeam.forEach((char) => {
      this.addTeam('enemy', char);
    });
    this.gamePlay.drawUi(thems[this.level]);
    this.gamePlay.redrawPositions(this.gameState.chars);
    this.gameState.level = this.level;
  }

  async enemyTurn() {
    if (this.stop === true) {
      this.stop = false;
      return;
    }
    this.currentIndex = null;
    const teamEnemy = [];
    const teamPlayer = [];
    this.gameState.chars.forEach((elem) => {
      if (getEnemyTypeName().includes(elem.character.type)) {
        teamEnemy.push(elem);
      } else {
        teamPlayer.push(elem);
      }
    });
    let doTurn = false;
    for (let i = 0; i < teamEnemy.length; i += 1) {
      for (let j = 0; j < teamPlayer.length; j += 1) {
        const plIndex = teamPlayer[j].position;
        this.currentIndex = teamEnemy[i].position;
        if (!this.canIDo(plIndex, 'attack')) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const damagePreliminary = teamEnemy[i].character.attack - teamPlayer[j].character.defence;
        const damage = Math.max(damagePreliminary, teamEnemy[i].character.attack * 0.1).toFixed();
        teamPlayer[j].character.health -= damage;
        // eslint-disable-next-line no-await-in-loop
        await this.gamePlay.showDamage(plIndex, damage);
        doTurn = true;
        if (teamPlayer[j].character.health >= 0) {
          break;
        }
        const charInd = this.gameState.chars.findIndex((elem) => elem.position === plIndex);
        this.gameState.chars.splice(charInd, 1);
        this.gamePlay.redrawPositions(this.gameState.chars);
        this.currentIndex = null;
        if (this.gameState.chars.findIndex((elem) => getPlayerTypeName()
          .includes(elem.character.type)) === -1) {
          GamePlay.showMessage('Ты проиграл');
          this.onNewGameClick();
        }
        break;
      }
      if (doTurn === true) {
        break;
      }
    }
    if (doTurn === false) {
      for (let i = 0; i < teamEnemy.length; i += 1) {
        this.currentIndex = teamEnemy[i].position;
        let newPos;
        do {
          const coordinates = convertCoordinates(this.currentIndex);
          coordinates.x = Math.max(coordinates.x - Math.max(
            Math.floor(Math.random() * teamEnemy[i].character.movement), 1,
          ), 0);
          const min = Math.ceil(-teamEnemy[i].character.movement);
          const max = Math.floor(teamEnemy[i].character.movement);
          coordinates.y += Math.floor(Math.random() * (max - min + 1)) + min;
          if (coordinates.y > 7) {
            coordinates.y = 7;
          }
          if (coordinates.y < 0) {
            coordinates.y = 0;
          }
          newPos = (coordinates.y) * 8 + (coordinates.x);
          doTurn = true;
        // eslint-disable-next-line no-loop-func
        } while (this.gameState.chars.findIndex((elem) => elem.position === newPos) !== -1);
        teamEnemy[i].position = newPos;
        this.gamePlay.redrawPositions(this.gameState.chars);
        if (doTurn === true) {
          this.gameState.playerTurn = true;
          break;
        }
      }
    }
    this.count += 1;
    this.currentIndex = null;
  }

  saveRecord() {
    const state = this.stateService.load();
    if (this.gameState.score > state.record) {
      this.gameState.record = this.gameState.score;
      state.record = this.gameState.score;
      this.stateService.save(state);
    }
  }
}
