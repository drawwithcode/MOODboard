// load express library
const express = require('express');
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
app.use('/p5', express.static(__dirname + '/node_modules/p5/lib/'));
// load socket library
const socket = require('socket.io');

// create a socket connection
const io = socket(server);

// define which function should be called
// when a new connection is opened from client
io.on('connection', newConnection);
// callback function: the paramenter (in this case socket)
// will contain all the information on the new connection
function newConnection(socket) {
  // when a new connection is created, print its id
  console.log('socket:', socket.id);

  socket.broadcast.emit('player.joined', socket.id);

  socket.on('player.updated', function(...args) {
    console.log('Player updated');
    socket.broadcast.emit('player.updated', socket.id, ...args);
  });

  socket.on('disconnect', function() {
    socket.broadcast.emit('player.left', socket.id);
  });
}

console.log('Server is running.');
