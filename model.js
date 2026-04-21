const ALTO = 500;
const ANCHO = 640;
const FRAME_SEGUNDO = 60;
const TIEMPO_NIVELES = 2000;
// Configuracion paar jugador
const VELOCIDAD_ROTACION = Math.PI / 10;

const TIEMPO_MUERTE = 2000;      //2seg. para la explosion
const TIEMPO_INVICIBLE = 1500;  //1.5seg.
const VIDAS_JUGADOR = 3;
const PUNTOS_1DISPARO = 1;
const VIDA_EXTRA = 1000;

const VELOCIDAD_BALA = 20;
const MAX_BALAS = 3;
const MAX_FRAME_BALA = 25;

const CANT_ASTEROID = 3;
const TAMANO_ASTEROID = 3;
const CANT_DIVISION = 2;
const VELOCIDAD_BASE = 3;
const PUNT_ASTEROID = 10;

var Asteroids = {};

Asteroids.IZQ = 37;
Asteroids.DER = 39;
Asteroids.DISPARO = 32; //PAAR EL ESPACIO



// JUGADOR, objeto nave->posicion, movimiento, dibujo y estado de la nave
Asteroids.player = function (game) {
    var position = [ANCHO / 2, ALTO / 2],
        velocity = [0, 0],
        direction = -Math.PI / 2,
        dead = false,
        invincible = false,
        lastRez = null,   //momento donde revive la nave
        lives = VIDAS_JUGADOR,
        radius = 3,
        score = 0,
        path = [
            [15, 0],
            [-7.5, 7.5],
            [-7.5, -7.5],
            [15, 0],
        ];

    return {
        getPosition: function () { return position; },
        getVelocity: function () { return velocity; },
        getSpeed: function () {
            return Math.sqrt(Math.pow(velocity[0], 2) + Math.pow(velocity[1], 2));
        },
        getDirection: function () { return direction; },
        getRadius: function () { return radius; },
        getLives: function () { return lives; },
        getScore: function () { return score; },
        addScore: function (pts) { score += pts; },
        lowerScore: function (pts) { score -= pts; if (score < 0) score = 0; },
        //+der,-izq
        rotate: function (rad) {
            if (!dead) {
                direction += rad;
            }
        },
        move: function () { Asteroids.move(position, velocity); },
        draw: function (ctx) {
            let color = '#fff';
            if (invincible) {
                const dt = ((new Date) - lastRez) / 200;
                const c = Math.floor(Math.cos(dt) * 16).toString(16);
                color = `#${c}${c}${c}`;
            }
            Asteroids.dibujoPanel(ctx, position, direction, 1, path, color);
        },
        isDead: function () { return dead; },
        isInvincible: function () { return invincible; },
        die: function (game) {
            if (!dead) {
                dead = true;
                invincible = true;
                lives--;
                position = [ANCHO / 2, ALTO / 2];
                velocity = [0, 0];
                direction = -Math.PI / 2;
                if (lives > 0) {
                    setTimeout(function (player, _game) {
                        return function () { player.resurrect(_game); }
                    }(this, game), TIEMPO_MUERTE);
                } else {
                    game.gameOver();
                }
            }
        },
        resurrect: function (game) {
            if (dead) {
                dead = false;
                invincible = true;
                lastRez = new Date;
                setTimeout(function () {
                    invincible = false;
                }, TIEMPO_INVICIBLE);
            }
        },
        //DISPARA BALA
        fire: function (game) {
            if (!dead) {
                var _pos = [position[0], position[1]],
                    _dir = direction;
                this.lowerScore(PUNTOS_1DISPARO);  
                return Asteroids.bala(game, _pos, _dir);
            }
        }
    }
}

Asteroids.bala = function (game, _pos, _dir) {
    var position = [_pos[0], _pos[1]],
        velocity = [0, 0],
        direction = _dir,
        age = 0, //cuantos frames lleva viva la bala
        radius = 1,  //Radio de la bala por colisiones (1pixel)
        path = [[0, 0], [-4, 0]]; //forma de la bala, una linea de 4 pixels

    velocity[0] = VELOCIDAD_BALA * Math.cos(_dir);
    velocity[1] = VELOCIDAD_BALA * Math.sin(_dir);

    return {
        getPosition: function () { return position; },
        getVelocity: function () { return velocity; },
        getSpeed: function () {
            return Math.sqrt(Math.pow(velocity[0], 2) + Math.pow(velocity[1], 2));
        },
        getRadius: function () { return radius; },
        getAge: function () { return age; },
        birthday: function () { age++; },
        move: function () { Asteroids.move(position, velocity); },
        draw: function (ctx) { Asteroids.dibujoPanel(ctx, position, direction, 1, path); }
    }
}

Asteroids.asteroid = function (game, _gen) {
    var position = [0, 0],
        velocity = [0, 0],
        direction = 0,
        generation = _gen,
        radius = 7,
        path = [
            [1, 7], [5, 5], [7, 1], [5, -3], [7, -7],
            [3, -9], [-1, -5], [-4, -2], [-8, -1],
            [-9, 3], [-5, 5], [-1, 3], [1, 7]
        ];

    return {
        getPosition: function () { return position; },
        setPosition: function (pos) { position = pos; },
        getVelocity: function () { return velocity; },
        setVelocity: function (vel) {
            velocity = vel;
            direction = Math.atan2(vel[1], vel[0]);
        },
        getSpeed: function () {
            return Math.sqrt(Math.pow(velocity[0], 2) + Math.pow(velocity[1], 2));
        },
        getRadius: function () { return radius * generation; },
        getGeneration: function () { return generation; },
        move: function () { Asteroids.move(position, velocity); },
        draw: function (ctx) {
            Asteroids.dibujoPanel(ctx, position, direction, generation, path);
        }
    }
}


Asteroids.gestionAsteroides = function (game) {
    var asteroids = [];

    return {
        push: function (obj) {
            return asteroids.push(obj);
        },
        splice: function (i, j) {
            return asteroids.splice(i, j);
        },
        get length() {
            return asteroids.length;
        },
        getIterator: function () {
            return asteroids;
        },
        generationCount: function (_gen) {
            var total = 0;
            for (var i = 0; i < asteroids.length; i++) {
                if (asteroids[i] && asteroids[i].getGeneration() == _gen)
                    total++;
            }
            return total;
        }
    }
}

Asteroids.level = function (game) {
    var level = 0,
        speed = VELOCIDAD_BASE,
        hspeed = VELOCIDAD_BASE / 2;

    return {
        getLevel: function () { return level; },
        levelUp: function (game) {
            level++;
            while (game.asteroids.generationCount(TAMANO_ASTEROID) < level + CANT_ASTEROID) {
                var a = Asteroids.asteroid(game, TAMANO_ASTEROID);
                a.setPosition([Math.random() * ANCHO, Math.random() * ALTO]);
                a.setVelocity([Math.random() * speed - hspeed, Math.random() * speed - hspeed]);
                game.asteroids.push(a);
            }
        }
    }
}
