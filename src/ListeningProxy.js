export const EVENT_TYPE_BEFORE_OBJECT_CHANGE = 'beforeChange';
export const EVENT_TYPE_AFTER_OBJECT_CHANGE = 'afterChange';
export const EVENT_TYPE_GET_PROPERTY = 'getProperty';
export const EVENT_TYPE_GET_TREEWALKER = 'getTreewalker'

export const SYMBOL_IS_PROXY = Symbol('isProxy');
export const SYMBOL_PROXY_TARGET = Symbol('proxyTarget');
export const SYMBOL_PROXY_LISTENERS = Symbol('proxyListeners');

const ADD_LISTENER_METHOD_NAME = 'addListener';
const REMOVE_LISTENER_METHOD_NAME = 'removeListener';
const PROXY_PROTECTED_PROPERTIES = new Set([
    ADD_LISTENER_METHOD_NAME,
    REMOVE_LISTENER_METHOD_NAME
]);

export class ListeningProxyFactory {
    static create(obj, initialListeners) {
        if (!obj || typeof obj !== 'object') {
            throw new TypeError("ListeningProxy can only be created on objects or arrays");
        }
        if (obj[SYMBOL_IS_PROXY]) {
            // already a listening proxy
            // set any initial listeners...
            Array.prototype.slice.call(arguments, 1).forEach(initial => {
                if (!initial || typeof initial !== 'object') {
                    throw new TypeError('ListeningProxyFactory.create() - Initial listener arguments must be an object');
                }
                proxyListeners.add(initial.eventType, initial.listener);
            });
            // just return the object as is...
            return obj;
        }
        let proxyListeners = new ProxyListeners(obj);
        let handler = {
            get: function(target, pty, receiver) {
                switch (pty) {
                    case SYMBOL_IS_PROXY:
                        return true;
                    case SYMBOL_PROXY_LISTENERS:
                        return this.proxyListeners;
                    case SYMBOL_PROXY_TARGET:
                        return this.proxyListeners.target;
                    case ADD_LISTENER_METHOD_NAME:
                        return this.addListener;
                    case REMOVE_LISTENER_METHOD_NAME:
                        return this.removeListener;
                }
                let result;
                if (this.overiddenMethodHandlers.has(pty)) {
                    result = this.overiddenMethodHandlers.get(pty);
                } else {
                    result = target[pty];
                    // methods on classes need to be re-bound back onto the class instance...
                    if (typeof result === 'function' && ListeningProxyFactory.isClass(target)) {
                        result = result.bind(target);
                    }
                }
                let event = this.proxyListeners.fireGetProperties(pty, result);
                result = event.result;
                if (event.firesBeforesAndAfters) {
                    let asAction = event.asAction;
                    let wrapResult = result;
                    let thus = this;
                    // wrap the resulting function in another function that fires the befores and afters...
                    result = function() {
                        let args = arguments;
                        let defaultResult;
                        let defaultAction = () => {
                            defaultResult = wrapResult(...args);
                            return defaultResult;
                        };
                        let beforeEvent = thus.proxyListeners.fireBefores(asAction, undefined, undefined, undefined, defaultAction, args);
                        if (!beforeEvent.defaultPrevented) {
                            if (!beforeEvent.defaultPerformed) {
                                defaultAction();
                            }
                            thus.proxyListeners.fireAfters(asAction, undefined, undefined, undefined, args);
                        }
                        return defaultResult;
                    };
                }
                return result;
            },
            set: function(target, pty, value, receiver) {
                if (PROXY_PROTECTED_PROPERTIES.has(pty) || pty === SYMBOL_PROXY_TARGET || pty === SYMBOL_IS_PROXY || pty === SYMBOL_PROXY_LISTENERS) {
                    throw new TypeError('Property \'' + pty + '\' cannot be set on listening proxy');
                }
                let wasValue = target[pty];
                let args = arguments;
                let defaultAction = () => {
                    target[pty] = value;
                };
                let event = this.proxyListeners.fireBefores('set', pty, value, wasValue, defaultAction);
                if (!event.defaultPrevented) {
                    if (!event.defaultPerformed) {
                        defaultAction();
                    }
                    if (wasValue && typeof wasValue === 'object' && wasValue[SYMBOL_IS_PROXY]) {
                        wasValue[SYMBOL_PROXY_LISTENERS].removeParent(this.proxyListeners);
                    }
                    if (value && typeof value === 'object') {
                        let newValueProxy = ListeningProxyFactory.create(value);
                        target[pty] = newValueProxy;
                        newValueProxy[SYMBOL_PROXY_LISTENERS].addParent(this.proxyListeners, pty);
                        ListeningProxyFactory.treeWalk(newValueProxy);
                    }
                    this.proxyListeners.fireAfters('set', pty, value, wasValue);
                }
                return true;
            },
            deleteProperty: function(target, pty) {
                if (PROXY_PROTECTED_PROPERTIES.has(pty) || pty === SYMBOL_PROXY_TARGET || pty === SYMBOL_IS_PROXY || pty === SYMBOL_PROXY_LISTENERS) {
                    throw new TypeError('Property \'' + pty + '\' cannot be deleted on listening proxy');
                }
                let wasValue = target[pty];
                let value;
                let args = arguments;
                let defaultAction = () => {
                    delete target[pty];
                };
                let event = this.proxyListeners.fireBefores('deleteProperty', pty, value, wasValue, defaultAction);
                if (!event.defaultPrevented) {
                    if (!event.defaultPerformed) {
                        defaultAction();
                    }
                    if (wasValue && typeof wasValue === 'object' && wasValue[SYMBOL_IS_PROXY]) {
                        wasValue[SYMBOL_PROXY_LISTENERS].removeParent(this.proxyListeners);
                    }
                    this.proxyListeners.fireAfters('deleteProperty', pty, value, wasValue);
                }
                return true;
            },
            // this handler function is only used by special objects...
            masterFunctionHandler: function(functionName, args) {
                let target = this.proxyListeners.target;
                let value, wasValue;
                let result;
                let defaultAction = () => {
                    result = target[functionName](...args);
                    return result;
                };
                let event = this.proxyListeners.fireBefores(functionName + '()', undefined, value, wasValue, defaultAction, args);
                if (!event.defaultPrevented) {
                    if (!event.defaultPerformed) {
                        defaultAction();
                    }
                    this.proxyListeners.fireAfters(functionName + '()', undefined, value, wasValue, args);
                }
                return result;
            },
            // this handler function is only used if the proxied object is an array...
            masterArrayFunctionHandler: function(arrayFunctionName, args, returnsOriginal) {
                let target = this.proxyListeners.target;
                let wasValue = target.slice();
                let value;
                let result;
                let defaultAction = () => {
                    result = target[arrayFunctionName](...args);
                    return result;
                };
                let event = this.proxyListeners.fireBefores(arrayFunctionName + '()', undefined, value, wasValue, defaultAction, args);
                if (!event.defaultPrevented) {
                    if (!event.defaultPerformed) {
                        defaultAction();
                    } else if (!returnsOriginal) {
                        // default action wasn't performed - we have to return something...
                        result = ARRAY_FUNCTIONS_NO_DEFAULT_ACTION_RETURNS.get(arrayFunctionName)(target);
                    }
                    // rejig parents of new array elements and removed array elements...
                    let currentItems = new Set();
                    target.forEach(item => {
                        if (item && typeof item === 'object') {
                            currentItems.add(item);
                        }
                    });
                    // unparent any array elements no longer in the array...
                    wasValue.forEach(item => {
                        if (item && typeof item === 'object' && item[SYMBOL_IS_PROXY] && !currentItems.has(item)) {
                            // remove this as being parented...
                            item[SYMBOL_PROXY_LISTENERS].removeParent(this.proxyListeners);
                        }
                    });
                    // make sure any items added are proxied and parented...
                    ListeningProxyFactory.treeWalk(this.proxyListeners.proxy);
                    // now fire the afters...
                    value = target.slice();
                    this.proxyListeners.fireAfters(arrayFunctionName + '()', undefined, value, wasValue, args);
                } else if (!returnsOriginal && !event.defaultPerformed) {
                    // default was prevented and the default action wasn't performed - we have to return something!...
                    result = ARRAY_FUNCTIONS_NO_DEFAULT_ACTION_RETURNS.get(arrayFunctionName)(target);
                }
                // return either the proxied array or the result of the action...
                return returnsOriginal ? this.proxyListeners.proxy : result;
            },
            // this handler function is only used if the proxied object is a Date...
            masterDateFunctionHandler: function(dateFunctionName, wasValue, args) {
                let target = this.proxyListeners.target;
                let value = args.length === 1 ? args[0] : undefined;
                let result = 0;
                let defaultAction = () => {
                    result = target[dateFunctionName](...args);
                    return result;
                };
                let event = this.proxyListeners.fireBefores(dateFunctionName + '()', undefined, value, wasValue, defaultAction, args);
                if (!event.defaultPrevented) {
                    if (!event.defaultPerformed) {
                        defaultAction();
                    }
                    this.proxyListeners.fireAfters(dateFunctionName + '()', undefined, value, wasValue, args);
                }
                return result;
            },
            proxyListeners: proxyListeners,
            addListener: proxyListeners.add.bind(proxyListeners),
            removeListener: proxyListeners.remove.bind(proxyListeners),
            overiddenMethodHandlers: new Map()
        };
        let additionalFunctions;
        if (Array.isArray(obj)) {
            additionalFunctions = ARRAY_FUNCTIONS_MAP;
        } else if (obj instanceof Int8Array || obj instanceof Uint8Array || obj instanceof Uint8ClampedArray
            || obj instanceof Int16Array || obj instanceof Uint16Array || obj instanceof Int32Array || obj instanceof Uint32Array
            || obj instanceof Float32Array || obj instanceof Float64Array /* || obj instanceof BigInt64Array || obj instanceof BigUint64Array */) {
            additionalFunctions = TYPED_ARRAY_FUNCTIONS_MAP;
        } else if (obj instanceof Date) {
            additionalFunctions = DATE_FUNCTIONS_MAP;
        } else if (obj instanceof Map) {
            additionalFunctions = MAP_FUNCTIONS_MAP;
        } else if (obj instanceof Set) {
            additionalFunctions = SET_FUNCTIONS_MAP;
        }
        if (additionalFunctions) {
            additionalFunctions.forEach((func, funcName) => {
                handler.overiddenMethodHandlers.set(funcName, func.bind(handler));
            });
        }
        // create the actual proxy...
        let result = new Proxy(obj, handler);
        // now we have the proxy, we can store it for use by the proxyListeners...
        proxyListeners.setProxy(result);
        // set any initial listeners...
        Array.prototype.slice.call(arguments, 1).forEach(initial => {
            if (!initial || typeof initial !== 'object') {
                throw new TypeError('ListeningProxyFactory.create() - Initial listener arguments must be an object');
            }
            proxyListeners.add(initial.eventType, initial.listener);
        });
        // tree walk the object - so that objects within the tree are listened on...
        ListeningProxyFactory.treeWalk(result);
        return result;
    }

