var game = new Phaser.Game(640, 480, Phaser.CANVAS);

var PAL = {
    CURSOR_DEFAULT: "default",
    CURSOR_POINTER: "pointer",

    EVENT_NONE: "n",
    EVENT_CLICK: "c",

    MESSAGE_THEM   : 0,
    MESSAGE_US     : 1,
    MESSAGE_TYPING : 2,
    MESSAGE_OPTION : 3,
    MESSAGE_SYSTEM : 4,

    ACTION_ACTION : 0,
    ACTION_GROUP  : 1,
    ACTION_TEXT   : 2,
    ACTION_TEXTFN : 3,
    ACTION_PAUSE  : 4,
    ACTION_GOTO   : 5,
    ACTION_EXEC   : 6,
    ACTION_PROMPT : 7,
    ACTION_SYSTEM : 8,
    ACTION_TYPING : 9,
    ACTION_SPEAK  : 10,
    ACTION_SETVAR : 11,
    ACTION_IFVAR  : 12,

    LAST_TICK: null,
    NUM_TICKS : -1,

    // Game
    GW : 640, // game width
    GH : 480, // game height

    // State
    PLAYER : {}, // player state vars
    MESSAGES : [], // messages stack

    // Browser
    W : window,
    C : game.canvas,
    MOBILE : "ontouchstart" in document,

    // Mouse
    MX : 0, // mouse x
    MY : 0, // mouse y
    EX : 0, // event x
    EY : 0, // event y

    // Misc
    PI2 : Math.PI * 2,
    
    PLAYER: {}
};

/*PAL.CTX = PAL.C.getContext("2d");
PAL.R = PAL.C.getBoundingClientRect();*/
PAL.ES = PAL.EVENT_NONE;

PAL.Boot = function() {};
PAL.Boot.prototype = {
    init: function() {
        this.input.maxPointers = 1;
        this.scale.compatibility.forceMinimumDocumentHeight = true;
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.refresh();
        
        this.time.desiredFps = 60;
    },
    preload: function() {
        
    },
    create: function() {
        this.state.start('PAL.Preload');
    }
};