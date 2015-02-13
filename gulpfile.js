/**
 * Build file for require.Sandbox
 */
var gulp = require('gulp');

var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var phantom = require('gulp-mocha-phantomjs');

gulp.task('lint', function(){
    return gulp.src('index.js')
            .pipe( jshint() )
            .pipe( jshint.reporter('default') );
});

gulp.task('uglify', function(){
    return gulp.src('index.js')
            .pipe( uglify() )
            .pipe( gulp.dest('dist') );
});

gulp.task('test:default', function(){
    return gulp.src('test/index.html')
            .pipe( phantom() );
});

gulp.task('test:build', function(){
    return gulp.src('test/index-build.html')
            .pipe( phantom() );
});

gulp.task('default',['lint','uglify','test:build']);
gulp.task('build',['test:default','default']);
