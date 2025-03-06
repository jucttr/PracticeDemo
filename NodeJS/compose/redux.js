/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for the
 * resulting composite function.
 *
 * 从右到左组合单参数函数。最右边的函数可以接受多个参数，因为它为生成的复合函数提供签名。
 *
 * @param funcs The functions to compose.
 * @returns A function obtained by composing the argument functions from right
 *   to left. For example, `compose(f, g, h)` is identical to doing
 *   `(...args) => f(g(h(...args)))`.
 */
function compose(...funcs) {
    if (funcs.length === 0) {
        return arg => arg;
    }

    if (funcs.length === 1) {
        return funcs[0];
    }

    return funcs.reduce((prev, current) => {
        return (...args) => prev(current(...args));
    });
}

const middleware = [
    args => {
        console.log('fn a => ', args);
        args.a = 3;
        return args;
    },
    args => {
        console.log('fn b => ', args);
        args.b = 2;
        return args;
    },
    args => {
        console.log('fn c => ', args);
        args.c = 1;
        return args;
    },
];
console.log(
    compose(...middleware)({
        name: 'context',
    })
);
