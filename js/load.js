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
            console.log(`Loaded: ${src} (${loadedCount}/${scripts.length})`);
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function loadAllScripts() {
    try {
        for (const script of scripts) {
            await loadScript(script);
        }
        console.log('All scripts loaded successfully!');
    } catch (error) {
        console.error('Error loading scripts:', error);
    }
}

// Запускаем загрузку когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllScripts);
} else {
    loadAllScripts();
}