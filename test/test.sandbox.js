/**
 * Test for the core sandbox functionality
 * Created by dak0rn on 09.02.2015.
 */
describe('Sandbox', function(){

    it('should be a constructor function', function() {
        expect( require.Sandbox ).to.be.a('function');

        var instance = new require.Sandbox();

        expect( instance).to.be.an('object');
        expect( instance ).to.be.an.instanceOf( require.Sandbox );
    });

    it('should have an .extend() function', function() {
        expect( require.Sandbox ).to.have.ownProperty('extend');
        expect( require.Sandbox ).to.be.a('function');
    });

    it('should have a working .extend() function', function() {
        var MyBox = require.Sandbox.extend({ fancy: true, execute: 1337 });

        var box = new MyBox();

        expect(box).to.be.an('object');
        expect(box.fancy).to.be.true();
        expect(box.execute).not.to.be.a('function');
        expect(box.execute).to.equal(1337);

    });

    it('should have a `noConflict` method', function(){

        expect( require.Sandbox.noConflict ).not.to.be.undefined();

        var old = require.Sandbox.noConflict();

        expect( old ).not.to.be.undefined();
        expect( require.Sandbox ).to.be.undefined();

        // Restore instance
        require.Sandbox = old;
    });


    it('should have a .require() function', function() {
        var instance = new require.Sandbox();
        expect( instance.require ).to.be.a('function');
    });

    it('should have a .test property', function() {
        var instance = new require.Sandbox();
        expect( instance ).to.have.property('test');
    });

    it('should have a default function for the .test property', function() {
        var instance = new require.Sandbox();
        expect( instance.test ).to.be.a('function');
    });

    it('should provide a test function for lazy developers', function() {
        expect( require.Sandbox.test.undefined ).to.be.a('function');
        expect( require.Sandbox.test.undefined(undefined) ).to.be.false();
        expect( require.Sandbox.test.undefined(42) ).to.be.true();
    });

    it('should have a .load property', function() {
        var instance = new require.Sandbox();
        expect( instance ).to.have.property('load');
    });

    it('should have `null` as default value for null', function() {
        var instance = new require.Sandbox();
        expect( instance.null ).not.to.be.null();
    });

    it('should return a thenable object', function(){

        var sandbox = new require.Sandbox({
            load: './script'
        });

        var then = sandbox.require();

        expect( then ).not.to.be.undefined();
    });

    it('should return a thenable object w/ a .then method', function(){

        var sandbox = new require.Sandbox({
            load: './script'
        });

        var then = sandbox.require();

        expect( then.then ).to.be.a('function');
    });

    it('should invoke the "thenned" function after loading successfully', function(done){

        var sandbox = new require.Sandbox({
            load: './script'
        });

        sandbox.require().then( function(box){
            done();
        });

    });

    it('should invoke the "catched" function when loading failed', function(done){

        var sandbox = new require.Sandbox({
            load: './script-404'
        });

        sandbox.require().then( function(box){
            done('failed');
        }).catch(function(reason){
            done();
        });

    });

    it('should invoke the .test function after trying to load the module', function(done){

        var sandbox = new require.Sandbox({
            load: './script',
            test: function() { done(); }
        });

        sandbox.require();

    });

    it('should provide a wrapped sandbox after loading', function(done){

        var sandbox = new require.Sandbox({
            load: './anotherScript'
        });

        sandbox.require().then(function(box){
            expect(box).to.equal(sandbox);
            expect(box.load).to.equal('./anotherScript');
            expect(box.execute).to.be.a('function');

            done();
        });

    });

    it('should have an .execute function that returns a promise', function(done){
        var sandbox = new require.Sandbox({
            load: './anotherScript'
        });

        sandbox.require().then( function(box) {

            var p = box.execute({
                name: 'identity'
            });

            expect(p).to.be.an('object');
            expect(p.then).to.be.a('function');

            done();
        });
    });

    it('should execute the function properly and return a working promise', function(done){
        var sandbox = new require.Sandbox({
            load: './anotherScript'
        });

        sandbox.require().then( function(box) {

            var p = box.execute({
                name: 'identity',
                context: sandbox,
                arguments: [42]

            });

            p.then( function(result){
                expect(result.number).to.equal(42);
                expect(result.ctx).to.equal(sandbox);
                done();
            });

            p.catch( function(){
                done('failed');
            });
        });
    });

    it('should provide access to non-function properties using .execute', function(done){
        var sandbox = new require.Sandbox({
            load: './script'
        });

        sandbox.require().then( function(box) {

            var p = box.execute({
                name: 'script'
            });

            p.then( function(result){
                expect(result.number).to.equal('script.js');
                done();
            });

            p.catch( function(){
                done('failed');
            });
        });
    });

    it('should execute the callback on error', function(done){
        var sandbox = new require.Sandbox({
            load: './anotherScript'
        });

        sandbox.require().then( function(box) {

            var p = box.execute({
                name: 'notfound'
            });

            p.then( function(result){
                done('failed');
            });

            p.catch( function(error){
                expect(error).to.be.an('object');
                expect(error.type).to.be.a('string');
                expect(error.sandbox).to.be.an('object');

                done();
            });

        });
    });

    it('should update its state to "required"', function(done){
        var sandbox = new require.Sandbox({
            load: './anotherScript'
        });

        expect(sandbox.state).to.equal('pending');

        sandbox.require().then( function(box) {
            expect(sandbox.state).to.equal('required');
            done();
        });
    });

    it('should update its state to "error"', function(done){
        var sandbox = new require.Sandbox({
            load: './another-404'
        });

        expect(sandbox.state).to.equal('pending');

        sandbox.require().catch( function(box) {
            expect(sandbox.state).to.equal('error');
            done();
        });
    });

    it('should provide the error object', function(done){
        var sandbox = new require.Sandbox({
            load: './third-404'
        });

        expect(sandbox.error).to.be.an.undefined();

        sandbox.require().catch( function(box) {
            expect(sandbox.state).to.equal('error');
            expect(sandbox.error).to.be.an('object');
            done();
        });
    });

    it('should provide patch functions', function(){
        expect( require.Sandbox.patch).to.be.an('object');
        expect( require.Sandbox.patch.window ).to.be.a('function');
        expect( require.Sandbox.patch.require ).to.be.a('function');
    });

    it('should provide restore functions', function(){
        expect( require.Sandbox.restore).to.be.an('object');
        expect( require.Sandbox.restore.window ).to.be.a('function');
        expect( require.Sandbox.restore.require ).to.be.a('function');
    });

    it('should patch window.onerror correctly', function(){
        var old = window.onerror;

        require.Sandbox.patch.window();

        expect( window.onerror ).not.to.equal(old);

        // Rollback
        window.onerror = old;

    });

    it('should patch require.onError correctly', function(){
        var old = require.onError;

        require.Sandbox.patch.require();

        expect( require.onError ).not.to.equal(old);

        // Rollback
        require.onError = old;

    });

    it('should restore window.onerror correctly', function(){
        var old = window.onerror;

        require.Sandbox.patch.window();
        require.Sandbox.restore.window();

        expect( window.onerror ).to.equal(old);

        // Rollback
        window.onerror = old;

    });

    it('should restore require.onError correctly', function(){
        var old = require.onError;

        require.Sandbox.patch.require();
        require.Sandbox.restore.require();

        expect( require.onError ).to.equal(old);

        // Rollback
        require.onError = old;

    });

    it('should catch in-module errors', function(done){
        var sandbox = new require.Sandbox({
            load: './typo',
            test: require.Sandbox.test.undefined        // Default test function
        });

        // Patch the window
        require.Sandbox.patch.window();

        sandbox.require().catch(function(err){
            require.Sandbox.restore.window();
            done();
        });
    });

    it('should catch in-module thrown errors', function(done){
        var sandbox = new require.Sandbox({
            load: './throw',
            test: require.Sandbox.test.undefined        // Default test function
        });

        // Patch the window
        require.Sandbox.patch.window();

        sandbox.require().catch(function(err){
            require.Sandbox.restore.window();
            done();
        });
    });

    it('should be requirable by require.js', function(done){

        require(['../index'], function(sb){
            expect( sb ).to.equal( require.Sandbox );
            done();
        });

    });

});
