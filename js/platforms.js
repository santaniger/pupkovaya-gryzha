// Класс платформы - УПРОЩЕННАЯ ВЕРСИЯ
console.log('🔧 Loading Platform classes...');

class Platform {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 70;
        this.height = 20;
        this.type = type;
        
        if (this.type === 'moving') {
            this.velocityX = (Math.random() - 0.5) * 1.5;
            this.movingRange = 80 + Math.random() * 40;
            this.startX = x;
        }
        
        if (this.type === 'breaking') {
            this.breaking = false;
            this.breakProgress = 0;
            this.breakTimer = 0;
        }
        
        this.lastCollisionTime = 0;
        this.collisionCount = 0;
    }

    update(deltaTime) {
        if (this.type === 'moving') {
            this.x += this.velocityX;
            
            if (Math.abs(this.x - this.startX) > this.movingRange) {
                this.velocityX *= -1;
            }
        }
        
        if (this.type === 'breaking' && this.breaking) {
            this.breakTimer += deltaTime;
            this.breakProgress = this.breakTimer / 0.5;
            
            if (this.breakProgress >= 1) {
                return false;
            }
        }
        
        return true;
    }

    draw(ctx, assets) {
        const alpha = this.breaking ? 1 - this.breakProgress : 1;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        let imageName;
        switch(this.type) {
            case 'breaking':
                imageName = 'platformBreaking';
                break;
            case 'moving':
                imageName = 'platformMoving';
                break;
            default:
                imageName = 'platformNormal';
        }
        
        const image = assets.getImage(imageName);
        
        if (image) {
            ctx.drawImage(image, this.x, this.y, this.width, this.height);
        } else {
            this.drawFallback(ctx);
        }
        
        ctx.restore();
    }

    drawFallback(ctx) {
        let color;
        switch(this.type) {
            case 'breaking':
                color = '#F39C12';
                break;
            case 'moving':
                color = '#9B59B6';
                break;
            default:
                color = '#2ECC71';
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = this.darkenColor(color, 20);
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    collidesWith(player, currentTime) {
        const timeSinceCollision = currentTime - this.lastCollisionTime;
        if (timeSinceCollision < 300) {
            return false;
        }
        
        const playerBottom = player.y + player.height;
        const playerFalling = player.velocityY > 0;
        
        const isColliding = 
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            playerBottom >= this.y &&
            playerBottom <= this.y + 10 &&
            playerFalling;
        
        if (isColliding) {
            this.lastCollisionTime = currentTime;
            this.collisionCount++;
            return true;
        }
        
        return false;
    }

    startBreaking() {
        if (this.type === 'breaking' && !this.breaking) {
            this.breaking = true;
            this.breakTimer = 0;
            return true;
        }
        return false;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return "#" + (0x1000000 + (R * 0x10000) + (G * 0x100) + B).toString(16).slice(1);
    }
}

class PlatformManager {
    constructor() {
        console.log('🔧 Initializing PlatformManager');
        this.platforms = [];
        this.scrollY = 0;
        this.highestPoint = 600;
        this.totalPlatformsGenerated = 0;
        this.maxPlatforms = 50;
        this.generateInitialPlatforms();
    }

    generateInitialPlatforms() {
        console.log('🏗️ Generating initial platforms');
        
        // Стартовая платформа
        const startPlatform = new Platform(
            360 / 2 - 70 / 2,
            500,
            'normal'
        );
        this.platforms.push(startPlatform);

        // Генерация платформ снизу вверх
        let currentY = 500 - 80; // Начинаем выше стартовой платформы
        for (let i = 0; i < 15; i++) {
            this.generatePlatform(currentY);
            currentY -= this.getRandomGap();
        }
        
        // Также генерируем платформы выше начальной позиции
        let upperY = 500 - 500; // 500 пикселей выше старта
        for (let i = 0; i < 10; i++) {
            this.generatePlatform(upperY);
            upperY -= this.getRandomGap();
        }
        
        console.log(`✅ Generated ${this.platforms.length} initial platforms`);
    }

    generatePlatform(y) {
        if (this.platforms.length >= this.maxPlatforms) {
            return;
        }
        
        const type = this.getRandomPlatformType();
        const x = this.getRandomPlatformX();
        
        this.platforms.push(new Platform(x, y, type));
        this.totalPlatformsGenerated++;
    }

    getRandomPlatformType() {
        const rand = Math.random();
        if (rand <= 0.7) return 'normal';
        if (rand <= 0.9) return 'breaking';
        return 'moving';
    }

    getRandomPlatformX() {
        const padding = 20;
        return padding + Math.random() * (360 - 70 - padding * 2);
    }

    getRandomGap() {
        return 80 + Math.random() * (120 - 80);
    }

    update(playerY, deltaTime) {
        // Обновляем платформы
        this.platforms = this.platforms.filter(platform => 
            platform.update(deltaTime)
        );

        // Очистка старых платформ (теперь удаляем только те, что далеко снизу)
        this.cleanupOldPlatforms(playerY);

        // Генерация новых платформ сверху
        const highestPlatform = this.getHighestPlatform();
        if (highestPlatform && highestPlatform.y > -1000) { // Генерируем до -1000
            const targetY = highestPlatform.y - this.getRandomGap();
            if (Math.random() < 0.8) {
                this.generatePlatform(targetY);
            }
        }

        // Обновление самой высокой точки
        this.updateHighestPoint();
        
        return 0;
    }

    cleanupOldPlatforms(playerY) {
        const cleanupThreshold = 800; // Увеличиваем порог очистки
        
        const initialCount = this.platforms.length;
        this.platforms = this.platforms.filter(platform => {
            // Удаляем только платформы, которые далеко снизу (ниже игрока + порог)
            return platform.y < playerY + 600 + cleanupThreshold;
        });
        
        return initialCount - this.platforms.length;
    }

    getHighestPlatform() {
        if (this.platforms.length === 0) return null;
        return this.platforms.reduce((lowest, platform) => 
            platform.y < lowest.y ? platform : lowest
        );
    }

    getLowestPlatform() {
        if (this.platforms.length === 0) return null;
        return this.platforms.reduce((highest, platform) => 
            platform.y > highest.y ? platform : highest
        );
    }

    getStartPlatform() {
        if (this.platforms.length === 0) {
            return null;
        }
        
        const targetY = 500;
        const sortedPlatforms = [...this.platforms].sort((a, b) => {
            const diffA = Math.abs(a.y - targetY);
            const diffB = Math.abs(b.y - targetY);
            return diffA - diffB;
        });
        
        return sortedPlatforms[0];
    }

    updateHighestPoint() {
        const highestPlatform = this.getHighestPlatform();
        if (highestPlatform) {
            this.highestPoint = Math.min(this.highestPoint, highestPlatform.y);
        }
    }

    draw(ctx, assets) {
        this.platforms.forEach(platform => {
            platform.draw(ctx, assets);
        });
    }

    checkCollisions(player, currentTime) {
        for (const platform of this.platforms) {
            if (platform.collidesWith(player, currentTime)) {
                if (platform.type === 'breaking') {
                    platform.startBreaking();
                }
                return true;
            }
        }
        return false;
    }

    reset() {
        console.log('🔄 Resetting PlatformManager');
        this.platforms = [];
        this.scrollY = 0;
        this.highestPoint = 600;
        this.totalPlatformsGenerated = 0;
        this.generateInitialPlatforms();
    }

    getProgress() {
        return Math.max(0, 600 - this.highestPoint);
    }
    
    getDebugInfo() {
        const startPlatform = this.getStartPlatform();
        return {
            totalPlatforms: this.platforms.length,
            platformsGenerated: this.totalPlatformsGenerated,
            highestPoint: Math.round(this.highestPoint),
            scrollY: Math.round(this.scrollY),
            startPlatform: startPlatform ? {
                x: Math.round(startPlatform.x),
                y: Math.round(startPlatform.y)
            } : 'Not found'
        };
    }
}

// Явно добавляем классы в глобальную область видимости
window.Platform = Platform;
window.PlatformManager = PlatformManager;

console.log('✅ Platform classes defined');