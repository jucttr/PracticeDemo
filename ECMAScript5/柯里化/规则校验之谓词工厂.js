/**
 * 场景六：可组合的校验规则 / 谓词工厂
 *
 * 和「参数复用之提取对象属性」的区别：
 *   那边 getProp('name') 返回的是一个「值」，这里 gte(18) 返回的是一个「判断函数」；
 *   多条规则可以用 and / or 拼成新规则，同一套规则既能给 filter 用，也能给表单校验用。
 *
 * 【库中的对应（函数式工具库，非框架）】
 * - Ramda `R.propEq('hair', 'brown')`、`R.where({...})`：先固定判断条件，返回用于
 *   R.filter 的谓词函数，和本例 gte(18) / and(...) 是同一思路；Ramda 函数默认自动柯里化。
 * - 辨析：Ant Design Form、React Hook Form 的 rules / validator 是配置对象式 API，
 *   不是柯里化，所以不作为本场景的框架出处。Vue / Pinia 也没有对应 API。
 *
 * 运行：node "规则校验之谓词工厂.js"
 */

'use strict';

// ---------- 1. 谓词工厂：先固定判断条件，返回只收「被判断值」的函数 ----------
const gte = min => value => value >= min;
const lte = max => value => value <= max;
const matches = regex => str => regex.test(str);
const hasKey = key => obj => Object.prototype.hasOwnProperty.call(obj, key);
const required = value => value !== undefined && value !== null && value !== '';

// ---------- 2. 规则组合器：把若干单参判断函数拼成一个新的单参判断函数 ----------
const and = (...rules) => value => rules.every(rule => rule(value));
const or = (...rules) => value => rules.some(rule => rule(value));

const isAdult = and(gte(18), lte(60));
console.log('filter 用法:', [15, 18, 30, 65].filter(isAdult)); // [18, 30]

const isContact = or(matches(/^1\d{10}$/), matches(/^[\w.]+@[\w.]+$/));
console.log('or 组合:', ['13800138000', 'a@b.com', 'abc'].filter(isContact));

const users = [{ name: 'lucy', email: 'lucy@x.com' }, { name: 'jack' }];
console.log('hasKey:', users.filter(hasKey('email')).map(u => u.name)); // ['lucy']

// ---------- 3. 落到表单：把「字段 + 规则 + 提示语」一起先固定 ----------
const field = (key, predicate, message) => form => {
    const ok = predicate(form[key]);
    return { key, ok, message: ok ? '' : message };
};

const validateForm = (...fields) => form => fields.map(check => check(form));

const validateUser = validateForm(
    field('age', isAdult, '年龄需在 18-60 之间'),
    field('name', and(required, matches(/^[a-zA-Z]+$/)), '姓名只能含字母'),
    field('email', and(required, matches(/^[\w.]+@[\w.]+$/)), '邮箱格式不对'),
);

console.log('校验1:', validateUser({ age: 16, name: 'lucy', email: 'a@b.com' }));
console.log('校验2:', validateUser({ age: 20, name: '3lucy', email: '' }));
