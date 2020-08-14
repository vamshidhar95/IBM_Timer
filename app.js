var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// set port
var port = process.env.PORT || 8080

app.use(express.static(__dirname));

app.get('/', function(req, res) {
   res.sendFile('index.html', { root: '.' });
});

var isAdminLoggedIn = false;
var adminSocket = null;
var allClients = [];
var clients = 0;
var adminCrad = {name: "hackathon2019", password: "dshphack"}
var timeLeft = 0;
var totalTime = 0;
var countdown = 0;
var timer = null;
var isTimerPaused = false;
//Whenever someone connects this gets executed
io.on('connection', function(socket) {
   clients++;
   allClients.push(socket);
   console.log("# of clients connected: "+clients);

   socket.on('selectuser', function(data){
     console.log("selectuser: "+ data.user);
     if(data.user == "admin" && data.adminName == adminCrad.name && data.adminPassword == adminCrad.password){
       isAdminLoggedIn = true;
       adminSocket = socket;
       socket.emit("adminloginsuccess", {proceed: isAdminLoggedIn, totalTime: timeLeft, countdown: countdown, isTimerPaused: isTimerPaused})
     }else if(data.user == "client") {
       socket.emit("clientsuccess", {timeLeft: timeLeft, totalTime: timeLeft, countdown: countdown, isTimerPaused: isTimerPaused})
       // isAdminLoggedIn = false; // change this to false
     }else{
       socket.emit("adminloginsuccess", {proceed: isAdminLoggedIn, totalTime: timeLeft, countdown: countdown, isTimerPaused: isTimerPaused})
     }
   })

   if(isAdminLoggedIn){
     socket.emit('newclientconnection', {description: "admin", admin: isAdminLoggedIn, timeLeft: timeLeft, isTimerPaused: isTimerPaused});
   }else {
     socket.emit('newclientconnection', {description: "noadmin", admin: isAdminLoggedIn, timeLeft: timeLeft, isTimerPaused: isTimerPaused});
   }

   //Whenever someone disconnects this piece of code executed
   socket.on('disconnect', function () {
      clients--;
      var i = allClients.indexOf(socket);
      allClients.splice(i, 1);
      if(adminSocket == socket){
        adminSocket = null;
        isAdminLoggedIn = false;
      }
      console.log("# of client connection reduced to: "+clients);
   });

   // Set timers
   socket.on("settimer", function(data){

     if(timer != null){
       socket.emit("starttimer", {totalTime: timeLeft, countdown: countdown});
     }

     totalTime = Number(data.totalTime);
     countdown = Number(data.countdown);
     timeLeft = totalTime;

     console.log(timeLeft, countdown);
     io.sockets.emit("starttimer", {totalTime: timeLeft, countdown: countdown});

     timer = setInterval(function(){
       timeLeft = timeLeft - 1;
       console.log(timeLeft);
       if(timeLeft <= 0){
         clearInterval(timer)
         isTimerPaused = false;
         timer = null;
       }
     }, 1000)
   })

   // pause the timer
   socket.on("pauseServerTimer", function(data){
     console.log(data.msg);
     clearInterval(timer)
     timer = null;
     isTimerPaused = true;
     io.sockets.emit("pauseClientTimer", {msg: "pause client timers"});
   })

   // resume the timer
   socket.on("resumeServerTimer", function(data){
     isTimerPaused = false;
     console.log(data.msg);
     io.sockets.emit("starttimer", {totalTime: timeLeft, countdown: countdown});
     timer = setInterval(function(){
       timeLeft = timeLeft - 1;
       console.log(timeLeft);
       if(timeLeft <= 0){
         clearInterval(timer)
         timer = null;
       }
     }, 1000)

     // io.sockets.emit("pauseClientTimer", {msg: "resume client timers"});
   })

   // stop and reset timer
   socket.on("stopServerTimer", function(data){
     isTimerPaused = false;
     console.log(data.msg);
     clearInterval(timer)
     timer = null;
     timeLeft = 0;
     countdown = 0;
     totalTime = 0;
     io.sockets.emit("stopClientTimer", {totalTime: timeLeft, countdown: countdown});
   })

});

http.listen(port, function() {
   console.log('listening on *:'+port);
});

// heroku password: DFDF%#$%fbdfh133
// git add .
// git commit -m "commit msg"
// git push https://git.heroku.com/vast-savannah-84144.git master
// global link to access the app online: https://vast-savannah-84144.herokuapp.com/
