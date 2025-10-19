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
            // Продолжаем загрузку даже при ошибке одного скрипта
            resolve();
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
                    
                    // Скрываем loading screen после успешной загрузки
                    setTimeout(() => {
                        const loadingScreen = document.getElementById('loadingScreen');
                        if (loadingScreen) {
                            loadingScreen.style.display = 'none';
                        }
                    }, 500);
                    
                } else {
                    console.error('❌ DoodleJumpGame class not available');
                    showMobileError('Game failed to load. Please check your connection and refresh.');
                }
            } catch (error) {
                console.error('❌ Error creating game instance:', error);
                showMobileError('Error starting game: ' + error.message);
            }
        }, 1000);
        
    } catch (error) {
        console.error('💥 Error loading scripts:', error);
        showMobileError('Error loading game. Please refresh the page.');
    }
}

function showMobileError(message) {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingText = document.getElementById('loadingText');
    
    if (loadingScreen && loadingText) {
        loadingText.textContent = message;
        loadingText.style.color = '#e74c3c';
        loadingText.style.fontSize = '16px';
        loadingText.style.padding = '0 20px';
        loadingText.style.textAlign = 'center';
        
        // Добавляем кнопку перезагрузки для мобильных
        const reloadButton = document.createElement('button');
        reloadButton.textContent = 'Reload Game';
        reloadButton.style.marginTop = '20px';
        reloadButton.style.padding = '10px 20px';
        reloadButton.style.background = '#FF6B6B';
        reloadButton.style.color = 'white';
        reloadButton.style.border = 'none';
        reloadButton.style.borderRadius = '25px';
        reloadButton.style.cursor = 'pointer';
        reloadButton.style.fontSize = '16px';
        reloadButton.onclick = () => window.location.reload();
        
        loadingScreen.appendChild(reloadButton);
    }
}

// Проверяем мобильное устройство
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Запускаем загрузку когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📱 Mobile device detected:', isMobileDevice());
        loadAllScripts();
    });
} else {
    console.log('📱 Mobile device detected:', isMobileDevice());
    loadAllScripts();
}