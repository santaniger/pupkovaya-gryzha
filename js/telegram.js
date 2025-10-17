// Интеграция с Telegram Web App
class TelegramIntegration {
    constructor() {
        this.tg = null;
        this.user = null;
        this.initData = null;
        this.init();
    }

    init() {
        console.log('Initializing Telegram integration...');
        
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.initTelegram();
        } else {
            console.log('Running outside Telegram - using mock mode');
            this.createMockTelegram();
        }
        
        // Сохраняем ссылку для глобального доступа
        window.tg = this.tg;
        
        console.log('Telegram integration initialized');
    }

    initTelegram() {
        try {
            // Расширяем на весь экран
            this.tg.expand();
            
            // Включаем подтверждение закрытия (если поддерживается)
            try {
                this.tg.enableClosingConfirmation();
            } catch (e) {
                console.log('Closing confirmation not supported:', e.message);
            }
            
            // Получаем данные пользователя
            this.initData = this.tg.initDataUnsafe;
            this.user = this.initData?.user;
            
            // Настраиваем тему
            this.setupTheme();
            
            // Настраиваем события
            this.setupEvents();
            
            // Настраиваем UI
            this.setupUI();
            
            console.log('Telegram Web App fully initialized', {
                user: this.user,
                theme: this.tg.colorScheme,
                platform: this.tg.platform
            });
            
        } catch (error) {
            console.error('Error initializing Telegram Web App:', error);
        }
    }

    setupTheme() {
        const theme = this.tg.colorScheme;
        
        // Применяем цвета из Telegram
        if (this.tg.themeParams) {
            const params = this.tg.themeParams;
            
            // Создаем CSS переменные с цветами Telegram
            document.documentElement.style.setProperty('--tg-theme-bg-color', params.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', params.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-hint-color', params.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-theme-link-color', params.link_color || '#2678b6');
            document.documentElement.style.setProperty('--tg-theme-button-color', params.button_color || '#5ac8fb');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', params.button_text_color || '#ffffff');
            
            // Применяем тему к фону
            if (theme === 'dark') {
                document.body.style.background = params.bg_color || '#1e1e1e';
            } else {
                document.body.style.background = params.bg_color || '#ffffff';
            }
        }
        
        // Настраиваем viewport для мобильных устройств
        this.setupViewport();
    }

    setupViewport() {
        // Получаем безопасные зоны (для iPhone с челкой)
        const safeArea = {
            top: this.tg.safeArea?.top || 0,
            bottom: this.tg.safeArea?.bottom || 0,
            left: this.tg.safeArea?.left || 0,
            right: this.tg.safeArea?.right || 0
        };
        
        // Применяем отступы для безопасных зон
        document.documentElement.style.setProperty('--safe-area-top', `${safeArea.top}px`);
        document.documentElement.style.setProperty('--safe-area-bottom', `${safeArea.bottom}px`);
        document.documentElement.style.setProperty('--safe-area-left', `${safeArea.left}px`);
        document.documentElement.style.setProperty('--safe-area-right', `${safeArea.right}px`);
        
        // Настраиваем viewport
        this.tg.requestViewport();
    }

    setupEvents() {
        // Обработка изменения viewport
        this.tg.onEvent('viewportChanged', (event) => {
            console.log('Viewport changed:', event);
            this.setupViewport();
        });
        
        // Обработка изменения темы
        this.tg.onEvent('themeChanged', () => {
            console.log('Theme changed');
            this.setupTheme();
        });
        
        // Обработка нажатия кнопки назад
        if (this.tg.BackButton) {
            this.tg.BackButton.onClick(() => {
                this.handleBackButton();
            });
        }
        
        // Обработка основных кнопок
        if (this.tg.MainButton) {
            this.setupMainButton();
        }
    }

    handleBackButton() {
        if (window.game) {
            const game = window.game;
            
            switch(game.state) {
                case GameState.PLAYING:
                    game.pauseGame();
                    this.showMainButton('Resume Game', () => {
                        game.pauseGame();
                        this.hideMainButton();
                    });
                    break;
                    
                case GameState.PAUSED:
                    game.pauseGame();
                    this.hideMainButton();
                    break;
                    
                case GameState.GAME_OVER:
                case GameState.MENU:
                    this.tg.close();
                    break;
            }
        } else {
            this.tg.close();
        }
    }

    setupMainButton() {
        // Можно настроить главную кнопку Telegram
        this.tg.MainButton.setText('Play Game');
        this.tg.MainButton.onClick(() => {
            if (window.game) {
                window.game.startGame();
            }
        });
    }

    showMainButton(text, onClick) {
        if (this.tg.MainButton) {
            this.tg.MainButton.setText(text);
            this.tg.MainButton.onClick(onClick);
            this.tg.MainButton.show();
        }
    }

    hideMainButton() {
        if (this.tg.MainButton) {
            this.tg.MainButton.hide();
        }
    }

    setupUI() {
        // Показываем главную кнопку в меню
        if (this.tg.MainButton && window.game && window.game.state === GameState.MENU) {
            this.showMainButton('Start Game', () => {
                window.game.startGame();
                this.hideMainButton();
            });
        }
    }

    createMockTelegram() {
        this.tg = {
            // Основные методы
            expand: () => console.log('[Mock] App expanded'),
            close: () => console.log('[Mock] App closed'),
            enableClosingConfirmation: () => console.log('[Mock] Closing confirmation enabled'),
            
            // Данные
            initDataUnsafe: {
                user: {
                    id: 123456789,
                    first_name: 'Telegram',
                    last_name: 'User',
                    username: 'telegram_user',
                    language_code: 'en'
                },
                start_param: 'test',
                auth_date: Math.floor(Date.now() / 1000),
                hash: 'mock_hash'
            },
            
            // Тема
            colorScheme: 'light',
            themeParams: {
                bg_color: '#ffffff',
                text_color: '#000000',
                hint_color: '#999999',
                link_color: '#2678b6',
                button_color: '#5ac8fb',
                button_text_color: '#ffffff'
            },
            
            // Безопасные зоны
            safeArea: {
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            },
            
            // Платформа
            platform: 'unknown',
            
            // События
            onEvent: (event, callback) => {
                console.log(`[Mock] Event listener added: ${event}`);
            },
            
            // Кнопки
            BackButton: {
                show: () => console.log('[Mock] BackButton shown'),
                hide: () => console.log('[Mock] BackButton hidden'),
                onClick: (callback) => console.log('[Mock] BackButton callback set')
            },
            
            MainButton: {
                show: () => console.log('[Mock] MainButton shown'),
                hide: () => console.log('[Mock] MainButton hidden'),
                setText: (text) => console.log(`[Mock] MainButton text: ${text}`),
                onClick: (callback) => console.log('[Mock] MainButton callback set')
            },
            
            // Методы запросов
            requestViewport: () => console.log('[Mock] Viewport requested'),
            
            // Методы отправки данных
            sendData: (data) => {
                console.log('[Mock] Data sent to bot:', data);
                return true;
            },
            
            shareUrl: (url, text) => {
                console.log(`[Mock] Sharing: ${text} - ${url}`);
                return true;
            },
            
            // Версия
            version: '6.0'
        };
        
        this.user = this.tg.initDataUnsafe.user;
        this.initData = this.tg.initDataUnsafe;
    }

    // Отправка данных боту
    sendGameData(data) {
        if (this.tg && typeof this.tg.sendData === 'function') {
            try {
                this.tg.sendData(JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Error sending data to Telegram:', error);
                return false;
            }
        }
        return false;
    }

    // Поделиться ссылкой через Telegram
    shareLink(url, text) {
        if (this.tg && typeof this.tg.shareUrl === 'function') {
            try {
                this.tg.shareUrl(url, text);
                return true;
            } catch (error) {
                console.error('Error sharing link via Telegram:', error);
                return false;
            }
        }
        return false;
    }

    // Получение информации о пользователе
    getUserInfo() {
        return this.user ? {
            id: this.user.id,
            firstName: this.user.first_name,
            lastName: this.user.last_name,
            username: this.user.username,
            language: this.user.language_code
        } : null;
    }

    // Проверка, запущено ли в Telegram
    isInTelegram() {
        return window.Telegram && window.Telegram.WebApp;
    }
}

// Автоматическая инициализация при загрузке страницы
let telegramIntegration;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Telegram integration...');
    telegramIntegration = new TelegramIntegration();
});

// Экспорт для глобального доступа
window.TelegramIntegration = TelegramIntegration;

console.log('Telegram integration module loaded');