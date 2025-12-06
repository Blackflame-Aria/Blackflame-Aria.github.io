window.hardHighScore = localStorage.getItem('snakeHardHighScore') ? parseInt(localStorage.getItem('snakeHardHighScore')) : 0;


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

window.initializeHardMode = function() {
  gameSpeed = 12;
  
  walls = [];
  const wallCount = 8;
  
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
  
  specialFoodTimer = setInterval(() => {
    if (gameRunning && !isPaused) {
      const specialFood = generateFoodLocal();
      specialFood.isSpecial = true;
      foods.push(specialFood);
      
      setTimeout(() => {
        const index = foods.findIndex(food => food.isSpecial);
        if (index !== -1) {
          foods.splice(index, 1);
        }
      }, 3000);
    }
  }, 10000);
}

window.getHardHighScore = function() {
  return hardHighScore;
}

window.updateHardHighScore = function(newScore) {
  if (newScore > hardHighScore) {
    hardHighScore = newScore;
    localStorage.setItem('snakeHardHighScore', hardHighScore);
    return true;
  }
  return false;
}
