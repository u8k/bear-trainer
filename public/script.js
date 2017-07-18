"use strict";

var activeIntervals;

var resetActiveIntervals = function () {
  activeIntervals = [];
  for (var i = -12; i < 13; i++) {
    if (i !== 0) {
      activeIntervals.push(i);
    }
  }
}
resetActiveIntervals();

var clearActiveIntervals = function () {
  activeIntervals = [];
}

var answer, firstNote, secondNote;
//variable speed setting(time between notes, milliSeconds)
var delay = 500;
var autoPlay = false;

var checkInput= function(num, elem) {
  if (elem.classList.contains('correct')) {
    //replay the interval
    playSound(firstNote);
    setTimeout(function() {playSound(secondNote);}, delay);
  }
  if ((document.getElementById('go-text').innerHTML !== 'GO') && (!elem.classList.contains('disabled'))) {
    document.getElementById('stats-corner').classList.remove('removed');
    incrDom('sesAttempts'+answer);
    incrDom('sesAttempts');
    //check for win
    if (num === Math.abs(answer)) {
      elem.classList.add('correct');
      incrDom('sesWins'+answer);
      incrDom('sesWins');
      incrDom('streak');
      document.getElementById('go-text').innerHTML = 'GO';
      if (autoPlay === true) {
        setTimeout(function () {
          action();
        }, 900);
      }
    } else {
      document.getElementById('streak').innerHTML = 0;
      elem.classList.add('wrong');
    }
    //check if user is logged in
    if (document.getElementById('userName') !== null) {
      incrDom('allAttempts'+answer);
      incrDom('allTimeAttempts');
      if (num === Math.abs(answer)) {
        incrDom('allWins'+answer);
        incrDom('allTimeWins');
      }
      //update allTime accuracy stat
      document.getElementById('accuracy').innerHTML = Math.round((
        Number(document.getElementById('allTimeWins').innerHTML) /
        Number(document.getElementById('allTimeAttempts').innerHTML))* 100)
      //update server data
      var data = {
        interval: answer,
        attempts: document.getElementById('allAttempts'+answer).innerHTML,
        wins: document.getElementById('allWins'+answer).innerHTML
      }
      ajaxCall('/', 'POST', data, function (json) {
        if (json !== 'success') {
          console.log('ERROR, NO RESPONSE FROM DATA BASE');
        }
      })
    }
  }
}

var action = function() {
  if (activeIntervals.length !== 0) {
    if (document.getElementById('go-text').innerHTML === 'GO') {
      document.getElementById('go-text').innerHTML = 'replay'
      for (var i = 1; i < 13; i++) {
        document.getElementById('b'+i).classList.remove('correct','wrong');
      }
      answer = activeIntervals[Math.floor(Math.random() * (activeIntervals.length))];
      if (answer >= 1) {
        firstNote = Math.floor(Math.random() * (24 - answer));
        secondNote = firstNote + answer;
      } else {
        firstNote = 24 - Math.floor(Math.random() * (24 + answer));
        secondNote = firstNote + answer;
      }
    }
    //play first note
    playSound(firstNote);
    // queue second note
    setTimeout(function() {playSound(secondNote);}, delay);
  }
}

// ^'game logic' stuff
///////////////////////////////
// v "utility" stuff

var toggleAutoPlay = function (btn) {
  if (btn.classList.contains('disabled')) {
    btn.classList.remove('disabled');
    autoPlay = true;
  } else {
    btn.classList.add('disabled');
    autoPlay = false;
  }
}

var positiveFeedback = function () {
  var i = 1;
  (function repeat() {
    var elem = document.getElementById('b'+Math.floor(Math.random()*(12)+1));
    elem.classList.add('flash');
    deFlash(elem);
    i++;
    if (i !== 15) {
      setTimeout(function () {
        repeat();
      }, 17);
    }
  })();
}

var deFlash = function (elem) {
  setTimeout(function () {
    elem.classList.remove('flash');
  }, 65)
}

var enableInterval = function (elem, intvl) {
  elem.classList.remove('disabled');
  activeIntervals.push(intvl);
  document.getElementById('b'+ Math.abs(intvl)).classList.remove('disabled');
  if (activeIntervals.length === 1) {
    document.getElementById('go-button').classList.remove('disabled');
  }
}

var disableInterval = function (elem, intvl) {
  document.getElementById('go-text').innerHTML = 'GO';
  elem.classList.add('disabled');
  var len = activeIntervals.length
  if (len === 1) {
    document.getElementById('go-button').classList.add('disabled');
  }
  for (var i = 0; i < len; i++) {
    if (activeIntervals[i] === intvl) {
      activeIntervals.splice(i,1);
      break;
    }
  }
  var oppoIntIsActive = false;
  for (var i = 0; i < len-1; i++) {
    if (Math.abs(activeIntervals[i]) === Math.abs(intvl)) {
      oppoIntIsActive = true;
      break;
    }
  }
  if (!oppoIntIsActive) {
    document.getElementById('b'+ Math.abs(intvl)).classList.add('disabled');
  }
}

