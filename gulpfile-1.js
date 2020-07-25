
const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del') 
const browserSync = require('browser-sync') 
const loadPlugins = require('gulp-load-plugins') 

const bs = browserSync.create()
const plugins = loadPlugins() 

// 每次build前删除 dist、temp 文件夹
const clean = () => {
  return del(['dist', 'temp'])    
}

// swig 模版用到的数据
const data = {
    menus: [
      {
        name: 'Home',
        icon: 'aperture',
        link: 'index.html'
      },
      {
        name: 'Features',
        link: 'features.html'
      },
      {
        name: 'About',
        link: 'about.html'
      },
      {
        name: 'Contact',
        link: '#',
        children: [
          {
            name: 'Twitter',
            link: 'https://twitter.com/w_zce'
          },
          {
            name: 'About',
            link: 'https://weibo.com/zceme'
          },
          {
            name: 'divider'
          },
          {
            name: 'About',
            link: 'https://github.com/zce'
          }
        ]
      }
    ],
    pkg: require('./package.json'),
    date: new Date()
}

const options = {
    html: {
        name: 'html',
        path: 'src/*.html',
        plugins: plugins.swig( { data, defaults: { cache: false } } ),
        isNeedPipeToTemp: true,
        isReload: true
    },
    sass: {
        name: 'sass',
        path: 'src/assets/styles/*.scss',
        plugins: plugins.sass( {outputStyle: 'expanded'} ),
        isNeedPipeToTemp: true,
        isReload: true
    },
    js: {
        name: 'js', 
        path: 'src/assets/scripts/*.js',
        plugins: plugins.babel( {presets: ['@babel/preset-env']} ),
        isNeedPipeToTemp: true,
        isReload: true
    },
    image: {
        name: 'image',
        path: 'src/assets/images/**',
        plugins: plugins.imagemin(),
        isNeedPipeToTemp: false,
        isReload: false
    },
    font: {
        name: 'font',
        path: 'src/assets/fonts/**',
        plugins: plugins.imagemin(),
        isNeedPipeToTemp: false,
        isReload: false
    },
    public: {
        name: 'public',
        path: 'public/**',
        plugins: plugins.imagemin(),
        isNeedPipeToTemp: false,
        isReload: false
    }
}

const _task = (data) => {
    console.log(data.name, data.path.match(/[^\/]+/)[0], data.isNeedPipeToTemp, data.isReload)

    return src(data.path, { base : data.path.match(/[^\/]+/)[0] })
        .pipe(plugins.if(data.plugins, data.plugins))
        .pipe(plugins.if(data.isNeedPipeToTemp, dest('temp')))
        .pipe(plugins.if(data.isReload, bs.reload({ stream: true })))
        .pipe(plugins.if(!data.isNeedPipeToTemp, dest('dist')))
}
const _this = this;
const serve = function() {
  // ❗️❗️❗️ Error: write after end
  // watch('src/*.html', _task.bind(this, options.html)) 
  // ❗️❗️❗️ Error: map stream is not writable
  // watch('src/assets/styles/*.scss', _task.bind(this, options.sass)) 
  // ❗️❗️❗️ Error: write after end
  // watch('src/assets/scripts/*.js', _task.bind(this, options.js)) 
  // 文件更新后，可以获取到最新的文件
  watch([
      'src/assets/images/**',
      'src/assets/fonts/**',
      'public/**'
  ], bs.reload)

  bs.init({
      notify: false, 
      port: '2080', 
      server: { 
          baseDir: ['temp', 'src', 'public'],  
          routes: { 
              '/node_modules': 'node_modules'
          }
      }
  })
}

const useref = () => {
  return src('temp/*.html', { base : 'temp' })
      .pipe(plugins.useref({ searchPath: ['temp', '.'] })) 
      .pipe(plugins.if(/\.js$/, plugins.uglify()))
      .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
      .pipe(plugins.if(/\.html$/, plugins.htmlmin({ collapseWhitespace: true, minifyCSS: true, minifyJS: true }))) 
      .pipe(dest('dist'))
}

const compile = parallel(
    _task.bind(this, options.html),
    _task.bind(this, options.sass),
    _task.bind(this, options.js)
)

const develop = series(compile, serve)

const build = series(
  clean, 
  parallel(
      series(compile, useref), 
      _task.bind(this, options.image), 
      _task.bind(this, options.font), 
      _task.bind(this, options.public)
  )
) 

module.exports = {
    compile,
    develop,
    build
}