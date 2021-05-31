import GameStateService from '../GameStateService';

jest.mock('../GameStateService');
beforeEach(() => {
  jest.resetAllMocks();
});

const stateService = new GameStateService();

test('успешная загрузка', () => {
  expect(stateService.load())
    .toBe(undefined);
});

test('Check load', () => {
  const expected = { score: 10, record: 10, level: 1 };
  stateService.load.mockReturnValue(expected);
  const recived = stateService.load();
  expect(recived).toBe(expected);
});
