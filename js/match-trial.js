let board = {
  rows: 4,
  columns: 4,
  tileWidth: 50,
  tileHeight: 50,
  tiles: [],
  selectedTile: {
    selected: false,
    column: 0,
    row: 0
  }
}

const colors = [{
    color: 'green'
  },
  {
    color: 'red'
  },
  {
    color: 'yellow'
  },
  {
    color: 'grey'
  },
  {
    color: 'orange'
  }
];

const deletedTile = {
  color: 'black'
}

const blankTile = {
  color: 'white'
}

let clusters = [];
let moves = [];
let selectedTile = null;

class Game {
  constructor() {
    this.init();
    this.createLevel();
  }

  createLevel() {
    let done = false;
    while (!done) {
      for (var i = 0; i < board.rows; i++) {
        for (var j = 0; j < board.columns; j++) {
          board.tiles[i][j].type = this.getRandomTile();
        }
      }

      this.resolveClusters();
      this.findMoves();
      if (moves.length > 0) {
        done = true;
      }
      this.drawBoard();
    }
  }

  drawBoard() {
    let container = document.getElementById('board-container');
    $(container).empty();
    let rows = [];
    for (var i = 0; i < board.rows; i++) {
      let tiles = [];
      let row = $('<div>');
      $(row).addClass('row');
      for (var j = 0; j < board.columns; j++) {
        let node = $('<div>');
        node.addClass('tile');
        node.addClass('tile-color-' + board.tiles[i][j].type.color);
        node.attr('data-x', i);
        node.attr('data-y', j);
        tiles.push(node);
      }
      $(row).append(tiles);
      rows.push(row);
    }
    $(container).append(rows);
  }

  updateBoard() {
    for (var i = 0; i < board.rows; i++) {
      for (var j = 0; j < board.columns; j++) {
        let tile = $('.tile[data-x="' + i + '"][data-y="' + j + '"]');
        let classes = $(tile).attr('class').split(' ');
        classes.forEach(function(className) {
          if (/tile-color-/.test(className)) {
            $(tile).removeClass(className);
          }
        });
        $(tile).addClass('tile-color-' + board.tiles[i][j].type.color);
      }
    }
  }

  resolveClusters(delayTime) {
    return new Promise((resolve, reject) => {
      this.findClusters();
      // delayTime: int, ms for timeouts for 'animations'
      this.removeClusters(delayTime)
        .then(() => this.shiftTiles(delayTime))
        .then(() => this.findClusters())
        .then(() => {
          if (clusters.length > 0) {
            this.resolveClusters(delayTime);
          } else {
            resolve();
          }
        });
    });
  }

  findClusters(animate) {
    return new Promise((resolve, reject) => {
      clusters = [];

      //find horizontal clusters
      for (var i = 0; i < board.rows; i++) {
        let rowNum = i;
        var matchLength = 1;
        for (var j = 0; j < board.columns; j++) {
          let columnNum = j;
          var checkCluster = false;

          if (columnNum == board.columns - 1) {
            checkCluster = true;
          } else {
            if (board.tiles[rowNum][columnNum].type === board.tiles[rowNum][columnNum + 1].type &&
              board.tiles[rowNum][columnNum].type !== -1) {
              matchLength++;
            } else {
              checkCluster = true;
            }
          }

          if (checkCluster) {
            if (matchLength >= 3) {
              clusters.push({
                column: columnNum + 1 - matchLength,
                row: rowNum,
                length: matchLength,
                horizontal: true
              })
            }
            matchLength = 1;
          }
        }
      }

      for (var j = 0; j < board.columns; j++) {
        let columnNum = j;
        var matchLength = 1;

        for (var i = 0; i < board.rows; i++) {
          let rowNum = i;
          var checkCluster = false;

          if (rowNum == board.rows - 1) {
            checkCluster = true;
          } else {
            if (board.tiles[rowNum][columnNum].type === board.tiles[rowNum + 1][columnNum].type &&
              board.tiles[rowNum][columnNum].type !== -1) {
              matchLength++;
            } else {
              checkCluster = true;
            }
          }

          if (checkCluster) {
            if (matchLength >= 3) {
              clusters.push({
                column: columnNum,
                row: rowNum + 1 - matchLength,
                length: matchLength,
                horizontal: false
              })
            }
            matchLength = 1;
          }
        }
      }

      resolve();
    });
  }

  showClusters(delayTime) {
    return new Promise((resolve, reject) => {
      for (var i = 0; i < clusters.length; i++) {
        let cluster = clusters[i];
        let horizontalOffset = 0;
        let verticalOffset = 0;
        if (cluster.horizontal == true) {
          verticalOffset = 1;
        } else {
          horizontalOffset = 1;
        }
        for (var j = 0; j < cluster.length; j++) {
          let xval = cluster.row + horizontalOffset * j;
          let yval = cluster.column + verticalOffset * j;
          board.tiles[xval][yval].type = deletedTile;
          this.addTileClass(xval, yval, 'removing');
        }
        setTimeout(function() {
          resolve();
        }, delayTime)
      }
    })
  }

  addTileClass(x, y, className) {
    $('.tile[data-x="' + x + '"][data-y="' + y + '"]').addClass(className);
  }

  removeTileClass(x, y, className) {
    $('.tile[data-x="' + x + '"][data-y="' + y + '"]').removeClass(className);
  }

