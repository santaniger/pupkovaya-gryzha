// Менеджер ресурсов игры
class AssetManager {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.loaded = false;
        this.loadProgress = 0;
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }

    // Загрузка всех изображений
    loadAllAssets() {
        const imageSources = {
            player: 'assets/images/player.png',
            background: 'assets/images/background.png',
            platformNormal: 'assets/images/platform_normal.png',
            platformBreaking: 'assets/images/platform_breaking.png',
            platformMoving: 'assets/images/platform_moving.png'
        };

        this.totalAssets = Object.keys(imageSources).length;
        this.loadedAssets = 0;
        
        return new Promise((resolve, reject) => {
            let assetsLoaded = 0;
            
            const checkAllLoaded = () => {
                if (assetsLoaded === this.totalAssets) {
                    this.loaded = true;
                    console.log('All assets loaded successfully');
                    resolve();
                }
            };
            
            Object.entries(imageSources).forEach(([name, src]) => {
                this.loadImage(name, src)
                    .then(() => {
                        assetsLoaded++;
                        this.loadedAssets = assetsLoaded;
                        this.loadProgress = (assetsLoaded / this.totalAssets) * 100;
                        console.log(`Loaded: ${src}`);
                        checkAllLoaded();
                    })
                    .catch(error => {
                        console.error(`Failed to load: ${src}`, error);
                        // Создаем fallback изображение если загрузка не удалась
                        this.createFallbackImage(name);
                        assetsLoaded++;
                        this.loadedAssets = assetsLoaded;
                        this.loadProgress = (assetsLoaded / this.totalAssets) * 100;
                        checkAllLoaded();
                    });
            });
        });
    }

    // Загрузка одного изображения
    loadImage(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${src}`);
                reject(new Error(`Failed to load: ${src}`));
            };
            img.src = src;
        });
    }

    // Создание fallback изображения если PNG не загрузился
    createFallbackImage(name) {
        console.log(`Creating fallback image for: ${name}`);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        switch(name) {
            case 'player':
                canvas.width = 40;
                canvas.height = 40;
                this.createPlayerFallback(ctx, 40);
                break;
                
            case 'background':
                canvas.width = CONFIG.CANVAS.WIDTH;
                canvas.height = CONFIG.CANVAS.HEIGHT;
                this.createBackgroundFallback(ctx);
                break;
                
            case 'platformNormal':
                canvas.width = 70;
                canvas.height = 16;
                this.createPlatformFallback(ctx, 70, 16, CONFIG.COLORS.PLATFORM_NORMAL, 'normal');
                break;
                
            case 'platformBreaking':
                canvas.width = 70;
                canvas.height = 16;
                this.createPlatformFallback(ctx, 70, 16, CONFIG.COLORS.PLATFORM_BREAKING, 'breaking');
                break;
                
            case 'platformMoving':
                canvas.width = 70;
                canvas.height = 16;
                this.createPlatformFallback(ctx, 70, 16, CONFIG.COLORS.PLATFORM_MOVING, 'moving');
                break;
        }
        
        this.images[name] = canvas;
    }

    // Fallback для игрока
    createPlayerFallback(ctx, size) {
        // Тень
        ctx.fillStyle = CONFIG.COLORS.PLAYER_SHADOW;
        ctx.beginPath();
        ctx.arc(size/2 + 2, size/2 + 2, size/2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Основное тело
        ctx.fillStyle = CONFIG.COLORS.PLAYER;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Детали лица
        this.drawPlayerFace(ctx, size);
    }

    // Fallback для фона
    createBackgroundFallback(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS.HEIGHT);
        gradient.addColorStop(0, CONFIG.COLORS.BACKGROUND_TOP);
        gradient.addColorStop(1, CONFIG.COLORS.BACKGROUND_BOTTOM);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS.WIDTH, CONFIG.CANVAS.HEIGHT);
        
        // Облака
        this.drawClouds(ctx);
    }

    // Fallback для платформ
    createPlatformFallback(ctx, width, height, color, type) {
        // Тень
        ctx.fillStyle = this.darkenColor(color, 20);
        ctx.fillRect(2, 2, width, height);
        
        // Основная платформа
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, this.lightenColor(color, 10));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.darkenColor(color, 10));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height - 2);
        
        // Верхняя грань
        ctx.fillStyle = this.lightenColor(color, 20);
        ctx.fillRect(0, 0, width, 3);
        
        // Текстура для разных типов платформ
        this.drawPlatformTexture(ctx, width, height, type);
    }

    // Рисование текстуры платформы
    drawPlatformTexture(ctx, width, height, type) {
        ctx.strokeStyle = this.darkenColor(CONFIG.COLORS.PLATFORM_SHADOW, 10);
        ctx.lineWidth = 1;
        
        switch(type) {
            case 'breaking':
                // Пунктирная текстура для ломающейся платформы
                ctx.setLineDash([3, 2]);
                ctx.strokeRect(3, 3, width - 6, height - 6);
                ctx.setLineDash([]);
                break;
                
            case 'moving':
                // Стрелки для движущейся платформы
                ctx.fillStyle = this.darkenColor(CONFIG.COLORS.PLATFORM_MOVING, 20);
                this.drawArrow(ctx, width * 0.3, height/2, 4, true);
                this.drawArrow(ctx, width * 0.7, height/2, 4, false);
                break;
                
            default:
                // Линии для обычной платформы
                for (let i = 5; i < width; i += 10) {
                    ctx.beginPath();
                    ctx.moveTo(i, 4);
                    ctx.lineTo(i, height - 4);
                    ctx.stroke();
                }
        }
    }

    // Рисование стрелки
    drawArrow(ctx, x, y, size, left) {
        ctx.beginPath();
        if (left) {
            ctx.moveTo(x + size, y - size);
            ctx.lineTo(x - size, y);
            ctx.lineTo(x + size, y + size);
        } else {
            ctx.moveTo(x - size, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x - size, y + size);
        }
        ctx.fill();
    }

    // Рисование лица игрока
    drawPlayerFace(ctx, size) {
        // Глаза (белки)
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(size/2 - 8, size/2 - 5, 5, 0, Math.PI * 2);
        ctx.arc(size/2 + 8, size/2 - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Зрачки
        ctx.fillStyle = CONFIG.COLORS.TEXT_PRIMARY;
        ctx.beginPath();
        ctx.arc(size/2 - 8, size/2 - 5, 2.5, 0, Math.PI * 2);
        ctx.arc(size/2 + 8, size/2 - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Улыбка
        ctx.strokeStyle = CONFIG.COLORS.TEXT_PRIMARY;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size/2, size/2 + 5, 7, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Блики в глазах
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(size/2 - 9, size/2 - 6, 1, 0, Math.PI * 2);
        ctx.arc(size/2 + 7, size/2 - 6, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Рисование облаков на фоне
    drawClouds(ctx) {
        const clouds = [
            { x: 50, y: 80, size: 40 },
            { x: 150, y: 120, size: 60 },
            { x: 280, y: 70, size: 50 },
            { x: 200, y: 200, size: 45 },
            { x: 80, y: 250, size: 55 },
            { x: 300, y: 300, size: 35 }
        ];
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        clouds.forEach(cloud => {
            this.drawCloud(ctx, cloud.x, cloud.y, cloud.size);
        });
    }

    // Рисование одного облака
    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Вспомогательные функции для работы с цветами
    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return "#" + (0x1000000 + (R * 0x10000) + (G * 0x100) + B).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return "#" + (0x1000000 + (R * 0x10000) + (G * 0x100) + B).toString(16).slice(1);
    }

    // Получение изображения по имени
    getImage(name) {
        if (!this.images[name]) {
            console.warn(`Image not found: ${name}`);
            // Создаем fallback на лету
            this.createFallbackImage(name);
        }
        return this.images[name];
    }

    // Проверка загрузки всех ресурсов
    isLoaded() {
        return this.loaded;
    }

    // Получение прогресса загрузки
    getLoadProgress() {
        return this.loadProgress;
    }
}

console.log('AssetManager class defined');