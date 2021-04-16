import { assert, expect } from './testFramework.js';
import * as lpx from '../../src/listening-proxy.js';

import * as createBasics from './tests-CreateBasics.js';
import * as listenerBasics from './tests-ListenerBasics.js';
import * as listenersExtended from './tests-ListenersExtended.js';
import * as removals from './tests-Removals.js';
import * as arrays from './tests-Arrays.js';
import * as typedArrays from './tests-TypedArrays.js';
import * as classInstances from './tests-ClassInstances.js';
import * as sets from './tests-Sets.js';
import * as maps from './tests-Maps.js';
import * as dates from './tests-Dates.js';

const EXPECTED_EXPORTS = new Map([
    ['CreateListeningProxy', 'function'],
    ['ListeningProxyFactory', 'function'],
    ['SYMBOL_IS_PROXY', 'symbol'],
    ['SYMBOL_PROXY_TARGET', 'symbol'],
    ['SYMBOL_PROXY_LISTENERS', 'symbol'],
    ['EVENT_TYPE_BEFORE_CHANGE', 'string'],
    ['EVENT_TYPE_AFTER_CHANGE', 'string'],
    ['EVENT_TYPE_GET_PROPERTY', 'string'],
    ['EVENT_TYPE_GET_TREEWALKER', 'string'],
    ['EVENT_TYPE_EXCEPTION_HANDLER', 'string']
]);

describe('Check exports', function () {
    it('Expected exports', function () {
        for (let expName in lpx) {
            let exp = lpx[expName];
            assert.isTrue(EXPECTED_EXPORTS.has(expName), "Unexpected export '" + expName + "' (type '" + (typeof exp) + "')");
        }
        for (let [key, value] of EXPECTED_EXPORTS) {
            assert.isTrue(lpx[key] !== undefined, "Expected export '" + key + "'");
            assert.strictEqual(typeof lpx[key], value, "Export '" + key + "' should be type '" + value + "' - but is '" + typeof lpx[key] + "'");
        }
    })

    it('ListeningProxyFactory cannot be constructed', function () {
        expect(() => {
            const proxy = new lpx.ListeningProxyFactory();
        }).to.throw("ListeningProxyFactory cannot be instantiated with constructor - use ListeningProxyFactory.create()");
    })

    it('ListeningProxyFactory static methods', function () {
        assert.strictEqual(typeof lpx.ListeningProxyFactory.create, 'function');
        assert.strictEqual(typeof lpx.ListeningProxyFactory.treeWalk, 'function');
    })

    it('Event type constants consistent', function () {
        assert.strictEqual(lpx.EVENT_TYPE_BEFORE_CHANGE, 'beforeChange');
        assert.strictEqual(lpx.EVENT_TYPE_AFTER_CHANGE, 'afterChange');
        assert.strictEqual(lpx.EVENT_TYPE_GET_PROPERTY, 'getProperty');
        assert.strictEqual(lpx.EVENT_TYPE_GET_TREEWALKER, 'getTreewalker');
        assert.strictEqual(lpx.EVENT_TYPE_EXCEPTION_HANDLER, 'exceptionHandler');
    })
})
