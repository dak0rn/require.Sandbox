/**
 * Main file for require.Sandbox
 */

(function(require, requirejs){

    // Reference to another version
    var previousSandbox = require.Sandbox;

    /* == Utility functions == */

    /**
     * Extends an object.
     * Basically the same as an underscore or lodash.
     * @param base      Base object to extend
     * @param {*}       Object with properties to be added to `base`
     * @returns {*}     `base`
     */
    var _extend = function(base) {
        if( 'object' !== typeof base )
            return base;

        var property;
        var target;
        var length = arguments.length;

        // skip the first one since that's `base`
        for( var i = 1; i < length; i++ ) {
            target = arguments[i];

            for( property in target )
                if( target.hasOwnProperty(property) )
                    base[property] = target[property];
        }

        return base;
    };

    /* == A thenable object == */
    var Thenable = function() {

        // TODO Implement

    };

    /**
     * The sandbox object
     * @param options   Object with options for the configuration
     * @constructor
     */
    var Sandbox = function(options){
        // TODO extend here

    };


    /**
     * Restores the previous Sandbox object
     * and returns a reference to this one
     */
    Sandbox.noConflict = function() {
        require.Sandbox = previousSandbox;
        return this;
    };


})(require || function(){}, requirejs || {});