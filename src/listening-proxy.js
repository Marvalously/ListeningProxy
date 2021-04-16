export const EVENT_TYPE_BEFORE_CHANGE = 'beforeChange';
export const EVENT_TYPE_AFTER_CHANGE = 'afterChange';
export const EVENT_TYPE_GET_PROPERTY = 'getProperty';
export const EVENT_TYPE_GET_TREEWALKER = 'getTreewalker';
export const EVENT_TYPE_EXCEPTION_HANDLER = 'exceptionHandler';

export const SYMBOL_IS_PROXY = Symbol('isProxy');
export const SYMBOL_PROXY_TARGET = Symbol('proxyTarget');
export const SYMBOL_PROXY_LISTENERS = Symbol('proxyListeners');

const ADD_LISTENER_METHOD_NAME = 'addListener';
const REMOVE_LISTENER_METHOD_NAME = 'removeListener';
const PROXY_PROTECTED_PROPERTIES = new Set([
    ADD_LISTENER_METHOD_NAME,
    REMOVE_LISTENER_METHOD_NAME
]);

export const CreateListeningProxy = function(obj, ...initialListeners) {
    return ListeningProxyFactory.create(obj, ...initialListeners);
};

export class ListeningProxyFactory {
    static create(obj, ...initialListeners) {
        if (!obj || typeof obj !== 'object') {
            throw new TypeError("ListeningProxy can only be created on objects or arrays");
        }
        if (obj[SYMBOL_IS_PROXY]) {
            // already a listening proxy
            // set any initial listeners...
            let existingListeners = obj[SYMBOL_PROXY_LISTENERS];
            initialListeners.forEach(initial => {
                if (!initial || typeof initial !== 'object') {
                    throw new TypeError('ListeningProxyFactory.create() - Initial listener arguments must be an object');
                }
                existingListeners.add(initial.eventType, initial.listener);
            });
            // just return the object as is...
            return obj;
        }
        const proxyListeners = new ProxyListeners(obj);
        const handler = {
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
                let actualPty = pty;
                if (this.overriddenMethodHandlers.has(pty)) {
                    result = this.overriddenMethodHandlers.get(pty);
                } else {
                    if (this.isArray && typeof pty === 'string') {
                        // attempt to fix up addressed property as array index...
                        if (/^[-+]?(\d+)$/.test(pty)) {
                            let index = Number(pty);
                            if (index >= 0) {
                                actualPty = index;
                            }
                        }
                    }
                    result = target[actualPty];
                    if (typeof result === 'function' && ((actualPty === Symbol.iterator && this.overrideIterator) || isClass(target))) {
                        // methods on classes need to be re-bound back onto the instance...
                        // (and some iterators also need to be re-bound back onto the original target)
                        result = result.bind(target);
                    }
                }
                let event = this.proxyListeners.fireGetProperties(actualPty, result);
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
                if (PROXY_PROTECTED_PROPERTIES.has(pty)) {
                    throw new TypeError('Property \'' + pty + '\' cannot be set on listening proxy');
                } else if (pty === SYMBOL_PROXY_TARGET || pty === SYMBOL_IS_PROXY || pty === SYMBOL_PROXY_LISTENERS) {
                    throw new TypeError('Protected symbols cannot be set on listening proxy');
                }
                let actualPty = pty;
                if (this.isArray && typeof pty === 'string') {
                    // attempt to fix up addressed property as array index...
                    if (/^[-+]?(\d+)$/.test(pty)) {
                        let index = Number(pty);
                        if (index >= 0) {
                            actualPty = index;
                        }
                    }
                }
                let wasValue = target[actualPty];
                let defaultAction = () => {
                    if (value && typeof value === 'object') {
                        let newValueProxy = ListeningProxyFactory.create(value);
                        newValueProxy[SYMBOL_PROXY_LISTENERS].addParent(this.proxyListeners, actualPty);
                        target[actualPty] = newValueProxy;
                        if (newValueProxy !== value) {
                            ListeningProxyFactory.treeWalk(newValueProxy);
                        }
                    } else {
                        target[actualPty] = value;
                    }
                };
                let event = this.proxyListeners.fireBefores('set', actualPty, value, wasValue, defaultAction);
                if (!event.defaultPrevented) {
                    if (!event.defaultPerformed) {
                        defaultAction();
                    }
                    if (wasValue && typeof wasValue === 'object' && wasValue[SYMBOL_IS_PROXY] && wasValue !== target[actualPty]) {
                        wasValue[SYMBOL_PROXY_LISTENERS].removeParent(this.proxyListeners, actualPty);
                    }
                    this.proxyListeners.fireAfters('set', actualPty, value, wasValue);
                }
                return true;
            },
            deleteProperty: function(target, pty) {
                if (PROXY_PROTECTED_PROPERTIES.has(pty)) {
                    throw new TypeError('Property \'' + pty + '\' cannot be deleted on listening proxy');
                } else if (pty === SYMBOL_PROXY_TARGET || pty === SYMBOL_IS_PROXY || pty === SYMBOL_PROXY_LISTENERS) {
                    throw new TypeError('Protected symbols cannot be deleted on listening proxy');
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
                        wasValue[SYMBOL_PROXY_LISTENERS].removeParent(this.proxyListeners, pty);
                    }
                    this.proxyListeners.fireAfters('deleteProperty', pty, value, wasValue);
                }
                return true;
            },
            proxyListeners: proxyListeners,
            addListener: proxyListeners.add.bind(proxyListeners),
            removeListener: proxyListeners.remove.bind(proxyListeners),
            overriddenMethodHandlers: new Map(),
            isArray: false,
            overrideIterator: false
        };
        let additionalFunctions;
        if (Array.isArray(obj)) {
            handler.isArray = true;
            handler.masterFunctionHandler = HANDLER_MASTER_ARRAY_FUNCTION.bind(handler);
            additionalFunctions = ARRAY_FUNCTIONS;
        } else if (isTypedArray(obj)) {
            handler.isArray = true;
            handler.masterFunctionHandler = HANDLER_MASTER_TYPED_ARRAY_FUNCTION.bind(handler);
            handler.overrideIterator = true;
            additionalFunctions = TYPED_ARRAY_FUNCTIONS;
        } else if (obj instanceof Date) {
            handler.masterFunctionHandler = HANDLER_MASTER_DATE_FUNCTION.bind(handler);
            additionalFunctions = DATE_FUNCTIONS;
        } else if (obj instanceof Map) {
            handler.masterFunctionHandler = HANDLER_MASTER_FUNCTION.bind(handler);
            handler.overrideIterator = true;
            additionalFunctions = MAP_FUNCTIONS;
        } else if (obj instanceof Set) {
            handler.masterFunctionHandler = HANDLER_MASTER_FUNCTION.bind(handler);
            handler.overrideIterator = true;
            additionalFunctions = SET_FUNCTIONS;
        }
        if (additionalFunctions) {
            additionalFunctions.forEach((func, funcName) => {
                handler.overriddenMethodHandlers.set(funcName, func.bind(handler));
            });
        }
        // create the actual proxy...
        let result = new Proxy(obj, handler);
        // now we have the proxy, we can store it for use by the proxyListeners...
        proxyListeners.setProxy(result);
        // set any initial listeners...
        initialListeners.forEach(initial => {
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
            let child, proxyChild
            if (Array.isArray(target)) {
                for (let i = 0, imax = target.length; i < imax; i++) {
                    child = target[i];
                    if (typeof child === 'object' && child !== null) {
                        proxyChild = ListeningProxyFactory.create(child);
                        proxyChild[SYMBOL_PROXY_LISTENERS].addParent(parentProxyListener, i);
                        if (proxyChild !== child) {
                            target[i] = proxyChild;
                            // only walk the array item if it wasn't already a proxy...
                            ListeningProxyFactory.treeWalk(proxyChild);
                        }
                    }
                }
            } else if (target instanceof Map) {
                // iterate over a clone of the map (because we can't iterate over the original map and alter it at the same time)...
                // (everything is set back in the original target - so that map order is preserved)
                const clonedMap = new Map(target);
                for (let [key, value] of clonedMap) {
                    if (typeof value === 'object' && value !== null) {
                        proxyChild = ListeningProxyFactory.create(value);
                        proxyChild[SYMBOL_PROXY_LISTENERS].addParent(parentProxyListener, key);
                        target.set(key, proxyChild);
                        if (proxyChild !== value) {
                            // only walk the value if it wasn't already a proxy...
                            ListeningProxyFactory.treeWalk(proxyChild);
                        }
                    } else {
                        target.set(key, value);
                    }
                }
            } else {
                for (let pty in target) {
                    if (target.hasOwnProperty(pty)) {
                        child = target[pty];
                        if (typeof child === 'object' && child !== null) {
                            proxyChild = ListeningProxyFactory.create(child);
                            proxyChild[SYMBOL_PROXY_LISTENERS].addParent(parentProxyListener, pty);
                            if (proxyChild !== child) {
                                target[pty] = proxyChild;
                                // only walk the property value if it wasn't already a proxy...
                                ListeningProxyFactory.treeWalk(proxyChild);
                            }
                        }
                    }
                }
            }
        }
    }

    constructor() {
        throw new Error('ListeningProxyFactory cannot be instantiated with constructor - use ListeningProxyFactory.create()');
    }
}

