window.hardHighScore = localStorage.getItem('snakeHardHighScore') ? parseInt(localStorage.getItem('snakeHardHighScore')) : 0;

window.initializeHardMode = function() {
  gameSpeed = 12;
  
  walls = [];
  const wallCount = 8;
  for (let i = 0; i < wallCount; i++) {
    walls.push(generateWall());
  }
  
  foods = [];
  foods.push(generateFood());
  
  specialFoodTimer = setInterval(() => {
    if (gameRunning && !isPaused) {
      const specialFood = generateFood(true);
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
