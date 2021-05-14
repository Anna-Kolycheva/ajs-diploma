import { calcTileType } from '../utils';

test('top-left, boardSize=8', () => {
  expect(calcTileType(0, 8)).toBe('top-left');
});

test('top, boardSize=8', () => {
  expect(calcTileType(2, 8)).toBe('top');
});

test('top-right, boardSize=7', () => {
  expect(calcTileType(7, 8)).toBe('top-right');
});

test('left, boardSize=8', () => {
  expect(calcTileType(8, 8)).toBe('left');
});

test('right, boardSize=8', () => {
  expect(calcTileType(15, 8)).toBe('right');
});

test('bottom-left, boardSize=8', () => {
  expect(calcTileType(56, 8)).toBe('bottom-left');
});

test('bottom, boardSize=8', () => {
  expect(calcTileType(58, 8)).toBe('bottom');
});

test('bottom-right, boardSize=8', () => {
  expect(calcTileType(63, 8)).toBe('bottom-right');
});

test('center, boardSize=8', () => {
  expect(calcTileType(35, 8)).toBe('center');
});
