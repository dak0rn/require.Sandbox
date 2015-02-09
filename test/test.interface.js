/**
 * Test for the sandbox interface
 * Created by dak0rn on 09.02.2015.
 */

describe('Sandbox interface', function(){

    it('should be a constructor function', function() {
        expect( require.Sandbox ).to.be.a('function');

        var instance = new require.Sandbox();

        expect( instance).to.be.an('object');
        expect( instance ).to.be.an.instanceOf( require.Sandbox );
    });



});