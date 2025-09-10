window.mediumHighScore = localStorage.getItem('snakeMediumHighScore') ? parseInt(localStorage.getItem('snakeMediumHighScore')) : 0;

window.initializeMediumMode = function() {
  gameSpeed = 9;
  
  walls = [];
  const wallCount = 5;
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
      }, 5000);
    }
  }, 15000);
}

window.getMediumHighScore = function() {
  return mediumHighScore;
}

window.updateMediumHighScore = function(newScore) {
  if (newScore > mediumHighScore) {
    mediumHighScore = newScore;
    localStorage.setItem('snakeMediumHighScore', mediumHighScore);
    return true;
  }
  return false;
}
