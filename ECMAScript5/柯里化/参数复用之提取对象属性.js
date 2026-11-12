/**
 * 场景一：参数复用 —— 从对象数组里取指定字段
 *
 * 普通写法里，'name' 写死在回调中；想换成 age、id，就得再写一遍几乎一样的函数。
 * 柯里化的做法：把「取哪个字段」先固定下来，得到一个可以复用的专用函数。
 *
 * 【库中的对应（函数式工具库，非框架）】
 * - Ramda `R.prop('name')`：Ramda 所有函数默认自动柯里化，且约定「数据放最后一个参数」，
 *   所以 R.prop('name') 返回的就是本例的 getName，可直接交给 map / filter。
 *   `R.pluck('name', list)` 则是一步到位的批量版本。
 * - lodash `_.property('name')` 是同一形态。Redux 生态里常用它们写 selector，
 *   但 React / Redux / Vue / Pinia 自身并没有这个 API。
 *
 * 运行：node "参数复用之提取对象属性.js"
 */

'use strict';

const list = [
    { name: 'lucy', age: 18 },
    { name: 'jack', age: 20 },
];

// ---------- 普通写法 ----------
const names = list.map(item => item.name);
console.log('普通写法:', names); // ['lucy', 'jack']

// ---------- 手写柯里化（工程里最常见的形态，不需要通用 curry 工具） ----------
const prop = key => obj => obj[key];
const getName = prop('name');

const names1 = list.map(getName);
console.log('手写柯里化:', names1); // ['lucy', 'jack']

// ---------- 用通用 curry 把普通函数改造成可分步传参 ----------
function curry(fn, ...presetArgs) {
    return function curried(...args) {
        const allArgs = presetArgs.concat(args);
        return allArgs.length >= fn.length
            ? fn.apply(this, allArgs)
            : curry(fn, ...allArgs);
    };
}

const getProp = curry(function (key, obj) {
    return obj[key];
});

const names2 = list.map(getProp('name'));
const ages = list.map(getProp('age'));
console.log('通用 curry:', names2, ages); // ['lucy', 'jack'] [18, 20]

// 坑：map 的回调会收到 (item, index, array) 三个参数，
// 所以 getProp('name') 实际上一次性收到了 4 个参数，多余的被 fn 忽略，结果不受影响。
// 如果换成参数顺序敏感的函数，就要写 list.map(item => getProp('name')(item))。
