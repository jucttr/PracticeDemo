/**
 * 场景四：React 高阶组件（HOC）
 *
 * withLoading(message)(Component) 是典型的分步传参：
 * 先固定「加载时的提示文案」，再传「被包裹的组件」，最后才传运行时的 props。
 *
 * 说明：真实 React 里返回的是 JSX，需要 React + 构建工具才能跑。
 * 这里用「返回普通描述对象」模拟组件，逻辑一致，可以直接 node 跑通。
 *
 * 【框架 / 状态管理库中的对应】
 * - React：HOC 是官方的组件复用模式，形状就是「配置 -> 组件 -> props」。
 * - react-redux `connect(mapState, mapDispatch)(Component)`：最标准的工程实例。
 *   第一次调用 connect(...) 返回一个「可包装任意组件的 HOC」（官方文档称 wrapper function），
 *   第二次调用才产出连接后的组件；所以 connectUser(Login)、connectUser(Profile) 能复用同一份配置。
 * - 辨析：React Router v5 的 withRouter(Component) 是单步 HOC，没有分步传参，不算柯里化。
 *
 * 运行：node "高阶组件（HOC）.js"
 */

'use strict';

// 柯里化 HOC：message -> Component -> props
const withLoading = loadingMessage => WrappedComponent => props => {
    if (props.isLoading) {
        return { type: 'div', children: loadingMessage };
    }
    const rest = { ...props };
    delete rest.isLoading;
    return WrappedComponent(rest);
};

// 被包裹的组件（同样用普通函数模拟）
const UserList = props => ({
    type: 'ul',
    children: props.users.map(user => ({ type: 'li', children: user })),
});

const UserListWithLoading = withLoading('Loading users...')(UserList);

console.log('加载中:', UserListWithLoading({ isLoading: true, users: [] }));
console.log(
    '加载完成:',
    UserListWithLoading({ isLoading: false, users: ['lucy', 'jack'] }),
);

// 同一份 withLoading 换个文案就能复用，不必再写一个 HOC：
const OrderListWithLoading = withLoading('订单加载中...')(UserList);
console.log('复用:', OrderListWithLoading({ isLoading: true, users: [] }));

// 真实 React 中对应的写法（需要 JSX 环境，此处不执行）：
// const withLoading = message => WrappedComponent => function Enhanced({ isLoading, ...props }) {
//     return isLoading ? <div>{message}</div> : <WrappedComponent {...props} />;
// };
// const UserListWithLoading = withLoading('Loading users...')(UserList);
