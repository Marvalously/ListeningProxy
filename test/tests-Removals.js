import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS
} from '../src/listening-proxy.js';

describe('Removals (delete, replace property, etc.)', function () {
    it('delete - object no longer fires listeners', function () {
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        const property = proxy.foo;
        // check that changing the object before removing it fires events...
        property.bar.baz.qux = false;
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);
        assert.deepEqual(afterEvents[0].path, ['foo', 'bar', 'baz']);

        // now delete the property...
        delete proxy.foo;
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(afterEvents[1].action, 'deleteProperty');
        assert.strictEqual(afterEvents[1].property, 'foo');
        assert.deepEqual(afterEvents[1].path, []);
        assert.strictEqual(proxy.foo, undefined);

        // and changing again should no longer fire listeners...
        property.bar.baz.qux = false;
        assert.strictEqual(afterEvents.length, 2);
    })

    it('replace property - original object property no longer fires listeners', function () {
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        const property = proxy.foo;
        // check that changing the object before removing it fires events...
        property.bar.baz.qux = false;
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);
        assert.deepEqual(afterEvents[0].path, ['foo', 'bar', 'baz']);

        // now replace the property...
        proxy.foo = null;
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(afterEvents[1].action, 'set');
        assert.strictEqual(afterEvents[1].property, 'foo');
        assert.strictEqual(afterEvents[1].value, null);
        assert.deepEqual(afterEvents[1].path, []);

        // and changing again should no longer fire listeners...
        property.bar.baz.qux = false;
        assert.strictEqual(afterEvents.length, 2);
    })

    it('replace array item - original object item no longer fires listeners', function () {
        const obj = [
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            },
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            },
        ];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        const item = proxy[0];
        // check that changing the object before removing it fires events...
        item.foo.bar.baz.qux = false;
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);
        assert.deepEqual(afterEvents[0].path, [0, 'foo', 'bar', 'baz']);

        // now replace the item...
        proxy[0] = null;
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(afterEvents[1].action, 'set');
        assert.strictEqual(afterEvents[1].property, 0);
        assert.strictEqual(afterEvents[1].value, null);
        assert.deepEqual(afterEvents[1].path, []);

        // and changing again should no longer fire listeners...
        item.foo.bar.baz.qux = false;
        assert.strictEqual(afterEvents.length, 2);
    })
})