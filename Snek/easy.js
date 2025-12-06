window.easyHighScore = localStorage.getItem('snakeEasyHighScore') ? parseInt(localStorage.getItem('snakeEasyHighScore')) : 0;


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

window.initializeEasyMode = function() {
  gameSpeed = 7;
  
  walls = [];
  const wallCount = 3;
  
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
}

window.getEasyHighScore = function() {
  return easyHighScore;
}

window.updateEasyHighScore = function(newScore) {
  if (newScore > easyHighScore) {
    easyHighScore = newScore;
    localStorage.setItem('snakeEasyHighScore', easyHighScore);
    return true;
  }
  return false;
}