var _ = require('underscore');
var persist = require('./persist');
var Card = require('./card');
var Player = require('./player');
var readGame = false;

class Game {
  constructor() {
    // YOUR CODE HERE
    this.isStarted = readGame;
    this.players = {}
    this.playerOrder = []
    this.pile = []
  }

  addPlayer(username) {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw "Error, Game Is In Session!"
    }
    if (username.trim() === '') {
      throw "Error, No Username"
    }
    for (let property in this.players) {
      if (this.players[property].username === username) {
        throw "Error, Player Already Exists"
      }
    }
    var newPlayer = new Player(username)
    this.playerOrder.push(newPlayer.id)
    this.players[newPlayer.id] = newPlayer
    return newPlayer.id
  }

  startGame() {
    // YOUR CODE HERE
    if (this.isStarted) {
      throw "Error, Game Is In Session!"
    }
    if (Object.keys(this.players).length < 2) {
      throw "Error, Need More Players"
    }
    this.isStarted = true;
    var deck = new Array();
    var suits = ["Spades", "Diamonds", "Clubs", "Hearts"];
    var values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    for (var i = 0; i < suits.length; i++) {
      for (var x = 0; x < values.length; x++) {
        var card = new Card(suits[i], values[x]);
        deck.push(card)
      }
    }
    deck = _.shuffle(deck);
    while (deck.length > 0) {
      for (let property in this.players) {
        this.players[property].pile.push(deck.splice(0, 1))
        if (deck.length === 0) {
          break;
        }
      }
    }
  }

  nextPlayer() {
    if (!this.isStarted) {
      throw "Error, Game Hasn't Started"
    }
    var curr = this.playerOrder.shift()
    if (this.players[curr].pile.length === 0) {
      this.playerOrder.push(curr)
      this.nextPlayer()
    }
    this.playerOrder.push(curr)
  }

  isWinning(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw "Error, Game Hasn't Started"
    }
    if (this.players[playerId].pile.length === 52) {
      this.isStarted = false;
      return true;
    } else {
      return false
    }
  }

  playCard(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw "Error, Game Hasn't Started"
    }
    if (playerId !== this.playerOrder[0]) {
      throw "Not Your Turn"
    }
    if (this.players[playerId].pile.length === 0) {
      throw "Empty Pile"
    }
    var topCard = this.players[playerId].pile.pop();
    this.pile.push(topCard)
    var tie = true;
    for (let property in this.players) {
      this.players[property].pile.length !== 0;
      tie = false;
    }
    if (tie) {
      this.isStarted = false;
      throw "It's a tie!"
    }
    this.nextPlayer()

    return {card: topCard, cardString: topCard.toString()}
  }

  slap(playerId) {
    // YOUR CODE HERE
    if (!this.isStarted) {
      throw "Error, Game Hasn't Started"
    }
    var topCard = this.pile[this.pile.length-1]
    if (topCard.value !== 11) {
      if (this.pile.length > 2) {
        if (topCard.value === this.pile[this.pile.length-2].value || topCard.value === this.pile[this.pile.length-3].value) {
          for (var x = 0; x < this.pile.length; x++) {
            this.players[playerId].pile.unshift(this.pile[x])
          }
          this.pile = []
          return { winning: this.isWinning(playerId) , message: 'got the pile!'}
        }
      }
    }
    if (topCard.value === 11) {
      for (var x = 0; x < this.pile.length; x++) {
        this.players[playerId].pile.unshift(this.pile[x])
      }
      this.pile = []
      return { winning: this.isWinning(playerId) , message: 'got the pile!'}
    }

    var cards = Math.min(3, this.players[playerId].pile.length)
    var cardAmount = this.players[playerId].pile.length-1-cards;
    var player3C = this.players[playerId].pile.splice(cardAmount, cards)
    for (var x = 0; x < player3C.length; x++) {
      this.pile.unshift(player3C[x])
    }
    return { winning: false, message: 'lost 3 cards!'}

  }

  // PERSISTENCE FUNCTIONS
  //
  // Start here after completing Step 2!
  // We have written a persist() function for you to save your game state to
  // a store.json file.
  // =====================
  fromObject(object) {
    this.isStarted = object.isStarted;

    this.players = _.mapObject(object.players, player => {
      var p = new Player();
      p.fromObject(player);
      return p;
    });

    this.playerOrder = object.playerOrder;

    this.pile = object.pile.map(card => {
      var c = new Card();
      c.fromObject(card);
      return c;
    });
  }

  toObject() {
    return {
      isStarted: this.isStarted,
      players: _.mapObject(this.players, val => val.toObject()),
      playerOrder: this.playerOrder,
      pile: this.pile.map(card => card.toObject())
    };
  }

  fromJSON(jsonString) {
    this.fromObject(JSON.parse(jsonString));
  }

  toJSON() {
    return JSON.stringify(this.toObject());
  }

  persist() {
    if (readGame && persist.hasExisting()) {
      this.fromJSON(persist.read());
      readGame = true;
    } else {
      persist.write(this.toJSON());
    }
  }
}

module.exports = Game;
