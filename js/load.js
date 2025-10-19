// Файл для контроля порядка загрузки
console.log('Starting game load sequence...');

const scripts = [
    'js/config.js',
    'js/assets.js', 
    'js/platforms.js',
    'js/player.js',
    'js/game.js',
    'js/telegram.js'
];

let loadedCount = 0;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            loadedCount++;
            console.log(`✅ Loaded: ${src} (${loadedCount}/${scripts.length})`);
            resolve();
        };
        script.onerror = (error) => {
            console.error(`❌ Failed to load: ${src}`, error);
            loadedCount++;
            resolve(); // Продолжаем загрузку даже при ошибке
        };
        document.head.appendChild(script);
    });
}

async function loadAllScripts() {
    try {
        console.log('🚀 Starting script loading...');
        
        for (const script of scripts) {
            await loadScript(script);
        }
        
        console.log('🎉 All scripts loaded successfully!');
        
        // Даем дополнительное время для инициализации классов
        setTimeout(() => {
            try {
                if (window.DoodleJumpGame) {
                    window.game = new DoodleJumpGame();
                    console.log('🎮 Game instance created successfully!');
                } else {
                    console.error('❌ DoodleJumpGame class not available');
                    showError('Game classes not loaded properly. Please refresh.');
                }
            } catch (error) {
                console.error('❌ Error creating game instance:', error);
                showError('Error starting game: ' + error.message);
            }
        }, 1000);
        
    } catch (error) {
        console.error('💥 Error loading scripts:', error);
        showError('Error loading game. Please refresh the page.');
    }
}

function showError(message) {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingText = document.getElementById('loadingText');
    
    if (loadingScreen && loadingText) {
        loadingText.textContent = message;
        loadingText.style.color = '#e74c3c';
        
        // Добавляем кнопку перезагрузки
        const reloadButton = document.createElement('button');
        reloadButton.textContent = 'Reload Game';
        reloadButton.className = 'button';
        reloadButton.style.marginTop = '20px';
        reloadButton.onclick = () => window.location.reload();
        
        loadingScreen.appendChild(reloadButton);
    }
}

// Запускаем загрузку когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllScripts);
} else {
    loadAllScripts();
}