const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function setCanvasSize() {
  const isMobile = window.innerWidth < 768;
  const baseSize = isMobile ? Math.min(window.innerWidth * 0.9, 400) : Math.min(window.innerWidth * 0.6, 500);
  
  canvas.width = baseSize;
  canvas.height = baseSize;
}

setCanvasSize();
window.addEventListener('resize', setCanvasSize);

let gridSize;
let imageSize;
const tileCount = 15;

function updateGridSize() {
  gridSize = canvas.width / tileCount;
  imageSize = Math.max(gridSize * 1.25, 20);
}

updateGridSize();
window.addEventListener('resize', updateGridSize);
let snake = [{x: 10, y: 10, visualX: 10, visualY: 10}];
let direction = {x: 0, y: 0};

document.addEventListener('DOMContentLoaded', function() {
  const difficulty = document.getElementById('difficulty').value;
  
  if (difficulty === 'easy' && window.initializeEasyMode) {
    window.initializeEasyMode();
  } else if (difficulty === 'medium' && window.initializeMediumMode) {
    window.initializeMediumMode();
  } else if (difficulty === 'hard' && window.initializeHardMode) {
    window.initializeHardMode();
  } else if (difficulty === 'pvp' && window.initializePvpMode) {
    window.initializePvpMode();
  } else {
    updateGameSpeed();
  }
  
  highScore = getHighScore(difficulty);
  document.getElementById('highScoreValue').textContent = highScore;
  const snakesEatenDisplay = document.querySelector('.snakes-eaten');
  if (snakesEatenDisplay) {
    snakesEatenDisplay.style.display = difficulty === 'pvp' ? 'block' : 'none';
  }
});
let aiSnake = [];
let aiDirection = {x: 0, y: 0};
let foods = [];
let score = 0;
let enemyDefeatPoints = 0; 
function getHighScore(difficulty) {
  if (difficulty === 'easy') {
    return window.getEasyHighScore ? window.getEasyHighScore() : (parseInt(localStorage.getItem('snakeHighScore_easy')) || 0);
  } else if (difficulty === 'medium') {
    return window.getMediumHighScore ? window.getMediumHighScore() : (parseInt(localStorage.getItem('snakeHighScore_medium')) || 0);
  } else if (difficulty === 'hard') {
    return window.getHardHighScore ? window.getHardHighScore() : (parseInt(localStorage.getItem('snakeHighScore_hard')) || 0);
  } else if (difficulty === 'pvp') {
    return window.getPvpHighScore ? window.getPvpHighScore() : (parseInt(localStorage.getItem('snakeHighScore_pvp')) || 0);
  } else {
    return parseInt(localStorage.getItem(`snakeHighScore_${difficulty}`)) || 0;
  }
}

function setHighScore(difficulty, score) {
  if (difficulty === 'easy' && window.updateEasyHighScore) {
    window.updateEasyHighScore(score);
  } else if (difficulty === 'medium' && window.updateMediumHighScore) {
    window.updateMediumHighScore(score);
  } else if (difficulty === 'hard' && window.updateHardHighScore) {
    window.updateHardHighScore(score);
  } else if (difficulty === 'pvp' && window.updatePvpHighScore) {
    window.updatePvpHighScore(score);
  } else {
    localStorage.setItem(`snakeHighScore_${difficulty}`, score);
  }
}

let highScore = getHighScore('easy');
let snakesEaten = 0; 
let baseGameSpeed = 125;
let gameRunning = false;
let imagesLoaded = false;
let gameStarted = false;
let walls = [];
let isPvpMode = false;
let aiHealth = 3;
let playerHealth = 3; 

function generateFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (
    snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
    aiSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y) ||
    walls.some(wall => {
      if (wall.isVertical) {
        return newFood.x === wall.x && newFood.y >= wall.y && newFood.y < wall.y + wall.length;
      } else {
        return newFood.y === wall.y && newFood.x >= wall.x && newFood.x < wall.x + wall.length;
      }
    }) ||
    foods.some(food => food.x === newFood.x && food.y === newFood.y)
  );
  return newFood;
}

function gameLoop() {
  if (!gameRunning) return;

  update();
  draw();
  setTimeout(gameLoop, gameSpeed);
}

function generateWalls() {
  walls = [];
  if (document.getElementById('difficulty').value === 'hard') {
    for (let i = 0; i < 2; i++) {
      let wall;
      do {
        wall = {
          x: Math.floor(Math.random() * (tileCount - 4)) + 2,
          y: Math.floor(Math.random() * (tileCount - 4)) + 2,
          length: Math.floor(Math.random() * 3) + 3,
          isVertical: Math.random() < 0.5
        };
      } while (isWallOverlapping(wall));
      walls.push(wall);
    }
  }
}

function isWallOverlapping(newWall) {
  const SAFE_DISTANCE = 4;
  
  for (const segment of snake) {
    if (Math.abs(newWall.x - segment.x) < SAFE_DISTANCE && Math.abs(newWall.y - segment.y) < SAFE_DISTANCE) return true;
  }
  
  if (foods.some(food => Math.abs(newWall.x - food.x) < SAFE_DISTANCE && Math.abs(newWall.y - food.y) < SAFE_DISTANCE)) return true;
  
  return walls.some(wall => {
    if (newWall.isVertical === wall.isVertical) {
      if (newWall.isVertical) {
        return Math.abs(newWall.x - wall.x) < SAFE_DISTANCE && 
               Math.abs(newWall.y - wall.y) < newWall.length + wall.length;
      } else {
        return Math.abs(newWall.y - wall.y) < SAFE_DISTANCE && 
               Math.abs(newWall.x - wall.x) < newWall.length + wall.length;
      }
    }
    else {
      const newWallEnd = newWall.isVertical ? newWall.y + newWall.length : newWall.x + newWall.length;
      const wallEnd = wall.isVertical ? wall.y + wall.length : wall.x + wall.length;
      
      if (newWall.isVertical) {
        return (Math.abs(newWall.x - wall.x) < SAFE_DISTANCE && 
                newWall.y < wallEnd && wall.y < newWallEnd);
      } else {
        return (Math.abs(newWall.y - wall.y) < SAFE_DISTANCE && 
                newWall.x < wallEnd && wall.x < newWallEnd);
      }
    }
  });
}

