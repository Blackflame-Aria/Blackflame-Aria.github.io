(function(global){
 if (!global) return;
    if (!global.BABYLON) global.BABYLON = {};

    function CannonJSPluginShim() {
        this.name = 'CannonJSPlugin-shim';
        this.world = null;
        this.timeStep = 1/60;
        if (typeof CANNON !== 'undefined') {
            try {
                this.world = new CANNON.World();
                if (this.world) {
                    this.world.gravity.set(0, -9.81, 0);
                }
            } catch(e) {
                this.world = null;
            }
        }
    }

    CannonJSPluginShim.prototype.setTimeStep = function(dt) { this.timeStep = dt; };
    CannonJSPluginShim.prototype.executeStep = function() {
        if (this.world && typeof this.world.step === 'function') {
            try { this.world.step(this.timeStep); } catch(e) {}
        }
    };

    global.BABYLON.CannonJSPlugin = CannonJSPluginShim;
    try { global.__BABYLON_CANNON_PLUGIN_OK = true; } catch(e) {}
})(window);