    static treeWalk(proxy) {
        if (!proxy || typeof proxy !== 'object' || !proxy[SYMBOL_IS_PROXY]) {
            throw new TypeError('Can only treeWalk on a listening proxy object!');
        }
        let target = proxy[SYMBOL_PROXY_TARGET];
        let parentProxyListener = proxy[SYMBOL_PROXY_LISTENERS];
        // see if there's a tree walker for this object...
        let event = parentProxyListener.fireGetTreewalkers();
        if (event.defaultPrevented) {
            event.treeWalker(proxy);
            return;
        }
        // normal tree walking on object or array...
        if (typeof target === 'object') {
            let child, proxyChild, childListener
            if (Array.isArray(target)) {
                for (let i = 0, imax = target.length; i < imax; i++) {
                    child = target[i];
                    if (typeof child === 'object') {
                        proxyChild = ListeningProxyFactory.create(child);
                        target[i] = proxyChild;
                        childListener = proxyChild[SYMBOL_PROXY_LISTENERS];
                        childListener.addParent(parentProxyListener, i);
                        ListeningProxyFactory.treeWalk(proxyChild);
                    }
                }
            } else {
                for (let pty in target) {
                    if (target.hasOwnProperty(pty)) {
                        child = target[pty];
                        if (typeof child === 'object') {
                            proxyChild = ListeningProxyFactory.create(child);
                            target[pty] = proxyChild;
                            childListener = proxyChild[SYMBOL_PROXY_LISTENERS];
                            childListener.addParent(parentProxyListener, pty);
                            ListeningProxyFactory.treeWalk(proxyChild);
                        }
                    }
                }
            }
        }
    }

