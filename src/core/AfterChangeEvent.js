import BaseProxyEvent from './BaseProxyEvent';

const EVENT_TYPE_AFTER_OBJECT_CHANGE = 'afterChange';

class AfterChangeEvent extends BaseProxyEvent {
    #action;
    #pty;
    #value;
    #wasValue;
    #args;

    #propagationStopped = false;

    constructor(proxyListeners, action, pty, value, wasValue, args) {
        super(proxyListeners, EVENT_TYPE_AFTER_OBJECT_CHANGE);
        this.#action = action;
        this.#pty = pty;
        this.#value = value;
        this.#wasValue = wasValue;
        this.#args = args ? Array.prototype.slice.call(args) : undefined;
    }

    get action() {
        return this.#action;
    }

    get property() {
        return this.#pty;
    }

    get value() {
        return this.#value;
    }

    get wasValue() {
        return this.#wasValue;
    }

    get arguments() {
        return this.#args;
    }

    get propagates() {
        return true;
    }

    get preventable() {
        return false;
    }

    get propagationStopped() {
        return this.#propagationStopped;
    }

    stopPropagation() {
        this.#propagationStopped = true;
    }
}

export { AfterChangeEvent as default, EVENT_TYPE_AFTER_OBJECT_CHANGE };