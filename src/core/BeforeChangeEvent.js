import BaseProxyEvent from './BaseProxyEvent';

const EVENT_TYPE_BEFORE_OBJECT_CHANGE = 'beforeChange';

class BeforeChangeEvent extends BaseProxyEvent {
    #action;
    #pty;
    #value;
    #wasValue;
    #defaultAction;
    #args;

    #defaultPrevented = false;
    #propagationStopped = false;
    #defaultPerformed = false;

    constructor(proxyListeners, action, pty, value, wasValue, defaultAction, args) {
        super(proxyListeners, EVENT_TYPE_BEFORE_OBJECT_CHANGE);
        this.#action = action;
        this.#pty = pty;
        this.#value = value;
        this.#wasValue = wasValue;
        this.#defaultAction = defaultAction;
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
        return true;
    }

    get propagationStopped() {
        return this.#propagationStopped;
    }

    stopPropagation() {
        this.#propagationStopped = true;
    }

    get defaultPrevented() {
        return this.#defaultPerformed;
    }

    get defaultPerformed() {
        return this.#defaultPerformed;
    }

    performDefault() {
        let result;
        if (!this.#defaultPerformed && !this.#defaultPrevented) {
            this.#defaultPerformed = true;
            result = this.#defaultAction();
        }
        return result;
    }

    preventDefault() {
        this.#defaultPrevented = true;
    }
}

export { BeforeChangeEvent as default , EVENT_TYPE_BEFORE_OBJECT_CHANGE };