    /*
    * Utility method for determining if a given target is a class
    *
    * Kudos to https://stackoverflow.com/users/76840/aikeru
    *      see https://stackoverflow.com/a/43197340/1891743
    */
    static isClass(target) {
        if (!target || typeof target !== 'object') {
            return false;
        }
        const isConstructorClass = target.constructor && target.constructor.toString().substring(0, 5) === 'class';
        if (target.prototype === undefined) {
            return isConstructorClass;
        }
        return isConstructorClass
            || (target.prototype.constructor
                && target.prototype.constructor.toString
                && target.prototype.constructor.toString().substring(0, 5) === 'class');
    }

    constructor() {
        throw new Error('ListeningProxyFactory cannot be instantiated with constructor - use ListeningProxyFactory.create()');
    }
}

class ProxyListeners {
    constructor(target) {
        this.target = target;
        this.proxy = null;
        this.beforeListeners = new Set();
        this.afterListeners = new Set();
        this.getPropertyListeners = new Set();
        this.getTreewalkerListeners = new Set();
        this.listenersByEventType = new Map([
            [EVENT_TYPE_BEFORE_OBJECT_CHANGE, this.beforeListeners],
            [EVENT_TYPE_AFTER_OBJECT_CHANGE, this.afterListeners],
            [EVENT_TYPE_GET_PROPERTY, this.getPropertyListeners],
            [EVENT_TYPE_GET_TREEWALKER, this.getTreewalkerListeners]
        ]);
        this.parentListeners = new Map();
    }

