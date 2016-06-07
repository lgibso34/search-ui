const gulp = require('gulp');
const glob = require('glob');
const _ = require('underscore');
const pngSprite = require('png-sprite');
const fs = require('fs');
const path = require('path');

gulp.task('sprites', ['regularSprites', 'retinaSprites', 'validateRetinaSprites']);
gulp.task('spritesLegacy', ['regularSpritesLegacy', 'retinaSpritesLegacy']);

gulp.task('regularSprites', function (done) {
  return gulp.src('image/sprites/**/*.png')
      .pipe(pngSprite.gulp({
        cssPath: 'sass/spritesNew.scss',
        pngPath: 'image/spritesNew.png',
        namespace: 'coveo-sprites'
      }))
      .pipe(gulp.dest('./bin'))
});

gulp.task('regularSpritesLegacy', function (done) {
  return gulp.src('./breakingchanges/redesign/image/sprites/**/*.png')
      .pipe(pngSprite.gulp({
        cssPath: 'sasslegacy/sprites.scss',
        pngPath: 'image/sprites.png',
        namespace: 'coveo-sprites'
      }))
      .pipe(gulp.dest('./bin'))
});

gulp.task('retinaSprites', function (done) {
  return gulp.src('image/retina/**/*.png')
      .pipe(pngSprite.gulp({
        cssPath: 'sass/retinaNew.scss',
        pngPath: 'image/retinaNew.png',
        namespace: 'coveo-sprites',
        ratio: 2
      }))
      .pipe(gulp.dest('./bin'))
});

gulp.task('retinaSpritesLegacy', function (done) {
  return gulp.src('./breakingchanges/redesign/image/retina/**/*.png')
      .pipe(pngSprite.gulp({
        cssPath: 'sasslegacy/retina.scss',
        pngPath: 'image/retina.png',
        namespace: 'coveo-sprites',
        ratio: 2
      }))
      .pipe(gulp.dest('./bin'))
});

gulp.task('validateRetinaSprites', function (done) {
  glob("image/retina/**", function (err, files) {
    _.each(files, function (file) {
      if (fs.statSync(file).isFile() && !fs.existsSync(file.replace('/retina/', '/sprites/'))) {
        console.warn('\nWARNING: Retina sprite ' + file + ' has no corresponding image in sprites!\n');
      }
    });
    done();
  });
});