function calculateAiMove() {
  if (!isPvpMode || aiSnake.length === 0) return;
  
  const aiHead = aiSnake[0];
  let closestFood = null;
  let minDistance = Infinity;
  
  for (const food of foods) {
    const distance = Math.abs(food.x - aiHead.x) + Math.abs(food.y - aiHead.y);
    if (distance < minDistance) {
      minDistance = distance;
      closestFood = food;
    }
  }
  
  if (closestFood) {
    const dx = closestFood.x - aiHead.x;
    const dy = closestFood.y - aiHead.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      aiDirection = {x: dx > 0 ? 1 : -1, y: 0};
    } else {
      aiDirection = {x: 0, y: dy > 0 ? 1 : -1};
    }
    
    const nextX = aiHead.x + aiDirection.x;
    const nextY = aiHead.y + aiDirection.y;
    
    if (nextX < 0 || nextX >= tileCount || nextY < 0 || nextY >= tileCount ||
        aiSnake.some(segment => segment.x === nextX && segment.y === nextY) ||
        walls.some(wall => {
          if (wall.isVertical) {
            return nextX === wall.x && nextY >= wall.y && nextY < wall.y + wall.length;
          } else {
            return nextY === wall.y && nextX >= wall.x && nextX < wall.x + wall.length;
          }
        })) {
      const possibleDirections = [
        {x: 1, y: 0}, {x: -1, y: 0}, {x: 0, y: 1}, {x: 0, y: -1}
      ].filter(dir => {
        const newX = aiHead.x + dir.x;
        const newY = aiHead.y + dir.y;
        return !(newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount ||
                aiSnake.some(segment => segment.x === newX && segment.y === newY) ||
                walls.some(wall => {
                  if (wall.isVertical) {
                    return newX === wall.x && newY >= wall.y && newY < wall.y + wall.length;
                  } else {
                    return newY === wall.y && newX >= wall.x && newX < wall.x + wall.length;
                  }
                }));
      });
      
      if (possibleDirections.length > 0) {
        aiDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
      } else {
        aiDirection = {x: 0, y: 0};
      }
    }
  }
}

function turnLeft(currentDirection) {
  if (currentDirection.x === 1) return {x: 0, y: -1};
  if (currentDirection.x === -1) return {x: 0, y: 1};
  if (currentDirection.y === 1) return {x: 1, y: 0};
  if (currentDirection.y === -1) return {x: -1, y: 0};
  return currentDirection;
}

let specialSnakeMovementCounter = 0;