var toggleInterval = function (elem, intvl) {
  if (elem.classList.contains('disabled')) {
    enableInterval(elem, intvl);
  } else {
    disableInterval(elem, intvl)
  }
}

var toggleAll = function (btn) {
  if (btn.innerHTML === "all") {
    btn.innerHTML = "none";
    resetActiveIntervals();
    document.getElementById('go-button').classList.remove('disabled');
    var func = function (elem) {elem.classList.remove('disabled');}
  } else {
    btn.innerHTML = "all";
    clearActiveIntervals();
    document.getElementById('go-text').innerHTML = 'GO';
    document.getElementById('go-button').classList.add('disabled');
    var func = function (elem) {elem.classList.add('disabled');}
  }
  for (var i = -12; i < 13; i++) {
    if (i !== 0) {
      func(document.getElementById("sb"+i));
    }
  }
  for (var i = 1; i < 13; i++) {
    func(document.getElementById("b"+i));
  }
}

var incrDom = function (id) {
  var elem = document.getElementById(id);
  elem.innerHTML = Number(elem.innerHTML) + 1;
  if ((id === 'streak') && (Number(elem.innerHTML) % 10 === 0)) {
    positiveFeedback();
  }
}

var showPanel = function(panelName) {
  closePanel();
  document.getElementById(panelName).classList.remove('removed');
  document.getElementById('panel-backing').classList.remove('removed');
}

var closePanel = function() {
  document.getElementById('panel-backing').classList.add('removed');
  document.getElementById('user-info-panel').classList.add('removed');
  document.getElementById('stats-panel').classList.add('removed');
  document.getElementById('options-panel').classList.add('removed');
  document.getElementById('info-panel').classList.add('removed');
  document.getElementById('title-panel').classList.add('removed');
}

var sign = function(inOrUp) {
  var data = {
    username: document.getElementById('nameInput').value,
    password: document.getElementById('passInput').value
  }
  if (data.username === "") {
    document.getElementById('loginError').innerHTML = 'need a name!';
    return;
  }
  if (data.password === "") {
    document.getElementById('loginError').innerHTML = 'need a pass!';
    return;
  }
  if (inOrUp === 'in') {var url = 'login'}
  else {var url = 'register'}
  ajaxCall(url, 'POST', data, function(json) {
    if (json === 'success') {
      location.reload();
    } else {
      document.getElementById('loginError').innerHTML = json;
    }
  });
}

var signOut = function() {
  var url = 'logout'
  ajaxCall(url, 'GET', '', function(json) {
    if (json === 'success') {
      location.reload();
    } else {
      console.log(json);
    }
  });
}

function ajaxCall(url, method, data, callback) {
  var xhttp = new XMLHttpRequest();
  xhttp.open(method, url, true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var json = (xhttp.responseText);
      callback(json);
    }
  }
  xhttp.send(JSON.stringify(data));
}

window.onkeyup = function(e) {
  var key = e.keyCode;
  //console.log(key);
  switch (key) {
    case 32:
      action();
      break;
  }
}

function speedAdjust(amount) {
  if (amount !== 0) {
    var display = Number(document.getElementById("speedMeter").innerHTML);
    display += amount;
    document.getElementById("speedMeter").innerHTML = display;
    delay = Math.abs(10 - display) * 100;
    if (display == 10) {document.getElementById("speedUpKnob").classList.add('hidden');}
    else if (display == 0) {document.getElementById("speedDownKnob").classList.add('hidden');}
    else if ((display == 1) && (amount == 1)) {document.getElementById("speedDownKnob").classList.remove('hidden');}
    else if ((display == 9) && (amount == -1)) {document.getElementById("speedUpKnob").classList.remove('hidden');}
  }
  playSound(Math.floor(Math.random()*(25)));
  setTimeout(function() {playSound(Math.floor(Math.random()*(25)));}, delay);
}

function volumeAdjust(amount) {
  var current = Number(document.getElementById("volumeMeter").innerHTML);
  current += amount;
  document.getElementById("volumeMeter").innerHTML = current
  var actual = current *.1;
  for (var i = 0; i < channel_max; i++) {
    audiochannels[i]['channel'].volume = actual;
  }
  playSound(Math.floor(Math.random()*(25)));
  if (current == 10) {document.getElementById("volUpKnob").classList.add('hidden');}
  else if (current == 0) {document.getElementById("volDownKnob").classList.add('hidden');}
  else if ((current == 1) && (amount == 1)) {document.getElementById("volDownKnob").classList.remove('hidden');}
  else if ((current == 9) && (amount == -1)) {document.getElementById("volUpKnob").classList.remove('hidden');}
}


////////**************** sound player stuff**********///////////////

//load in audio files, assigning each to it's own Audio object.
var audioStorage = [];
for (var i = 0; i < 25; i++) {
  audioStorage.push(new Audio(["sounds/"+ i +".wav"]))
}

// 's' must be an integer from 0-24 inclusive
var playSound = function (s) {
  audioStorage[s].play();
}
