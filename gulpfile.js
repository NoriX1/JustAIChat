var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    concat = require('gulp-concat'),
    cssnano = require('gulp-cssnano'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    notify = require('gulp-notify'),
    plumber = require('gulp-plumber'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    wiredep = require('gulp-wiredep'),
    useref = require('gulp-useref'),
    svgSprite = require('gulp-svg-sprites'),
    svgmin = require('gulp-svgmin'),
    cheerio = require('gulp-cheerio'),
    replace = require('gulp-replace'),
    filter = require('gulp-filter'),
    browserSync = require('browser-sync').create();

var paths = {
    styles: {
        src: 'src/css/**/*.scss',
        dest: 'build/css'
    },
    scripts: {
        src: 'src/js/**/*.js',
        dest: 'build/js'
    },
    html: {
        src: 'src/*.html',
        dest: 'build/'
    },
    svg: {
        src: 'src/assets/images/icons/*.svg',
        dest: './build/assets/images/icons/'
    },
    assets: {
        src: './src/assets/**/*.*'
    }
};
gulp.task('clean', () => {
    return gulp.src('build/',{allowEmpty : true}).pipe(clean());
});
gulp.task('html', () => {
    return gulp.src(paths.html.src)
        .pipe(gulp.dest(paths.html.dest));
});
gulp.task('styles', () => {
    return gulp.src('src/css/{main,about}.scss')
        .pipe(plumber({ // plumber - плагин для отловли ошибок.
            errorHandler: notify.onError(function (err) { // nofity - представление ошибок в удобном для вас виде.
                return {
                title: 'Styles',
                message: err.message
                }
            })
        }))
        .pipe(sourcemaps.init()) //История изменения стилей, которая помогает нам при отладке в devTools.
        .pipe(sass()) //Компиляция sass.
        .pipe(autoprefixer({ //Добавление autoprefixer.
            browsers: ['last 2 versions']
        }))
        .pipe(concat('styles.css')) //Соедение всех файлом стилей в один и задание ему названия 'main.css'.
        .pipe(cssnano()) //Минификация стилей
        .pipe(sourcemaps.write())
        .pipe(rename('main.css')) //Переименование
        .pipe(gulp.dest(paths.styles.dest));
});
gulp.task('scripts', () => {
    return gulp.src(paths.scripts.src)
        .pipe(gulp.dest(paths.scripts.dest));
});
gulp.task('plugins', () =>{
    return gulp.src('src/*.html')
        .pipe(wiredep({ //Добавление ссылок на плагины bower.
            directory: 'plugins/bower/'
        }))
        .pipe(gulp.dest('build/'));
});
gulp.task('cssplugins', ()=>{
    return gulp.src('build/css/plugins.css',{allowEmpty : true})
        .pipe(cssnano())
        .pipe(gulp.dest(paths.styles.dest));
});
gulp.task('userefFunction', () => {
    return gulp.src('build/*.html')
        .pipe(useref()) //Выполняет объединение файлов в один по указанным в разметке html комментариев.
        .pipe(gulp.dest('build/'));
});
gulp.task('min', ()=>{
    return gulp.src('build/js/*.js')
        .pipe(uglify()) //Минификация скриптов.
        .pipe(gulp.dest('build/js'));
});
gulp.task('browserSyncFunction', ()=>{
    return browserSync.init({
        server: {
            baseDir: './build/'
        }
    });
});
gulp.task('assets', ()=>{
    const f = filter(['src/assets/**/*.*','!src/assets/images/icons/**/*']);
    return gulp.src(paths.assets.src)
        .pipe(f)
        .pipe(gulp.dest('build/assets'));
});
gulp.task('buildSvg', ()=>{
    return gulp.src(paths.svg.src)
        // minify svg
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        // remove all fill and style declarations in out shapes
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
                $('[class]').removeAttr('class');
            },
            parserOptions: {
                xmlMode: true
            }
        }))
        // cheerio plugin create unnecessary string '>', so replace it.
        .pipe(replace('&gt;', '>'))
        // build svg sprite
        .pipe(svgSprite({
            mode: "symbols",
            preview: false,
            selector: "icon-%f",
            svg: {
                symbols: 'sprite.svg'
            }
        }))
        .pipe(gulp.dest(paths.svg.dest));
});
gulp.task('htmlpipe', gulp.series('html', 'scripts', 'plugins', 'userefFunction', 'min'));
gulp.task('scriptpipe', gulp.series('scripts', 'plugins', 'userefFunction', 'min'));
gulp.task('watch', ()=>{
    gulp.watch(paths.styles.src, gulp.parallel('styles'));
    gulp.watch(paths.scripts.src, gulp.parallel('scriptpipe'));
    gulp.watch(paths.html.src, gulp.parallel('htmlpipe'));
    gulp.watch(paths.assets.src, gulp.parallel('assets'));
    gulp.watch(paths.svg.src, gulp.parallel('buildSvg'));
    gulp.watch('src/**/*.*').on('change', browserSync.reload);
});
gulp.task('default', gulp.series('clean', 'html', 'styles', 'scripts', 'assets', 'buildSvg', 
    'plugins', 'userefFunction', 'min', 'cssplugins', gulp.parallel('watch', 'browserSyncFunction')));
