import * as Proxying from '../src/ListeningProxy.js';

export const createDeepMapListeningProxy = function(obj, initialListeners) {
    let listeners = Array.prototype.slice.call(arguments, 1);
    listeners.unshift(
        {
            eventType: Proxying.EVENT_TYPE_GET_TREEWALKER,
            listener: deepMapGetTreewalkerHandler
        },
        {
            eventType: Proxying.EVENT_TYPE_GET_PROPERTY,
            listener: deepMapGetPropertyHandler
        }
    );
    return Proxying.ListeningProxyFactory.create(obj, ...listeners);
}

const deepMapGetTreewalkerHandler = function(event) {
    if (event.target instanceof Map) {
        event.preventDefault(proxy => {
            let target = proxy[Proxying.SYMBOL_PROXY_TARGET];
            let parentProxyListener = proxy[Proxying.SYMBOL_PROXY_LISTENERS];
            let originaldMap = new Map(target);
            let proxyValue;
            originaldMap.forEach((value, key) => {
                // only if the value in the map is an object...
                if (value && typeof value === 'object') {
                    // create a proxy of the value...
                    proxyValue = Proxying.ListeningProxyFactory.create(value);
                    // set the value in the map as being the proxy...
                    target.set(key, proxyValue);
                    // get the listeners on the new proxy and add the parent listener...
                    proxyValue[Proxying.SYMBOL_PROXY_LISTENERS].addParent(parentProxyListener, {key: key});
                    // now walk the tree, if any, of our proxied object...
                    Proxying.ListeningProxyFactory.treeWalk(proxyValue);
                }
            });
        });
    }
};

const deepMapGetPropertyHandler = function(event) {
    if (event.target instanceof Map && MAP_CHANGE_FUNCTIONS_MAP.has(event.property)) {
        event.preventDefault(MAP_CHANGE_FUNCTIONS_MAP.get(event.property).bind(event.proxy));
    }
};

const MAP_CHANGE_FUNCTIONS_MAP = new Map([
    ['clear',
        function() {
            let args = Array.prototype.slice.call(arguments);
            let listeners = this[Proxying.SYMBOL_PROXY_LISTENERS];
            let target = this[Proxying.SYMBOL_PROXY_TARGET];
            let wasValue = new Map(target);
            let defaultAction = () => {
                for (const entry of wasValue.values()) {
                    if (entry && typeof entry === 'object' && entry[Proxying.SYMBOL_IS_PROXY]) {
                        entry[Proxying.SYMBOL_PROXY_LISTENERS].removeParent(listeners);
                    }
                }
                target.clear();
            };
            let event = listeners.fireBefores('clear()', undefined, new Map(), wasValue, defaultAction, args);
            if (!event.defaultPrevented) {
                if (!event.defaultPerformed) {
                    defaultAction();
                }
                listeners.fireAfters('clear()', undefined, new Map(), wasValue, args);
            }
        }
    ],
    ['delete',
        function() {
            let args = Array.prototype.slice.call(arguments);
            let listeners = this[Proxying.SYMBOL_PROXY_LISTENERS];
            let target = this[Proxying.SYMBOL_PROXY_TARGET];
            let key = args.length ? args[0] : undefined;
            let wasValue = target.get(...args);
            let result = false;
            let defaultAction = () => {
                if (wasValue && typeof wasValue === 'object' && wasValue[Proxying.SYMBOL_IS_PROXY]) {
                    wasValue[Proxying.SYMBOL_PROXY_LISTENERS].removeParent(listeners);
                }
                result = target.delete(...args);
            };
            let event = listeners.fireBefores('delete()', { key: key }, undefined, wasValue, defaultAction, args);
            if (!event.defaultPrevented) {
                if (!event.defaultPerformed) {
                    defaultAction();
                }
                listeners.fireAfters('delete()', { key: key }, undefined, wasValue, args);
            }
            return result;
        }
    ],
    ['set',
        function() {
            let args = Array.prototype.slice.call(arguments);
            let listeners = this[Proxying.SYMBOL_PROXY_LISTENERS];
            let target = this[Proxying.SYMBOL_PROXY_TARGET];
            let key = args.length ? args[0] : undefined;
            let wasValue = target.get(key);
            let value = args.length > 1 ? args[1] : undefined;
            let defaultAction = () => {
                if (wasValue && typeof wasValue === 'object' && wasValue[Proxying.SYMBOL_IS_PROXY]) {
                    wasValue[Proxying.SYMBOL_PROXY_LISTENERS].removeParent(listeners);
                }
                let newValue = value;
                if (value && typeof value === 'object') {
                    newValue = Proxying.ListeningProxyFactory.create(value);
                    newValue[Proxying.SYMBOL_PROXY_LISTENERS].addParent(listeners, {key: key});
                    Proxying.ListeningProxyFactory.treeWalk(newValue);
                }
                target.set(key, newValue);
            };
            let event = listeners.fireBefores('set()', { key: key }, value, wasValue, defaultAction, args);
            if (!event.defaultPrevented) {
                if (!event.defaultPerformed) {
                    defaultAction();
                }
                listeners.fireAfters('set()', { key: key }, value, wasValue, args);
            }
            return this;
        }
    ]
]);