    setProxy(proxy) {
        this.proxy = proxy;
    }

    add(eventType, listener) {
        if (typeof listener !== 'function') {
            throw new TypeError('Listener must be a function');
        }
        if (this.listenersByEventType.has(eventType)) {
            let listeners = this.listenersByEventType.get(eventType);
            if (!listeners.has(listener)) {
                listeners.add(listener);
            }
        } else {
            throw new TypeError('Event type \'' + eventType + '\' unknown');
        }
        return this.proxy;
    }

    remove(eventType, listener) {
        if (this.listenersByEventType.has(eventType)) {
            this.listenersByEventType.get(eventType).delete(listener);
        } else {
            throw new TypeError('Event type \'' + eventType + '\' unknown');
        }
        return this.proxy;
    }

    fireBefores(action, pty, value, wasValue, defaultAction, args) {
        let event = new BeforeChangeEvent(this, action, pty, value, wasValue, defaultAction, args);
        this.fireListeners(event);
        return event;
    }

    fireAfters(action, pty, value, wasValue, args) {
        let event = new AfterChangeEvent(this, action, pty, value, wasValue, args);
        this.fireListeners(event);
        return event;
    }

    fireGetProperties(pty, defaultResult) {
        let event = new GetPropertyEvent(this, pty, defaultResult);
        this.fireListeners(event);
        return event;
    }

    fireGetTreewalkers() {
        let event = new GetTreewalkerEvent(this);
        this.fireListeners(event);
        return event;
    }

    fireListeners(event) {
        let listeners = this.listenersByEventType.get(event.type);
        for (let func of listeners) {
            try {
                func(event);
            } catch(e) {
                console.error(e);
            }
            if (event.propagationStopped) {
                break;
            }
        }
        if (!event.propagationStopped) {
            let originPath = event.path.slice();
            let newPath;
            for (let parent of this.parentListeners) {
                newPath = originPath.slice();
                newPath.unshift(parent[1]);
                event.setPath(newPath);
                parent[0].fireListeners(event);
            }
        }
    }

    addParent(parentProxyListener, pty) {
        this.parentListeners.set(parentProxyListener, pty);
    }

    removeParent(parentProxyListener) {
        this.parentListeners.delete(parentProxyListener);
    }
}

class BaseProxyEvent {
    constructor(proxyListeners, eventType) {
        this._proxyListeners = proxyListeners;
        this._type = eventType;
        this._path = [];
    }

    get type() {
        return this._type;
    }

    get target() {
        return this._proxyListeners.target;
    }

    get proxy() {
        return this._proxyListeners.proxy;
    }

    get path() {
        return this._path;
    }

    setPath(path) {
        this._path = path;
    }
}

