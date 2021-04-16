import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS
} from '../../src/listening-proxy.js';

describe('Listeners Basics', function () {
    it('listeners added at create (factory direct)', function () {
        let beforeFired = false;
        let afterFired = false;
        const obj = { foo: 'bar' };
        const proxy = ListeningProxyFactory.create(obj, {
            eventType: EVENT_TYPE_AFTER_CHANGE,
            listener: evt => {
                afterFired = true;
            }
        }, {
            eventType: EVENT_TYPE_BEFORE_CHANGE,
            listener: evt => {
                beforeFired = true;
            }
        });

        proxy.foo = 'baz';
        assert.isTrue(beforeFired, "initial before change listener should have fired");
        assert.isTrue(afterFired, "initial after change listener should have fired");
    })

    it('listeners added at create', function () {
        let beforeFired = false;
        let afterFired = false;
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj, {
            eventType: EVENT_TYPE_AFTER_CHANGE,
            listener: evt => {
                afterFired = true;
            }
        }, {
            eventType: EVENT_TYPE_BEFORE_CHANGE,
            listener: evt => {
                beforeFired = true;
            }
        });

        proxy.foo = 'baz';
        assert.isTrue(beforeFired, "initial before change listener should have fired");
        assert.isTrue(afterFired, "initial after change listener should have fired");
    })

    it('listeners added at create on existing proxy', function () {
        let beforeFired = false;
        let afterFired = false;
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj, {
            eventType: EVENT_TYPE_AFTER_CHANGE,
            listener: evt => {
                afterFired = true;
            }
        });
        const proxy2 = CreateListeningProxy(proxy, {
            eventType: EVENT_TYPE_BEFORE_CHANGE,
            listener: evt => {
                beforeFired = true;
            }
        });

        proxy2.foo = 'baz';
        assert.isTrue(beforeFired, "initial before change listener should have fired");
        assert.isTrue(afterFired, "initial after change listener should have fired");
    })

    it('add listener with bad event type fails', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);
        let firedEvent;

        expect(() => {
            proxy.addListener('foo', evt => {
                firedEvent = evt;
            });
        }).to.throw("Event type 'foo' unknown");
    })

    it('add listener with non-function fails', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);

        expect(() => {
            proxy.addListener(EVENT_TYPE_BEFORE_CHANGE, 'this is not a function!');
        }).to.throw("Listener must be a function");
    })

    it('before and after listeners fire', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);

        let beforeFired = false;
        let afterFired = false;
        let beforeEvent, afterEvent;
        proxy.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            beforeFired = true;
            beforeEvent = evt.snapshot;
        });
        proxy.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            afterFired = true;
            afterEvent = evt.snapshot;
        });

        assert.isFalse(beforeFired);
        assert.isFalse(afterFired);

        proxy.foo = 'baz';

        assert.isTrue(beforeFired);
        assert.isTrue(afterFired);

        assert.strictEqual(beforeEvent.action, 'set');
        assert.strictEqual(beforeEvent.type, EVENT_TYPE_BEFORE_CHANGE);
        assert.strictEqual(beforeEvent.property, 'foo');
        assert.strictEqual(beforeEvent.value, 'baz');
        assert.strictEqual(beforeEvent.wasValue, 'bar');
        assert.deepEqual(beforeEvent.path, []);

        assert.strictEqual(afterEvent.action, 'set');
        assert.strictEqual(afterEvent.type, EVENT_TYPE_AFTER_CHANGE);
        assert.strictEqual(afterEvent.property, 'foo');
        assert.strictEqual(afterEvent.value, 'baz');
        assert.strictEqual(afterEvent.wasValue, 'bar');
        assert.deepEqual(afterEvent.path, []);
    })

    it('prevented default before listener stops after listeners firing', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);

        let doPreventDefault = true;
        let beforeFired = false;
        let afterFired = false;
        let beforeEvent, afterEvent;
        proxy.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            beforeFired = true;
            beforeEvent = evt.snapshot;
            if (doPreventDefault) {
                evt.preventDefault();
            }
        }).addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            afterFired = true;
            afterEvent = evt.snapshot;
        });

        assert.isFalse(beforeFired);
        assert.isFalse(afterFired);

        proxy.foo = 'baz';

        assert.isTrue(beforeFired);
        assert.isFalse(afterFired);

        assert.strictEqual(beforeEvent.action, 'set');
        assert.strictEqual(beforeEvent.type, EVENT_TYPE_BEFORE_CHANGE);
        assert.strictEqual(beforeEvent.property, 'foo');
        assert.strictEqual(beforeEvent.value, 'baz');
        assert.strictEqual(beforeEvent.wasValue, 'bar');
        assert.deepEqual(beforeEvent.path, []);

        beforeFired = false;
        doPreventDefault = false;

        proxy.foo = 'baz';

        assert.isTrue(beforeFired);
        assert.isTrue(afterFired);

        assert.strictEqual(afterEvent.action, 'set');
        assert.strictEqual(afterEvent.type, EVENT_TYPE_AFTER_CHANGE);
        assert.strictEqual(afterEvent.property, 'foo');
        assert.strictEqual(afterEvent.value, 'baz');
        assert.strictEqual(afterEvent.wasValue, 'bar');
        assert.deepEqual(afterEvent.path, []);
    })

    it('get listener fires', function () {
        const obj = { foo: 'bar' };
        const proxy = CreateListeningProxy(obj);

        let getFired = false;
        let getEvent;
        proxy.addListener(EVENT_TYPE_GET_PROPERTY, evt => {
            getFired = true;
            getEvent = evt.snapshot;
        });

        assert.isFalse(getFired);

        let value = proxy.foo;

        assert.isTrue(getFired);

        assert.strictEqual(getEvent.property, 'foo');
        assert.strictEqual(getEvent.type, EVENT_TYPE_GET_PROPERTY);
        assert.strictEqual(getEvent.result, 'bar');
        assert.deepEqual(getEvent.path, []);
    })

    it('before and after listeners fire on deep', function () {
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj);

        let beforeFired = false;
        let afterFired = false;
        let beforeEvent, afterEvent;
        proxy.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            beforeFired = true;
            beforeEvent = evt.snapshot;
        }).addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            afterFired = true;
            afterEvent = evt.snapshot;
        });

        assert.isFalse(beforeFired);
        assert.isFalse(afterFired);

        proxy.foo.bar.baz.qux = false;

        assert.isTrue(beforeFired);
        assert.isTrue(afterFired);

        assert.strictEqual(beforeEvent.action, 'set');
        assert.strictEqual(beforeEvent.property, 'qux');
        assert.strictEqual(beforeEvent.value, false);
        assert.strictEqual(beforeEvent.wasValue, true);
        assert.deepEqual(beforeEvent.path, ['foo', 'bar', 'baz']);

        assert.strictEqual(afterEvent.action, 'set');
        assert.strictEqual(afterEvent.property, 'qux');
        assert.strictEqual(afterEvent.value, false);
        assert.strictEqual(afterEvent.wasValue, true);
        assert.deepEqual(afterEvent.path, ['foo', 'bar', 'baz']);
    })

    it('before and after listeners fire on deep (arrays)', function () {
        const obj = [
            {
                foo: [
                    {
                        bar: [
                            {
                                baz: true
                            },
                            {
                                baz: true
                            }
                        ]
                    },
                    {
                        bar: [
                            {
                                baz: true
                            },
                            {
                                baz: true
                            }
                        ]
                    }
                ]
            },
            {
                foo: [
                    {
                        bar: [
                            {
                                baz: true
                            },
                            {
                                baz: true
                            }
                        ]
                    },
                    {
                        bar: [
                            {
                                baz: true
                            },
                            {
                                baz: true
                            }
                        ]
                    }
                ]
            }
        ];
        const proxy = CreateListeningProxy(obj);

        let beforeFired = false;
        let afterFired = false;
        let beforeEvent, afterEvent;
        proxy.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            beforeFired = true;
            beforeEvent = evt.snapshot;
        }).addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            afterFired = true;
            afterEvent = evt.snapshot;
        });

        assert.isFalse(beforeFired);
        assert.isFalse(afterFired);

        proxy[0].foo[0].bar[1].baz = false;

        assert.isTrue(beforeFired);
        assert.isTrue(afterFired);

        assert.strictEqual(beforeEvent.action, 'set');
        assert.strictEqual(beforeEvent.property, 'baz');
        assert.strictEqual(beforeEvent.value, false);
        assert.strictEqual(beforeEvent.wasValue, true);
        assert.deepEqual(beforeEvent.path, [0, 'foo', 0, 'bar', 1]);

        assert.strictEqual(afterEvent.action, 'set');
        assert.strictEqual(afterEvent.property, 'baz');
        assert.strictEqual(afterEvent.value, false);
        assert.strictEqual(afterEvent.wasValue, true);
        assert.deepEqual(afterEvent.path, [0, 'foo', 0, 'bar', 1]);
    })

    it('detached properties do not fire listeners', function () {
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj);

        const afterEvents = [];
        proxy.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            afterEvents.push(evt.snapshot);
        });

        const oldBaz = proxy.foo.bar.baz;
        oldBaz.qux = false;

        // should be one set event...
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);
        assert.deepEqual(afterEvents[0].path, ['foo', 'bar', 'baz']);

        // now delete (detach) the 'baz' property...
        delete proxy.foo.bar.baz;
        // and there should be another (deleteProperty) event...
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(afterEvents[1].action, 'deleteProperty');
        assert.strictEqual(afterEvents[1].property, 'baz');
        assert.strictEqual(afterEvents[1].value, undefined);
        assert.deepEqual(afterEvents[1].wasValue, { qux: false });
        assert.deepEqual(afterEvents[1].path, ['foo', 'bar']);

        // changing the object that is no longer attached should no longer fire events...
        oldBaz.qux = true;
        assert.strictEqual(afterEvents.length, 2);
    })

    it('adding proxied object property to another proxy fires listeners in both', function () {
        const mainObj = {
            foo: 'bar'
        };
        const mainEvents = [];
        const subEvents = [];
        const mainProxy = CreateListeningProxy(mainObj);
        mainProxy.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            mainEvents.push(evt.snapshot);
        });
        const subObj = {
            bar: {
                baz: {
                    qux: true
                }
            }
        };
        const subProxy = CreateListeningProxy(subObj);
        subProxy.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            subEvents.push(evt.snapshot);
        });

        // add the sub object as a property of the main object...
        mainProxy.foo = subProxy;
        // and there should now be one event on the main...
        assert.strictEqual(subEvents.length, 0);
        assert.strictEqual(mainEvents.length, 1);
        assert.strictEqual(mainEvents[0].action, 'set');
        assert.strictEqual(mainEvents[0].property, 'foo');
        assert.strictEqual(mainEvents[0].wasValue, 'bar');
        assert.strictEqual(mainEvents[0].value, subProxy);
        assert.deepEqual(mainEvents[0].path, []);

        // now change a property in the sub proxy...
        subProxy.bar.baz.qux = false;
        // and there should now be one event on the sub and another event on the main...
        assert.strictEqual(subEvents.length, 1);
        assert.strictEqual(mainEvents.length, 2);
        assert.strictEqual(mainEvents[1].action, 'set');
        assert.strictEqual(mainEvents[1].property, 'qux');
        assert.strictEqual(mainEvents[1].wasValue, true);
        assert.strictEqual(mainEvents[1].value, false);
        assert.deepEqual(mainEvents[1].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(subEvents[0].action, 'set');
        assert.strictEqual(subEvents[0].property, 'qux');
        assert.strictEqual(subEvents[0].wasValue, true);
        assert.strictEqual(subEvents[0].value, false);
        assert.deepEqual(subEvents[0].path, ['bar', 'baz']); // nb. path is relative to changed object!
    })

    it('same object in multiple paths of object tree causes multiple event firing (with different paths)', function () {
        const sameObject = {
            bar: {
                baz: {
                    qux: true
                }
            }
        };
        const mainObj = {
            foo1: sameObject,
            foo2: sameObject,
            foo3: [sameObject, sameObject]
        };
        const afterEvents = [];
        const proxy = CreateListeningProxy(mainObj)
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        mainObj.foo1.bar.baz.qux = false;
        assert.strictEqual(afterEvents.length, 4);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, ['foo1', 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);
        assert.deepEqual(afterEvents[1].path, ['foo2', 'bar', 'baz']);
        assert.deepEqual(afterEvents[2].path, ['foo3', 0, 'bar', 'baz']);
        assert.deepEqual(afterEvents[3].path, ['foo3', 1, 'bar', 'baz']);
    })
})