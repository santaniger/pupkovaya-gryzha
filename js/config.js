// config.js
// Конфигурация игры Doodle Jump
console.log('🔧 Loading game configuration...');

const CONFIG = {
    // Настройки canvas
    CANVAS: {
        WIDTH: 360,
        HEIGHT: 600
    },
    
    // Настройки игрока - ИСПРАВЛЕННЫЕ ЗНАЧЕНИЯ
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 40,
        JUMP_FORCE: -9.5, // Оптимизированная сила прыжка
        GRAVITY: 0.4,     // Уменьшенная гравитация для лучшего контроля
        MAX_SPEED: 4,
        ACCELERATION: 0.3,
        FRICTION: 0.85,
        MAX_FALL_SPEED: 8, // Уменьшенная максимальная скорость падения
        START_Y: 450       // Фиксированная стартовая позиция
    },
    
    // Настройки платформ - УЛУЧШЕННЫЕ ДЛЯ ЛУЧШЕГО ГЕЙМПЛЕЯ
    PLATFORMS: {
        WIDTH: 70,
        HEIGHT: 20,
        MIN_GAP: 90,      // Уменьшенный разрыв для более плотного расположения
        MAX_GAP: 130,
        START_COUNT: 12,  // Увеличено количество стартовых платформ
        MOVE_SPEED: 1.5,
        BREAKING_TIME: 0.5,
        COLLISION_COOLDOWN: 300, // Уменьшено время между коллизиями
        COLLISION_MARGIN: 3      // Дополнительный запас для коллизий
    },
    
    // Настройки игры
    GAME: {
        INITIAL_SCROLL_THRESHOLD: 200,
        SCORE_MULTIPLIER: 0.1,
        DIFFICULTY_INCREASE: 0,
        PLATFORM_SPAWN_RATE: 0.8, // Увеличена частота появления платформ
        JUMP_COOLDOWN: 200,       // Уменьшено время между прыжками
        START_PLATFORM_Y: 500     // Фиксированная позиция стартовой платформы
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
        NORMAL: 0.75,    // Увеличена вероятность обычных платформ
        BREAKING: 0.15,
        MOVING: 0.1
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
console.log('   Start Platform Y:', CONFIG.GAME.START_PLATFORM_Y);
// config.js - ДОБАВИТЬ В КОНЕЦ ФАЙЛА
// Исправление: Добавляем отсутствующие конфигурационные параметры
CONFIG.PLAYER.START_Y = CONFIG.CANVAS.HEIGHT - 150; // Позиция игрока над стартовой платформой
CONFIG.GAME.START_PLATFORM_Y = CONFIG.CANVAS.HEIGHT - 100; // Позиция стартовой платформы

console.log('🔄 Config extended with missing parameters');
console.log('   Player START_Y:', CONFIG.PLAYER.START_Y);
console.log('   Start Platform Y:', CONFIG.GAME.START_PLATFORM_Y);