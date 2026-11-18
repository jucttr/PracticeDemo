const symbolKey = Symbol('symbolKey');

const obj = {
    a: 1,
    b: '2',
    c: function () {
        console.log('ccc');
    },
    d: new Date(),
    e: /d+/,
    [symbolKey]: 'f',
    g: Symbol('g'),
};

function deepClone(target) {
    if (target === null || typeof target !== 'object') return target;
    const result = Array.isArray(target) ? [] : {};
    for (const key in target) {
        if (Object.prototype.hasOwnProperty.call(target, key)) {
            result[key] = deepClone(target[key]);
        }
    }
    return result;
}

// 缺陷：循环引用会栈溢出；Date、RegExp、Map、Set 会被拷成普通对象；Symbol 键丢失；
const newObj = deepClone(obj);
console.log(newObj);
