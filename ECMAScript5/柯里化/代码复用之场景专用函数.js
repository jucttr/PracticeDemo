/**
 * 场景二：代码复用 —— 造「场景专用函数」
 *
 * 同一个日志逻辑，在 ERROR / INFO / vite:hmr 等不同场景下只有前缀不同。
 * 把前缀先固定下来，调用处就只关心消息本身，不必每次重复传命名空间。
 *
 * 【库中的对应（构建工具，非框架）】
 * - Vite `createDebugger('vite:hmr')`：真实签名 createDebugger(namespace, options)，
 *   内部调用 debug 包 `debug(namespace)`，返回一个只收 (msg, ...args) 的日志函数 ——
 *   正是「先固定命名空间，后收消息」。debug 包的形态可以在本仓库
 *   前端工程化/npm&pnpm/npm/node_modules/debug/src/debug.js 里看到（createDebug 返回一个函数）。
 * - 本例的简化点：例子2 的 enabledNamespaces 开关是示意；真实 Vite 靠
 *   process.env.DEBUG 控制是否输出（vite --debug 会设置它），另有 onlyWhenFocused
 *   与消息过滤。React / Vue / Redux 等框架与状态库本身没有对应的柯里化日志 API。
 *
 * 运行：node "代码复用之场景专用函数.js"
 */

'use strict';

// ---------- 例子1：通用日志函数 ----------
const log = level => message => console.log(`[${level}] ${message}`);

const logError = log('ERROR');
const logInfo = log('INFO');

logError('Database connection failed'); // [ERROR] Database connection failed
logInfo('Server started'); // [INFO] Server started

// ---------- 例子2：Vite createDebugger（简化可运行版，非源码抄录） ----------
// Vite 源码里的调用形如：const debugHmr = createDebugger('vite:hmr');
// 思路和例子1 完全一样：命名空间先固定，返回只收消息的函数；
// 下面的「是否输出」开关是示意，真实 Vite 用 process.env.DEBUG 判断（见文件头标注）。

const enabledNamespaces = new Set(['vite:hmr']);

const createDebugger = namespace => (...args) => {
    if (enabledNamespaces.has(namespace)) {
        console.log(`[${namespace}]`, ...args);
    }
};

const debugHmr = createDebugger('vite:hmr');
const debugResolve = createDebugger('vite:resolve');

debugHmr('hmr update', '/src/main.js'); // [vite:hmr] hmr update /src/main.js
debugResolve('resolved', 'lodash'); // 命名空间未开启，不输出

// 小结：两例的共同点都是「先收配置，后收数据」。
// 手写箭头嵌套就够了，不必每次都搬出通用 curry 工具。
