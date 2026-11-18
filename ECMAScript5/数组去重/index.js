let TITLECOUNT = 0;
const arr = [
    1,
    'true',
    1,
    'true',
    true,
    true,
    15,
    false,
    15,
    false,
    undefined,
    undefined,
    null,
    null,
    NaN,
    NaN,
    'NaN',
    0,
    {},
    'a',
    0,
    'a',
    {},
];

console.log('原数组（重复的数组）=> ');
console.log(arr);

// ==================== 第一类：Set（ES6） ====================
console.log(
    `<!-------------------------------- 第${++TITLECOUNT}个例子，利用ES6 Set去重（ES6中最常用） -------------------------------->`
);
function unique(arr) {
    return Array.from(new Set(arr));
}
/**
 * {} 这种不能够去重，毕竟是不同的引用地址
 */
// console.log(unique(arr)); // [1, "true", true, 15, false, undefined, null, NaN, "NaN", 0, "a", {}, {}]

console.log(
    `<!-------------------------------- 第${++TITLECOUNT}个例子，展开运算符 + Set（简写） -------------------------------->`
);
// console.log([...new Set(arr)]);

console.log(
    `<!-------------------------------- 第${++TITLECOUNT}个例子，手写 Set（SameValueZero） -------------------------------->`
);
function likeSet(arr) {
    const res = [];
    for (const item of arr) {
        // SameValueZero：=== 负责常规值与 ±0 合并，双否定负责 NaN
        if (!res.some(x => x === item || (x !== x && item !== item))) {
            res.push(item);
        }
    }
    return res;
}
/**
 * 手动还原 Set 的相等语义，行为和 Set 一致，只是查找用 some，复杂度 O(n²)
 */
// console.log(likeSet(arr));

// ==================== 第二类：遍历 + 结果集查找 ====================
console.log(
    `<!-------------------------------- 第${++TITLECOUNT}个例子，利用indexOf去重 -------------------------------->`
);
function unique2(arr) {
    if (!Array.isArray(arr)) {
        console.log('type error!');
        return;
    }
    let array = [];
    for (let i = 0; i < arr.length; i++) {
        if (array.indexOf(arr[i]) === -1) {
            array.push(arr[i]);
        }
    }
    return array;
}
/**
 * NaN、{}没有去重
 */
// console.log(unique2(arr));

console.log(
    `<!-------------------------------- 第${++TITLECOUNT}个例子，includes + push返回新数组-------------------------------->`
);
function unique5(arr) {
    if (!Array.isArray(arr)) {
        console.log('type error!');
        return;
    }
    var array = [];
    for (var i = 0; i < arr.length; i++) {
        if (!array.includes(arr[i])) {
            //includes 检测数组是否有某个值
            array.push(arr[i]);
        }
    }
    return array;
}
/**
 * {}没有去重，也正常，毕竟他是引用值
 */
// console.log(unique5(arr));

console.log(`<!-------------------------------- 第${++TITLECOUNT}个例子，reduce -------------------------------->`);
function unique8(arr) {
    return arr.reduce((prev, cur) => {
        if (prev.includes(cur)) {
            return prev;
        } else {
            return [...prev, cur];
        }
    }, []);
}
// console.log(unique8(arr));

// ==================== 第三类：双重循环 + splice ====================
console.log(
    `<!-------------------------------- 第${++TITLECOUNT}个例子，利用for嵌套for，然后splice去重（ES5中最常用） -------------------------------->`
);
function unique3(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j]) {
                // 第一个等同于第二个，splice方法删除第二个
                arr.splice(j, 1);
                j--;
            }
        }
    }
    return arr;
}
// console.log(unique3(arr)); // NaN 和 {} 没有去重

// ==================== 第四类：filter + 首次索引 ====================
console.log(
    `<!-------------------------------- 第${++TITLECOUNT}个例子，filter + indexOf 索引比较  -------------------------------->`
);
function unique7(arr) {
    return arr.filter(function (item, index, arr) {
        //当前元素，在原始数组中的第一个索引==当前索引值，否则返回当前元素
        return arr.indexOf(item, 0) === index;
    });
}
/**
 * indexOf 中判断不了 NaN
 */
// console.log(unique7(arr));

// ==================== 第五类：Map 哈希 ====================
console.log(
    `<!-------------------------------- 第${++TITLECOUNT}个例子，利用 Map 键唯一去重（哈希的正确写法） -------------------------------->`
);
function removeDuplicate(arr) {
    const map = new Map();
    const newArr = [];

    arr.forEach(item => {
        // Map 的键用 SameValueZero 比较，不会强制转成字符串
        if (!map.has(item)) {
            // has() 判断 map 中是否已有该键
            map.set(item, true);
            newArr.push(item);
        }
    });

    return newArr;
}
/**
 * 和 Set 行为一致，复杂度 O(n)；对比下方普通对象做哈希的反面例子
 */
// console.log(removeDuplicate(arr));

// =================================================================================================================================================================

// ==================== 反面例子：对象属性名唯一（哈希）====================
/**
 * 从正序中剔除，仅作反面教材保留。
 * 同样是哈希思路，正确做法见第五类 Map 版：Map 的键不会强制转字符串，也不会把对象都变成 '[object Object]'。
 * 两个实现都有硬伤：
 * unique4 —— 属性名会被转成字符串，1 和 '1' 被合并；所有对象都变成 '[object Object]' 误合并。
 * unique6 —— 用 typeof + item 拼 key 区分了类型，但对象依然全被合并，且 key 可能冲突。
 */
console.log('<!---------------- 反面例子1：对象属性去重 ---------------->');
function unique4(arr) {
    if (!Array.isArray(arr)) {
        console.log('type error!');
        return;
    }
    var arrry = [];
    var obj = {};
    for (var i = 0; i < arr.length; i++) {
        if (!obj[arr[i]]) {
            arrry.push(arr[i]);
            obj[arr[i]] = 1;
        } else {
            obj[arr[i]]++;
        }
    }
    console.log(obj);
    return arrry;
}
// console.log(unique4(arr)); // [1, "true", 15, false, undefined, null, NaN, 0, "a", {…}]

console.log('<!---------------- 反面例子2：哈希 + filter ---------------->');
function unique6(arr) {
    var obj = {};
    return arr.filter(function (item, index, arr) {
        const key = typeof item + item;
        if (obj[key]) {
            return false;
        } else {
            obj[key] = true;
            return true;
        }
    });
}
// console.log(unique6(arr));
