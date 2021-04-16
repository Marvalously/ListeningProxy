![LOGO](docs/assets/ListeningProxy.js-logo.svg)

[![npm](https://img.shields.io/npm/v/listening-proxy.svg?label=npm%20listening-proxy)](https://www.npmjs.com/package/listening-proxy)
[![GitHub](https://img.shields.io/github/license/Marvalously/ListeningProxy.svg)](https://github.com/Marvalously/ListeningProxy)

## Overview
A Javascript deep proxy that can have listeners added
_(an event listener based alternative to both [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) and the defunct [Object.observe()](https://esdiscuss.org/topic/an-update-on-object-observe))_.

## Example

```javascript
import { CreateListeningProxy, EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_AFTER_CHANGE } from 'listening-proxy.js';
 
const myOriginalObject = {
    foo: 'bar',
    buzz: false
};
 
const myProxyObject = CreateListeningProxy(myOriginalObject);

// add some listeners...
myProxyObject.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
    console.log('First listener', evt);
    if (evt.action === 'set' && evt.property === 'buzz' && evt.value === true) {
        // stop other 'beforeChange' listeners firing...
        evt.stopPropagation();
    }
});
myProxyObject.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
    console.log('Second listener', evt);
    if (evt.action === 'set' && evt.property === 'foo') {
        // stop the property actually being set...
        // (will also stop any 'afterChange' listeners firing)
        evt.preventDefault();
    }
});
myProxyObject.addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
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
* Multiple event listeners - with propagation prevention
* Proxy listen on special objects (with event notification of all setter/change methods)
  * Typed Arrays
  * Date
  * Set
  * Map
  * _and class instances_

# Reference

#### Exports
<table width="100%">
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/Function-blue" alt="Function">
          <strong>CreateListeningProxy</strong>
        </td>
        <td valign="top">
          <em>Main function for creating listening proxies on objects</em>
        </td>
    </tr>
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/Class-blue" alt="Class">
          <strong>ListeningProxyFactory</strong>
        </td>
        <td valign="top">
          <em>Factory for creating listening proxies</em>
        </td>
    </tr>
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/String-blue" alt="String">
          <strong>EVENT_TYPE_BEFORE_CHANGE</strong>
        </td>
        <td valign="top">
          <em>Event type for before change listeners</em><br>
          <code>"beforeChange"</code>
        </td>
    </tr>
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/String-blue" alt="String">
          <strong>EVENT_TYPE_AFTER_CHANGE</strong>
        </td>
        <td valign="top">
          <em>Event type for after change listeners</em><br>
          <code>"afterChange"</code>
        </td>
    </tr>
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/String-blue" alt="String">
          <strong>EVENT_TYPE_GET_PROPERTY</strong>
        </td>
        <td valign="top">
          <em>Event type for get property listeners</em><br>
          <code>"getProperty"</code>
        </td>
    </tr>
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/String-blue" alt="String">
          <strong>EVENT_TYPE_EXCEPTION_HANDLER</strong>
        </td>
        <td valign="top">
          <em>Event type for exception handler listeners (i.e. exceptions within other listeners)</em><br>
          <code>"exceptionHandler"</code>
        </td>
    </tr>
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/String-blue" alt="String">
          <strong>EVENT_TYPE_GET_TREEWALKER</strong>
        </td>
        <td valign="top">
          <em>Event type for get treewalker listeners</em><br>
          <code>"getTreewalker"</code>
        </td>
    </tr>
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/Symbol-blue" alt="Symbol">
          <strong>SYMBOL_IS_PROXY</strong>
        </td>
        <td valign="top">
          <em>Symbol used to determine if an object is a listening proxy</em>
        </td>
    </tr>
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/Symbol-blue" alt="Symbol">
          <strong>SYMBOL_PROXY_TARGET</strong>
        </td>
        <td valign="top">
          <em>Symbol for obtaining the underlying target object of a listening proxy</em>
        </td>
    </tr>
    <tr>
        <td valign="top" nowrap>
          <img src="https://img.shields.io/badge/Symbol-blue" alt="Symbol">
          <strong>SYMBOL_PROXY_LISTENERS</strong>
        </td>
        <td valign="top">
          <em>Symbol for obtaining the underlying proxy listeners of a listening proxy</em>
        </td>
    </tr>
</table>

#### Creating the listening proxy

```javascript
import { CreateListeningProxy } from 'listening-proxy.js';
 
let obj = {
    'foo': 'bar'
};
let objProxy = CreateListeningProxy(obj);
```
<br>

#### Determining if an object is a listening proxy
```javascript
import { CreateListeningProxy, SYMBOL_IS_PROXY } from 'listening-proxy.js';
 
let obj = {
    'foo': 'bar'
};
let objProxy = CreateListeningProxy(obj);
 
// see if each is a proxy...
console.log( obj[SYMBOL_IS_PROXY] );  // expect output: undefined
console.log( myProxy[SYMBOL_IS_PROXY] );  // expect output: true
```
<br>

#### Obtaining the underlying target object of a listening proxy
```javascript
import { CreateListeningProxy, SYMBOL_PROXY_TARGET } from 'listening-proxy.js';

let obj = {
    'foo': 'bar'
};
let objProxy = CreateListeningProxy(obj);

// get the target...
let target = myProxy[SYMBOL_PROXY_TARGET];
```
<br>

#### Creating a listening proxy on an object that is already a listening proxy?
<em>Don't Panic!  You do not need to check if the object is already a listening proxy - creating a listening proxy on an object that is already a listening proxy will just return the original listening proxy.</em>
```javascript
import { CreateListeningProxy } from 'listening-proxy.js';

let obj = {
    'foo': 'bar'
};

let objProxy = CreateListeningProxy(obj);

let anotherProxy = CreateListeningProxy(objProxy);

console.log(objProxy === anotherProxy);  // output: true
```
<br>

#### Adding listeners when creating a listening proxy
There are two ways to achieve this...
```javascript
import { CreateListeningProxy, EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_BEFORE_CHANGE } from 'listening-proxy.js';

let obj = {
    'foo': 'bar'
};

let objProxy = CreateListeningProxy(obj)
    .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
        console.log('Before change', evt.snapshot);
    })
    .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
      console.log('After change', evt.snapshot);
    });

objProxy.foo = 'baz';
```
or...
```javascript
import { CreateListeningProxy, EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_BEFORE_CHANGE } from 'listening-proxy.js';

let obj = {
    'foo': 'bar'
};

let objProxy = CreateListeningProxy(obj,
    {
        'eventType': EVENT_TYPE_BEFORE_CHANGE,
        'listener': evt => {
          console.log('Before change', evt.snapshot);
        } 
    },
    {
        'eventType': EVENT_TYPE_AFTER_CHANGE,
        'listener': evt => {
            console.log('After change', evt.snapshot);
        }
    }
);

objProxy.foo = 'baz';
```

#### Can I add listeners to different parts of an object tree?
<em>Yes!...</em>
```javascript
import { CreateListeningProxy, EVENT_TYPE_BEFORE_CHANGE, EVENT_TYPE_BEFORE_CHANGE } from 'listening-proxy.js';

let obj = {
    foo: {
        bar: {
            baz: {
                qux: true
            }
        } 
    }
};

let objProxy = CreateListeningProxy(obj)
    .addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
          console.log('Before change', evt.snapshot);
      })
      .addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
        console.log('After change', evt.snapshot);
      });

