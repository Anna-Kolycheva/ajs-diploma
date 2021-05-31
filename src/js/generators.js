/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */

export function* characterGenerator(allowedTypes, maxLevel) {
  const indexType = Math.floor(Math.random() * allowedTypes.length);
  const randomCharacter = new allowedTypes[indexType](1);
  const indexLevel = 1 + Math.floor(Math.random() * maxLevel);

  for (let i = 1; indexLevel > i; i += 1) {
    randomCharacter.levelUp();
  }
  yield randomCharacter;
}

export function generateTeam(allowedTypes, maxLevel, characterCount) {
  const team = [];
  for (let i = 0; i < characterCount; i += 1) {
    team.push(characterGenerator(allowedTypes, maxLevel).next().value);
  }
  return team;
}

export function* positionGenerator(allowedTypes, maxLevel) {
  const indexType = Math.floor(Math.random() * allowedTypes.length);
  const randomCharacter = new allowedTypes[indexType](1);
  const indexLevel = 1 + Math.floor(Math.random() * maxLevel);
  for (let i = 1; indexLevel > i; i += 1) {
    randomCharacter.levelUp();
  }
  yield randomCharacter;
}

export function* generatePosition(team, gameState) {
  const positions = [];
  if (gameState) {
    gameState.chars.forEach((element) => {
      positions.push(element.position);
    });
  }
  const posGen = () => {
    let pos;
    let row;
    do {
      if (team === 'player') {
        row = Math.floor(Math.random() * 2);
        pos = row + 8 * Math.floor(Math.random() * 8);
      }
      if (team === 'enemy') {
        row = Math.floor(Math.random() * 2);
        pos = row + 6 + 8 * Math.floor(Math.random() * 8);
      }
    } while (positions.includes(pos));
    positions.push(pos);
    return pos;
  };
  yield posGen();
}
