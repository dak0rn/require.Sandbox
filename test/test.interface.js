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

    it('should have an .extend() function', function() {
        expect( require.Sandbox ).to.have.ownProperty('extend');
        expect( require.Sandbox ).to.be.a('function');
    });

    it('should have a `noConflict` method', function(){

        expect( require.Sandbox.noConflict ).not.to.be.undefined();

        var old = require.Sandbox.noConflict();

        expect( old ).not.to.be.undefined();
        expect( require.Sandbox ).to.be.undefined();

        // Restore instance
        require.Sandbox = old;
    });

    it('should have a .status field', function() {
        expect( require.Sandbox ).to.be.a('function');
        var instance = new require.Sandbox();
        expect( instance.status ).to.be.a('string');
    });

    it('should have a default value "pending" for the .status field', function() {
        expect( require.Sandbox ).to.be.a('function');
        var instance = new require.Sandbox();
        expect( instance.status ).to.equal('pending');
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

    it('should have a .load property', function() {
        var instance = new require.Sandbox();
        expect( instance ).to.have.property('load');
    });

    it('should have `null` as default value for null', function() {
        var instance = new require.Sandbox();
        expect( instance.null ).not.to.be.null();
    });


});