let sub = objProxy.foo.bar;
sub.addListener(EVENT_TYPE_BEFORE_CHANGE, evt => {
    console.log('Sub before change', evt.snapshot);
}).addListener(EVENT_TYPE_AFTER_CHANGE, evt => {
    console.log('Sub after change', evt.snapshot);
});

objProxy.foo.bar.baz.qux = false; // will fire all 4 event listeners!
sub.baz.qux = true; // will also fire all 4 event listeners!
// note that listeners added at different parts of the tree - the event .path property is relative!
```
<br>

## Listeners & Event Reference

<hr>

### `EVENT_TYPE_BEFORE_CHANGE`

_Listen for changes prior to them being enacted on the underlying target_

Example:
```javascript
import { CreateListeningProxy, EVENT_TYPE_BEFORE_CHANGE } from 'listening-proxy.js';

const obj = { foo: 'bar' };
const proxy = CreateListeningProxy(obj);

proxy.addListener(EVENT_TYPE_BEFORE_CHANGE, event => {
    // handle the 'event' as instance of BeforeChangeEvent 
});
```

<table width="100%">
    <tr>
        <th colspan="2" align="left">
          <img src="https://img.shields.io/badge/Event-blue" alt="Event">
          BeforeChangeEvent<br>
          <img src="https://img.shields.io/badge/propagates-yes-green" alt="Event">&nbsp;<img src="https://img.shields.io/badge/preventable-yes-green" alt="Event">
        </th>
    </tr>
    <tr>
        <th colspan="2" align="left">Properties</th>
    </tr>
    <tr>
        <th align="left">Property</th>
        <th align="left">Description</th>
    </tr>
    <tr>
        <td><code><strong>action</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String-blue"><br>
            <em>The action being performed - one of:</em>
            <ul>
              <li><code>"set"</code> <em>when the value of a property (or array item) is being set</em></li>
              <li><code>"deleteProperty"</code> <em>when a property is being deleted</em></li>
              <li><em>the name of the method causing the change (e.g. if <code><em>obj.splice()</em></code> is called then this value would be <code><em>"splice()"</em></code>)</em></li>
            </ul>
        </td>
    </tr>
    <tr>
        <td><code><strong>arguments</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Array%20|%20undefined-blue"><br>
            <em>If the change event is caused by a method call, this value will be the arguments that were passed to that method</em><br>
            <em>If the change was not caused by a method call then this will be <code><em>undefined</em></code></em>
        </td>
    </tr>
    <tr>
        <td><code><strong>defaultPerformed</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether the default action (on the underlying target) has already been performed</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>defaultPrevented</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether the default action has been prevented</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>path</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Array-blue"><br>
            <em>The path to the item being changed (excluding the actual property)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>preventable</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether this event is preventable (always <code><em>true</em></code> for this event type)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>propagates</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether this event propagates (always <code><em>true</em></code> for this event type)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>propagationStopped</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether propagation has been stopped on this event (i.e. no further listeners will receive this event)</em><br>
            <em>Use the <code><em><strong>stopPropagation()</strong></em></code> method on this event to set this</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>property</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String%20|%20Number%20|%20undefined-blue"><br>
            <em>The property being changed.</em><br>
            <em>When a property of an object is being changed this value will be the name of the property being changed.
            When an item in an array is being changed this value will be the array index being changed.</em><br>
            <em>When the change is due to a method this value will be <code><em>undefined</em></code></em>
        </td>
    </tr>
    <tr>
        <td><code><strong>proxy</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>            
            <em>The actual proxy object on which this event was fired</em><br>
            <em>WARNING: Mutating this object within listeners will cause serious problems - like infinite recursive calls to listeners</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>snapshot</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>As the event propagates through multiple listeners it will be mutated - this property provides a snapshot object of the event that isn't mutated (useful for logging/debugging purposes)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>target</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>The actual underlying object on which this event was fired</em><br>
            <em>WARNING: Mutating this object within listeners will cause serious problems</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>type</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String-blue"><br>
            <em>The type of this event</em><br>
            <em>For this event, returns <code><em>EVENT_TYPE_BEFORE_CHANGE</em></code> (<code><em>"beforeChange"</em></code>)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>value</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-%3f-blue"><br>
            <em>The value being set.</em><br>
            <em>If the change is caused by a method call then this will usually be <code><em>undefined</em></code></em>
        </td>
    </tr>
    <tr>
        <td><code><strong>wasValue</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-%3f-blue"><br>
            <em>The value prior to being set.</em><br>
            <em>If the change is caused by a method call then this will usually be <code><em>undefined</em></code></em>
        </td>
    </tr>
    <tr>
        <th colspan="2" align="left">Methods</th>
    </tr>
    <tr>
        <td><code><strong>performDefault()</strong></code></td>
        <td>
            <em>Call this method to perform the default change within the listener</em><br>
            <em>This method can only be called once - subsequent calls by this or other listeners will be ignored.   Calls to this method will also be ignored if the <code><em><strong>preventDefault()</strong></em></code> method has previously been called.</em><br>
            <em>Note: Calling this method does not stop the after change event listeners being called.</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>preventDefault()</strong></code></td>
        <td>
            <em>Call this method to prevent the default change from occurring.</em><br>
            <em>Note: Preventing the default change on a before change event will also stop after change event listeners being called (i.e. the change didn't happen!).</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>stopPropagation()</strong></code></td>
        <td>
            <em>Call this method to stop further propagation of this event to other listeners of the same type</em>
        </td>
    </tr>
</table>

<br><hr>

### `EVENT_TYPE_AFTER_CHANGE`

_Listen for changes after they have been enacted on the underlying target_

Example:
```javascript
import { CreateListeningProxy, EVENT_TYPE_AFTER_CHANGE } from 'listening-proxy.js';