function update() {
  if (!gameStarted) return;
  
  specialSnakeMovementCounter = (specialSnakeMovementCounter + 1) % 4;
  
  if (specialSnakeActive && specialSnake.length > 0) {

    if (specialSnakeMovementCounter === 0) {
    } else {
      const specialHead = specialSnake[0];
      const playerHead = snake[0];
      const firstTailSegment = snake[1];
      if (firstTailSegment) {
        const dx = firstTailSegment.x - specialHead.x;
        const dy = firstTailSegment.y - specialHead.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          specialSnakeDirection = {x: dx > 0 ? 1 : -1, y: 0};
        } else {
          specialSnakeDirection = {x: 0, y: dy > 0 ? 1 : -1};
        }
      } else {
        const dx = playerHead.x - specialHead.x;
        const dy = playerHead.y - specialHead.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          specialSnakeDirection = {x: dx > 0 ? 1 : -1, y: 0};
        } else {
          specialSnakeDirection = {x: 0, y: dy > 0 ? 1 : -1};
        }
      }
      
      const newSpecialHead = {
        x: specialHead.x + specialSnakeDirection.x,
        y: specialHead.y + specialSnakeDirection.y,
        visualX: specialHead.x + specialSnakeDirection.x,
        visualY: specialHead.y + specialSnakeDirection.y
      };
      
      const hitWall = newSpecialHead.x < 0 || newSpecialHead.x >= tileCount || 
                      newSpecialHead.y < 0 || newSpecialHead.y >= tileCount ||
                      specialSnake.some(segment => segment.x === newSpecialHead.x && segment.y === newSpecialHead.y) ||
                      walls.some(wall => {
                        if (wall.isVertical) {
                          return newSpecialHead.x === wall.x && newSpecialHead.y >= wall.y && newSpecialHead.y < wall.y + wall.length;
                        } else {
                          return newSpecialHead.y === wall.y && newSpecialHead.x >= wall.x && newSpecialHead.x < wall.x + wall.length;
                        }
                      });
      
      const hitSnakeSegment = snake.some(segment => newSpecialHead.x === segment.x && newSpecialHead.y === segment.y) ||
                            (isPvpMode && aiSnake && aiSnake.length > 0 && aiSnake.some(segment => newSpecialHead.x === segment.x && newSpecialHead.y === segment.y));
      
      if (hitSnakeSegment) {
        specialSnakeDirection = turnLeft(specialSnakeDirection);
        newSpecialHead.x = specialHead.x + specialSnakeDirection.x;
        newSpecialHead.y = specialHead.y + specialSnakeDirection.y;
        newSpecialHead.visualX = newSpecialHead.x;
        newSpecialHead.visualY = newSpecialHead.y;
        
        const hitWallAfterTurn = newSpecialHead.x < 0 || newSpecialHead.x >= tileCount || 
                               newSpecialHead.y < 0 || newSpecialHead.y >= tileCount ||
                               specialSnake.some(segment => segment.x === newSpecialHead.x && segment.y === newSpecialHead.y) ||
                               walls.some(wall => {
                                 if (wall.isVertical) {
                                   return newSpecialHead.x === wall.x && newSpecialHead.y >= wall.y && newSpecialHead.y < wall.y + wall.length;
                                 } else {
                                   return newSpecialHead.y === wall.y && newSpecialHead.x >= wall.x && newSpecialHead.x < wall.x + wall.length;
                                 }
                               });
        
        if (hitWallAfterTurn) {
          specialSnakeDirection = turnLeft(specialSnakeDirection);
          newSpecialHead.x = specialHead.x + specialSnakeDirection.x;
          newSpecialHead.y = specialHead.y + specialSnakeDirection.y;
          newSpecialHead.visualX = newSpecialHead.x;
          newSpecialHead.visualY = newSpecialHead.y;
        }
      }
    
      const finalHitWall = newSpecialHead.x < 0 || newSpecialHead.x >= tileCount || 
                         newSpecialHead.y < 0 || newSpecialHead.y >= tileCount ||
                         specialSnake.some(segment => segment.x === newSpecialHead.x && segment.y === newSpecialHead.y) ||
                         walls.some(wall => {
                           if (wall.isVertical) {
                             return newSpecialHead.x === wall.x && newSpecialHead.y >= wall.y && newSpecialHead.y < wall.y + wall.length;
                           } else {
                             return newSpecialHead.y === wall.y && newSpecialHead.x >= wall.x && newSpecialHead.x < wall.x + wall.length;
                           }
                         });
                         
      if (!finalHitWall) {
        specialSnake.unshift(newSpecialHead);
        
        const hitPlayerSnake = snake.some((segment, index) => {
          if (newSpecialHead.x === segment.x && newSpecialHead.y === segment.y) {
            if (index === 0) {
              playerHealth -= 0.12;
              updateHealthBars();
              
              if (playerHealth <= 0) {
                gameOver();
                return true;
              }
              
              return true;
            }
            
            const removedSegments = snake.splice(index);
            if (removedSegments.length > 0) {
              playerHealth -= 0.05 * removedSegments.length;
              updateHealthBars();
              
              if (playerHealth <= 0) {
                gameOver();
                return true;
              }
            }
            return true;
          }
          return false;
        });
        
        if (!hitPlayerSnake && specialSnake.length > 5) {
          specialSnake.pop();
        }
      }
    }
  }
  
  if (specialSnakeActive && specialSnake.length > 1) {
    for (let i = 0; i < snake.length; i++) {
      for (let j = 1; j < specialSnake.length; j++) { 
        if (snake[i].x === specialSnake[j].x && snake[i].y === specialSnake[j].y) {
          specialSnake.splice(j);
          specialSnakeHealth -= 0.75;
          if (specialSnakeHealth <= 0) {
            specialSnake = [];
            specialSnakeActive = false;
            enemyDefeatPoints += 500;
            playerHealth = 3;
            updateHealthBars();
          }
          enemyDefeatPoints += 20;
          updateScoreDisplay();
          return;
        }
      }
    }
  }
  
  if (specialSnakeActive && specialSnake.length > 0 && snake.length > 1) {
    for (let i = 1; i < snake.length; i++) {
      if (specialSnake[0].x === snake[i].x && specialSnake[0].y === snake[i].y) {
        const removedSegments = snake.splice(i);
        if (removedSegments.length > 0) {
          playerHealth -= 0.05 * removedSegments.length;
          updateHealthBars();
          
          if (playerHealth <= 0) {
            gameOver();
            return;
          }
        }
        updateScoreDisplay();
        return;
      }
    }
  }
  
  const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};

  const firstTailSegment = snake[1];
  if (firstTailSegment && head.x === firstTailSegment.x && head.y === firstTailSegment.y) {
    head.x = snake[0].x + direction.x;
    head.y = snake[0].y + direction.y;
  }

  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount ||
      snake.slice(2).some(segment => segment.x === head.x && segment.y === head.y) ||
      walls.some(wall => {
        if (wall.isVertical) {
          return head.x === wall.x && head.y >= wall.y && head.y < wall.y + wall.length;
        } else {
          return head.y === wall.y && head.x >= wall.x && head.x < wall.x + wall.length;
        }
      })) {
    gameOver();
    return;
  }
  
  if (specialSnakeActive && specialSnake.length > 0) {
    const hitSpecialSnake = specialSnake.some((segment, index) => {
      if (head.x === segment.x && head.y === segment.y) {
        if (index === 0) {
          specialSnakeHealth--;
          
          if (specialSnakeHealth <= 0) {
            specialSnake = [];
            specialSnakeActive = false;
            enemyDefeatPoints += 500;
            playerHealth = 3;
            updateHealthBars();
            updateScoreDisplay(); 
            return true;
          }
          
          direction = {x: -direction.x, y: -direction.y};
          return true;
        }
        
        specialSnake.splice(index);
        enemyDefeatPoints += 20;
        updateScoreDisplay();
        return true;
      }
      return false;
    });
    
    if (!hitSpecialSnake && specialSnake.length > 1) {
      for (let i = 0; i < snake.length; i++) {
        for (let j = 1; j < specialSnake.length; j++) { 
          if (snake[i].x === specialSnake[j].x && snake[i].y === specialSnake[j].y) {
            specialSnake.splice(j);
            specialSnakeHealth -= 0.75;
            if (specialSnakeHealth <= 0) {
              specialSnake = [];
              specialSnakeActive = false;
              enemyDefeatPoints += 500;
              playerHealth = 3;
              updateHealthBars();
            }
            enemyDefeatPoints += 20;
            updateScoreDisplay(); 
            return;
          }
        }
      }
    }
    
    if (specialSnake.length > 0 && snake.length > 1) {
      for (let i = 1; i < snake.length; i++) { 
        if (specialSnake[0].x === snake[i].x && specialSnake[0].y === snake[i].y) {
          snake.splice(i);
          updateScoreDisplay();
          return;
        }
      }
    }
  }
  
  if (isPvpMode && aiSnake.length > 0) {
    for (let i = 0; i < snake.length; i++) {
      for (let j = 1; j < aiSnake.length; j++) { 
        if (snake[i].x === aiSnake[j].x && snake[i].y === aiSnake[j].y) {
          aiSnake.splice(j);
          score += 20;
          return;
        }
      }
    }
    
    if (aiSnake.length > 0 && snake.length > 1) {
      for (let i = 1; i < snake.length; i++) { 
        if (aiSnake[0].x === snake[i].x && aiSnake[0].y === snake[i].y) {
          snake.splice(i);
          updateScoreDisplay();
          return;
        }
      }
    }
    
    if (head.x === aiSnake[0].x && head.y === aiSnake[0].y) {
      const isHeadOn = (
        (direction.x !== 0 && direction.x === -aiDirection.x && direction.y === 0 && aiDirection.y === 0) || 
        (direction.y !== 0 && direction.y === -aiDirection.y && direction.x === 0 && aiDirection.x === 0)
      );
      
      if (isHeadOn) {
        playerHealth--;
        aiHealth--;
        updateHealthBars();
        
        if (playerHealth <= 0) {
            gameOver();
            return;
          }
          if (aiHealth <= 0) {
            aiSnake = [{
              x: -1,
              y: -1,
              visualX: -1,
              visualY: -1
            }];
            
            aiDirection = {x: 0, y: 0};
            
            if (playerHealth < 3) {
              playerHealth += 1;
              updateHealthBars();
            }
            
            const respawnTimer = document.getElementById('respawn-timer');
            respawnTimer.classList.add('active');
            console.log('Starting respawn timer countdown');
            let timeLeft = 20;
            
            const updateTimer = () => {
              const minutes = Math.floor(timeLeft / 60);
              const seconds = timeLeft % 60;
              const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
              document.getElementById('timer-value').textContent = formattedTime;
            };
            
            clearRespawnTimer();
            
            respawnTimerInterval = setInterval(() => {
              timeLeft--;
              updateTimer();
              
              if (timeLeft <= 0) {
                clearRespawnTimer();
                aiHealth = 3;
                updateHealthBars();
                
                const aiX = 0;
                const aiY = Math.floor(tileCount / 2);
                
                aiSnake = [{
                  x: aiX,
                  y: aiY,
                  visualX: aiX,
                  visualY: aiY
                }];
                
                aiDirection = {x: 1, y: 0};
                
              }
            }, 1000);
            return;
          }
        
        direction = turnLeft(direction);
        aiDirection = turnLeft(aiDirection);
        return;
      } else {
        aiHealth -= 1;
        updateAiHealthBar();
        
        snake.push({
          x: snake[snake.length - 1].x,
          y: snake[snake.length - 1].y,
          visualX: snake[snake.length - 1].x,
          visualY: snake[snake.length - 1].y
        });
        
          if (aiHealth <= 0) {
            aiSnake = [{
              x: -1,
              y: -1,
              visualX: -1,
              visualY: -1
            }];
            
            aiDirection = {x: 0, y: 0};
            
            if (playerHealth < 3) {
              playerHealth += 1;
              updateHealthBars();
            }
            
            snakesEaten++;
            
            if (score > highScore) {
              highScore = score;
            }
            
            updateScoreDisplays();
            
            const respawnTimer = document.getElementById('respawn-timer');
            respawnTimer.style.display = 'inline-block'; 
            console.log('Showing respawn timer');
            let timeLeft = 20;
          
          const updateTimer = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('timer-value').textContent = formattedTime;
          };
          
          updateTimer();
          
          clearRespawnTimer();
          
          respawnTimerInterval = setInterval(() => {
            if (gameRunning) {
              timeLeft--;
              updateTimer();
            }
            
            if (timeLeft <= 0) {
              clearRespawnTimer();
              
              aiHealth = 3;
              updateAiHealthBar();
              
              const aiX = 0;
              const aiY = Math.floor(tileCount / 2);
              
              aiSnake = [{
                x: aiX,
                y: aiY,
                visualX: aiX,
                visualY: aiY
              }];
              
              aiDirection = {x: 1, y: 0};
              
            }
          }, 1000);
        }
      }
    }
    
    for (let i = 1; i < aiSnake.length; i++) {
      if (head.x === aiSnake[i].x && head.y === aiSnake[i].y) {
        if (i === 1) {
          aiHealth -= 1;
          updateHealthBars();
          
          snake.push({
            x: snake[snake.length - 1].x,
            y: snake[snake.length - 1].y,
            visualX: snake[snake.length - 1].x,
            visualY: snake[snake.length - 1].y
          });
          updateScoreDisplay();
        } else {
          aiSnake.splice(i);
        }
        
        if (aiHealth <= 0) {
          enemyDefeatPoints += 100;
          updateScoreDisplay(); 
          
            aiSnake = [{
              x: -1,
              y: -1,
              visualX: -1,
              visualY: -1
            }];
            
            aiDirection = {x: 0, y: 0};
            
            if (playerHealth < 3) {
              playerHealth += 1;
              updateHealthBars();
            }
            
            snakesEaten++;
            
            if (score > highScore) {
              highScore = score;
            }
            
            updateScoreDisplays();
            
            const respawnTimer = document.getElementById('respawn-timer');
            respawnTimer.style.display = 'inline-block'; 
            console.log('Showing respawn timer');
            let timeLeft = 20;
          
          const updateTimer = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            document.getElementById('timer-value').textContent = formattedTime;
          };
          
          updateTimer();
          
          clearRespawnTimer();
          
          respawnTimerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            
            if (timeLeft <= 0) {
              clearRespawnTimer();
              
              aiHealth = 3;
              updateHealthBars();
              
              const aiX = 0;
              const aiY = Math.floor(tileCount / 2);
              
              aiSnake = [{
                x: aiX,
                y: aiY,
                visualX: aiX,
                visualY: aiY
              }];
              
              aiDirection = {x: 1, y: 0};
              
            }
          }, 1000);
          return;
        }
        continue;
      }
      if (head.x === aiSnake[i].x && head.y === aiSnake[i].y) {
        const removedSegments = aiSnake.splice(i);
        
        snake.push({
          x: snake[snake.length - 1].x,
          y: snake[snake.length - 1].y,
          visualX: snake[snake.length - 1].x,
          visualY: snake[snake.length - 1].y
        });
        enemyDefeatPoints += 100;
        updateScoreDisplay();
        break;
      }
    }
    
    calculateAiMove();
    const aiHead = {x: aiSnake[0].x + aiDirection.x, y: aiSnake[0].y + aiDirection.y};
    
    const aiHitWall = aiHead.x < 0 || aiHead.x >= tileCount || aiHead.y < 0 || aiHead.y >= tileCount ||
                     aiSnake.some(segment => segment.x === aiHead.x && segment.y === aiHead.y) ||
                     walls.some(wall => {
                       if (wall.isVertical) {
                         return aiHead.x === wall.x && aiHead.y >= wall.y && aiHead.y < wall.y + wall.length;
                       } else {
                         return aiHead.y === wall.y && aiHead.x >= wall.x && aiHead.x < wall.x + wall.length;
                       }
                     });
    
    if (!aiHitWall) {
      const hitPlayerSnake = snake.some((segment, index) => {
        if (aiHead.x === segment.x && aiHead.y === segment.y) {
          if (index === 0) {
            const isHeadOn = (
              (aiDirection.x !== 0 && aiDirection.x === -direction.x && aiDirection.y === 0 && direction.y === 0) || 
              (aiDirection.y !== 0 && aiDirection.y === -direction.y && aiDirection.x === 0 && direction.x === 0)
            );
            
            if (isHeadOn) {
              playerHealth--;
              aiHealth--;
              updateHealthBars();
              
              if (playerHealth <= 0) {
                gameOver();
                return;
              }
              
              if (aiHealth <= 0) {
                aiSnake = [{
                  x: -1,
                  y: -1,
                  visualX: -1,
                  visualY: -1
                }];
                
                aiDirection = {x: 0, y: 0};
                
                if (playerHealth < 3) {
                  playerHealth += 1;
                  updateHealthBars();
                }
                
                snakesEaten++;
                
                if (score > highScore) {
                  highScore = score;
                }
                
                updateScoreDisplays();
                
                const respawnTimer = document.getElementById('respawn-timer');
                respawnTimer.style.display = 'inline-block';
                console.log('Showing respawn timer');
                let timeLeft = 20;
                
                const updateTimer = () => {
                  const minutes = Math.floor(timeLeft / 60);
                  const seconds = timeLeft % 60;
                  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  document.getElementById('timer-value').textContent = formattedTime;
                };
                
                updateTimer();
                
                clearRespawnTimer();
                
                respawnTimerInterval = setInterval(() => {
                  timeLeft--;
                  updateTimer();
                  
                  if (timeLeft <= 0) {
                    clearRespawnTimer();
                    
                    aiHealth = 3;
                    updateHealthBars();
                    
                    const aiX = 0;
                    const aiY = Math.floor(tileCount / 2);
                    
                    aiSnake = [{
                      x: aiX,
                      y: aiY,
                      visualX: aiX,
                      visualY: aiY
                    }];
                    
                    aiDirection = {x: 1, y: 0};
                    
                  }
                }, 1000);
                return;
              }
              
              direction = turnLeft(direction);
              aiDirection = turnLeft(aiDirection);
            } else {
              playerHealth -= 1;
              updateHealthBars();
              
              if (playerHealth <= 0) {
                gameOver();
                return;
              }
              
              if (snake.length > 1) {
                snake.pop();
              }
              aiSnake.push({
                x: aiSnake[aiSnake.length - 1].x,
                y: aiSnake[aiSnake.length - 1].y,
                visualX: aiSnake[aiSnake.length - 1].x,
                visualY: aiSnake[aiSnake.length - 1].y
              });
            }
            return true;
          }
          
          if (index === 1) {
            playerHealth -= 1;
            updateHealthBars();
            
            if (playerHealth <= 0) {
              gameOver();
              return;
            }
            
            if (snake.length > 1) {
              snake.pop();
            }
            aiSnake.push({
              x: aiSnake[aiSnake.length - 1].x,
              y: aiSnake[aiSnake.length - 1].y,
              visualX: aiSnake[aiSnake.length - 1].x,
              visualY: aiSnake[aiSnake.length - 1].y
            });
            return true;
          }
          
          const removedSegments = snake.splice(index);
          
          if (removedSegments.length > 0) {
            playerHealth -= 0.05 * removedSegments.length;
            updateHealthBars();
            
            if (playerHealth <= 0) {
              gameOver();
              return true;
            }
          }
          
          aiSnake.push({
            x: aiSnake[aiSnake.length - 1].x,
            y: aiSnake[aiSnake.length - 1].y,
            visualX: aiSnake[aiSnake.length - 1].x,
            visualY: aiSnake[aiSnake.length - 1].y
          });
          document.getElementById('scoreValue').textContent = score;
          return true;
        }
        return false;
      });
      
      if (!hitPlayerSnake) {
        aiHead.visualX = aiHead.x;
        aiHead.visualY = aiHead.y;
        aiSnake.unshift(aiHead);
        
        const aiFoodIndex = foods.findIndex(food => aiHead.x === food.x && aiHead.y === food.y);
        if (aiFoodIndex !== -1) {
          foods.splice(aiFoodIndex, 1);
          foods.push(generateFood());
        } else {
          aiSnake.pop();
        }
      }
    }
  }
  
  head.visualX = head.x;
  head.visualY = head.y;
  snake.unshift(head);

  const movementSpeed = 0.25;
  snake.forEach(segment => {
    if (segment.visualX !== segment.x) {
      segment.visualX += (segment.x - segment.visualX) * movementSpeed;
    }
    if (segment.visualY !== segment.y) {
      segment.visualY += (segment.y - segment.visualY) * movementSpeed;
    }
  });
  
  if (isPvpMode && aiSnake.length > 0) {
    aiSnake.forEach(segment => {
      if (segment.visualX !== segment.x) {
        segment.visualX += (segment.x - segment.visualX) * movementSpeed;
      }
      if (segment.visualY !== segment.y) {
        segment.visualY += (segment.y - segment.visualY) * movementSpeed;
      }
    });
  }
  
  if (specialSnakeActive && specialSnake.length > 0) {
    specialSnake.forEach(segment => {
      if (segment.visualX !== segment.x) {
        segment.visualX += (segment.x - segment.visualX) * movementSpeed;
      }
      if (segment.visualY !== segment.y) {
        segment.visualY += (segment.y - segment.visualY) * movementSpeed;
      }
    });
  }

  const foodIndex = foods.findIndex(food => head.x === food.x && head.y === food.y);
  if (foodIndex !== -1) {
    foods.splice(foodIndex, 1);
    foods.push(generateFood());
    
    if (playerHealth < 3) {
      playerHealth = Math.min(3, playerHealth + 0.25);
      updateHealthBars();
    }
    
    if ((document.getElementById('difficulty').value === 'easy' || 
         document.getElementById('difficulty').value === 'pvp') && 
        foods.length < 2) {
      foods.push(generateFood());
    }
  } else {
    snake.pop();
  }
  
  updateScoreDisplay(); 
  document.getElementById('scoreValue').textContent = score;
}

