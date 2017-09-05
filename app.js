(function(){


	// Constants
	var
		CURSOR_DEFAULT = "default",
		CURSOR_POINTER = "pointer",

		EVENT_NONE  = "n",
		EVENT_CLICK = "c";

		MESSAGE_THEM   = 0,
		MESSAGE_US     = 1,
		MESSAGE_TYPING = 2,
		MESSAGE_OPTION = 3,
		MESSAGE_SYSTEM = 4,

		ACTION_ACTION = 0,
		ACTION_GROUP  = 1,
		ACTION_TEXT   = 2,
		ACTION_TEXTFN = 3,
		ACTION_PAUSE  = 4,
		ACTION_GOTO   = 5,
		ACTION_EXEC   = 6,
		ACTION_PROMPT = 7,
		ACTION_SYSTEM = 8,
		ACTION_TYPING = 9,
		ACTION_SPEAK  = 10
	;


	// Globals
	var
		// Timer
		LAST_TICK,
		NUM_TICKS = -1,

		// Game
		GW = 640, // game width
		GH = 480, // game height

		// State
		SCRIPT = theScript(), // load the script!!
		MESSAGES = [], // messages stack

		// Browser
		W = window,
		CTX = C.getContext("2d"),
		MOBILE = "ontouchstart" in document,

		// Mouse
		R  = C.getBoundingClientRect();
		MX = 0, // mouse x
		MY = 0, // mouse y
		EX = 0, // event x
		EY = 0, // event y
		ES = EVENT_NONE, // event status

		// Misc
		PI2 = Math.PI * 2
	;


	// Init UI
	C.width = CTX.width = GW;
	C.height = CTX.height = GH;
	D.style.webkitTransformOrigin = D.style.transformOrigin = "0 0";


	// Track mouse movement
	C.onmousemove = function(e) {
		MX = e.clientX - R.left;
		MY = e.clientY - R.top;
	};


	// Store click event for next tick
	if(MOBILE) {
		C.addEventListener("touchstart", function(e){
			ES = EVENT_CLICK;
			EX = MX = e.changedTouches[0].pageX - R.left;
			EY = MY = e.changedTouches[0].pageY - R.top;
		});
	} else {
		C.onclick = function(e) {
			ES = EVENT_CLICK;
			EX = MX;
			EY = MY;
		};
	}


	// Actions map
	var ACTIONS = [

		function(action) { // ACTION_ACTION
			var method = action.shift();
			var promise = ACTIONS[method].apply(null, action);
			return Promise.resolve(promise);
		},

		function(actions) { // ACTION_GROUP
			return new Promise(function(res, rej){
				function doAction() {
					if(actions.length === 0) {
						return res();
					}
					var action = actions.shift();
					return ACTIONS[ACTION_ACTION](action).then(doAction);
				}
				doAction();
			});
		},

		function(text) { // ACTION_TEXT
			MESSAGES.push([MESSAGE_THEM, text]);
		},

		function(fn) { // ACTION_TEXTFN
			MESSAGES.push([MESSAGE_THEM, fn()]);
		},

		function(delay) { // ACTION_PAUSE
			return new Promise(function(res, rej){
				setTimeout(function(){ res(); }, delay);
			});
		},

		function(key) { // ACTION_GOTO
			return ACTIONS[ACTION_GROUP](SCRIPT[key]);
		},

		function(fn) { // ACTION_EXEC
			fn();
		},

		function(options) { // ACTION_PROMPT
			MESSAGES.push([MESSAGE_OPTION, options]);
		},

		function(msg) { // ACTION_SYSTEM
			MESSAGES.push([MESSAGE_SYSTEM, msg]);
		},

		function(delayBefore, delayAfter) { // ACTION_TYPING
			return new Promise(function(res, rej){
				setTimeout(function() {
					MESSAGES.push([MESSAGE_TYPING]);
					setTimeout(function(){
						MESSAGES.pop();
						res();
					}, delayAfter);
				}, delayBefore);
			});
		},

		function(text) { // ACTION_SPEAK
			MESSAGES.push([MESSAGE_US, text]);
		},

	];


	// Go!
	tick();
	var hash = W.location.hash;
	var startingAction = (hash.length > 1) ? hash.substr(1) : "main";
	if( ! (startingAction in SCRIPT) ) {
		startingAction = "main";
	}
	ACTIONS[ACTION_GROUP](SCRIPT[startingAction]);


	// Handle new tick of game loop
	function tick(t) {
		if(!LAST_TICK) {
			LAST_TICK = t;
		}
		dt = Math.min(100, t-LAST_TICK);
		LAST_TICK = t;
		NUM_TICKS++;
		requestAnimationFrame(tick);
		render(t, dt, NUM_TICKS);
	}


	// Draw game
	function render(t, dt, numTicks) {

		// Reset
		var cursor = CURSOR_DEFAULT;
		CTX.clearRect(0, 0, GW, GH);


		// Phone body
		CTX.fillStyle = "#333";
		drawRoundRect(0, 0, GW, GH, 5);


		// Screen background
		CTX.fillStyle = "#6c977f";
		CTX.fillRect(14, 44, 612, 422);


		// Scan lines
		CTX.fillStyle = "#92bfa0";
		// for(var i = 41 + ((t/196)%196)%3; i < 466; i += 3) {
		for(var i = 44; i < 466; i += 3) {
			CTX.fillRect(14, i, 612, 1);
		}


		// Messages
		CTX.font = "12px 'Courier New', Courier, monospace";
		var line_y = 448;
		for(var len = MESSAGES.length-1, m; len >= 0; len--) {

			if(line_y <= 45) {
				break;
			}

			m = MESSAGES[len];
			switch(m[0]) {

				case MESSAGE_THEM:
				case MESSAGE_US:
					var textWidth = getTextWidth(m[1]);
					var numLines = m[1].length;
					CTX.fillStyle = "#25372c";
					drawRoundRect((m[0] === MESSAGE_US) ? 594-textWidth : 24, line_y - (numLines*20), textWidth + 20, 10+(numLines*20), 5);
					CTX.fillStyle = "#a1d2af";
					for(var i = 0; i < numLines; i++) {
						CTX.fillText(m[1][numLines-i-1], (m[0] === MESSAGE_US) ? 603-textWidth : 34, line_y - (i*20) - 1);
					}
					line_y -= 20+(numLines*20);
					break;

				case MESSAGE_TYPING:
					CTX.fillStyle = "#25372c";
					drawRoundRect(24, line_y - 20, 60, 30, 5);
					CTX.fillStyle = "rgba(146,191,160," + Math.sin(((t%1200)/1200)*Math.PI) + ")";
					drawCircle(40, line_y - 5, 4);
					CTX.fillStyle = "rgba(146,191,160," + Math.sin((((t-100)%1200)/1200)*Math.PI) + ")";
					drawCircle(53, line_y - 5, 4);
					CTX.fillStyle = "rgba(146,191,160," + Math.sin((((t-200)%1200)/1200)*Math.PI) + ")";
					drawCircle(66, line_y - 5, 4);
					line_y -= 40;
					break;

				case MESSAGE_SYSTEM:
					var textWidth = getTextWidth([m[1]]) + 28;
					var half = (640-textWidth)/2;
					CTX.fillStyle = "#25372c";
					drawRoundRect(half+1, line_y - 11, textWidth, 18, 5);
					CTX.fillStyle = "#92bfa0";
					drawRoundRect(half, line_y - 12, textWidth, 18, 5);
					CTX.fillStyle = "#25372c";
					CTX.fillText(m[1], half + 14, line_y - 0);
					line_y -= 36;
					break;

				case MESSAGE_OPTION:
					var numLines = m[1].length;
					for(var i = 0; i < numLines; i++) {
						var textWidth = getTextWidth([m[1][numLines-i-1][0]]);
						var hovering = (
							MX >= 594-textWidth && MX <= 613
							&&
							MY >= line_y - (i*32)-20 && MY <= line_y - (i*32)+10
						);
						if(hovering) {
							if(
								ES === EVENT_CLICK  &&
								EX >= 594-textWidth && EX <= 613
								&&
								EY >= line_y - (i*32)-20 && EY <= line_y - (i*32)+10
							) {
								ES = EVENT_NONE;
								EX = 0;
								EY = 0;
								MESSAGES.pop(); // remove options!
								ACTIONS[ACTION_GROUP](SCRIPT[m[1][numLines-i-1][1]]);
							}
							cursor = CURSOR_POINTER;
						}
						CTX.fillStyle = hovering ? "#ff0000" : "#D4A497";
						drawRoundRect(594-textWidth, line_y - (i*32) - 20, textWidth + 20, 30, 5);
						CTX.fillStyle = hovering ? "#25372c" : "#25372c";
						CTX.fillText(m[1][numLines-i-1][0], 603-textWidth, line_y - (i*32) - 1);
					}

					line_y -= 9+(numLines*32);
					break;

			} // end switch
		} // end messages


		// Clip top messages
		CTX.fillStyle = "#333";
		CTX.fillRect(14, 0, 612, 44);


		// Bezel
		CTX.fillStyle = "#223";
		CTX.fillRect(14, 41, 615, 3); // top
		CTX.fillRect(11, 41, 3, 428); // left
		CTX.fillStyle = "#445";
		CTX.fillRect(14, 466, 615, 3); // bottom
		CTX.fillRect(626, 44, 3, 422); // right


		// Fade
		var grd = CTX.createLinearGradient(0, 40, 0, 300);
		grd.addColorStop(0, "rgba(30,41,33,0.48)");
		grd.addColorStop(0.27, "rgba(60,81,67,0.37)");
		grd.addColorStop(1, "rgba(60,81,67,0.0)");
		CTX.fillStyle = grd;
		CTX.fillRect(14, 44, 612, 251);


		// Dots
		CTX.fillStyle = "#ffce45";
		drawCircle(18, 24, 4);
		drawCircle(33, 24, 4);
		drawCircle(48, 24, 4);


		// Title text
		CTX.font = "14px 'Courier New', Courier, monospace";
		CTX.fillStyle = "#000";
		CTX.fillText("P.A.L", 301, 28);
		CTX.fillStyle = "#ddd";
		CTX.fillText("P.A.L", 299, 27);


		// Version text
		CTX.font = "10px 'Courier New', Courier, monospace";
		CTX.fillStyle = "#000";
		CTX.fillText("v0.27 alpha", 557, 27);
		CTX.fillStyle = "#bbb";
		CTX.fillText("v0.27 alpha", 556, 26);


		// Highlight tap
		// CTX.fillStyle = '#f00';
		// drawCircle(EX, EY, 10);


		// Set cursor for whole canvas
		C.style.cursor = cursor;

	}


	// Draw a rectangle with rounded corners
	function drawRoundRect(x, y, width, height, radius) {
		CTX.beginPath();
		CTX.moveTo(x + radius, y);
		CTX.lineTo(x + width - radius, y);
		CTX.quadraticCurveTo(x + width, y, x + width, y + radius);
		CTX.lineTo(x + width, y + height - radius);
		CTX.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		CTX.lineTo(x + radius, y + height);
		CTX.quadraticCurveTo(x, y + height, x, y + height - radius);
		CTX.lineTo(x, y + radius);
		CTX.quadraticCurveTo(x, y, x + radius, y);
		CTX.closePath();
		CTX.fill();
	}


	// Draw a circle
	function drawCircle(x, y, r) {
		CTX.beginPath();
		CTX.arc(x, y, r, 0, PI2);
		CTX.fill();
	}


	// Get longest text width in array of strings
	function getTextWidth(txt) {
		for(var i = 0, len = txt.length, maxWidth = 0, t; i < len; i++) {
			t = CTX.measureText(txt[i]);
			if(t.width > maxWidth) {
				maxWidth = t.width;
			}
		}
		return maxWidth;
	}


})();
