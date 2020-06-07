<p align="center"><img src="ListeningProxy.js-logo.svg" alt="ListeningProxy.js - JavaScript Proxy Provider that can have listeners added" /></p>

## Overview
Provides a Javascript `Proxy` that can have listeners added.

## Example

```javascript
import * as Proxying from '?/ListeningProxy.js';
 
let myOriginalObject = {
    foo: 'bar',
    buzz: false
};
 
let myProxyObject = Proxying.ListeningProxyFactory.create(myOriginalObject);

// add some listeners...
myProxyObject.addListener('beforeChange', evt => {
    console.log('First listener', evt);
    if (evt.action === 'set' && evt.property === 'buzz' && evt.value === true) {
        // stop other 'beforeChange' listeners firing...
        evt.stopPropagation();
    }
});
myProxyObject.addListener('beforeChange', evt => {
    console.log('Second listener', evt);
    if (evt.action === 'set' && evt.property === 'foo') {
        // stop the property actually being set...
        // (will also stop any 'afterChange' listeners firing)
        evt.preventDefault();
    }
});
myProxyObject.addListener('afterChange', evt => {
    console.log('Third listener', evt);
});
 
// now make some changes to our object...
myProxyObject.foo = 'blah';
console.log('Foo should still be bar', myProxyObject.foo);
 
myProxyObject.buzz = true;
```

## Advantages over normal Proxy

* Uses a single handler - that many listeners can hook into
* `addListener()` style similar to `addEventListener()`
* Deep listening (i.e. deep proxy)
    * Add listeners at any level in the object tree
    * Objects in tree shared in other trees fire all listeners
* Familiar `event.preventDefault()` and `event.stopPropogation()` within listeners
* `beforeChange` and `afterChange` events
* `getProperty` events - allow 'simulating' properties/functions that aren't really there (without messing with prototype) 
* Multiple event listeners - with lateral bubbling prevention
* Proxy listen on special objects (with event notification of all setter/change methods)
    * Typed Arrays *(but no support for [Symbol.iterator])*
    * Date
    * Map <span>&dagger;</span>
    * Set

<span>&dagger;<span> Values within maps are not, by default, listened on.  However, ProxyListener can be extended to support deep listening on Map values - see __`/experimental/DeepMapProxySupport.js`__

# Reference

#### API
<table width="100%">
    <tr>
        <th align="left" colspan="2">ListeningProxyFactory</th>
    </tr>
    <tr>
        <th>Method</th>
        <th>Syntax</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><strong>.create()</strong></td>
        <td>
            <code>.create(<em>target</em> [, <em>listener1</em>[, ...[, <em>listenerN</em>]]])</code><br>
            <h5>Parameters</strong></h5>
            <em><strong><code>target</code></strong></em><br>
            &nbsp;&nbsp;&nbsp;
        </td>
        <td>
            <strong>Static</strong><br>
            Used to create a listening proxy
        </td>
    </tr>
    <tr>
        <td><strong>.isClass()</strong></td>
        <td><code>.isClass(<em>object</em>)</code></td>
        <td>
            <strong>Static</strong> <em>Primarily Internal Use Only</em><br>
            Determines if a given object is a class
        </td>
    </tr>
    <tr>
        <td><strong>.treeWalk()</strong></td>
        <td><code>.treeWalk(<em>listeningProxy</em>)</code></td>
        <td>
            <strong>Static</strong> <em>Primarily Internal Use Only</em><br>
            Treewalks the given `listeningProxy` - creating listening proxies on any child objects
        </td>
    </tr>
</table>

#### Creating the listening proxy

TODO - API description

```javascript
import * as Proxying from '?/ListeningProxy.js';
 
let obj = {
    'foo': 'bar'
};
let objProxy = Proxying.ListeningProxyFactory.create(obj);
```

#### Determining if an object is a listening proxy
```javascript
import * as Proxying from '?/ListeningProxy.js';
 
let obj = {
    'foo': 'bar'
};
let objProxy = Proxying.ListeningProxyFactory.create(obj);
 
// see if each is a proxy...
console.log( obj[Proxying.SYMBOL_IS_PROXY] );  // expect output: undefined
console.log( myProxy[Proxying.SYMBOL_IS_PROXY] );  // expect output: true
```

