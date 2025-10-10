document.addEventListener('DOMContentLoaded', () => {
    initializeCalculator('time-input', 'calculate-btn', 'result', 'explanation');
    initializeInstructionsToggle();
});

function initializeInstructionsToggle() {
    const toggleBtn = document.getElementById('toggle-instructions');
    const instructionsContent = document.getElementById('instructions-content');
    
    toggleBtn.addEventListener('click', function() {
        if (instructionsContent.style.display === 'none') {
            instructionsContent.style.display = 'block';
            toggleBtn.textContent = '▼';
        } else {
            instructionsContent.style.display = 'none';
            toggleBtn.textContent = '►';
        }
    });
}

function initializeCalculator(inputId, buttonId, resultId, explanationId) {
    const timeInput = document.getElementById(inputId);
    const calculateBtn = document.getElementById(buttonId);
    const resultDisplay = document.getElementById(resultId);
    const explanationDisplay = document.getElementById(explanationId);
    const inputMethodRadios = document.querySelectorAll('input[name="input-method"]');
    
    let currentInputMethod = 'percent';

    inputMethodRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentInputMethod = e.target.value;
            if (currentInputMethod === 'percent') {
                timeInput.placeholder = "Example: 6.5 + 3.25";
            } else {
                timeInput.placeholder = "Example: 6.30 + 3.15";
            }
        });
    });

    adjustInputHeight();

    timeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            calculateTime();
        }
    });
    
    calculateBtn.addEventListener('click', () => {
        calculateTime();
    });

    timeInput.addEventListener('input', adjustInputHeight);
    
    window.addEventListener('resize', adjustInputHeight);

    function adjustInputHeight() {
        const scrollPos = window.scrollY;
        
        timeInput.style.height = 'auto';
        
        const newHeight = Math.max(64, timeInput.scrollHeight);
        timeInput.style.height = newHeight + 'px';
        
        window.scrollTo(0, scrollPos);
    }

    function calculateTime() {
        const expression = timeInput.value.trim();
        
        if (!expression) {
            showError('Please enter a time expression');
            return;
        }

        try {
            const result = evaluateExpression(expression);
            
            const totalHours = Math.floor(result);
            const totalMinutes = Math.round((result - totalHours) * 60);
            
            resultDisplay.textContent = `${totalHours}h ${totalMinutes}m`;
            resultDisplay.style.color = '#0f0';
            explanationDisplay.textContent = `${expression} = ${totalHours}h ${totalMinutes}m`;
        } catch (error) {
            showError('Error calculating time: ' + error.message);
        }
    }

    function evaluateExpression(expression) {
        expression = expression.replace(/x/g, '*');
        
        while (expression.includes('(')) {
            expression = expression.replace(/\(([^()]+)\)/g, (match, group) => {
                return evaluateSimpleExpression(group);
            });
        }
        
        return evaluateSimpleExpression(expression);
    }
    
    function evaluateSimpleExpression(expression) {
        const tokens = expression.split(/([+\-*])/).map(token => token.trim()).filter(token => token);
        
        if (tokens.length === 0) {
            throw new Error('Invalid expression format');
        }
        
        let i = 1;
        while (i < tokens.length) {
            if (tokens[i] === '*') {
                const leftValue = parseTimeValue(tokens[i-1]);
                let rightValue;
                let result;
                
                if (!tokens[i+1].includes('.') && !isNaN(parseFloat(tokens[i+1]))) {
                    rightValue = parseFloat(tokens[i+1]);
                    result = leftValue * rightValue;
                } else {
                    rightValue = parseTimeValue(tokens[i+1]);
                    
                    const rightHours = Math.floor(rightValue);
                    const rightMinutes = (rightValue - rightHours) * 60;
                    
                    const rightScalar = rightHours + (rightMinutes / 60);
                    
                    result = leftValue * rightScalar;
                }
                
                tokens.splice(i-1, 3, result.toString());
                
                i = i - 1;
            } else {
                i += 2;
            }
        }
        
        let result = parseTimeValue(tokens[0]);
        
        for (i = 1; i < tokens.length; i += 2) {
            const operator = tokens[i];
            const value = parseTimeValue(tokens[i+1]);
            
            if (operator === '+') {
                result += value;
            } else if (operator === '-') {
                if (result < value) {
                    throw new Error('Cannot subtract more time than available');
                }
                result -= value;
            }
        }
        
        return result;
    }

    function parseTimeValue(timeValue) {
        if (typeof timeValue === 'number') {
            return timeValue;
        }
        
        timeValue = timeValue.trim();
        
        if (timeValue === '') {
            throw new Error('Empty time value');
        }
        
        if (!isNaN(parseFloat(timeValue))) {
            const value = parseFloat(timeValue);
            if (value.toString().includes('.')) {
                if (currentInputMethod === 'minutes') {
                    const parts = value.toString().split('.');
                    let hours = parseInt(parts[0]);
                    let minutes = 0;
                    
                    if (parts[1]) {
                        if (parts[1].length === 1) {
                            minutes = parseInt(parts[1]) * 10;
                        } else {
                            minutes = parseInt(parts[1]);
                        }
                    }
                    
                    return hours + (minutes / 60);
                } else {
                    return value;
                }
            }
            return value;
        }
        
        const parts = timeValue.split('.');
        
        if (parts.length === 1) {
            return parseInt(parts[0]);
        } else if (parts.length === 2) {
            let hours = parseInt(parts[0]);
            
            let minutes = 0;
            if (parts[1]) {
                if (currentInputMethod === 'percent') {
                    const percentage = parseFloat('0.' + parts[1]);
                    minutes = percentage * 60;
                } else if (currentInputMethod === 'minutes') {
                    if (parts[1].length === 1) {
                        minutes = parseInt(parts[1]) * 10;
                    } else {
                        minutes = parseInt(parts[1]);
                    }
                }
            }
            
            return hours + (minutes / 60);
        }
        
        throw new Error('Invalid time format');
    }

    function isValidTimeFormat(timeValue) {
        const regex = /^\d+(\.\d{1,2})?$/;
        if (!regex.test(timeValue)) {
            return false;
        }
        return true;
    }

    function showError(message) {
        resultDisplay.textContent = message;
        resultDisplay.style.color = '#ff0000';
        explanationDisplay.textContent = '';
        explanationDisplay.textContent = message;
    }
};