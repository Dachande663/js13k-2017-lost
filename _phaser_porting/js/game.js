PAL.Game = function() {};
PAL.Game.prototype = {
    init: function() {
        this.SCRIPT = this.cache.getJSON("script");
        this.MESSAGES = [];
        
        this.ACTIONS = [
            function(action, scope) { // ACTION_ACTION
                console.log("ACTION_ACTION", action, scope.key);
                var method = action.shift();
                console.log("ACTION_ACTION method=", "PAL."+method, PAL[method]);
                var promise = scope.ACTIONS[PAL[method]].apply(scope, action.concat([scope]));
                return Promise.resolve(promise);
            },

            function(actions, scope) { // ACTION_GROUP
                console.log("ACTION_GROUP", actions);
                return new Promise(function(res, rej) {
                    function doAction() {
                        if (actions.length === 0) {
                            return res();
                        }
                        var action = actions.shift();
                        return this.ACTIONS[PAL.ACTION_ACTION](action, scope).then(function() {doAction.call(scope);});
                    }
                    doAction.call(scope);
                });
            },

            function(text, scope) { // ACTION_TEXT
                console.log("ACTION TEXT");
                scope.MESSAGES.push([PAL.MESSAGE_THEM, text]);
                scope.printAll();
            },

            function(fn, scope) { // ACTION_TEXTFN
                console.warn("ACTION TEXTFN");
                scope.MESSAGES.push([PAL.MESSAGE_THEM, fn.call(scope)]);
                scope.printAll();
            },

            function(delay, scope) { // ACTION_PAUSE
                console.log("ACTION PAUSE");
                return new Promise(function(res, rej) {
                    var t = scope.time.create();
                    t.add(delay, function() {
                        console.log("Pause completed after", delay, "ms");
                        res();
                    }, scope);
                    t.start();
                });
            },

            function(key, scope) { // ACTION_GOTO
                console.warn("ACTION GOTO", key);
                return scope.ACTIONS[PAL.ACTION_GROUP](scope.SCRIPT[key], scope);
            },

            function(fn, scope) { // ACTION_EXEC
                console.warn("ACTION EXEC FN");
                fn.call(scope);
            },

            function(options, scope) { // ACTION_PROMPT
                console.log("ACTION PROMPT", options);
                scope.MESSAGES.push([PAL.MESSAGE_OPTION, options]);
                scope.printAll();
            },

            function(msg, scope) { // ACTION_SYSTEM
                scope.MESSAGES.push([PAL.MESSAGE_SYSTEM, msg]);
                scope.printAll();
            },

            function(delayBefore, delayAfter, scope) { // ACTION_TYPING
                console.log("ACTION TYPING", delayBefore, delayAfter);
                return new Promise(function(res, rej) {                
                    var t = scope.time.create();
                    t.add(delayBefore, function() {
                        scope.MESSAGES.push([PAL.MESSAGE_TYPING, delayBefore]);
                        scope.printAll();
                        var t2 = scope.time.create();
                        t2.add(delayAfter, function() {
                            scope.circleGroup.removeAll();
                            scope.MESSAGES.pop();
                            //scope.printAll();
                            res();
                        }, scope);
                        t2.start();
                    }, scope);
                    t.start();
                });
            },

            function(text, scope) { // ACTION_SPEAK
                console.log("ACTION SPEAK", text);
                scope.MESSAGES.push([PAL.MESSAGE_US, text]);
                scope.printAll();
            },

            function(key, val, scope) { // ACTION_SETVAR
                console.log("ACTION SETVAR", key, "=", val, scope.key);
                PAL.PLAYER[key] = val;
            },

            function(key, map, scope) { // ACTION_IFVAR
                console.warn("ACTION IFVAR");
                var val = (key in PAL.PLAYER) ? PAL.PLAYER[key] : null;
                console.warn("checking val=", val, val in map);
                if(!(val in map)) {
                    return;
                }
                return scope.ACTIONS[PAL.ACTION_ACTION](map[val], scope);
            }
        ];
        
        this.cacheToRemove = [];
        this.options = [];
        this.selectedLang = "EN";
    },
    create: function() {
        console.log("script data", this.game.cache.getJSON("script"));
        
        this.ctx = this.add.graphics(0, 0);
        this.printBackground();
        
        // Selection buttons
        this.btnGroup = this.add.group();
        
        // Messages
        this.msgGroup = this.add.group();
        this.printMessages();
        
        // Typing circles
        this.circleGroup = this.add.group();
        
        this.fgCtx = this.add.graphics(0, 0);
        this.printForeground();
        
        var debug = window.location.href.split("#");
        var startPos = debug[1] && this.SCRIPT[debug[1]] ? this.SCRIPT[debug[1]] : this.SCRIPT["main"];
        
        var style = {
            font: "Courier New, Courier, monospace",
            fontSize: "14px",
            fontWeight: "bold",
            fill: "#25372c"
        };
        this.btn_ES = this.createButton(120, 34, this.getTextMaxWidth(["ES"], style), 20, 5, false, "ES");
        var t = this.add.text(114, 28, "ES", style);
        t.anchor.setTo(0, 0.5);
        this.btn_EN = this.createButton(80, 34, this.getTextMaxWidth(["EN"], style), 20, 5, false, "EN");
        var t = this.add.text(74, 28, "EN", style);
        t.anchor.setTo(0, 0.5);
        
        this.ACTIONS[PAL.ACTION_GROUP](startPos, this);
    },
    // ---------------------------------------------------------------------------------------------------
    addCircle: function(x, y, delay) {
        if (!delay) delay = 0;
        var t = this.time.create();
        var c = this.add.sprite(x, y, "circle");
        c.anchor.setTo(0.5);
        var frames = Phaser.ArrayUtils.numberArray(0, 59);
        var a = c.animations.add("idle", frames, 120, true);
        c.alpha = 0;
        t.add(delay, function() {
            c.alpha = 1;
            c.play("idle");
        }, this);
        t.start();
        
        return c;
    },
    checkLanguageButtons: function(btn, pointer, stillOver) {
        if (!stillOver) return true;
        
        console.log("language button?" , btn.key);
        if (btn.key == "ES" || btn.key == "EN") {
            this.selectedLang = btn.key;
            if (this.options.length) {
                while (this.options.length) {
                    this.MESSAGES.push(this.options.shift());
                }
            }
            this.btnGroup.removeAll();
            for (var q=0, l=this.cacheToRemove.length; q<l; q++) {
                this.cache.removeImage(this.cacheToRemove[q]);
            }
            this.cacheToRemove = [];
            this.printAll();
            return true;
        }
        
        return false;
    },
    createButton: function(x, y, w, h, round, removeFromCache, key) {
        var btnTexture = this.make.graphics()
            .beginFill(0xD4A497, 1)
            .drawRoundedRect(x-w, y - 20, w + 20, h, round)
            .beginFill(0xff0000, 1)
            .drawRoundedRect(x+20, y - 20, w + 20, h, round)
            .endFill()
            .generateTexture();
        this.cache.addSpriteSheet(key, null, btnTexture.baseTexture.source, w + 20, h);
        if (removeFromCache && key) {
            this.cacheToRemove.push(key);
        }

        return this.add.button(x-w, y-20, key, this.onButtonPressed, this, 1, 0);
    },
    formatText: function(txt) {
        for(var i=0, len=txt.length, t=""; i<len; i++) {
            t += txt[i];
            if (i != len-1) t += "\n";
        }
        return t;
    },
    // Get longest text width in array of strings
	getTextMaxWidth: function(txt, style) {
		for(var i=0, len=txt.length, maxWidth = 0, t; i<len; i++) {
			t = this.make.text(0, 0, txt[i], style);
			if(t.width > maxWidth) {
				maxWidth = t.width;
			}
		}
		return maxWidth;
	},
    printAll: function() {
        this.printBackground();
        this.printMessages();
        this.printForeground();
    },
    printBackground: function() {
        this.ctx.clear();
        
        // Phone body
		this.ctx.beginFill(0x333333, 1);
		this.ctx.drawRoundedRect(0, 0, PAL.GW, PAL.GH, 5);
        
        // Screen background
        this.ctx.beginFill(0x6c977f, 1);
		this.ctx.drawRect(14, 44, 612, 422);
        
        // Scan lines
		this.ctx.beginFill(0x92bfa0, 1);
		for(var i = 44; i < 466; i += 3) {
			this.ctx.drawRect(14, i, 612, 1);
		}
    },
    printForeground: function() {
        this.fgCtx.clear();
        this.fgCtx.removeChildren();
        
        // Clip top messages
		this.fgCtx.beginFill(0x333333, 1);
		this.fgCtx.drawRoundedRect(14, 0, 612, 44);


		// Bezel
		this.fgCtx.beginFill(0x222233, 1);
		this.fgCtx.drawRect(14, 41, 615, 3); // top
		this.fgCtx.drawRect(11, 41, 3, 428); // left
		this.fgCtx.beginFill(0x444455);
		this.fgCtx.drawRect(14, 466, 615, 3); // bottom
		this.fgCtx.drawRect(626, 44, 3, 422); // right

		// Fade
        var bmp = this.add.bitmapData(PAL.GW, PAL.GH);
        //bmp.addToWorld();
		var grd = bmp.context.createLinearGradient(0, 40, 0, 300);
		grd.addColorStop(0, "rgba(30,41,33,0.48)");
		grd.addColorStop(0.27, "rgba(60,81,67,0.37)");
		grd.addColorStop(1, "rgba(60,81,67,0.0)");
		bmp.context.fillStyle = grd;
		bmp.context.fillRect(14, 44, 612, 251);
        this.fgCtx.addChild(this.make.sprite(0, 0, bmp));
        
        // Dots
		this.fgCtx.beginFill(0xffce45, 1);
		this.fgCtx.drawCircle(18, 24, 8);
		this.fgCtx.drawCircle(33, 24, 8);
		this.fgCtx.drawCircle(48, 24, 8);
        
        // Title text
        var style = {
            font: "Courier New, Courier, monospace",
            fontSize: "14px",
            fill: "#000"
        };
        var title = this.selectedLang == "EN" ? "P.A.L" : "C.O.L.E.G.A";
        var t = this.make.text(301, 28, title, style);
        t.anchor.setTo(0, 0.5);
        this.fgCtx.addChild(t);
        style.fill = "#ddd";
        t = this.make.text(301, 28, title, style);
        t.anchor.setTo(0, 0.5);
		this.fgCtx.addChild(t);

		// Version text
		style.fontSize = "10px";
        t = this.make.text(557, 27, "v0.28 alpha", style);
        t.anchor.setTo(0, 0.5);
        this.fgCtx.addChild(t);
        style.fill = "#bbb";
        t = this.make.text(556, 26, "v0.28 alpha", style)
        t.anchor.setTo(0, 0.5);
		this.fgCtx.addChild(t);
    },
    printMessages: function() {
        this.msgGroup.removeAll(true);
        
        if (!this.MESSAGES || !this.MESSAGES.length) return;
        
        var style = {};
		style.font = "Courier New, Courier, monospace";
        style.fontSize = "12px"; 
		var line_y = 448;
		for (var len = this.MESSAGES.length-1, m; len >= 0 && true; len--) {

			if(line_y <= 45) {
				break;
			}
            
            /*
            MESSAGE_THEM   : 0,
            MESSAGE_US     : 1,
            MESSAGE_TYPING : 2,
            MESSAGE_OPTION : 3,
            MESSAGE_SYSTEM : 4,
            */
            
            var m = this.MESSAGES[len];
            console.log("received msg:", m);
			switch(m[0]) {
                case PAL.MESSAGE_THEM:
				case PAL.MESSAGE_US:
                    var txt = this.selectedLang == "ES" && m[1]["es"] ? m[1]["es"] : (m[1]["en"] || m[1]);
                    txt = txt instanceof Array ? txt : [txt];
					var textWidth = this.getTextMaxWidth(txt, style);
					var numLines = txt.length;
					this.ctx.beginFill(0x25372c, 1);
					this.ctx.drawRoundedRect((m[0] === PAL.MESSAGE_US) ? 594-textWidth : 24, line_y - (numLines*20), textWidth + 20, 10+(numLines*20), 5);
                    style.fill = "#a1d2af";
					for(var i = 0; i < numLines; i++) {
						var t = this.add.text((m[0] === PAL.MESSAGE_US) ? 603-textWidth : 34, line_y - (i*20) - 1, txt[numLines-i-1], style);
                        t.anchor.setTo(0, 0.5);
                        this.msgGroup.add(t);
					}
					line_y -= 20+(numLines*20);
					break;
                        
                case PAL.MESSAGE_TYPING:
                    this.ctx.beginFill(0x25372c, 1);
					this.ctx.drawRoundedRect(24, line_y - 20, 84, 30, 5);
                    this.circleGroup.addMultiple([this.addCircle(40, line_y - 5, 0), this.addCircle(66, line_y - 5, 200), this.addCircle(92, line_y - 5, 400)]);
                    line_y -= 40;
                    //this.MESSAGES.pop();
                    break;
                    
                case PAL.MESSAGE_OPTION:
                    var txt = this.selectedLang == "ES" && m[1]["es"] ? m[1]["es"] : (m[1]["en"] || m[1]);
					var numLines = txt.length;
					for(var i = 0; i < numLines; i++) {
                        console.log("message option", m, txt[numLines-i-1][1]);
                        var text = txt[numLines-i-1][0];
                        var action = txt[numLines-i-1][1];
                        text = text instanceof Array ? text : [text];
                        var textWidth = this.getTextMaxWidth([text], style);
                        
                        var b = this.createButton(594, line_y - (i*32), textWidth, 30, 5, true, text);
                        b.action = action;
                        
                        style.fill = "#25372c";
                        var t = this.add.text(603-textWidth, line_y - (i*32) - 1, text, style);
                        t.anchor.setTo(0, 0.5);
                        this.btnGroup.addMultiple([b, t]);
					}

					line_y -= 9+(numLines*32);
                    this.options.push(this.MESSAGES.pop());
					break;
                    
                case PAL.MESSAGE_SYSTEM:
                    var txt = this.selectedLang == "ES" && m[1]["es"] ? m[1]["es"] : m[1]["en"];
					var textWidth = this.getTextMaxWidth([txt], style) + 28;
					var half = (640-textWidth)/2;
					this.ctx.beginFill(0x25372c, 1);
					this.ctx.drawRoundedRect(half+1, line_y - 11, textWidth, 18, 5);
					this.ctx.beginFill(0x92bfa0, 1);
					this.ctx.drawRoundedRect(half, line_y - 12, textWidth, 18, 5);
                    style.fill = "#25372c";
					var t = this.add.text(half + 14, line_y - 0, this.formatText([txt]), style);
                    t.anchor.setTo(0, 0.5);
                    this.msgGroup.add(t);
					line_y -= 36;
					break;
            } // end switch
        } // end for messages
    },
    onButtonPressed: function(btn, pointer, stillOver) {
        if (!stillOver) return;
            
        console.log("click", btn.key, btn.action, stillOver);
        console.log("check cache", this.cache.getKeys());
        console.log("check cache", this.cache.getItem(btn.key, Phaser.Cache.IMAGE));
        
        if (this.checkLanguageButtons(btn, pointer, stillOver)) return;
        
        this.btnGroup.removeAll();
        
        for (var q=0, l=this.cacheToRemove.length; q<l; q++) {
            this.cache.removeImage(this.cacheToRemove[q]);
        }
        this.cacheToRemove = [];
        this.options = [];
        console.log("check cache", this.cache.getKeys());
        
        this.printAll();
        
        this.ACTIONS[PAL.ACTION_GROUP](this.SCRIPT[btn.action], this);
    },
};