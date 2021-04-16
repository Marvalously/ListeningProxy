import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS, EVENT_TYPE_EXCEPTION_HANDLER
} from '../src/listening-proxy.js';

describe('Listeners Extended (event ordering, propagation, defaults etc.)', function () {
    it('change listeners fire in correct order', function () {
        let changeEvents = [];
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj,
            {
                eventType: EVENT_TYPE_AFTER_CHANGE,
                listener: evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-after';
                    changeEvents.push(snapshot);
                }
            },
            {
                eventType: EVENT_TYPE_BEFORE_CHANGE,
                listener: evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-before';
                    changeEvents.push(snapshot);
                }
            },
            {
                eventType: EVENT_TYPE_AFTER_CHANGE,
                listener: evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-after';
                    changeEvents.push(snapshot);
                }
            },
            {
                eventType: EVENT_TYPE_BEFORE_CHANGE,
                listener: evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-before';
                    changeEvents.push(snapshot);
                }
            });
        proxy.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'third-before';
            changeEvents.push(snapshot);
        });
        proxy.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'third-after';
            changeEvents.push(snapshot);
        });

        proxy.foo.bar.baz.qux = false;
        assert.strictEqual(changeEvents.length, 6);
        assert.strictEqual(changeEvents[0].order, 'first-before');
        assert.strictEqual(changeEvents[1].order, 'second-before');
        assert.strictEqual(changeEvents[2].order, 'third-before');
        assert.strictEqual(changeEvents[3].order, 'first-after');
        assert.strictEqual(changeEvents[4].order, 'second-after');
        assert.strictEqual(changeEvents[5].order, 'third-after');

        changeEvents = [];
        proxy.foo.bar.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'fourth-before';
            changeEvents.push(snapshot);
        });
        proxy.foo.bar.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'fourth-after';
            changeEvents.push(snapshot);
        });
        proxy.foo.bar.baz.qux = true;
        assert.strictEqual(changeEvents.length, 8);
        // event listeners deeper in tree get fired first...
        assert.strictEqual(changeEvents[0].order, 'fourth-before');
        assert.strictEqual(changeEvents[1].order, 'first-before');
        assert.strictEqual(changeEvents[2].order, 'second-before');
        assert.strictEqual(changeEvents[3].order, 'third-before');
        assert.strictEqual(changeEvents[4].order, 'fourth-after');
        assert.strictEqual(changeEvents[5].order, 'first-after');
        assert.strictEqual(changeEvents[6].order, 'second-after');
        assert.strictEqual(changeEvents[7].order, 'third-after');

        changeEvents = [];
        proxy.foo.bar.baz.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'fifth-before';
            changeEvents.push(snapshot);
        });
        proxy.foo.bar.baz.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'fifth-after';
            changeEvents.push(snapshot);
        });
        proxy.foo.bar.baz.qux = true;
        assert.strictEqual(changeEvents.length, 10);
        assert.strictEqual(changeEvents[0].order, 'fifth-before');
        assert.strictEqual(changeEvents[1].order, 'fourth-before');
        assert.strictEqual(changeEvents[2].order, 'first-before');
        assert.strictEqual(changeEvents[3].order, 'second-before');
        assert.strictEqual(changeEvents[4].order, 'third-before');
        assert.strictEqual(changeEvents[5].order, 'fifth-after');
        assert.strictEqual(changeEvents[6].order, 'fourth-after');
        assert.strictEqual(changeEvents[7].order, 'first-after');
        assert.strictEqual(changeEvents[8].order, 'second-after');
        assert.strictEqual(changeEvents[9].order, 'third-after');
    })

    it('change listeners fire in correct order (factory)', function () {
        let changeEvents = [];
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = ListeningProxyFactory.create(obj,
            {
                eventType: EVENT_TYPE_AFTER_CHANGE,
                listener: evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-after';
                    changeEvents.push(snapshot);
                }
            },
            {
                eventType: EVENT_TYPE_BEFORE_CHANGE,
                listener: evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-before';
                    changeEvents.push(snapshot);
                }
            },
            {
                eventType: EVENT_TYPE_AFTER_CHANGE,
                listener: evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-after';
                    changeEvents.push(snapshot);
                }
            },
            {
                eventType: EVENT_TYPE_BEFORE_CHANGE,
                listener: evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-before';
                    changeEvents.push(snapshot);
                }
            });
        proxy.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'third-before';
            changeEvents.push(snapshot);
        });
        proxy.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'third-after';
            changeEvents.push(snapshot);
        });

        proxy.foo.bar.baz.qux = false;
        assert.strictEqual(changeEvents.length, 6);
        assert.strictEqual(changeEvents[0].order, 'first-before');
        assert.strictEqual(changeEvents[1].order, 'second-before');
        assert.strictEqual(changeEvents[2].order, 'third-before');
        assert.strictEqual(changeEvents[3].order, 'first-after');
        assert.strictEqual(changeEvents[4].order, 'second-after');
        assert.strictEqual(changeEvents[5].order, 'third-after');

        changeEvents = [];
        proxy.foo.bar.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'fourth-before';
            changeEvents.push(snapshot);
        });
        proxy.foo.bar.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'fourth-after';
            changeEvents.push(snapshot);
        });
        proxy.foo.bar.baz.qux = true;
        assert.strictEqual(changeEvents.length, 8);
        // event listeners deeper in tree get fired first...
        assert.strictEqual(changeEvents[0].order, 'fourth-before');
        assert.strictEqual(changeEvents[1].order, 'first-before');
        assert.strictEqual(changeEvents[2].order, 'second-before');
        assert.strictEqual(changeEvents[3].order, 'third-before');
        assert.strictEqual(changeEvents[4].order, 'fourth-after');
        assert.strictEqual(changeEvents[5].order, 'first-after');
        assert.strictEqual(changeEvents[6].order, 'second-after');
        assert.strictEqual(changeEvents[7].order, 'third-after');

        changeEvents = [];
        proxy.foo.bar.baz.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'fifth-before';
            changeEvents.push(snapshot);
        });
        proxy.foo.bar.baz.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
            let snapshot = evt.snapshot;
            snapshot.order = 'fifth-after';
            changeEvents.push(snapshot);
        });
        proxy.foo.bar.baz.qux = true;
        assert.strictEqual(changeEvents.length, 10);
        assert.strictEqual(changeEvents[0].order, 'fifth-before');
        assert.strictEqual(changeEvents[1].order, 'fourth-before');
        assert.strictEqual(changeEvents[2].order, 'first-before');
        assert.strictEqual(changeEvents[3].order, 'second-before');
        assert.strictEqual(changeEvents[4].order, 'third-before');
        assert.strictEqual(changeEvents[5].order, 'fifth-after');
        assert.strictEqual(changeEvents[6].order, 'fourth-after');
        assert.strictEqual(changeEvents[7].order, 'first-after');
        assert.strictEqual(changeEvents[8].order, 'second-after');
        assert.strictEqual(changeEvents[9].order, 'third-after');
    })

    it('propagation stops', function () {
        let doStopPropagation = true;
        let changeEvents = [];
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-before';
                    changeEvents.push(snapshot);
                    if (doStopPropagation) {
                        evt.stopPropagation();
                    }
                })
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-before';
                    changeEvents.push(snapshot);
                    if (doStopPropagation) {
                        evt.stopPropagation();
                    }
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-after';
                    changeEvents.push(snapshot);
                    if (doStopPropagation) {
                        evt.stopPropagation();
                    }
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-after';
                    changeEvents.push(snapshot);
                    if (doStopPropagation) {
                        evt.stopPropagation();
                    }
                });

        proxy.foo.bar.baz.qux = false;
        assert.strictEqual(changeEvents.length, 2);
        assert.strictEqual(changeEvents[0].order, 'first-before');
        assert.strictEqual(changeEvents[1].order, 'first-after');

        // now turn off the stopping of propagation - and ensure we get all the events...
        changeEvents = [];
        doStopPropagation = false;
        proxy.foo.bar.baz.qux = false;
        assert.strictEqual(changeEvents.length, 4);
        assert.strictEqual(changeEvents[0].order, 'first-before');
        assert.strictEqual(changeEvents[1].order, 'second-before');
        assert.strictEqual(changeEvents[2].order, 'first-after');
        assert.strictEqual(changeEvents[3].order, 'second-after');

        // add a listener deeper in the tree...
        proxy.foo.bar.baz.addListener(EVENT_TYPE_BEFORE_CHANGE,
            evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'third-before';
                changeEvents.push(snapshot);
                if (doStopPropagation) {
                    evt.stopPropagation();
                }
            }).addListener(EVENT_TYPE_AFTER_CHANGE,
            evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'third-after';
                changeEvents.push(snapshot);
                if (doStopPropagation) {
                    evt.stopPropagation();
                }
            });

        changeEvents = [];
        proxy.foo.bar.baz.qux = false;
        assert.strictEqual(changeEvents.length, 6);
        assert.strictEqual(changeEvents[0].order, 'third-before');
        assert.strictEqual(changeEvents[1].order, 'first-before');
        assert.strictEqual(changeEvents[2].order, 'second-before');
        assert.strictEqual(changeEvents[3].order, 'third-after');
        assert.strictEqual(changeEvents[4].order, 'first-after');
        assert.strictEqual(changeEvents[5].order, 'second-after');

        // and turn on again the stopping of propagation - we should only see 2 events...
        changeEvents = [];
        doStopPropagation = true;
        proxy.foo.bar.baz.qux = true;
        assert.strictEqual(changeEvents.length, 2);
        assert.strictEqual(changeEvents[0].order, 'third-before');
        assert.strictEqual(changeEvents[1].order, 'third-after');
    })

    it('prevented before change event stops after change events', function () {
        let doPreventDefault = true;
        let changeEvents = [];
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-before';
                    changeEvents.push(snapshot);
                    if (doPreventDefault) {
                        evt.preventDefault();
                    }
                })
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-before';
                    changeEvents.push(snapshot);
                    if (doPreventDefault) {
                        evt.preventDefault();
                    }
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-after';
                    changeEvents.push(snapshot);
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-after';
                    changeEvents.push(snapshot);
                });

        proxy.foo.bar.baz.qux = false;
        assert.isTrue(obj.foo.bar.baz.qux);
        assert.isTrue(proxy.foo.bar.baz.qux);
        assert.strictEqual(changeEvents.length, 2);
        assert.strictEqual(changeEvents[0].order, 'first-before');
        assert.strictEqual(changeEvents[0].defaultPrevented, false);
        assert.strictEqual(changeEvents[1].order, 'second-before');
        assert.strictEqual(changeEvents[1].defaultPrevented, true);

        // now turn off the default prevention and we should see all events again...
        doPreventDefault = false;
        changeEvents = [];
        proxy.foo.bar.baz.qux = false;
        assert.isFalse(obj.foo.bar.baz.qux);
        assert.isFalse(proxy.foo.bar.baz.qux);
        assert.strictEqual(changeEvents.length, 4);
        assert.strictEqual(changeEvents[0].order, 'first-before');
        assert.strictEqual(changeEvents[0].defaultPrevented, false);
        assert.strictEqual(changeEvents[1].order, 'second-before');
        assert.strictEqual(changeEvents[1].defaultPrevented, false);
        assert.strictEqual(changeEvents[2].order, 'first-after');
        assert.strictEqual(changeEvents[3].order, 'second-after');
    })

    it('get property listeners fire in correct order', function () {
        let getEvents = [];
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_GET_PROPERTY,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-get';
                    getEvents.push(snapshot);
                })
            .addListener(EVENT_TYPE_GET_PROPERTY,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-get';
                    getEvents.push(snapshot);
                });

        assert.strictEqual(getEvents.length, 0);

        proxy.foo.bar.baz.addListener(EVENT_TYPE_GET_PROPERTY,
            evt => {
                let snapshot = evt.snapshot;
                snapshot.order = 'third-get';
                getEvents.push(snapshot);
            });
        // the two get listeners should fire 3 times (3 properties deep)...
        assert.strictEqual(getEvents.length, 6);
        assert.strictEqual(getEvents[0].order, 'first-get');
        assert.strictEqual(getEvents[0].property, 'foo');
        assert.deepEqual(getEvents[0].path, []);
        assert.strictEqual(getEvents[1].order, 'second-get');
        assert.strictEqual(getEvents[1].property, 'foo');
        assert.deepEqual(getEvents[1].path, []);
        assert.strictEqual(getEvents[2].order, 'first-get');
        assert.strictEqual(getEvents[2].property, 'bar');
        assert.deepEqual(getEvents[2].path, ['foo']);
        assert.strictEqual(getEvents[3].order, 'second-get');
        assert.strictEqual(getEvents[3].property, 'bar');
        assert.deepEqual(getEvents[3].path, ['foo']);
        assert.strictEqual(getEvents[4].order, 'first-get');
        assert.strictEqual(getEvents[4].property, 'baz');
        assert.deepEqual(getEvents[4].path, ['foo', 'bar']);
        assert.strictEqual(getEvents[5].order, 'second-get');
        assert.strictEqual(getEvents[5].property, 'baz');
        assert.deepEqual(getEvents[5].path, ['foo', 'bar']);

        // get the very last property (.qux) - whose parent is now get listened to...
        getEvents = [];
        const quxValue = proxy.foo.bar.baz.qux;
        // the two top level get listeners should fire 4 times (4 properties deep) and lower get listener should fire once...
        assert.strictEqual(getEvents.length, 9);
        assert.strictEqual(getEvents[0].order, 'first-get');
        assert.strictEqual(getEvents[0].property, 'foo');
        assert.deepEqual(getEvents[0].path, []);
        assert.strictEqual(getEvents[1].order, 'second-get');
        assert.strictEqual(getEvents[1].property, 'foo');
        assert.deepEqual(getEvents[1].path, []);
        assert.strictEqual(getEvents[2].order, 'first-get');
        assert.strictEqual(getEvents[2].property, 'bar');
        assert.deepEqual(getEvents[2].path, ['foo']);
        assert.strictEqual(getEvents[3].order, 'second-get');
        assert.strictEqual(getEvents[3].property, 'bar');
        assert.deepEqual(getEvents[3].path, ['foo']);
        assert.strictEqual(getEvents[4].order, 'first-get');
        assert.strictEqual(getEvents[4].property, 'baz');
        assert.deepEqual(getEvents[4].path, ['foo', 'bar']);
        assert.strictEqual(getEvents[5].order, 'second-get');
        assert.strictEqual(getEvents[5].property, 'baz');
        assert.deepEqual(getEvents[5].path, ['foo', 'bar']);

        assert.strictEqual(getEvents[6].order, 'third-get');
        assert.strictEqual(getEvents[6].property, 'qux');
        assert.deepEqual(getEvents[6].path, []);  // empty path because path is relative to where listener was added
        assert.strictEqual(getEvents[7].order, 'first-get');
        assert.strictEqual(getEvents[7].property, 'qux');
        assert.deepEqual(getEvents[7].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(getEvents[8].order, 'second-get');
        assert.strictEqual(getEvents[8].property, 'qux');
        assert.deepEqual(getEvents[8].path, ['foo', 'bar', 'baz']);
    })

    it('exceptions in listeners are swallowed (by default)', function () {
        let changeEvents = [];
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-before';
                    changeEvents.push(snapshot);
                })
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-before';
                    changeEvents.push(snapshot);
                    throw new TypeError('Something went very wrong here');
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-after';
                    changeEvents.push(snapshot);
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-after';
                    changeEvents.push(snapshot);
                    throw new TypeError('Something went very wrong here too');
                });

        proxy.foo.bar.baz.qux = false;
        assert.isFalse(obj.foo.bar.baz.qux);

        assert.strictEqual(changeEvents.length, 4);
    })

    it('exceptions in listeners can be handled', function () {
        let changeEvents = [];
        let exceptionEvents = [];
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_EXCEPTION_HANDLER,
                evt => {
                    exceptionEvents.push(evt.snapshot);
                })
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-before';
                    changeEvents.push(snapshot);
                })
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-before';
                    changeEvents.push(snapshot);
                    throw new TypeError('Something went very wrong here');
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-after';
                    changeEvents.push(snapshot);
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-after';
                    changeEvents.push(snapshot);
                    throw new TypeError('Something went very wrong here too');
                });

        proxy.foo.bar.baz.qux = false;
        assert.isFalse(obj.foo.bar.baz.qux);

        assert.strictEqual(changeEvents.length, 4);
        assert.strictEqual(exceptionEvents.length, 2);
        assert.strictEqual(exceptionEvents[0].type, EVENT_TYPE_EXCEPTION_HANDLER);
        assert.deepEqual(exceptionEvents[0].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(exceptionEvents[0].exception.message, 'Something went very wrong here');
        assert.strictEqual(exceptionEvents[0].event.type, EVENT_TYPE_BEFORE_CHANGE);
        assert.strictEqual(exceptionEvents[0].event.action, 'set');
        assert.strictEqual(exceptionEvents[0].event.property, 'qux');
        assert.strictEqual(exceptionEvents[1].type, EVENT_TYPE_EXCEPTION_HANDLER);
        assert.deepEqual(exceptionEvents[1].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(exceptionEvents[1].exception.message, 'Something went very wrong here too');
        assert.strictEqual(exceptionEvents[1].event.type, EVENT_TYPE_AFTER_CHANGE);
        assert.strictEqual(exceptionEvents[1].event.action, 'set');
        assert.strictEqual(exceptionEvents[1].event.property, 'qux');
    })

    it('exceptions in listeners can be surfaced by re-throwing in exception handler', function () {
        let changeEvents = [];
        let exceptionEvents = [];
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_EXCEPTION_HANDLER,
                evt => {
                    exceptionEvents.push(evt.snapshot);
                    throw evt.exception;
                })
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-before';
                    changeEvents.push(snapshot);
                })
            .addListener(EVENT_TYPE_BEFORE_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-before';
                    changeEvents.push(snapshot);
                    throw new TypeError('Something went very wrong here');
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'first-after';
                    changeEvents.push(snapshot);
                })
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'second-after';
                    changeEvents.push(snapshot);
                    throw new TypeError('Something went very wrong here too');
                });

        expect(() => {
            proxy.foo.bar.baz.qux = false;
        }).to.throw('Something went very wrong here');
        // because the exception was surfaced - the property should be unchanged...
        assert.isTrue(obj.foo.bar.baz.qux);

        assert.strictEqual(changeEvents.length, 2);
        assert.strictEqual(exceptionEvents.length, 1);
        assert.strictEqual(exceptionEvents[0].type, EVENT_TYPE_EXCEPTION_HANDLER);
        assert.deepEqual(exceptionEvents[0].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(exceptionEvents[0].exception.message, 'Something went very wrong here');
        assert.strictEqual(exceptionEvents[0].event.type, EVENT_TYPE_BEFORE_CHANGE);
        assert.strictEqual(exceptionEvents[0].event.action, 'set');
        assert.strictEqual(exceptionEvents[0].event.property, 'qux');
    })

    it('same proxied object in different trees should fire all parent listeners', function () {
        let changeEvents = [];
        const subObj = {
            bar: {
                baz: {
                    qux: true
                }
            }
        };
        const subProxy = CreateListeningProxy(subObj)
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'sub-after';
                    changeEvents.push(snapshot);
                });

        const mainObj1 = {
            'foo1': subProxy
        };
        const mainObj2 = {
            'foo2': subProxy,
            'foo3': subProxy
        };
        CreateListeningProxy(mainObj1)
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'main1-after';
                    changeEvents.push(snapshot);
                });
        CreateListeningProxy(mainObj2)
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'main2-after';
                    changeEvents.push(snapshot);
                });
        const arr1 = [subProxy];
        const arr2 = [subProxy, subProxy];
        CreateListeningProxy(arr1)
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'arr1-after';
                    changeEvents.push(snapshot);
                });
        CreateListeningProxy(arr2)
            .addListener(EVENT_TYPE_AFTER_CHANGE,
                evt => {
                    let snapshot = evt.snapshot;
                    snapshot.order = 'arr2-after';
                    changeEvents.push(snapshot);
                });

        subProxy.bar.baz.qux = false;

        assert.strictEqual(changeEvents.length, 7);
        assert.strictEqual(changeEvents[0].order, 'sub-after');
        assert.deepEqual(changeEvents[0].path, ['bar', 'baz']);
        assert.strictEqual(changeEvents[1].order, 'main1-after');
        assert.deepEqual(changeEvents[1].path, ['foo1', 'bar', 'baz']);
        assert.strictEqual(changeEvents[2].order, 'main2-after');
        assert.deepEqual(changeEvents[2].path, ['foo2', 'bar', 'baz']);
        assert.strictEqual(changeEvents[3].order, 'main2-after');
        assert.deepEqual(changeEvents[3].path, ['foo3', 'bar', 'baz']);
        assert.strictEqual(changeEvents[4].order, 'arr1-after');
        assert.deepEqual(changeEvents[4].path, [0, 'bar', 'baz']);
        assert.strictEqual(changeEvents[5].order, 'arr2-after');
        assert.deepEqual(changeEvents[5].path, [0, 'bar', 'baz']);
        assert.strictEqual(changeEvents[6].order, 'arr2-after');
        assert.deepEqual(changeEvents[6].path, [1, 'bar', 'baz']);
    })

    it('getProperty event can imply method using .preventDefault()', function () {
        let changeEvents = [];
        const obj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_GET_PROPERTY, evt => {
                changeEvents.push(evt.snapshot);
                if (evt.property === 'doSomething') {
                    evt.preventDefault((...args) => {
                        evt.target.didSomething = args.length === 1 ? args[0] : args.length > 0 ? args : undefined;
                    }, true, 'DOING SOMETHING');
                }
            })
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                changeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                changeEvents.push(evt.snapshot);
            });

        proxy.doSomething("Hello");
        assert.strictEqual(changeEvents.length, 3);
        assert.strictEqual(changeEvents[0].type, EVENT_TYPE_GET_PROPERTY);
        assert.strictEqual(changeEvents[0].property, 'doSomething');
        assert.deepEqual(changeEvents[0].path, []);
        assert.strictEqual(changeEvents[1].type, EVENT_TYPE_BEFORE_CHANGE);
        assert.deepEqual(changeEvents[1].path, []);
        assert.strictEqual(changeEvents[1].action, '[[DOING SOMETHING]]');
        assert.deepEqual(changeEvents[1].arguments, ['Hello']);
        assert.strictEqual(changeEvents[1].value, undefined);
        assert.strictEqual(changeEvents[1].wasValue, undefined);
        assert.strictEqual(changeEvents[2].type, EVENT_TYPE_AFTER_CHANGE);
        assert.deepEqual(changeEvents[2].path, []);
        assert.strictEqual(changeEvents[2].action, '[[DOING SOMETHING]]');
        assert.deepEqual(changeEvents[2].arguments, ['Hello']);
        assert.strictEqual(changeEvents[2].value, undefined);
        assert.strictEqual(changeEvents[2].wasValue, undefined);

        assert.strictEqual(obj.didSomething, 'Hello');
        assert.strictEqual(proxy.didSomething, 'Hello');

        // do it again on a deeper property...
        changeEvents = [];
        proxy.foo.bar.baz.doSomething('Hi There');
        assert.strictEqual(changeEvents.length, 6);
        assert.strictEqual(changeEvents[0].type, EVENT_TYPE_GET_PROPERTY);
        assert.strictEqual(changeEvents[0].property, 'foo');
        assert.deepEqual(changeEvents[0].path, []);
        assert.strictEqual(changeEvents[1].type, EVENT_TYPE_GET_PROPERTY);
        assert.strictEqual(changeEvents[1].property, 'bar');
        assert.deepEqual(changeEvents[1].path, ['foo']);
        assert.strictEqual(changeEvents[2].type, EVENT_TYPE_GET_PROPERTY);
        assert.strictEqual(changeEvents[2].property, 'baz');
        assert.deepEqual(changeEvents[2].path, ['foo', 'bar']);
        assert.strictEqual(changeEvents[3].type, EVENT_TYPE_GET_PROPERTY);
        assert.strictEqual(changeEvents[3].property, 'doSomething');
        assert.deepEqual(changeEvents[3].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[4].type, EVENT_TYPE_BEFORE_CHANGE);
        assert.deepEqual(changeEvents[4].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[4].action, '[[DOING SOMETHING]]');
        assert.deepEqual(changeEvents[4].arguments, ['Hi There']);
        assert.strictEqual(changeEvents[4].value, undefined);
        assert.strictEqual(changeEvents[4].wasValue, undefined);
        assert.strictEqual(changeEvents[5].type, EVENT_TYPE_AFTER_CHANGE);
        assert.deepEqual(changeEvents[5].path, ['foo', 'bar', 'baz']);
        assert.strictEqual(changeEvents[5].action, '[[DOING SOMETHING]]');
        assert.deepEqual(changeEvents[5].arguments, ['Hi There']);
        assert.strictEqual(changeEvents[5].value, undefined);
        assert.strictEqual(changeEvents[5].wasValue, undefined);
    })
})