class Card {
  constructor(suit, value) {
    // YOUR CODE HERE
    this.value = value; // Can Only be 2-10, then A, J, Q, K
    this.suit = suit; // Make Sure to Make It Required That it is H, S, C, or D
  }

  toString() {
    // YOUR CODE HERE
    var str = ''
    if (this.value === 1) {
      str += "Ace of "
    } else if (this.value === 11) {
      str += "Jack of "
    } else if (this.value === 12) {
      str += "Queen of "
    } else if (this.value === 13) {
      str += "King of "
    } else {
      str += this.value + " of "
    }
    var suit = this.suit.charAt(0).toUpperCase() + this.suit.slice(1)
    str += suit
    return str;
  }

  // PERSISTENCE FUNCTIONS
  //
  // Start here after completing Step 2!
  // We have written a persist() function for you to save your game state to
  // a store.json file.
  // =====================
  fromObject(object) {
    this.value = object.value;
    this.suit = object.suit;
  }

  toObject() {
    return {
      value: this.value,
      suit: this.suit
    };
  }
}

module.exports = Card;
