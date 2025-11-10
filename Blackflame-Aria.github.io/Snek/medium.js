window.mediumHighScore = localStorage.getItem('snakeMediumHighScore') ? parseInt(localStorage.getItem('snakeMediumHighScore')) : 0;

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

window.initializeMediumMode = function() {
  gameSpeed = 9;
  
  walls = [];
  const wallCount = 5;
  
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
