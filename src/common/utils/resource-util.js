const page = (name) => require("@/modules/" + name).default;

// 将菜单转换成路由  用以处理动态路由
export default {
    /**
     * 动态路由组装<br/>
     * 将用户有权限访问的菜单资源解析成vue能识别的路由
     */
    GetRoutesFromMenus(customRouters) {
        // 首先套用布局
        let route = {path: "", children: []};

        for (let i = 0; i < customRouters.length; i++) {
            let customRouter = customRouters[i];
            if (customRouter.componentUrl == null) {
                continue;
            }
            route.children.push({
                path: customRouter.componentUrl,
                name: customRouter.componentName,
                component: page(customRouter.componentName),
                meta: {
                    title: customRouter.name
                }
            });
        }
        let routes = [];
        routes.push(route);
        // @see https://forum.vuejs.org/t/vue-router-3-0-1-router-addroutes/33181/20
        routes.push({path: '*', name: '404', component: page("404"), hidden: true});
        return routes;
    },

    /**
     * 判断按钮是否有权限显示
     * @param name 权限名称
     */
    hasButtonPermission(name) {
        let buttonsStr = sessionStorage.getItem("buttons");
        return buttonsStr && buttonsStr.indexOf(name) !== -1;
    }
};
