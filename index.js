/**
 * A require.js sandbox implementation without any
 * dependencies.
 *
 * Author: dak0rn  <https://github.com/dak0rn>
 * Proudly made with Atom <https://atom.io>
 */
(function(require, requirejs, window, define){
    'use strict';

    // Reference to another version
    var previousSandbox = require.Sandbox;

    // The sandbox version
    var _VERSION = "1.0.4";

    /* == Utility functions == */

    /**
     * Extends an object.
     * Basically the same as an underscore or lodash.
     * @param base      Base object to extend
     * @param {*}       Object with properties to be added to `base`
     * @returns         `base`
     */
    var _extend = function(base) {
        if( 'object' !== typeof base && 'function' !== typeof base )
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

    /**
     * A simple bind utility
     *
     * @param {function} fn    Function to wrap
     * @param {object}   ctx   Context to call `fn` with    (default: {})
     * @return function        A wrapping function that delegates everything
     */
    var _bind = function(fn,ctx) {
        return function() {
            fn.apply(ctx || {}, arguments);
        };
    };

    /**
     * Determines if the given argument is a function
     *
     * @param {?}   what  Something to check
     * @return            true if it is a function
     */
    var _isFn = function(what) {
        return 'function' === typeof what;
    };

    /**
     * Checks if the given object has a property with the given name
     * and returns it or the return value of it if it is a function.
     *
     * Own properties are preferred over prototype properties.
     *
     * @param   {object}    object          Object to check in
     * @param   {string}    property        Property to check for
     * @param   {?}         def             Default value   (default: undefined)
     */
    var _result = function(object, property, def) {
        // Default value if not found
        if( ! object.hasOwnProperty(property) && ! object[property] )
            return def;

        var o = object[property];
        return _isFn( o ) ? o() : o;
    };

    /**
     * Determines if the given whatever is an array
     *
     * @param   {?} what    Object to check
     * @return              true if `what` is an array
     */
    var _isArray = function(what) {
        if( Array.isArray )
            return Array.isArray(what);
        else
            return '[object Array]' === Object.prototype.toString.call(what);
    };

    /* == Sandbox stuff == */

    /**
     * Returns a function supposed to catch
     * require's error object and create a standarized one
     * out of it
     *
     * @param   {object}   sandbox      Reference to the sandbox to use
     * @param   {object}   promise      A promise to be rejected
     * @return  Function
     */
    var _buildErrorFunction = function(sandbox, promise) {

        return function(errorObject) {
            promise.reject( _makeError(sandbox,errorObject) );
        };

    };

    /**
     * Creates a standardized error object from the given `object`
     * referencing the given `sandbox`.
     *
     * @param   {object} sandbox    Sandbox object
     * @param   {object} object     Object with error information
     */
    var _makeError = function(sandbox, object) {

        if( 'undefined' === typeof sandbox ) {
            // This should not happen
            throw new Error('require.Sandbox: internal error, _makeError [no-sb]');
        }

        object || (object = {});

        var base = {
            type: object.type || '',
            sandbox: sandbox
        };

        // require.js error?
        if( 'undefined' !== typeof object.requireType ||
            'undefined' !== typeof object.requireModules ) {
            base.type = 'requireError';
            base.err  = object;
        }
        else {
            base = _extend(base,object);
        }

        return base;
    };

    /**
     * Loads the configured module.
     * Expects that `this` references the sandbox object.
     *
     * @param   {object}    sandbox     A sandbox wrapper as defined in the
     *                                  constructor of Sandbox
     * @return  A promise
     */
    var _loadModules = function(sandbox) {

        var mod = _result(this, 'load');

        // Create a new promise
        var promise = new Thenable();

        // Utility that ensures the module has been loaded
        // correctly. Make sure, `this` references the
        // sandbox object
        var moduleChecker = function(module) {
            // Execute the provided test function if there is any
            if( _isFn( this.test ) && true !== this.test.call({},module,this) ) {
                promise.reject( _makeError(this, {type:'testFailed'}) );
                return;
            }

            sandbox.wrapped = module;   // Make the loaded module available
            promise.resolve(this);      // this -> Sandbox
        };

        try {
            require([mod],                                          // Module to load
                    _bind(moduleChecker, this),                     // Handler on success
                    _buildErrorFunction(this, promise)              // Handler if failed
                    );
        }
        catch( e ) {
            promise.reject( _makeError(this, {type:'requireFailed',exception: e}) );
        }

        return promise;

    };

    /* == A thenable object == */
    /*
     * This is not a Promises/A+ implementation.
     * Please use a library such as when.js to transform it.
     */
     var Thenable = function() {

         var _then = [];
         var _catch = [];
         var _state = 'pending';
         var _value;

         var maybeExecuteCallbacks = function() {
             if( 'pending' === _state )
                 return;

             var array = ( 'rejected' === _state ) ? _catch : _then;
             var fn;

             while( 0 < array.length ) {
                 fn = array.shift();
                 fn.call({},_value);
             }

             _then  = [];
             _catch = [];

         };

         this.then = function(onFulfilled, onRejected) {

             if( 'function' === typeof onFulfilled ) {
                 _then.push( onFulfilled );
             }

             if( 'function' === typeof onRejected ) {
                 _catch.push( onRejected );
             }

             maybeExecuteCallbacks();

             return this;
         };

         this.catch = function(onRejected) {
             return this.then(undefined, onRejected);
         };

         this.reject = function(reason) {
             if( 'pending' === _state ) {
                 _state = 'rejected';
                 _value = reason;
                 maybeExecuteCallbacks();
             }

             return this;
         };

         this.resolve = function(value) {
             if( 'pending' === _state ) {
                 _state = 'resolved';
                 _value = value;
                 maybeExecuteCallbacks();
             }

             return this;
         };

        this.state = function() {
            return _state;
        };

     };

    // Different states of the sandbox
    var _sandboxStates = {
        pending: 'pending',
        required: 'required',
        error: 'error'
    };

    /**
     * The sandbox object
     * @param options   Object with options for the configuration
     * @constructor
     */
    var Sandbox = function(options){

        options || ( options = {} );

        // The actual sandbox object
        var _sb = {
            wrapped: undefined
        };

        this._sb = _sb;

        var tried = false;           // An ugly indicator

        /**
         * Load modules specified in the .load property.
         * Returns a sandbox object
         */
        this._require = function() {
            tried = true;                       // Yeah we tried its
            var promise =  _loadModules.call(this,_sb);

            // Register handlers that update the sandbox's state
            promise
                .then( _bind(function() {
                    this.state = _sandboxStates.required;
                    // The module is provided through the .execute() function

                },this) )
                .catch( _bind(function(error) {
                    this.state = _sandboxStates.error;
                    this.error = error;     // Provide the error
                }, this));

            return promise;
        };

        /**
         * Executes a function of the loaded module
         * and returns a promise resolved with the return
         * value or reject whenever an error occurs.
         */
        this._execute = function(options) {
            if( ! tried )
                throw new Error('require.Sandbox: No module loaded yet, unable to access it');

            if( !options )
                throw new Error('require.Sandbox: No options for .execute given');

            if( !options.name )
                throw new Error('require.Sandbox: No .name for .execute given');

            var promise = new Thenable();

            options = _extend({context:{},arguments:[]},options);

            var execFn = !!options.forceExecute;

            try {
                // Invoke the function or retrieve the value and resolve the promise with it
                var r;

                if( execFn || 'function' === typeof _sb.wrapped[options.name] )
                    r = _sb.wrapped[options.name].apply(options.context,options.arguments);
                else
                    r = _sb.wrapped[options.name];

                promise.resolve( { result: r, sandbox: this } );
            }
            catch( e ) {
                promise.reject( _makeError(this,{type:'executeFailed',exception: e}) );
            }

            return promise;

        };


        // Mix in given options
        // This is done at the end so that methods can be overwritten
        _extend(this,options);

    };

    // Extend the prototype
    _extend( Sandbox.prototype, {

        /**
         * Modules to load
         * May be a string or a function.
         *
         * Supports only one module per sandbox.
         */
        load: null,

        /**
         * Test function to invoked after
         * loading modules.
         * Gets the loaded modules in the order specified
         * in `.load` and must return true or false.
         *
         * If it return false, the loaded modules are
         * considered invalid and the sandbox's state will
         * be changed to indicate a loading error.
         */
        test: function(module, sandbox){ return true; },

        /**
         * Status of the sandbox
         */
        state: _sandboxStates.pending,


        /**
         * An error object that contains a reason and the referenced
         * modules.
         */
        error: undefined,

        /**
         * Require the configured module
         */
        require: function() {
            // Delegate
            return this._require.apply(this,arguments);
        },

        /**
         * Execute a function or access a given property
         */
        execute: function() {
            // Delegate
            return this._execute.apply(this, arguments);
        }

    });


    /**
     * This advanced inheritance function is used to set up
     * the prototype chain properly.
     * Take a look at Backbone's source code for more information
     * on that.
     */
    Sandbox.extend = function(protoMixins, staticMixins) {
        var parent = this;
        var child;

        // Set the constructor function if provided or delegte to
        // the parent
        if( protoMixins && protoMixins.hasOwnProperty('constructor') ) {

            child = protoMixins.constructor;
        }
        else {
            child = function() { return parent.apply(this, arguments); };
        }

        // Mixin properties
        child = _extend(child,parent,staticMixins);

        // We want a prototype reference to parent since we inherit from it
        // but we do not want to call its constructor, so we wrap
        // it into a function
        var Chain = function() { this.constructor = child; };
        Chain.prototype = parent.prototype;

        child.prototype = new Chain();

        // Update the child's prototype with the given properties
        if( protoMixins )
            _extend( child.prototype, protoMixins );

        // Convenience reference to the parent class
        // for a seamless integration into Backbone
        child.__super__ = parent.prototype;             // Skips 'Chain',

        return child;
    };

    /**
     * Restores the previous Sandbox object
     * and returns a reference to this one
     */
    Sandbox.noConflict = function() {
        require.Sandbox = previousSandbox;
        return Sandbox;
    };

    /**
     * Default test functions
     */
    Sandbox.test = {
        'undefined': function(w) { return 'undefined' !== typeof w; },
        'null': function(w) { return null !== w; }
    };

    /**
     * Patch functions used to override
     * window and require.js error handlers
     */
    // Cache
    var _patched = {
        window: undefined,
        require: undefined
    };

    // Default functions
    var _patchFns = {
        window: function(){ return true;  },
        require: function(){ return true; }
    };

    // Patching
    Sandbox.patch = {
        window: function() {
            // Do not overwrite if already patched
            if( 'undefined' !== typeof _patched.window )
                return;

            _patched.window = window.onerror;
            window.onerror = _patchFns.window;
        },

        require: function() {
            // Do not overwrite if already patched
            if( 'undefined' !== typeof _patched.require )
                return;

            _patched.require = require.onError;
            require.onError = _patchFns.require;
        }
    };

    // The restoring part
    Sandbox.restore = {
        window: function() {
            // Do not restore if not patched
            if( 'undefined' === typeof _patched.window )
                return;

            window.onerror = _patched.window;
            _patched.window = undefined;
        },

        require: function() {
            // Do not restore if not patched
            if( 'undefined' === typeof _patched.require )
                return;

            require.onError = _patched.require;
            _patched.require = undefined;
        }
    };

    // Export it
    require.Sandbox = Sandbox;
    require.Sandbox.VERSION = _VERSION;

    // Also export it as a require.js legacy module
    define([], function(){
        return require.Sandbox;
    });


})( require || function(){},
    requirejs || {},
    window || {},
    define || function(){}
);