#### Obtaining the underlying target object of a listening proxy
```javascript
import * as Proxying from '?/ListeningProxy.js';
 
let obj = {
    'foo': 'bar'
};
let objProxy = Proxying.ListeningProxyFactory.create(obj);
 
// get the target...
let target = myProxy[Proxying.SYMBOL_PROXY_TARGET]; 
console.log(target === obj);  // expect output: true
```

## Event Reference

### `beforeChange`

Description - TODO

<table width="100%">
    <tr>
        <th>Usage</th>
        <td>
            <pre><code>[proxyObject].addListener('beforeChange', function(event) {
    // handle event arg as BeforeChangeEvent here
});</code></pre>
        </td>
    </tr>
    <tr>
        <th>Propagates</th>
        <td>Yes</td>
    </tr>
    <tr>
        <th>Preventable</th>
        <td>Yes</td>
    </tr>
    <tr>
        <th>const</th>
        <td><code>EVENT_TYPE_BEFORE_OBJECT_CHANGE = 'beforeChange'</code></td>
    </tr>
    <tr>
        <th>Event</th>
        <td><code>BeforeChangeEvent</code></td>
    </tr>
</table>

#### `BeforeChangeEvent`
<table width="100%">
    <tr>
        <th colspan="2" align="left">Properties</th>
    </tr>
    <tr>
        <th align="left">Property</th>
        <th align="left">Description</th>
    </tr>
    <tr>
        <td><code>.action</code></td>
        <td>
            <code>String</code> <strong>Read only</strong> <br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.arguments</code></td>
        <td>
            <code>Array | undefined</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.defaultPerformed</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.defaultPrevented</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.path</code></td>
        <td>
            <code>Array</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.preventable</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.propagates</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.propagationStopped</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.property</code></td>
        <td>
            <code>String</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.proxy</code></td>
        <td>
            <code>Object</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.target</code></td>
        <td>
            <code>Object</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.type</code></td>
        <td>
            <code>String</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.value</code></td>
        <td>
            <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.wasValue</code></td>
        <td>
            <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <th colspan="2" align="left">Methods</th>
    </tr>
    <tr>
        <td><code>.performDefault()</code></td>
        <td>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.preventDefault()</code></td>
        <td>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.stopPropagation()</code></td>
        <td>
            TODO
        </td>
    </tr>
</table>


### `afterChange`

Description - TODO

<table width="100%">
    <tr>
        <th>Usage</th>
        <td>
            <pre><code>[proxyObject].addListener('afterChange', function(event) {
    // handle event arg as AfterChangeEvent here
});</code></pre>
        </td>
    </tr>
    <tr>
        <th>Propagates</th>
        <td>Yes</td>
    </tr>
    <tr>
        <th>Preventable</th>
        <td>No</td>
    </tr>
    <tr>
        <th>const</th>
        <td><code>EVENT_TYPE_AFTER_OBJECT_CHANGE = 'afterChange'</code></td>
    </tr>
    <tr>
        <th>Event</th>
        <td><code>AfterChangeEvent</code></td>
    </tr>
</table>

#### `AfterChangeEvent`
<table width="100%">
    <tr>
        <th colspan="2" align="left">Properties</th>
    </tr>
    <tr>
        <th align="left">Property</th>
        <th align="left">Description</th>
    </tr>
    <tr>
        <td><code>.action</code></td>
        <td>
            <code>String</code> <strong>Read only</strong> <br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.arguments</code></td>
        <td>
            <code>Array | undefined</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.path</code></td>
        <td>
            <code>Array</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.preventable</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.propagates</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.propagationStopped</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.property</code></td>
        <td>
            <code>String</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.proxy</code></td>
        <td>
            <code>Object</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.target</code></td>
        <td>
            <code>Object</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.type</code></td>
        <td>
            <code>String</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.value</code></td>
        <td>
            <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.wasValue</code></td>
        <td>
            <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <th colspan="2" align="left">Methods</th>
    </tr>
    <tr>
        <td><code>.stopPropagation()</code></td>
        <td>
            TODO
        </td>
    </tr>
