const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin')

// 拼接路径
function resolve(dir) {
    return path.join(__dirname, dir);
}

// 官方文档 https://cli.vuejs.org/zh/config/#vue-config-js
module.exports = {
    // 构建的生产文件的输出路径(相对路径), 默认dist
    outputDir: 'dist',
    // 静态资源目录 (js, css, img, fonts)
    assetsDir: 'assets',
    // eslint检测, 设置为true后将在编译器警告潜在的错误，但不会导致编译失败，默认是'default'
    lintOnSave: false,
    // 激活template的使用
    runtimeCompiler: true,
    // 由于vue打包过后的js是压缩加密的
    // 如果该选项为true，则出错可以知晓错误的具体位置，但会使编译后的项目变大
    // 如果为false，则出错无法得知错误的具体位置，但会使编译后的项目变小
    productionSourceMap: !process.env.VUE_APP_ENV_TEST,
    devServer: {
        port: process.env.VUE_APP_PORT,
        // 如果vue的开发环境和后端API服务器不在同一台主机上，可以通过代理配置将请求转发给后端API服务器
        proxy: {
            '/api': {
                target: process.env.VUE_APP_SEVER_URL,
                // websocket的支持
                ws: true,
                // 开启代理，在本地创建一个虚拟服务端
                changeOrigin: true,
                // 假设在页面上的的请求为 localhost:8080/api/... 则改写为 localhost:8080/...
                pathRewrite: {'^/api': ''}
            }
        }
    },
    // css 相关设置
    css: {
        // 加快项目构建性能
        sourceMap: false,
        loaderOptions: {
            // 向全局sass样式传入共享的全局变量, $src可以配置图片cdn前缀
            // https://cli.vuejs.org/guide/css.html#passing-options-to-pre-processor-loaders
            scss: {
                /*
                // 'sass-loader'支持' prependData '选项使您可以共享所有处理的文件中常见的变量，而无需显式的导入它们：
                // 'sass-loader'支持' additionalData '选项使您可以共享所有处理的文件中常见的变量，而无需显式的导入它们：
                // 如果sass-loader版本<8，则用'data'取代两者
                // 如果sass-loader版本>8，则用'prependData'取代两者
                // 如果sass-loader版本>10，则用'additionalData'取代两者
                // 示例:
                // prependData: '
                //     @import '@scss/variables.scss';
                //     @import '@scss/mixins.scss';
                //     @import '@scss/function.scss';
                //     $src: '${process.env.VUE_APP_BASE_API}';
                // '
                // prependData: ' $ color：红色; '
                // additionalData: '@import '~@/variables.scss';'
                */
            }
        }
    },
    // 只会处理src文件夹下面的东西
    chainWebpack: config => {
        // 修复HMR (Hot Module Replacement)
        config.resolve.symlinks(true);

        config.module.rule("vue")
            .use("vue-loader")
            .loader("vue-loader")
            .tap(options => {
                return options;
            });

        // 使用svg组件
        const svgRule = config.module.rule('svg');
        svgRule.uses.clear(); // 清除已经加载的loader，默认使用了file-loader
        svgRule
            .test(/\.svg$/)
            .use('svg-sprite-loader')
            .loader('svg-sprite-loader')
            .options({
                symbolId: 'icon-[name]'
            });
        svgRule.end();

        if (process.env.NODE_ENV === 'production') {
            // 压缩图片
            const imageRule = config.module.rule('images');
            imageRule
                .test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)
                .use('image-webpack-loader')
                .loader('image-webpack-loader')
                .options({
                    mozjpeg: {progressive: true, quality: 65},
                    optipng: {enabled: false},
                    pngquant: {quality: [0.65, 0.90], speed: 4},
                    gifsicle: {interlaced: false}
                });
            imageRule.end();
        }

        // 默认情况下vue中的图片、模块引用、js引用都是使用的相对路径，如果文件所处层次很深，就很麻烦，可以使用别名方式来减弱复杂度
        config.resolve.alias
            // 例如: alias.set('@assets', resolve('src/assets'))  在任何文件中都能通过@assets直接访问到目标文件夹
            .set('vue$', 'vue/dist/vue.esm.js')
            .set('@', resolve('src'))
            .set('@common', resolve('src/common'))
            .set('@assets', resolve('src/assets'))
            .set('@layouts', resolve('src/layouts'))
            .set('@store', resolve('src/store'))
            .set('@router', resolve('src/router'))
            .set('@api', resolve('src/common/api'));
    }
}
