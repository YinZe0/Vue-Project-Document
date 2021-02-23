import axios from 'axios'

export default {
    /**
     * GET方式的请求, 可以设置请求参数
     */
    requestGet(url, params = {}) {
        return new Promise((resolve, reject) => {
            axios.get(url, params).then(res => {
                resolve(res)
            }).catch(error => {
                reject(error)
            })
        })
    },

    /**
     * GET方式的请求，通过路径不携带参数直接访问
     */
    requestQuickGet(url) {
        return new Promise((resolve, reject) => {
            axios.get(url).then(res => {
                resolve(res)
            }).catch(error => {
                reject(error)
            })
        })
    },

    /**
     * 发送Content-Type为json类型的POST请求，目前已经设置axios默认为Content-Type为json类型的请求
     */
    requestPostJson(url, params = {}, config = {}) {
        return new Promise((resolve, reject) => {
            axios.post(url, params, config).then(res => {
                resolve(res)
            }).catch(error => {
                reject(error)
            })
        })
    },

    /**
     * 发送Content-Type为application/x-www-form-urlencoded类型的POST请求，主要适用于文件上传
     */
    requestPostForm(url, params = {}) {
        return new Promise((resolve, reject) => {
            axios.post(url, params, {
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            }).then(res => {
                // 注意res是axios封装的对象，res.data才是服务端返回的信息
                resolve(res.data)
            }).catch(error => {
                reject(error)
            })
        })
    },

    /**
     * PUT方式的请求
     */
    requestPut(url, params = {}) {
        return new Promise((resolve, reject) => {
            axios.put(url, params).then(res => {
                resolve(res)
            }).catch(error => {
                reject(error)
            })
        })
    },

    /**
     * DELETE方式的请求
     */
    requestDelete(url, params = {}) {
        return new Promise((resolve, reject) => {
            axios.delete(url, params).then(res => {
                resolve(res)
            }).catch(error => {
                reject(error)
            })
        })
    }
}
