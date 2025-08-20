document.addEventListener('DOMContentLoaded', () => {
    const timeInput = document.getElementById('time-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultDisplay = document.getElementById('result');
    const explanationDisplay = document.getElementById('explanation');

    // Handle Enter key press
    timeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateTime();
        }
    });
    
    // Handle button click
    calculateBtn.addEventListener('click', () => {
        calculateTime();
    });

    function calculateTime() {
        const expression = timeInput.value.trim();
        
        if (!expression) {
            showError('Please enter a time expression');
            return;
        }

        try {
            // Split by + and process each time value
            const timeValues = expression.split('+').map(part => part.trim());
            
            if (timeValues.length === 0) {
                showError('Invalid expression format');
                return;
            }

            // Validate each time value
            for (const timeValue of timeValues) {
                if (!isValidTimeFormat(timeValue)) {
                    showError(`Invalid time format: ${timeValue}. Use format: hours.minutes (e.g., 6.5 for 6h 50m)`);
                    return;
                }
            }

            // Calculate total time
            let totalHours = 0;
            let totalMinutes = 0;
            let explanationText = [];

            timeValues.forEach(timeValue => {
                const [hours, minutes] = parseTimeValue(timeValue);
                totalHours += hours;
                totalMinutes += minutes;
                
                explanationText.push(`${hours}h ${minutes}m`);
            });

            // Adjust for minutes overflow
            if (totalMinutes >= 60) {
                const additionalHours = Math.floor(totalMinutes / 60);
                totalHours += additionalHours;
                totalMinutes %= 60;
            }

            // Format the result
            const formattedResult = `${totalHours}.${totalMinutes.toString().padStart(2, '0')}`;
            
            // Display the result
            resultDisplay.textContent = formattedResult;
            resultDisplay.style.color = '#0f0';
            
            // Show explanation
            explanationDisplay.textContent = `${explanationText.join(' + ')} = ${totalHours}h ${totalMinutes}m`;
        } catch (error) {
            showError('Error calculating time: ' + error.message);
        }
    }

    function parseTimeValue(timeValue) {
        // Handle different formats (6.5, 6.50, etc.)
        const parts = timeValue.split('.');
        
        if (parts.length === 1) {
            // Only hours provided
            return [parseInt(parts[0]), 0];
        } else if (parts.length === 2) {
            let hours = parseInt(parts[0]);
            
            // Handle minutes part correctly
            let minutes;
            if (parts[1].length === 1) {
                // If single digit, multiply by 10 (e.g., .5 means 50 minutes)
                minutes = parseInt(parts[1]) * 10;
            } else {
                // Otherwise parse as is
                minutes = parseInt(parts[1]);
            }
            
            // Handle minutes over 59 by converting to additional hours
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
        // Check if the time value matches the expected format
        const regex = /^\d+(\.\d{1,2})?$/;
        if (!regex.test(timeValue)) {
            return false;
        }
        return true;
    }

    function showError(message) {
        resultDisplay.textContent = 'Error';
        resultDisplay.style.color = '#ff0000';
        explanationDisplay.textContent = message;
    }
});