class BeforeChangeEvent extends BaseProxyEvent {
    constructor(proxyListeners, action, pty, value, wasValue, defaultAction, args) {
        super(proxyListeners, EVENT_TYPE_BEFORE_OBJECT_CHANGE);
        this._action = action;
        this._pty = pty;
        this._value = value;
        this._wasValue = wasValue;
        this._defaultAction = defaultAction;
        this._args = args ? Array.prototype.slice.call(args) : undefined;
        this._defaultPrevented = false;
        this._propagationStopped = false;
        this._defaultPerformed = false;
    }

    get action() {
        return this._action;
    }

    get property() {
        return this._pty;
    }

    get value() {
        return this._value;
    }

    get wasValue() {
        return this._wasValue;
    }

    get arguments() {
        return this._args;
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return true;
    }

    get propagationStopped() {
        return this._propagationStopped;
    }

    stopPropagation() {
        this._propagationStopped = true;
    }

    get defaultPrevented() {
        return this._defaultPerformed;
    }

    get defaultPerformed() {
        return this._defaultPerformed;
    }

    performDefault() {
        let result;
        if (!this._defaultPerformed && !this._defaultPrevented) {
            this._defaultPerformed = true;
            result = this._defaultAction();
        }
        return result;
    }

    preventDefault() {
        this._defaultPrevented = true;
    }
}

class AfterChangeEvent extends BaseProxyEvent {
    constructor(proxyListeners, action, pty, value, wasValue, args) {
        super(proxyListeners, EVENT_TYPE_AFTER_OBJECT_CHANGE);
        this._action = action;
        this._pty = pty;
        this._value = value;
        this._wasValue = wasValue;
        this._args = args ? Array.prototype.slice.call(args) : undefined;
        this._propagationStopped = false;
    }

    get action() {
        return this._action;
    }

    get property() {
        return this._pty;
    }

    get value() {
        return this._value;
    }

    get wasValue() {
        return this._wasValue;
    }

    get arguments() {
        return this._args;
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return false;
    }

    get propagationStopped() {
        return this._propagationStopped;
    }

    stopPropagation() {
        this._propagationStopped = true;
    }
}

class GetPropertyEvent extends BaseProxyEvent {
    constructor(proxyListeners, pty, defaultResult) {
        super(proxyListeners, EVENT_TYPE_GET_PROPERTY);
        this._pty = pty;
        this._defaultResult = defaultResult;
        this._actualResult = defaultResult;
        this._defaultPrevented = false;
        this._propagationStopped = false;
        this._firesBeforesAndAfters = false;
        this._asAction = null;
    }

    get property() {
        return this._pty;
    }

    get defaultResult() {
        return this._defaultResult;
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return true;
    }

    get propagationStopped() {
        return this._propagationStopped;
    }

    stopPropagation() {
        this._propagationStopped = true;
    }

    preventDefault(replacementResult, firesBeforesAndAfters, asAction) {
        if (!this._defaultPrevented) {
            this._defaultPrevented = true;
            this._propagationStopped = true;
            this._actualResult = replacementResult;
            this._firesBeforesAndAfters = (typeof firesBeforesAndAfters === 'boolean') && firesBeforesAndAfters && (typeof this._actualResult === 'function');
            if (this._firesBeforesAndAfters) {
                this._asAction = '[[' + (asAction ? asAction : this._pty) + ']]';
            }
        }
    }

    get defaultPrevented() {
        return this._defaultPrevented;
    }

    get firesBeforesAndAfters() {
        return this._firesBeforesAndAfters;
    }

    get asAction() {
        return this._asAction;
    }

    get result() {
        return this._actualResult;
    }
}

class GetTreewalkerEvent extends BaseProxyEvent {
    constructor(proxyListeners) {
        super(proxyListeners, EVENT_TYPE_GET_TREEWALKER);
        this._treeWalker = null;
        this._defaultPrevented = false;
        this._propagationStopped = false;
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return true;
    }

    get defaultPrevented() {
        return this._defaultPrevented;
    }

    preventDefault(treeWalker) {
        if (!treeWalker || typeof treeWalker !== 'function') {
            throw new TypeError('Supplied treeWalker on GetTreewalkerEvent.preventDefault() must be a function');
        }
        if (!this._defaultPrevented) {
            this._defaultPrevented = true;
            this._propagationStopped = true;
            this._treeWalker = treeWalker;
        }
    }

    get propagationStopped() {
        return this._propagationStopped;
    }

    stopPropagation() {
        this._propagationStopped = true;
    }

