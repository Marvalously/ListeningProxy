import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS
} from '../src/listening-proxy.js';

describe('Arrays', function () {
    it('proxied array should be seen as array', function () {
        const obj = [{ foo: 'bar'}];
        const proxy = CreateListeningProxy(obj);

        assert.strictEqual(typeof proxy, 'object');
        assert.isTrue(Array.isArray(proxy));

        const iterator = proxy[Symbol.iterator]();
        for (let item of iterator) {
            assert.isTrue(item[SYMBOL_IS_PROXY]);
        }
    })

    it('objects set in array are proxied', function () {
        const obj = [
            'foo',
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            },
            true,
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            },
            99
        ];
        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        assert.isUndefined(proxy[0][SYMBOL_IS_PROXY]);
        assert.isTrue(proxy[1][SYMBOL_IS_PROXY]);
        assert.isUndefined(proxy[2][SYMBOL_IS_PROXY]);
        assert.isTrue(proxy[3][SYMBOL_IS_PROXY]);
        assert.isUndefined(proxy[4][SYMBOL_IS_PROXY]);

        // setting an item in array to an object makes that object a proxy too...
        assert.strictEqual(beforeEvents.length, 0);
        assert.strictEqual(afterEvents.length, 0);
        proxy[0] = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 0);
        assert.deepEqual(beforeEvents[0].path, []);
        assert.strictEqual(beforeEvents[0].wasValue, 'foo');
        assert.isUndefined(beforeEvents[0].value[SYMBOL_IS_PROXY]);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 0);
        assert.deepEqual(afterEvents[0].path, []);
        assert.strictEqual(afterEvents[0].wasValue, 'foo');
        assert.isUndefined(afterEvents[0].value[SYMBOL_IS_PROXY]);

        assert.isTrue(proxy[0][SYMBOL_IS_PROXY]);

        // change property in added object...
        proxy[0].foo.bar.baz.qux = false;
        // and listeners should have been fired...
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'set');
        assert.strictEqual(beforeEvents[1].property, 'qux');
        assert.deepEqual(beforeEvents[1].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[1].value, false);
        assert.strictEqual(beforeEvents[1].wasValue, true);
        assert.strictEqual(afterEvents[1].action, 'set');
        assert.strictEqual(afterEvents[1].property, 'qux');
        assert.deepEqual(afterEvents[1].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[1].value, false);
        assert.strictEqual(afterEvents[1].wasValue, true);

        // make a copy of the item object...
        let copy = proxy[0];
        // and replace the item with some non-proxy object...
        proxy[0] = 'foo';
        // and listeners should have been fired...
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
        assert.strictEqual(beforeEvents[2].action, 'set');
        assert.strictEqual(beforeEvents[2].property, 0);
        assert.deepEqual(beforeEvents[2].path, []);
        assert.strictEqual(beforeEvents[2].value, 'foo');
        assert.strictEqual(afterEvents[2].action, 'set');
        assert.strictEqual(afterEvents[2].property, 0);
        assert.deepEqual(afterEvents[2].path, []);
        assert.strictEqual(afterEvents[2].value, 'foo');

        // and if we change that coped object - the listeners should not get fired again...
        copy.foo.bar.baz.qux = true;
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
    })

    it('same object in multiple slots of array - changes cause multiple event firing', function () {
        const itemObj = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const obj = [itemObj, itemObj, itemObj];
        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        const firstItem = proxy[0];
        firstItem.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'qux');
        assert.deepEqual(beforeEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[0].value, false);
        assert.strictEqual(beforeEvents[0].wasValue, true);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);
        // other events have a different path...
        assert.deepEqual(beforeEvents[1].path, [1, 'foo', 'bar', 'baz']);
        assert.deepEqual(afterEvents[1].path, [1, 'foo', 'bar', 'baz']);
        assert.deepEqual(beforeEvents[2].path, [2, 'foo', 'bar', 'baz']);
        assert.deepEqual(afterEvents[2].path, [2, 'foo', 'bar', 'baz']);
    })

    it('push - objects pushed to array are proxied', function () {
        const obj = [];
        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        const newItem = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };

        let newLen = proxy.push(newItem);
        assert.strictEqual(newLen, 1);
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        proxy.forEach(item => {
            assert.isTrue(item[SYMBOL_IS_PROXY]);
        });
        assert.strictEqual(beforeEvents[0].action, 'push()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.deepEqual(beforeEvents[0].path, []);
        assert.deepEqual(beforeEvents[0].wasValue, []);
        assert.strictEqual(afterEvents[0].action, 'push()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.deepEqual(afterEvents[0].path, []);
        assert.deepEqual(afterEvents[0].wasValue, []);

        // changing the added item causes event firing...
        const addedItem = proxy[0];
        addedItem.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'set');
        assert.strictEqual(beforeEvents[1].property, 'qux');
        assert.deepEqual(beforeEvents[1].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[1].value, false);
        assert.strictEqual(beforeEvents[1].wasValue, true);
        assert.strictEqual(afterEvents[1].action, 'set');
        assert.strictEqual(afterEvents[1].property, 'qux');
        assert.deepEqual(afterEvents[1].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[1].value, false);
        assert.strictEqual(afterEvents[1].wasValue, true);
    })

    it('pop - object popped from array no longer causes event firing when changed', function () {
        const obj = [
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }
        ];
        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        proxy[0].foo.bar.baz.qux = false;
        // check that event are fired before it is popped...
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'qux');
        assert.deepEqual(beforeEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[0].value, false);
        assert.strictEqual(beforeEvents[0].wasValue, true);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);

        let popped = proxy.pop();
        assert.isTrue(popped[SYMBOL_IS_PROXY]); // TODO? small side effect - the popped item is still a proxy

        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'pop()');
        assert.strictEqual(beforeEvents[1].arguments.length, 0);
        assert.deepEqual(beforeEvents[1].path, []);
        assert.deepEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(afterEvents[1].action, 'pop()');
        assert.strictEqual(afterEvents[1].arguments.length, 0);
        assert.deepEqual(afterEvents[1].path, []);
        assert.deepEqual(afterEvents[1].value, []);

        // changing the popped item shouldn't cause further event firing...
        popped.foo.bar.baz.qux = true;
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
    })

    it('unshift - objects unshifted to array are proxied', function () {
        const obj = [];
        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        const newItem = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };

        let newLen = proxy.unshift(newItem);
        assert.strictEqual(newLen, 1);
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        proxy.forEach(item => {
            assert.isTrue(item[SYMBOL_IS_PROXY]);
        });
        assert.strictEqual(beforeEvents[0].action, 'unshift()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.deepEqual(beforeEvents[0].path, []);
        assert.deepEqual(beforeEvents[0].wasValue, []);
        assert.strictEqual(afterEvents[0].action, 'unshift()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.deepEqual(afterEvents[0].path, []);
        assert.deepEqual(afterEvents[0].wasValue, []);

        // changing the added item causes event firing...
        const addedItem = proxy[0];
        addedItem.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'set');
        assert.strictEqual(beforeEvents[1].property, 'qux');
        assert.deepEqual(beforeEvents[1].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[1].value, false);
        assert.strictEqual(beforeEvents[1].wasValue, true);
        assert.strictEqual(afterEvents[1].action, 'set');
        assert.strictEqual(afterEvents[1].property, 'qux');
        assert.deepEqual(afterEvents[1].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[1].value, false);
        assert.strictEqual(afterEvents[1].wasValue, true);
    })

    it('shift - object shifted from array no longer causes event firing when changed', function () {
        const obj = [
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }
        ];
        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        proxy[0].foo.bar.baz.qux = false;
        // check that event are fired before it is shifted...
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'qux');
        assert.deepEqual(beforeEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[0].value, false);
        assert.strictEqual(beforeEvents[0].wasValue, true);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);

        let shifted = proxy.shift();
        assert.isTrue(shifted[SYMBOL_IS_PROXY]); // TODO? small side effect - the shifted item is still a proxy

        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'shift()');
        assert.strictEqual(beforeEvents[1].arguments.length, 0);
        assert.deepEqual(beforeEvents[1].path, []);
        assert.deepEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(afterEvents[1].action, 'shift()');
        assert.strictEqual(afterEvents[1].arguments.length, 0);
        assert.deepEqual(afterEvents[1].path, []);
        assert.deepEqual(afterEvents[1].value, []);

        // changing the shifted item shouldn't cause further event firing...
        shifted.foo.bar.baz.qux = true;
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
    })

    it('splice - removed items no longer cause event firing when changed', function () {
        const obj = [
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }
        ];

        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        const item = proxy[0];
        // check that event are fired before it is removed...
        item.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'qux');
        assert.deepEqual(beforeEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[0].value, false);
        assert.strictEqual(beforeEvents[0].wasValue, true);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);

        // now slice to remove the item...
        let result = proxy.splice(0, 1);
        assert.strictEqual(result.length, 1);
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'splice()');
        assert.strictEqual(beforeEvents[1].arguments.length, 2);
        assert.deepEqual(beforeEvents[1].path, []);
        assert.deepEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(afterEvents[1].action, 'splice()');
        assert.strictEqual(afterEvents[1].arguments.length, 2);
        assert.deepEqual(afterEvents[1].path, []);
        assert.deepEqual(afterEvents[1].value, []);

        // changing the removed item shouldn't cause further event firing...
        item.foo.bar.baz.qux = true;
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
    })

    it('splice - added items are proxied and cause event firing when changed', function () {
        const obj = [
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }
        ];

        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        // create two objects to add to the array (one already proxied and one not)...
        const alreadyProxiedItem = CreateListeningProxy({
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        });
        const anotherNewItem = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };

        // now add a couple of objects to the array using splice...
        const result = proxy.splice(1, 0, alreadyProxiedItem, anotherNewItem);
        assert.strictEqual(result.length, 0);
        assert.strictEqual(proxy.length, 3);
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'splice()');
        assert.strictEqual(beforeEvents[0].arguments.length, 4);
        assert.deepEqual(beforeEvents[0].path, []);
        assert.deepEqual(beforeEvents[0].value, undefined);
        assert.strictEqual(afterEvents[0].action, 'splice()');
        assert.strictEqual(afterEvents[0].arguments.length, 4);
        assert.deepEqual(afterEvents[0].path, []);
        assert.strictEqual(afterEvents[0].value.length, 3);

        // changing the already proxied item should cause events to fire on the array...
        alreadyProxiedItem.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'set');
        assert.strictEqual(beforeEvents[1].property, 'qux');
        assert.deepEqual(beforeEvents[1].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[1].value, false);
        assert.strictEqual(beforeEvents[1].wasValue, true);
        assert.strictEqual(afterEvents[1].action, 'set');
        assert.strictEqual(afterEvents[1].property, 'qux');
        assert.deepEqual(afterEvents[1].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[1].value, false);
        assert.strictEqual(afterEvents[1].wasValue, true);

        // changing the last item added should also cause events to fire on the array...
        const lastItemAdded = proxy[2];
        lastItemAdded.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
        assert.strictEqual(beforeEvents[2].action, 'set');
        assert.strictEqual(beforeEvents[2].property, 'qux');
        assert.deepEqual(beforeEvents[2].path, [2, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[2].value, false);
        assert.strictEqual(beforeEvents[2].wasValue, true);
        assert.strictEqual(afterEvents[2].action, 'set');
        assert.strictEqual(afterEvents[2].property, 'qux');
        assert.deepEqual(afterEvents[2].path, [2, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[2].value, false);
        assert.strictEqual(afterEvents[2].wasValue, true);
    })

    it('fill - added items are proxied and cause event firing when changed', function () {
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
            null, null, null
        ];

        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        // before filling, check that the original object in the array causes event firing when changed...
        const originalItem = proxy[0];
        originalItem.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'qux');
        assert.deepEqual(beforeEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[0].value, false);
        assert.strictEqual(beforeEvents[0].wasValue, true);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);

        // now fill the array with a new item...
        const newItem = {
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        };
        const result = proxy.fill(newItem, 1);
        assert.strictEqual(result.length, 4);
        assert.isTrue(proxy === result);
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'fill()');
        assert.strictEqual(beforeEvents[1].arguments.length, 2);
        assert.deepEqual(beforeEvents[1].path, []);
        assert.deepEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(afterEvents[1].action, 'fill()');
        assert.strictEqual(afterEvents[1].arguments.length, 2);
        assert.deepEqual(afterEvents[1].path, []);
        assert.strictEqual(afterEvents[1].value.length, 4);

        // changing the un-replaced item still fires events...
        originalItem.foo.bar.baz.qux = true;
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
        assert.strictEqual(beforeEvents[2].action, 'set');
        assert.strictEqual(beforeEvents[2].property, 'qux');
        assert.deepEqual(beforeEvents[2].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[2].value, true);
        assert.strictEqual(beforeEvents[2].wasValue, false);
        assert.strictEqual(afterEvents[2].action, 'set');
        assert.strictEqual(afterEvents[2].property, 'qux');
        assert.deepEqual(afterEvents[2].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[2].value, true);
        assert.strictEqual(afterEvents[2].wasValue, false);

        // changing the last added item fires events...
        const lastAddedItem = proxy[3];
        lastAddedItem.foo.bar.baz.qux = false;
        // nb. because the same item has been added 3 times, we're expecting 3 more events...
        assert.strictEqual(beforeEvents.length, 6);
        assert.strictEqual(afterEvents.length, 6);
        assert.strictEqual(beforeEvents[3].action, 'set');
        assert.strictEqual(beforeEvents[3].property, 'qux');
        assert.deepEqual(beforeEvents[3].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[3].value, false);
        assert.strictEqual(beforeEvents[3].wasValue, true);
        assert.strictEqual(afterEvents[3].action, 'set');
        assert.strictEqual(afterEvents[3].property, 'qux');
        assert.deepEqual(afterEvents[3].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[3].value, false);
        assert.strictEqual(afterEvents[3].wasValue, true);
        // the two other events caused by the same change will have different pathis...
        assert.deepEqual(beforeEvents[4].path, [2, 'foo', 'bar', 'baz']);
        assert.deepEqual(afterEvents[4].path, [2, 'foo', 'bar', 'baz']);
        assert.deepEqual(beforeEvents[5].path, [3, 'foo', 'bar', 'baz']);
        assert.deepEqual(afterEvents[5].path, [3, 'foo', 'bar', 'baz']);
    })

    it('fill - replaced items no longer cause event firing when changed', function () {
        const obj = [
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }
        ];

        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        // before filling, check that the original object in the array causes event firing when changed...
        const originalItem = proxy[0];
        originalItem.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'qux');
        assert.deepEqual(beforeEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[0].value, false);
        assert.strictEqual(beforeEvents[0].wasValue, true);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);

        // now fill with a new item (an already proxied object)...
        const alreadyProxiedItem = CreateListeningProxy({
            foo: {
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        });
        const result = proxy.fill(alreadyProxiedItem);
        assert.strictEqual(result.length, 1);
        assert.isTrue(proxy === result);
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'fill()');
        assert.strictEqual(beforeEvents[1].arguments.length, 1);
        assert.deepEqual(beforeEvents[1].path, []);
        assert.deepEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(afterEvents[1].action, 'fill()');
        assert.strictEqual(afterEvents[1].arguments.length, 1);
        assert.deepEqual(afterEvents[1].path, []);

        // changing the item filled with causes event firing...
        alreadyProxiedItem.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
        assert.strictEqual(beforeEvents[2].action, 'set');
        assert.strictEqual(beforeEvents[2].property, 'qux');
        assert.deepEqual(beforeEvents[2].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[2].value, false);
        assert.strictEqual(beforeEvents[2].wasValue, true);
        assert.strictEqual(afterEvents[2].action, 'set');
        assert.strictEqual(afterEvents[2].property, 'qux');
        assert.deepEqual(afterEvents[2].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[2].value, false);
        assert.strictEqual(afterEvents[2].wasValue, true);

        // changing the original (replaced) item no longer causes event firing...
        originalItem.foo.bar.baz.qux = true;
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
    })

    it('reverse - event paths are affected', function () {
        const obj = [
            {
                foo: 0,
                bar: {
                    baz: {
                        qux: true
                    }
                }
            },
            {
                foo: 1,
                bar: {
                    baz: {
                        qux: true
                    }
                }
            },
            {
                foo: 2,
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        ];

        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        const item0 = proxy[0];

        // prior to reverse, check paths are correct...
        item0.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'qux');
        assert.deepEqual(beforeEvents[0].path, [0, 'bar', 'baz']);
        assert.strictEqual(beforeEvents[0].value, false);
        assert.strictEqual(beforeEvents[0].wasValue, true);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, [0, 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);

        // now reverse the array...
        proxy.reverse();
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'reverse()');
        assert.strictEqual(beforeEvents[1].arguments.length, 0);
        assert.deepEqual(beforeEvents[1].path, []);
        assert.deepEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(afterEvents[1].action, 'reverse()');
        assert.strictEqual(afterEvents[1].arguments.length, 0);
        assert.deepEqual(afterEvents[1].path, []);

        // changing the item again should see a different path...
        item0.bar.baz.qux = true;
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
        assert.strictEqual(beforeEvents[2].action, 'set');
        assert.strictEqual(beforeEvents[2].property, 'qux');
        assert.deepEqual(beforeEvents[2].path, [2, 'bar', 'baz']);
        assert.strictEqual(beforeEvents[2].value, true);
        assert.strictEqual(beforeEvents[2].wasValue, false);
        assert.strictEqual(afterEvents[2].action, 'set');
        assert.strictEqual(afterEvents[2].property, 'qux');
        assert.deepEqual(afterEvents[2].path, [2, 'bar', 'baz']);
        assert.strictEqual(afterEvents[2].value, true);
        assert.strictEqual(afterEvents[2].wasValue, false);
    })

    it('sort - event paths are affected', function () {
        const obj = [
            {
                foo: 2,
                bar: {
                    baz: {
                        qux: true
                    }
                }
            },
            {
                foo: 1,
                bar: {
                    baz: {
                        qux: true
                    }
                }
            },
            {
                foo: 0,
                bar: {
                    baz: {
                        qux: true
                    }
                }
            }
        ];

        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        const item0 = proxy[0];

        // prior to reverse, check paths are correct...
        item0.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'qux');
        assert.deepEqual(beforeEvents[0].path, [0, 'bar', 'baz']);
        assert.strictEqual(beforeEvents[0].value, false);
        assert.strictEqual(beforeEvents[0].wasValue, true);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, [0, 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);

        // now sort the array...
        proxy.sort((a, b) => {
            if (a.foo < b.foo) {
                return -1;
            } else if (a.foo > b.foo) {
                return 1;
            }
            return 0;
        });
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'sort()');
        assert.strictEqual(beforeEvents[1].arguments.length, 1);
        assert.deepEqual(beforeEvents[1].path, []);
        assert.deepEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(afterEvents[1].action, 'sort()');
        assert.strictEqual(afterEvents[1].arguments.length, 1);
        assert.deepEqual(afterEvents[1].path, []);

        // changing the item again should see a different path...
        item0.bar.baz.qux = true;
        assert.strictEqual(beforeEvents.length, 3);
        assert.strictEqual(afterEvents.length, 3);
        assert.strictEqual(beforeEvents[2].action, 'set');
        assert.strictEqual(beforeEvents[2].property, 'qux');
        assert.deepEqual(beforeEvents[2].path, [2, 'bar', 'baz']);
        assert.strictEqual(beforeEvents[2].value, true);
        assert.strictEqual(beforeEvents[2].wasValue, false);
        assert.strictEqual(afterEvents[2].action, 'set');
        assert.strictEqual(afterEvents[2].property, 'qux');
        assert.deepEqual(afterEvents[2].path, [2, 'bar', 'baz']);
        assert.strictEqual(afterEvents[2].value, true);
        assert.strictEqual(afterEvents[2].wasValue, false);
    })

    it('copyWithin - copied items are proxied', function () {
        const obj = [
            null,
            {
                foo: {
                    bar: {
                        baz: {
                            qux: true
                        }
                    }
                }
            }
        ];
        const beforeEvents = [];
        const afterEvents = [];
        const proxy = CreateListeningProxy(obj)
            .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
                beforeEvents.push(evt.snapshot);
            })
            .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
                afterEvents.push(evt.snapshot);
            });

        // change the original item to ensure events are fired...
        const originalItem = proxy[1];
        originalItem.foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'set');
        assert.strictEqual(beforeEvents[0].property, 'qux');
        assert.deepEqual(beforeEvents[0].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[0].value, false);
        assert.strictEqual(beforeEvents[0].wasValue, true);
        assert.strictEqual(afterEvents[0].action, 'set');
        assert.strictEqual(afterEvents[0].property, 'qux');
        assert.deepEqual(afterEvents[0].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[0].value, false);
        assert.strictEqual(afterEvents[0].wasValue, true);

        // now copy the item within...
        proxy.copyWithin(0, 1, 2);
        assert.strictEqual(beforeEvents.length, 2);
        assert.strictEqual(afterEvents.length, 2);
        assert.strictEqual(beforeEvents[1].action, 'copyWithin()');
        assert.strictEqual(beforeEvents[1].arguments.length, 3);
        assert.deepEqual(beforeEvents[1].path, []);
        assert.deepEqual(beforeEvents[1].value, undefined);
        assert.strictEqual(afterEvents[1].action, 'copyWithin()');
        assert.strictEqual(afterEvents[1].arguments.length, 3);
        assert.deepEqual(afterEvents[1].path, []);

        // and change the original item again...
        proxy[1].foo.bar.baz.qux = true;
        assert.strictEqual(beforeEvents.length, 4);
        assert.strictEqual(afterEvents.length, 4);
        assert.strictEqual(beforeEvents[2].action, 'set');
        assert.strictEqual(beforeEvents[2].property, 'qux');
        assert.deepEqual(beforeEvents[2].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[2].value, true);
        assert.strictEqual(beforeEvents[2].wasValue, false);
        assert.strictEqual(afterEvents[2].action, 'set');
        assert.strictEqual(afterEvents[2].property, 'qux');
        assert.deepEqual(afterEvents[2].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[2].value, true);
        assert.strictEqual(afterEvents[2].wasValue, false);
        assert.strictEqual(beforeEvents[3].action, 'set');
        assert.strictEqual(beforeEvents[3].property, 'qux');
        assert.deepEqual(beforeEvents[3].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[3].value, true);
        assert.strictEqual(beforeEvents[3].wasValue, false);
        assert.strictEqual(afterEvents[3].action, 'set');
        assert.strictEqual(afterEvents[3].property, 'qux');
        assert.deepEqual(afterEvents[3].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[3].value, true);
        assert.strictEqual(afterEvents[3].wasValue, false);

        proxy[0].foo.bar.baz.qux = false;
        assert.strictEqual(beforeEvents.length, 6);
        assert.strictEqual(afterEvents.length, 6);
        assert.strictEqual(beforeEvents[4].action, 'set');
        assert.strictEqual(beforeEvents[4].property, 'qux');
        assert.deepEqual(beforeEvents[4].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[4].value, false);
        assert.strictEqual(beforeEvents[4].wasValue, true);
        assert.strictEqual(afterEvents[4].action, 'set');
        assert.strictEqual(afterEvents[4].property, 'qux');
        assert.deepEqual(afterEvents[4].path, [0, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[4].value, false);
        assert.strictEqual(afterEvents[4].wasValue, true);
        assert.strictEqual(beforeEvents[5].action, 'set');
        assert.strictEqual(beforeEvents[5].property, 'qux');
        assert.deepEqual(beforeEvents[5].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(beforeEvents[5].value, false);
        assert.strictEqual(beforeEvents[5].wasValue, true);
        assert.strictEqual(afterEvents[5].action, 'set');
        assert.strictEqual(afterEvents[5].property, 'qux');
        assert.deepEqual(afterEvents[5].path, [1, 'foo', 'bar', 'baz']);
        assert.strictEqual(afterEvents[5].value, false);
        assert.strictEqual(afterEvents[5].wasValue, true);
    })
})