const obj = { foo: 'bar' };
const proxy = CreateListeningProxy(obj);

proxy.addListener(EVENT_TYPE_AFTER_CHANGE, event => {
    // handle the 'event' as instance of AfterChangeEvent 
});
```

<table width="100%">
    <tr>
        <th colspan="2" align="left">
          <img src="https://img.shields.io/badge/Event-blue" alt="Event">
          AfterChangeEvent<br>
          <img src="https://img.shields.io/badge/propagates-yes-green" alt="Event">&nbsp;<img src="https://img.shields.io/badge/preventable-no-red" alt="Event">
        </th>
    </tr>
    <tr>
        <th colspan="2" align="left">Properties</th>
    </tr>
    <tr>
        <th align="left">Property</th>
        <th align="left">Description</th>
    </tr>
    <tr>
        <td><code><strong>action</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String-blue"><br>
            <em>The action being performed - one of:</em>
            <ul>
              <li><code>"set"</code> <em>when the value of a property (or array item) is being set</em></li>
              <li><code>"deleteProperty"</code> <em>when a property is being deleted</em></li>
              <li><em>the name of the method causing the change (e.g. if <code><em>obj.splice()</em></code> is called then this value would be <code><em>"splice()"</em></code>)</em></li>
            </ul>
        </td>
    </tr>
    <tr>
        <td><code><strong>arguments</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Array%20|%20undefined-blue"><br>
            <em>If the change event is caused by a method call, this value will be the arguments that were passed to that method</em><br>
            <em>If the change was not caused by a method call then this will be <code><em>undefined</em></code></em>
        </td>
    </tr>
    <tr>
        <td><code><strong>path</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Array-blue"><br>
            <em>The path to the item being changed (excluding the actual property)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>preventable</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether this event is preventable (always <code><em>false</em></code> for this event type)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>propagates</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether this event propagates (always <code><em>true</em></code> for this event type)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>propagationStopped</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether propagation has been stopped on this event (i.e. no further listeners will receive this event)</em><br>
            <em>Use the <code><em><strong>stopPropagation()</strong></em></code> method on this event to set this</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>property</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String%20|%20Number%20|%20undefined-blue"><br>
            <em>The property being changed.</em><br>
            <em>When a property of an object is being changed this value will be the name of the property being changed.
            When an item in an array is being changed this value will be the array index being changed.</em><br>
            <em>When the change is due to a method this value will be <code><em>undefined</em></code></em>
        </td>
    </tr>
    <tr>
        <td><code><strong>proxy</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>The actual proxy object on which this event was fired</em><br>
            <em>WARNING: Mutating this object within listeners will cause serious problems - like infinite recursive calls to listeners</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>snapshot</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>As the event propagates through multiple listeners it will be mutated - this property provides a snapshot object of the event that isn't mutated (useful for logging/debugging purposes)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>target</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>The actual underlying object on which this event was fired</em><br>
            <em>WARNING: Mutating this object within listeners will cause serious problems</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>type</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String-blue"><br>
            <em>For this event, returns <code><em>EVENT_TYPE_AFTER_CHANGE</em></code> (<code><em>"afterChange"</em></code>)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>value</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-%3f-blue"><br>
            <em>The value being set.</em><br>
            <em>If the change is caused by a method call then this will usually be <code><em>undefined</em></code></em>
        </td>
    </tr>
    <tr>
        <td><code><strong>wasValue</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-%3f-blue"><br>
            <em>The value prior to being set.</em><br>
            <em>If the change is caused by a method call then this will usually be <code><em>undefined</em></code></em>
        </td>
    </tr>
    <tr>
        <th colspan="2" align="left">Methods</th>
    </tr>
    <tr>
        <td><code><strong>stopPropagation()</strong></code></td>
        <td>
            <em>Call this method to stop further propagation of this event to other listeners of the same type</em>
        </td>
    </tr>
</table>

<br><hr>

### `EVENT_TYPE_GET_PROPERTY`

_Listen for all get property actions on an object (this includes gets for functions/methods)_

Example:
```javascript
import { CreateListeningProxy, EVENT_TYPE_GET_PROPERTY } from 'listening-proxy.js';

