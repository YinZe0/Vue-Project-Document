import Vue from 'vue';
import App from './App.vue';
import Axios from 'axios';
import router from '@router';
import store from '@store';
import ElementUI from 'element-ui';

import httpUtil from "@common/utils/http-util"; // @common是别名配置，在vue.config.js中有定义
import {api_refreshToken} from "@api";
// 浏览器兼容
import "core-js/stable";
import "regenerator-runtime/runtime";
// element-ui样式元素
import "element-ui/lib/theme-chalk/index.css";

Vue.config.productionTip = false;
// 自定义原型属性，例如$http在其他文件中可以使用 this.$http 来访问 Axios
Vue.prototype.$http = Axios;
Vue.prototype.$httpUtil = httpUtil;

Vue.use(ElementUI)
// --------------------------------- vue 基础设置
const app = new Vue({
    router: router,
    store: store,
    render: h => h(App),
}).$mount('#app')

// --------------------------------- 路由设置

// 路由白名单
let whiteList = ['/login'];
router.beforeEach((to, from, next) => {
    // 出于扩展性考虑，这里没有将token交给vuex管理
    let token = sessionStorage.getItem('token');
    if (token) {
        // 如果已经登录, 仍然访问登录页,则跳转至主页
        if (to.path === '/login') next({path: '/index'});
        else next();
    } else if (whiteList.indexOf(to.path) === -1) {
        // token不存在且访问的地址在白名单之外 重新定位到登录页面
        app.$message.warning('未授权，请登陆授权后继续');
        next({path: '/login'});
    } else {
        next();
    }
});

router.afterEach((to) => {
    // 更改标题
    if (to.path === '/login') {
        window.document.title = "登录页"
    } else {
        window.document.title = process.env.VUE_APP_NAME;
    }
});

// --------------------------------- Axios设置
Axios.defaults.timeout = 10000; // 单位毫秒
Axios.defaults.headers.post['Content-Type'] = 'application/json'; // 定义Axios默认的Content-Type
Axios.defaults.baseURL = process.env.NODE_ENV === "production" ? "" : "/api"; // 对开发环境和生产环境进行区分，如果是开发环境则访问路径会是/api/...,由于配置了proxy，/api/..路径会被转发到后台

/**
 * 对请求的拦截，这里主要用于向http header中添加Authorization来配合完成jwt的逻辑
 */
Axios.interceptors.request.use(config => {
    // 在Axios的请求中添加token的内容
    let token = sessionStorage.getItem('token');
    if (token && config.headers["Authorization"] === undefined) {
        config.headers['Authorization'] = token
    }
    return config
});

/**
 * 对响应的拦截，这里主要用于处理token失效后的重新获取、错误提示的展示功能。
 */
Axios.interceptors.response.use(
    response => {
        return response.data;
    },
    async http => {
        if (http.response.status === 401 // 判断是否是无权访问的响应码
            && http.config && !http.config.__isRetryRequest // 判断是否是重试的请求
            && app.$router.currentRoute.path !== '/login') { // 判断是否是访问的登录页面
            // 登录账户已经失效
            let retryOriginalRequest = addRetryRequestQueue(http);
            await doRefreshRequestToken()
            return retryOriginalRequest;
        } else {
            /* -------------------------- 非401异常 -------------------------- */
            let message = http.response.data ? http.response.data : http.response;
            if (message.type && message.msg && message.type === '参数验证异常') {
                // https://ustbhuangyi.github.io/vue-analysis/v2/data-driven/create-element.html
                let h = app.createElement;
                let tips = [];
                for (let i = 1; i <= message.msg.length; i++) {
                    let m = message.msg[i - 1];
                    tips.push(h('p', null, (i + ". " + m + "。\n ")));
                }
                app.$notify.error({title: "参数验证失败!", message: h('div', null, tips), duration: 0});
            } else {
                app.$notify.error({title: "服务错误", message: message.msg ? message.msg : message});
            }
        }
        return Promise.reject(http);
    }
);

/**
 * 作用是确保多个失败请求只会请求一次刷新Token的方法
 */
let isFetchingAccessToken = false;

/**
 * 存储有因为Token失效而失败的请求
 * @type {*[]}
 */
let subscribers = [];

/**
 * 逻辑:
 * 1.当用access_token过期后，当前进行的请求就会失败，但基于jwt的工作原理，我们选择保留这些失败的请求，定义为subscribers
 * 2.尝试去刷新access_token
 * 3.如果token刷新成功则将subscribers中的所有请求重新进行发送
 * 4.如果刷新失败则清空subscribers
 */
function addRetryRequestQueue(http) {
    const originalRequest = http.config;
    // 将所有在token失效期间的请求全部保留下来 以便在刷新完token后进行重新请求
    return new Promise((resolve) => {
        subscribers.push((access_token) => {
            originalRequest.__isRetryRequest = true;
            originalRequest.baseURL = "";
            originalRequest.headers.Authorization = "Bearer " + access_token;
            resolve(Axios.request(http.config));
        });
    });
}

/**
 * 消费存储的失败请求(重新请求)
 */
function consumeAllRetryRequestQueue(access_token) {
    subscribers.forEach(callback => {
        callback(access_token);
    });
    clearRetryRequestQueue();
}

/**
 * 清空失败请求的存储列表
 */
function clearRetryRequestQueue() {
    subscribers = [];
}

/**
 * 尝试去刷新访问Token, 如果刷新成功则重发之前因为Token失效而访问失败的请求
 * @returns {Promise<Route>}
 */
async function doRefreshRequestToken() {
    if (!isFetchingAccessToken) {
        isFetchingAccessToken = true;

        let doRefreshTokenFailed = (tip) => {
            app.$message.error(tip);
            clearRetryRequestQueue();
            sessionStorage.clear(); // 清空是因为router.beforeEach的逻辑
        }

        try {
            // 尝试通过refreshToken来获取新的访问token
            let {code, token} = await getNewRequestToken();
            /* ------------- 这里开始的代码都需要等待getNewRequestToken()完成后才会进行 ------------- */
            isFetchingAccessToken = false;

            if (code === 1) { // 如果刷新成功则重发请求
                sessionStorage.setItem("token", "Bearer " + token);
                consumeAllRetryRequestQueue(token);
            } else {
                let tip = "账户已经失效, 需要重新登录!";
                if (code === 2) tip = "账号发生变动, 需要重新登录!";
                else if (code === 3) tip = "当前账号已在其他机器登录!";

                doRefreshTokenFailed(tip);
                return app.$router.push({path: "/"});
            }
        } catch (e) {
            doRefreshTokenFailed("账户已经失效, 需要重新登录!");
            return app.$router.push({path: "/"});
        }
    }
}

/**
 * 使用refresh_token去获取新的access_token <br/>
 * 响应值为code和token, 当code为1时，token才有值，<br/>
 *
 * code => 0  token失效 <br/>
 * code => 1  更新token成功 <br/>
 * code => 2  账号发生变动 <br/>
 * code => 3  token在其他机器上本实用，可能存在被盗风险 <br/>
 */
async function getNewRequestToken() {
    let refreshToken = sessionStorage.getItem("refresh_token");
    return await Axios.post(
        api_refreshToken,
        {"refreshRequestToken": refreshToken},
        {headers: {"Authorization": ""}}
    )
}
