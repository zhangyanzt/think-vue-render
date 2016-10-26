'use strict';
/**
 * middleware
 */
// import Vue from 'vue';
global.Vue = require('vue')
import vueServerRenderer from 'vue-server-renderer';
process.env.VUE_ENV = 'server';
import path from 'path';
const renderer = require('vue-server-renderer').createRenderer();


export default class extends think.middleware.base {
    /**
     * 初始化 配置参数
     * @param {HTTP} http http object
     * @return {undefined}
     */

    init(http) {
        super.init(http);
        let defaultOption = {
            extension: '.vue',
            'root_path': 'component',
            'lower_name': true,
            'left_delimiter': '{',
            'right_delimiter': '}',
            'rootElement': '<App></App>',
            'replace': true
        };

        this.option = think.extend(defaultOption, this.config('vue_render'));

        if (this.option.jsx) {
            require('node-jsx').install({
                extension: this.option.extension
            });
        }
    }

    async renderToString(app) {
        var renderPromise = think.promisify(renderer.renderToString, renderer);
        return renderPromise(app);
    }

    async parse(content) {

        let scriptArea = content.match(/<script.*id=['"]ssr["'].*>[\w\W]*<\/script>/gim);
        scriptArea = scriptArea[0].match(/src=[\'\"]?([^\'\"]*)[\'\"]?/i);
        let appPath = think.RESOURCE_PATH+scriptArea[1];
        let app = require(appPath)();

        try {
            let result = await this.renderToString(app);
            return content.replace('<div id="app"></div>', result);
        } catch (e) {
            console.error(e);
            return this.http.fail(500, 'Server Error');;
        }
    }

    stream() {
        // 流式响应保留
    }

    /**
     * run
     * @return {} []
     */
    async run(content) {
        try {
            let result = await this.parse(content);
            return result;
        } catch (e) {
            console.error(e);
            return this.http.fail(500, 'Server Error');
        }

    }
}
