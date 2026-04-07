// Configuraciones del juego
GAME_HEIGHT = 480;
GAME_WIDTH = 640;
FRAME_PERIOD = 60;
LEVEL_TIMEOUT = 2000;

// Configuraciones del jugador
ROTATE_SPEED = Math.PI/10;
MAX_SPEED = 15;
THRUST_ACCEL = 1;
DEATH_TIMEOUT = 2000;
INVINCIBLE_TIMEOUT = 1500;
PLAYER_LIVES = 3;
POINTS_PER_SHOT = 1;
POINTS_TO_EXTRA_LIFE = 1000;

// Configuraciones de balas
BULLET_SPEED = 20;
MAX_BULLETS = 3;
MAX_BULLET_AGE = 25;

// Configuraciones de asteroides
ASTEROID_COUNT = 2;
ASTEROID_GENERATIONS = 3;
ASTEROID_CHILDREN = 2;
ASTEROID_SPEED = 3;
ASTEROID_SCORE = 10;

// Constantes de log
Asteroids = {};
Asteroids.LOG_ALL = 0;
Asteroids.LOG_INFO = 1;
Asteroids.LOG_DEBUG = 2;
Asteroids.LOG_WARNING = 3;
Asteroids.LOG_ERROR = 4;
Asteroids.LOG_CRITICAL = 5;
Asteroids.LOG_NONE = 6;

// Constantes de teclas
Asteroids.LEFT = 37;
Asteroids.UP = 38;
Asteroids.RIGHT = 39;
Asteroids.DOWN = 40;
Asteroids.FIRE = 32;

Asteroids.drawPath = function (ctx, position, direction, scale, path, color) {
    if (!color) {
        color = '#fff';
    }
    ctx.strokeStyle = color;
    ctx.setTransform(Math.cos(direction) * scale, Math.sin(direction) * scale,
                     -Math.sin(direction) * scale, Math.cos(direction) * scale,
                     position[0], position[1]);

    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (i=1; i<path.length; i++) {
        ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle = '#fff';
}

Asteroids.move = function (position, velocity) {
    position[0] += velocity[0];
    if (position[0] < 0)
        position[0] = GAME_WIDTH + position[0];
    else if (position[0] > GAME_WIDTH)
        position[0] -= GAME_WIDTH;

    position[1] += velocity[1];
    if (position[1] < 0)
        position[1] = GAME_HEIGHT + position[1];
    else if (position[1] > GAME_HEIGHT)
        position[1] -= GAME_HEIGHT;
}

Asteroids.collision = function (a, b) {
    var a_pos = a.getPosition(),
        b_pos = b.getPosition();

    function sq (x) {
        return Math.pow(x, 2);
    }

    var distance = Math.sqrt(sq(a_pos[0] - b_pos[0]) +
                             sq(a_pos[1] - b_pos[1]));

    if (distance <= a.getRadius() + b.getRadius())
        return true;
    return false;
}

Asteroids.logger = function(game) {
    if (typeof console != 'undefined' &&
        typeof console.log != 'undefined') {
        return {
            info: function(msg) {
                if (game.log_level <= Asteroids.LOG_INFO) console.log(msg);
            },
            debug: function(msg) {
                if (game.log_level <= Asteroids.LOG_DEBUG) console.log(msg);
            },
            warning: function(msg) {
                if (game.log_level <= Asteroids.LOG_WARNING) console.log(msg);
            },
            error: function(msg) {
                if (game.log_level <= Asteroids.LOG_ERROR) console.log(msg);
            },
            critical: function(msg) {
                if (game.log_level <= Asteroids.LOG_CRITICAL) console.log(msg);
            }
        }
    } else {
        return {
            info: function(msg){},
            debug: function(msg){},
            warning: function(msg){},
            error: function(msg){},
            critical: function(msg){},
        }
    }
}

Asteroids.stars = function () {
    var stars = [];
    for (var i=0; i<50; i++) {
        stars.push([Math.random()*GAME_WIDTH, Math.random()*GAME_HEIGHT]);
    }
    return {
        draw: function(ctx) {
            var ii = stars.length;
            for(var i=0; i<ii; i++) {
                ctx.fillRect(stars[i][0], stars[i][1], 1, 1);
            }
        }
    }
}