  drawTile(x, y) {
    let tile = $('.tile[data-x="' + x + '"][data-y="' + y + '"]');
    if ($(tile).attr('class')) {
      let tileInfo = board.tiles[x][y];
      let classes = $(tile).attr('class').split(' ');
      $(tile).removeClass('blank');
      $(tile).removeClass('removing');
      classes.forEach(function(className) {
        if (/tile-color-/.test(className)) {
          $(tile).removeClass(className);
        }
      });

      if (tileInfo.type === deletedTile) {
        $(tile).addClass('removing');
      } else if (tileInfo.type === blankTile) {
        $(tile).addClass('blank');
      } else {
        $(tile).addClass('tile-color-' + tileInfo.type.color);
      }
    }
  }

  // delayTime: int, ms for timeouts for 'animations'
  removeClusters(delayTime) {
    return new Promise((resolve, reject) => {
      this.showClusters(delayTime)
        .then(() => {
          //Calculate amount to shift by
          for (var i = 0; i < board.columns; i++) {
            var shift = 0;
            for (var j = board.rows - 1; j >= 0; j--) {
              let tile = board.tiles[i][j];
              // Loop from bottom to top
              if (tile.type === deletedTile) {
                tile.type = blankTile;
                this.drawTile(i, j);
              }
            }
          }
          setTimeout(function() {
            resolve();
          }, delayTime)
        });
    });
  }

  // Shift tiles and insert new tiles
  shiftTiles() {
    return new Promise((resolve, reject) => {
      // Shift tiles
      for (var i = 0; i < board.columns; i++) {
        let colNum = i;
        for (var j = board.rows - 1; j >= 0; j--) {
          let rowNum = j;
          // Loop from bottom to top
          if (board.tiles[rowNum][colNum].type === blankTile) {
            // Insert new random tile
            board.tiles[rowNum][colNum].type = this.getRandomTile();
            this.drawTile(rowNum, colNum);
          } else {
            // Swap tile to shift it
            var shift = board.tiles[rowNum][colNum].shift;
            if (shift > 0) {
              this.swapTiles(rowNum, colNum, rowNum - shift, colNum)
            }
          }

          // Reset shift
          board.tiles[rowNum][colNum].shift = 0;
          resolve();
        }
      }
    });
  }

  swapTiles(x1, y1, x2, y2) {
    return new Promise((resolve, reject) => {
      let typeSwap = board.tiles[x1][y1].type;
      board.tiles[x1][y1].type = board.tiles[x2][y2].type;
      board.tiles[x2][y2].type = typeSwap;
      this.drawTile(x1, y1);
      this.drawTile(x2, y2);
      setTimeout(function() {
        resolve();
      }, 500)
    });
  }

  findMoves() {
    return new Promise((resolve, reject) => {
      moves = [];

      for (var i = 0; i < board.rows - 1; i++) {
        let rowNum = i;
        for (var j = 0; j < board.columns - 1; j++) {
          let columnNum = j;
          this.swapTiles(rowNum, columnNum, rowNum + 1, columnNum);
          this.findClusters();
          this.swapTiles(rowNum + 1, columnNum, rowNum, columnNum);
          if (clusters.length > 0) {
            moves.push({
              x1: rowNum,
              y1: columnNum,
              x2: rowNum + 1,
              y2: columnNum
            });
          }

        }
      }

      for (var j = 0; j < board.columns - 1; j++) {
        let columnNum = j;
        for (var i = 0; i < board.rows - 1; i++) {
          let rowNum = i;
          this.swapTiles(rowNum, columnNum, rowNum, columnNum + 1);
          this.findClusters();
          this.swapTiles(rowNum, columnNum + 1, rowNum, columnNum);
          if (clusters.length > 0) {
            moves.push({
              x1: rowNum,
              y1: columnNum,
              x2: rowNum,
              y2: columnNum + 1
            });
          }
        }
      }

      clusters = [];
      resolve();
    });
  }

  getRandomTile() {
    return colors[Math.floor(Math.random() * 5)];
  }

  init() {
    for (var i = 0; i < board.rows; i++) {
      board.tiles[i] = [];
      for (var j = 0; j < board.columns; j++) {
        board.tiles[i][j] = {
          type: 0,
          shift: 0
        };
      }
    }
  }
}

let game = new Game();


const selectTile = function(tile) {
  if (!selectedTile) {
    $(tile).addClass('selected');
    selectedTile = tile;
  } else if (selectedTile === tile) {
    $(tile).removeClass('selected');
    selectedTile = null;
  } else {
    let selectedX = parseInt($(selectedTile).attr('data-x'));
    let selectedY = parseInt($(selectedTile).attr('data-y'));

    let swapX = parseInt($(tile).attr('data-x'));
    let swapY = parseInt($(tile).attr('data-y'));
    $(selectedTile).removeClass('selected');
    selectedTile = null;

    if (canSwap(selectedX, swapX, selectedY, swapY)) {
      let done = false;
      game.swapTiles(selectedX, selectedY, swapX, swapY)
        .then(() => postSwap());
    }
  }
}

const postSwap = function() {
  game.findClusters()
    .then(() => game.resolveClusters(500))
    .then(() => game.findMoves())
    .then(() => {
      if (moves.length === 0) {
        console.log('no more moves')
      }
    });
}

const bindHandlers = function() {
  $('.tile').click(function(event) {
    selectTile(event.target);
  });
}

bindHandlers();

const canSwap = function(x1, x2, y1, y2) {
  retVal = false;

  if ((x1 === x2) && (y1 + 1 === y2 || y1 - 1 === y2)) {
    retVal = true;
  } else if ((y1 === y2) && (x1 + 1 === x2 || x1 - 1 === x2)) {
    retVal = true;
  }

  return retVal;
}