// Accessibility functions
// document.getElementById('toggle-dark-mode').addEventListener('click', toggleDarkMode);
document.getElementById('toggle-high-contrast').addEventListener('click', toggleHighContrast);
document.getElementById('toggle-large-text').addEventListener('click', toggleLargeText);
document.getElementById('toggle-screen-reader').addEventListener('click', toggleScreenReader);

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    localStorage.setItem('highContrast', document.body.classList.contains('high-contrast'));
}

function toggleLargeText() {
    document.body.classList.toggle('large-text');
    localStorage.setItem('largeText', document.body.classList.contains('large-text'));
}

function toggleScreenReader() {
    const isOptimized = !document.body.classList.contains('screen-reader-optimized');
    document.body.classList.toggle('screen-reader-optimized', isOptimized);
    
    // Add additional ARIA attributes and screen reader specific enhancements
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.setAttribute('role', 'radio');
        option.setAttribute('aria-checked', option.classList.contains('selected'));
    });
    
    localStorage.setItem('screenReaderOptimized', isOptimized);
}

// Load accessibility settings from local storage
function loadAccessibilitySettings() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    
    if (localStorage.getItem('highContrast') === 'true') {
        document.body.classList.add('high-contrast');
    }
    
    if (localStorage.getItem('largeText') === 'true') {
        document.body.classList.add('large-text');
    }
    
    if (localStorage.getItem('screenReaderOptimized') === 'true') {
        document.body.classList.add('screen-reader-optimized');
    }
}

// Initialize accessibility settings
loadAccessibilitySettings();
