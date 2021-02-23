import httpUtil from "@common/utils/http-util";
import {api_authentication, api_logout} from "@api";

export default {
    namespaced: true,
    state: {
        // 用户信息
        user: {username: "10"},
        // 用户的路由
        routers: []
    },
    getters: {
        getUserName: (state) => {
            // js 通过.属性名获取对象中的参数
            return state.user.username;
        },
        getUserRouters(state) {
            return JSON.parse(state.routers);
        }
    },
    actions: {
        // 登录
        login({content, commit}, user) {
            return new Promise((resolve, reject) => {
                // (vue store存储commit 和dispatch)[https://blog.csdn.net/qq_36165747/article/details/81082963]
                httpUtil.requestPostJson(
                    api_authentication,
                    user,
                    {headers: {Authorization: ""}}
                ).then(res => {
                    // 交由vuex管理用户信息
                    commit("setUser", res.user);
                    // 出于项目逻辑移植性的考虑，没有使用vuex接管token，直接使用sessionStorage存储,配合main.js中的代码完成JWT的逻辑
                    sessionStorage.setItem("token", "Bearer " + res.token);
                    sessionStorage.setItem("refresh_token", res.refreshToken);
                    resolve(res);
                }).catch(err => {
                    reject(err);
                });
            });
        },
        // 登出
        logout({commit}) {
            return new Promise((resolve, reject) => {
                httpUtil.requestGet(
                    api_logout,
                    {headers: {Authorization: ""}}
                ).then(res => {
                    commit("setUser", null);
                    sessionStorage.removeItem("token");
                    sessionStorage.removeItem("refresh_token");
                    resolve(res);
                }).catch(err => {
                    reject(err);
                });
            });
        },
    },
    mutations: {
        setUser: (state, user) => {
            state.user = user ? user : {};
        },
    }
}
