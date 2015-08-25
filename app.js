// Import modules
var express = require('express'), 
    http = require('http'), 
    path = require('path'),
    _ = require('underscore'),
    moment = require('moment'),
    sqlite3 = require('sqlite3').verbose();

//Create express instance
var app = express();

//Configure middleware stack and define paths
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

//Database initializiation
var db = new sqlite3.Database('fsechat.db');

db.serialize(function (){

    //db.run("DROP Table if EXISTS user_profile", function(err){});
    db.run("DROP Table if EXISTS chat_history", function(err){});

    // Create Tables if they don't exist
    db.run("CREATE Table if NOT EXISTS user_profile (userid INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(25) UNIQUE NOT NULL, password VARCHAR(25) NOT NULL, firstname VARCHAR(25), lastname VARCHAR(25))", function (err){

        if(err!==null){
            console.log("Error occured while creating user_profile table");
        }
        else{
            console.log("user_profile table initialized");
        }
    });

    db.run("CREATE Table if NOT EXISTS chat_history (chatid INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(25), timestamp DATETIME, chatmessage BLOB)", function (err){

        if(err!==null){
            console.log("Error occured while creating chat_history table");
        }
        else{
            console.log("chat_history table initialized");
        }
    });


    db.each("SELECT * from user_profile", function (err, row){
        if (err){
            console.log('not retrieving data');
        }
        else{
            console.log(row);
        }
    });

    db.each("SELECT * from chat_history", function (err, row){
        if (err){
            console.log('not retrieving data');
        }
        else{
            console.log(row);
        }
    });

});



// Setup http server
var server = http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

//Handle webpage routing
app.get('/', function (request, response){
    response.redirect('login.html');
});

app.post('/login', function (request, response){
    
    //Retrieve matching login credentials from DB
    db.get("SELECT username, password from user_profile where username=$username", 
        {$username: request.body.userName}, function (err, row){
       
        if (err){ 
            response.render('login', {pageMessage: "Unable to login, please try again"});
            console.log("Unable to login, please try again");
        }
        else if (row===undefined){
            response.render('login', {pageMessage: "This Username does not exist, please use new user flow to create ID"});
            console.log("User does not exist");
        }
        else {

            if (row.password===request.body.password){
                console.log(row);  
                response.redirect('/chatRoom');
            }
            else {
             response.render('login', {pageMessage: "Incorrect Username or Password, please try again"});
             console.log("Incorrect credentials");
            }  
        }   
        
    });
});

app.post('/createUser', function (request, response){
    
    db.serialize( function(){

        //Check if username already exists
        db.get("SELECT username from user_profile where username=$username", 
        {$username: request.body.userName}, function (err, row){

            if (err){
                response.render('createUser', {pageMessage: "Unable to create ID, please try again"});
                console.log("Unable to create ID, please try again");
            }
            else if (row===undefined){

                db.serialize( function(){

                    //Create New User record in DB
                    db.run("INSERT INTO user_profile VALUES($next_id, $username, $password, $firstname, $lastname)", {
                        $username: request.body.userName,
                        $password: request.body.password,
                        $firstname: request.body.firstName,
                        $lastname: request.body.lastName
                    }, function (err){

                        if (err){
                          response.render('createUser', {pageMessage: "Error while creating user, try again"});
                            
                        }
                        else {
                          console.log('User created')
                          response.redirect('/chatRoom');  
                        }
                    });
    
                });

            }
            else {
                response.render('createUser', {pageMessage: "User ID already exists, use alternate username or proceed to login page."});
                console.log("Login ID already exists");
            }

        });
    }); 
});

app.get('/chatRoom', function (request, response){

    var postHistory = [];
    var postHist = {};

    db.serialize( function(){

        db.all("SELECT * from chat_history", function (err, rows){
            if (err){
                console.log('not retrieving data');
            }
            else{
                console.log('loading chat_history');
                rows.forEach(function(row){
                    postHist = {};
                    postHist.userName= row.username;
                    postHist.timeStamp= moment(row.timestamp).format("MM/DD/YYYY h:mm A");
                    postHist.message= row.chatmessage;

                
                    console.log(postHist);
                    postHistory.push(postHist);
                });
                
                console.log(postHistory);
                response.render('chatroom', {oldposts: postHistory});
            }

        });

    });
    
});



// Set up socket.io listener
var io = require('socket.io').listen(server);

// Handle socket traffic
io.sockets.on('connection', function (socket) {
    
    // Relay chat data to all clients
    socket.on('chat', function(data) {
        
        var oldpost = _.extend({userName: 'Tejal', timeStamp: new Date().getTime()}, data);
        
        db.serialize( function(){

            db.run("INSERT INTO chat_history VALUES($next_id, $username, $timestamp, $chatmessage)", {
                        $username: oldpost.userName,
                        $timestamp: oldpost.timeStamp,
                        $chatmessage: oldpost.message
                    }, function (err){

                        if(err){
                            console.log('Error occured while storing in chat history');
                        }
                        else{
                          io.sockets.emit('chat', oldpost);  
                        }
                    }
            );

        });
        
    });

    socket.on('enterRoom', function(name){
        socket.set('userName', name);
    });

    socket.on('disconnect', function(){
       console.log('User disconnected');
    });
});