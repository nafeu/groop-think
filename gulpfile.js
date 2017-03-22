var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var gulpFilter = require('gulp-filter'); // 4.0.0+
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var mainBowerFiles = require('main-bower-files');

// TODO: Consider including any added fonts through bower
// var flatten = require('gulp-flatten');

// Define paths variables
var dest = 'public';

gulp.task('bower', function() {
        var jsFilter = gulpFilter('**/*.js');
        // var fontFilter = gulpFilter(['**/*.eot', '**/*.woff', '**/*.svg', '**/*.ttf']);

        return gulp.src(mainBowerFiles())
          .pipe(jsFilter)
          .pipe(uglify())
          .pipe(rename({
              suffix: ".min"
          }))
          .pipe(gulp.dest(dest + '/lib/'));

          // // grab vendor font files from bower_components and push in /public
          // .pipe(fontFilter)
          // .pipe(flatten())
          // .pipe(gulp.dest(dest + '/fonts'));
});

gulp.task('default', ['bower', 'sass', 'browser-sync'], function () {
});

gulp.task('sass', function(){
  return gulp.src("public/scss/**/*.scss")
    .pipe(sass())
    .pipe(gulp.dest('public/css'));
});

gulp.task('browser-sync', ['nodemon'], function() {
  browserSync.init(null, {
    proxy: "http://localhost:8000",
      files: ["public/**/*.*", "!public/scss/**/*.scss", "!server.js", "!public/js/**/*.js"],
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
    ignore: ['public/scss/**/*.scss', 'public/css/styles.css', 'public/lib/**/*'],
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