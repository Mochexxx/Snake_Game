document.addEventListener('DOMContentLoaded', () => {
    const preMainMenu = document.getElementById('preMainMenu');
    const mainMenu = document.getElementById('mainMenu');
    const snakeTextContainer = document.getElementById('snakeText');
    const gameTextContainer = document.getElementById('gameText');
    const pressKeyMessage = document.getElementById('pressKeyMessage');

    const textToAnimateSnake = "SNAKE";
    const textToAnimateGame = "GAME";
    let animationTimeout; // Stores the timeout for the current animation sequence

    // --- SVG Letter Creation ---
    function createLetterSVG(letterCharacter, letterIndexInWord) {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        // Unique ID for clipPath, incorporating letter and a random component
        const letterID = `letter-${letterCharacter}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        // Simplified block-style SVG paths for letters
        const letterPaths = {
            'S': "M30,15 L10,15 L10,35 L30,35 L30,55 L10,55",
            'N': "M10,55 L10,15 L30,55 L30,15",
            'A': "M10,55 L20,15 L30,55 M12,40 L28,40",
            'K': "M10,55 L10,15 M30,15 L10,35 L30,55",
            'E': "M30,15 L10,15 L10,55 L30,55 M10,35 L25,35",
            'G': "M30,15 L10,15 L10,55 L30,55 L30,35 L20,35",
            'M': "M10,55 L10,15 L20,35 L30,15 L30,55"
        };

        const pathData = letterPaths[letterCharacter.toUpperCase()];
        if (!pathData) {
            console.warn(`SVG path for letter ${letterCharacter} not defined.`);
            return null; 
        }

        svg.setAttribute("viewBox", "0 0 40 70"); // ViewBox for path coordinates
        svg.setAttribute("width", "5vw");    // Responsive width for the SVG container
        svg.setAttribute("height", "8vw");   // Responsive height
        svg.style.margin = `0 0.3vw`;      // Spacing between SVGs
        svg.style.overflow = 'hidden'; // Changed from visible to hidden for cleaner clipPath

        // 1. ClipPath for reveal animation
        const clipPath = document.createElementNS(svgNS, "clipPath");
        const clipPathID = `clip-${letterID}`;
        clipPath.setAttribute("id", clipPathID);
        const clipRect = document.createElementNS(svgNS, "rect");
        clipRect.setAttribute("x", "0");
        clipRect.setAttribute("y", "70"); // Start fully clipped (rect is at the bottom, revealing nothing)
        clipRect.setAttribute("width", "40"); // Cover the viewBox width
        clipRect.setAttribute("height", "70"); // Cover the viewBox height
        clipPath.appendChild(clipRect);
        svg.appendChild(clipPath);

        // 2. The letter path (the "snake")
        const pathElement = document.createElementNS(svgNS, "path");
        pathElement.setAttribute("d", pathData);
        pathElement.setAttribute("stroke", "#32CD32"); // Lime Green
        pathElement.setAttribute("stroke-width", "4");  // Snake thickness
        pathElement.setAttribute("stroke-linecap", "round");
        pathElement.setAttribute("stroke-linejoin", "round");
        pathElement.setAttribute("fill", "none");
        pathElement.setAttribute("clip-path", `url(#${clipPathID})`); // Apply the clipPath

        // Estimate path length for dash animation (a general value)
        const estimatedPathLength = 250; // Adjust if letters are more complex
        pathElement.style.strokeDasharray = estimatedPathLength;
        pathElement.style.strokeDashoffset = estimatedPathLength; // Start fully "undrawn"

        svg.appendChild(pathElement);

        // --- Animations (using CSS transitions triggered by JS) ---
        const revealDelay = letterIndexInWord * 200; // Stagger start of reveal for each letter

        // Reveal animation (moving the clipRect up)
        setTimeout(() => {
            clipRect.style.transition = "y 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)"; // Smoother ease for reveal
            clipRect.setAttribute("y", "0"); // Move rect to top, revealing the path

            // Snake drawing animation (stroke-dashoffset)
            // Starts slightly after the reveal begins to ensure the area is visible
            setTimeout(() => {
                pathElement.style.transition = "stroke-dashoffset 1.2s ease-in-out";
                pathElement.style.strokeDashoffset = "0"; // "Draw" the snake
            }, 150); // Delay for drawing start

        }, revealDelay);

        return svg;
    }

    // --- Word Animation Orchestration ---
    function animateWord(text, container, baseDelayForWordStart, onWordCompleteCallback) {
        let currentLetterIndex = 0;
        container.innerHTML = ''; // Clear any previous content

        function addNextLetter() {
            if (currentLetterIndex < text.length) {
                const letterSvg = createLetterSVG(text[currentLetterIndex], currentLetterIndex);
                if (letterSvg) {
                    container.appendChild(letterSvg);
                }
                currentLetterIndex++;
                // Timeout for adding the next letter's SVG structure to the DOM
                // The actual animation of each letter is staggered by `revealDelay` inside `createLetterSVG`
                animationTimeout = setTimeout(addNextLetter, 250); // Controls rate of letter SVG addition
            } else if (onWordCompleteCallback) {
                // Estimate when the last letter's animation might finish
                const lastLetterRevealDelay = (text.length - 1) * 200; // revealDelay for last letter
                const revealDuration = 700;  // clipRect transition
                const drawDuration = 1200; // stroke-dashoffset transition
                // Max time: stagger + reveal + draw (draw starts 150ms into reveal)
                const estimatedWordAnimTime = lastLetterRevealDelay + revealDuration + drawDuration - 150;
                
                animationTimeout = setTimeout(onWordCompleteCallback, estimatedWordAnimTime);
            }
        }
        // Initial delay before starting the first letter of this word
        animationTimeout = setTimeout(addNextLetter, baseDelayForWordStart);
    }

    // --- Full Title Animation Sequence ---
    function startFullTitleAnimation() {
        // Clear any globally tracked animationTimeout. This is mostly for the pressKeyMessage timeout.
        // Internal timeouts from animateWord are harder to clear globally with this simple model if skip happens mid-word.
        if (animationTimeout) {
            clearTimeout(animationTimeout);
        }

        // Start animating "SNAKE". Pass null as the onWordCompleteCallback 
        // because we will manage the final "Press any key" message timing globally.
        animateWord(textToAnimateSnake, snakeTextContainer, 0, null);

        // Start animating "GAME" simultaneously by calling it immediately after "SNAKE"
        // with a baseDelayForWordStart of 0. Also pass null for its callback.
        animateWord(textToAnimateGame, gameTextContainer, 0, null);

        // Calculate when to show the "Press any key" message.
        // This should be after the longer of the two word animations has completed.
        const PRESS_KEY_MESSAGE_DELAY_MS = 500; // Buffer after animations complete

        const letterStagger = 200; // From createLetterSVG: revealDelay = letterIndexInWord * 200
        const revealDuration = 700;  // From createLetterSVG: clipRect transition duration
        const drawDuration = 1200; // From createLetterSVG: pathElement stroke-dashoffset transition duration
        const drawStartOffset = 150; // Drawing animation starts 150ms into the reveal animation

        // Helper function to calculate the estimated visual completion time for a word's animation.
        // This logic matches the estimation used inside animateWord if it were to call an onWordCompleteCallback.
        const calculateWordAnimTime = (text) => {
            if (!text || text.length === 0) return 0;
            // Time for the last letter's reveal animation to begin
            const lastLetterRevealDelay = (text.length - 1) * letterStagger;
            // Total time is when the last letter's reveal starts, plus its own reveal and draw duration.
            // (drawDuration - drawStartOffset) is the effective time the drawing takes *after* reveal starts.
            return lastLetterRevealDelay + revealDuration + Math.max(0, drawDuration - drawStartOffset);
        };

        const estimatedAnimTimeSnake = calculateWordAnimTime(textToAnimateSnake);
        const estimatedAnimTimeGame = calculateWordAnimTime(textToAnimateGame);

        const timeUntilPressKeyMessage = Math.max(estimatedAnimTimeSnake, estimatedAnimTimeGame) + PRESS_KEY_MESSAGE_DELAY_MS;

        // Set the timeout for showing the "Press any key" message.
        // This specific timeout ID will be stored in the global animationTimeout variable.
        animationTimeout = setTimeout(() => {
            // Ensure we are still on the preMainMenu and the animation hasn't been skipped
            if (preMainMenu.style.display !== 'none' && !animationSkipped) {
                pressKeyMessage.style.opacity = '1';
            }
        }, timeUntilPressKeyMessage);
    }

    // --- Event Handling for Skipping ---
    let animationSkipped = false;
    function handleKeyPress(event) {
        if (animationSkipped || preMainMenu.style.display === 'none') return;
        animationSkipped = true; // Prevent multiple triggers

        clearTimeout(animationTimeout); // Clear the main animation sequence timeout

        // Fast-forward or hide elements
        snakeTextContainer.innerHTML = ''; // Clear partially formed words
        gameTextContainer.innerHTML = '';
        pressKeyMessage.style.opacity = '0'; // Ensure message is hidden if skipped early

        // Apply rotation and then transition
        preMainMenu.classList.add('rotating-out');

        // Wait for the animation to complete before hiding preMainMenu and showing mainMenu
        setTimeout(() => {
            preMainMenu.style.display = 'none';
            preMainMenu.classList.remove('rotating-out'); // Clean up class
            mainMenu.style.display = 'flex';
        }, 700); // Duration of the rotateOut animation

        // Remove listeners after use
        window.removeEventListener('keydown', handleKeyPress);
        window.removeEventListener('click', handleKeyPress);
        window.removeEventListener('touchstart', handleKeyPress);
    }

    // --- Start Animation and Attach Listeners ---
    if (preMainMenu.style.display !== 'none') { // Only start if preMainMenu is visible
        startFullTitleAnimation();
        // Updated to remove { once: true } to allow the new logic in handleKeyPress to manage listeners
        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('click', handleKeyPress);
        window.addEventListener('touchstart', handleKeyPress);
    } else { // If preMainMenu is not visible (e.g. dev tools, direct navigation), ensure mainMenu is
        mainMenu.style.display = 'flex';
    }
});
