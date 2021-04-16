import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS
} from '../../src/listening-proxy.js';

describe('Maps', function () {
    it('proxied map should be seen as map', function () {
        const obj = new Map([
            [1, 'first-item'],
            ['foo', 'second-item'],
            [true, 'third-item']
        ]);
        const proxy = CreateListeningProxy(obj);

        assert.strictEqual(typeof proxy, 'object');
        assert.isTrue(proxy instanceof Map);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
        assert.strictEqual(obj.size, proxy.size);

        checkIterator(proxy[Symbol.iterator](), obj.size);
        checkOrdering(proxy, [1, 'foo', true]);
    })

    it('values of proxied map should be proxied', function () {
        const obj = new Map([
            [1, {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }],
            ['foo', 'second-item'],
            [true, {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }]
        ]);
        const proxy = CreateListeningProxy(obj);
        checkIterator(proxy[Symbol.iterator](), obj.size);
        checkOrdering(proxy, [1, 'foo', true]);

        let item = proxy.get(1);
        assert.isTrue(item[SYMBOL_IS_PROXY]);
        item = proxy.get(true);
        assert.isTrue(item[SYMBOL_IS_PROXY]);
    })

    it('altering values fires listeners', function () {
        const changeEvents = [];
        const obj = new Map([
            [1, {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }],
            ['foo', 'second-item'],
            [true, {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }]
        ]);
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-after';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-after';
                changeEvents.push(snapshot);
            });

        proxy.get(true).foo.bar.baz.qux = false;

        assert.strictEqual(changeEvents.length, 4);
        assert.strictEqual(changeEvents[0].type, EVENT_TYPE_BEFORE_CHANGE);
        assert.strictEqual(changeEvents[0].order, 'first-before');
        assert.strictEqual(changeEvents[0].action, 'set');
        assert.strictEqual(changeEvents[0].property, 'qux');
        assert.deepEqual(changeEvents[0].path, [true, 'foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[1].type, EVENT_TYPE_BEFORE_CHANGE);
        assert.strictEqual(changeEvents[1].order, 'second-before');
        assert.strictEqual(changeEvents[1].action, 'set');
        assert.strictEqual(changeEvents[1].property, 'qux');
        assert.deepEqual(changeEvents[1].path, [true, 'foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[2].type, EVENT_TYPE_AFTER_CHANGE);
        assert.strictEqual(changeEvents[2].order, 'first-after');
        assert.strictEqual(changeEvents[2].action, 'set');
        assert.strictEqual(changeEvents[2].property, 'qux');
        assert.deepEqual(changeEvents[2].path, [true, 'foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[3].type, EVENT_TYPE_AFTER_CHANGE);
        assert.strictEqual(changeEvents[3].order, 'second-after');
        assert.strictEqual(changeEvents[3].action, 'set');
        assert.strictEqual(changeEvents[3].property, 'qux');
        assert.deepEqual(changeEvents[3].path, [true, 'foo', 'bar', 'baz']);
    })

    it('clear - altering values no longer fires listeners', function () {
        const changeEvents = [];
        const obj = new Map([
            [1, {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }],
            ['foo', 'second-item'],
            [true, {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }]
        ]);
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-after';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-after';
                changeEvents.push(snapshot);
            });

        // check that events are fired before clearing...
        proxy.get(true).foo.bar.baz.qux = false;
        proxy.get(1).foo.bar.baz.qux = false;
        assert.strictEqual(changeEvents.length, 8);

        // grab the values and then clear...
        const firstValue = proxy.get(1);
        const secondValue = proxy.get(true);

        // now clear...
        proxy.clear();
        assert.strictEqual(proxy.size, 0);
        assert.strictEqual(obj.size, 0);
        assert.strictEqual(changeEvents.length, 12);
        assert.strictEqual(changeEvents[8].action, 'clear()');
        assert.strictEqual(changeEvents[8].order, 'first-before');
        assert.strictEqual(changeEvents[9].action, 'clear()');
        assert.strictEqual(changeEvents[9].order, 'second-before');
        assert.strictEqual(changeEvents[10].action, 'clear()');
        assert.strictEqual(changeEvents[10].order, 'first-after');
        assert.strictEqual(changeEvents[11].action, 'clear()');
        assert.strictEqual(changeEvents[11].order, 'second-after');

        //  and changing values should no longer fire listeners...
        firstValue.foo.bar.baz.qux = true;
        secondValue.foo.bar.baz.qux = true;
        assert.strictEqual(changeEvents.length, 12);
    })

    it('delete - removed value no longer fires listeners', function () {
        const changeEvents = [];
        const obj = new Map([
            [1, {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }],
            ['foo', 'second-item'],
            [true, {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }]
        ]);
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-after';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-after';
                changeEvents.push(snapshot);
            });

        // check that events are fired before clearing...
        proxy.get(true).foo.bar.baz.qux = false;
        proxy.get(1).foo.bar.baz.qux = false;
        assert.strictEqual(changeEvents.length, 8);

        // grab the value...
        const firstValue = proxy.get(1);

        // now delete that key...
        proxy.delete(1);
        checkOrdering(proxy, ['foo', true]);
        assert.strictEqual(proxy.size, 2);
        assert.strictEqual(obj.size, 2);
        assert.strictEqual(changeEvents.length, 12);
        assert.strictEqual(changeEvents[8].action, 'delete()');
        assert.strictEqual(changeEvents[8].order, 'first-before');
        assert.strictEqual(changeEvents[9].action, 'delete()');
        assert.strictEqual(changeEvents[9].order, 'second-before');
        assert.strictEqual(changeEvents[10].action, 'delete()');
        assert.strictEqual(changeEvents[10].order, 'first-after');
        assert.strictEqual(changeEvents[11].action, 'delete()');
        assert.strictEqual(changeEvents[11].order, 'second-after');

        firstValue.foo.bar.baz.qux = true;
        assert.strictEqual(changeEvents.length, 12);
    })

    it('set - added value is proxied and fires listeners', function () {
        const changeEvents = [];
        const obj = new Map();
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-after';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-after';
                changeEvents.push(snapshot);
            });

        let result = proxy.set(1, {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        });
        assert.strictEqual(result, proxy);
        assert.strictEqual(changeEvents.length, 4);
        assert.strictEqual(changeEvents[0].action, 'set()');
        assert.strictEqual(changeEvents[0].order, 'first-before');
        assert.strictEqual(changeEvents[0].value.size, 1);
        assert.strictEqual(changeEvents[0].wasValue.size, 0);
        assert.strictEqual(changeEvents[1].action, 'set()');
        assert.strictEqual(changeEvents[1].order, 'second-before');
        assert.strictEqual(changeEvents[1].value.size, 1);
        assert.strictEqual(changeEvents[1].wasValue.size, 0);
        assert.strictEqual(changeEvents[2].action, 'set()');
        assert.strictEqual(changeEvents[2].order, 'first-after');
        assert.strictEqual(changeEvents[2].value.size, 1);
        assert.strictEqual(changeEvents[2].wasValue.size, 0);
        assert.strictEqual(changeEvents[3].action, 'set()');
        assert.strictEqual(changeEvents[3].order, 'second-after');
        assert.strictEqual(changeEvents[3].value.size, 1);
        assert.strictEqual(changeEvents[3].wasValue.size, 0);

        // grab the value...
        const addedValue = proxy.get(1);
        assert.isTrue(addedValue[SYMBOL_IS_PROXY]);
        // and change it...
        addedValue.foo.bar.baz.qux = false;
        assert.strictEqual(changeEvents.length, 8);
        assert.strictEqual(changeEvents[4].action, 'set');
        assert.strictEqual(changeEvents[4].order, 'first-before');
        assert.strictEqual(changeEvents[4].property, 'qux');
        assert.deepEqual(changeEvents[4].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[5].action, 'set');
        assert.strictEqual(changeEvents[5].order, 'second-before');
        assert.strictEqual(changeEvents[5].property, 'qux');
        assert.deepEqual(changeEvents[5].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[6].action, 'set');
        assert.strictEqual(changeEvents[6].order, 'first-after');
        assert.strictEqual(changeEvents[6].property, 'qux');
        assert.deepEqual(changeEvents[6].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[7].action, 'set');
        assert.strictEqual(changeEvents[7].order, 'second-after');
        assert.strictEqual(changeEvents[7].property, 'qux');
        assert.deepEqual(changeEvents[7].path, [1, 'foo', 'bar', 'baz']);
    })

    it('set - replaced value no longer fires listeners', function () {
        const changeEvents = [];
        const obj = new Map([
            ['A', {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }]
        ]);
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'first-after';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'second-after';
                changeEvents.push(snapshot);
            });

        // grab the original value before replacing it...
        const originalValue = proxy.get('A');

        // and replace it...
        let result = proxy.set('A', null);
        assert.strictEqual(result, proxy);
        assert.strictEqual(changeEvents.length, 4);
        assert.strictEqual(changeEvents[0].action, 'set()');
        assert.strictEqual(changeEvents[0].order, 'first-before');
        assert.strictEqual(changeEvents[0].value.size, 1);
        assert.strictEqual(changeEvents[0].wasValue.size, 1);
        assert.strictEqual(changeEvents[1].action, 'set()');
        assert.strictEqual(changeEvents[1].order, 'second-before');
        assert.strictEqual(changeEvents[1].value.size, 1);
        assert.strictEqual(changeEvents[1].wasValue.size, 1);
        assert.strictEqual(changeEvents[2].action, 'set()');
        assert.strictEqual(changeEvents[2].order, 'first-after');
        assert.strictEqual(changeEvents[2].value.size, 1);
        assert.strictEqual(changeEvents[2].wasValue.size, 1);
        assert.strictEqual(changeEvents[3].action, 'set()');
        assert.strictEqual(changeEvents[3].order, 'second-after');
        assert.strictEqual(changeEvents[3].value.size, 1);
        assert.strictEqual(changeEvents[3].wasValue.size, 1);

        // now changing the original value should no longer fire listeners...
        originalValue.foo.bar.baz.qux = true;
        assert.strictEqual(changeEvents.length, 4);
    })

    it('same object as multiple values fires multiple listeners', function () {
        const changeEvents = [];
        const sameObj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }            
        };
        const sameProxy = CreateListeningProxy(sameObj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'same-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'same-after';
                changeEvents.push(snapshot);
            });
        const obj = new Map([
            ['A', sameProxy],
            ['B', sameProxy]
        ]);
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'main-before';
                changeEvents.push(snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'main-after';
                changeEvents.push(snapshot);
            });
        assert.strictEqual(changeEvents.length, 0);

        sameProxy.foo.bar.baz.qux = false;
        assert.strictEqual(changeEvents.length, 6);
        assert.strictEqual(changeEvents[0].order, 'same-before');
        assert.deepEqual(changeEvents[0].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[1].order, 'main-before');
        assert.deepEqual(changeEvents[1].path, ['A', 'foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[2].order, 'main-before');
        assert.deepEqual(changeEvents[2].path, ['B', 'foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[3].order, 'same-after');
        assert.deepEqual(changeEvents[3].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[4].order, 'main-after');
        assert.deepEqual(changeEvents[4].path, ['A', 'foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[5].order, 'main-after');
        assert.deepEqual(changeEvents[5].path, ['B', 'foo', 'bar', 'baz']);
    })
})

const checkIterator = function(iter, expectedSize) {
    let iterations = 0;
    for (let item of iter) {
        iterations++;
    }
    assert.strictEqual(iterations, expectedSize);
};

const checkOrdering = function(map, expectedKeyOrder) {
    assert.strictEqual(map.size, expectedKeyOrder.length);
    let i = 0;
    for (let key of map.keys()) {
        assert.strictEqual(key, expectedKeyOrder[i]);
        i++;
    }
}