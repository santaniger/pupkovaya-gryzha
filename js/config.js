// config.js - УЛУЧШЕННАЯ КОНФИГУРАЦИЯ
console.log('🔧 Loading game configuration...');

const CANVAS_CONFIG = {
    WIDTH: 360,
    HEIGHT: 600
};

const PLAYER_CONFIG = {
    WIDTH: 40,
    HEIGHT: 40,
    JUMP_FORCE: -12.5,
    GRAVITY: 0.4,
    MAX_SPEED: 6,
    ACCELERATION: 0.3,
    FRICTION: 0.85,
    MAX_FALL_SPEED: 12,
    MAX_JUMP_SPEED: 13
};

const PLATFORMS_CONFIG = {
    WIDTH: 70,
    HEIGHT: 20,
    MIN_GAP: 80,       // Увеличили минимальный разрыв
    MAX_GAP: 150,      // Увеличили максимальный разрыв  
    START_COUNT: 30,   // Уменьшили начальное количество
    MOVE_SPEED: 1.5,
    BREAKING_TIME: 0.5,
    MAX_PLATFORMS: 200, // Уменьшили максимальное количество
    VERTICAL_THRESHOLD: 30, // Минимальное расстояние по Y
    HORIZONTAL_THRESHOLD: 50 // Минимальное расстояние по X
};

const GAME_CONFIG = {
    INITIAL_SCROLL_THRESHOLD: 200,
    SCORE_MULTIPLIER: 0.1,
    DIFFICULTY_INCREASE: 0,
    PLATFORM_SPAWN_RATE: 0.8,
    JUMP_COOLDOWN: 200,
    START_PLATFORM_Y: CANVAS_CONFIG.HEIGHT - 100,
    VICTORY_SCORE: 5000 // Добавили очки для победы
};

const COLORS_CONFIG = {
    PLAYER: '#FF6B6B',
    PLAYER_SHADOW: '#E74C3C',
    PLATFORM_NORMAL: '#2ECC71',
    PLATFORM_BREAKING: '#F39C12',
    PLATFORM_MOVING: '#9B59B6',
    PLATFORM_SHADOW: '#27AE60',
    BACKGROUND_TOP: '#87CEEB',
    BACKGROUND_BOTTOM: '#E0F7FA',
    TEXT_PRIMARY: '#2C3E50',
    TEXT_SECONDARY: '#7F8C8D',
    UI_BACKGROUND: 'rgba(255, 255, 255, 0.95)',
    UI_BORDER: '#34495E'
};

const PLATFORM_PROBABILITIES_CONFIG = {
    NORMAL: 0.7,
    BREAKING: 0.2,
    MOVING: 0.1
};

// Основной CONFIG объект
const CONFIG = {
    CANVAS: CANVAS_CONFIG,
    PLAYER: {
        ...PLAYER_CONFIG,
        START_Y: CANVAS_CONFIG.HEIGHT - 150
    },
    PLATFORMS: PLATFORMS_CONFIG,
    GAME: GAME_CONFIG,
    COLORS: COLORS_CONFIG,
    PLATFORM_PROBABILITIES: PLATFORM_PROBABILITIES_CONFIG
};

// Состояния игры
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    PAUSED: 'paused',
    LOADING: 'loading'
};

// Типы платформ
const PlatformType = {
    NORMAL: 'normal',
    BREAKING: 'breaking',
    MOVING: 'moving'
};

console.log('✅ Config loaded successfully');
console.log('   Canvas:', CONFIG.CANVAS.WIDTH + 'x' + CONFIG.CANVAS.HEIGHT);
console.log('   Player START_Y:', CONFIG.PLAYER.START_Y);
console.log('   Start Platform Y:', CONFIG.GAME.START_PLATFORM_Y);
console.log('   Jump Force:', CONFIG.PLAYER.JUMP_FORCE);
console.log('   Gravity:', CONFIG.PLAYER.GRAVITY);

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        GameState,
        PlatformType
    };
}