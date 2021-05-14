import Vampire from '../caracters/vampire';
import Undead from '../caracters/undead';

test('Вывод информации о персонаже', () => {
  const char = new Vampire(3);
  const str = `🎖 ${char.level} ⚔ ${char.attack} 🛡 ${char.defence} ❤ ${char.health}`;
  expect(str).toBe('🎖 3 ⚔ 25 🛡 25 ❤ 50');
});

test('Вывод информации о персонаже', () => {
  const char = new Undead(4);
  const str = `🎖 ${char.level} ⚔ ${char.attack} 🛡 ${char.defence} ❤ ${char.health}`;
  expect(str).toBe('🎖 4 ⚔ 40 🛡 10 ❤ 50');
});
