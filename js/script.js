/**
 * Created by mathermann on 27/04/2018.
 */
var ROWS = 6, COLS = 7;         //map dimensions
var EMPTY =0, P1 = 1, P2 = 2;   //enum for map cells
var DELAY = 100;                //Delay between animation frames
var GameMode = {                //enum for game modes
    PLAY_VS_AI: 1,
    PLAYER_VS_PLAYER: 2
};
var Difficulty = {              //enum for AI levels
    BEGINNER: 1,
    INTERMEDIATE: 2,
    PROFESSIONAL: 3,
    EXPERT: 4
};


var map;                        //the game map
var pane;                       //html div which display the game
var activePlayer;               //the player who must play now
var animationRunning;           //is set to true when animation is running
var round;                      //The game round

var gameMode;                   //the game mode
var difficulty;                 //AI level


function reset() {
    if(!confirm('The game will restart, do you want to continue ?')) return;

    initGame();
}
function setGameMode(mode) {
    if(!confirm('The game will restart, do you want to continue ?')) return;

    initGame();
    gameMode = mode;
}
function setDifficulty(new_difficulty) {
    if(!confirm('The game will restart, do you want to continue ?')) return;

    initGame();
    difficulty = new_difficulty;
}

function initAll() {
    initGame();
    initSettings();
}

function initSettings() {
    gameMode = GameMode.PLAY_VS_AI;
    difficulty = Difficulty.BEGINNER;
}

function initGame()
{
    map = new Map([
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]
    ]);

    activePlayer = P1;
    animationRunning = false;
    round = 1;

    pane = document.getElementById('pane');
    pane.innerHTML = '';

    var html = '';
    for(r=0; r<ROWS; r++) {
       html += '<div class="row">';
        for (c = 0; c < COLS; c++) {
            html += '<img src="img/' + map.map[r][c] + '.png" id="' + r + c +'">';
        }
        html += '</div>';
    }

    pane.innerHTML += html;

    for(r=0; r<ROWS; r++) {
        for (c = 0; c < COLS; c++) {
            (function () {
                var img = document.getElementById(r + '' + c);
                var col = img.id[1];
                img.addEventListener('click', function (e) {
                    if(!map.canPlay(col)) return;

                    if(gameMode == GameMode.PLAYER_VS_PLAYER && !animationRunning) {
                        timeNeeded = play(col, activePlayer);
                        setTimeout(checkForEnd, timeNeeded);
                        switchPlayer();
                    }
                    else if (activePlayer === P1 && !animationRunning) {
                        timeNeeded = play(col, activePlayer);

                        displayThinking();

                        setTimeout(function () {
                            if(checkForEnd()) {
                                hideThinking();
                                return;
                            }

                            switchPlayer();

                            timeNeeded = play(new AI(map, P2).bestMove(), activePlayer);
                            setTimeout(checkForEnd, timeNeeded);
                            hideThinking();

                            switchPlayer();
                            ++round;
                        }, timeNeeded);
                    }
                });
            })();
        }
    }
}

function displayThinking() {
    document.getElementById('thinking').style.display = 'block';
}
function hideThinking() {
    document.getElementById('thinking').style.display = 'none';
}

function switchPlayer() {
    activePlayer = opponent(activePlayer);
}

function opponent(player) {
    return player === P1 ? P2 : P1;
}

function play(column, player) {
    var row = map.move(player, column);

    animate(column, 0, row, player);

    return (row + 1) * DELAY;
}

function animate(column, currentRow, targetRow, player) {
    if(currentRow === 0) animationRunning = true;

    var img = document.getElementById(currentRow + '' + column);
    img.setAttribute('src', 'img/' + player + '.png');

    if(currentRow < targetRow) {
        setTimeout(function () {
            img.setAttribute('src', 'img/' + EMPTY + '.png');
            animate(column, currentRow + 1, targetRow, player);
        }, DELAY);
    }
    else
        animationRunning = false;
}

function checkForEnd() {
    var end = false;

    if(map.playerWon(P1)) {
        alert(gameMode == GameMode.PLAYER_VS_PLAYER ? 'Player 1 wins !' : 'You win !');
        end = true;
    }
    else if(map.playerWon(P2)) {
        alert(gameMode == GameMode.PLAYER_VS_PLAYER ? 'Player 2 wins !' : 'Computer wins !');
        end = true;
    }
    else if(map.isFull()) {
        alert('Draw game !');
        end = true;
    }

    if(end) initGame();

    return end;
}


