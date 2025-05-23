document.addEventListener('DOMContentLoaded', () => {
    const enterMainMenuButton = document.getElementById('enterMainMenuButton');
    if (enterMainMenuButton) {
        enterMainMenuButton.addEventListener('click', function() {
            document.getElementById('preMainMenu').style.display = 'none';
            document.getElementById('mainMenu').style.display = 'flex';
        });
    }
});
