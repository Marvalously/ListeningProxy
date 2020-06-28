import BaseProxyEvent from './BaseProxyEvent';

const EVENT_TYPE_GET_PROPERTY = 'getProperty';

class GetPropertyEvent extends BaseProxyEvent {
    #pty;
    #defaultResult;
    #actualResult;

    #defaultPrevented = false;
    #propagationStopped = false;

    #firesBeforesAndAfters = false;
    #asAction;

    constructor(proxyListeners, pty, defaultResult) {
        super(proxyListeners, EVENT_TYPE_GET_PROPERTY);
        this.#pty = pty;
        this.#defaultResult = defaultResult;
        this.#actualResult = defaultResult;
    }

    get property() {
        return this.#pty;
    }

    get defaultResult() {
        return this.#defaultResult;
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

    preventDefault(replacementResult, firesBeforesAndAfters, asAction) {
        if (!this.#defaultPrevented) {
            this.#defaultPrevented = true;
            this.#propagationStopped = true;
            this.#actualResult = replacementResult;
            this.#firesBeforesAndAfters = (typeof firesBeforesAndAfters === 'boolean') && firesBeforesAndAfters && (typeof this.#actualResult === 'function');
            if (this.#firesBeforesAndAfters) {
                this.#asAction = '[[' + (asAction ? asAction : this.pty) + ']]';
            }
        }
    }

    get defaultPrevented() {
        return this.#defaultPrevented;
    }

    get firesBeforesAndAfters() {
        return this.#firesBeforesAndAfters;
    }

    get asAction() {
        return this.#asAction;
    }

    get result() {
        return this.#actualResult;
    }
}

export {GetPropertyEvent as default, EVENT_TYPE_GET_PROPERTY}