/* class Map */

function Map(map) {
    this.map = map;

    this.move = function (player, col) {
        for(r=0; r<ROWS; r++) {
            if (r === ROWS - 1 || this.map[r + 1][col] !== EMPTY) {
                this.map[r][col] = player;
                return r;
            }
        }

        return -1;
    };

    this.afterMove = function (player, col) {
        var map_after = this.clone();
        map_after.move(player, col);
        return map_after;
    };

    this.canPlay = function (col) {
        return this.map[0][col] === EMPTY;
    };

    this.undo = function (row, col) {
        this.map[row][col] = EMPTY;
    };

    this.isFull = function () {
        for(r=0; r<ROWS; ++r)
            for(c=0; c<COLS; ++c)
                if(this.map[r][c] === EMPTY) return false;

        return true;
    };

    this.endOfGame = function () {
        return this.isFull() || this.playerWon(P1) || this.playerWon(P2);
    };

    this.playerWon = function (player) {
        //Horizontal -
        for(c=0; c<=3; c++)
        {
            for(r=0; r<ROWS; r++)
            {
                if(this.map[r][c] === player && this.map[r][c+1] === player && this.map[r][c+2] === player && this.map[r][c+3] === player)
                    return true;
            }
        }

        //Vertical |
        for(r=0; r<=2; r++)
        {
            for(c=0; c<COLS; c++)
            {
                if(this.map[r][c] === player && this.map[r+1][c] === player && this.map[r+2][c] === player && this.map[r+3][c] === player)
                    return true;
            }
        }

        //First diagonal \
        for(c=0; c<=3; c++)
        {
            for(r=0; r<=2; r++)
            {
                if(this.map[r][c] === player && this.map[r+1][c+1] === player && this.map[r+2][c+2] === player && this.map[r+3][c+3] === player)
                    return true;
            }
        }

        //Second diagonal /
        for(c=COLS-1; c>=3; c--)
        {
            for(r=0; r<=2; r++)
            {
                if(this.map[r][c] === player && this.map[r+1][c-1] === player && this.map[r+2][c-2] === player && this.map[r+3][c-3] === player)
                    return true;
            }
        }

        return false;
    };

    this.clone = function () {
        return new Map(JSON.parse(JSON.stringify(this.map)));
    };

    this.evalPosition = function (player) {
        if(this.endOfGame())
        {
            if(this.playerWon(player)) return 1000000 - this.countTokens();
            else if(this.playerWon(opponent(player))) return -1000000 + this.countTokens();
            else return 0;
        }

        return (5*this.align3Count(player) + 3*this.evalTokensPosition(player) - 2*this.align3Count(opponent(player)) - this.evalTokensPosition(opponent(player))) / this.countTokens();
    };

    this.countTokens = function () {
        var tokens = 0;

        for(r=0; r<ROWS; ++r)
            for(c=0; c<COLS; ++c)
                if(this.map[r][c] !== EMPTY) ++tokens;

        return tokens;
    };

    this.align3Count = function (player) {
        var value = 0;

        //Horizontal -
        for(c=0; c<=4; c++)
        {
            for(r=0; r<ROWS; r++)
            {
                if(this.map[r][c] === player && this.map[r][c+1] === player && this.map[r][c+2] === player)
                    ++value;
            }
        }

        //Vertical |
        for(r=0; r<=3; r++)
        {
            for(c=0; c<COLS; c++)
            {
                if(this.map[r][c] === player && this.map[r+1][c] === player && this.map[r+2][c] === player)
                    ++value;
            }
        }

        //First diagonal \
        for(c=0; c<=4; c++)
        {
            for(r=0; r<=3; r++)
            {
                if(this.map[r][c] === player && this.map[r+1][c+1] === player && this.map[r+2][c+2] === player)
                    ++value;
            }
        }

        //Second diagonal /
        for(c=COLS-1; c>=2; c--)
        {
            for(r=0; r<=3; r++)
            {
                if(this.map[r][c] === player && this.map[r+1][c-1] === player && this.map[r+2][c-2] === player)
                    ++value;
            }
        }

        return value;
    };

    this.evalTokensPosition = function (player) {
        var value = 0;

        for(r=0; r<ROWS; ++r)
            for(c=0; c<COLS; ++c)
                if(this.map[r][c] === player)
                {
                    value += Math.abs(c - 3);
                }

        return 30 - value;
    }
}