const headImage = new Image();
const tailImage = new Image();
const foodImage = new Image();
const wallImage = new Image();
const backgroundImage = new Image();

Promise.all([
  new Promise(resolve => { headImage.onload = resolve; }),
  new Promise(resolve => { tailImage.onload = resolve; }),
  new Promise(resolve => { foodImage.onload = resolve; }),
  new Promise(resolve => { wallImage.onload = resolve; }),
  new Promise(resolve => { backgroundImage.onload = resolve; })
]).then(() => {
  imagesLoaded = true;
  startButton.disabled = false;
  startButton.textContent = 'Start Game';
  document.getElementById('highScoreValue').textContent = highScore;
});

headImage.src = 'images/drago.png';
tailImage.src = 'images/dragon2-3.png';
foodImage.src = 'images/dragonsnek (3).gif';
wallImage.src = 'images/wall.png';
backgroundImage.src = 'images/floor.jpg';

function draw() {
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  walls.forEach(wall => {
    if (wall.isVertical) {
      for (let i = 0; i < wall.length; i++) {
        // Center the image in the grid cell
        const x = wall.x * gridSize + (gridSize - imageSize) / 2;
        const y = (wall.y + i) * gridSize + (gridSize - imageSize) / 2;
        ctx.drawImage(wallImage, x, y, imageSize, imageSize);
      }
    } else {
      for (let i = 0; i < wall.length; i++) {
        // Center the image in the grid cell
        const x = (wall.x + i) * gridSize + (gridSize - imageSize) / 2;
        const y = wall.y * gridSize + (gridSize - imageSize) / 2;
        ctx.drawImage(wallImage, x, y, imageSize, imageSize);
      }
    }
  });

  if (!gameStarted && snake.length > 0) {
    const head = snake[0];
    ctx.save();
    ctx.translate(head.x * gridSize + gridSize/2, head.y * gridSize + gridSize/2);
    ctx.rotate(Math.PI * 1.5);
    ctx.drawImage(headImage, -imageSize/2, -imageSize/2, imageSize, imageSize);
    ctx.restore();
  }

  snake.forEach((segment, index) => {
    const ctx_save = ctx.save();
    
    if (index === 0) {
      let rotation = Math.PI * 1.5;
      if (direction.x === 1) rotation = Math.PI * 1.5;
      else if (direction.x === -1) rotation = Math.PI * 0.5;
      else if (direction.y === -1) rotation = Math.PI;
      else if (direction.y === 1) rotation = 0;
      
      ctx.translate(segment.visualX * gridSize + gridSize/2, segment.visualY * gridSize + gridSize/2);
      ctx.rotate(rotation);
      ctx.drawImage(headImage, -imageSize/2, -imageSize/2, imageSize, imageSize);
    } else {
      const prevSegment = snake[index - 1];
      const dx = segment.x - prevSegment.x;
      const dy = segment.y - prevSegment.y;
      let rotation = 0;
      
      if (dx === 1) rotation = Math.PI/2;
      else if (dx === -1) rotation = -Math.PI/2;
      else if (dy === -1) rotation = 0;
      else if (dy === 1) rotation = Math.PI;
      
      ctx.translate(segment.visualX * gridSize + gridSize/2, segment.visualY * gridSize + gridSize/2);
      ctx.rotate(rotation);
      ctx.drawImage(tailImage, -imageSize/2, -imageSize/2, imageSize, imageSize);
    }
    
    ctx.restore();
  });
  
  if (isPvpMode && aiSnake.length > 0) {
    aiSnake.forEach((segment, index) => {
      const ctx_save = ctx.save();
      
      ctx.filter = 'hue-rotate(180deg)';
      
      if (index === 0) {
        let rotation = Math.PI * 1.5;
        if (aiDirection.x === 1) rotation = Math.PI * 1.5;
        else if (aiDirection.x === -1) rotation = Math.PI * 0.5;
        else if (aiDirection.y === -1) rotation = Math.PI;
        else if (aiDirection.y === 1) rotation = 0;
        
        ctx.translate(segment.visualX * gridSize + gridSize/2, segment.visualY * gridSize + gridSize/2);
        ctx.rotate(rotation);
        ctx.drawImage(headImage, -imageSize/2, -imageSize/2, imageSize, imageSize);
      } else {
        const prevSegment = aiSnake[index - 1];
        const dx = segment.x - prevSegment.x;
        const dy = segment.y - prevSegment.y;
        let rotation = 0;
        
        if (dx === 1) rotation = Math.PI/2;
        else if (dx === -1) rotation = -Math.PI/2;
        else if (dy === -1) rotation = 0;
        else if (dy === 1) rotation = Math.PI;
        
        ctx.translate(segment.visualX * gridSize + gridSize/2, segment.visualY * gridSize + gridSize/2);
        ctx.rotate(rotation);
        ctx.drawImage(tailImage, -imageSize/2, -imageSize/2, imageSize, imageSize);
      }
      
      ctx.filter = 'none';
      ctx.restore();
    });
  }

  if (specialSnakeActive && specialSnake.length > 0) {
    specialSnake.forEach((segment, index) => {
      const ctx_save = ctx.save();
      
      ctx.filter = 'hue-rotate(100deg)';
      
      if (index === 0) {
        let rotation = Math.PI * 1.5;
        if (specialSnakeDirection.x === 1) rotation = Math.PI * 1.5;
        else if (specialSnakeDirection.x === -1) rotation = Math.PI * 0.5;
        else if (specialSnakeDirection.y === -1) rotation = Math.PI;
        else if (specialSnakeDirection.y === 1) rotation = 0;
        
        ctx.translate(segment.visualX * gridSize + gridSize/2, segment.visualY * gridSize + gridSize/2);
        ctx.rotate(rotation);
        ctx.drawImage(headImage, -imageSize/2, -imageSize/2, imageSize, imageSize);
      } else {
        const prevSegment = specialSnake[index - 1];
        const dx = segment.x - prevSegment.x;
        const dy = segment.y - prevSegment.y;
        let rotation = 0;
        
        if (dx === 1) rotation = Math.PI/2;
        else if (dx === -1) rotation = -Math.PI/2;
        else if (dy === -1) rotation = 0;
        else if (dy === 1) rotation = Math.PI;
        
        ctx.translate(segment.visualX * gridSize + gridSize/2, segment.visualY * gridSize + gridSize/2);
        ctx.rotate(rotation);
        ctx.drawImage(tailImage, -imageSize/2, -imageSize/2, imageSize, imageSize);
      }
      
      ctx.filter = 'none';
      ctx.restore();
    });
  }

  foods.forEach(food => {
    // Center the food image in the grid cell
    const x = food.x * gridSize + (gridSize - imageSize) / 2;
    const y = food.y * gridSize + (gridSize - imageSize) / 2;
    ctx.drawImage(foodImage, x, y, imageSize, imageSize);
  });
}

