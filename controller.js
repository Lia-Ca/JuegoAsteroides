
//Registra y recuerda las teclas
Asteroids.EstadoDeTeclas = function (_) {
    var state = {
        [Asteroids.IZQ]: false,
        [Asteroids.DER]: false,
        [Asteroids.DISPARO]: false
    };

    return {
        on: function (key) { state[key] = true; },
        off: function (key) { state[key] = false; },
        getState: function (key) {
            if (typeof state[key] != 'undefined') return state[key];
            return false;
        }
    }
}

Asteroids.listen = function (game) {
    const keyMap = {
        "ArrowLeft": Asteroids.IZQ,
        "KeyA": Asteroids.IZQ,
        "ArrowRight": Asteroids.DER,
        "KeyD": Asteroids.DER,
        "Space": Asteroids.DISPARO
    };

    window.addEventListener('keydown', function (e) {
        const keyValue = keyMap[e.code];
        if (keyValue !== undefined) {
            e.preventDefault();
            game.keyState.on(keyValue);
            console.log("Tecla presionada:", e.code, "Valor:", keyValue);
            return false;
        }
        return true;
    });

    window.addEventListener('keyup', function (e) {
        const keyValue = keyMap[e.code];
        if (keyValue !== undefined) {
            e.preventDefault();
            game.keyState.off(keyValue);
            return false;
        }
        return true;
    });
}
Asteroids.move = function (position, velocity) {
    position[0] += velocity[0];
    if (position[0] < 0)   //borde izquierdp
        position[0] = ANCHO + position[0];
    else if (position[0] > ANCHO)
        position[0] -= ANCHO;

    position[1] += velocity[1];
    if (position[1] < 0)
        position[1] = ALTO + position[1];
    else if (position[1] > ALTO)
        position[1] -= ALTO;
}

Asteroids.collision = function (a, b) {
    var a_pos = a.getPosition(),
        b_pos = b.getPosition();

    function sq(x) { return Math.pow(x, 2); }

    var distance = Math.sqrt(sq(a_pos[0] - b_pos[0]) + sq(a_pos[1] - b_pos[1]));

    if (distance <= a.getRadius() + b.getRadius()) return true;
    return false;
}


Asteroids.highScores = function (game) {
    // Crear base de datos PouchDB
    var db = new PouchDB('asteroids-high-scores');
    var scores = [];

    // Cargar puntuaciones guardadas al iniciar
    db.get('high-scores').then(function (doc) {
        scores = doc.scores || [];
        console.log('Puntuaciones cargadas desde PouchDB:', scores);
    }).catch(function (err) {
        if (err.name === 'not_found') {
            console.log('No hay puntuaciones guardadas aún');
            scores = [];
        } else {
            console.error('Error al leer PouchDB:', err);
        }
    });

    return {
        // Obtener puntuaciones (con callback para asincronía)
        getScores: function (callback) {
            db.get('high-scores').then(function (doc) {
                scores = doc.scores || [];
                if (callback) callback(scores);
            }).catch(function (err) {
                if (callback) callback([]);
            });
            return scores;
        },

        // Guardar nueva puntuación
        addScore: function (_name, _score) {
            scores.push({ name: _name, score: _score });
            scores.sort(function (a, b) { return b.score - a.score; });
            if (scores.length > 10) scores.length = 10;

            console.log('Guardando puntuación en PouchDB:', _score);

            // Intentar actualizar documento existente
            db.get('high-scores').then(function (doc) {
                doc.scores = scores;
                return db.put(doc);
            }).catch(function (err) {
                if (err.name === 'not_found') {
                    // Primera vez: crear el documento
                    return db.put({
                        _id: 'high-scores',
                        scores: scores
                    });
                } else {
                    console.error('Error al guardar en PouchDB:', err);
                }
            }).then(function () {
                console.log('Puntuación guardada correctamente');
            });
        }
    }
}


Asteroids.play = function (game) {
    var ctx = game.playfield.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';

    var speed = VELOCIDAD_BASE,
        hspeed = VELOCIDAD_BASE / 2;

    game.level.levelUp(game);

    var bullets = [],
        last_fire_state = false,
        last_asteroid_count = 0;

    game.pulse = setInterval(function () {
        var kill_asteroids = [],
            new_asteroids = [],
            kill_bullets = [];

        ctx.save();
        ctx.clearRect(0, 0, ANCHO, ALTO);

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

        kill_asteroids.sort(function (a, b) { return a - b; });
        for (var m = kill_asteroids.length - 1; m >= 0; m--) {
            game.asteroids.splice(kill_asteroids[m], 1);
        }

        for (var o = 0; o < new_asteroids.length; o++) {
            game.asteroids.push(new_asteroids[o]);
        }

        ctx.restore(); //restaura estado del canvas

        if (0 == game.asteroids.length && last_asteroid_count != 0) {
            setTimeout(function () {
                game.level.levelUp(game);
            }, TIEMPO_NIVELES);
        }

        last_asteroid_count = game.asteroids.length;
        game.overlays.draw(ctx);
        
        // Actualizar panel
        game.info.setLives(game, game.player.getLives());
        game.info.setScore(game, game.player.getScore());
        game.info.setLevel(game, game.level.getLevel());

    }, FRAME_SEGUNDO);
}


var AsteroidsGame = function (home) {
    home.innerHTML = '';

    this.info = Asteroids.infoPane(this, home);
    this.playfield = Asteroids.canvasJuego(this, home);
    this.player = Asteroids.player(this);

    this.keyState = Asteroids.EstadoDeTeclas(this);
    this.listen = Asteroids.listen(this);

    this.asteroids = Asteroids.gestionAsteroides(this);
    this.overlays = Asteroids.overlays(this);      // ← NUEVO
    this.highScores = Asteroids.highScores(this);
    this.level = Asteroids.level(this);
    this.gameOver = Asteroids.gameOver(this);

    Asteroids.play(this);

    return this;
}

window.onload = function () {
    new AsteroidsGame(document.getElementById('asteroids'));
};