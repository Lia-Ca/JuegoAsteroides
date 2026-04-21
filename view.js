Asteroids.dibujoPanel = function (ctx, position, direction, scale, path, color) {
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

    ctx.setTransform(1, 0, 0, 1, 0, 0);  //Resetea la transformacion

    ctx.strokeStyle = '#fff';
}

//Creando canvas para dibujar el juego
Asteroids.canvasJuego = function (game, home) {
    var canvas = document.createElement('canvas');
    canvas.width = ANCHO;
    canvas.height = ALTO;
    home.appendChild(canvas);
    return canvas;
}


Asteroids.infoPane = function (game, home) {
    var pane = document.createElement('div');
    pane.innerHTML = 'ASTEROIDS';

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
        setLives: function (game, l) {
            vidas.innerHTML = 'VIDAS: ' + l;
        },
        setScore: function (game, s) {
            puntuacion.innerHTML = 'PUNTUACION: ' + s;
        },
        setLevel: function (game, _level) {
            nivel.innerHTML = 'NIVEL: ' + _level;
        },
        getPane: function () {
            return pane;
        }
    }
}


Asteroids.overlays = function (game) {
    var overlays = [];

    return {
        draw: function (ctx) {
            for (var i = 0; i < overlays.length; i++) {
                overlays[i].draw(ctx);
            }
        },
        add: function (obj) {
            if (-1 == overlays.indexOf(obj) && typeof obj.draw != 'undefined') {
                overlays.push(obj);
                return true;
            }
            return false;
        },
        remove: function (obj) {
            var i = overlays.indexOf(obj);
            if (-1 != i) {
                overlays.splice(i, 1);
                return true;
            }
            return false;
        }
    }
}


Asteroids.gameOver = function (game) {
    return function () {
        console.log('Game over!');

        // Guardar puntuación si es mayor que 0
        if (game.player.getScore() > 0) {
            game.highScores.addScore('Player', game.player.getScore());
        }

        // Agregar overlay con GAME OVER y puntuaciones
        game.overlays.add({
            draw: function (ctx) {
                // Texto GAME OVER grande
                ctx.font = '30px System, monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = '#fff';
                ctx.fillText('GAME OVER', ANCHO / 2, ALTO / 2);

                // Mostrar puntuaciones guardadas
                game.highScores.getScores(function (scores) {
                    ctx.font = '12px System, monospace';
                    for (var i = 0; i < scores.length; i++) {
                        ctx.fillText(
                            scores[i].name + '   ' + scores[i].score,
                            ANCHO / 2,
                            ALTO / 2 + 20 + 14 * i
                        );
                    }
                });
                
                ctx.font = '14px System, monospace';
                ctx.fillStyle = '#ffff00';
                ctx.fillText('🔄 PRESIONA F5 PARA JUGAR DE NUEVO', 
                            ANCHO / 2, ALTO - 30);


            }
        });
    }
}