let respawnTimerInterval = null;
let timerPaused = false;
let savedTimeLeft = 0;
let timerWasVisible = false;

let specialSnakeTimerInterval = null;
let specialSnakeTimerPaused = false;
let specialSnakeSavedTimeLeft = 60; 
let specialSnakeActive = false;
let specialSnake = [];
let specialSnakeDirection = {x: 0, y: 0};
let specialSnakeHealth = 3;

function clearRespawnTimer() {
  if (respawnTimerInterval) {
    clearInterval(respawnTimerInterval);
    respawnTimerInterval = null;
  }
  const respawnTimer = document.getElementById('respawn-timer');
  if (respawnTimer) {
    respawnTimer.classList.remove('active');
    document.getElementById('timer-value').textContent = '0:20';
    console.log('Resetting respawn timer');
  }
  timerPaused = false;
  savedTimeLeft = 0;
  timerWasVisible = false;
}

function clearSpecialSnakeTimer() {
  if (specialSnakeTimerInterval) {
    clearInterval(specialSnakeTimerInterval);
    specialSnakeTimerInterval = null;
  }
  specialSnakeTimerPaused = false;
  specialSnakeSavedTimeLeft = 60; 
  specialSnakeActive = false;
  specialSnake = [];
}

function startSpecialSnakeTimer() {
  clearSpecialSnakeTimer();
  
  let timeLeft = 60; 
  
  specialSnakeTimerInterval = setInterval(() => {
    if (!gameRunning) return; 
    
    timeLeft--;
    
    if (timeLeft <= 0) {
      clearSpecialSnakeTimer();
      spawnSpecialEnemySnake();
    }
  }, 1000);
}

