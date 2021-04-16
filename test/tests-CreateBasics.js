import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS
} from '../src/listening-proxy.js';

describe('Create Basics', function () {
    it('create proxy', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);

        assert.deepEqual(obj, proxy, "the proxy and the object should be equal");

        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
    })

    it('re-creating proxy returns original', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);
        const proxy2 = CreateListeningProxy(proxy);

        assert.strictEqual(proxy, proxy2, "both proxies should be the same");
    })

    it('changing proxy changes underlying object', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);

        proxy.foo = 'baz';
        assert.strictEqual(obj.foo, 'baz');
    })

    it('cannot change protected properties on proxy', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);

        expect(() => {
            proxy['addListener'] = null;
        }).to.throw("Property 'addListener' cannot be set on listening proxy");

        expect(() => {
            proxy['removeListener'] = null;
        }).to.throw("Property 'removeListener' cannot be set on listening proxy");

        expect(() => {
            proxy[SYMBOL_IS_PROXY] = null;
        }).to.throw("Protected symbols cannot be set on listening proxy");

        expect(() => {
            proxy[SYMBOL_PROXY_TARGET] = null;
        }).to.throw("Protected symbols cannot be set on listening proxy");

        expect(() => {
            proxy[SYMBOL_PROXY_LISTENERS] = null;
        }).to.throw("Protected symbols cannot be set on listening proxy");
    })

    it('cannot delete protected properties on proxy', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);

        expect(() => {
            delete proxy.addListener;
        }).to.throw("Property 'addListener' cannot be deleted on listening proxy");

        expect(() => {
            delete proxy.removeListener;
        }).to.throw("Property 'removeListener' cannot be deleted on listening proxy");

        expect(() => {
            delete proxy[SYMBOL_IS_PROXY];
        }).to.throw("Protected symbols cannot be deleted on listening proxy");

        expect(() => {
            delete proxy[SYMBOL_PROXY_TARGET];
        }).to.throw("Protected symbols cannot be deleted on listening proxy");

        expect(() => {
            delete proxy[SYMBOL_PROXY_LISTENERS];
        }).to.throw("Protected symbols cannot be deleted on listening proxy");
    })

    it('create proxy on objects and arrays works', function () {
        let obj = { foo: 'bar' };
        let proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        proxy.foo = 'baz';
        assert.strictEqual(obj.foo, 'baz');

        obj = ['foo', 'bar'];
        proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        proxy[0] = 'baz';
        assert.strictEqual(obj[0], 'baz');
    })

    it('create proxy on Date, Set and Map works', function () {
        let obj = new Date('2021-04-01T18:00:00');
        let proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        proxy.setHours(20);
        assert.strictEqual(obj.getHours(), 20);

        obj = new Map();
        proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        proxy.set('foo', 'bar');
        assert.isTrue(obj.has('foo'))
        assert.strictEqual(obj.get('foo'), 'bar');

        obj = new Set();
        proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        proxy.add('foo');
        assert.isTrue(obj.has('foo'));
    })

    it('create proxy on non-objects fails', function () {
        expect(() => {
            CreateListeningProxy(1);
        }).to.throw("ListeningProxy can only be created on objects or arrays");

        expect(() => {
            CreateListeningProxy("");
        }).to.throw("ListeningProxy can only be created on objects or arrays");

        expect(() => {
            CreateListeningProxy(true);
        }).to.throw("ListeningProxy can only be created on objects or arrays");

        expect(() => {
            CreateListeningProxy(undefined);
        }).to.throw("ListeningProxy can only be created on objects or arrays");
    })

    it('properties should be proxies', function () {
        let obj = { foo: { bar: 'baz' }};
        let proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        let pty = proxy.foo;
        assert.isTrue(pty[SYMBOL_IS_PROXY]);

        obj = { foo: [ 'bar', 'baz' ]};
        proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        pty = proxy.foo;
        assert.isTrue(pty[SYMBOL_IS_PROXY]);

        obj = [{ foo: 'bar' }, { foo: 'bar' }];
        proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        pty = proxy[0];
        assert.isTrue(pty[SYMBOL_IS_PROXY]);
    })

    it('deep properties should also be proxies', function () {
        let obj = { foo: { bar: { baz: { qux: true }}}};
        let proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        let pty = proxy.foo.bar.baz;
        assert.isTrue(pty[SYMBOL_IS_PROXY]);

        obj = { foo: { bar: { baz: ['qux']}}};
        proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        pty = proxy.foo.bar.baz;
        assert.isTrue(pty[SYMBOL_IS_PROXY]);
        assert.isTrue(Array.isArray(pty));

        obj = [{ foo: { bar: { baz: { qux: true }}}}, { foo: { bar: { baz: { qux: true }}}}];
        proxy = CreateListeningProxy(obj);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        pty = proxy[0];
        assert.isTrue(pty[SYMBOL_IS_PROXY]);
        pty = pty.foo.bar.baz;
        assert.isTrue(pty[SYMBOL_IS_PROXY]);
    })
})
