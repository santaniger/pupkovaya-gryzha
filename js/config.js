// Конфигурация игры Doodle Jump
const CONFIG = {
    // Настройки canvas
    CANVAS: {
        WIDTH: 360,
        HEIGHT: 600
    },
    
    // Настройки игрока - ФИНАЛЬНЫЕ ЗНАЧЕНИЯ
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 40,
        JUMP_FORCE: -9.5, // Фиксированное значение
        GRAVITY: 0.5,     // Фиксированная гравитация
        MAX_SPEED: 4,
        ACCELERATION: 0.3,
        FRICTION: 0.85
    },
    
    // Настройки платформ
    PLATFORMS: {
        WIDTH: 70,
        HEIGHT: 20,
        MIN_GAP: 90,
        MAX_GAP: 140,
        START_COUNT: 10,
        MOVE_SPEED: 1.5,
        BREAKING_TIME: 0.5
    },
    
    // Настройки игры - УБИРАЕМ УВЕЛИЧЕНИЕ СЛОЖНОСТИ
    GAME: {
        INITIAL_SCROLL_THRESHOLD: 200,
        SCORE_MULTIPLIER: 0.1,
        DIFFICULTY_INCREASE: 0, // НУЛЕВОЕ увеличение сложности
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
        NORMAL: 0.8,
        BREAKING: 0.1,
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