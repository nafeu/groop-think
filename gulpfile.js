var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var sass = require('gulp-sass');

gulp.task('default', ['sass', 'browser-sync'], function () {
});

gulp.task('sass', function(){
  return gulp.src("public/scss/**/*.scss")
    .pipe(sass())
    .pipe(gulp.dest('public/css'));
});

gulp.task('browser-sync', ['nodemon'], function() {
  browserSync.init(null, {
    proxy: "http://localhost:8000",
      files: ["public/**/*.*", "!public/scss/**/*.scss", "!server.js", "!components/*.js"],
      browser: "google chrome",
      port: 7000,
  });
  gulp.watch("public/scss/**/*.scss", ['sass']);
});

gulp.task('nodemon', function (cb) {

  var started = false;

  return nodemon({
    script: 'server.js',
    ext: 'js css scss',
    ignore: ['public/scss/**/*.scss', 'public/css/styles.css'],
    env: { 'DEBUG' : 'true' }
  }).on('start', function () {
    // to avoid nodemon being started multiple times
    // thanks @matthisk
    if (!started) {
      cb();
      started = true;
    }
  });
});