/**
 * Test for the core sandbox functionality
 * Created by dak0rn on 09.02.2015.
 */
describe('Sandbox functionality', function(){

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

    it('should execute the function properly', function(){
        
    });

});
