const ALTO = 500;
const ANCHO = 640;
const FRAME_SEGUNDO = 60;
const TIEMPO_NIVELES = 2000;

// Configuracion paar jugador
const VELOCIDAD_ROTACION = Math.PI/10;
const VELOCIDAD_MAX = 15;
const ACELERACION_UP = 1;

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
Asteroids.UP = 38;
Asteroids.DER = 39;
Asteroids.DOWN = 40;
Asteroids.DISPARO = 32; //PAAR EL ESPACIO

var AsteroidsGame = function(home) {
    home.innerHTML = '';
    this.info = Asteroids.infoPane(this, home);
    this.playfield = Asteroids.playfield(this, home);
    this.player = Asteroids.player(this);

    this.keyState = Asteroids.keyState(this);
    this.listen = Asteroids.listen(this);

    this.asteroids = Asteroids.asteroids(this);
    this.level = Asteroids.level(this);

    Asteroids.play(this);
    return this;
}

Asteroids.infoPane = function(game, home) {
    var pane = document.createElement('div');
    pane.innerHTML = 'JUEGO ASTEROIDES';

    var vidas = document.createElement('span');
    vidas.className = 'vidas';
    vidas.innerHTML = 'VIDAS: ' + VIDAS_JUGADOR;

    var puntuacion = document.createElement('span');
    puntuacion.className = 'puntuacion';
    puntuacion.innerHTML = 'PUNTUACION: 0';

    var nivel = document.createElement('span');
    nivel.className = 'nivel';
    nivel.innerHTML = 'NIVEL: 1';

    pane.appendChild(vidas);
    pane.appendChild(puntuacion);
    pane.appendChild(nivel);
    home.appendChild(pane);

    return {
        setLives: function(game, l) {
            vidas.innerHTML = 'VIDAS: ' + l;
        },
        setScore: function(game, s) {
            puntuacion.innerHTML = 'PUNTUACION: ' + s;
        },
        setLevel: function(game, _level) {
            nivel.innerHTML = 'NIVEL: ' + _level;
        },
        getPane: function() {
            return pane;
        }
    }
}

//Creando canvas para dibujar el juego
Asteroids.playfield = function(game, home) {
    var canvas = document.createElement('canvas');
    canvas.width = ANCHO;
    canvas.height = ALTO;
    home.appendChild(canvas);
    return canvas;
}


Asteroids.asteroids = function(game) {
    var asteroids = [];

    return {
        push: function(obj) {
            return asteroids.push(obj);
        },
        pop: function() {
            return asteroids.pop();
        },
        splice: function(i, j) {
            return asteroids.splice(i, j);
        },
        get length() {
            return asteroids.length;
        },
        getIterator: function() {
            return asteroids;
        },
        generationCount: function(_gen) {
            var total = 0;
            for (var i=0; i<asteroids.length; i++) {
                if (asteroids[i] &&  asteroids[i].getGeneration() == _gen)
                    total++;
            }
            return total;
        }
    }
}

// JUGADOR, objeto nave->posicion, movimiento, dibujo y estado de la nave
Asteroids.player = function(game) {
    var position = [ANCHO/2, ALTO/2],
        velocity = [0, 0],
        direction = -Math.PI/2,
        dead = false,
        invincible = false,
        lastRez = null,   //momento donde revive la nave
        lives = VIDAS_JUGADOR,
        score = 0,
        radius = 3,
        path = [
            [15, 0],
            [-7.5, 7.5],
            [-7.5, -7.5],
            [15, 0],
        ];

    return {
        getPosition: function() { return position; },
        getVelocity: function() { return velocity; },
        getSpeed: function() {
            return Math.sqrt(Math.pow(velocity[0], 2) + Math.pow(velocity[1], 2));
        },
        getDirection: function() { return direction; },
        getRadius: function() { return radius; },
        getScore: function() { return score; },
        addScore: function(pts) { score += pts; },
        lowerScore: function(pts) {
            score -= pts;
            if (score < 0) score = 0;
        },
        getLives: function() { return lives; },
        //+der,-izq
        rotate: function(rad) {
            if (!dead) {
                direction += rad;
            }
        },
        thrust: function(force) {  //CHEQUEAR SI LO ELIMINARE O NO -> CHECK?
            if (!dead) {
                velocity[0] += force * Math.cos(direction);
                velocity[1] += force * Math.sin(direction);
                if (this.getSpeed() > VELOCIDAD_MAX) {
                    velocity[0] = VELOCIDAD_MAX * Math.cos(direction);
                    velocity[1] = VELOCIDAD_MAX * Math.sin(direction);
                }
            }
        },
        move: function() { Asteroids.move(position, velocity); },
        draw: function(ctx) {
            let color = '#fff';
            if (invincible) {
                const dt = ((new Date) - lastRez) / 200;
                const c = Math.floor(Math.cos(dt) * 16).toString(16);
                color = `#${c}${c}${c}`;
            }
            Asteroids.drawPath(ctx, position, direction, 1, path, color);
        },
        isDead: function() { return dead; },
        isInvincible: function() { return invincible; },
        extraLife: function(game) {
            lives++;
        },
        die: function(game) {
            if (!dead) {
                dead = true;
                invincible = true;
                lives--;
                position = [ANCHO/2, ALTO/2];
                velocity = [0, 0];
                direction = -Math.PI/2;
                if (lives > 0) {
                    setTimeout(function(player, _game) {
                        return function() { player.resurrect(_game); }
                    }(this, game), TIEMPO_MUERTE);
                } else {
                    game.gameOver();
                }
            }
        },
        resurrect: function(game) {
            if (dead) {
                dead = false;
                invincible = true;
                lastRez = new Date;
                setTimeout(function() {
                    invincible = false;
                }, TIEMPO_INVICIBLE);
            }
        },
        fire: function(game) {
            if (!dead) {
                var _pos = [position[0], position[1]],
                    _dir = direction;
                this.lowerScore(PUNTOS_1DISPARO);
                return Asteroids.bullet(game, _pos, _dir);
            }
        }
    }
}

