let canvas;
let ctx;

// Игровые переменные
const player = {
    x: 100,
    y: 300,
    width: 35,
    height: 45,
    velocityX: 0,
    velocityY: 0,
    speed: 6,
    jumpPower: -13,
    onGround: false,
    facing: 1, // 1 = right, -1 = left
    color: '#FF00FF',
    trail: [],
    screamCount: 0,
    rotation: 0
};

const gravity = 0.9;
const friction = 0.8;

// Частицы для эффектов
const particles = [];

// Враги
const enemies = [
    { x: 400, y: 500, width: 40, height: 40, speed: 2, direction: 1, type: 'flying' },
    { x: 600, y: 200, width: 40, height: 40, speed: 2.5, direction: -1, type: 'flying' },
    { x: 300, y: 350, width: 50, height: 50, speed: 1.5, direction: 1, type: 'ground' }
];

// Смешные сообщения
const memeMessages = [
    "ОЙ БЛЯТЬ!",
    "ТЫ УПАЛ ДАУН!",
    "НАКОНЕЦ-ТО СОБРАЛ МОНЕТУ!",
    "КРИЧАТЬ ЕЩЕ!",
    "ФИЗИКА СЛОМАНА!",
    "ЭТО БАГ ИЛИ ФИЧА?",
    "SILKSONG КОГДА?",
    "БЕГИ БЫСТРЕЕ!",
    "ТЫ ПРОИГРАЛ!",
    "ИГРА НЕ ОПТИМИЗИРОВАНА!"
];

// Платформы
const platforms = [
    { x: 0, y: 550, width: 200, height: 50 },
    { x: 250, y: 500, width: 150, height: 50 },
    { x: 450, y: 450, width: 150, height: 50 },
    { x: 650, y: 400, width: 150, height: 50 },
    { x: 200, y: 350, width: 100, height: 50 },
    { x: 500, y: 300, width: 100, height: 50 },
    { x: 700, y: 550, width: 100, height: 50 },
    { x: 0, y: 200, width: 100, height: 50 },
    { x: 400, y: 200, width: 150, height: 50 },
    { x: 650, y: 150, width: 150, height: 50 }
];

// Монеты
const coins = [
    { x: 300, y: 460, collected: false, size: 15 },
    { x: 500, y: 410, collected: false, size: 15 },
    { x: 750, y: 360, collected: false, size: 15 },
    { x: 250, y: 310, collected: false, size: 15 },
    { x: 550, y: 260, collected: false, size: 15 },
    { x: 700, y: 110, collected: false, size: 15 },
    { x: 50, y: 160, collected: false, size: 15 },
    { x: 450, y: 160, collected: false, size: 15 }
];

let score = 0;
let health = 100;
let damage = 0;
let keys = {};
let frameCount = 0;
let shakeOffset = { x: 0, y: 0 };

function scream() {
    player.screamCount++;
    showMemeMessage("ААААААААААААА!!!");
    createParticles(player.x + player.width/2, player.y + player.height/2, 20, '#FF00FF');
    shakeOffset = { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 };
    setTimeout(() => { shakeOffset = { x: 0, y: 0 }; }, 200);
}

function resetGame() {
    player.x = 100;
    player.y = 300;
    player.velocityX = 0;
    player.velocityY = 0;
    player.trail = [];
    player.screamCount = 0;
    score = 0;
    health = 100;
    damage = 0;
    frameCount = 0;
    particles.length = 0;
    coins.forEach(coin => coin.collected = false);
    enemies.forEach(enemy => {
        if (enemy.type === 'flying') {
            enemy.y = 100 + Math.random() * 400;
        }
    });
    updateUI();
    showMemeMessage("РЕСТАРТ! НАЧИНАЕМ СНОВА!");
}

function updateUI() {
    document.getElementById('health').textContent = Math.max(0, health);
    document.getElementById('coins').textContent = score;
    document.getElementById('damage').textContent = damage;
}

function showMemeMessage(text) {
    const msgEl = document.getElementById('memeMessage');
    msgEl.textContent = text;
    msgEl.style.animation = 'none';
    setTimeout(() => {
        msgEl.style.animation = 'textShake 0.3s infinite';
    }, 10);
    setTimeout(() => {
        if (msgEl.textContent === text) {
            msgEl.textContent = '';
        }
    }, 2000);
}

