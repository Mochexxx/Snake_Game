document.addEventListener('DOMContentLoaded', () => {
    const preMainMenu = document.getElementById('preMainMenu');
    const mainMenu = document.getElementById('mainMenu');
    const snakeTextContainer = document.getElementById('snakeText');
    const gameTextContainer = document.getElementById('gameText');
    const pressKeyMessage = document.getElementById('pressKeyMessage');

    const textToAnimateSnake = "Snake";
    const textToAnimateGame = "Game";
    let animationTimeout;

    function animateText(text, container, callback) {
        let index = 0;
        container.innerHTML = ''; // Clear previous text

        function addCharacter() {
            if (index < text.length) {
                const charSpan = document.createElement('span');
                charSpan.textContent = text[index];
                charSpan.style.opacity = '0';
                charSpan.style.transform = 'translateY(50px)';
                charSpan.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                container.appendChild(charSpan);

                // Trigger the animation
                setTimeout(() => {
                    charSpan.style.opacity = '1';
                    charSpan.style.transform = 'translateY(0)';
                }, 50); // Small delay to ensure transition is applied

                index++;
                animationTimeout = setTimeout(addCharacter, 150); // Adjust speed of letter appearance
            } else if (callback) {
                callback();
            }
        }
        addCharacter();
    }

    function startTitleAnimation() {
        animateText(textToAnimateSnake, snakeTextContainer, () => {
            animateText(textToAnimateGame, gameTextContainer, () => {
                // After both animations complete, show the "Press any key" message
                setTimeout(() => {
                    pressKeyMessage.style.opacity = '1';
                }, 500); // Delay before showing the message
            });
        });
    }

    function handleKeyPress(event) {
        // Check if preMainMenu is currently displayed
        if (preMainMenu.style.display !== 'none') {
            clearTimeout(animationTimeout); // Stop any ongoing animation
            preMainMenu.style.display = 'none';
            mainMenu.style.display = 'flex';
            // Remove the event listener after it has been used
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('click', handleKeyPress); // Also remove click listener
            window.removeEventListener('touchstart', handleKeyPress); // Also remove touch listener
        }
    }

    // Start the title animation when the page loads
    startTitleAnimation();

    // Add event listeners for keydown, click, and touchstart
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('click', handleKeyPress); // Added click listener
    window.addEventListener('touchstart', handleKeyPress); // Added touchstart listener
});
