"use strict";

var path = require('path');
var morgan = require('morgan');
var path = require('path');
var express = require('express');
var exphbs  = require('express-handlebars');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('underscore');

app.engine('hbs', exphbs({
  extname: 'hbs',
  defaultLayout: 'main'
}));
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan('tiny'));

app.get('/', function(req, res) {
  res.render('index');
});

// Here is your new Game!
var Card = require('./card');
var Player = require('./player');
var Game = require('./game');
var game = new Game();
var count = 0; // Number of active socket connections
var winner = undefined; // Username of winner

function getGameState() {
  var currentPlayerUsername = game.players[game.playerOrder[0]].username;
  var players = "";
  var numCards = {};

  for (let player in game.players) {
    numCards[player] = game.players[player].pile.length
    players += game.players[player].username + ', '
  }
  players = players.substring(0, players.length-2)

  // return an object with 6 different properties
  return {
    isStarted: game.isStarted,
    numCards: numCards,
    currentPlayerUsername: currentPlayerUsername,
    playersInGame: players,
    cardsInDeck: game.pile.length,
    win: winner
  }
}

io.on('connection', function(socket) {

  if (game.isStarted) {
    // whenever a player joins an already started game, he or she becomes
    // an observer automatically
    socket.emit('observeOnly');
  }
  count++;
  socket.on('disconnect', function () {
    count--;
    if (count === 0) {
      game = new Game();
      winner = null;
    }
  });

  socket.on('username', function(data) {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (typeof data === "string") {
      try {
        var newPlayerId = game.addPlayer(data)
      } catch (err) {
        socket.emit('errorMessage', err);
      }

      socket.playerId = newPlayerId
      socket.emit('username', {id: newPlayerId, username: data})
      io.emit('updateGame', getGameState())
    } else {
      if (!game.players[data.id]) {
        socket.emit('username', false)
      } else {
        socket.playerId = data.id;
        socket.emit('username', {
          id: data.id,
          username: game.players[data.id].username
        });
        io.emit('updateGame', getGameState());
      }
    }
  });

  socket.on('start', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (socket.playerId === undefined) {
      socket.emit('errorMessage', 'You are not a player of the game!')
    }
    try {
      game.startGame()
    } catch(err) {
      socket.emit('errorMessage', (err))
    }
    io.emit('start')
    io.emit('updateGame', getGameState())
    // YOUR CODE HERE
  });

  socket.on('playCard', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    // YOUR CODE HERE
    if (socket.playerId === undefined) {
      socket.emit('errorMessage', 'You are out of the game!')
    }
    try {
      var play = game.playCard(socket.playerId)
    } catch(err) {
      socket.emit('errorMessage', err);
    }
    io.emit('playCard', play)


    // YOUR CODE ENDS HERE
    // broadcast to everyone the game state
    io.emit('updateGame', getGameState());
  });

  socket.on('slap', function() {
    if (winner) {
      socket.emit('errorMessage', `${winner} has won the game. Restart the server to start a new game.`);
      return;
    }
    if (socket.playerId === undefined) {
      socket.emit('errorMessage', 'You are not a player of the game!')
    }
    try {
      var status = game.slap(socket.playerId)
    } catch (err) {
      socket.emit('errorMessage', err)
      return;
    }

    var curr = game.players[socket.playerId];
    if (status.winning) {
      winner = curr.username;
    }
    if (status.message === "got the pile!") {
      io.emit('clearDeck')
    }
    var count = 0;
    var potent;
    if (curr.pile.length === 0) {
      for (let player in game.players) {
        if (game.players[player].pile.length > 0) {
          count++;
          potent = game.players[player]
        }
      }
      if (count === 1) {
        winner = potent.username
        game.isStarted = false;
      } else {
        game.nextPlayer()
      }
    }
    io.emit('updateGame', getGameState())

    socket.emit('message', 'You' + status.message)

    socket.broadcast.emit('message', curr.username + status.message)

    // YOUR CODE HERE
  });

});

var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('Express started. Listening on %s', port);
});
