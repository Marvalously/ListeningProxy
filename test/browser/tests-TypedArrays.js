import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS
} from '../../src/listening-proxy.js';

const TYPES = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
const bigIntsSupported = function () {
    try {
        return (typeof BigInt64Array === 'function') && (typeof BigUint64Array === 'function');
    } catch (e) {
        return false;
    }
}();
const BIG_TYPES = bigIntsSupported ? [BigInt64Array, BigUint64Array] : [];

describe('Typed Arrays', function () {
    it('create proxy on typed arrays works', function () {
        let obj, proxy;

        for (let arrayType of TYPES[Symbol.iterator]()) {
            obj = new arrayType([1, 2, 3]);
            proxy = CreateListeningProxy(obj);

            assert.isTrue(proxy[SYMBOL_IS_PROXY]);
            proxy[0] = 0;
            assert.strictEqual(obj[0], 0);
        }

        for (let arrayType of BIG_TYPES[Symbol.iterator]()) {
            obj = new arrayType([1n, 2n, 3n]);
            proxy = CreateListeningProxy(obj);

            assert.isTrue(proxy[SYMBOL_IS_PROXY]);
            proxy[0] = 0n;
            assert.strictEqual(obj[0], 0n);
        }
    })

    it('proxied typed array should be seen and act as typed array', function () {
        let obj, proxy, iterator, iterations;

        for (let arrayType of TYPES[Symbol.iterator]()) {
            obj = new arrayType([1, 2, 3]);
            proxy = CreateListeningProxy(obj);

            assert.strictEqual(typeof proxy, 'object');
            assert.isFalse(Array.isArray(proxy));
            assert.isTrue(proxy instanceof arrayType);

            iterator = proxy[Symbol.iterator]();
            iterations = 0;
            for (let item of iterator) {
                iterations++;
            }
            assert.strictEqual(iterations, 3);
        }

        for (let arrayType of BIG_TYPES[Symbol.iterator]()) {
            obj = new arrayType([1n, 2n, 3n]);
            proxy = CreateListeningProxy(obj);

            assert.strictEqual(typeof proxy, 'object');
            assert.isFalse(Array.isArray(proxy));
            assert.isTrue(proxy instanceof arrayType);

            iterator = proxy[Symbol.iterator]();
            iterations = 0;
            for (let item of iterator) {
                iterations++;
            }
            assert.strictEqual(iterations, 3);
        }
    })

    it('listeners are fired', function () {
        let obj, proxy, beforeEvents, afterEvents, getEvents;

        for (let arrayType of TYPES[Symbol.iterator]()) {
            beforeEvents = [];
            afterEvents = [];
            getEvents = [];

            obj = new arrayType([1, 2, 3, 4, 5, 6, 7, 8]);
            proxy = CreateListeningProxy(obj)
                .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                    beforeEvents.push(evt.snapshot);
                })
                .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                    afterEvents.push(evt.snapshot);
                })
                .addListener(EVENT_TYPE_GET_PROPERTY, evt => {
                    getEvents.push(evt.snapshot);
                });

            proxy[0] = 0;
            assert.strictEqual(beforeEvents.length, 1);
            assert.strictEqual(beforeEvents[0].property, 0);
            assert.strictEqual(beforeEvents[0].value, 0);
            assert.strictEqual(beforeEvents[0].wasValue, 1);
            assert.strictEqual(afterEvents.length, 1);
            assert.strictEqual(afterEvents[0].property, 0);
            assert.strictEqual(afterEvents[0].value, 0);
            assert.strictEqual(afterEvents[0].wasValue, 1);
            assert.strictEqual(getEvents.length, 0);

            ++proxy[0];
            assert.strictEqual(beforeEvents.length, 2);
            assert.strictEqual(afterEvents.length, 2);
            assert.strictEqual(getEvents.length, 1);
            assert.strictEqual(getEvents[0].property, 0);
            assert.strictEqual(obj[0], 1);

            proxy.set([3,4,5]);
            assert.strictEqual(beforeEvents.length, 3);
            assert.strictEqual(afterEvents.length, 3);
            assert.strictEqual(getEvents.length, 2);
            assert.strictEqual(getEvents[1].property, "set")
            assert.strictEqual(obj[0], 3);

            proxy.copyWithin(3, 1, 3);
            assert.strictEqual(beforeEvents.length, 4);
            assert.strictEqual(afterEvents.length, 4);
            assert.strictEqual(getEvents.length, 3);
            assert.strictEqual(getEvents[2].property, "copyWithin")
            assert.deepEqual(obj, new arrayType([3, 4, 5, 4, 5, 6, 7, 8]));

            proxy.fill(9, 1, 4);
            assert.strictEqual(beforeEvents.length, 5);
            assert.strictEqual(afterEvents.length, 5);
            assert.strictEqual(getEvents.length, 4);
            assert.strictEqual(getEvents[3].property, "fill")
            assert.deepEqual(obj, new arrayType([3, 9, 9, 9, 5, 6, 7, 8]));

            proxy.reverse();
            assert.strictEqual(beforeEvents.length, 6);
            assert.strictEqual(afterEvents.length, 6);
            assert.strictEqual(getEvents.length, 5);
            assert.strictEqual(getEvents[4].property, "reverse")
            assert.deepEqual(obj, new arrayType([8, 7, 6, 5, 9, 9, 9, 3]));

            proxy.sort();
            assert.strictEqual(beforeEvents.length, 7);
            assert.strictEqual(afterEvents.length, 7);
            assert.strictEqual(getEvents.length, 6);
            assert.strictEqual(getEvents[5].property, "sort")
            assert.deepEqual(obj, new arrayType([3, 5, 6, 7, 8, 9, 9, 9]));
        }

        for (let arrayType of BIG_TYPES[Symbol.iterator]()) {
            beforeEvents = [];
            afterEvents = [];
            getEvents = [];

            obj = new arrayType([1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n]);
            proxy = CreateListeningProxy(obj)
                .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                    beforeEvents.push(evt.snapshot);
                })
                .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                    afterEvents.push(evt.snapshot);
                })
                .addListener(EVENT_TYPE_GET_PROPERTY, evt => {
                    getEvents.push(evt.snapshot);
                });

            proxy[0] = 0n;
            assert.strictEqual(beforeEvents.length, 1);
            assert.strictEqual(beforeEvents[0].property, 0);
            assert.strictEqual(beforeEvents[0].value, 0n);
            assert.strictEqual(beforeEvents[0].wasValue, 1n);
            assert.strictEqual(afterEvents.length, 1);
            assert.strictEqual(afterEvents[0].property, 0);
            assert.strictEqual(afterEvents[0].value, 0n);
            assert.strictEqual(afterEvents[0].wasValue, 1n);
            assert.strictEqual(getEvents.length, 0);

            ++proxy[0];
            assert.strictEqual(beforeEvents.length, 2);
            assert.strictEqual(afterEvents.length, 2);
            assert.strictEqual(getEvents.length, 1);
            assert.strictEqual(getEvents[0].property, 0);
            assert.strictEqual(obj[0], 1n);

            proxy.set([3n,4n,5n]);
            assert.strictEqual(beforeEvents.length, 3);
            assert.strictEqual(afterEvents.length, 3);
            assert.strictEqual(getEvents.length, 2);
            assert.strictEqual(getEvents[1].property, "set")
            assert.strictEqual(obj[0], 3n);

            proxy.copyWithin(3, 1, 3);
            assert.strictEqual(beforeEvents.length, 4);
            assert.strictEqual(afterEvents.length, 4);
            assert.strictEqual(getEvents.length, 3);
            assert.strictEqual(getEvents[2].property, "copyWithin")
            assert.deepEqual(obj, new arrayType([3n, 4n, 5n, 4n, 5n, 6n, 7n, 8n]));

            proxy.fill(9n, 1, 4);
            assert.strictEqual(beforeEvents.length, 5);
            assert.strictEqual(afterEvents.length, 5);
            assert.strictEqual(getEvents.length, 4);
            assert.strictEqual(getEvents[3].property, "fill")
            assert.deepEqual(obj, new arrayType([3n, 9n, 9n, 9n, 5n, 6n, 7n, 8n]));

            proxy.reverse();
            assert.strictEqual(beforeEvents.length, 6);
            assert.strictEqual(afterEvents.length, 6);
            assert.strictEqual(getEvents.length, 5);
            assert.strictEqual(getEvents[4].property, "reverse")
            assert.deepEqual(obj, new arrayType([8n, 7n, 6n, 5n, 9n, 9n, 9n, 3n]));

            proxy.sort();
            assert.strictEqual(beforeEvents.length, 7);
            assert.strictEqual(afterEvents.length, 7);
            assert.strictEqual(getEvents.length, 6);
            assert.strictEqual(getEvents[5].property, "sort")
            assert.deepEqual(obj, new arrayType([3n, 5n, 6n, 7n, 8n, 9n, 9n, 9n]));
        }
    })
})