function spawnSpecialEnemySnake() {
  specialSnakeActive = true;
  specialSnakeHealth = 3;
  
  const specialX = tileCount - 1;
  const specialY = 0; 
  
  const isOccupied = 
    walls.some(wall => {
      if (wall.isVertical) {
        return specialX === wall.x && specialY >= wall.y && specialY < wall.y + wall.length;
      } else {
        return specialY === wall.y && specialX >= wall.x && specialX < wall.x + wall.length;
      }
    }) ||
    foods.some(food => food.x === specialX && food.y === specialY) ||
    (aiSnake.length > 0 && aiSnake.some(segment => 
      segment.x === specialX && segment.y === specialY
    ));
  
  const finalX = isOccupied ? tileCount - 2 : tileCount - 1;
  
  specialSnake = [{x: finalX, y: specialY, visualX: finalX, visualY: specialY}];
  specialSnakeDirection = {x: 0, y: 0};
}

function gameOver() {
  gameRunning = false;
  startButton.textContent = 'Start Game';
  
  updateScoreDisplay();
  document.getElementById('scoreValue').textContent = `${score} (💀)`;
  
  const currentDifficulty = document.getElementById('difficulty').value;
  if (score > getHighScore(currentDifficulty)) {
    highScore = score;
    setHighScore(currentDifficulty, score);
    document.getElementById('highScoreValue').textContent = highScore;
  }
  
  clearRespawnTimer();
  clearSpecialSnakeTimer();
}