const HANDLER_MASTER_FUNCTION = function(functionName, args, returnsOriginal, wasValue, deduceValue) {
    const target = this.proxyListeners.target;
    const proxy = this.proxyListeners.proxy;
    let result;
    let defaultAction = () => {
        result = target[functionName](...args);
        if (returnsOriginal) {
            result = proxy;
        }
        return result;
    };
    let event = this.proxyListeners.fireBefores(functionName + '()', undefined, undefined, wasValue, defaultAction, args);
    if (!event.defaultPrevented) {
        if (!event.defaultPerformed) {
            defaultAction();
        }
        const newValue = deduceValue ? deduceValue() : undefined;
        this.proxyListeners.fireAfters(functionName + '()', undefined, newValue, wasValue, args);
    }
    return result;
};

const HANDLER_MASTER_ARRAY_FUNCTION = function(arrayFunctionName, args, returnsOriginal) {
    let target = this.proxyListeners.target;
    let wasValue = target.slice();
    let value;
    let result;
    let defaultAction = () => {
        result = target[arrayFunctionName](...args);
        return result;
    };
    let event = this.proxyListeners.fireBefores(arrayFunctionName + '()', undefined, undefined, wasValue, defaultAction, args);
    if (!event.defaultPrevented) {
        if (!event.defaultPerformed) {
            defaultAction();
        } else if (!returnsOriginal) {
            // default action wasn't performed - we have to return something...
            result = ARRAY_FUNCTIONS_NO_DEFAULT_ACTION_RETURNS.get(arrayFunctionName)(target);
        }
        // remove parents from the original items (they'll get re-parented with new indices afterwards)...
        wasValue.forEach((item, index) => {
            if (item && typeof item === 'object' && item[SYMBOL_IS_PROXY]) {
                // remove this as being parented...
                item[SYMBOL_PROXY_LISTENERS].removeParent(this.proxyListeners, index);
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
};

const HANDLER_MASTER_TYPED_ARRAY_FUNCTION = function(arrayFunctionName, args, returnsOriginal) {
    let target = this.proxyListeners.target;
    let wasValue = target.slice();
    let value;
    let result;
    let defaultAction = () => {
        result = target[arrayFunctionName](...args);
        return result;
    };
    let event = this.proxyListeners.fireBefores(arrayFunctionName + '()', undefined, undefined, wasValue, defaultAction, args);
    if (!event.defaultPrevented) {
        if (!event.defaultPerformed) {
            defaultAction();
        } else if (!returnsOriginal) {
            // default action wasn't performed - we have to return something...
            result = ARRAY_FUNCTIONS_NO_DEFAULT_ACTION_RETURNS.get(arrayFunctionName)(target);
        }
        // now fire the afters...
        value = target.slice();
        this.proxyListeners.fireAfters(arrayFunctionName + '()', undefined, value, wasValue, args);
    } else if (!returnsOriginal && !event.defaultPerformed) {
        // default was prevented and the default action wasn't performed - we have to return something!...
        result = ARRAY_FUNCTIONS_NO_DEFAULT_ACTION_RETURNS.get(arrayFunctionName)(target);
    }
    // return either the proxied array or the result of the action...
    return returnsOriginal ? this.proxyListeners.proxy : result;
};

const HANDLER_MASTER_DATE_FUNCTION = function(dateFunctionName, args, wasValue, newValue) {
    let target = this.proxyListeners.target;
    let value = newValue !== undefined ? newValue : args.length === 1 ? args[0] : undefined;
    let result;
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
};

/*
* Utility function for determining if a given target is a class
*
* Kudos to https://stackoverflow.com/users/76840/aikeru
*      see https://stackoverflow.com/a/43197340/1891743
*/
function isClass(target) {
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

const bigIntsSupported = function () {
    try {
        return (typeof BigInt64Array === 'function') && (typeof BigUint64Array === 'function');
    } catch (e) {
        return false;
    }
}();
function isTypedArray(obj) {
    return (obj instanceof Int8Array || obj instanceof Uint8Array || obj instanceof Uint8ClampedArray
        || obj instanceof Int16Array || obj instanceof Uint16Array || obj instanceof Int32Array || obj instanceof Uint32Array
        || obj instanceof Float32Array || obj instanceof Float64Array
        || (bigIntsSupported && obj instanceof BigInt64Array)
        || (bigIntsSupported && obj instanceof BigUint64Array)
    )
}

class ProxyListeners {
    constructor(target) {
        this.target = target;
        this.proxy = null;
        this.beforeListeners = new Set();
        this.afterListeners = new Set();
        this.getPropertyListeners = new Set();
        this.getTreewalkerListeners = new Set();
        this.exceptionHandlers = new Set();
        this.listenersByEventType = new Map([
            [EVENT_TYPE_BEFORE_CHANGE, this.beforeListeners],
            [EVENT_TYPE_AFTER_CHANGE, this.afterListeners],
            [EVENT_TYPE_GET_PROPERTY, this.getPropertyListeners],
            [EVENT_TYPE_GET_TREEWALKER, this.getTreewalkerListeners],
            [EVENT_TYPE_EXCEPTION_HANDLER, this.exceptionHandlers]
        ]);
        this.parentListeners = new Map();
    }

    setProxy(proxy, isArray) {
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
        const event = new BeforeChangeEvent(this, action, pty, value, wasValue, defaultAction, args);
        this.fireListeners(event);
        return event;
    }

    fireAfters(action, pty, value, wasValue, args) {
        const event = new AfterChangeEvent(this, action, pty, value, wasValue, args);
        this.fireListeners(event);
        return event;
    }

    fireGetProperties(pty, defaultResult) {
        const event = new GetPropertyEvent(this, pty, defaultResult);
        this.fireListeners(event);
        return event;
    }

    fireGetTreewalkers() {
        let event = new GetTreewalkerEvent(this);
        this.fireListeners(event);
        return event;
    }

    fireExceptionHandlers(e, originalEvent, func) {
        let result = false;
        const event = new ExceptionHandlerEvent(this, e, originalEvent, func);
        event[EVENT_PTY_PATH] = originalEvent[EVENT_PTY_PATH].slice();
        const listeners = this.listenersByEventType.get(event.type);
        for (let func of listeners) {
            result = true;
            func(event);
            if (event.propagationStopped) {
                break;
            }
        }
        if (!event.propagationStopped) {
            let originPath = event.path.slice();
            let newPath;
            for (let parent of this.parentListeners) {
                result = parent[0].fireExceptionHandlers(e, originalEvent, func);
            }
        }
        return result;
    }

    fireListeners(event) {
        const listeners = this.listenersByEventType.get(event.type);
        for (let func of listeners) {
            try {
                func(event);
            } catch(e) {
                if (!this.fireExceptionHandlers(e, event, func)) {
                    console.error(e);
                }
            }
            if (event.propagationStopped) {
                break;
            }
        }
        if (!event.propagationStopped) {
            const originPath = event.path.slice();
            let newPath;
            for (let [parentProxyListener, properties] of this.parentListeners) {
                for (let asProperty of properties) {
                    newPath = originPath.slice();
                    newPath.unshift(asProperty);
                    event[EVENT_PTY_PATH] = newPath;
                    parentProxyListener.fireListeners(event);
                }
            }
        }
    }

    addParent(parentProxyListener, asProperty) {
        const parentedProperties = this.parentListeners.get(parentProxyListener);
        if (parentedProperties) {
            parentedProperties.add(asProperty);
        } else {
            this.parentListeners.set(parentProxyListener, new Set([asProperty]));
        }
    }

    removeParent(parentProxyListener, asProperty) {
        const parentedProperties = this.parentListeners.get(parentProxyListener);
        if (parentedProperties && parentedProperties.delete(asProperty) && !parentedProperties.size) {
            this.parentListeners.delete(parentProxyListener);
        }
    }
}

const EVENT_PTY_PROXY_LISTENERS = Symbol('proxyListeners');
const EVENT_PTY_TYPE = Symbol('type');
const EVENT_PTY_PATH = Symbol('path');

class BaseProxyEvent {
    constructor(proxyListeners, eventType) {
        this[EVENT_PTY_PROXY_LISTENERS] = proxyListeners;
        this[EVENT_PTY_TYPE] = eventType;
        this[EVENT_PTY_PATH] = [];
    }

    get type() {
        return this[EVENT_PTY_TYPE];
    }

    get target() {
        return this[EVENT_PTY_PROXY_LISTENERS].target;
    }

    get proxy() {
        return this[EVENT_PTY_PROXY_LISTENERS].proxy;
    }

    get path() {
        return this[EVENT_PTY_PATH].slice();
    }

    /**
     * Obtains a snapshot of the event
     * Because the same event is propagated through potentially many listeners and may be changed by each listener, this
     * property provides a means to capture the event at the point it was received
     * (useful for logging, debugging and testing purposes)
     * @returns {{}} a snapshot of the event properties
     */
    get snapshot() {
        return {
            'type': this[EVENT_PTY_TYPE],
            'path': this[EVENT_PTY_PATH].slice()
        };
    }
}

const EVENT_PTY_ACTION = Symbol('action');
const EVENT_PTY_PROPERTY = Symbol('property');
const EVENT_PTY_VALUE = Symbol('value');
const EVENT_PTY_WAS_VALUE = Symbol('wasValue');
const EVENT_PTY_DEFAULT_ACTION = Symbol('defaultAction');
const EVENT_PTY_ARGS = Symbol('args');
const EVENT_PTY_DEFAULT_PREVENTED = Symbol('defaultPrevented');
const EVENT_PTY_PROPAGATION_STOPPED = Symbol('propagationStopped');
const EVENT_PTY_DEFAULT_PERFORMED = Symbol('defaultPerformed');

class BeforeChangeEvent extends BaseProxyEvent {
    constructor(proxyListeners, action, pty, value, wasValue, defaultAction, args) {
        super(proxyListeners, EVENT_TYPE_BEFORE_CHANGE);
        this[EVENT_PTY_ACTION] = action;
        this[EVENT_PTY_PROPERTY] = pty;
        this[EVENT_PTY_VALUE] = value;
        this[EVENT_PTY_WAS_VALUE] = wasValue;
        this[EVENT_PTY_DEFAULT_ACTION] = defaultAction;
        this[EVENT_PTY_ARGS] = args ? Array.prototype.slice.call(args) : [];
        this[EVENT_PTY_DEFAULT_PREVENTED] = false;
        this[EVENT_PTY_PROPAGATION_STOPPED] = false;
        this[EVENT_PTY_DEFAULT_PERFORMED] = false;
    }

    get action() {
        return this[EVENT_PTY_ACTION];
    }

    get property() {
        return this[EVENT_PTY_PROPERTY];
    }

    get value() {
        return this[EVENT_PTY_VALUE];
    }

    get wasValue() {
        return this[EVENT_PTY_WAS_VALUE];
    }

    get arguments() {
        return this[EVENT_PTY_ARGS].slice();
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return true;
    }

    get propagationStopped() {
        return this[EVENT_PTY_PROPAGATION_STOPPED];
    }

    stopPropagation() {
        this[EVENT_PTY_PROPAGATION_STOPPED] = true;
    }

    get defaultPrevented() {
        return this[EVENT_PTY_DEFAULT_PREVENTED];
    }

    get defaultPerformed() {
        return this[EVENT_PTY_DEFAULT_PERFORMED];
    }

    performDefault() {
        let result;
        if (!this[EVENT_PTY_DEFAULT_PERFORMED] && !this[EVENT_PTY_DEFAULT_PREVENTED]) {
            this[EVENT_PTY_DEFAULT_PERFORMED] = true;
            result = this[EVENT_PTY_DEFAULT_ACTION]();
        }
        return result;
    }

    preventDefault() {
        this[EVENT_PTY_DEFAULT_PREVENTED] = true;
    }

    get snapshot() {
        const result = super.snapshot;
        result.action = this[EVENT_PTY_ACTION];
        result.property = this[EVENT_PTY_PROPERTY];
        result.value = this[EVENT_PTY_VALUE];
        result.wasValue = this[EVENT_PTY_WAS_VALUE];
        result.arguments = this[EVENT_PTY_ARGS].slice();
        result.propagates = true;
        result.preventable = true;
        result.propagationStopped = this[EVENT_PTY_PROPAGATION_STOPPED];
        result.defaultPrevented = this[EVENT_PTY_DEFAULT_PREVENTED];
        result.defaultPerformed = this[EVENT_PTY_DEFAULT_PERFORMED];
        return result;
    }
}

class AfterChangeEvent extends BaseProxyEvent {
    constructor(proxyListeners, action, pty, value, wasValue, args) {
        super(proxyListeners, EVENT_TYPE_AFTER_CHANGE);
        this[EVENT_PTY_ACTION] = action;
        this[EVENT_PTY_PROPERTY] = pty;
        this[EVENT_PTY_VALUE] = value;
        this[EVENT_PTY_WAS_VALUE] = wasValue;
        this[EVENT_PTY_ARGS] = args ? Array.prototype.slice.call(args) : [];
        this[EVENT_PTY_PROPAGATION_STOPPED] = false;
    }

    get action() {
        return this[EVENT_PTY_ACTION];
    }

    get property() {
        return this[EVENT_PTY_PROPERTY];
    }

    get value() {
        return this[EVENT_PTY_VALUE];
    }

    get wasValue() {
        return this[EVENT_PTY_WAS_VALUE];
    }

    get arguments() {
        return this[EVENT_PTY_ARGS];
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return false;
    }

    get propagationStopped() {
        return this[EVENT_PTY_PROPAGATION_STOPPED];
    }

    stopPropagation() {
        this[EVENT_PTY_PROPAGATION_STOPPED] = true;
    }

    get snapshot() {
        const result = super.snapshot;
        result.action = this[EVENT_PTY_ACTION];
        result.property = this[EVENT_PTY_PROPERTY];
        result.value = this[EVENT_PTY_VALUE];
        result.wasValue = this[EVENT_PTY_WAS_VALUE];
        result.arguments = this[EVENT_PTY_ARGS].slice();
        result.propagates = true;
        result.preventable = false;
        result.propagationStopped = this[EVENT_PTY_PROPAGATION_STOPPED];
        return result;
    }
}

const EVENT_PTY_DEFAULT_RESULT = Symbol('defaultResult');
const EVENT_PTY_ACTUAL_RESULT = Symbol('actualResult');
const EVENT_PTY_FIRES_BEFORES_AND_AFTERS = Symbol('firesBeforesAndAfters');
const EVENT_PTY_AS_ACTION = Symbol('asAction');

class GetPropertyEvent extends BaseProxyEvent {
    constructor(proxyListeners, pty, defaultResult) {
        super(proxyListeners, EVENT_TYPE_GET_PROPERTY);
        this[EVENT_PTY_PROPERTY] = pty;
        this[EVENT_PTY_DEFAULT_RESULT] = defaultResult;
        this[EVENT_PTY_ACTUAL_RESULT] = defaultResult;
        this[EVENT_PTY_DEFAULT_PREVENTED] = false;
        this[EVENT_PTY_PROPAGATION_STOPPED] = false;
        this[EVENT_PTY_FIRES_BEFORES_AND_AFTERS] = false;
        this[EVENT_PTY_AS_ACTION] = null;
    }

    get property() {
        return this[EVENT_PTY_PROPERTY];
    }

    get defaultResult() {
        return this[EVENT_PTY_DEFAULT_RESULT];
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return true;
    }

    get propagationStopped() {
        return this[EVENT_PTY_PROPAGATION_STOPPED];
    }

    stopPropagation() {
        this[EVENT_PTY_PROPAGATION_STOPPED] = true;
    }

    preventDefault(replacementResult, firesBeforesAndAfters, asAction) {
        if (!this[EVENT_PTY_DEFAULT_PREVENTED]) {
            this[EVENT_PTY_DEFAULT_PREVENTED] = true;
            this[EVENT_PTY_PROPAGATION_STOPPED] = true;
            this[EVENT_PTY_ACTUAL_RESULT] = replacementResult;
            this[EVENT_PTY_FIRES_BEFORES_AND_AFTERS] = (typeof firesBeforesAndAfters === 'boolean') && firesBeforesAndAfters && (typeof this[EVENT_PTY_ACTUAL_RESULT] === 'function');
            if (this[EVENT_PTY_FIRES_BEFORES_AND_AFTERS]) {
                this[EVENT_PTY_AS_ACTION] = '[[' + (asAction ? asAction : this[EVENT_PTY_PROPERTY]) + ']]';
            }
        }
    }

    get defaultPrevented() {
        return this[EVENT_PTY_DEFAULT_PREVENTED];
    }

    get firesBeforesAndAfters() {
        return this[EVENT_PTY_FIRES_BEFORES_AND_AFTERS];
    }

    get asAction() {
        return this[EVENT_PTY_AS_ACTION];
    }

    get result() {
        return this[EVENT_PTY_ACTUAL_RESULT];
    }

    get snapshot() {
        const result = super.snapshot;
        result.property = this[EVENT_PTY_PROPERTY];
        result.propagates = true;
        result.preventable = true;
        result.propagationStopped = this[EVENT_PTY_PROPAGATION_STOPPED];
        result.defaultPrevented = this[EVENT_PTY_DEFAULT_PREVENTED];
        result.firesBeforesAndAfters = this[EVENT_PTY_FIRES_BEFORES_AND_AFTERS];
        result.asAction = this[EVENT_PTY_AS_ACTION];
        result.result = this[EVENT_PTY_ACTUAL_RESULT];
        return result;
    }
}

const EVENT_PTY_TREE_WALKER = Symbol('treeWalker');

class GetTreewalkerEvent extends BaseProxyEvent {
    constructor(proxyListeners) {
        super(proxyListeners, EVENT_TYPE_GET_TREEWALKER);
        this[EVENT_PTY_TREE_WALKER] = null;
        this[EVENT_PTY_DEFAULT_PREVENTED] = false;
        this[EVENT_PTY_PROPAGATION_STOPPED] = false;
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return true;
    }

    get defaultPrevented() {
        return this[EVENT_PTY_DEFAULT_PREVENTED];
    }

    preventDefault(treeWalker) {
        if (!treeWalker || typeof treeWalker !== 'function') {
            throw new TypeError('Supplied treeWalker on GetTreewalkerEvent.preventDefault() must be a function');
        }
        if (!this[EVENT_PTY_DEFAULT_PREVENTED]) {
            this[EVENT_PTY_DEFAULT_PREVENTED] = true;
            this[EVENT_PTY_PROPAGATION_STOPPED] = true;
            this[EVENT_PTY_TREE_WALKER] = treeWalker;
        }
    }

    get propagationStopped() {
        return this[EVENT_PTY_PROPAGATION_STOPPED];
    }

    stopPropagation() {
        this[EVENT_PTY_PROPAGATION_STOPPED] = true;
    }

    get treeWalker() {
        return this[EVENT_PTY_TREE_WALKER];
    }

    get snapshot() {
        const result = super.snapshot;
        result.propagates = true;
        result.preventable = true;
        result.propagationStopped = this[EVENT_PTY_PROPAGATION_STOPPED];
        result.defaultPrevented = this[EVENT_PTY_DEFAULT_PREVENTED];
        return result;
    }
}

const EVENT_PTY_EXCEPTION = Symbol('exception');
const EVENT_PTY_ORIGINAL_EVENT = Symbol('originalEvent');
const EVENT_PTY_HANDLER = Symbol('handler');

class ExceptionHandlerEvent extends BaseProxyEvent {
    constructor(proxyListeners, exception, originalEvent, handler) {
        super(proxyListeners, EVENT_TYPE_EXCEPTION_HANDLER);
        this[EVENT_PTY_EXCEPTION] = exception;
        this[EVENT_PTY_ORIGINAL_EVENT] = originalEvent;
        this[EVENT_PTY_HANDLER] = handler;
        this[EVENT_PTY_PROPAGATION_STOPPED] = false;
    }

    get event() {
        return this[EVENT_PTY_ORIGINAL_EVENT];
    }

    get exception() {
        return this[EVENT_PTY_EXCEPTION];
    }

    get handler() {
        return this[EVENT_PTY_HANDLER];
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return false;
    }

    get propagationStopped() {
        return this[EVENT_PTY_PROPAGATION_STOPPED];
    }

    stopPropagation() {
        this[EVENT_PTY_PROPAGATION_STOPPED] = true;
    }

    get snapshot() {
        const result = super.snapshot;
        result.exception = this[EVENT_PTY_EXCEPTION];
        result.event = this[EVENT_PTY_ORIGINAL_EVENT].snapshot;
        result.handler = this[EVENT_PTY_HANDLER];
        result.propagates = true;
        result.preventable = false;
        result.propagationStopped = this[EVENT_PTY_PROPAGATION_STOPPED];
        return result;
    }
}

const ARRAY_FUNCTIONS = new Map([
    ['copyWithin',
        function() {
            return this.masterFunctionHandler('copyWithin', arguments, true);
        }
    ],
    ['fill',
        function() {
            return this.masterFunctionHandler('fill', arguments, true);
        }
    ],
    ['pop',
        function() {
            return this.masterFunctionHandler('pop', arguments, false);
        }
    ],
    ['push',
        function() {
            return this.masterFunctionHandler('push', arguments, false);
        }
    ],
    ['reverse',
        function() {
            return this.masterFunctionHandler('reverse', arguments, true);
        }
    ],
    ['shift',
        function() {
            return this.masterFunctionHandler('shift', arguments, false);
        }
    ],
    ['sort',
        function() {
            return this.masterFunctionHandler('sort', arguments, true);
        }
    ],
    ['splice',
        function() {
            return this.masterFunctionHandler('splice', arguments, false);
        }
    ],
    ['unshift',
        function() {
            return this.masterFunctionHandler('unshift', arguments, false);
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

const TYPED_ARRAY_FUNCTIONS = new Map([
    ['copyWithin',
        function() {
            return this.masterFunctionHandler('copyWithin', arguments, true);
        }
    ],
    ['fill',
        function() {
            return this.masterFunctionHandler('fill', arguments, true);
        }
    ],
    ['reverse',
        function() {
            return this.masterFunctionHandler('reverse', arguments, true);
        }
    ],
    ['set',
        function() {
            return this.masterFunctionHandler('set', arguments, true);
        }
    ],
    ['sort',
        function() {
            return this.masterFunctionHandler('sort', arguments, true);
        }
    ],
    ['splice',
        function() {
            return this.masterFunctionHandler('splice', arguments, false);
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

const DATE_FUNCTIONS = new Map([
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
            return this.masterFunctionHandler('setDate', arguments, this.proxyListeners.target.getDate());
        }
    ],
    ['setFullYear',
        function() {
            let newValue;
            if (arguments.length > 1) {
                newValue = new Date(this.proxyListeners.target.valueOf());
                newValue.setFullYear(...arguments);
            }
            return this.masterFunctionHandler('setFullYear', arguments,
                arguments.length > 1 ? new Date(this.proxyListeners.target.valueOf()) : this.proxyListeners.target.getFullYear(), newValue);
        }
    ],
    ['setHours',
        function() {
            return this.masterFunctionHandler('setHours', arguments, this.proxyListeners.target.getHours());
        }
    ],
    ['setMilliseconds',
        function() {
            return this.masterFunctionHandler('setMilliseconds', arguments, this.proxyListeners.target.getMilliseconds());
        }
    ],
    ['setMinutes',
        function() {
            return this.masterFunctionHandler('setMinutes', arguments, this.proxyListeners.target.getMinutes());
        }
    ],
    ['setMonth',
        function() {
            return this.masterFunctionHandler('setMonth', arguments, this.proxyListeners.target.getMonth());
        }
    ],
    ['setSeconds',
        function() {
            return this.masterFunctionHandler('setSeconds', arguments, this.proxyListeners.target.getSeconds());
        }
    ],
    ['setTime',
        function() {
            return this.masterFunctionHandler('setTime', arguments, this.proxyListeners.target.getTime());
        }
    ],
    ['setUTCDate',
        function() {
            return this.masterFunctionHandler('setUTCDate', arguments, this.proxyListeners.target.getUTCDate());
        }
    ],
    ['setUTCFullYear',
        function() {
            let newValue;
            if (arguments.length > 1) {
                newValue = new Date(this.proxyListeners.target.valueOf());
                newValue.setUTCFullYear(...arguments);
            }
            return this.masterFunctionHandler('setUTCFullYear', arguments,
                arguments.length > 1 ? new Date(this.proxyListeners.target.valueOf()) : this.proxyListeners.target.getUTCFullYear(), newValue);
        }
    ],
    ['setUTCHours',
        function() {
            return this.masterFunctionHandler('setUTCHours', arguments, this.proxyListeners.target.getUTCHours());
        }
    ],
    ['setUTCMilliseconds',
        function() {
            return this.masterFunctionHandler('setUTCMilliseconds', arguments, this.proxyListeners.target.getUTCMilliseconds());
        }
    ],
    ['setUTCMinutes',
        function() {
            return this.masterFunctionHandler('setUTCMinutes', arguments, this.proxyListeners.target.getUTCMinutes());
        }
    ],
    ['setUTCMonth',
        function() {
            return this.masterFunctionHandler('setUTCMonth', arguments, this.proxyListeners.target.getUTCMonth());
        }
    ],
    ['setUTCSeconds',
        function() {
            return this.masterFunctionHandler('setUTCSeconds', arguments, this.proxyListeners.target.getUTCSeconds());
        }
    ],
    ['setYear',
        function() {
            return this.masterFunctionHandler('setYear', arguments, this.proxyListeners.target.getYear());
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

const MAP_FUNCTIONS = new Map([
    ['clear',
        function() {
            const args = Array.prototype.slice.call(arguments);
            const listeners = this.proxyListeners;
            const target = listeners.target;
            const wasValue = new Map(target);
            let result;
            const defaultAction = () => {
                for (let [key, value] of wasValue) {
                    if (value && typeof value === 'object' && value[SYMBOL_IS_PROXY]) {
                        value[SYMBOL_PROXY_LISTENERS].removeParent(listeners, key);
                    }
                }
                result = target.clear(...args);
                return result;
            };
            const event = listeners.fireBefores('clear()', undefined, new Map(), wasValue, defaultAction, args);
            if (!event.defaultPrevented) {
                if (!event.defaultPerformed) {
                    defaultAction();
                }
                listeners.fireAfters('clear()', undefined, new Map(), wasValue, args);
            }
            return result;
        }
    ],
    ['delete',
        function(key) {
            const args = Array.prototype.slice.call(arguments);
            const listeners = this.proxyListeners;
            const target = listeners.target;
            const wasValue = new Map(target);
            const newValue = new Map(wasValue);
            newValue.delete(key);
            const wasItem = wasValue.get(...args);
            let result = false;
            const defaultAction = () => {
                if (wasItem && typeof wasItem === 'object' && wasItem[SYMBOL_IS_PROXY]) {
                    wasItem[SYMBOL_PROXY_LISTENERS].removeParent(listeners, key);
                }
                result = target.delete(...args);
                return result;
            };
            let event = listeners.fireBefores('delete()', undefined, newValue, wasValue, defaultAction, args);
            if (!event.defaultPrevented) {
                if (!event.defaultPerformed) {
                    defaultAction();
                }
                listeners.fireAfters('delete()', undefined, newValue, wasValue, args);
            }
            return result;
        }
    ],
    ['set',
        function(key, value) {
            const args = Array.prototype.slice.call(arguments);
            const listeners = this.proxyListeners;
            const target = listeners.target;
            const wasValue = new Map(target);
            const wasItem = wasValue.get(key);
            const newValue = new Map(wasValue);
            newValue.set(...args);
            const defaultAction = () => {
                if (wasItem && typeof wasItem === 'object' && wasItem[SYMBOL_IS_PROXY]) {
                    wasItem[SYMBOL_PROXY_LISTENERS].removeParent(listeners, key);
                }
                let newItem = value;
                if (newItem && typeof newItem === 'object') {
                    newItem = ListeningProxyFactory.create(value);
                    newItem[SYMBOL_PROXY_LISTENERS].addParent(listeners, key);
                    if (newItem !== value) {
                        ListeningProxyFactory.treeWalk(newItem);
                    }
                }
                target.set(key, newItem);
            };
            let event = listeners.fireBefores('set()', undefined, newValue, wasValue, defaultAction, args);
            if (!event.defaultPrevented) {
                if (!event.defaultPerformed) {
                    defaultAction();
                }
                listeners.fireAfters('set()', undefined, newValue, wasValue, args);
            }
            return listeners.proxy;
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

const SET_FUNCTIONS = new Map([
    ['add',
        function() {
            return this.masterFunctionHandler('add', arguments, true, new Set(this.proxyListeners.target), () => { return new Set(this.proxyListeners.target) });
        }
    ],
    ['clear',
        function() {
            return this.masterFunctionHandler('clear', arguments, false, new Set(this.proxyListeners.target), () => { return new Set(this.proxyListeners.target) });
        }
    ],
    ['delete',
        function() {
            return this.masterFunctionHandler('delete', arguments, false, new Set(this.proxyListeners.target), () => { return new Set(this.proxyListeners.target) });
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
