# require.Sandbox
### A sandbox module for require.js

require.Sandbox is a sandbox module that integrates into [require.js](http://requirejs.org/) and
can be used to safely load modules.
The idea is to wrap them into a sandbox that makes sure that errors do
not crash the whole application but can be handled programmatically.


- [Installation](#installation)
    - [Bower](#bower)
    - [Git](#git)
- [Build](#build)
- [Usage](#usage)
- [API documentation](#api-documentation)
    - [require.Sandbox](#requiresandbox-1)
        - [load parameter](#load-parameter)
        - [test parameter](#test-parameter)
    - [require.Sandbox.extend()](#requiresandboxextend)
    - [Sandbox.require()](#sandboxrequire)
    - [Sandbox.execute()](#sandboxexecute)
    - [Sandbox.state](#sandboxstate)
    - [Sandbox.error](#sandboxerror)
    - [Patching error functions](#patching-error-functions)
        - [require.Sandbox.patch.window()](#requiresandboxpatchwindow)
        - [require.Sandbox.patch.require()](#requiresandboxpatchrequire)
        - [require.Sandbox.restore.window()](#requiresandboxrestorewindow)
        - [require.Sandbox.restore.require()](#requiresandboxrestorerequire)
    - [require.Sandbox.noConflict()](#requiresandboxnoconflict)

## Installation

### Bower

To install require.Sandbox with [bower](https://bower.io), use the following command:

    bower install require-sandbox

### Git

Clone the repository with `git`:


    git clone https://github.com/SuitSoft/require.Sandbox.git


You then have access to the uncompressed `require.Sandbox.js` and the minified version `dist/require.Sandbox.min.js`.
It is strongly recommended to use the uncompressed version when developing.

## Build

If you would like to build require.Sandbox on your own (e.g. to test changed features)
you first need to install [gulp](http://gulpjs.com/) globally to get access to the command line
executable:

    npm install -g gulp

It might be required to run the command with `sudo`, please take a look [at this document](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md) for more
information on how to install it.

Next, install the development dependencies with

    npm install


You now can use gulp to test and build the project:

Run `gulp` in the project directory to execute the `default` task that will lint the
source code, minify it and run the tests for the minified version.

Run `gulp build` to run the `build` task which will do basically the same as the
`default` task but will also run tests for the uncompressed source.


> When running the linter, you will get warnings like this:
>
>    Expected an assignment or function call and instead saw an expression.
>
> These are caused by expressions like `options || (options = {})` to set default
> values for arguments. I like that style, so please ignore them.
>
> When running the tests, you will see some `No such file or directory` errors. These
> are programmatically caused by the tests to test the behaviour with missing files.


Both, `build` and `default` will generate an `require.Sandbox.min.js` in the folder `dist`.
For more tasks, please check out the gulpfile.

## Usage

Here is a basic usage example that demonstrates it if you do not want to read the full
API documentation.

Given the following file structure:

    project/
        index.html
        lib/
            requirejs/
                require.js
            require.Sandbox/
                dist/
                    require.Sandbox.min.js
            loader.js

These are the contents of your `index.html` file, a basic require.js kickoff
application.

```html
<!DOCTYPE html>
<html>
    <head>
        <script src="lib/requirejs/require.js" data-main="lib/loader"></script>
    </head>
    <body>
    </body>
</html>
```

The `lib/loader.js` file will configure require.js and try to load a non-existing
module, errors will be caught and printed to the console:

```js
requirejs.config({
    baseUrl: 'lib',
    paths: {
        'require.Sandbox': 'require.Sandbox/dist/require.Sandbox.min'
    }
});

// Load the sandbox to make it available
require(['require.Sandbox'], function(Sandbox){

    // The sandbox module is now available as
    // Sandbox                  (function argument)
    // or  
    // require.Sandbox          (global hook)

    var testFunction = function(module) {
        return 'undefined' !== typeof module;
    };

    var mySandbox = new Sandbox({
        load: './not-found',             // Module to load
        test: testFunction               // Test function to ensure the module has been loaded
    });

    // Patch the error functions to prevent errors from
    // bubbling up
    require.Sandbox.patch.window();
    require.Sandbox.patch.require();

    // Try to load the module
    var promise = mySandbox.require();

    // Invoked when loading was successful
    promise.then( function( sandbox ) {
        // sandbox === mySandbox

        // Execute a function on the loaded module
        // .execute() returns a promise
        var ep = sandbox.execute({
            name: 'moduleStart',            // Name of the function
            context: this,                  // Context (default: {})
            arguments: [true,false,42]      // Function arguments (default: [])
        });


        ep.then( function(result) { console.log('executed .moduleStart(), returned:', result); })
          .catch( function(err) { console.log('Could not execute .moduleStart():', err); });
    });

    promise.catch( function(err) {
        console.log('Cannot load module: ', err.type);
    });

});

```

## API documentation

require.Sandbox comes with a simple API that feels very natural if you are used to
Backbone or Marionette.

As shown in the usage example, you have to `require()` the script file which will then
add `Sandbox` to `require` making it available as `require.Sandbox`. It will also
return itself like normal module so that you can use it in your `require()` callback

### require.Sandbox

`require.Sandbox` is a constructor function that allows you to create new objects of it.
You can submit an object with configuration when you instantiate a new `Sandbox`:

```js
var sandbox = new require.Sandbox({
    load: 'filename',
    test: myTestFunction
    });
```

Any option more than these two will be added to the object and is available later:

```js
var sandbox = new require.Sandbox({
    load: 'filename',
    test: myTestFunction,
    fancy: true
    });

// sandbox.fancy === true;

```

#### load parameter

The `load` parameter given to the constructor is supposed to contain the path
to a module. It is also possible to provide a function that returns the path.

#### test parameter

When loading modules that contain errors such as `SyntaxError`'s, these will bubble
up to the window causing your application to crash. To prevent that, require.Sandbox
provides the `require.Sandbox.patch.window()` function (more on that later).

However, errors bubbling up to the global error function cannot be matched to a loaded
modules. So, if you load a couple of modules in parallel, it is not possible to say
which module failed to load.

To enable you to check if a module has failed to load, you can provide a test function
that will retrieve the loaded module (and the sandbox object that loaded it) and returns
either `true` or `false` - the latter indicates that the module did not load correctly.

Thus, if you have a module that returns an object, you path the error function using
`require.Sandbox.patch.window()` and your test function retrieves `undefined` the module
has not been loaded correctly.

If you do not provide a function, anything will taken as correctly loaded.

require.Sandbox comes with some common test functions so that you do not have to
write the same boilerplate over and over:

- `require.Sandbox.test.undefined` - checks if the given module is `undefined`
- `require.Sandbox.test.null` -  checks if the given module is `null`

### require.Sandbox.extend()

require.Sandbox provides an `.extend()` function that allows you to create your
own sandbox *classes* with different (default) behaviour. As well as `.extend()`
used in Backbone (e.g. [Backbone.Model.extend](http://backbonejs.org/#Model-extend))
this function takes two arguments, instance properties (`protoMixins`) and
class properties (`staticMixins`) that will be added to the constructor function.

```js
require.Sandbox.extend(protoMixins, staticMixins)
```

If you are used to Backbone or Marionette, this looks familiar.

```js
var VerboseSandbox = require.Sandbox.extend({

    require: function() {
        console.log('Trying to load ', this.load);

        // Call "parent" function
        return require.Sandbox.prototype.require.apply(this, arguments);
    },

    myMagicalFunction: function() {
        // ...
    }
}, {
    iAmSoStatic: true
});

var box = new VerboseSandbox({ load: 'awesome-script' });
box.require();      // Prints: 'Trying to load awesome-script'

VerboseSandbox.iAmSoStatic; // === true
```

### Sandbox.require()

After you have created a `Sandbox` object you can load the specified module using
the `.require()` function. It will throw you some errors if anything is wrong
with your arguments (e.g. no module has been specified).

```js
var sandbox = new require.Sandbox({
    load: 'modules/main/Controller.js',
    test: require.Sandbox.test.undefined
    });

var promise = sandbox.require();
```

The require function returns *something that looks like a promise*.

> The be precisely, the returned object is *thenable* since it has a `.then()` function.
> **But**, it is not fully [Promises/A+](http://promisesaplus.com) compatible. If you want
> to have a real promise, I would recommend to use a library such as [when](https://github.com/cujojs/when), that can assimilate
> foreign thenables.



You can attach handlers using `.then()` and `.catch()` for success or failure.
The success handlers will retrive the same sandbox object that was used to require
the module (this allows you to create generic handlers that can work with the arguments they get).

```js
promise.then( function(sandbox) {
    // Do awesome stuff here
});
```

Later more on how to use a sandbox with a loaded module.

The error handlers will retrieve an error object that contains information about
what happened.

```js
promise.catch( function(err) {
    console.log('Something failed. Reason:', err.type);     // Type
    console.log('The sandbox:', err.sandbox);               // Sandbox

    // Require.js?
    if( 'requireError' === err.type ) {
        console.log('Error in require.js: ', err.err);     // require.js error object
    }


});
```

### Sandbox.execute()

A sandbox' `.execute()` function allows you to access the module's properties in a safe way. Exceptions are caught and given to you through the promise returned by the function.

    Sandbox.execute(options)

The function excepts an object with options and has to contain at least the name
of the property to access. In addition, you can provide a context and an array
with arguments if you try to access a function. The option `forceExecute` indicates
if require.Sandbox will try to execute the property even if it is not a function.
This is handy if you want to make sure that a function is provided.

    options = {
        name:   'name of the function or property',
        context: myThisContext,                         // default: { }
        arguments: ['my','function','arguments']        // default: [ ],
        forceExecute: true                              // default: false
    };


This function returns a *thenable* whose `.catch()` handlers are invoked when
the function of the module throws an error. They will receive an error object
like the handlers used with [Sandbox.require()](#sandboxrequire).
The `.then()` handlers will receive on object with a reference to the sandbox (`.sandbox`) and
the returned value or the value of the property (`.result`).

    var p = mySandbox.execute({
        name: 'getRole'
        arguments: [ {user: 'John Doe', id: 'j87631'} ]
        });

    p.then(function(value){
        console.log('Oh look, John Doe is a ' + value.result);
        console.log('The sandbox that helped me:', value.sandbox);
        }).catch( myAwesomeErrorHandler );

### Sandbox.state

The `.state` property contains information about the sandbox' state. The following
values are possible:

- `pending` - The module has not been loaded yet
- `required` - The module has been loaded successfully
- `error` - The module loading was aborted with an error

The default value is `pending`.

### Sandbox.error

The `.error` property contains the last error that occurred. This includes require
errors as well as errors that occur when trying to access a property using `.execute()`.
The default value here is `undefined`.

### Patching error functions
require.Sandbox provides handy functions that allows you to suppress global error
functions preventing exceptions and errors from bubbling up and crashing the application.

#### require.Sandbox.patch.window()
Patches the global `window.onerror()` function to catch all errors that occur.
This is required to prevent module error from bubbling up. You can use the
[Sandbox.test](#test-parameter) parameter to programmatically check if a module
has been loaded successfully.

> **Please note**
> The patched `.onerror()` function suppresses all error messages.
> It is recommended to turn this on only in productive environments.

As of version 1.3.3, the function takes an optional argument `type`.

     require.Sandbox.patch.require(type = 'silent')

Possible values for `type`:

- `silent` (default): all caught errors are suppressed
- `verbose`: all caught errors are printed to the console using `console.error `


#### require.Sandbox.patch.require()
Patches the `.onError()` function provided by require.js to catch all errors
that occur. This is required to prevent module error from bubbling up. You can use the
[Sandbox.test](#test-parameter) parameter to programmatically check if a module
has been loaded successfully.

As of version 1.3.3, the function takes an optional argument `type`.

     require.Sandbox.patch.require(type = 'silent')

Possible values for `type`:

- `silent` (default): all caught errors are suppressed
- `verbose`: all caught errors are printed to the console using `console.error `


#### require.Sandbox.restore.window()
Restores the patched window function. If `window.onerror()` has not been patched
this function won't do anything.

#### require.Sandbox.restore.require()
Restores the patched require.js function. If `require.onError()` has not been patched
this function won't do anything.

### require.Sandbox.noConflict()
As with a lot of other libraries, the `.noConflict()` method restores whatever has
been stored in `require.Sandbox` before and returns the current instance.
