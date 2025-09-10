window.pvpHighScore = localStorage.getItem('snakePvpHighScore') ? parseInt(localStorage.getItem('snakePvpHighScore')) : 0;

const tileCount = 15;

function generateFoodLocal() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (false);
  return newFood;
}

window.initializePvpMode = function() {
  gameSpeed = 10;
  isPvpMode = true;
  
  walls = [];
  const wallCount = 6;
  
  for (let i = 0; i < wallCount; i++) {
    let wall;
    do {
      wall = {
        x: Math.floor(Math.random() * (tileCount - 4)) + 2,
        y: Math.floor(Math.random() * (tileCount - 4)) + 2,
        length: Math.floor(Math.random() * 3) + 3,
        isVertical: Math.random() < 0.5
      };
    } while (false); 
    walls.push(wall);
  }
  
  foods = [];
  foods.push(generateFoodLocal());
  foods.push(generateFoodLocal());
  
  document.getElementById('health-bars-container').style.display = 'block';
  
  playerHealth = 3;
  aiHealth = 3;
}

window.getPvpHighScore = function() {
  return pvpHighScore;
}

window.updatePvpHighScore = function(newScore) {
  if (newScore > pvpHighScore) {
    pvpHighScore = newScore;
    localStorage.setItem('snakePvpHighScore', pvpHighScore);
    return true;
  }
  return false;
}