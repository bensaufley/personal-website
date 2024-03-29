import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import cleanCss from 'gulp-clean-css';
import debug from 'gulp-debug';
import { deleteAsync } from 'del';
import glob from 'glob';
import fs from 'fs';
import gulp from 'gulp';
import gulpIf from 'gulp-if';
import yaml from 'js-yaml';
import layout from 'gulp-layout';
import refresh from 'gulp-refresh';
import markdown from 'gulp-markdown';
import path from 'path';
import pug from 'gulp-pug';
import terser from 'gulp-terser';
import rename from 'gulp-rename';
import rsync from 'gulp-rsync';
import gulpSass from 'gulp-sass';
import sass from 'sass';
import sort from 'gulp-sort';
import sourceMaps from 'gulp-sourcemaps';
import type { Transform } from 'stream';
import type { MapStream } from 'event-stream';
import type vinyl from 'vinyl';

import config from './config';
import { excerpt, extractFootnotes, paginate, parseDate, renameSinglePost } from './lib/posts';
import throughGrayMatter from './lib/through-gray-matter';

const { sync: globSync } = glob;

const createErrorHandler = () => (err: Error) => {
  console.error('Error in compress task', err.toString(), err.stack);
};

const customPump = (pipes: (NodeJS.ReadWriteStream | Transform | MapStream)[]) =>
  pipes.reduce((obj, fn) => obj.pipe(fn).on('error', createErrorHandler()));

const cleanSets = {
  pages: [
    `${config.distDirectory}/*`,
    `!${config.distDirectory}/index.html`,
    `!${config.distDirectory}/20[0-9][0-9]/`,
    `!${config.distDirectory}/{blog,styles,scripts,images}/`,
  ],
  posts: [`${config.distDirectory}/20[0-9][0-9]/`, `${config.distDirectory}/index.html`],
  styles: `${config.distDirectory}/styles`,
  scripts: `${config.distDirectory}/scripts`,
  images: `${config.distDirectory}/images`,
};
const isType = (ext: string) => (file: vinyl) => path.extname(file.relative) === ext;
const viewStream = (index = false) => [
  throughGrayMatter(),
  gulpIf(isType('.md'), extractFootnotes(index)),
  gulpIf(isType('.md'), markdown()),
  gulpIf(isType('.pug'), pug()),
];

Error.stackTraceLimit = Infinity;

Object.entries(cleanSets).forEach(([setName, srces]) => {
  gulp.task(`clean-${setName}`, () => deleteAsync(srces));
});

gulp.task('clean', () => deleteAsync(`${config.distDirectory}/*`));

gulp.task(
  'pages',
  gulp.series('clean-pages', () =>
    customPump([
      gulp.src('source/pages/**/*.*'),
      debug({ title: 'pages' }),
      ...viewStream(),
      layout(({ frontMatter: data = { layout: null } }) => ({
        data,
        layout: `source/layouts/${data.layout || config.defaultLayout}.pug`,
      })),
      rename((file) => ({
        ...file,
        dirname: file.basename,
        basename: 'index',
      })),
      gulp.dest(config.distDirectory),
      refresh(),
    ]),
  ),
);

gulp.task(
  'individual-posts',
  gulp.series('clean-posts', () =>
    customPump([
      gulp.src('source/posts/**/*.*'),
      debug({ title: 'posts.show' }),
      ...viewStream(),
      parseDate(),
      layout(({ frontMatter: data = {} }) => ({ data, layout: 'source/layouts/blog-post.pug' })),
      renameSinglePost(),
      gulp.dest(config.distDirectory),
      refresh(),
    ]),
  ),
);

gulp.task(
  'posts',
  gulp.series('clean-posts', 'individual-posts', () => {
    const perPage = 5;
    const pageCount = Math.ceil(globSync('dist/20[0-9][0-9]/[0-9][0-9]/[0-9][0-9]/*').length / perPage);

    return customPump([
      gulp.src('source/posts/**/*.*'),
      debug({ title: 'posts.index' }),
      excerpt(),
      ...viewStream(true),
      parseDate(),
      sort((file1, file2) => {
        if (file1.frontMatter.date < file2.frontMatter.date) return 1;
        if (file1.frontMatter.date > file2.frontMatter.date) return -1;
        return 0;
      }),
      layout((file: vinyl) => {
        const data = file.frontMatter;
        const ext = path.extname(file.path);
        const link = file.path.substr(file.base.length, file.path.length - file.base.length - ext.length);
        return { data: { ...data, link: `${link}/` }, layout: 'source/layouts/blog-listing.pug' };
      }),
      paginate(perPage),
      debug({ title: 'posts.paginated' }),
      layout((file: vinyl) => {
        const currentPage = file.path.split('/')[0] === 'index.html' ? 1 : Number(file.path.split('/')[1]);
        return { data: { title: 'Blog', pageCount, currentPage }, layout: 'source/layouts/blog-index.pug' };
      }),
      gulp.dest(config.distDirectory),
      refresh(),
    ]);
  }),
);

