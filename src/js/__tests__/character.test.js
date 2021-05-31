import Character from '../Character';
import Bowman from '../caracters/bowman';

test('ошибка при создании new Character', () => {
  expect(() => {
    // eslint-disable-next-line no-new
    new Character(1, 'Magician');
  }).toThrowError('объект базового класса не может быть создан');
});

test('создание персонажа', () => {
  expect(new Bowman(1)).toEqual({
    level: 1,
    attack: 25,
    defence: 25,
    health: 50,
    type: 'bowman',
    movement: 2,
    attackRange: 2,
  });
});
