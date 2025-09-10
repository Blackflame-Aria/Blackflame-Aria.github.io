window.easyHighScore = localStorage.getItem('snakeEasyHighScore') ? parseInt(localStorage.getItem('snakeEasyHighScore')) : 0;

window.initializeEasyMode = function() {
  gameSpeed = 7;
  
  walls = [];
  const wallCount = 3;
  for (let i = 0; i < wallCount; i++) {
    walls.push(generateWall());
  }
  
  foods = [];
  foods.push(generateFood());
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