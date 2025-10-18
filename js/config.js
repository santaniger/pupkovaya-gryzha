// config.js - ПОЛНОСТЬЮ ПЕРЕПИСАТЬ
// Конфигурация игры Doodle Jump
console.log('🔧 Loading game configuration...');

// Сначала объявляем базовые настройки без взаимных ссылок
const BASE_CONFIG = {
    // Настройки canvas
    CANVAS: {
        WIDTH: 360,
        HEIGHT: 600
    },
    
    // Настройки игрока
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 40,
        JUMP_FORCE: -10.5,
        GRAVITY: 0.35,
        MAX_SPEED: 4,
        ACCELERATION: 0.3,
        FRICTION: 0.85,
        MAX_FALL_SPEED: 7
    },
    
    // Настройки платформ
    PLATFORMS: {
        WIDTH: 70,
        HEIGHT: 20,
        MIN_GAP: 85,
        MAX_GAP: 120,
        START_COUNT: 12,
        MOVE_SPEED: 1.5,
        BREAKING_TIME: 0.5,
        COLLISION_COOLDOWN: 150,
        COLLISION_MARGIN: 2
    },
    
    // Настройки игры
    GAME: {
        INITIAL_SCROLL_THRESHOLD: 200,
        SCORE_MULTIPLIER: 0.1,
        DIFFICULTY_INCREASE: 0,
        PLATFORM_SPAWN_RATE: 0.8,
        JUMP_COOLDOWN: 100
    },
    
    // Цвета
    COLORS: {
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
    },
    
    // Вероятности появления платформ
    PLATFORM_PROBABILITIES: {
        NORMAL: 0.75,
        BREAKING: 0.15,
        MOVING: 0.1
    }
};

// Теперь создаем финальный CONFIG с вычисляемыми значениями
const CONFIG = {
    ...BASE_CONFIG,
    PLAYER: {
        ...BASE_CONFIG.PLAYER,
        START_Y: BASE_CONFIG.CANVAS.HEIGHT - 150
    },
    GAME: {
        ...BASE_CONFIG.GAME,
        START_PLATFORM_Y: BASE_CONFIG.CANVAS.HEIGHT - 100
    }
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
console.log('   Jump Force:', CONFIG.PLAYER.JUMP_FORCE);
console.log('   Gravity:', CONFIG.PLAYER.GRAVITY);
console.log('   Player START_Y:', CONFIG.PLAYER.START_Y);
console.log('   Start Platform Y:', CONFIG.GAME.START_PLATFORM_Y);