/* The AI */

function AI(map, role) {
    this.map = map;
    this.myID = role;
    this.moreDepth = [0, 2, 4, 7, 10, 20, 42];//[0, 0, 1, 3, 5, 12];
    this.depthLimit = 2 * difficulty;


    this.bestMove = function () {
        if(round === 1) return 3;

        if(difficulty == Difficulty.EXPERT) {
            var fullCols = 0;
            for (var c = 0; c < COLS; c++) {
                if (!this.map.canPlay(c)) ++fullCols;
            }
            this.depthLimit += this.moreDepth[fullCols];

            console.log('depth : ' + this.depthLimit);
        }

        // var max_val = -1000000, move = -1, moves = this.getMovesArray();
        //
        // for(var i=0; i<COLS; ++i)
        // {
        //     var col = moves[i];
        //
        //     if(!this.map.canPlay(col)) continue;
        //
        //     var val = this.min(this.map.afterMove(this.myID, col), this.depthLimit - 1);
        //
        //     if(val > max_val)
        //     {
        //         max_val = val;
        //         move = col;
        //     }
        //
        //     console.log(col + ' -> ' + val);
        // }

        var alpha = -1000000, beta = 1000000, move = -1, moves = this.getMovesArray();

        for(var i=0; i<COLS; ++i)
        {
            var col = moves[i];

            if(!this.map.canPlay(col)) continue;

            var val = this.alpha_beta(this.map.afterMove(this.myID, col), this.depthLimit - 1, alpha, beta, false);

            if(val > alpha)
            {
                alpha = val;
                move = col;
            }
            console.log(col + ' -> ' + val);

            if(alpha >= beta) break; //Beta cut
        }
        console.log('---------------------------');

        if(move < 0)
        {
            console.log("move < 0");
            for(col=0; col<COLS; ++col)
            {
                if(this.map.canPlay(col)) move = col;
            }
        }

        return move;
    };

    this.alpha_beta = function (map, depthLimit, alpha, beta, isMax) {
        if(depthLimit === 0 || map.endOfGame()) return map.evalPosition(this.myID);

        if(isMax)
        {
            for(var col=0; col<COLS; ++col)
            {
                if(!map.canPlay(col)) continue;

                var val = this.alpha_beta(map.afterMove(this.myID, col), depthLimit - 1, alpha, beta, false);

                if(val > alpha) alpha = val;

                if(alpha >= beta) break; //Beta cut
            }

            return alpha;
        }
        else
        {
            for(var col=0; col<COLS; ++col)
            {
                if(!map.canPlay(col)) continue;

                var value = this.alpha_beta(map.afterMove(opponent(this.myID), col), depthLimit - 1, alpha, beta, true);

                if(value < beta) beta = value;

                if(alpha >= beta) break; //Alpha cut
            }

            return beta;
        }
    };

    // this.min = function (map, depthLimit) {
    //     if(depthLimit === 0 || map.endOfGame()) return map.evalPosition(this.myID);
    //
    //     var min_val = 1000000;
    //
    //     for(var col=0; col<COLS; ++col)
    //     {
    //         if(!map.canPlay(col)) continue;
    //
    //         var val = this.max(map.afterMove(opponent(this.myID), col), depthLimit - 1);
    //
    //         if(val < min_val) min_val = val;
    //     }
    //
    //     return min_val;
    // };
    //
    // this.max = function (map, depthLimit) {
    //     if(depthLimit === 0 || map.endOfGame()) return map.evalPosition(this.myID);
    //
    //     var max_val = -1000000;
    //
    //     for(var col=0; col<COLS; ++col)
    //     {
    //         if(!map.canPlay(col)) continue;
    //
    //         var val = this.min(map.afterMove(this.myID, col), depthLimit - 1);
    //
    //         if(val > max_val) max_val = val;
    //     }
    //
    //     return max_val;
    // };

    this.getMovesArray = function () {
        var a = [0, 1, 2, 3, 4, 5, 6];
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
}

