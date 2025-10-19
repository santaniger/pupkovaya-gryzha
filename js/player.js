// player.js - УПРОЩЕННАЯ ФИЗИКА И УПРАВЛЕНИЕ
console.log('🔧 Loading Player class...');

class Player {
    constructor() {
        console.log('🎮 Creating new Player instance');
        
        this.stats = {
            totalJumps: 0,
            consecutiveJumps: 0
        };
        
        this.reset();
        this.input = {
            left: false,
            right: false
        };
        this.lastDirection = 'right';
        this.targetX = null;
        
        // Настройки для мобильных
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.mobileSensitivity = 0.15;
    }

    reset() {
        console.log('🔄 Resetting player state');
        
        this.width = 40;
        this.height = 40;
        this.x = 360 / 2 - this.width / 2;
        this.y = 500 - this.height; // Позиция над стартовой платформой
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpCount = 0;
        this.targetX = this.x;
        
        this.lastJumpTime = 0;
        this.canJump = true;
        this.jumpCooldown = false;
        
        this.stats.totalJumps = 0;
        this.stats.consecutiveJumps = 0;
        
        console.log(`✅ Player reset complete at (${Math.round(this.x)}, ${Math.round(this.y)})`);
    }

    setTargetPosition(x) {
        // Разные настройки чувствительности для мобильных и десктопа
        const sensitivity = this.isMobile ? this.mobileSensitivity : 0.2;
        this.targetX = (x - 180) * sensitivity + 180 - this.width / 2;
        
        // Ограничиваем позицию в пределах canvas
        this.targetX = Math.max(0, Math.min(this.targetX, 360 - this.width));
    }

    update(deltaTime) {
        // Гравитация всегда применяется
        this.velocityY += 0.4;
        
        // ЖЕСТКОЕ ОГРАНИЧЕНИЕ СКОРОСТИ
        if (this.velocityY > 12) {
            this.velocityY = 12;
        }
        if (this.velocityY < -13) {
            this.velocityY = -13;
        }
        
        // Движение
        this.handleMovement(deltaTime);
        
        // Обновление позиции
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Границы экрана
        this.handleScreenBounds();
        
        // Направление
        this.updateDirection();
        
        // Сброс счетчика последовательных прыжков если падаем
        if (this.velocityY > 2) {
            this.stats.consecutiveJumps = 0;
        }
        
        // Проверка падения
        if (this.y > 600 + 100) {
            console.log('💀 Player fell off screen');
            return false;
        }
        
        return true;
    }

    handleMovement(deltaTime) {
        if (this.targetX !== null) {
            // ПЛАВНОЕ ДВИЖЕНИЕ К ЦЕЛЕВОЙ ПОЗИЦИИ
            const diff = this.targetX - this.x;
            this.velocityX = diff * 0.2;
            
            if (Math.abs(this.velocityX) > 6) {
                this.velocityX = Math.sign(this.velocityX) * 6;
            }
        } else {
            // Управление с клавиатуры
            if (this.input.left) {
                this.velocityX = Math.max(
                    this.velocityX - 0.3, 
                    -6
                );
            } else if (this.input.right) {
                this.velocityX = Math.min(
                    this.velocityX + 0.3, 
                    6
                );
            } else {
                // Трение
                this.velocityX *= 0.85;
                if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
            }
        }
    }

    handleScreenBounds() {
        // Телепортация через границы экрана
        if (this.x < -this.width) {
            this.x = 360;
            if (this.targetX !== null) this.targetX = this.x;
        } else if (this.x > 360) {
            this.x = -this.width;
            if (this.targetX !== null) this.targetX = this.x;
        }
    }

    updateDirection() {
        if (this.velocityX < -0.1) {
            this.lastDirection = 'left';
        } else if (this.velocityX > 0.1) {
            this.lastDirection = 'right';
        }
    }

    jump() {
        const currentTime = Date.now();
        const timeSinceLastJump = currentTime - this.lastJumpTime;
        
        // ПРОСТОЙ КУЛДАУН МЕЖДУ ПРЫЖКАМИ
        if (timeSinceLastJump < 200) {
            return false;
        }
        
        // ПРЫЖОК С ФИКСИРОВАННОЙ СИЛОЙ
        this.velocityY = -12.5;
        this.lastJumpTime = currentTime;
        this.stats.totalJumps++;
        this.stats.consecutiveJumps++;
        
        // ЗАЩИТА ОТ СЛИШКОМ ВЫСОКИХ ПРЫЖКОВ
        if (this.stats.consecutiveJumps >= 3) {
            console.warn('⚠️ Third jump detected - limiting height');
            this.velocityY = Math.max(this.velocityY, -10);
        }
        
        return true;
    }

    onPlatformHit() {
        // ПРОСТОЙ СБРОС СКОРОСТИ
        this.velocityY = 0;
        this.canJump = true;
    }

    draw(ctx, assets) {
        const image = assets.getImage('player');
        
        if (image) {
            if (this.lastDirection === 'left') {
                ctx.save();
                ctx.scale(-1, 1);
                ctx.drawImage(image, -this.x - this.width, this.y, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(image, this.x, this.y, this.width, this.height);
            }
        } else {
            this.drawFallback(ctx);
        }
    }

    drawFallback(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = this.width / 2 - 2;
        
        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY + 2, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Основной круг
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Контур
        ctx.strokeStyle = '#E74C3C';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    setInput(direction, active) {
        if (this.input.hasOwnProperty(direction)) {
            this.input[direction] = active;
        }
    }

    setTargetPosition(x) {
        this.targetX = x - this.width / 2;
    }

    clearTargetPosition() {
        this.targetX = null;
    }
}

// Явно добавляем класс в глобальную область видимости
window.Player = Player;

console.log('✅ Player class defined');