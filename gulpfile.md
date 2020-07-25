[TOC]
# Gulp 自动化构建说明文档

###  1.熟悉项目结构，确认自动化需求
	
	└── pages-boilerplate ································· project root
	   ├─ public ········································· static folder
	   │  └─ favicon.ico ································· static file 
	   ├─ src ············································ source folder
	   │  ├─ assets ······································ assets folder
	   │  │  ├─ fonts ···································· fonts folder
	   │  │  │  └─ pages.ttf ····························· font file (imagemin)
	   │  │  ├─ images ··································· images folder
	   │  │  │  └─ logo.png、brands.svg ······························ image file
	   │  │  ├─ scripts ·································· scripts folder
	   │  │  │  └─ main.js ······························· script file (babel / uglify)
	   │  │  └─ styles ··································· styles folder
	   │  │     ├─ _variables.scss ······················· partial sass file (dont output)
	   │  │     └─ main.scss ····························· entry scss file (scss / postcss)
	   │  ├─ layouts ····································· layouts folder
	   │  │  └─ basic.html ······························· layout file (dont output)
	   │  ├─ partials ···································· partials folder
	   │  │  └─ header.html ······························ partial file (dont output)
	   │  ├─ about.html ·································· page file (use layout & partials)
	   │  └─ index.html ·································· page file (use layout & partials)
	   ├─ .csscomb.json ·································· csscomb config file
	   ├─ .editorconfig ·································· editor config file
	   ├─ .gitignore ····································· git ignore file
	   ├─ .travis.yml ···································· travis ci config file
	   ├─ CHANGELOG.md ··································· repo changelog
	   ├─ LICENSE ········································ repo license
	   ├─ README.md ······································ repo readme
	   ├─ gulpfile.js ···································· gulp tasks file
	   ├─ package.json ··································· package file
	   └─ yarn.lock ······································ yarn lock file
	
- html 文件：使用了swig模版，使用插件 `gulp-swig` 进行编译、`gulp-htmlmin` 进行压缩;
- sass 文件：使用 `gulp-sass` 进行编译，`gulp-clean-css` 进行压缩；
- js 文件：使用 `babel` 进行es6+ 编译、`gulp-uglify` 进行压缩；
- image 文件：使用 `gulp-imagemin` 进行压缩；
- font：可能会有svg文件，也需要使用 `gulp-imagemin`  进行压缩，其余文件直接拷贝到输出目录即可；
- 开发服务器：使用 `browser-sync`，项目的自动编译、自动刷新浏览器页面；

### 2.使用 gulp-load-plugins 自动加载插件
- 插件安装 `yarn add gulp-load-plugins --dev`
- gulpfile.js

	```
	const { src, dest, parallel, series, watch } = require('gulp')
	const loadPlugins = require('gulp-load-plugins')  // 导出的是一个方法
	// plugins 是一个对象，所有的插件都会是plugins的属性，
	// 命名方法：去掉 ‘gulp-’，如果是类似于 `gulp-load-plugins` 两个横线的插件，会去掉 `gulp-`，以驼峰命名法进行命名
	const plugins = loadPlugins() 
	```

### 3.样式编译
- 插件安装 `yarn add gulp-sass --dev`
- gulpfile.js

	```
	const style = () => {
	    return src('src/assets/styles/*.scss', { base: 'src' })  // base 设置基准路径，导出文件时会根据 除基准路径外的路径保存文件，也就是保留之前的目录结构
	        // sass 模块会认为 `_`开头的文件是项目依赖的文件，默认不会对其进行转换
	        // outputStyle: expanded 将导出的css 文件设为全部展开模式；不设置，默认最后一个括号在最后一个属性结尾
	        .pipe(plugins.sass( {outputStyle: 'expanded'} )) 
	        .pipe(dest('temp')) // 放在临时目录，防止在处理html中的构建注释时，文件写不进去
	        .pipe(bs.reload({ stream: true })) // 自动刷新浏览器
	}
	```

### 4.脚本编译
- 插件安装 `yarn add @babel/core @babel/preset-env --dev`
- gulpfile.js

	```
	const script = () => {
	    return src('src/assets/scripts/*.js', {base: 'src'})
	        .pipe(plugins.babel( {presets: ['@babel/preset-env']} ))
	        .pipe(dest('temp'))
	        .pipe(bs.reload({ stream: true }))
	}
	```
	
### 5.页面模版编译
- 插件安装 `yarn add gulp-swig --dev`
- gulpfile.js

	```
	const page = () => {
	    return src('src/*.html', { base: 'src' }) // src/**/*.html  可以匹配src下所有子目录的html文件
	        .pipe(plugins.swig( { data } ))
	        .pipe(dest('temp'))
	        .pipe(bs.reload({ stream: true }))
	}
	```
