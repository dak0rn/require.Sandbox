/**
 * Build file for require.Sandbox
 */
var gulp = require('gulp');

var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var phantom = require('gulp-mocha-phantomjs');

gulp.task('lint', function(){
    gulp.src('index.js')
        .pipe( jshint() )
        .pipe( jshint.reporter('default') );
});

gulp.task('uglify', function(){
    gulp.src('index.js')
        .pipe( uglify() )
        .pipe( gulp.dest('index.min.js') );
});
