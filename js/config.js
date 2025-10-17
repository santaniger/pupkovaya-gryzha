// Конфигурация игры Doodle Jump
const CONFIG = {
    // Настройки canvas
    CANVAS: {
        WIDTH: 360,
        HEIGHT: 600
    },
    
    // Настройки игрока - УМЕНЬШЕНА СКОРОСТЬ
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 40,
        JUMP_FORCE: -12,
        GRAVITY: 0.5,
        MAX_SPEED: 4, // Было 8, теперь 4
        ACCELERATION: 0.3, // Было 0.5, теперь 0.3
        FRICTION: 0.85 // Было 0.9, теперь 0.85 (меньше скольжения)
    },
    
    // Настройки платформ
    PLATFORMS: {
        WIDTH: 70,
        HEIGHT: 16,
        MIN_GAP: 70,
        MAX_GAP: 120,
        START_COUNT: 10,
        MOVE_SPEED: 1.5, // Немного уменьшена скорость движущихся платформ
        BREAKING_TIME: 0.5
    },
    
    // Настройки игры
    GAME: {
        INITIAL_SCROLL_THRESHOLD: 200,
        SCORE_MULTIPLIER: 0.1,
        DIFFICULTY_INCREASE: 0.0001,
        PLATFORM_SPAWN_RATE: 0.7
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
        NORMAL: 0.7,
        BREAKING: 0.2,
        MOVING: 0.1
    }
};

// Состояния игры
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    PAUSED: 'paused'
};

// Типы платформ
const PlatformType = {
    NORMAL: 'normal',
    BREAKING: 'breaking',
    MOVING: 'moving'
};

console.log('Config loaded successfully');