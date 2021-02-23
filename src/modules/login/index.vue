<template>
  <div class="page-login">
    <div class="page-login--layer page-login--layer-time" flex="main:center cross:center">
    </div>
    <div class="page-login--layer">
      <div class="page-login--content" flex="dir:top main:justify cross:center box:justify">
        <div class="page-login--content-header">
          <p class="page-login--content-header-motto">
            时间是一切财富中最宝贵的财富。 <span>—— 德奥弗拉斯多</span>
          </p>
        </div>
        <div class="page-login--content-main" flex="dir:top main:center cross:center">
          <!-- logo -->
          <img class="page-login--logo" src="" alt="">
          <!-- 表单 -->
          <div class="page-login--form">
            <el-card shadow="never">
              <el-form ref="loginForm" label-position="top" :rules="rules" :model="formLogin"
                       size="default" @submit.native.prevent>
                <el-form-item prop="username">
                  <el-input type="text" v-model="formLogin.username" placeholder="用户名">
                    <i slot="prepend" class="fa fa-user-circle-o"></i>
                  </el-input>
                </el-form-item>
                <el-form-item prop="password">
                  <el-input type="password" v-model="formLogin.password" placeholder="密码">
                    <i slot="prepend" class="fa fa-keyboard-o"></i>
                  </el-input>
                </el-form-item>
                <el-button size="default" native-type="submit" @click="submit"
                           :disabled="submitBtnDisabled" type="primary" class="button-login">登录
                </el-button>
              </el-form>
            </el-card>
          </div>
        </div>
        <div class="page-login--content-footer">
          <p class="page-login--content-footer-copyright">
            Create By 0x202
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import resourceUtil from '@common/utils/resource-util';
  import {mapActions} from "vuex";

  export default {
    name: "login",
    data() {
      return {
        submitBtnDisabled: false,
        // 表单
        formLogin: {
          username: "test",
          password: "qpzm7913",
          // rememberMe: false // 后台没处理rememberMe功能
        },
        // 表单校验
        rules: {
          username: [
            {required: true, message: "请输入用户名", trigger: "blur"},
            {min: 2, max: 10, message: "长度在 2 到 10 个字符", trigger: "blur"}
          ],
          password: [
            {required: true, message: "请输入密码", trigger: "blur"},
            {min: 2, max: 16, message: "长度在 2 到 16 个字符", trigger: "blur"}
          ]
        }
      }
    },
    methods: {
      ...mapActions("user", ["login"]),

      submit() {
        this.submitBtnDisabled = true;
        // 通过配合element ui对表单内容进行验证
        this.$refs.loginForm.validate(valid => {
          if (valid) {
            // 更多业务逻辑在store/modules/account.js中实现
            this.login(this.formLogin).then(res => {
              this.$message.success("登录成功");
              this.initAfterLogin(res);

              // 路由跳转
              this.$router.push({path: "/index"});
            }).catch(() => {
              this.submitBtnDisabled = false;
            });
          } else {
            this.$message.error("表单校验失败");
            this.submitBtnDisabled = false;
          }
        });
      },

      /**
       * 登录之后诸多元素的初始化[动态路由等]<br/>
       * 出于项目逻辑移植性的考虑，没有使用vuex接管,而是直接使用sessionStorage存储
       */
      initAfterLogin(res) {
        // 添加动态路由
        let customRoutes = resourceUtil.GetRoutesFromMenus(res.routers);
        this.$router.addRoutes(customRoutes);
        sessionStorage.setItem("menus", JSON.stringify(res.menus))
        // 缓存按钮权限
        sessionStorage.setItem("buttons", JSON.stringify(res.buttons));
        // 用于刷新页面后恢复动态路由
        sessionStorage.setItem("routers", JSON.stringify(customRoutes));
      }
    }
  }
</script>
