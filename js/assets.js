// assets.js
// Менеджер ресурсов игры
console.log('🔧 Loading AssetManager...');

class AssetManager {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.loaded = false;
        this.loadProgress = 0;
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.loadStartTime = Date.now();
    }

    // Загрузка всех изображений
    async loadAllAssets() {
        console.log('🖼️ Starting asset loading...');
        this.loadStartTime = Date.now();
        
        // Сначала создаем спрайты через Data URLs (гарантированно работают)
        this.createSprites();
        
        // Затем пробуем загрузить внешние PNG (опционально)
        const imageSources = {
            player: 'assets/images/player.png',
            background: 'assets/images/background.png',
            platformNormal: 'assets/images/platform_normal.png',
            platformBreaking: 'assets/images/platform_breaking.png',
            platformMoving: 'assets/images/platform_moving.png'
        };

        this.totalAssets = Object.keys(imageSources).length;
        
        try {
            await this.loadExternalImages(imageSources);
        } catch (error) {
            console.log('⚠️ Using generated sprites instead of external images');
        }
        
        this.loaded = true;
        const loadTime = Date.now() - this.loadStartTime;
        console.log(`✅ All assets loaded in ${loadTime}ms`);
        return true;
    }

    // Создание спрайтов через Data URLs
    createSprites() {
        console.log('🎨 Creating generated sprites...');
        
        this.images['player'] = this.createPlayerSprite();
        this.images['background'] = this.createBackgroundSprite();
        this.images['platformNormal'] = this.createPlatformSprite(CONFIG.COLORS.PLATFORM_NORMAL, 'normal');
        this.images['platformBreaking'] = this.createPlatformSprite(CONFIG.COLORS.PLATFORM_BREAKING, 'breaking');
        this.images['platformMoving'] = this.createPlatformSprite(CONFIG.COLORS.PLATFORM_MOVING, 'moving');
        
        console.log('✅ Generated sprites created');
    }

    // Загрузка внешних изображений
    async loadExternalImages(imageSources) {
        console.log('📥 Attempting to load external images...');
        
        const loadPromises = Object.entries(imageSources).map(([name, src]) => 
            this.loadImage(name, src).catch(error => {
                console.warn(`❌ Failed to load ${src}, using generated sprite`);
                // Если загрузка не удалась, используем уже созданный спрайт
            })
        );

        await Promise.allSettled(loadPromises);
        console.log('✅ External images loading completed');
    }

    // Загрузка одного изображения
    loadImage(name, src) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const url = `${src}?v=${timestamp}`;
            
            console.log(`📥 Loading: ${src}`);
            
            const img = new Image();
            img.onload = () => {
                console.log(`✅ Successfully loaded: ${src}`);
                this.images[name] = img;
                this.loadedAssets++;
                this.loadProgress = (this.loadedAssets / this.totalAssets) * 100;
                resolve();
            };
            img.onerror = () => {
                console.warn(`❌ Failed to load: ${src}`);
                reject(new Error(`Failed to load: ${src}`));
            };
            img.src = url;
            
            setTimeout(() => {
                if (!img.complete) {
                    console.warn(`⏰ Timeout loading: ${src}`);
                    reject(new Error(`Timeout loading: ${src}`));
                }
            }, 3000);
        });
    }

    // Создание спрайта игрока
    createPlayerSprite() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 40;
        canvas.width = size;
        canvas.height = size;
        
        // Прозрачный фон
        ctx.clearRect(0, 0, size, size);
        
        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(size/2 + 2, size/2 + 2, size/2 - 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Основное тело
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, '#FF8A8A');
        gradient.addColorStop(1, '#FF6B6B');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Контур
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Глаза
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(size/2 - 8, size/2 - 5, 6, 0, Math.PI * 2);
        ctx.arc(size/2 + 8, size/2 - 5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Зрачки
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.arc(size/2 - 8, size/2 - 5, 3, 0, Math.PI * 2);
        ctx.arc(size/2 + 8, size/2 - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Улыбка
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size/2, size/2 + 5, 8, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        return canvas;
    }

    // Создание спрайта фона
    createBackgroundSprite() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = CONFIG.CANVAS.WIDTH;
        canvas.height = CONFIG.CANVAS.HEIGHT;
        
        // Градиентный фон
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS.HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98D8F0');
        gradient.addColorStop(1, '#E0F7FA');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Облака
        this.drawDetailedClouds(ctx);
        
        return canvas;
    }

    // Рисование детализированных облаков
    drawDetailedClouds(ctx) {
        const clouds = [
            { x: 50, y: 80, size: 45 },
            { x: 150, y: 120, size: 65 },
            { x: 280, y: 70, size: 55 },
            { x: 200, y: 200, size: 50 },
            { x: 80, y: 250, size: 60 },
            { x: 300, y: 300, size: 40 }
        ];
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        clouds.forEach(cloud => {
            this.drawFluffyCloud(ctx, cloud.x, cloud.y, cloud.size);
        });
    }

    // Рисование пушистого облака
    drawFluffyCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.arc(x + size * 0.25, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.arc(x - size * 0.1, y + size * 0.15, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    // Создание спрайта платформы
    createPlatformSprite(color, type) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 70;
        const height = 20;
        canvas.width = width;
        canvas.height = height;
        
        // Прозрачный фон
        ctx.clearRect(0, 0, width, height);
        
        // Тень
        ctx.fillStyle = this.darkenColor(color, 30);
        ctx.fillRect(3, 3, width, height);
        
        // Основная платформа с градиентом
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, this.lightenColor(color, 20));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.darkenColor(color, 15));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height - 3);
        
        // Верхняя грань
        ctx.fillStyle = this.lightenColor(color, 30);
        ctx.fillRect(0, 0, width, 4);
        
        // Текстура в зависимости от типа
        this.drawPlatformTexture(ctx, width, height, type, color);
        
        // Контур
        ctx.strokeStyle = this.darkenColor(color, 25);
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        return canvas;
    }

    // Рисование текстуры платформы
    drawPlatformTexture(ctx, width, height, type, color) {
        ctx.strokeStyle = this.darkenColor(color, 15);
        ctx.lineWidth = 1;
        ctx.fillStyle = this.darkenColor(color, 20);
        
        switch(type) {
            case 'breaking':
                ctx.setLineDash([2, 3]);
                ctx.strokeRect(8, 5, width - 16, height - 10);
                ctx.setLineDash([]);
                break;
                
            case 'moving':
                this.drawArrow(ctx, width * 0.25, height/2, 4, true);
                this.drawArrow(ctx, width * 0.5, height/2, 4, true);
                this.drawArrow(ctx, width * 0.75, height/2, 4, true);
                break;
                
            default:
                for (let i = 8; i < width - 8; i += 6) {
                    ctx.beginPath();
                    ctx.moveTo(i, 5);
                    ctx.lineTo(i, height - 5);
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
            console.warn(`❌ Image not found: ${name}`);
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

console.log('✅ AssetManager class defined');