    get treeWalker() {
        return this._treeWalker;
    }
}

const ARRAY_FUNCTIONS_MAP = new Map([
    ['copyWithin',
        function() {
            return this.masterArrayFunctionHandler('copyWithin', arguments, true);
        }
    ],
    ['fill',
        function() {
            return this.masterArrayFunctionHandler('fill', arguments, true);
        }
    ],
    ['pop',
        function() {
            return this.masterArrayFunctionHandler('pop', arguments, false);
        }
    ],
    ['push',
        function() {
            return this.masterArrayFunctionHandler('push', arguments, false);
        }
    ],
    ['reverse',
        function() {
            return this.masterArrayFunctionHandler('reverse', arguments, true);
        }
    ],
    ['shift',
        function() {
            return this.masterArrayFunctionHandler('shift', arguments, false);
        }
    ],
    ['sort',
        function() {
            return this.masterArrayFunctionHandler('sort', arguments, true);
        }
    ],
    ['splice',
        function() {
            return this.masterArrayFunctionHandler('splice', arguments, false);
        }
    ],
    ['unshift',
        function() {
            return this.masterArrayFunctionHandler('unshift', arguments, false);
        }
    ]
]);

const ARRAY_FUNCTIONS_NO_DEFAULT_ACTION_RETURNS = new Map([
    ['pop',
        function(target) {
            return undefined;
        }
    ],
    ['push',
        function(target) {
            return target.length;
        }
    ],
    ['shift',
        function(target) {
            return undefined;
        }
    ],
    ['splice',
        function(target) {
            return [];
        }
    ],
    ['unshift',
        function(target) {
            return target.length;
        }
    ]
]);

const TYPED_ARRAY_FUNCTIONS_MAP = new Map([
    ['copyWithin',
        function() {
            return this.masterArrayFunctionHandler('copyWithin', arguments, true);
        }
    ],
    ['fill',
        function() {
            return this.masterArrayFunctionHandler('fill', arguments, true);
        }
    ],
    ['reverse',
        function() {
            return this.masterArrayFunctionHandler('reverse', arguments, true);
        }
    ],
    ['set',
        function() {
            return this.masterArrayFunctionHandler('set', arguments, true);
        }
    ],
    ['sort',
        function() {
            return this.masterArrayFunctionHandler('sort', arguments, true);
        }
    ],
    ['splice',
        function() {
            return this.masterArrayFunctionHandler('splice', arguments, false);
        }
    ],
    // other typed array methods, even though they don't change the array, need to be intercepted because they don't reflect through proxy...
    ['entries',
        function() {
            return this.proxyListeners.target.entries(...arguments);
        }
    ],
    ['every',
        function() {
            return this.proxyListeners.target.every(...arguments);
        }
    ],
    ['filter',
        function() {
            return this.proxyListeners.target.filter(...arguments);
        }
    ],
    ['find',
        function() {
            return this.proxyListeners.target.find(...arguments);
        }
    ],
    ['findIndex',
        function() {
            return this.proxyListeners.target.findIndex(...arguments);
        }
    ],
    ['forEach',
        function() {
            return this.proxyListeners.target.forEach(...arguments);
        }
    ],
    ['includes',
        function() {
            return this.proxyListeners.target.includes(...arguments);
        }
    ],
    ['indexOf',
        function() {
            return this.proxyListeners.target.indexOf(...arguments);
        }
    ],
    ['join',
        function() {
            return this.proxyListeners.target.join(...arguments);
        }
    ],
    ['keys',
        function() {
            return this.proxyListeners.target.keys(...arguments);
        }
    ],
    ['lastIndexOf',
        function() {
            return this.proxyListeners.target.lastIndexOf(...arguments);
        }
    ],
    ['map',
        function() {
            return this.proxyListeners.target.map(...arguments);
        }
    ],
    ['reduce',
        function() {
            return this.proxyListeners.target.reduce(...arguments);
        }
    ],
    ['reduceRight',
        function() {
            return this.proxyListeners.target.reduceRight(...arguments);
        }
    ],
    ['slice',
        function() {
            return this.proxyListeners.target.slice(...arguments);
        }
    ],
    ['some',
        function() {
            return this.proxyListeners.target.some(...arguments);
        }
    ],
    ['subarray',
        function() {
            return this.proxyListeners.target.subarray(...arguments);
        }
    ],
    ['toLocaleString',
        function() {
            return this.proxyListeners.target.toLocaleString(...arguments);
        }
    ],
    ['toString',
        function() {
            return this.proxyListeners.target.toString(...arguments);
        }
    ],
    ['values',
        function() {
            return this.proxyListeners.target.values(...arguments);
        }
    ]
]);

