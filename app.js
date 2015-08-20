var express = require('express'), 
    http = require('http'), 
    path = require('path'),
    _ = require('underscore');

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
    app.use(express.errorHandler());
});

var postHistory = [{userName: 'Tejal', timeStamp: new Date().getTime(), message: 'hey There'},
                    {userName: 'Swami', timeStamp: new Date().getTime(), message: 'I love you'} ];

// Set up express
var server = http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

app.get('/', function (request, response){
    response.redirect('login.html');
});

app.post('/login', function (request, response){
    //auth
    response.redirect('/chatRoom');
});

app.post('/createUser', function (request, response){
    //auth
    response.redirect('/chatRoom');
});

app.get('/chatRoom', function (request, response){
    //auth
    console.log(postHistory);
    response.render('chatroom', {oldposts: postHistory});
});



// Set up socket.io
var io = require('socket.io').listen(server);

// Handle socket traffic
io.sockets.on('connection', function (socket) {
    // Relay chat data to all clients
    socket.on('chat', function(data) {
        
        var oldpost = _.extend({userName: 'Keshav', timeStamp: new Date().getTime()}, data);
        postHistory.push(oldpost); // store in DB
        io.sockets.emit('chat', oldpost);
        //socket.emit('chat',data);
        //socket.broadcast.emit('chat', data);
    });

    socket.on('enterRoom', function(name){
        socket.set('userName', name);
    });

    socket.on('disconnect', function(){
       console.log('disconnected');
    });
});