const startButton = document.getElementById('startButton');

let gameSpeed = baseGameSpeed;

function updateGameSpeed() {
  const difficulty = document.getElementById('difficulty').value;
  isPvpMode = difficulty === 'pvp';
  
  const healthBarsContainer = document.getElementById('health-bars-container');
  const respawnTimer = document.getElementById('respawn-timer');
  
  if (isPvpMode) {
    healthBarsContainer.style.display = 'flex';
    respawnTimer.style.display = 'inline-block';
    updateHealthBars();
  } else {
    healthBarsContainer.style.display = 'none';
    respawnTimer.style.display = 'none';
  }
  
  switch (difficulty) {
    case 'easy':
      gameSpeed = baseGameSpeed * 1.4;
      break;
    case 'hard':
      gameSpeed = baseGameSpeed * 0.95;
      break;
    case 'pvp':
      gameSpeed = baseGameSpeed * 1.4; 
      break;
    default:
      gameSpeed = baseGameSpeed * 1.05;
  }
  generateWalls();
}

function updateHealthBars() {
  const aiHealthBar = document.getElementById('ai-health-bar');
  const playerHealthBar = document.getElementById('player-health-bar');
  const aiHealthPercentage = (aiHealth / 3) * 100;
  const playerHealthPercentage = (playerHealth / 3) * 100;
  aiHealthBar.style.width = `${aiHealthPercentage}%`;
  playerHealthBar.style.width = `${playerHealthPercentage}%`;
}

function updateScoreDisplay() {
  const tailPoints = snake.length * 10;
  
  score = tailPoints + enemyDefeatPoints;
  
  document.getElementById('scoreValue').textContent = score;
}

function updateScoreDisplays() {
  document.getElementById('scoreValue').textContent = score;
  document.getElementById('highScoreValue').textContent = highScore;
  
  if (isPvpMode) {
    document.getElementById('snakesEatenValue').textContent = snakesEaten;
  }
}

function updateAiHealthBar() {
  updateHealthBars();
}

document.getElementById('difficulty').addEventListener('change', () => {
  const difficulty = document.getElementById('difficulty').value;
  
  if (difficulty === 'easy' && window.initializeEasyMode) {
    window.initializeEasyMode();
  } else if (difficulty === 'medium' && window.initializeMediumMode) {
    window.initializeMediumMode();
  } else if (difficulty === 'hard' && window.initializeHardMode) {
    window.initializeHardMode();
  } else if (difficulty === 'pvp' && window.initializePvpMode) {
    window.initializePvpMode();
  } else {
    updateGameSpeed();
    
    foods = [];
    foods.push(generateFood());
    
    if (difficulty === 'easy' || difficulty === 'pvp') {
      foods.push(generateFood());
    }
  }
  
  highScore = getHighScore(difficulty);
  document.getElementById('highScoreValue').textContent = highScore;
  
  const snakesEatenDisplay = document.querySelector('.snakes-eaten');
  if (snakesEatenDisplay) {
    snakesEatenDisplay.style.display = difficulty === 'pvp' ? 'block' : 'none';
  }
});

