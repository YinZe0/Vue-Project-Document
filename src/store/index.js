import Vue from "vue"
import Vuex from "vuex";
import createPersistedState from 'vuex-persistedstate';

Vue.use(Vuex);

// 将所有的store都获取到然后配置到Vuex.Store中
let modules = {};
let files = require.context("./modules", false, /\.js$/); // 获取store/modules下面的东西

files.keys().forEach(key => {
    modules[key.replace(/(\.\/|\.js)/g, "")] = files(key).default;
});

let debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
    // 要注册的具体store，这里全所有modules文件夹下的store全部注册了
    modules: modules,
    // 这里使用vuex-persistedstate插件，来防止页面刷新导致vuex存储的数据全部重置，该插件会将数据以指定的格式序列化，之所以选择sessionStorage是因为该项目配置为单页面项目。
    plugins: [createPersistedState({storage: window.sessionStorage})],
    // 启用严格模式，要求必须通过mutation函数修改store的状态
    strict: debug
});