const DATE_FUNCTIONS_MAP = new Map([
    ['getDate',
        function() {
            return this.proxyListeners.target.getDate(...arguments);
        }
    ],
    ['getDay',
        function() {
            return this.proxyListeners.target.getDay(...arguments);
        }
    ],
    ['getFullYear',
        function() {
            return this.proxyListeners.target.getFullYear(...arguments);
        }
    ],
    ['getHours',
        function() {
            return this.proxyListeners.target.getHours(...arguments);
        }
    ],
    ['getMilliseconds',
        function() {
            return this.proxyListeners.target.getMilliseconds(...arguments);
        }
    ],
    ['getMinutes',
        function() {
            return this.proxyListeners.target.getMinutes(...arguments);
        }
    ],
    ['getMonth',
        function() {
            return this.proxyListeners.target.getMonth(...arguments);
        }
    ],
    ['getSeconds',
        function() {
            return this.proxyListeners.target.getSeconds(...arguments);
        }
    ],
    ['getTime',
        function() {
            return this.proxyListeners.target.getTime(...arguments);
        }
    ],
    ['getTimezoneOffset',
        function() {
            return this.proxyListeners.target.getTimezoneOffset(...arguments);
        }
    ],
    ['getUTCDate',
        function() {
            return this.proxyListeners.target.getUTCDate(...arguments);
        }
    ],
    ['getUTCDay',
        function() {
            return this.proxyListeners.target.getUTCDay(...arguments);
        }
    ],
    ['getUTCFullYear',
        function() {
            return this.proxyListeners.target.getUTCFullYear(...arguments);
        }
    ],
    ['getUTCHours',
        function() {
            return this.proxyListeners.target.getUTCHours(...arguments);
        }
    ],
    ['getUTCMilliseconds',
        function() {
            return this.proxyListeners.target.getUTCMilliseconds(...arguments);
        }
    ],
    ['getUTCMinutes',
        function() {
            return this.proxyListeners.target.getUTCMinutes(...arguments);
        }
    ],
    ['getUTCMonth',
        function() {
            return this.proxyListeners.target.getUTCMonth(...arguments);
        }
    ],
    ['getUTCSeconds',
        function() {
            return this.proxyListeners.target.getUTCSeconds(...arguments);
        }
    ],
    ['getYear',
        function() {
            return this.proxyListeners.target.getYear(...arguments);
        }
    ],
    ['setDate',
        function() {
            return this.masterDateFunctionHandler('setDate', this.proxyListeners.target.getDate(), arguments);
        }
    ],
    ['setFullYear',
        function() {
            return this.masterDateFunctionHandler('setFullYear', this.proxyListeners.target.getFullYear(), arguments);
        }
    ],
    ['setHours',
        function() {
            return this.masterDateFunctionHandler('setHours', this.proxyListeners.target.getHours(), arguments);
        }
    ],
    ['setMilliseconds',
        function() {
            return this.masterDateFunctionHandler('setMilliseconds', this.proxyListeners.target.getMilliseconds(), arguments);
        }
    ],
    ['setMinutes',
        function() {
            return this.masterDateFunctionHandler('setMinutes', this.proxyListeners.target.getMinutes(), arguments);
        }
    ],
    ['setMonth',
        function() {
            return this.masterDateFunctionHandler('setMonth', this.proxyListeners.target.getMonth(), arguments);
        }
    ],
    ['setSeconds',
        function() {
            return this.masterDateFunctionHandler('setSeconds', this.proxyListeners.target.getSeconds(), arguments);
        }
    ],
    ['setTime',
        function() {
            return this.masterDateFunctionHandler('setTime', this.proxyListeners.target.getTime(), arguments);
        }
    ],
    ['setUTCDate',
        function() {
            return this.masterDateFunctionHandler('setUTCDate', this.proxyListeners.target.getUTCDate(), arguments);
        }
    ],
    ['setUTCFullYear',
        function() {
            return this.masterDateFunctionHandler('setUTCFullYear', this.proxyListeners.target.getUTCFullYear(), arguments);
        }
    ],
    ['setUTCHours',
        function() {
            return this.masterDateFunctionHandler('setUTCHours', this.proxyListeners.target.getUTCHours(), arguments);
        }
    ],
    ['setUTCMilliseconds',
        function() {
            return this.masterDateFunctionHandler('setUTCMilliseconds', this.proxyListeners.target.getUTCMilliseconds(), arguments);
        }
    ],
    ['setUTCMinutes',
        function() {
            return this.masterDateFunctionHandler('setUTCMinutes', this.proxyListeners.target.getUTCMinutes(), arguments);
        }
    ],
    ['setUTCMonth',
        function() {
            return this.masterDateFunctionHandler('setUTCMonth', this.proxyListeners.target.getUTCMonth(), arguments);
        }
    ],
    ['setUTCSeconds',
        function() {
            return this.masterDateFunctionHandler('setUTCSeconds', this.proxyListeners.target.getUTCSeconds(), arguments);
        }
    ],
    ['setYear',
        function() {
            return this.masterDateFunctionHandler('setYear', this.proxyListeners.target.getYear(), arguments);
        }
    ],
    ['toDateString',
        function() {
            return this.proxyListeners.target.toDateString(...arguments);
        }
    ],
    ['toGMTString',
        function() {
            return this.proxyListeners.target.toGMTString(...arguments);
        }
    ],
    ['toISOString',
        function() {
            return this.proxyListeners.target.toISOString(...arguments);
        }
    ],
    ['toJSON',
        function() {
            return this.proxyListeners.target.toJSON(...arguments);
        }
    ],
    ['toLocaleDateString',
        function() {
            return this.proxyListeners.target.toLocaleDateString(...arguments);
        }
    ],
    ['toLocaleString',
        function() {
            return this.proxyListeners.target.toLocaleString(...arguments);
        }
    ],
    ['toLocaleTimeString',
        function() {
            return this.proxyListeners.target.toLocaleTimeString(...arguments);
        }
    ],
    ['toSource',
        function() {
            return this.proxyListeners.target.toSource(...arguments);
        }
    ],
    ['toString',
        function() {
            return this.proxyListeners.target.toString(...arguments);
        }
    ],
    ['toTimeString',
        function() {
            return this.proxyListeners.target.toTimeString(...arguments);
        }
    ],
    ['toUTCString',
        function() {
            return this.proxyListeners.target.toUTCString(...arguments);
        }
    ],
    ['valueOf',
        function() {
            return this.proxyListeners.target.valueOf(...arguments);
        }
    ]
]);

