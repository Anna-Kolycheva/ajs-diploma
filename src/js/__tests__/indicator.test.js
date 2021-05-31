import GameController from '../GameController';
import Daemon from '../caracters/daemon';
import Bowman from '../caracters/bowman';

const gameController = new GameController();
gameController.gameState.playerTurn = true;
gameController.gameState.from({ character: new Bowman(1), position: 0 });
gameController.gameState.from({ character: new Bowman(1), position: 15 });
gameController.gameState.from({ character: new Daemon(1), position: 1 });
gameController.gameState.from({ character: new Daemon(1), position: 4 });
gameController.currentIndex = gameController.gameState.chars[0].position;

test('игрок может перейти', () => {
  expect(gameController.canIDo(2, 'go'))
    .toBe(true);
});

test('игрок не может перейти', () => {
  expect(gameController.canIDo(3, 'go'))
    .toBe(false);
});

test('игрок может aтаковать', () => {
  expect(gameController.canIDo(1, 'attack'))
    .toBe(true);
});

test('игрок не может aтаковать', () => {
  expect(gameController.canIDo(4, 'attack'))
    .toBe(false);
});

test('выбрать другого персонажа', () => {
  gameController.onCellClick(15);
  expect(gameController.currentIndex)
    .toBe(15);
});

test('попытка выбора персонажа из чужой команды', () => {
  gameController.currentIndex = null;
  gameController.onCellClick(1);
  expect(gameController.currentIndex)
    .toBe(null);
});
