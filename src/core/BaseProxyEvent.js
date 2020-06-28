class BaseProxyEvent {
    #proxyListeners;
    #type;
    #path = [];

    constructor(proxyListeners, eventType) {
        this.#proxyListeners = proxyListeners;
        this.#type = eventType;
    }

    get type() {
        return this.#type;
    }

    get target() {
        return this.#proxyListeners.target;
    }

    get proxy() {
        return this.#proxyListeners.proxy;
    }

    get path() {
        return this.#path;
    }

    setPath(path) {
        this.#path = path;
    }
}

export default BaseProxyEvent;