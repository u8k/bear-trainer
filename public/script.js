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

var answerList, anchorNote, pos;
var intervalsPerPrompt = 2;
var delay = 600;//variable speed setting(milliSeconds between notes)
var autoPlay = false;

var checkInput= function(num, elem) {
  if ((document.getElementById('go-text').innerHTML !== 'GO') && (!elem.classList.contains('disabled'))) {
    document.getElementById('stats-corner').classList.remove('removed');
    incrDom('sesAttempts'+answerList[pos]);
    incrDom('sesAttempts');
    //check for win
    if (num === Math.abs(answerList[pos])) {
      elem.classList.add('correct');
      incrDom('sesWins'+answerList[pos]);
      incrDom('sesWins');
      incrDom('streak');
      //is interval last in prompt?
      if (pos === answerList.length-1) {
        document.getElementById('go-text').innerHTML = 'GO';
        document.getElementById("int-ind").innerHTML = ".";
        if (autoPlay === true) {
          setTimeout(function () {
            action();
          }, 900);
        }
      } else { //move to next pos in prompt
        var str = document.getElementById("int-ind").innerHTML;
        str = str.slice(0, pos*2) + ". ! " + str.slice((pos+2)*2)
        document.getElementById("int-ind").innerHTML = str;
        pos++;
        setTimeout(function () {
          for (var i = 1; i < 13; i++) {
            document.getElementById('b'+i).classList.remove('correct','wrong');
          }
        }, 400);
      }
    } else {
      document.getElementById('streak').innerHTML = 0;
      elem.classList.add('wrong');
    }
    //check if user is logged in
    if (document.getElementById('userName') !== null) {
      incrDom('allAttempts'+answerList[pos]);
      incrDom('allTimeAttempts');
      if (num === Math.abs(answerList[pos])) {
        incrDom('allWins'+answerList[pos]);
        incrDom('allTimeWins');
      }
      //update allTime accuracy stat
      document.getElementById('accuracy').innerHTML = Math.round((
        Number(document.getElementById('allTimeWins').innerHTML) /
        Number(document.getElementById('allTimeAttempts').innerHTML))* 100)
      //update server data
      var data = {
        interval: answerList[pos],
        attempts: document.getElementById('allAttempts'+answerList[pos]).innerHTML,
        wins: document.getElementById('allWins'+answerList[pos]).innerHTML
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
      pos = 0;
      document.getElementById('go-text').innerHTML = 'replay'
      for (var i = 1; i < 13; i++) {
        document.getElementById('b'+i).classList.remove('correct','wrong');
      }
      answerList =[];
      var min = 0;
      var max = 0;
      var cur = 0;
      for (var i = 0; i < intervalsPerPrompt; i++) {
        var answer = activeIntervals[Math.floor(Math.random() * (activeIntervals.length))];
        cur += answer;
        if (cur > max) {
          if (cur - min > 24) {
            answer = -answer;
            cur += answer*2;
          } else {max = cur;}
        } else if (cur < min) {
          if (max - cur > 24) {
            answer = -answer;
            cur += answer*2;
          } else {min = cur;}
        }
        answerList.push(answer);
      }
      var indStr = "!";
      for (var i = 1; i < intervalsPerPrompt; i++) {
        indStr += " .";
      }
      document.getElementById("int-ind").innerHTML = indStr;
      anchorNote = Math.floor(Math.random() * (25-(max-min))) - min;
    }
    playPrompt(anchorNote, 0)
  }
}

var playPrompt = function (note, next) {
  audio.play(String(note));
  if (answerList[next] !== undefined) {
    setTimeout(function() {
      playPrompt(note + answerList[next], next+1);
    }, delay);
  }
}

var toggleAutoPlay = function (btn) {
  if (btn.classList.contains('disabled')) {
    btn.classList.remove('disabled');
    var boo = true;
  } else {
    btn.classList.add('disabled');
    var boo = false;
  }
  cookie.update('autoPlay', boo);
  autoPlay = boo;
}

var positiveFeedback = function () {
  var i = 1;
  (function repeat() {
    var elem = document.getElementById('b'+ Math.abs(activeIntervals[Math.floor(Math.random()*(activeIntervals.length))]));
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
    cookie.update(intvl, true);
  } else {
    disableInterval(elem, intvl)
    cookie.update(intvl, false);
  }
}

var toggleAll = function (btn) {
  if (btn.innerHTML === "all") {
    btn.innerHTML = "none";
    resetActiveIntervals();
    document.getElementById('go-button').classList.remove('disabled');
    var func = function (elem) {elem.classList.remove('disabled');}
    var boo = true
  } else {
    btn.innerHTML = "all";
    clearActiveIntervals();
    document.getElementById('go-text').innerHTML = 'GO';
    document.getElementById('go-button').classList.add('disabled');
    var func = function (elem) {elem.classList.add('disabled');}
    var boo = false
  }
  for (var i = -12; i < 13; i++) {
    if (i !== 0) {
      func(document.getElementById("sb"+i));
      cookie.update(i, boo);
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

var closePanel = function(currentPanel) {
  document.getElementById('panel-backing').classList.add('removed');
  document.getElementById('user-info-panel').classList.add('removed');
  document.getElementById('stats-panel').classList.add('removed');
  document.getElementById('options-panel').classList.add('removed');
  document.getElementById('info-panel').classList.add('removed');
  document.getElementById('title-panel').classList.add('removed');
  if (currentPanel) {
    document.getElementById('options-button').onclick = function(){showPanel(currentPanel);};
  }
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
    case 32:  // space
      action();
      break;
    case 65:  // A

      break;
    case 83:  // S

      break;
  }
}

function speedAdjust(amount) {
  if (amount !== 0) {
    var display = Number(document.getElementById("speedMeter").innerHTML);
    display += amount;
    document.getElementById("speedMeter").innerHTML = display;
    cookie.update('speed', display);
    delay = (11 - display) * 100;
    checkKnobs('speed', amount);
  }
  audio.play(String(Math.floor(Math.random()*(25))));
  setTimeout(function() {audio.play(String(Math.floor(Math.random()*(25))));}, delay);
}

function volumeAdjust(amount) {
  if (amount === 0) {audio.play(String(Math.floor(Math.random()*(25)))); return}
  var current = Number(document.getElementById("volumeMeter").innerHTML);
  current += amount;
  document.getElementById("volumeMeter").innerHTML = current
  cookie.update('volume', current);
  var actual = current *.1;
  audio['_volume'] = actual
  audio.play(String(Math.floor(Math.random()*(25))));
  checkKnobs('volume', amount);
}

function perPromptAdjust(amount) {
  var current = Number(document.getElementById("perPromptMeter").innerHTML);
  current += amount;
  document.getElementById("perPromptMeter").innerHTML = current
  cookie.update('perPrompt', current);
  intervalsPerPrompt = current;
  checkKnobs('perPrompt', amount);
  document.getElementById('go-text').innerHTML = 'GO';
}

//function to check if meter is at either end of it's range and if knobs need adding/removing
var checkKnobs = function (type, amount) { //type must be "volume", "speed", or "perPrompt"
  var upKnob = document.getElementById(type + "UpKnob");
  var downKnob = document.getElementById(type + "DownKnob");
  var current = document.getElementById(type + "Meter").innerHTML;
  if (type === "perPrompt" && current === '5') {upKnob.classList.add('hidden');}
  else if (type === "perPrompt" && current === '4' && amount === -1) {upKnob.classList.remove('hidden');}
  else if (current === '10') {upKnob.classList.add('hidden');}
  else if (current === '1') {downKnob.classList.add('hidden');}
  else if ((current === '2') && (amount === 1)) {downKnob.classList.remove('hidden');}
  else if ((current === '9') && (amount === -1)) {upKnob.classList.remove('hidden');}
}

//////******* sound player setup******///////
var audio = new Howl({
  src: ['audio.mp3'],
  volume: .5,
  sprite: []
});
for (var i = 0; i < 25; i++) {
  audio['_sprite'].push([i*500, 400]);
}

////// cookie handler ///////
var cookie = {
  startup: function () {
    if (document.cookie) {cookie.load();}
    else {
      cookie.dataString = cookie.default;
      cookie.load(true);
    }
  },
  default: "0001001000000000000000004401",
  onLoad:  "1111111111111111111111114402",
  load: function (data) { //takes in pre-existing cookie and updates View accordlingly
    if (!data) {
      cookie.dataString = document.cookie.slice(8);
    }
    //compare current cookie to the onLoad state to find needed changes
    for (var i = 0; i < cookie.dataString.length; i++) {
      if (cookie.dataString[i] !== cookie.onLoad[i]) {
        if (i < 24) { // intervals
          if (i < 12) {var intvl = i+1;}
          else {var intvl = i-24}
          disableInterval(document.getElementById('sb'+intvl), intvl);
        } else if (i === 24) { // volume
          document.getElementById("volumeMeter").innerHTML = Number(cookie.dataString[i]) + 1
          audio['_volume'] = (Number(cookie.dataString[i]) + 1) * .1;
          checkKnobs('volume');
        } else if (i === 25) { // speed
          document.getElementById("speedMeter").innerHTML = Number(cookie.dataString[i]) + 1
          delay = (10 - Number(cookie.dataString[i])) * 100;
          checkKnobs('speed');
        } else if (i === 26) { // autoPlay
          toggleAutoPlay(document.getElementById('autoplay'));
        } else if (i === 27) { // perPrompt
          document.getElementById("perPromptMeter").innerHTML = Number(cookie.dataString[i]);
          intervalsPerPrompt = Number(cookie.dataString[i]);
          checkKnobs('perPrompt');
        }
      }
    }
    //freshen the cookie
    cookie.saveCookie();
  },
  update: function (param, value) { //param must be (-12)-(-1), 1-12, 'volume', 'speed', 'perPrompt', or 'autoplay'
    if (typeof param === "number") {
      if (param > 0) {
        param += -1;
      } else {
        param += 24;
      }
      if (value) {
        value = 1;
      } else {
        value = 0;
      }
    } else {
      if (param === "volume") {
        param = 24;
        value = value -1;
      } else if (param === "speed") {
        param = 25;
        value = value -1;
      } else if (param === "autoPlay") {
        param = 26;
        if (value) {
          value = 1;
        } else {
          value = 0;
        }
      } else if (param === "perPrompt") {
        param = 27;
        value = value;
      }
    }
    cookie.dataString = cookie.dataString.slice(0,param) + value + cookie.dataString.slice(param + 1);
    cookie.saveCookie();
  },
  saveCookie: function () {
    var cvalue = cookie.dataString;
    var cname = 'options'
    var days = 7;
    var d = new Date();
    d.setTime(d.getTime() + (days*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }
}

cookie.startup();