function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            velocityX: (Math.random() - 0.5) * 10,
            velocityY: (Math.random() - 0.5) * 10,
            life: 30,
            maxLife: 30,
            size: Math.random() * 5 + 2,
            color: color || `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
}

function handleInput() {
    // Движение (безумное ускорение)
    if (keys['a'] || keys['arrowleft']) {
        player.velocityX = -player.speed;
        player.facing = -1;
        player.rotation -= 0.2;
    } else if (keys['d'] || keys['arrowright']) {
        player.velocityX = player.speed;
        player.facing = 1;
        player.rotation += 0.2;
    } else {
        player.velocityX *= friction;
        player.rotation *= 0.9;
    }

    // Прыжок (улучшенный)
    if ((keys['w'] || keys[' '] || keys['arrowup']) && player.onGround) {
        player.velocityY = player.jumpPower;
        player.onGround = false;
        createParticles(player.x + player.width/2, player.y + player.height, 5, '#00FFFF');
    }
    
    // Добавляем след при движении
    if (Math.abs(player.velocityX) > 0.5) {
        player.trail.push({
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            life: 20,
            size: 10
        });
        if (player.trail.length > 15) {
            player.trail.shift();
        }
    }
}

function updatePhysics() {
    // Применение гравитации
    player.velocityY += gravity;
    
    // Обновление позиции
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Проверка границ экрана
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y < 0) player.y = 0;

    // Проверка коллизий с платформами
    player.onGround = false;
    
    for (let platform of platforms) {
        if (player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y) {
            
            // Определение стороны коллизии
            const overlapTop = (player.y + player.height) - platform.y;
            const overlapBottom = (platform.y + platform.height) - player.y;
            const overlapLeft = (player.x + player.width) - platform.x;
            const overlapRight = (platform.x + platform.width) - player.x;
            
            const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
            
            if (minOverlap === overlapTop && player.velocityY > 0) {
                // Сверху
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
            } else if (minOverlap === overlapBottom && player.velocityY < 0) {
                // Снизу
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            } else if (minOverlap === overlapLeft) {
                // Слева
                player.x = platform.x - player.width;
                player.velocityX = 0;
            } else if (minOverlap === overlapRight) {
                // Справа
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    }

    // Обновление врагов
    enemies.forEach(enemy => {
        if (enemy.type === 'flying') {
            enemy.x += enemy.speed * enemy.direction;
            enemy.y += Math.sin(frameCount * 0.1) * 2;
            if (enemy.x < 0 || enemy.x > canvas.width) {
                enemy.direction *= -1;
            }
        } else {
            enemy.x += enemy.speed * enemy.direction;
            if (enemy.x < 0 || enemy.x > canvas.width) {
                enemy.direction *= -1;
            }
        }
        
        // Коллизия с игроком
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            health -= 15;
            damage += 15;
            player.velocityX += enemy.direction * 5;
            player.velocityY = -8;
            createParticles(player.x + player.width/2, player.y + player.height/2, 15, '#FF0000');
            showMemeMessage("ОЙ БЛЯТЬ! ВРАГ!");
            if (health <= 0) {
                health = 0;
                showMemeMessage("GAME OVER! ТЫ ПРОИГРАЛ!");
            }
            updateUI();
        }
    });
    
    // Обновление частиц
    particles.forEach((particle, index) => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.velocityY += 0.2;
        particle.life--;
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
    
    // Обновление следа
    player.trail.forEach(trail => {
        trail.life--;
        trail.size *= 0.95;
    });
    player.trail = player.trail.filter(t => t.life > 0);

    // Проверка падения
    if (player.y > canvas.height) {
        health -= 20;
        damage += 20;
        createParticles(player.x + player.width/2, canvas.height, 25, '#FF0000');
        player.x = 100;
        player.y = 300;
        player.velocityY = 0;
        showMemeMessage("ТЫ УПАЛ ДАУН! -20 HP");
        if (health <= 0) {
            health = 0;
            showMemeMessage("GAME OVER! НАЖМИ R!");
        }
        updateUI();
    }

    // Сбор монет
    coins.forEach(coin => {
        if (!coin.collected) {
            const dist = Math.sqrt(
                Math.pow(player.x + player.width/2 - coin.x, 2) +
                Math.pow(player.y + player.height/2 - coin.y, 2)
            );
            if (dist < coin.size + player.width/2) {
                coin.collected = true;
                score += 10;
                createParticles(coin.x, coin.y, 10, '#FFD700');
                showMemeMessage("МОНЕТА! +10 ОЧКОВ!");
                updateUI();
            }
        }
    });

    // Проверка победы
    if (coins.every(coin => coin.collected)) {
        showMemeMessage("ПОБЕДА! ВСЕ МОНЕТЫ! НАЖМИ R!");
    }
    
    frameCount++;
}

function draw() {
    ctx.save();
    ctx.translate(shakeOffset.x, shakeOffset.y);
    
    // Безумный фон
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(${frameCount * 2 % 360}, 70%, 60%)`);
    gradient.addColorStop(0.5, `hsl(${(frameCount * 2 + 60) % 360}, 70%, 60%)`);
    gradient.addColorStop(1, `hsl(${(frameCount * 2 + 120) % 360}, 70%, 60%)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем землю (безумную)
    ctx.fillStyle = `hsl(${frameCount * 3 % 360}, 100%, 50%)`;
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    // Текстура земли
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.fillStyle = `hsl(${(frameCount * 3 + i) % 360}, 100%, 40%)`;
        ctx.fillRect(i, canvas.height - 50, 10, 50);
    }
    
    // Рисуем облака (вращающиеся)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    drawCloud(100 + Math.sin(frameCount * 0.05) * 10, 50);
    drawCloud(300 + Math.cos(frameCount * 0.05) * 10, 80);
    drawCloud(500 + Math.sin(frameCount * 0.05 + 1) * 10, 60);
    drawCloud(700 + Math.cos(frameCount * 0.05 + 1) * 10, 70);

    // Рисуем след игрока
    player.trail.forEach((trail, index) => {
        ctx.globalAlpha = trail.life / 20;
        ctx.fillStyle = `hsl(${(frameCount * 5 + index * 20) % 360}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Рисуем платформы (с эффектом)
    platforms.forEach((platform, index) => {
        ctx.fillStyle = `hsl(${(frameCount * 2 + index * 30) % 360}, 80%, 40%)`;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        // Блеск на платформах
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(platform.x + 5, platform.y + 5, platform.width - 10, 10);
    });

    // Рисуем монеты (вращающиеся)
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.save();
            ctx.translate(coin.x, coin.y);
            ctx.rotate(frameCount * 0.1);
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, coin.size + Math.sin(frameCount * 0.2) * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(-4, -4, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    });

    // Рисуем врагов
    enemies.forEach(enemy => {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        // Глаза врага
        ctx.fillStyle = '#FFF';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 8, 8);
        ctx.fillRect(enemy.x + 24, enemy.y + 8, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(enemy.x + 10, enemy.y + 10, 4, 4);
        ctx.fillRect(enemy.x + 26, enemy.y + 10, 4, 4);
        // Рот
        ctx.fillStyle = '#000';
        ctx.fillRect(enemy.x + 12, enemy.y + 25, 16, 5);
    });

    // Рисуем частицы
    particles.forEach(particle => {
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Рисуем игрока
    ctx.save();
    ctx.translate(player.x + player.width/2, player.y + player.height/2);
    ctx.rotate(player.rotation);
    
    // Отражение если идет влево
    if (player.facing === -1) {
        ctx.scale(-1, 1);
    }
    
    drawPlayer(-player.width/2, -player.height/2);
    ctx.restore();
    
    ctx.restore();
}

function drawPlayer(x, y) {
    // Свечение
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    
    // Тело (меняет цвет)
    ctx.fillStyle = `hsl(${(frameCount * 5) % 360}, 100%, 50%)`;
    ctx.fillRect(x, y, player.width, player.height);
    
    // Голова (кривая)
    ctx.fillStyle = '#FFDBAC';
    ctx.fillRect(x + 5, y - 10, 20, 15);
    
    // Глаза (безумные)
    ctx.fillStyle = '#000';
    let eyeOffset = Math.sin(frameCount * 0.3) * 2;
    ctx.fillRect(x + 8 + eyeOffset, y - 7, 5, 5);
    ctx.fillRect(x + 18 + eyeOffset, y - 7, 5, 5);
    
    // Блеск в глазах
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 9 + eyeOffset, y - 6, 2, 2);
    ctx.fillRect(x + 19 + eyeOffset, y - 6, 2, 2);
    
    // Рот (если кричит)
    if (player.screamCount % 2 === 1) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 10, y - 2, 10, 8);
    }
    
    // Крылья (пародия на Silksong, двигаются)
    ctx.fillStyle = `hsl(${(frameCount * 3) % 360}, 100%, 60%)`;
    let wingOffset = Math.sin(frameCount * 0.2) * 3;
    ctx.beginPath();
    ctx.ellipse(x - 5, y + 10 + wingOffset, 8, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + player.width + 5, y + 10 + wingOffset, 8, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Оружие (пародия, светится)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + player.width - 5, y + 5, 18, 4);
    ctx.fillStyle = '#FFFF00';
    ctx.fillRect(x + player.width - 3, y + 6, 14, 2);
    
    ctx.shadowBlur = 0;
}

function drawCloud(x, y) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + Math.sin(frameCount * 0.1) * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.fill();
}

// Игровой цикл
function gameLoop() {
    handleInput();
    updatePhysics();
    draw();
    requestAnimationFrame(gameLoop);
}

// Инициализация после загрузки DOM
window.addEventListener('DOMContentLoaded', () => {
    // Получаем canvas и context
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas не найден!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Не удалось получить контекст canvas!');
        return;
    }
    
    // Установка размера канваса
    canvas.width = 800;
    canvas.height = 600;
    
    // Обработка клавиатуры
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === 'r' || e.key === 'R') {
            resetGame();
        }
        if (e.key === 's' || e.key === 'S') {
            scream();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
    
    updateUI();
    gameLoop();
    console.log('Игра запущена!');
});

