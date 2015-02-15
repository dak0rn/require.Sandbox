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
    - [require.Sandbox - load](#requiresandbox---load)
    - [require.Sandbox - test](#requiresandbox---test)
    - [Sandbox.require() and handlers](#sandboxrequire-and-handlers)

## Installation

### Bower

*require.Sandbox* will be published on bower soon.

### Git

Clone the repository with `git`:


    git clone https://github.com/SuitSoft/require.Sandbox.git


You then have access to the uncompressed `index.js` and the minified version `dist/index.js`.
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

---

When running the linter, you will get warnings like this:

    Expected an assignment or function call and instead saw an expression.

These are caused by expressions like `options || (options = {})` to set default
values for arguments. I like that style, so please ignore them.

When running the tests, you will see some `No such file or directory` errors. These
are programmatically caused by the tests to test the behaviour with missing files.

---

Both, `build` and `default` will generate an `index.min.js` in the folder `dist`.
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
                    index.min.js
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
        'require.Sandbox': 'require.Sandbox/dist/index.min'
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

### `require.Sandbox`

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

#### `require.Sandbox` - `load`

The `load` parameter given to the constructor is supposed to contain the path
to a module. It is also possible to provide a function that returns the path.

#### `require.Sandbox` - `test`

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

Since checking for `undefined` is a very common task, `require.Sandbox` comes with the
handy helper function `require.Sandbox.test.undefined` for that.

If you do not provide a function, anything will taken as correctly loaded.


### `Sandbox.require()` and handlers

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

---

The be precisely, the returned object is *thenable* since it has a `.then()` function.
**But**, it is not fully [Promises/A+](http://promisesaplus.com) compatible. If you want
to have a real promise, I would recommend to use a library such as [when](https://github.com/cujojs/when), that can assimilate
foreign thenables.

---

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


---
** README is still under development, please stand by **