const obj = { foo: 'bar' };
const proxy = CreateListeningProxy(obj);

proxy.addListener(EVENT_TYPE_GET_PROPERTY, event => {
    // handle the 'event' as instance of GetPropertyEvent 
});
```

<table width="100%">
    <tr>
        <th colspan="2" align="left">
          <img src="https://img.shields.io/badge/Event-blue" alt="Event">
          GetPropertyEvent<br>
          <img src="https://img.shields.io/badge/propagates-yes-green" alt="Event">&nbsp;<img src="https://img.shields.io/badge/preventable-yes-green" alt="Event">
        </th>
    </tr>
    <tr>
        <th colspan="2" align="left">Properties</th>
    </tr>
    <tr>
        <th align="left">Property</th>
        <th align="left">Description</th>
    </tr>
    <tr>
        <td><code><strong>asAction</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String-blue"><br>
            <em>(see <code><em><strong>preventDefault()</strong></em></code> method)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>defaultPrevented</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether the default action has been prevented</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>defaultResult</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-%3f-blue"><br>
            <em>The default result (returned value) for the get</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>firesBeforesAndAfters</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>(see <code><em><strong>preventDefault()</strong></em></code> method)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>path</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Array-blue"><br>
            <em>The path to the item being retrieved (excluding the actual property)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>preventable</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether this event is preventable (always <code><em>true</em></code> for this event type)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>propagates</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether this event propagates (always <code><em>true</em></code> for this event type)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>propagationStopped</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether propagation has been stopped on this event (i.e. no further listeners will receive this event)</em><br>
            <em>Use the <code><em><strong>stopPropagation()</strong></em></code> method on this event to set this</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>property</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String%20|%20Number%20|%20undefined-blue"><br>
            <em>The property being retrieved.</em><br>
            <em>When a property of an object is being retrieved (or a method of an object) this value will be the name of the property/method being retrieved.
            When an item in an array is being retrieved this value will be the array index being retrieved.</em><br>
        </td>
    </tr>
    <tr>
        <td><code><strong>proxy</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>The actual proxy object on which this event was fired</em><br>
            <em>WARNING: Mutating this object within listeners will cause serious problems - like infinite recursive calls to listeners</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>result</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-%3f-blue"><br>
            <em>The actual result (returned value) for the get</em><br>
            <em>(see <code><em><strong>preventDefault()</strong></em></code> method)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>snapshot</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>As the event propagates through multiple listeners it will be mutated - this property provides a snapshot object of the event that isn't mutated (useful for logging/debugging purposes)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>target</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>The actual underlying object on which this event was fired</em><br>
            <em>WARNING: Mutating this object within listeners will cause serious problems</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>type</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String-blue"><br>
            <em>For this event, returns <code><em>EVENT_TYPE_GET_PROPERTY</em></code> (<code><em>"getProperty"</em></code>)</em>
        </td>
    </tr>
    <tr>
        <th colspan="2" align="left">Methods</th>
    </tr>
    <tr>
        <td><code><strong>preventDefault(</strong>replacementResult [, firesBeforesAndAfters [, asAction]]<strong>)</strong></code></td>
        <td>
            <em>Calling this method prevents the default result of the get operation being returned</em><br>
            <em><strong>Arguments:</strong></em><br>
            <ul>
                <li>
                    <code><strong>replacementResult</strong></code>&nbsp;<img src="https://img.shields.io/badge/Required-Any-blue"><br>
                    <em>the replacement result</em>
                </li>
                <li>
                    <code><strong>firesBeforesAndAfters</strong></code>&nbsp;<img src="https://img.shields.io/badge/Optional-Boolean-blue"><br>
                    <em>whether, if the replacement result is a function, before and after events should be fired</em>
                </li>
                <li>
                    <code><strong>asAction</strong></code>&nbsp;<img src="https://img.shields.io/badge/Optional-String-blue"><br>
                    <em>if before and after events are to be fired - the <code>action</code> that will be passed to those event listeners</em>
                </li>
            </ul>
        </td>
    </tr>
    <tr>
        <td><code><strong>stopPropagation()</strong></code></td>
        <td>
            <em>Call this method to stop further propagation of this event to other listeners of the same type</em>
        </td>
    </tr>
</table>


<br><hr>

### `EVENT_TYPE_EXCEPTION_HANDLER`

_Listen for exceptions in other listeners._

_By default, listening proxy 'swallows' any exceptions throwm/encountered within listeners (although they are still output as console errors).
By adding an EVENT_TYPE_EXCEPTION_HANDLER listener such exceptions can be handled and, if required, surfaced._

Example:
```javascript
import { CreateListeningProxy, EVENT_TYPE_EXCEPTION_HANDLER } from 'listening-proxy.js';

