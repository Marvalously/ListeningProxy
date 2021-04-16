import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS
} from '../../src/listening-proxy.js';
import SampleClass from "./SampleClass.js";

describe('Class instances', function () {
    it('create proxy on class instances', function () {
        const obj = new SampleClass();
        const proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        proxy.foo = 'baz';
        assert.strictEqual(obj.foo, 'baz');

        // and check that proxy is still an instance of the class...
        assert.isTrue(proxy instanceof SampleClass);
    })

    it('object properties of class instances are proxied', function () {
        const obj = new SampleClass();
        const proxy = CreateListeningProxy(obj);

        const objPty = proxy.objPty;
        assert.isTrue(objPty[SYMBOL_IS_PROXY]);
    })

    it('changing object properties of class instances fires listeners', function () {
        const obj = new SampleClass();
        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        proxy.objPty.foo = 'baz';
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'foo');
        assert.deepEqual(beforeEvents[0].path, ['objPty']);
        assert.strictEqual(beforeEvents[0].value, 'baz');
        assert.strictEqual(beforeEvents[0].wasValue, 'bar');
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'foo');
        assert.deepEqual(afterEvents[0].path, ['objPty']);
        assert.strictEqual(afterEvents[0].value, 'baz');
        assert.strictEqual(afterEvents[0].wasValue, 'bar');

        assert.strictEqual(obj.objPty.foo, 'baz');
        assert.strictEqual(proxy.objPty.foo, 'baz');
    })

    it('calling method on class instance works', function () {
        const obj = new SampleClass();
        const proxy = CreateListeningProxy(obj);

        proxy.doSomething('new value');
        assert.strictEqual(obj.foo, 'new value');
        assert.strictEqual(proxy.foo, 'new value');
    })

    it('calling getter on class instance fires get listener', function () {
        const obj = new SampleClass();
        const getEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_GET_PROPERTY, evt => {
                getEvents.push(evt.snapshot);
            });

        let x = proxy.fooProperty;
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].result, 'bar');
    })

    it('class instance property of object fires listeners', function () {
        const obj = {
            classPty: new SampleClass()
        };
        const getEvents = [];
        const beforeEvents = [];
        const afterEvents = [];
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

        let pty = proxy.classPty;
        assert.strictEqual(getEvents.length, 1);
        assert.isTrue(pty[SYMBOL_IS_PROXY]);

        // getting a property of class instance fires get listeners...
        let x = pty.objPty.foo;
        assert.strictEqual(getEvents.length, 3);
        assert.strictEqual(getEvents[1].property, 'objPty');
        assert.deepEqual(getEvents[1].path, ['classPty']);
        assert.strictEqual(getEvents[2].property, 'foo');
        assert.deepEqual(getEvents[2].path, ['classPty', 'objPty']);

        // changing class instance property fires listeners...
        pty.foo = 'baz';
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'foo');
        assert.deepEqual(beforeEvents[0].path, ['classPty']);
        assert.strictEqual(beforeEvents[0].value, 'baz');
        assert.strictEqual(beforeEvents[0].wasValue, 'bar');

        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'foo');
        assert.deepEqual(afterEvents[0].path, ['classPty']);
        assert.strictEqual(afterEvents[0].value, 'baz');
        assert.strictEqual(afterEvents[0].wasValue, 'bar');

        // replacing class instance property with something else stops listeners firing...
        proxy.classPty = null;
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        pty.foo = 'qux';
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);

        let count = getEvents.length;
        x = pty.objPty.foo;
        assert.strictEqual(getEvents.length, count);
    })

    it('class instance item of array fires listeners', function () {
        const obj = [ new SampleClass() ];
        const getEvents = [];
        const beforeEvents = [];
        const afterEvents = [];
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

        let item = proxy[0];
        assert.strictEqual(getEvents.length, 1);
        assert.isTrue(item[SYMBOL_IS_PROXY]);

        // getting a property of class instance fires get listeners...
        let x = item.objPty.foo;
        assert.strictEqual(getEvents.length, 3);
        assert.strictEqual(getEvents[1].property, 'objPty');
        assert.deepEqual(getEvents[1].path, [0]);
        assert.strictEqual(getEvents[2].property, 'foo');
        assert.deepEqual(getEvents[2].path, [0, 'objPty']);

        // changing class instance property fires listeners...
        item.foo = 'baz';
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'foo');
        assert.deepEqual(beforeEvents[0].path, [0]);
        assert.strictEqual(beforeEvents[0].value, 'baz');
        assert.strictEqual(beforeEvents[0].wasValue, 'bar');

        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'foo');
        assert.deepEqual(afterEvents[0].path, [0]);
        assert.strictEqual(afterEvents[0].value, 'baz');
        assert.strictEqual(afterEvents[0].wasValue, 'bar');

        // replacing class instance property with something else stops listeners firing...
        proxy[0] = null;
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        item.foo = 'qux';
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);

        let count = getEvents.length;
        x = item.objPty.foo;
        assert.strictEqual(getEvents.length, count);
    })
})