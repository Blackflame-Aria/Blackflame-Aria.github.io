document.getElementById('searchBtn').addEventListener('click', function() {
    const ingredients = document.getElementById('ingredients').value;
    const apiKey = '0ba9ab5fc7ba4e7ea47578283c21e5c5';
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=5&apiKey=${apiKey}`;
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    resultsDiv.innerHTML = '';
    loadingDiv.style.display = 'block';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            loadingDiv.style.display = 'none';
            displayResults(data);
        })
        .catch(error => {
            loadingDiv.style.display = 'none';
            resultsDiv.innerHTML = '<p class="error">Oopsie! Something went wrong. Try again! 💖</p>';
        });
});

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    if (data.length === 0) {
        resultsDiv.innerHTML = '<p class="no-results">No recipes found. Try something yummy! 🌸</p>';
        return;
    }
    data.forEach(recipe => {
        const recipeElement = document.createElement('div');
        recipeElement.className = 'recipe-card fade-in';
        recipeElement.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}">
            <h2>${recipe.title}</h2>
            <p>Used Ingredients: ${recipe.usedIngredientCount}</p>
            <button class="view-recipe" data-id="${recipe.id}">Peek at Recipe</button>
            <div class="recipe-details" style="display: none;"></div>
        `;
        resultsDiv.appendChild(recipeElement);

        recipeElement.querySelector('.view-recipe').addEventListener('click', function() {
            const recipeId = this.getAttribute('data-id');
            const detailsDiv = recipeElement.querySelector('.recipe-details');
            if (detailsDiv.style.display === 'block') {
                detailsDiv.style.display = 'none';
            } else {
                fetchRecipeDetails(recipeId, detailsDiv);
            }
        });
    });
}

function fetchRecipeDetails(recipeId, detailsDiv) {
    const apiKey = '0ba9ab5fc7ba4e7ea47578283c21e5c5';
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;
    detailsDiv.innerHTML = '<p>Loading goodies...</p>';
    detailsDiv.style.display = 'block';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            detailsDiv.innerHTML = `
                <h3>${data.title}</h3>
                <p>${data.summary.replace(/<[^>]+>/g, '')}</p>
                <a href="${data.sourceUrl}" target="_blank">Full Recipe Here! 🌷</a>
            `;
        })
        .catch(error => {
            detailsDiv.innerHTML = '<p class="error">Couldn’t load the recipe. Sorry! 💕</p>';
        });
}