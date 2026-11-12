function customCall(context) {
    if (typeof this !== 'function') {
        return new TypeError('not a function');
    }

    context = context || window;

    var args = [...arguments].slice(1);

    context.fn = this;

    const result = context.fn(...args);

    return result;
}

function customApply(context) {
    if (typeof this !== 'function') {
        return new TypeError('not a function');
    }

    context = context || window;

    const args = arguments[1];

    context.fn = this;

    const result = context.fn(...args);

    return result;
}

function customBind(context) {
    if (typeof this !== 'function') {
        return new TypeError('not a function');
    }

    const self = this;

    const args = Array.prototype.slice.call(arguments, 1);

    return function () {
        const bindArgs = Array.prototype.slice.call(arguments);

        return self.apply(context, args.concat(bindArgs));
    };
}
