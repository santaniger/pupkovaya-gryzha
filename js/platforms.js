// Класс платформы - ИСПРАВЛЕННАЯ ГЕНЕРАЦИЯ
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
        
        console.log(`➕ Created ${type} platform at (${Math.round(x)}, ${Math.round(y)})`);
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
            
            // ВСЕГДА возвращаем true - платформа не удаляется даже после разрушения
            // if (this.breakProgress >= 1) {
            //     console.log('💥 Platform destroyed');
            //     return false;
            // }
            
            // Вместо удаления, просто отмечаем как разрушенную
            if (this.breakProgress >= 1) {
                console.log('💥 Platform fully broken (but kept for reference)');
            }
        }
        
        return true; // ВСЕГДА возвращаем true - платформы никогда не удаляются
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
        
        // Отладочная отрисовка
        if (window.DEBUG_MODE) {
            ctx.strokeStyle = this.type === 'breaking' ? 'red' : 'green';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
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
        
        // Текст для отладки
        if (window.DEBUG_MODE) {
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(`${Math.round(this.y)}`, this.x + 5, this.y + 12);
        }
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
            console.log(`🎯 Collision with platform at Y: ${this.y}`);
            return true;
        }
        
        return false;
    }

    startBreaking() {
        if (this.type === 'breaking' && !this.breaking) {
            this.breaking = true;
            this.breakTimer = 0;
            console.log('🟡 Breaking platform activated');
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
        this.highestPoint = 0;
        this.totalPlatformsGenerated = 0;
        this.maxPlatforms = 300; // Увеличили лимит для бесконечной игры
        this.lastGenerationHeight = 0;
        this.generationThreshold = 400;
        this.minGap = 80;
        this.maxGap = 160; // Увеличили максимальный разрыв
        this.generateInitialPlatforms();
    }

    generateInitialPlatforms() {
        console.log('🏗️ Generating initial platforms');
        
        this.platforms = [];
        
        // Стартовая платформа
        const startPlatform = new Platform(360 / 2 - 70 / 2, 500, 'normal');
        this.platforms.push(startPlatform);
        
        // Генерируем платформы до высоты -5000 для начала
        let currentY = 500;
        const initialHeight = -5000; // Начальная высота генерации
        
        while (currentY > initialHeight && this.platforms.length < 100) {
            currentY -= this.getRandomGap();
            if (this.isPositionValid(currentY)) {
                this.generatePlatform(currentY);
            }
        }
        
        this.lastGenerationHeight = this.getHighestPlatform()?.y || currentY;
        this.highestPoint = this.lastGenerationHeight;
        
        console.log(`✅ Generated ${this.platforms.length} platforms up to Y: ${this.lastGenerationHeight}`);
    }
    
    // Добавьте метод для отладки распределения платформ
    getPlatformDistribution() {
        const ranges = {
            '500+': 0,
            '400-500': 0,
            '300-400': 0, 
            '200-300': 0,
            '100-200': 0,
            '0-100': 0,
            'below-0': 0,
            'below-1000': 0,
            'below-2000': 0,
            'below-3000': 0,
            'below-4000': 0
        };
        
        this.platforms.forEach(platform => {
            const y = platform.y;
            if (y >= 500) ranges['500+']++;
            else if (y >= 400) ranges['400-500']++;
            else if (y >= 300) ranges['300-400']++;
            else if (y >= 200) ranges['200-300']++;
            else if (y >= 100) ranges['100-200']++;
            else if (y >= 0) ranges['0-100']++;
            else if (y >= -1000) ranges['below-0']++;
            else if (y >= -2000) ranges['below-1000']++;
            else if (y >= -3000) ranges['below-2000']++;
            else if (y >= -4000) ranges['below-3000']++;
            else ranges['below-4000']++;
        });
        
        return ranges;
    }

    generatePlatform(y) {
        if (this.platforms.length >= this.maxPlatforms) {
            this.removeLowestPlatform();
        }
        
        const type = this.getRandomPlatformType();
        const x = this.getRandomPlatformX();
        
        const platform = new Platform(x, y, type);
        this.platforms.push(platform);
        this.totalPlatformsGenerated++;
        
        return platform;
    }

    // Обновите метод removeLowestPlatform - сделайте его безопасным
    removeLowestPlatform() {
        if (this.platforms.length <= 80) return; // Минимум 80 платформ
        
        let lowestIndex = -1;
        let lowestY = -Infinity;
        
        for (let i = 0; i < this.platforms.length; i++) {
            if (this.platforms[i].y > lowestY) {
                lowestY = this.platforms[i].y;
                lowestIndex = i;
            }
        }
        
        if (lowestIndex !== -1) {
            this.platforms.splice(lowestIndex, 1);
        }
    }

    getRandomPlatformType() {
        const rand = Math.random();
        const currentHeight = Math.abs(this.getHighestPlatform()?.y || 0);
        
        // Первые 20 платформ - только обычные
        if (this.platforms.length < 20) return 'normal';
        
        let breakingChance = 0.2;
        let movingChance = 0.15;
        
        // На больших высотах увеличиваем сложность
        if (currentHeight > 5000) {
            breakingChance = 0.25;
            movingChance = 0.2;
        }
        if (currentHeight > 10000) {
            breakingChance = 0.3;
            movingChance = 0.25;
        }
        
        if (rand <= breakingChance) return 'breaking';
        if (rand <= breakingChance + movingChance) return 'moving';
        return 'normal';
    }

    getRandomPlatformX() {
        const padding = 20;
        return padding + Math.random() * (360 - 70 - padding * 2);
    }

    getRandomGap() {
        return 60 + Math.random() * (100 - 60);
    }

    update(playerY, deltaTime) {
        // Обновляем физику платформ
        this.platforms.forEach(platform => {
            platform.update(deltaTime);
        });

        // Генерация новых платформ - ВСЕГДА генерируем при необходимости
        this.generateInfinitePlatforms(playerY);
        
        // Мягкая очистка только очень старых платформ
        this.softCleanup(playerY);
        
        return 0;
    }
    
    // Обновите метод generateInfinitePlatforms для ограничения общего количества
    generateInfinitePlatforms(playerY) {
        const highestPlatform = this.getHighestPlatform();
        if (!highestPlatform) return;
        
        const currentHighestY = highestPlatform.y;
        const playerProgress = Math.abs(playerY); // Прогресс игрока (положительное число)
        
        // ВСЕГДА генерируем платформы выше текущей самой высокой
        const targetHeight = currentHighestY - 1000; // Всегда хотим платформы на 1000px выше
        
        if (this.lastGenerationHeight > targetHeight) {
            return; // Уже сгенерировали достаточно высоко
        }
        
        let currentY = this.lastGenerationHeight;
        const platformsToGenerate = 5;
        let generated = 0;
        
        for (let i = 0; i < platformsToGenerate; i++) {
            if (this.platforms.length >= this.maxPlatforms) {
                // Если достигли лимита, удаляем самые нижние
                this.removeLowestPlatform();
            }
            
            currentY -= this.getDynamicGap(playerProgress);
            
            // Находим валидную позицию
            const validY = this.findValidPosition(currentY);
            if (validY === null) {
                currentY -= this.getRandomGap(); // Пробуем следующую позицию
                continue;
            }
            
            currentY = validY;
            this.generatePlatform(currentY);
            generated++;
        }
        
        if (generated > 0) {
            this.lastGenerationHeight = currentY;
            this.highestPoint = Math.min(this.highestPoint, currentY);
        }
    }

    getDynamicGap(playerProgress) {
        const baseGap = 80 + Math.random() * 80; // 80-160px
        
        // На больших высотах увеличиваем разрывы для сложности
        if (playerProgress > 5000) {
            return baseGap * 1.2; // +20% на высоте >5000
        }
        if (playerProgress > 10000) {
            return baseGap * 1.4; // +40% на высоте >10000
        }
        
        return baseGap;
    }

    // НОВЫЙ МЕТОД - мягкая очистка только очень старых платформ
    softCleanup(playerY) {
        const cleanupThreshold = 1500; // Увеличили порог очистки
        const maxPlatformsToRemove = 3; // Максимум удаляемых за кадр
        
        let removed = 0;
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            if (removed >= maxPlatformsToRemove) break;
            
            const platform = this.platforms[i];
            // Удаляем только платформы, которые очень далеко снизу
            if (platform.y > playerY + cleanupThreshold) {
                this.platforms.splice(i, 1);
                removed++;
            }
        }
        
        if (removed > 0 && window.DEBUG_MODE) {
            console.log(`🗑️ Soft cleanup: removed ${removed} platforms`);
        }
    }

    isPositionValid(y) {
        const verticalThreshold = 35; // Увеличили минимальное расстояние
        
        for (const platform of this.platforms) {
            // Проверяем только вертикальное расстояние
            if (Math.abs(platform.y - y) < verticalThreshold) {
                return false;
            }
        }
        
        return true;
    }

    // НОВЫЙ МЕТОД - поиск валидной позиции
    findValidPosition(desiredY) {
        let attempts = 0;
        let currentY = desiredY;
        const maxAttempts = 5; // Уменьшили количество попыток
        
        while (attempts < maxAttempts) {
            if (this.isPositionValid(currentY)) {
                return currentY;
            }
            
            // Пробуем разные Y с небольшим смещением
            currentY -= 20 + Math.random() * 30;
            attempts++;
        }
        
        // Если не нашли идеальную позицию, возвращаем ближайшую валидную
        return this.findNearestValidPosition(desiredY);
    }

    // НОВЫЙ МЕТОД - найти ближайшую валидную позицию
    findNearestValidPosition(desiredY) {
        let bestY = desiredY;
        let bestDistance = Infinity;
        
        // Пробуем позиции в радиусе 200px от желаемой
        for (let offset = -200; offset <= 200; offset += 20) {
            const testY = desiredY + offset;
            if (this.isPositionValid(testY)) {
                const distance = Math.abs(testY - desiredY);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestY = testY;
                }
            }
        }
        
        return bestDistance < Infinity ? bestY : desiredY; // Возвращаем желаемую, если ничего не нашли
    }

    getRandomGap() {
        // Динамический разрыв в зависимости от высоты
        const baseGap = 80 + Math.random() * 70; // 80-150px
        return baseGap;
    }

    getRandomPlatformX() {
        const padding = 25; // Увеличили отступы от краев
        return padding + Math.random() * (360 - 70 - padding * 2);
    }

    getRandomPlatformType() {
        const rand = Math.random();
        
        // Первые 15 платформ - только обычные
        if (this.platforms.length < 15) return 'normal';
        
        // На больших высотах уменьшаем вероятность ломающихся платформ
        const currentHeight = Math.abs(this.getHighestPlatform()?.y || 0);
        let breakingChance = 0.25;
        let movingChance = 0.15;
        
        if (currentHeight > 2000) {
            breakingChance = 0.15;  // Уменьшаем ломающиеся
            movingChance = 0.2;     // Немного увеличиваем движущиеся
        }
        
        if (rand <= breakingChance) return 'breaking';
        if (rand <= breakingChance + movingChance) return 'moving';
        return 'normal';
    }

    // ЗАКОММЕНТИРУЙТЕ или УДАЛИТЕ метод cleanupOldPlatforms
    /*
    cleanupOldPlatforms(playerY) {
        const cleanupThreshold = 800;
        
        const initialCount = this.platforms.length;
        this.platforms = this.platforms.filter(platform => {
            return platform.y < playerY + 600 + cleanupThreshold;
        });
        
        const removed = initialCount - this.platforms.length;
        if (removed > 0) {
            console.log(`🗑️ Cleaned up ${removed} platforms below Y: ${playerY + 600 + cleanupThreshold}`);
        }
        
        return removed;
    }
    */

    getHighestPlatform() {
        if (this.platforms.length === 0) return null;
        
        let highest = this.platforms[0];
        for (let i = 1; i < this.platforms.length; i++) {
            if (this.platforms[i].y < highest.y) {
                highest = this.platforms[i];
            }
        }
        return highest;
    }

    getLowestPlatform() {
        if (this.platforms.length === 0) return null;
        
        let lowest = this.platforms[0];
        for (let i = 1; i < this.platforms.length; i++) {
            if (this.platforms[i].y > lowest.y) {
                lowest = this.platforms[i];
            }
        }
        return lowest;
    }

    getPlatformsInView() {
        return this.platforms.filter(platform => 
            platform.y >= -100 && platform.y <= 700
        );
    }

    getStartPlatform() {
        if (this.platforms.length === 0) {
            console.error('❌ No platforms available for start position!');
            return null;
        }
        
        // Ищем платформу ближайшую к Y=500
        const targetY = 500;
        const sortedPlatforms = [...this.platforms].sort((a, b) => {
            const diffA = Math.abs(a.y - targetY);
            const diffB = Math.abs(b.y - targetY);
            return diffA - diffB;
        });
        
        const startPlatform = sortedPlatforms[0];
        console.log(`🎯 Selected start platform at Y: ${startPlatform.y}`);
        
        return startPlatform;
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
        
        if (window.DEBUG_MODE) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(`Platforms: ${this.platforms.length}`, 10, 580);
            
            const highest = this.getHighestPlatform();
            if (highest) {
                ctx.fillText(`Highest: ${Math.round(highest.y)}`, 10, 600);
            }
        }
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
        this.highestPoint = 0;
        this.totalPlatformsGenerated = 0;
        this.lastGenerationHeight = 0;
        this.generateInitialPlatforms();
    }

    validatePlatforms() {
        console.log('🔍 Validating platforms...');
        
        let validCount = 0;
        let invalidCount = 0;
        
        this.platforms.forEach((platform, index) => {
            if (isNaN(platform.x) || isNaN(platform.y)) {
                console.error(`❌ Invalid platform ${index}: x=${platform.x}, y=${platform.y}`);
                invalidCount++;
            } else {
                validCount++;
            }
        });
        
        console.log(`✅ Platform validation: ${validCount} valid, ${invalidCount} invalid`);
        
        if (invalidCount > 0) {
            console.error('❌ Platform validation failed!');
        }
        
        return invalidCount === 0;
    }

    getProgress() {
        return Math.max(0, 600 - this.highestPoint);
    }
    
    getDebugInfo() {
        const startPlatform = this.getStartPlatform();
        const highestPlatform = this.getHighestPlatform();
        const lowestPlatform = this.getLowestPlatform();
        const platformsInView = this.getPlatformsInView();
        
        return {
            totalPlatforms: this.platforms.length,
            platformsInView: platformsInView.length,
            platformsGenerated: this.totalPlatformsGenerated,
            highestPoint: Math.round(this.highestPoint),
            highestPlatformY: highestPlatform ? Math.round(highestPlatform.y) : 'None',
            lowestPlatformY: lowestPlatform ? Math.round(lowestPlatform.y) : 'None',
            lastGenerationHeight: Math.round(this.lastGenerationHeight),
            startPlatform: startPlatform ? {
                x: Math.round(startPlatform.x),
                y: Math.round(startPlatform.y),
                type: startPlatform.type
            } : 'Not found'
        };
    }
}

// Явно добавляем классы в глобальную область видимости
window.Platform = Platform;
window.PlatformManager = PlatformManager;

console.log('✅ Platform classes defined');