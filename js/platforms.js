// Класс платформы
console.log('🔧 Loading Platform classes...');

class Platform {
    constructor(x, y, type = PlatformType.NORMAL) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLATFORMS.WIDTH;
        this.height = CONFIG.PLATFORMS.HEIGHT;
        this.type = type;
        
        if (this.type === PlatformType.MOVING) {
            this.velocityX = (Math.random() - 0.5) * CONFIG.PLATFORMS.MOVE_SPEED;
            this.movingRange = 80 + Math.random() * 40;
            this.startX = x;
        }
        
        if (this.type === PlatformType.BREAKING) {
            this.breaking = false;
            this.breakProgress = 0;
            this.breakTimer = 0;
        }
        
        this.lastCollisionTime = 0;
        this.collisionCount = 0;
        
        console.log(`➕ Created ${type} platform at (${Math.round(x)}, ${Math.round(y)})`);
    }

    // Обновление состояния платформы
    update(deltaTime) {
        if (this.type === PlatformType.MOVING) {
            this.x += this.velocityX;
            
            if (Math.abs(this.x - this.startX) > this.movingRange) {
                this.velocityX *= -1;
            }
        }
        
        if (this.type === PlatformType.BREAKING && this.breaking) {
            this.breakTimer += deltaTime;
            this.breakProgress = this.breakTimer / CONFIG.PLATFORMS.BREAKING_TIME;
            
            if (this.breakProgress >= 1) {
                if (window.LOG_COLLISION) console.log('💥 Platform destroyed');
                return false;
            }
        }
        
        return true;
    }

    // Отрисовка платформы
    draw(ctx, assets) {
        const alpha = this.breaking ? 1 - this.breakProgress : 1;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Выбор изображения в зависимости от типа платформы
        let imageName;
        switch(this.type) {
            case PlatformType.BREAKING:
                imageName = 'platformBreaking';
                break;
            case PlatformType.MOVING:
                imageName = 'platformMoving';
                break;
            default:
                imageName = 'platformNormal';
        }
        
        const image = assets.getImage(imageName);
        
        if (image && image.complete && image.naturalWidth !== 0) {
            ctx.drawImage(image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback отрисовка
            this.drawFallback(ctx);
        }
        
        ctx.restore();
        
        // Отладочная отрисовка
        if (window.DEBUG_MODE) {
            this.drawDebug(ctx);
        }
    }

    // Fallback отрисовка
    drawFallback(ctx) {
        let color;
        switch(this.type) {
            case PlatformType.BREAKING:
                color = CONFIG.COLORS.PLATFORM_BREAKING;
                break;
            case PlatformType.MOVING:
                color = CONFIG.COLORS.PLATFORM_MOVING;
                break;
            default:
                color = CONFIG.COLORS.PLATFORM_NORMAL;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = this.darkenColor(color, 20);
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    // Отладочная отрисовка
    drawDebug(ctx) {
        ctx.strokeStyle = this.breaking ? 'red' : 'green';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Показываем время последней коллизии
        const timeSinceCollision = Date.now() - this.lastCollisionTime;
        if (timeSinceCollision < 1000) {
            ctx.fillStyle = 'white';
            ctx.font = '8px Arial';
            ctx.fillText(`${this.collisionCount}`, this.x + 5, this.y + 12);
        }
    }

    // Начало разрушения платформы
    startBreaking() {
        if (this.type === PlatformType.BREAKING && !this.breaking) {
            this.breaking = true;
            this.breakTimer = 0;
            if (window.LOG_COLLISION) console.log('🟡 Breaking platform activated');
            return true;
        }
        return false;
    }

    // Проверка столкновения с игроком - УЛУЧШЕННАЯ ВЕРСИЯ
    collidesWith(player, currentTime) {
        // СУПЕР-ЗАЩИТА: проверка времени между коллизиями
        const timeSinceCollision = currentTime - this.lastCollisionTime;
        if (timeSinceCollision < CONFIG.PLATFORMS.COLLISION_COOLDOWN) {
            if (window.LOG_COLLISION) console.log(`🚫 Collision blocked: cooldown (${timeSinceCollision}ms < ${CONFIG.PLATFORMS.COLLISION_COOLDOWN}ms)`);
            return false;
        }
        
        // ОЧЕНЬ СТРОГАЯ проверка коллизии
        const isColliding = 
            player.x + player.width > this.x + 8 && // Больший отступ от краев
            player.x < this.x + this.width - 8 &&
            player.y + player.height > this.y &&
            player.y + player.height < this.y + this.height + 5 && // Меньший запас
            player.velocityY > 1.0; // Только при значительном падении
        
        if (!isColliding) {
            return false;
        }
        
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: игрок действительно должен быть над платформой
        if (player.y + player.height > this.y + this.height) {
            return false;
        }
        
        // ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ - КОЛЛИЗИЯ ПРОИСХОДИТ
        this.lastCollisionTime = currentTime;
        this.collisionCount++;
        
        if (window.LOG_COLLISION) {
            console.log(`🎯 COLLISION #${this.collisionCount} on ${this.type} platform`, {
                playerY: player.y.toFixed(1),
                platformY: this.y,
                velocityY: player.velocityY.toFixed(2),
                timeSinceLast: timeSinceCollision + 'ms'
            });
        }
        
        return true;
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

// Менеджер платформ
class PlatformManager {
    constructor() {
        console.log('🔧 Initializing PlatformManager');
        this.platforms = [];
        this.scrollY = 0;
        this.highestPoint = CONFIG.CANVAS.HEIGHT;
        this.totalPlatformsGenerated = 0;
        this.generateInitialPlatforms();
    }

    // Генерация начальных платформ
    generateInitialPlatforms() {
        console.log('🏗️ Generating initial platforms');
        
        // Стартовая платформа под игроком
        this.platforms.push(new Platform(
            CONFIG.CANVAS.WIDTH / 2 - CONFIG.PLATFORMS.WIDTH / 2,
            CONFIG.CANVAS.HEIGHT - 100,
            PlatformType.NORMAL
        ));

        // Генерация остальных платформ
        let currentY = CONFIG.CANVAS.HEIGHT - 180;
        
        for (let i = 0; i < CONFIG.PLATFORMS.START_COUNT - 1; i++) {
            this.generatePlatform(currentY);
            currentY -= this.getRandomGap();
        }
        
        this.updateHighestPoint();
        console.log(`✅ Generated ${this.platforms.length} initial platforms`);
    }

    // Генерация одной платформы на заданной высоте
    generatePlatform(y) {
        const type = this.getRandomPlatformType();
        const x = this.getRandomPlatformX();
        
        this.platforms.push(new Platform(x, y, type));
        this.totalPlatformsGenerated++;
    }

    // Получение случайного типа платформы
    getRandomPlatformType() {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [type, probability] of Object.entries(CONFIG.PLATFORM_PROBABILITIES)) {
            cumulative += probability;
            if (rand <= cumulative) {
                return type.toLowerCase();
            }
        }
        
        return PlatformType.NORMAL;
    }

    // Получение случайной позиции X для платформы
    getRandomPlatformX() {
        const padding = 20;
        return padding + Math.random() * (CONFIG.CANVAS.WIDTH - CONFIG.PLATFORMS.WIDTH - padding * 2);
    }

    // Получение случайного расстояния между платформами
    getRandomGap() {
        return CONFIG.PLATFORMS.MIN_GAP + 
               Math.random() * (CONFIG.PLATFORMS.MAX_GAP - CONFIG.PLATFORMS.MIN_GAP);
    }

    // Обновление состояния всех платформ
    update(playerY, deltaTime) {
        // Обновляем каждую платформу и удаляем разрушенные
        const initialCount = this.platforms.length;
        this.platforms = this.platforms.filter(platform => {
            return platform.update(deltaTime);
        });
        
        const removedCount = initialCount - this.platforms.length;
        if (removedCount > 0 && window.LOG_COLLISION) {
            console.log(`🗑️ Removed ${removedCount} platforms`);
        }

        // Удаляем платформы далеко за пределами экрана
        this.platforms = this.platforms.filter(platform => {
            return platform.y < playerY + CONFIG.CANVAS.HEIGHT + 200;
        });

        // Генерация новых платформ сверху
        const highestPlatform = this.getHighestPlatform();
        if (highestPlatform && highestPlatform.y > CONFIG.PLATFORMS.MIN_GAP) {
            const targetY = highestPlatform.y - this.getRandomGap();
            if (Math.random() < CONFIG.GAME.PLATFORM_SPAWN_RATE) {
                this.generatePlatform(targetY);
            }
        }

        // Прокрутка мира вниз когда игрок поднимается
        let scrollAmount = 0;
        if (playerY < CONFIG.GAME.INITIAL_SCROLL_THRESHOLD) {
            scrollAmount = CONFIG.GAME.INITIAL_SCROLL_THRESHOLD - playerY;
            this.scrollY += scrollAmount;
            
            this.platforms.forEach(platform => {
                platform.y += scrollAmount;
            });
        }

        // Обновление самой высокой точки
        this.updateHighestPoint();
        
        return scrollAmount;
    }

    // Получение самой высокой платформы
    getHighestPlatform() {
        if (this.platforms.length === 0) return null;
        return this.platforms.reduce((lowest, platform) => 
            platform.y < lowest.y ? platform : lowest
        );
    }

    // Обновление самой высокой достигнутой точки
    updateHighestPoint() {
        const highestPlatform = this.getHighestPlatform();
        if (highestPlatform) {
            this.highestPoint = Math.min(this.highestPoint, highestPlatform.y);
        }
    }

    // Отрисовка всех платформ
    draw(ctx, assets) {
        this.platforms.forEach(platform => {
            platform.draw(ctx, assets);
        });
    }

    // Проверка столкновений игрока с платформами
    checkCollisions(player, currentTime) {
        let collisionOccurred = false;
        let collisionPlatform = null;
        
        for (const platform of this.platforms) {
            if (platform.collidesWith(player, currentTime)) {
                collisionOccurred = true;
                collisionPlatform = platform;
                break; // Останавливаемся после первой коллизии
            }
        }
        
        if (collisionOccurred && collisionPlatform) {
            // Запускаем разрушение если это ломающаяся платформа
            if (collisionPlatform.type === PlatformType.BREAKING) {
                collisionPlatform.startBreaking();
            }
        }
        
        return collisionOccurred;
    }

    // Сброс менеджера платформ
    reset() {
        console.log('🔄 Resetting PlatformManager');
        this.platforms = [];
        this.scrollY = 0;
        this.highestPoint = CONFIG.CANVAS.HEIGHT;
        this.totalPlatformsGenerated = 0;
        this.generateInitialPlatforms();
    }

    // Получение текущего прогресса (высоты)
    getProgress() {
        return Math.max(0, CONFIG.CANVAS.HEIGHT - this.highestPoint);
    }
    
    // Методы для отладки
    getDebugInfo() {
        return {
            totalPlatforms: this.platforms.length,
            platformsGenerated: this.totalPlatformsGenerated,
            highestPoint: Math.round(this.highestPoint),
            scrollY: Math.round(this.scrollY)
        };
    }
}

console.log('✅ Platform classes defined');