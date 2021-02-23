import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const page = (name) => require("@/modules/" + name).default;
const router = new VueRouter({
    routes: [
        {path: "/", redirect: {name: "login"}},
        {path: "/login", name: "login", component: page("login"), meta: {title: "登录页"}},
    ]
});
export default router;
