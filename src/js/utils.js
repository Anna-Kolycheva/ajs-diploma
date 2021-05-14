export function calcTileType(index, boardSize) {
  // TODO: write logic here
  const i = index + 1;
  switch (true) {
    case (i === 1): return 'top-left';
    case (i <= boardSize - 1): return 'top';
    case (i === boardSize): return 'top-right';
    case ((i - 1) % boardSize === 0 && i < boardSize * (boardSize - 1) + 1): return 'left';
    case (i % boardSize === 0 && i < boardSize ** 2): return 'right';
    case (i === boardSize * (boardSize - 1) + 1): return 'bottom-left';
    case (i > boardSize * (boardSize - 1) + 1 && i < boardSize ** 2): return 'bottom';
    case (i === boardSize ** 2): return 'bottom-right';
    default: return 'center';
  }
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}