### 6.图片和文字文件转换、其他文件
- 插件安装 `yarn add gulp-imagemin --dev`
- gulpfile.js

	```
	const image = () => {
	    return src('src/assets/images/**', { base: 'src' })
	        .pipe(plugins.imagemin())
	        .pipe(dest('dist'))
	}
	
	const font = () => {
	    return src('src/assets/fonts/**', { base: 'src' })
	        .pipe(plugins.imagemin())
	        .pipe(dest('dist'))
	}
	const extra = () => {
	    return src('public/**', { base: 'public' })
	        .pipe(dest('dist'))
	}
	```
	
### 7.以上任务导出测试
	```
	module.exports = {
	    style,
	    script,
	    page, 
	    image,
	    font,
	    extra
	}
	```

### 8.开发服务器的基本配置
- 插件安装 `yarn add browser-sync --dev`
- gulpfile.js

	```
	const browserSync = require('browser-sync')
	const serve = () => {
	    watch('src/assets/styles/*.scss', style) 
	    watch('src/assets/scripts/*.js', script) 
	    // 可能会因为swig模版引擎缓存的机制导致页面不会变化，此时需要额外将 swig 选项中的 cache 设置为false
	    watch('src/*.html', page) 
	    // 文件更新后，可以获取到最新的文件
	    watch([
	        'src/assets/images/**',
	        'src/assets/fonts/**',
	        'public/**'
	    ], bs.reload)
	
	    // 初始化web服务器的配置
	    bs.init({
	        notify: false, // 在启动或刷新页面时，关闭提示
	        port: '2080', // 设置端口，默认3000
	        // open: false, // 取消自动打开浏览器
	        // files: 'dist/**', // browser-sync 启动后，监听路径的通配符, 不设置该项时，为每项设置bs.reload即可
	        server: { 
	            // web服务器访问的根目录
	            // baseDir: 'dist',  
	            // 设置为数组，有请求时，默认先从第一个路径去找，找不到继续往后找
	            baseDir: ['temp', 'src', 'public'],  
	            routes: {  // 该配置优先于 baseDir
	                '/node_modules': 'node_modules'
	            }
	        }
	    })
	}
	```		

### 8.文件清除
- 插件安装 `yarn add del --dev`
- gulpfile.js

	```
	const del = require('del') 
	const clean = () => {
	    return del(['dist', 'temp'])    // del 方法返回promise   
	}
	```

### 9.html构建注释的处理及各类型文件的压缩
- 插件安装 `yarn add gulp-useref gulp-htmlmin gulp-uglify gulp-clean-css --dev`
- gulpfile.js

	```
	// - useref 插件：会自动处理html文件中的构建注释
	// - 会有开始的 `build:` 和 结束的 `endbuild`，在中间都是对资源的引入
	// - `build:css|js 文件打包后的路径` 标记引入的是css文件还是js文件，最后再指定路径，会自动将开始和结束标签中引入的文件，打包到指定路径的文件中
    // - 还可以自动的对这些文件进行压缩
    /**
     * // 构建注释
        <!-- build:css assets/styles/vendor.css -->
        <link rel="stylesheet" href="/node_modules/bootstrap/dist/css/bootstrap.css">
        <!-- endbuild -->
        
        <!-- build:css assets/styles/main.css -->
        <link rel="stylesheet" href="assets/styles/main.css">
        <!-- endbuild -->
     */
	// 连续执行两次 useref 命令时，第二次并不能生成对应的js、css文件，因为此时dist/*.html 的构建注释已经清空了
	const useref = () => {
	    return src('temp/*.html', { base : 'temp' })
	        .pipe(plugins.useref({ searchPath: ['temp', '.'] })) // 数组中，用到最多的目录放到前面
	        // html、js、css
	        .pipe(plugins.if(/\.js$/, plugins.uglify()))
	        .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
	        .pipe(plugins.if(/\.html$/, plugins.htmlmin({ collapseWhitespace: true, minifyCSS: true, minifyJS: true }))) // 默认只压缩属性中的空格
	        // .pipe(dest('dist')) // src路径为dist时，边读边写，会导致有部分文件写不进去
	        .pipe(dest('dist'))
	}
	```

### 10.构建命令的优化
	```
	const compile = parallel(style, script, page) // , image, font

	// 上线之前执行的任务
	const build = series(
	    clean, 
	    parallel(
	        series(compile, useref), 
	        image, 
	        font, 
	        extra
	    )
	) 
	
	const develop = series(compile, serve)
	
	// 导出任务
	module.exports = {
	    clean,
	    build,
	    develop
	}
	```



























	
