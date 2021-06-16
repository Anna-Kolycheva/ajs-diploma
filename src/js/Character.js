export default class Character {
  constructor(level, type = 'generic') {
    this.level = level;
    this.attack = 0;
    this.defence = 0;
    this.health = 50;
    this.type = type;
    if (new.target.name === 'Character') throw new Error('объект базового класса не может быть создан');
  }

  levelUp() {
    this.level += 1;
    const coefficient = (1.8 - (1 - this.health / 100));
    this.attack = Math.round(Math.max(this.attack, this.attack * coefficient));
    this.defence = Math.round(Math.max(this.defence, this.defence * coefficient));
    this.health = Math.min(this.health + 80, 100);
  }
}
