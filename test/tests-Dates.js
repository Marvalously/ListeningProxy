import { assert, expect } from './testFramework.js';
import {
    CreateListeningProxy, ListeningProxyFactory,
    EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE, EVENT_TYPE_GET_PROPERTY, EVENT_TYPE_GET_TREEWALKER,
    SYMBOL_IS_PROXY, SYMBOL_PROXY_TARGET, SYMBOL_PROXY_LISTENERS
} from '../src/listening-proxy.js';

describe('Dates', function () {
    it('proxied date should be seen as date', function () {
        const obj = new Date('2021-04-01T18:00:00');
        const proxy = CreateListeningProxy(obj);

        assert.strictEqual(typeof proxy, 'object');
        assert.isTrue(proxy instanceof Date);
        assert.isTrue(proxy[SYMBOL_IS_PROXY]);
    })

    it('setDate - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-04-01T18:00:00');
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

        let result = proxy.setDate(2);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setDate');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setDate()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 1);
        assert.strictEqual(beforeEvents[0].value, 2);
        assert.strictEqual(afterEvents[0].action, 'setDate()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 1);
        assert.strictEqual(afterEvents[0].value, 2);

        assert.strictEqual(obj.valueOf(), (new Date('2021-04-02T18:00:00')).valueOf());
    })

    it('setFullYear(y) - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setFullYear(2022);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setFullYear');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setFullYear()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 2021);
        assert.strictEqual(beforeEvents[0].value, 2022);
        assert.strictEqual(afterEvents[0].action, 'setFullYear()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 2021);
        assert.strictEqual(afterEvents[0].value, 2022);

        assert.strictEqual(obj.valueOf(), (new Date('2022-01-01T18:00:00')).valueOf());
    })

    it('setFullYear(y,m) - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setFullYear(2023, 2);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setFullYear');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setFullYear()');
        assert.strictEqual(beforeEvents[0].arguments.length, 2);
        assert.isTrue(beforeEvents[0].wasValue instanceof Date);
        assert.strictEqual(beforeEvents[0].wasValue.valueOf(), (new Date('2021-01-01T18:00:00')).valueOf());
        assert.isTrue(beforeEvents[0].value instanceof Date);
        assert.strictEqual(beforeEvents[0].value.valueOf(), (new Date('2023-03-01T18:00:00')).valueOf());
        assert.strictEqual(afterEvents[0].action, 'setFullYear()');
        assert.strictEqual(afterEvents[0].arguments.length, 2);
        assert.isTrue(afterEvents[0].wasValue instanceof Date);
        assert.strictEqual(afterEvents[0].wasValue.valueOf(), (new Date('2021-01-01T18:00:00')).valueOf());
        assert.isTrue(afterEvents[0].value instanceof Date);
        assert.strictEqual(afterEvents[0].value.valueOf(), (new Date('2023-03-01T18:00:00')).valueOf());

        assert.strictEqual(obj.valueOf(), (new Date('2023-03-01T18:00:00')).valueOf());
    })

    it('setFullYear(y,m,d) - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setFullYear(2023, 2, 2);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setFullYear');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setFullYear()');
        assert.strictEqual(beforeEvents[0].arguments.length, 3);
        assert.isTrue(beforeEvents[0].wasValue instanceof Date);
        assert.strictEqual(beforeEvents[0].wasValue.valueOf(), (new Date('2021-01-01T18:00:00')).valueOf());
        assert.isTrue(beforeEvents[0].value instanceof Date);
        assert.strictEqual(beforeEvents[0].value.valueOf(), (new Date('2023-03-02T18:00:00')).valueOf());
        assert.strictEqual(afterEvents[0].action, 'setFullYear()');
        assert.strictEqual(afterEvents[0].arguments.length, 3);
        assert.isTrue(afterEvents[0].wasValue instanceof Date);
        assert.strictEqual(afterEvents[0].wasValue.valueOf(), (new Date('2021-01-01T18:00:00')).valueOf());
        assert.isTrue(afterEvents[0].value instanceof Date);
        assert.strictEqual(afterEvents[0].value.valueOf(), (new Date('2023-03-02T18:00:00')).valueOf());

        assert.strictEqual(obj.valueOf(), (new Date('2023-03-02T18:00:00')).valueOf());
    })

    it('setHours - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setHours(12);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setHours');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setHours()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 18);
        assert.strictEqual(beforeEvents[0].value, 12);
        assert.strictEqual(afterEvents[0].action, 'setHours()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 18);
        assert.strictEqual(afterEvents[0].value, 12);

        assert.strictEqual(obj.valueOf(), (new Date('2021-01-01T12:00:00')).valueOf());
    })

    it('setMilliseconds - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00.123');
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

        let result = proxy.setMilliseconds(10);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setMilliseconds');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setMilliseconds()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 123);
        assert.strictEqual(beforeEvents[0].value, 10);
        assert.strictEqual(afterEvents[0].action, 'setMilliseconds()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 123);
        assert.strictEqual(afterEvents[0].value, 10);

        assert.strictEqual(obj.valueOf(), (new Date('2021-01-01T18:00:00.010')).valueOf());
    })

    it('setMinutes - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:20:00.123');
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

        let result = proxy.setMinutes(30);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setMinutes');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setMinutes()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 20);
        assert.strictEqual(beforeEvents[0].value, 30);
        assert.strictEqual(afterEvents[0].action, 'setMinutes()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 20);
        assert.strictEqual(afterEvents[0].value, 30);

        assert.strictEqual(obj.valueOf(), (new Date('2021-01-01T18:30:00.123')).valueOf());
    })

    it('setMonth - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:20:00.123');
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

        let result = proxy.setMonth(1);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setMonth');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setMonth()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 0);
        assert.strictEqual(beforeEvents[0].value, 1);
        assert.strictEqual(afterEvents[0].action, 'setMonth()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 0);
        assert.strictEqual(afterEvents[0].value, 1);

        assert.strictEqual(obj.valueOf(), (new Date('2021-02-01T18:20:00.123')).valueOf());
    })

    it('setSeconds - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:20.123');
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

        let result = proxy.setSeconds(30);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setSeconds');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setSeconds()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 20);
        assert.strictEqual(beforeEvents[0].value, 30);
        assert.strictEqual(afterEvents[0].action, 'setSeconds()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 20);
        assert.strictEqual(afterEvents[0].value, 30);

        assert.strictEqual(obj.valueOf(), (new Date('2021-01-01T18:00:30.123')).valueOf());
    })

    it('setTime - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:10:20.123');
        const expectedWasValue = obj.getTime();

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

        let result = proxy.setTime(123456);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setTime');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setTime()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, expectedWasValue);
        assert.strictEqual(beforeEvents[0].value, 123456);
        assert.strictEqual(afterEvents[0].action, 'setTime()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, expectedWasValue);
        assert.strictEqual(afterEvents[0].value, 123456);

        assert.strictEqual(obj.valueOf(), (new Date(123456)).valueOf());
    })

    it('setYear - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setYear(2022);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setYear');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setYear()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 121);
        assert.strictEqual(beforeEvents[0].value, 2022);
        assert.strictEqual(afterEvents[0].action, 'setYear()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 121);
        assert.strictEqual(afterEvents[0].value, 2022);

        assert.strictEqual(obj.valueOf(), (new Date('2022-01-01T18:00:00')).valueOf());
    })

    it('setUTCDate - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setUTCDate(2);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setUTCDate');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setUTCDate()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 1);
        assert.strictEqual(beforeEvents[0].value, 2);
        assert.strictEqual(afterEvents[0].action, 'setUTCDate()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 1);
        assert.strictEqual(afterEvents[0].value, 2);

        assert.strictEqual(obj.valueOf(), (new Date('2021-01-02T18:00:00')).valueOf());
    })

    it('setUTCFullYear(y) - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setUTCFullYear(2022);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setUTCFullYear');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setUTCFullYear()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 2021);
        assert.strictEqual(beforeEvents[0].value, 2022);
        assert.strictEqual(afterEvents[0].action, 'setUTCFullYear()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 2021);
        assert.strictEqual(afterEvents[0].value, 2022);

        assert.strictEqual(obj.valueOf(), (new Date('2022-01-01T18:00:00')).valueOf());
    })

    it('setUTCFullYear(y,m) - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setUTCFullYear(2023, 2);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setUTCFullYear');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setUTCFullYear()');
        assert.strictEqual(beforeEvents[0].arguments.length, 2);
        assert.isTrue(beforeEvents[0].wasValue instanceof Date);
        assert.strictEqual(beforeEvents[0].wasValue.valueOf(), (new Date('2021-01-01T18:00:00')).valueOf());
        assert.isTrue(beforeEvents[0].value instanceof Date);
        assert.strictEqual(beforeEvents[0].value.valueOf(), (new Date('2023-03-01T18:00:00')).valueOf());
        assert.strictEqual(afterEvents[0].action, 'setUTCFullYear()');
        assert.strictEqual(afterEvents[0].arguments.length, 2);
        assert.isTrue(afterEvents[0].wasValue instanceof Date);
        assert.strictEqual(afterEvents[0].wasValue.valueOf(), (new Date('2021-01-01T18:00:00')).valueOf());
        assert.isTrue(afterEvents[0].value instanceof Date);
        assert.strictEqual(afterEvents[0].value.valueOf(), (new Date('2023-03-01T18:00:00')).valueOf());

        assert.strictEqual(obj.valueOf(), (new Date('2023-03-01T18:00:00')).valueOf());
    })

    it('setUTCFullYear(y,m,d) - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setUTCFullYear(2023, 2, 2);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setUTCFullYear');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setUTCFullYear()');
        assert.strictEqual(beforeEvents[0].arguments.length, 3);
        assert.isTrue(beforeEvents[0].wasValue instanceof Date);
        assert.strictEqual(beforeEvents[0].wasValue.valueOf(), (new Date('2021-01-01T18:00:00')).valueOf());
        assert.isTrue(beforeEvents[0].value instanceof Date);
        assert.strictEqual(beforeEvents[0].value.valueOf(), (new Date('2023-03-02T18:00:00')).valueOf());
        assert.strictEqual(afterEvents[0].action, 'setUTCFullYear()');
        assert.strictEqual(afterEvents[0].arguments.length, 3);
        assert.isTrue(afterEvents[0].wasValue instanceof Date);
        assert.strictEqual(afterEvents[0].wasValue.valueOf(), (new Date('2021-01-01T18:00:00')).valueOf());
        assert.isTrue(afterEvents[0].value instanceof Date);
        assert.strictEqual(afterEvents[0].value.valueOf(), (new Date('2023-03-02T18:00:00')).valueOf());

        assert.strictEqual(obj.valueOf(), (new Date('2023-03-02T18:00:00')).valueOf());
    })

    it('setUTCHours - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00');
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

        let result = proxy.setUTCHours(12);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setUTCHours');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setUTCHours()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 18);
        assert.strictEqual(beforeEvents[0].value, 12);
        assert.strictEqual(afterEvents[0].action, 'setUTCHours()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 18);
        assert.strictEqual(afterEvents[0].value, 12);

        assert.strictEqual(obj.valueOf(), (new Date('2021-01-01T12:00:00')).valueOf());
    })

    it('setUTCMilliseconds - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:00.123');
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

        let result = proxy.setUTCMilliseconds(10);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setUTCMilliseconds');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setUTCMilliseconds()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 123);
        assert.strictEqual(beforeEvents[0].value, 10);
        assert.strictEqual(afterEvents[0].action, 'setUTCMilliseconds()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 123);
        assert.strictEqual(afterEvents[0].value, 10);

        assert.strictEqual(obj.valueOf(), (new Date('2021-01-01T18:00:00.010')).valueOf());
    })

    it('setUTCMinutes - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:20:00.123');
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

        let result = proxy.setUTCMinutes(30);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setUTCMinutes');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setUTCMinutes()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 20);
        assert.strictEqual(beforeEvents[0].value, 30);
        assert.strictEqual(afterEvents[0].action, 'setUTCMinutes()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 20);
        assert.strictEqual(afterEvents[0].value, 30);

        assert.strictEqual(obj.valueOf(), (new Date('2021-01-01T18:30:00.123')).valueOf());
    })

    it('setUTCMonth - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:20:00.123');
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

        let result = proxy.setUTCMonth(1);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setUTCMonth');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setUTCMonth()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 0);
        assert.strictEqual(beforeEvents[0].value, 1);
        assert.strictEqual(afterEvents[0].action, 'setUTCMonth()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 0);
        assert.strictEqual(afterEvents[0].value, 1);

        assert.strictEqual(obj.valueOf(), (new Date('2021-02-01T18:20:00.123')).valueOf());
    })

    it('setUTCSeconds - listeners are fired', function () {
        const beforeEvents = [];
        const afterEvents = [];
        const getEvents = [];

        const obj = new Date('2021-01-01T18:00:20.123');
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

        let result = proxy.setUTCSeconds(30);
        assert.strictEqual(typeof result, 'number');
        assert.strictEqual(getEvents.length, 1);
        assert.strictEqual(getEvents[0].type, 'getProperty');
        assert.strictEqual(getEvents[0].property, 'setUTCSeconds');
        assert.strictEqual(typeof getEvents[0].result, 'function');
        assert.strictEqual(beforeEvents.length, 1);
        assert.strictEqual(afterEvents.length, 1);
        assert.strictEqual(beforeEvents[0].action, 'setUTCSeconds()');
        assert.strictEqual(beforeEvents[0].arguments.length, 1);
        assert.strictEqual(beforeEvents[0].wasValue, 20);
        assert.strictEqual(beforeEvents[0].value, 30);
        assert.strictEqual(afterEvents[0].action, 'setUTCSeconds()');
        assert.strictEqual(afterEvents[0].arguments.length, 1);
        assert.strictEqual(afterEvents[0].wasValue, 20);
        assert.strictEqual(afterEvents[0].value, 30);

        assert.strictEqual(obj.valueOf(), (new Date('2021-01-01T18:00:30.123')).valueOf());
    })
})