const bakuganBattleBrawlers = [
    {
        name: "Dan Kuso",
        age: 12,
        definingTrait: "Audacity",
        bakugan: "Dragonoid",
        element: "Pyrus",
        evolutions: ["Delta Dragonoid", "Ultimate Dragonoid", "Infinity Dragonoid"]
    },
    {
        name: "Runo Misaki",
        age: 12,
        definingTrait: "Rectitude",
        bakugan: "Tigrerra",
        element: "Haos",
        evolution: "Blade Tigrerra",
    },
    {
        name: "Julie Makimoto",
        age: 12,
        definingTrait: "Tenacity",
        bakugan: "Gorem",
        element: "Subterra",
        evolution: "Hammer Gorem",
    },
    {
        name: "Alice Gehabich",
        age: 14,
        definingTrait: "Guile",
        bakugan: "Hydranoid",
        element: "Darkus",
        evolution: "Alpha Hydranoid",
    },
    {
        name: "Shun Kazami",
        age: 13,
        definingTrait: "Cunning",
        bakugan: "Skyress",
        element: "Ventus",
        evolution: "Storm Skyress",
    },
    {
        name: "Marucho Marukura",
        age: 11,
        definingTrait: "Intelligence",
        bakugan: "Preyas",
        element: "Aquos",
        evolution: "Angelo/Diablo Preyas",
    }
];
console.log(bakuganBattleBrawlers);

setTimeout(() => {
    document.getElementById("projects-typewriter").style.visibility = "visible";
}, 2000);

let clickCount = 0;
const body = document.body;
const restoreButton = document.getElementById('restoreCursor');

document.addEventListener('click', (e) => {
    if (e.target !== restoreButton) {
        clickCount++;
        if (clickCount <= 5) {
            updateCursor();
        }
    }
});

restoreButton.addEventListener('click', () => {
    clickCount = 0;
    updateCursor();
});

function updateCursor() {
    body.className = body.className.replace(/cursor-\d/g, '');
    if (clickCount === 1) body.classList.add('cursor-4');
    else if (clickCount === 2) body.classList.add('cursor-3');
    else if (clickCount === 3) body.classList.add('cursor-2');
    else if (clickCount === 4) body.classList.add('cursor-1');
    else if (clickCount >= 5) body.classList.add('cursor-1');
    else body.style.cursor = 'url(images/cursor-full.png), auto';
}