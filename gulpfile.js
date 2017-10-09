const autoprefixer = require('gulp-autoprefixer'),
      babel = require('gulp-babel'),
      cleanCss = require('gulp-clean-css'),
      clean = require('gulp-clean'),
      debug = require('gulp-debug'),
      gulp = require('gulp'),
      gulpIf = require('gulp-if'),
      layout = require('gulp-layout'),
      livereload = require('gulp-livereload'),
      markdown = require('gulp-markdown'),
      path = require('path'),
      pug = require('gulp-pug'),
      rename = require('gulp-rename'),
      through = require('through2'),
      sass = require('gulp-sass'),
      sourceMaps = require('gulp-sourcemaps'),
      uglify = require('gulp-uglify');

const config = require('./config'),
      throughGrayMatter = require('./lib/through-gray-matter');

const createErrorHandler = () => (err) => {
        console.error('Error in compress task', err.toString(), err.stack);
      },
      customPump = (pipes) => pipes.reduce((obj, fn) => obj.pipe(fn).on('error', createErrorHandler()));

const isType = (ext) => (file) => path.extname(file.relative) === ext,
      viewStream = () => ([
        throughGrayMatter(),
        gulpIf(isType('.md'), markdown()),
        gulpIf(isType('.pug'), pug()),
        layout(({ frontMatter: data = {} }) => ({ data, layout: `source/layouts/${data.layout || config.defaultLayout}.pug` }))
      ]);

Error.stackTraceLimit = Infinity;

gulp.task('clean-pages', () => {
  return customPump([
    gulp.src([
      `${config.distDirectory}/*`,
      `!${config.distDirectory}/index.html`,
      `!${config.distDirectory}/{blog,styles,scripts,images}/`
    ]),
    clean()
  ]);
});

gulp.task('clean-posts', () => {
  return customPump([
    gulp.src([
      `${config.distDirectory}/blog`,
      `${config.distDirectory}/index.html`
    ]),
    clean()
  ]);
});

gulp.task('clean-styles', () => {
  return customPump([
    gulp.src(`${config.distDirectory}/styles`),
    clean()
  ]);
});

gulp.task('clean-scripts', () => {
  return customPump([
    gulp.src(`${config.distDirectory}/scripts`),
    clean()
  ]);
});

gulp.task('clean-images', () => {
  return customPump([
    gulp.src(`${config.distDirectory}/images`),
    clean()
  ]);
});

gulp.task('clean', () => {
  return customPump([
    gulp.src(`${config.distDirectory}/*`),
    clean()
  ]);
});

gulp.task('pages', ['clean-pages'], () => {
  return customPump([
    gulp.src('source/pages/**/*'),
    debug({ title: 'pages' }),
    ...viewStream(),
    rename((file) => {
      file.dirname = file.basename;
      file.basename = 'index';
    }),
    gulp.dest(config.distDirectory)
  ]);
});

gulp.task('posts', ['clean-posts'], () => {
  const posts = {};

  return customPump([
    gulp.src('source/posts/**/*'),
    debug({ title: 'posts' }),
    ...viewStream(),
    through((file, _, callback) => {
      if (!file.frontMatter.date) throw new Error('Posts need a date!');
      const [year, month, day] = file.frontMatter.split('-').map((n) => n.length === 4 ? n : `0${n}`.substr(-2));
      [year, month, day].reduce((obj, n) => obj[n] = obj[n] || {}, posts);
      file.date = { year, month, day };
      posts[year][month][day][file.basename.replace('.html', '')] = true;

      callback(null, file);
    }),
    rename((file) => {
      const { year, month, day } = file.date;
      file.dirname = `blog/${year}/${month}/${day}/${file.basename.replace('.html', '')}`;
      file.basename = 'index';
    }),
    gulp.dest(config.distDirectory)
  ]);
});

gulp.task('html', ['pages', 'posts']);

gulp.task('styles', ['clean-styles'], () => {
  return customPump([
    gulp.src([
      'source/assets/styles/**/*.scss',
      '!source/assets/styles/**/_*.scss'
    ]),
    gulpIf(process.env.NODE_ENV === 'development', sourceMaps.init()),
    sass(),
    autoprefixer(),
    cleanCss(),
    gulpIf(process.env.NODE_ENV === 'development', sourceMaps.write()),
    gulp.dest(`${config.distDirectory}/styles`),
    livereload()
  ]);
});

gulp.task('scripts', ['clean-scripts'], () => {
  return customPump([
    gulp.src('source/assets/scripts/**/*.js'),
    gulpIf(process.env.NODE_ENV === 'development', sourceMaps.init()),
    babel(),
    uglify(),
    gulpIf(process.env.NODE_ENV === 'development', sourceMaps.write()),
    gulp.dest(`${config.distDirectory}/scripts`),
    livereload()
  ].filter(Boolean));
});

gulp.task('images', ['clean-images'], () => {
  return customPump([
    gulp.src('source/assets/images/**/*'),
    gulp.dest(`${config.distDirectory}/images`),
    livereload()
  ]);
});

gulp.task('assets', ['styles', 'scripts', 'images']);

gulp.task('compile', ['assets', 'html']);

gulp.task('watch', ['clean', 'compile'], () => {
  livereload.listen();

  gulp.watch('source/assets/styles/**/*.scss', ['styles']);
  gulp.watch('source/assets/scripts/**/*.js', ['scripts']);
  gulp.watch('source/assets/images/**/*', ['images']);
  gulp.watch('source/layouts/**/*', ['html']);
  gulp.watch('source/pages/**/*', ['pages']);
  gulp.watch('source/posts/**/*', ['posts']);
});

gulp.task('default', ['clean', 'compile']);