const MAP_FUNCTIONS_MAP = new Map([
    ['clear',
        function() {
            return this.masterFunctionHandler('clear', arguments);
        }
    ],
    ['delete',
        function() {
            return this.masterFunctionHandler('delete', arguments);
        }
    ],
    ['set',
        function() {
            return this.masterFunctionHandler('set', arguments);
        }
    ],

    ['entries',
        function() {
            return this.proxyListeners.target.entries(...arguments);
        }
    ],
    ['forEach',
        function() {
            return this.proxyListeners.target.forEach(...arguments);
        }
    ],
    ['get',
        function() {
            return this.proxyListeners.target.get(...arguments);
        }
    ],
    ['has',
        function() {
            return this.proxyListeners.target.has(...arguments);
        }
    ],
    ['keys',
        function() {
            return this.proxyListeners.target.keys(...arguments);
        }
    ],
    ['values',
        function() {
            return this.proxyListeners.target.values(...arguments);
        }
    ]
]);

const SET_FUNCTIONS_MAP = new Map([
    ['add',
        function() {
            return this.masterFunctionHandler('add', arguments);
        }
    ],
    ['clear',
        function() {
            return this.masterFunctionHandler('clear', arguments);
        }
    ],
    ['delete',
        function() {
            return this.masterFunctionHandler('delete', arguments);
        }
    ],

    ['entries',
        function() {
            return this.proxyListeners.target.entries(...arguments);
        }
    ],
    ['forEach',
        function() {
            return this.proxyListeners.target.forEach(...arguments);
        }
    ],
    ['has',
        function() {
            return this.proxyListeners.target.has(...arguments);
        }
    ],
    ['values',
        function() {
            return this.proxyListeners.target.values(...arguments);
        }
    ]
]);