</table>


### `getProperty`

Description - TODO

<table width="100%">
    <tr>
        <th>Usage</th>
        <td>
            <pre><code>[proxyObject].addListener('getProperty', function(event) {
    // handle event arg as GetPropertyEvent here
});</code></pre>
        </td>
    </tr>
    <tr>
        <th>Propagates</th>
        <td>Yes</td>
    </tr>
    <tr>
        <th>Preventable</th>
        <td>Yes</td>
    </tr>
    <tr>
        <th>const</th>
        <td><code>EVENT_TYPE_GET_PROPERTY = 'getProperty'</code></td>
    </tr>
    <tr>
        <th>Event</th>
        <td><code>GetPropertyEvent</code></td>
    </tr>
</table>

#### `GetPropertyEvent`
<table width="100%">
    <tr>
        <th colspan="2" align="left">Properties</th>
    </tr>
    <tr>
        <th align="left">Property</th>
        <th align="left">Description</th>
    </tr>
    <tr>
        <td><code>.asAction</code></td>
        <td>
            <code>String</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.defaultPrevented</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.defaultResult</code></td>
        <td>
            <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.firesBeforesAndAfters</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.path</code></td>
        <td>
            <code>Array</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.preventable</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.propagates</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.propagationStopped</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.property</code></td>
        <td>
            <code>String</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.proxy</code></td>
        <td>
            <code>Object</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.result</code></td>
        <td>
            <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.target</code></td>
        <td>
            <code>Object</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.type</code></td>
        <td>
            <code>String</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <th colspan="2" align="left">Methods</th>
    </tr>
    <tr>
        <td><code>.preventDefault()</code></td>
        <td>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.stopPropagation()</code></td>
        <td>
            TODO
        </td>
    </tr>
</table>

### `getTreewalker`

Because ListeningProxy is a deep proxy, it must be able to 'walk' the tree of any object added to the current tree.
For basic objects and arrays, the treewalking is provided by default - but by adding a listener for this event type, ProxyListener can be extended to support deep listening on other object types.

For example, __`/experimental/DeepMapProxySupport.js`__ utilises this listener and event to provide deep listening on objects added as values to a `Map()` type property. 

<table width="100%">
    <tr>
        <th>Usage</th>
        <td>
            <pre><code>[proxyObject].addListener('getTreewalker', function(event) {
    // handle event arg as GetTreewalkerEvent here
});</code></pre>
        </td>
    </tr>
    <tr>
        <th>Propagates</th>
        <td>Yes</td>
    </tr>
    <tr>
        <th>Preventable</th>
        <td>Yes</td>
    </tr>
    <tr>
        <th>const</th>
        <td><code>EVENT_TYPE_GET_TREEWALKER = 'getTreewalker'</code></td>
    </tr>
    <tr>
        <th>Event</th>
        <td><code>GetTreewalkerEvent</code></td>
    </tr>
</table>

#### `GetTreewalkerEvent`
<table width="100%">
    <tr>
        <th colspan="2" align="left">Properties</th>
    </tr>
    <tr>
        <th align="left">Property</th>
        <th align="left">Description</th>
    </tr>
    <tr>
        <td><code>.defaultPrevented</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.path</code></td>
        <td>
            <code>Array</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.preventable</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.propagates</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.propagationStopped</code></td>
        <td>
            <code>Boolean</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.proxy</code></td>
        <td>
            <code>Object</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.target</code></td>
        <td>
            <code>Object</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.treeWalker</code></td>
        <td>
            <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.type</code></td>
        <td>
            <code>String</code> <strong>Read only</strong><br>
            TODO
        </td>
    </tr>
    <tr>
        <th colspan="2" align="left">Methods</th>
    </tr>
    <tr>
        <td><code>.preventDefault()</code></td>
        <td>
            TODO
        </td>
    </tr>
    <tr>
        <td><code>.stopPropagation()</code></td>
        <td>
            TODO
        </td>
    </tr>
</table>
