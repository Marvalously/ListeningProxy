import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS
} from '../src/listening-proxy.js';

describe('Sets', function () {
    it('proxied set should be seen as set', function () {
        const obj = new Set([1, 'foo', true]);
        const proxy = CreateListeningProxy(obj);

        assert.strictEqual(typeof proxy, 'object');
        assert.isTrue(proxy instanceof Set);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        assert.strictEqual(obj.size, proxy.size);

        const iterator = proxy[Symbol.iterator]();
        checkIterator(iterator, obj.size);
    })

    it('listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Set([1, 'foo', true]);

        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_GET_PROPERTY, evt => {
                getEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
               afterEvents.push(evt.snapshot);
            });

        let has = proxy.has(1);
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'has');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 0);
        assert.strictEqual(afterEvents.length, 0);

        let result = proxy.add(2);
        assert.isTrue(result === proxy);
        assert.strictEqual(getEvents.length, 2);
        assert.strictEqual(getEvents[1].type, 'getProperty');
        assert.strictEqual(getEvents[1].property, 'add');
        assert.strictEqual(typeof getEvents[1].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'add()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.isTrue(beforeEvents[0].wasValue instanceof Set);
        assert.strictEqual(beforeEvents[0].wasValue.size, 3);
        assert.strictEqual(beforeEvents[0].value, undefined);
        assert.strictEqual(afterEvents[0].action, 'add()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.isTrue(afterEvents[0].wasValue instanceof Set);
        assert.strictEqual(afterEvents[0].wasValue.size, 3);
        assert.isTrue(afterEvents[0].value instanceof Set);
        assert.strictEqual(afterEvents[0].value.size, 4);

        result = proxy.delete(2);
        assert.strictEqual(result, true);
        assert.strictEqual(getEvents.length, 3);
        assert.strictEqual(getEvents[2].type, 'getProperty');
        assert.strictEqual(getEvents[2].property, 'delete');
        assert.strictEqual(typeof getEvents[1].result, 'function');
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'delete()');
        assert.strictEqual(beforeEvents[1].arguments.length, 1);
        assert.isTrue(beforeEvents[1].wasValue instanceof Set);
        assert.strictEqual(beforeEvents[1].wasValue.size, 4);
        assert.strictEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(afterEvents[1].action, 'delete()');
        assert.strictEqual(afterEvents[1].arguments.length, 1);
        assert.isTrue(afterEvents[1].wasValue instanceof Set);
        assert.strictEqual(afterEvents[1].wasValue.size, 4);
        assert.isTrue(afterEvents[1].value instanceof Set);
        assert.strictEqual(afterEvents[1].value.size, 3);

        checkIterator(proxy.keys(), obj.size);
        assert.strictEqual(getEvents.length, 4);
        assert.strictEqual(getEvents[3].type, 'getProperty');
        assert.strictEqual(getEvents[3].property, 'keys');
        assert.strictEqual(typeof getEvents[3].result, 'function');
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);

        checkIterator(proxy.values(), obj.size);
        assert.strictEqual(getEvents.length, 5);
        assert.strictEqual(getEvents[4].type, 'getProperty');
        assert.strictEqual(getEvents[4].property, 'values');
        assert.strictEqual(typeof getEvents[4].result, 'function');
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);

        checkIterator(proxy.entries(), obj.size);
        assert.strictEqual(getEvents.length, 6);
        assert.strictEqual(getEvents[5].type, 'getProperty');
        assert.strictEqual(getEvents[5].property, 'entries');
        assert.strictEqual(typeof getEvents[5].result, 'function');
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);

        result = proxy.clear();
        assert.strictEqual(result, undefined);
        assert.strictEqual(getEvents.length, 7);
        assert.strictEqual(getEvents[6].type, 'getProperty');
        assert.strictEqual(getEvents[6].property, 'clear');
        assert.strictEqual(typeof getEvents[6].result, 'function');
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
        assert.strictEqual(beforeEvents[2].action, 'clear()');
        assert.strictEqual(beforeEvents[2].arguments.length, 0);
        assert.isTrue(beforeEvents[2].wasValue instanceof Set);
        assert.strictEqual(beforeEvents[2].wasValue.size, 3);
        assert.strictEqual(afterEvents[2].action, 'clear()');
        assert.strictEqual(afterEvents[2].arguments.length, 0);
        assert.isTrue(afterEvents[2].wasValue instanceof Set);
        assert.strictEqual(afterEvents[2].wasValue.size, 3);
        assert.isTrue(afterEvents[2].value instanceof Set);
        assert.strictEqual(afterEvents[2].value.size, 0);
    })

    it('perform default on before change event works', function () {
        const beforeEvents = [];
        const afterEvents = [];

        const obj = new Set([1, 'foo', true]);

        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                evt.performDefault();
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        let result = proxy.add(2);
        assert.isTrue(result === proxy);
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'add()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.isTrue(beforeEvents[0].wasValue instanceof Set);
        assert.strictEqual(beforeEvents[0].wasValue.size, 3);
        assert.strictEqual(beforeEvents[0].value, undefined);
        assert.strictEqual(beforeEvents[0].defaultPerformed, true);
        assert.strictEqual(afterEvents[0].action, 'add()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.isTrue(afterEvents[0].wasValue instanceof Set);
        assert.strictEqual(afterEvents[0].wasValue.size, 3);
        assert.isTrue(afterEvents[0].value instanceof Set);
        assert.strictEqual(afterEvents[0].value.size, 4);

        result = proxy.delete(2);
        assert.strictEqual(result, true);
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'delete()');
        assert.strictEqual(beforeEvents[1].arguments.length, 1);
        assert.isTrue(beforeEvents[1].wasValue instanceof Set);
        assert.strictEqual(beforeEvents[1].wasValue.size, 4);
        assert.strictEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(beforeEvents[1].defaultPerformed, true);
        assert.strictEqual(afterEvents[1].action, 'delete()');
        assert.strictEqual(afterEvents[1].arguments.length, 1);
        assert.isTrue(afterEvents[1].wasValue instanceof Set);
        assert.strictEqual(afterEvents[1].wasValue.size, 4);
        assert.isTrue(afterEvents[1].value instanceof Set);
        assert.strictEqual(afterEvents[1].value.size, 3);

        result = proxy.clear();
        assert.strictEqual(result, undefined);
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
        assert.strictEqual(beforeEvents[2].action, 'clear()');
        assert.strictEqual(beforeEvents[2].arguments.length, 0);
        assert.isTrue(beforeEvents[2].wasValue instanceof Set);
        assert.strictEqual(beforeEvents[2].wasValue.size, 3);
        assert.strictEqual(beforeEvents[1].defaultPerformed, true);
        assert.strictEqual(afterEvents[2].action, 'clear()');
        assert.strictEqual(afterEvents[2].arguments.length, 0);
        assert.isTrue(afterEvents[2].wasValue instanceof Set);
        assert.strictEqual(afterEvents[2].wasValue.size, 3);
        assert.isTrue(afterEvents[2].value instanceof Set);
        assert.strictEqual(afterEvents[2].value.size, 0);
    })
})

const checkIterator = function(iter, expectedSize) {
    let iterations = 0;
    for (let item of iter) {
        iterations++;
    }
    assert.strictEqual(iterations, expectedSize);
};