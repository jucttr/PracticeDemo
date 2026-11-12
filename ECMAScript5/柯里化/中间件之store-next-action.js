/**
 * 场景七：中间件链（Redux 风格）
 *
 * store => next => action 是工程里最常见的三层柯里化：
 * 先固定 store，再固定 next，最后才收运行时的 action。
 * 和 HOC 的 message => Component => props 是同一个形状，只是作用在数据流上。
 *
 * 与「函数组合之compose&pipe」的关系：那边是把单参函数串成一条线，
 * 这边是把三层柯里化函数按依赖顺序串成一条链；组合手段可对照
 * NodeJS/compose/redux.js（Redux compose 的源码）。
 *
 * 【状态管理库中的对应】
 * - Redux `applyMiddleware`：官方 middleware 签名是
 *   ({ getState, dispatch }) => next => action，三层嵌套函数；
 *   Redux 官方「Middleware」一文直接把这种写法称为 currying。
 * - 本例的简化点：这里把完整 store 传给了中间件、写成 store => next => action，
 *   这是官方文档里的教学写法；真实 API 只向中间件暴露 { dispatch, getState } 子集，
 *   且 applyMiddleware 自身是 (...middlewares) => createStore => createStore 的 store enhancer。
 * - 别混淆：Koa 中间件是 async (ctx, next) => {}，由 koa-compose 组合，
 *   不是这种三层柯里化（见 NodeJS/compose/koa.js）。
 *
 * 运行：node "中间件之store-next-action.js"
 */

'use strict';

// ---------- 1. 极简 store ----------
function createStore(reducer) {
    let state = reducer(undefined, { type: '@@INIT' });
    return {
        getState: () => state,
        dispatch(action) {
            state = reducer(state, action);
            return action;
        },
    };
}

function reducer(state = { count: 0 }, action) {
    if (action.type === 'ADD') {
        return { count: state.count + action.payload };
    }
    return state;
}

// ---------- 2. 中间件：三层柯里化 ----------
const logger = store => next => action => {
    console.log('[logger] before', action.type, store.getState());
    const result = next(action);
    console.log('[logger] after ', action.type, store.getState());
    return result;
};

// 配置也能再柯里化一层：allow(types) -> store -> next -> action
const allow = types => store => next => action => {
    if (!types.has(action.type)) {
        console.log('[allow] 拦截了', action.type);
        return action; // 不调用 next，链就到此为止
    }
    return next(action);
};

// ---------- 3. 组装：两次「固定参数」，得到只收 action 的 dispatch ----------
function applyMiddleware(store, ...middlewares) {
    const chain = middlewares.map(mw => mw(store)); // 第 1 次：固定 store
    let dispatch = store.dispatch;
    // 从右往左串：越靠前的中间件越靠外，越靠后的越贴近原始 dispatch
    for (let i = chain.length - 1; i >= 0; i--) {
        dispatch = chain[i](dispatch); // 第 2 次：固定 next
    }
    return dispatch; // 剩下的第 3 层：只等 action
}

const store = createStore(reducer);
const dispatch = applyMiddleware(store, allow(new Set(['ADD'])), logger);

dispatch({ type: 'ADD', payload: 2 });
dispatch({ type: 'DELETE', payload: 0 }); // 被 allow 拦下，不会走到 reducer
console.log('最终 state:', store.getState()); // { count: 2 }
