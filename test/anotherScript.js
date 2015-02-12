(function(d){

    d([], function(){
        return {
            script: 'script.js',
            identity: function(x) { return {
                number: x,
                ctx: this
            }; }
        };
    });


})( define || function(){} );
