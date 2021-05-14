import GamePlay from './GamePlay';
import thems from './themes';
import PositionedCharacter from './PositionedCharacter';
// import Team from './Team';
import Bowman from './caracters/bowman';
import Swordsman from './caracters/swordsman';
import Magician from './caracters/magician';
import Daemon from './caracters/daemon';
import Undead from './caracters/undead';
import Vampire from './caracters/vampire';
import { generateTeam, generatePosition } from './generators';
import GameState from './GameState';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.gameState = new GameState();
    this.level = 1;
  }

  getPlayerType() {
    return [Swordsman, Bowman, Magician];
  }

  getPlayerTypeName() {
    return ['swordsman', 'bowman', 'magician'];
  }

  getEnemyType() {
    return [Daemon, Undead, Vampire];
  }

  getEnemyTypeName() {
    return ['daemon', 'undead', 'vampire'];
  }

  canIDo(index, action) {
    const charInd = this.gameState.chars.findIndex((elem) => elem.position === this.currentIndex);
    const charPos = this.convertCoordinates(this.gameState.chars[charInd].position);
    const cellPos = this.convertCoordinates(index);
    const { attackRange } = this.gameState.chars[charInd].character;
    const distance = this.gameState.chars[charInd].character.movement;
    const distx = Math.abs(charPos.x - cellPos.x);
    const disty = Math.abs(charPos.y - cellPos.y);
    if ((action === 'attack') && distx <= attackRange && disty <= attackRange) {
      return true;
    }
    if (action === 'go' && distx <= distance && disty <= distance && (distx === disty || distx === 0 || disty === 0)) {
      return true;
    }
    return false;
  }

  convertCoordinates(index) {
    return {
      x: index % 8,
      y: ((index - (index % 8)) / 8),
    };
  }

  init() {
    this.gamePlay.drawUi(thems[1]);
    this.gamePlay.addNewGameListener(this.onNewGameClick.bind(this));
    this.gamePlay.addCellEnterListener(this.onCellEnter.bind(this));
    this.gamePlay.addCellLeaveListener(this.onCellLeave.bind(this));
    this.gamePlay.addCellClickListener(this.onCellClick.bind(this));

    const state = this.stateService.load();

    if (state) {
      //    this.gameState.record = state.record;
      this.gameState.chars = state.chars;
      this.gamePlay.redrawPositions(this.gameState.chars);
    }
    // TODO: add event listeners to gamePlay events

    // this.gamePlay.addSaveGameListener(
    //     console.log('SaveGame'));

    // this.gamePlay.addLoadGameListener(
    //     console.log('LoadGame'));

    // TODO: load saved stated from stateService
  }

  onNewGameClick() {
    this.toDefault();
    this.init();
    this.level = 1;
    this.gameState.chars = [];
    this.playerTeam = generateTeam(this.getPlayerType(), this.level, 2);
    this.playerTeam.forEach((char) => {
      const generator = generatePosition('player');
      const obj = new PositionedCharacter(char, generator.next().value);
      // teamArr.push(obj);
      this.gameState.from(obj);
    });

    this.enemyTeam = generateTeam(this.getEnemyType(), this.level, 2);
    this.enemyTeam.forEach((char) => {
      const generator = generatePosition('enemy');
      const obj = new PositionedCharacter(char, generator.next().value);
      // teamArr.push(obj);
      this.gameState.from(obj);
    });
    this.gamePlay.redrawPositions(this.gameState.chars);
    // this.gameState.chars = teamArr;
    this.gameState.playerTurn = true;
    this.stateService.save(this.gameState);
  }

  async onCellClick(index) {
    if (event.target.classList.contains('character')) {
      const charInd = this.gameState.chars.findIndex((elem) => elem.position === index);
      const char = this.gameState.chars[charInd].character;

      if ((this.gameState.playerTurn === true
      && this.getPlayerTypeName().includes(char.type))
      ) {
        if (this.currentIndex || this.currentIndex === 0) {
          this.gamePlay.deselectCell(this.currentIndex);
        }
        this.gamePlay.selectCell(index);
        this.currentIndex = index;
      } else if (!(this.currentIndex || this.currentIndex === 0)) {
        GamePlay.showError('Выбери персонажа из своей команды!');
      } else if (this.canIDo(index, 'attack')) {
        const currenCharInd = this.gameState.chars.findIndex((elem) => elem.position === this.currentIndex);
        const currentChar = this.gameState.chars[currenCharInd].character;
        const domage = Math.max(currentChar.attack - char.defence, currentChar.attack * 0.1).toFixed();
        char.health -= domage;
        await this.gamePlay.showDamage(index, domage);
        if (char.health < 0) {
          this.gameState.chars.splice(charInd, 1);
          this.gamePlay.deselectCell(index);

          if (this.gameState.chars.findIndex((elem) => this.getPlayerTypeName().includes(elem.character.type)) === -1) {
            GamePlay.showMessage('Ты проиграл');
          }
          if (this.gameState.chars.findIndex((elem) => this.getEnemyTypeName().includes(elem.character.type)) === -1) {
            if (this.level === 4) {
              this.toDefault();
              this.onNewGameClick();
              GamePlay.showMessage('Ты выиграл');
            } else {
              GamePlay.showMessage('Еще раунд?');
              console.log(this.level);
              this.levelUpGame();
            }
          }
        }

        this.gamePlay.deselectCell(this.currentIndex);
        this.currentIndex = null;
        this.gamePlay.redrawPositions(this.gameState.chars);
        this.stateService.save(this.gameState);
      } else GamePlay.showError('Слишком далеко для атаки!');
    } else if (this.currentIndex || this.currentIndex === 0) {
      if (this.canIDo(index, 'go')) {
        const charInd = this.gameState.chars.findIndex((elem) => elem.position === this.currentIndex);
        this.gameState.chars[charInd].position = index;
        this.gamePlay.deselectCell(this.currentIndex);
        this.currentIndex = null;
        this.gamePlay.redrawPositions(this.gameState.chars);
      }
    }
  }

  onCellEnter(index) {
    const charInd = undefined;
    const char = undefined;

    if (event.target.querySelector('.character')) {
      const charInd = this.gameState.chars.findIndex((elem) => elem.position === index);
      const char = this.gameState.chars[charInd].character;
      this.gamePlay.showCellTooltip(`🎖 ${char.level} ⚔ ${char.attack} 🛡 ${char.defence} ❤ ${char.health}`, index);

      if ((this.gameState.playerTurn === true
        && this.getPlayerTypeName().includes(char.type))
      ) {
        this.gamePlay.setCursor('pointer');
      } else if (this.currentIndex || this.currentIndex === 0) {
        if (this.canIDo(index, 'attack')) {
          this.gamePlay.setCursor('crosshair');
          this.gamePlay.selectCell(index, 'red');
        } else {
          this.gamePlay.setCursor('not-allowed');
        }
      } else {
        this.gamePlay.setCursor('not-allowed');
      }
    } else if (this.currentIndex || this.currentIndex === 0) {
      if (this.canIDo(index, 'go')) {
        this.gamePlay.setCursor('pointer');
        this.gamePlay.selectCell(index, 'green');
      } else {
        this.gamePlay.setCursor('auto');
      }
    } else {
      this.gamePlay.setCursor('auto');
    }
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

  levelUpGame() {
    this.level += 1;
    this.gameState.chars.forEach((char) => {
      char.character.levelUp();
      char.position = generatePosition('player').next().value;
    });

    if (this.level === 2) {
      const playerTeam = generateTeam(this.getPlayerType(), 1, 1);
      playerTeam.forEach((char) => {
        const generator = generatePosition('player');
        const obj = new PositionedCharacter(char, generator.next().value);
        this.gameState.from(obj);
      });
    }

    if (this.level === 3) {
      const playerTeam = generateTeam(this.getPlayerType(), 2, 2);
      playerTeam.forEach((char) => {
        const generator = generatePosition('player');
        const obj = new PositionedCharacter(char, generator.next().value);
        this.gameState.from(obj);
      });
    }

    if (this.level === 4) {
      const playerTeam = generateTeam(this.getPlayerType(), 3, 2);
      playerTeam.forEach((char) => {
        const generator = generatePosition('player');
        const obj = new PositionedCharacter(char, generator.next().value);
        this.gameState.from(obj);
      });
    }

    const enemyTeam = generateTeam(this.getEnemyType(), this.level, this.gameState.chars.length);

    enemyTeam.forEach((char) => {
      const generator = generatePosition('enemy');
      const obj = new PositionedCharacter(char, generator.next().value);
      this.gameState.from(obj);
    });
    this.gamePlay.redrawPositions(this.gameState.chars);
  }
}