Asteroids.bullet = function(game, _pos, _dir) {
    var position = [_pos[0], _pos[1]],
        velocity = [0, 0],
        direction = _dir,
        age = 0, //cuantos frames lleva viva la bala
        radius = 1,  //Radio de la bala por colisiones (1pixel)
        path = [[0, 0], [-4, 0]]; //forma de la bala, una linea de 4 pixels

    velocity[0] = VELOCIDAD_BALA * Math.cos(_dir);
    velocity[1] = VELOCIDAD_BALA * Math.sin(_dir);

    return {
        getPosition: function() { return position; },
        getVelocity: function() { return velocity; },
        getSpeed: function() {
            return Math.sqrt(Math.pow(velocity[0], 2) + Math.pow(velocity[1], 2));
        },
        getRadius: function() { return radius; },
        getAge: function() { return age; },
        birthday: function() { age++; },
        move: function() { Asteroids.move(position, velocity); },
        draw: function(ctx) { Asteroids.drawPath(ctx, position, direction, 1, path); }
    }
}

//ESTADO DE TECLAS
Asteroids.keyState = function(_) {
    var state = {
        [Asteroids.IZQ]: false,
        [Asteroids.UP]: false,
        [Asteroids.DER]: false,
        [Asteroids.DOWN]: false,
        [Asteroids.DISPARO]: false
    };

    return {
        on: function(key) { state[key] = true; },
        off: function(key) { state[key] = false; },
        getState: function(key) {
            if (typeof state[key] != 'undefined') return state[key];
            return false;
        }
    }
}

Asteroids.listen = function(game) {
    const keyMap = {
        "ArrowLeft": Asteroids.IZQ,
        "KeyA": Asteroids.IZQ,
        "ArrowRight": Asteroids.DER,
        "KeyD": Asteroids.DER,
        "Space": Asteroids.DISPARO
    };

   window.addEventListener('keydown', function(e) {
        const keyValue = keyMap[e.code];
        if (keyValue !== undefined) {
            e.preventDefault();
            game.keyState.on(keyValue);
            console.log("Tecla presionada:", e.code, "Valor:", keyValue);
            return false;
        }
        return true;
    });

        window.addEventListener('keyup', function(e) {
        const keyValue = keyMap[e.code];
        if (keyValue !== undefined) {
            e.preventDefault();
            game.keyState.off(keyValue);
            return false;
        }
        return true;
    });
}

Asteroids.asteroid = function(game, _gen) {
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
        getPosition: function() { return position; },
        setPosition: function(pos) { position = pos; },
        getVelocity: function() { return velocity; },
        setVelocity: function(vel) {
            velocity = vel;
            direction = Math.atan2(vel[1], vel[0]);
        },
        getSpeed: function() {
            return Math.sqrt(Math.pow(velocity[0], 2) + Math.pow(velocity[1], 2));
        },
        getRadius: function() { return radius * generation; },
        getGeneration: function() { return generation; },
        move: function() { Asteroids.move(position, velocity); },
        draw: function(ctx) {
            Asteroids.drawPath(ctx, position, direction, generation, path);
        }
    }
}

Asteroids.collision = function(a, b) {
    var a_pos = a.getPosition(),
        b_pos = b.getPosition();

    function sq(x) { return Math.pow(x, 2); }

    var distance = Math.sqrt(sq(a_pos[0] - b_pos[0]) + sq(a_pos[1] - b_pos[1]));

    if (distance <= a.getRadius() + b.getRadius()) return true;
    return false;
}

