// player.js - ИСПРАВЛЕННОЕ УПРАВЛЕНИЕ
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
        
        // Настройки для мобильных
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        console.log('✅ Player instance created');
    }

    reset() {
        console.log('🔄 Resetting player state');
        
        this.width = 40;
        this.height = 40;
        this.x = 360 / 2 - this.width / 2;
        this.y = 500 - this.height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        
        this.lastJumpTime = 0;
        this.canJump = true;
        
        this.stats.totalJumps = 0;
        this.stats.consecutiveJumps = 0;
        
        console.log(`✅ Player reset complete at (${Math.round(this.x)}, ${Math.round(this.y)})`);
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
        
        // Движение - ТОЛЬКО для клавиатуры
        this.handleMovement(deltaTime);
        
        // Обновление позиции по Y
        this.y += this.velocityY;
        
        // Границы экрана (телепортация)
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
        // Движение только для клавиатуры (не для касаний)
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
        
        // Применяем скорость только для клавиатуры
        this.x += this.velocityX;
    }

    handleScreenBounds() {
        // Телепортация через границы экрана
        if (this.x < -this.width) {
            this.x = 360;
        } else if (this.x > 360) {
            this.x = -this.width;
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

    // ИСПРАВЛЕННОЕ УПРАВЛЕНИЕ - точное позиционирование
    setExactPosition(x) {
        // Устанавливаем точную позицию X (центрируем игрока под пальцем)
        this.x = x - this.width / 2;
        
        // Ограничиваем позицию в пределах canvas
        this.x = Math.max(0, Math.min(this.x, 360 - this.width));
        
        // Сбрасываем velocityX при управлении касаниями
        this.velocityX = 0;
    }

    // Старый метод для обратной совместимости
    setTargetPosition(x) {
        this.setExactPosition(x);
    }

    clearTargetPosition() {
        this.targetX = null;
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

    getDebugInfo() {
        return {
            position: {
                x: Math.round(this.x),
                y: Math.round(this.y)
            },
            velocity: {
                x: this.velocityX.toFixed(2),
                y: this.velocityY.toFixed(2)
            },
            state: {
                isJumping: this.isJumping,
                canJump: this.canJump,
                lastDirection: this.lastDirection
            },
            stats: {
                totalJumps: this.stats.totalJumps,
                consecutiveJumps: this.stats.consecutiveJumps
            }
        };
    }
}

window.Player = Player;
console.log('✅ Player class defined');