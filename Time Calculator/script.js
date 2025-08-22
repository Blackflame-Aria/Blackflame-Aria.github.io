document.addEventListener('DOMContentLoaded', () => {
    initializeCalculator('time-input', 'calculate-btn', 'result', 'explanation');
    initializeCalculator('time-input-2', 'calculate-btn-2', 'result-2', 'explanation-2');
});

function initializeCalculator(inputId, buttonId, resultId, explanationId) {
    const isSecondCalculator = inputId === 'time-input-2';

    const timeInput = document.getElementById(inputId);
    const calculateBtn = document.getElementById(buttonId);
    const resultDisplay = document.getElementById(resultId);
    const explanationDisplay = document.getElementById(explanationId);

    timeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateTime();
        }
    });
    
    calculateBtn.addEventListener('click', () => {
        calculateTime();
    });

    function calculateTime() {
        if (isSecondCalculator) {
            calculatePercentageTime();
            return;
        }

        const expression = timeInput.value.trim();
        
        if (!expression) {
            showError('Please enter a time expression');
            return;
        }

        try {
            const operators = expression.match(/[+-]/g) || [];
            const timeValues = expression.split(/[+-]/).map(part => part.trim());
            
            if (timeValues.length === 0) {
                showError('Invalid expression format');
                return;
            }
            for (const timeValue of timeValues) {
                if (!isValidTimeFormat(timeValue)) {
                    showError(`Invalid time format: ${timeValue}. Use format: hours.minutes (e.g., 6.5 for 6h 50m)`);
                    return;
                }
            }

            let [initialHours, initialMinutes] = parseTimeValue(timeValues[0]);
            let totalHours = initialHours;
            let totalMinutes = initialMinutes;
            let explanationText = [`${initialHours}h ${initialMinutes}m`];

            for (let i = 0; i < operators.length; i++) {
                const [hours, minutes] = parseTimeValue(timeValues[i + 1]);
                const operator = operators[i];

                if (operator === '+') {
                    totalHours += hours;
                    totalMinutes += minutes;
                    explanationText.push('+');
                } else if (operator === '-') {
                    let totalInMinutes = totalHours * 60 + totalMinutes;
                    let subtractInMinutes = hours * 60 + minutes;
                    
                    if (totalInMinutes < subtractInMinutes) {
                        showError('Cannot subtract more time than available');
                        return;
                    }
                    
                    totalInMinutes -= subtractInMinutes;
                    
                    totalHours = Math.floor(totalInMinutes / 60);
                    totalMinutes = totalInMinutes % 60;
                    explanationText.push('-');
                }
                
                explanationText.push(`${hours}h ${minutes}m`);
            }

            if (totalMinutes >= 60) {
                const additionalHours = Math.floor(totalMinutes / 60);
                totalHours += additionalHours;
                totalMinutes %= 60;
            }

            const formattedResult = `${totalHours}.${totalMinutes.toString().padStart(2, '0')}`;
            
            resultDisplay.textContent = `${totalHours}h ${totalMinutes}m`;
            resultDisplay.style.color = '#0f0';
            explanationDisplay.textContent = `${explanationText.join(' ')} = ${totalHours}h ${totalMinutes}m`;
        } catch (error) {
            showError('Error calculating time: ' + error.message);
        }
    }

    function parseTimeValue(timeValue) {
        const parts = timeValue.split('.');
        
        if (parts.length === 1) {
            return [parseInt(parts[0]), 0];
        } else if (parts.length === 2) {
            let hours = parseInt(parts[0]);
            
            let minutes;
            if (parts[1].length === 1) {
                minutes = parseInt(parts[1]) * 10;
            } else {
                minutes = parseInt(parts[1]);
            }
            
            if (minutes > 59) {
                const additionalHours = Math.floor(minutes / 60);
                hours += additionalHours;
                minutes = minutes % 60;
            }
            
            return [hours, minutes];
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

    function calculatePercentageTime() {
        const value = timeInput.value.trim();
        
        if (!value) {
            showError('Please enter a time value');
            return;
        }

        try {
            const [hours, decimal] = value.split('.');
            const hoursNum = parseInt(hours);
            
            if (isNaN(hoursNum)) {
                showError('Invalid hour format');
                return;
            }

            let minutes = 0;
            if (decimal) {
                const percentage = parseFloat('0.' + decimal);
                const exactMinutes = percentage * 60;
                const exactSeconds = (exactMinutes % 1) * 60;

                if (Math.abs(exactSeconds - 30) < 0.001) {
                    minutes = Math.floor(exactMinutes) + 0.5;
                } else {
                    minutes = Math.round(exactMinutes);
                }
            }
            const formattedResult = minutes % 1 === 0 ? 
                `${hoursNum}.${minutes.toString().padStart(2, '0')}` :
                `${hoursNum}.${Math.floor(minutes).toString().padStart(2, '0')}.5`;

            resultDisplay.textContent = `${hoursNum}h ${minutes}m`;
            resultDisplay.style.color = '#0f0';

        } catch (error) {
            showError('Error calculating time: ' + error.message);
        }
    }

    function showError(message) {
        resultDisplay.textContent = message;
        resultDisplay.style.color = '#ff0000';
        explanationDisplay.textContent = '';
        explanationDisplay.textContent = message;
    }
};