Asteroids.level = function(game) {
    var level = 0,
        speed = VELOCIDAD_BASE,
        hspeed = VELOCIDAD_BASE/2;

    return {
        getLevel: function() { return level; },
        levelUp: function(game) {
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

Asteroids.drawPath = function(ctx, position, direction, scale, path, color) {
    if (!color) color = '#fff';
    ctx.strokeStyle = color;
    ctx.setTransform(
        Math.cos(direction) * scale, Math.sin(direction) * scale,
        -Math.sin(direction) * scale, Math.cos(direction) * scale,
        position[0], position[1]
    );

    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.strokeStyle = '#fff';
}

Asteroids.move = function(position, velocity) {
    position[0] += velocity[0];
    if (position[0] < 0)
        position[0] = ANCHO + position[0];
    else if (position[0] > ANCHO)
        position[0] -= ANCHO;

    position[1] += velocity[1];
    if (position[1] < 0)
        position[1] = ALTO + position[1];
    else if (position[1] > ALTO)
        position[1] -= ALTO;
}



Asteroids.play = function(game) {
    var ctx = game.playfield.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';

    var speed = VELOCIDAD_BASE,
        hspeed = VELOCIDAD_BASE/2;

    game.level.levelUp(game);

    var bullets = [],
        last_fire_state = false,
        last_asteroid_count = 0;

    var extra_lives = 0;

    game.pulse = setInterval(function() {
        var kill_asteroids = [],
            new_asteroids = [],
            kill_bullets = [];

        ctx.save();
        ctx.clearRect(0, 0, ANCHO, ALTO);

        var t_extra_lives = game.player.getScore() / VIDA_EXTRA;
        t_extra_lives = Math.floor(t_extra_lives);
        if (t_extra_lives > extra_lives) {
            game.player.extraLife(game);
        }
        extra_lives = t_extra_lives;

        if (game.keyState.getState(Asteroids.UP)) game.player.thrust(ACELERACION_UP);
        if (game.keyState.getState(Asteroids.IZQ)) game.player.rotate(-VELOCIDAD_ROTACION);
        if (game.keyState.getState(Asteroids.DER)) game.player.rotate(VELOCIDAD_ROTACION);

        var fire_state = game.keyState.getState(Asteroids.DISPARO);
        if (fire_state && (fire_state != last_fire_state) && (bullets.length < MAX_BALAS)) {
            var b = game.player.fire(game);
            bullets.push(b);
        }
        last_fire_state = fire_state;

        if (!game.player.isDead()) {
            game.player.move();
            game.player.draw(ctx);
        }

        for (var k = 0; k < bullets.length; k++) {
            if (!bullets[k]) continue;
            if (bullets[k].getAge() > MAX_FRAME_BALA) {
                kill_bullets.push(k);
                continue;
            }
            bullets[k].birthday();
            bullets[k].move();
            bullets[k].draw(ctx);
        }

        for (var r = kill_bullets.length - 1; r >= 0; r--) {
            bullets.splice(r, 1);
        }

        var asteroids = game.asteroids.getIterator();
        for (var i = 0; i < game.asteroids.length; i++) {
            var killit = false;
            asteroids[i].move();
            asteroids[i].draw(ctx);

            for (var j = 0; j < bullets.length; j++) {
                if (!bullets[j]) continue;
                if (Asteroids.collision(bullets[j], asteroids[i])) {
                    bullets.splice(j, 1);
                    killit = true;
                    continue;
                }
            }

            if (killit) {
                var _gen = asteroids[i].getGeneration() - 1;
                if (_gen > 0) {
                    for (var n = 0; n < CANT_DIVISION; n++) {
                        var a = Asteroids.asteroid(game, _gen);
                        var _pos = [asteroids[i].getPosition()[0], asteroids[i].getPosition()[1]];
                        a.setPosition(_pos);
                        a.setVelocity([Math.random() * speed - hspeed, Math.random() * speed - hspeed]);
                        new_asteroids.push(a);
                    }
                }
                game.player.addScore(PUNT_ASTEROID);
                kill_asteroids.push(i);
                continue;
            }

            if (!game.player.isDead() &&
                !game.player.isInvincible() &&
                Asteroids.collision(game.player, asteroids[i])) {
                game.player.die(game);
            }
        }

        kill_asteroids.sort(function(a, b) { return a - b; });
        for (var m = kill_asteroids.length - 1; m >= 0; m--) {
            game.asteroids.splice(kill_asteroids[m], 1);
        }

        for (var o = 0; o < new_asteroids.length; o++) {
            game.asteroids.push(new_asteroids[o]);
        }

        ctx.restore();

        if (0 == game.asteroids.length && last_asteroid_count != 0) {
            setTimeout(function() {
                game.level.levelUp(game);
            }, TIEMPO_NIVELES);
        }

        last_asteroid_count = game.asteroids.length;

        game.info.setLives(game, game.player.getLives());
        game.info.setScore(game, game.player.getScore());
        game.info.setLevel(game, game.level.getLevel());

    }, FRAME_SEGUNDO);
}

// Load it up!
window.onload = function() {
    new AsteroidsGame(document.getElementById('asteroids'));
};