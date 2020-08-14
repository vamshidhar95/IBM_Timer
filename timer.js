var user = "";
var adminName = "";
var adminPassword = "";

// prevent inspect element via right click
// document.addEventListener('contextmenu', function(e) {
//   e.preventDefault();
// });
// prevent inspect element via keyboard
document.onkeydown = function(e) {
  if(event.keyCode == 123) {
     return false;
  }
  if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) {
     return false;
  }
  if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) {
     return false;
  }
  if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) {
     return false;
  }
  if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) {
     return false;
  }
}

// Audio functions
function timeUpAlert(){
  $("#audio")[0].play();
}

// connection code starts
socket.on("newclientconnection", function(data){
  // // console.log(Number(data.description));
  // console.log(data);
  if(data.admin){
    // showClientPage()
    user = "client";
    // if(!isTimerPaused)
      socket.emit("selectuser", {user: user})
  }else {
    showInitPage()
  }
})

socket.on("adminloginsuccess", function(data){
  console.log(data);
  if(data.proceed){
    showAdminPage()
    if(data.totalTime > 0 && !data.isTimerPaused){
      startTimer(data)
      adjustUIElements("start");
    }
  }else {
    showInitPage()
  }
  $("#admin-name").val("");
  $("#admin-password").val("");
})

socket.on("clientsuccess", function(data){
  showClientPage();
  if(data.timeLeft > 0 && !data.isTimerPaused){
    startTimer(data);
  }
})

function showInitPage(){
  $( "#auth-page" ).removeAttr("hidden");
  $( "#admin-page" ).attr("hidden", true);
  $( "#client-page" ).attr("hidden", true);
  $( "#timer-section" ).attr("hidden", true);
  $( "#timer-controls" ).attr("hidden", true);
  $( "#admin-login-page" ).attr("hidden", true);
}
function showAdminLoginPage(){
  // console.log("show adminlogin");
  $( "#auth-page" ).attr("hidden", true);
  $( "#admin-login-page" ).removeAttr("hidden")
}
function showAdminPage(){
  // alert("admin")
  // console.log("admin success");
  $( "#auth-page" ).attr("hidden", true);
  $( "#admin-login-page" ).attr("hidden", true);
  $( "#admin-page" ).removeAttr("hidden")
  $( "#timer-controls" ).removeAttr("hidden")
}

function showClientPage(){
  // alert("client")
  $( "#auth-page" ).attr("hidden", true);
  $( "#client-page" ).removeAttr("hidden");
  $( "#timer-controls" ).attr("hidden", true);
  $( "#timer-section" ).removeAttr("hidden");
}

$( "#admin" ).click(function(user){
  // socket.emit("selectuser", {user: user})
  // console.log("admin click");
  // // console.log(user);
  showAdminLoginPage()
})
$( "#admin-login" ).click(function(){
  user = "admin"
  adminName = $("#admin-name").val().toLowerCase();
  adminPassword = $("#admin-password").val().toLowerCase();
  // console.log(adminName+ ", " + adminPassword+", "+user);
  socket.emit("selectuser", {user: user, adminName: adminName, adminPassword: adminPassword})
})
$("#client").click(function(user){
  user = "client"
  socket.emit("selectuser", {user: user})
  // showClientPage()
})
// connection code ends



// Admin times setting code starts
var timer;
var countdown = 0;
var totalTime = timeLeft = 0;

$("#start").click(function(){
  var totalTime = ((Number($("#mins").val()) || 0)*60) + (Number($("#secs").val()) || 0);
  var countdownTime = ($("#countdown").val() || 0);
  // console.log("Start timer" + totalTime + ":" + countdownTime);
  socket.emit("settimer", {totalTime: Number(totalTime), countdown: Number(countdownTime)});
  adjustUIElements("start");
})

$("#pause").click(function(){
  adjustUIElements("pause");
  socket.emit("pauseServerTimer", {msg: "pause"})
})
$("#resume").click(function(){
  adjustUIElements("resume");
  socket.emit("resumeServerTimer", {msg: "resume"})
})
$("#stop").click(function(){
  adjustUIElements("stop");
  socket.emit("stopServerTimer", {msg: "stop"})
})

socket.on("starttimer", function(data){
  // console.log("start timer");
  if (user == "") {
    user = "client";
    showClientPage();
    // alert("UNSELECTED")
  }
  startTimer(data);
})

socket.on("pauseClientTimer", function(data){
  clearInterval(timer);
  timer = null;
})

socket.on("stopClientTimer", function(data){
  clearInterval(timer);
  clearWarning();
  time = 0;
  timer = null;
  timeLeft = 0;
  if(user == "admin"){
    showSettings()
  }else if(user == "client"){
    document.getElementById("current-timer").innerHTML = "<span id='min-count'>00</span> : <span id='sec-count'>00 Sec</span>"
  }
})

function adjustUIElements(control){
  switch (control) {
    case "start":
      // console.log("Start Clicked");
      $("#start").attr("hidden", true);
      $("#resume").attr("hidden", true);
      $("#pause").removeAttr("hidden");
      $("#stop").removeAttr("hidden");
      break;
    case "pause":
    // console.log("pause Clicked");
      $("#start").attr("hidden", true);
      $("#resume").removeAttr("hidden");
      $("#pause").attr("hidden", true);
      $("#stop").removeAttr("hidden");
      break;
    case "resume":
    // console.log("resume Clicked");
      $("#start").attr("hidden", true);
      $("#resume").attr("hidden", true);
      $("#pause").removeAttr("hidden");
      $("#stop").removeAttr("hidden");
      break;
    case "stop":
    // console.log("stop Clicked");
      $("#start").removeAttr("hidden");
      $("#resume").attr("hidden", true);
      $("#pause").attr("hidden", true);
      $("#stop").attr("hidden", true);
    break;
    default:

  }
}

function startTimer(data){
  // console.log("startTimer: ");
  // console.log(data);
  totalTime = timeLeft = Number(data.totalTime);
  countdown = Number(data.countdown);

  showTimer();

  timer = setInterval(function(){
    var minutesLeft = Math.floor(timeLeft/60);
    var secondsLeft = (timeLeft) - minutesLeft*60;

    updateTime(minutesLeft, secondsLeft)
    // console.log(minutesLeft + " : " + secondsLeft);

    // update countdown color
    if(timeLeft <= countdown){
      // console.log(countdown);
      warningColor();
    }

    if(timeLeft <= 0){
      clearInterval(timer);
      timeUpAlert();
      clearWarning();
      timer = null;
      if(user == "admin")
        showSettings();
      adjustUIElements("stop");
    }

    timeLeft = timeLeft - 1;
  }, 1000)
}

function warningColor(){
    $("#warning-div").css('backgroundColor', '#f31c45');
}
function clearWarning(){
  $("#warning-div").css('backgroundColor', 'transparent');
  $("#current-timer").html("<span id='min-count'>00</span> : <span id='sec-count'>00 Sec</span>");
}

function updateTime(minutes, seconds){
  document.getElementById("current-timer").innerHTML = "<span id='min-count'>"+minutes+"</span> : <span id='sec-count'>"+seconds+" Sec</span>"
}

function showTimer(){
  $("#time-settings").attr("hidden", true);
  $("#timer-section").removeAttr("hidden");
  $("#current-timer").html("<span id='min-count'>00</span> : <span id='sec-count'>00</span>");
}
function showSettings(){
  $("#time-settings").removeAttr("hidden");
  $("#timer-section").attr("hidden", true);
  $("#current-timer").html("<span id='min-count'>00</span> : <span id='sec-count'>00</span>");
}
// Admin times setting code ends