gulp.task('html', gulp.parallel('pages', 'posts'));

gulp.task(
  'styles',
  gulp.series('clean-styles', () =>
    customPump([
      gulp.src(['source/assets/styles/**/*.scss', '!source/assets/styles/**/_*.scss']),
      gulpIf(process.env.NODE_ENV === 'development', sourceMaps.init()),
      gulpSass(sass)(),
      autoprefixer({
        grid: 'autoplace',
        remove: false,
      }),
      cleanCss(),
      gulpIf(process.env.NODE_ENV === 'development', sourceMaps.write()),
      gulp.dest(`${config.distDirectory}/styles`),
      refresh(),
    ]),
  ),
);

gulp.task(
  'scripts',
  gulp.series('clean-scripts', () =>
    customPump([
      gulp.src(['source/assets/scripts/**/*.js', 'source/assets/scripts/**/*.ts']),
      gulpIf(process.env.NODE_ENV === 'development', sourceMaps.init()),
      babel(),
      terser({
        compress: true,
        ie8: false,
        mangle: true,
        sourceMap: process.env.NODE_ENV === 'development',
      }),
      gulpIf(process.env.NODE_ENV === 'development', sourceMaps.write()),
      gulp.dest(`${config.distDirectory}/scripts`),
      refresh(),
    ]),
  ),
);

gulp.task(
  'images',
  gulp.series('clean-images', () =>
    customPump([gulp.src('source/assets/images/**/*'), gulp.dest(`${config.distDirectory}/images`), refresh()]),
  ),
);

gulp.task('assets', gulp.parallel('styles', 'scripts', 'images'));

gulp.task('scraps', () =>
  customPump([
    gulp.src(['source/.htaccess', 'source/favicon.ico', 'source/browserconfig.xml']),
    gulp.dest(config.distDirectory),
    refresh(),
  ]),
);

gulp.task('compile', gulp.series('clean', gulp.parallel('assets', 'html', 'scraps')));

gulp.task(
  'watch',
  gulp.series('compile', () => {
    refresh.listen();

    gulp.watch(['source/assets/styles/*.scss', 'source/assets/styles/**/*.scss'], gulp.task('styles'));
    gulp.watch(['source/assets/scripts/*.js', 'source/assets/scripts/**/*.js'], gulp.task('scripts'));
    gulp.watch(['source/assets/images/*', 'source/assets/images/**/*'], gulp.task('images'));
    gulp.watch(['source/layouts/*', 'source/layouts/**/*'], gulp.task('html'));
    gulp.watch(['source/pages/*', 'source/pages/**/*'], gulp.task('pages'));
    gulp.watch(['source/posts/*', 'source/posts/**/*'], gulp.task('posts'));
  }),
);

gulp.task(
  'deploy',
  gulp.series('compile', () => {
    if (process.env.NODE_ENV !== 'production') throw new Error('Only deploy Production code.');

    const dryrun = !process.argv.includes('--exec');

    // hostname is ssh host; destination is path to directory to sync.
    // Use SSH to authenticate and add to ssh-agent.
    const ftpCreds = yaml.load(fs.readFileSync('./.sftp.yml', 'utf-8'), { schema: yaml.FAILSAFE_SCHEMA }) as {
      username: string;
      hostname: string;
      destination: string;
    };

    if (dryrun) {
      console.log('Dry run. Use --exec to actually deploy.');
    } else {
      console.warn('Deploying to production!');
    }

    return customPump([
      gulp.src(`${config.distDirectory}/**`),
      rsync({
        progress: true,
        incremental: true,
        emptyDirectories: true,
        recursive: true,
        clean: true,
        dryrun,
        root: config.distDirectory,
        exclude: ['.well-known', '.well-known/**'],
        ...ftpCreds,
      }),
    ]);
  }),
);

gulp.task('default', gulp.task('compile')!);