startButton.addEventListener('click', () => {
  if (gameRunning) {
    gameRunning = false;
    startButton.textContent = 'Resume';
    
    if (respawnTimerInterval) {
      clearInterval(respawnTimerInterval);
      respawnTimerInterval = null;
      timerPaused = true;
      
      const respawnTimer = document.getElementById('respawn-timer');
      timerWasVisible = respawnTimer && respawnTimer.classList.contains('active');
      
      const timerValue = document.getElementById('timer-value').textContent;
      const parts = timerValue.split(':');
      savedTimeLeft = parseInt(parts[0]) * 60 + parseInt(parts[1]);
      console.log('Timer paused with ' + savedTimeLeft + ' seconds left');
    }
    
    if (specialSnakeTimerInterval) {
      clearInterval(specialSnakeTimerInterval);
      specialSnakeTimerInterval = null;
      specialSnakeTimerPaused = true;
    }
    return;
  }
  
  if (startButton.textContent === 'Resume') {
    gameRunning = true;
    startButton.textContent = 'Pause';
    
      if (timerPaused && timerWasVisible && savedTimeLeft > 0) {
        const respawnTimer = document.getElementById('respawn-timer');
        respawnTimer.classList.add('active');
        console.log('Restoring timer with ' + savedTimeLeft + ' seconds left');
      
      let timeLeft = savedTimeLeft;
      
      const updateTimer = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timer-value').textContent = formattedTime;
      };
      
      updateTimer();
      
      respawnTimerInterval = setInterval(() => {
        if (!gameRunning) return; 
        
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
          clearRespawnTimer();
          
          aiHealth = 3;
          updateHealthBars();
          
          const aiX = 0;
          const aiY = Math.floor(tileCount / 2);
          
          aiSnake = [{
            x: aiX,
            y: aiY,
            visualX: aiX,
            visualY: aiY
          }];
          
          aiDirection = {x: 1, y: 0};
          
        }
      }, 1000);
    }
    
    if (specialSnakeTimerPaused) {
      let timeLeft = specialSnakeSavedTimeLeft;
      
      specialSnakeTimerInterval = setInterval(() => {
        if (!gameRunning) return; 
        
        timeLeft--;
        specialSnakeSavedTimeLeft = timeLeft;
        
        if (timeLeft <= 0) {
          clearSpecialSnakeTimer();
          spawnSpecialEnemySnake();
        }
      }, 1000);
      
      specialSnakeTimerPaused = false;
    }
    
    gameLoop();
    return;
  }
  
  if (!imagesLoaded) return;
  snake = [{x: 10, y: 10, visualX: 10, visualY: 10}];
  direction = {x: 0, y: 0};
  score = 0;
  enemyDefeatPoints = 0;
  updateScoreDisplay();  
  snakesEaten = 0; 
  gameStarted = false;
  aiHealth = 3; 
  playerHealth = 3; 
  updateGameSpeed();
  generateWalls();
  foods = [];
  foods.push(generateFood());
  clearRespawnTimer();
  
  startSpecialSnakeTimer();
  
  if (isPvpMode) {
    let aiX, aiY;
    do {
      aiX = Math.floor(Math.random() * tileCount);
      aiY = Math.floor(Math.random() * tileCount);
    } while (
      snake.some(segment => 
        Math.abs(segment.x - aiX) < 3 && Math.abs(segment.y - aiY) < 3
      ) ||
      walls.some(wall => {
        if (wall.isVertical) {
          return aiX === wall.x && aiY >= wall.y && aiY < wall.y + wall.length;
        } else {
          return aiY === wall.y && aiX >= wall.x && aiX < wall.x + wall.length;
        }
      }) ||
      foods.some(food => food.x === aiX && food.y === aiY)
    );
    
    aiSnake = [{x: aiX, y: aiY, visualX: aiX, visualY: aiY}];
    aiDirection = {x: 0, y: 0};
    foods.push(generateFood());
    updateAiHealthBar(); 
  } else {
    aiSnake = [];
    if (document.getElementById('difficulty').value === 'easy') {
      foods.push(generateFood());
    }
  }
  
  document.getElementById('scoreValue').textContent = score;
  gameRunning = true;
  startButton.textContent = 'Pause';
  gameLoop();
});

startButton.disabled = true;

let touchStartX = 0;
let touchStartY = 0;
const MIN_SWIPE_DISTANCE = 30;

document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', e => {
  if (e.target.closest('#gameCanvas') || e.target.closest('.d-pad')) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('touchend', e => {
  if (!gameRunning) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE && Math.abs(deltaY) < MIN_SWIPE_DISTANCE) return;
  
  let newDirection = {...direction};
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0 && direction.x === 0) {
      newDirection = {x: 1, y: 0};
    } else if (deltaX < 0 && direction.x === 0) {
      newDirection = {x: -1, y: 0};
    }
  } else {
    if (deltaY > 0 && direction.y === 0) {
      newDirection = {x: 0, y: 1};
    } else if (deltaY < 0 && direction.y === 0) {
      newDirection = {x: 0, y: -1};
    }
  }
  
  if (!gameStarted && (newDirection.x !== 0 || newDirection.y !== 0)) {
    gameStarted = true;
  }
  direction = newDirection;
});

const dPadButtons = document.querySelectorAll('.d-pad button');
dPadButtons.forEach(button => {
  button.addEventListener('touchstart', function(e) {
    e.preventDefault();
    if (!gameRunning) return;
    
    let newDirection = {...direction};
    switch (button.className) {
      case 'up':
        if (direction.y === 0) newDirection = {x: 0, y: -1};
        break;
      case 'down':
        if (direction.y === 0) newDirection = {x: 0, y: 1};
        break;
      case 'left':
        if (direction.x === 0) newDirection = {x: -1, y: 0};
        break;
      case 'right':
        if (direction.x === 0) newDirection = {x: 1, y: 0};
        break;
    }
    
    if (!gameStarted && (newDirection.x !== 0 || newDirection.y !== 0)) {
      gameStarted = true;
    }
    direction = newDirection;
    button.classList.add('active');
  });
  
  button.addEventListener('touchend', function(e) {
    e.preventDefault();
    button.classList.remove('active');
  });
  
  button.addEventListener('touchmove', function(e) {
    e.preventDefault();
  });
  
  button.addEventListener('click', () => {
    if (!gameRunning) return;
    
    let newDirection = {...direction};
    switch (button.className) {
      case 'up':
        if (direction.y === 0) newDirection = {x: 0, y: -1};
        break;
      case 'down':
        if (direction.y === 0) newDirection = {x: 0, y: 1};
        break;
      case 'left':
        if (direction.x === 0) newDirection = {x: -1, y: 0};
        break;
      case 'right':
        if (direction.x === 0) newDirection = {x: 1, y: 0};
        break;
    }
    
    if (!gameStarted && (newDirection.x !== 0 || newDirection.y !== 0)) {
      gameStarted = true;
    }
    direction = newDirection;
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.code === 'Space') {
    startButton.click();
    e.preventDefault(); 
    return;
  }
  
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
  }
  
  if (!gameRunning) return;
  
  let newDirection = {...direction};
  switch (e.key) {
    case 'ArrowUp':
      if (direction.y === 0) newDirection = {x: 0, y: -1};
      break;
    case 'ArrowDown':
      if (direction.y === 0) newDirection = {x: 0, y: 1};
      break;
    case 'ArrowLeft':
      if (direction.x === 0) newDirection = {x: -1, y: 0};
      break;
    case 'ArrowRight':
      if (direction.x === 0) newDirection = {x: 1, y: 0};
      break;
  }
  
  if (!gameStarted && (newDirection.x !== 0 || newDirection.y !== 0)) {
    gameStarted = true;
  }
  direction = newDirection;
});

canvas.width = tileCount * gridSize;
canvas.height = tileCount * gridSize;