const obj = { foo: 'bar' };
const proxy = CreateListeningProxy(obj);

proxy.addListener(EVENT_TYPE_EXCEPTION_HANDLER, event => {
    // handle the 'event' as instance of ExceptionHandlerEvent
    // example to surface exception...
    throw event.exception;
});
```

<table width="100%">
    <tr>
        <th colspan="2" align="left">
          <img src="https://img.shields.io/badge/Event-blue" alt="Event">
          ExceptionHandlerEvent<br>
          <img src="https://img.shields.io/badge/propagates-yes-green" alt="Event">&nbsp;<img src="https://img.shields.io/badge/preventable-no-red" alt="Event">
        </th>
    </tr>
    <tr>
        <th colspan="2" align="left">Properties</th>
    </tr>
    <tr>
        <th align="left">Property</th>
        <th align="left">Description</th>
    </tr>
    <tr>
        <td><code><strong>event</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>The original event that was being handled at the point the exception occurred</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>exception</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Exception-blue"><br>
            <em>The exception that occurred</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>handler</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Function-blue"><br>
            <em>The handler function in which the exception occurred</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>preventable</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether this event is preventable (always <code><em>false</em></code> for this event type)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>propagates</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether this event propagates (always <code><em>true</em></code> for this event type)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>propagationStopped</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Boolean-blue"><br>
            <em>Whether propagation has been stopped on this event (i.e. no further listeners will receive this event)</em><br>
            <em>Use the <code><em><strong>stopPropagation()</strong></em></code> method on this event to set this</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>proxy</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>The actual proxy object on which this event was fired</em><br>
            <em>WARNING: Mutating this object within listeners will cause serious problems - like infinite recursive calls to listeners</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>snapshot</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>As the event propagates through multiple listeners it will be mutated - this property provides a snapshot object of the event that isn't mutated (useful for logging/debugging purposes)</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>target</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-Object-blue"><br>
            <em>The actual underlying object on which this event was fired</em><br>
            <em>WARNING: Mutating this object within listeners will cause serious problems</em>
        </td>
    </tr>
    <tr>
        <td><code><strong>type</strong></code></td>
        <td>
            <img src="https://img.shields.io/badge/READ%20ONLY-String-blue"><br>
            <em>For this event, returns <code><em>EVENT_TYPE_EXCEPTION_HANDLER</em></code> (<code><em>"exceptionHandler"</em></code>)</em>
        </td>
    </tr>
    <tr>
        <th colspan="2" align="left">Methods</th>
    </tr>
    <tr>
        <td><code><strong>stopPropagation()</strong></code></td>
        <td>
            <em>Call this method to stop further propagation of this event to other listeners of the same type</em>
        </td>
    </tr>
</table>

<br><hr>

## Supported On
<table>
    <tr>
        <td align="center" valign="top">
            <img src="/docs/assets/node-logo.png" alt="Node" width="32" height="32"/>
        </td>
        <td align="center" valign="top">
            <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/35.1.0/chrome/chrome_512x512.png" alt="Chrome" width="32" height="32"/>
        </td>
        <td align="center" valign="top">
            <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/35.1.0/firefox/firefox_512x512.png" alt="Firefox" width="32" height="32"/>
        </td>
        <td align="center" valign="top">
            <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/35.1.0/safari-ios/safari-ios_512x512.png" alt="Safari iOS" width="32" height="32"/>
        </td>
        <td align="center" valign="top">
            <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/35.1.0/edge/edge_512x512.png" alt="Edge" width="32" height="32"/>
        </td>
        <td align="center" valign="top">
            <img src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/35.1.0/opera/opera_512x512.png" alt="Opera" width="32" height="32"/>
        </td>
    </tr>
</table>
