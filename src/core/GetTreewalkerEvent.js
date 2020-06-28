import BaseProxyEvent from './BaseProxyEvent';

const EVENT_TYPE_GET_TREEWALKER = 'getTreewalker'

class GetTreewalkerEvent extends BaseProxyEvent {
    #treeWalker;

    #defaultPrevented = false;
    #propagationStopped = false;

    constructor(proxyListeners) {
        super(proxyListeners, EVENT_TYPE_GET_TREEWALKER);
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return true;
    }

    get defaultPrevented() {
        return this.#defaultPrevented;
    }

    preventDefault(treeWalker) {
        if (!treeWalker || typeof treeWalker !== 'function') {
            throw new TypeError('Supplied treeWalker on GetTreewalkerEvent.preventDefault() must be a function');
        }
        if (!this.#defaultPrevented) {
            this.#defaultPrevented = true;
            this.#propagationStopped = true;
            this.#treeWalker = treeWalker;
        }
    }

    get propagationStopped() {
        return this.#propagationStopped;
    }

    stopPropagation() {
        this.#propagationStopped = true;
    }

    get treeWalker() {
        return this.#treeWalker;
    }
}

export {GetTreewalkerEvent as default, EVENT_TYPE_GET_TREEWALKER}