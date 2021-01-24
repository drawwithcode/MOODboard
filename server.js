// load express library
const express = require('express');
const {v4: uuid} = require('uuid');

// create the app
const app = express();

// define the port where client files will be provided
const port = process.env.PORT || 3000;
// start to listen to that port
const server = app.listen(port);

// provide static access to the files
// in the "public" folder
app.use(express.static('public'));
app.use('/face-api', express.static(__dirname + '/node_modules/face-api.js/dist/'));

// load socket library
const socket = require('socket.io');

// create a socket connection
const io = socket(server);

// define which function should be called
// when a new connection is opened from client
io.on('connection', onConnection);

// callback function: the paramenter (in this case socket)
// will contain all the information on the new connection
function onConnection(socket) {
  const room = getRoom(socket);

  // when a new connection is created, print its id
  console.log('New socket. Id: ' + socket.id + ' connected to room ' + room.id);

  socket.on('player.updated', function(...args) {
    socket.to(room.id).broadcast.emit('player.updated', socket.id, ...args);
  });

  socket.on('disconnect', function() {
    room.removePlayer(socket);
  });
}

console.log('Server is running.\n' +
  'Check out at http://localhost:' +
  port +
  '/ ');

/**
 * Limit of players per room.
 *
 * @type {number}
 */
const playersPerRoom = 2;

const rooms = [];

/**
 * Retrieves a room for the player which automatically joins the room.
 *
 * @param {Socket} player
 * @return {Room}
 */
function getRoom(player) {
  const room = rooms.find((room) => !room.isRoomFull());

  if (typeof room === 'undefined') {
    // Array.push returns the new length of the array,
    // so the index will be new length minus one.
    rooms.push(new Room(player));
    return getRoom(player);
  }

  room.addPlayer(player);

  return room;
}

/**
 *
 * @property {string} id
 * @property {int} playing - The index of the current player
 * @property {int} playing - The index of the current player
 * @property {Socket[]} players - Array of the players in the room.
 */
class Room {
  constructor(player) {
    this.players = [];
    this.id = uuid();

    if (player) {
      this.addPlayer(player);
    }
  }

  /**
   *
   * @return {Socket[]} - The list of connected players
   */
  get connectedPlayers() {
    return this.players.filter((p) => p.connected);
  }

  /**
   * Checks if the rooms is full.
   * @return {boolean}
   */
  isRoomFull() {
    return this.players.length >= playersPerRoom;
  }

  /**
   * Checks if the player is already in the room.
   *
   * @param player
   * @return {boolean}
   */
  isPlayerIn(player) {
    return this.players.findIndex((p) => p.id === player.id) !== -1;
  }

  /**
   *
   * @param {string|int|Socket} player
   * @return {number}
   */
  getPlayerIndex(player) {
    // Checks if it's already the index and returns it.
    if (typeof player === 'number') {
      return player < this.players.length ? player : -1;
    }

    let id;

    if (typeof player === 'string') {
      id = player;
    } else if (typeof player === 'object' && player.id) {
      id = player.id;
    }

    return this.players.findIndex((p) => p.id === id);
  }

  /**
   * To be triggered when player leaves. Emits player.left event.
   *
   * @param {Socket} player
   */
  removePlayer(player) {
    const index = this.getPlayerIndex(player);

    if (index > -1) {
      this.players = this.players.slice(index, 1);
      console.debug('Player left.', 'Is room full?', this.isRoomFull());
    } else {
      console.debug('Player was not in this room.');
    }

    this.emit('player.left', socket.id);
  }

  /**
   *
   * @param {Socket} player
   */
  addPlayer(player) {
    if (this.isPlayerIn(player)) {
      return;
    }

    player.join(this.id);

    this.players.push(player);

    console.log(
        'Player ' + this.players.length + ' connected. ID: ' + player.id);
  }

  emit(event, ...args) {
    return io.to(this.id).emit(event, ...args);
  }
}
