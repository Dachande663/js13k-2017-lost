PAL.Preload = function() {};
PAL.Preload.prototype = {
    init: function() {
        
    },
    preload: function() {
        this.load.path = "data/";
        this.load.json("script", "script.json");
        
        this.load.path = "media/";
        this.load.spritesheet("circle", "circle.png", 30, 30);
    },
    create: function() {
        this.state.start('PAL.Game');
    }
};