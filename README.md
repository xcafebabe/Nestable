Nestable
========


## Changes from the forked repository

### 03-05-2014

  * Avoid not-needed deep copy of the whole tree if there is no `reject` option
  * Allow delayed start of reordering (via tap-n-hold), using `startDelayMsec` option

Nestable is an experimental example and not under active development. If it suits your requirements feel free to expand upon it!

## Usage

Write your nested HTML lists like so:

```html
<div class="dd">
  <ol class="dd-list">
      <li class="dd-item" data-id="1">
          <div class="dd-handle">Item 1</div>
      </li>
      <li class="dd-item" data-id="2">
          <div class="dd-handle">Item 2</div>
      </li>
      <li class="dd-item" data-id="3">
          <div class="dd-handle">Item 3</div>
          <ol class="dd-list">
              <li class="dd-item" data-id="4">
                  <div class="dd-handle">Item 4</div>
              </li>
              <li class="dd-item" data-id="5">
                  <div class="dd-handle">Item 5</div>
              </li>
          </ol>
      </li>
  </ol>
</div>
```

Then activate with jQuery like so:

```javascript
$('.dd').nestable({ /* config options */ });
```

### Events

The `change` event is fired when items are reordered.

```javascript
$('.dd').on('change', function() {
	/* on change event */
});
```

The `expand/collapse` event is fired when an item group is expanded or collapsed.

```javascript
$('.dd-item').on('expand', function() {
	/* on expand event */
});

$('.dd-item').on('collapse', function() {
	/* on collapse event */
});
```

### Methods

You can get a serialised object with all `data-*` attributes for each item.

```javascript
$('.dd').nestable('serialize');
```

The serialised JSON for the example above would be:

```javascript
[{"id":1},{"id":2},{"id":3,"children":[{"id":4},{"id":5}]}]
```

You can deactivate the plugin by running

```javascript
$('.dd').nestable('destroy');
```

### Configuration

You can change the follow options:

* `maxDepth` number of levels an item can be nested (default `5`)
* `group` group ID to allow dragging between lists (default `0`)

These advanced config options are also available:

* `listNodeName` The HTML element to create for lists (default `'ol'`)
* `itemNodeName` The HTML element to create for list items (default `'li'`)
* `rootClass` The class of the root element `.nestable()` was used on (default `'dd'`)
* `listClass` The class of all list elements (default `'dd-list'`)
* `itemClass` The class of all list item elements (default `'dd-item'`)
* `dragClass` The class applied to the list element that is being dragged (default `'dd-dragel'`)
* `handleClass` The class of the content element inside each list item (default `'dd-handle'`)
* `collapsedClass` The class applied to lists that have been collapsed (default `'dd-collapsed'`)
* `placeClass` The class of the placeholder element (default `'dd-placeholder'`)
* `emptyClass` The class used for empty list placeholder elements (default `'dd-empty'`)
* `expandBtnHTML` The HTML text used to generate a list item expand button (default `'<button data-action="expand">Expand></button>'`)
* `collapseBtnHTML` The HTML text used to generate a list item collapse button (default `'<button data-action="collapse">Collapse</button>'`)
* `dropCallback` The callback method which is called when an item has been successfully moved. It has 1 argument: object with all details (default `null`)
* `startDelayMsec` The timeout to start D-n-D operation after touching on the target, allows Tap-and-hold implementation (default `0`)

`dropCallback` details object:

* `sourceId` - id of moved element
* `destId` - id of destination parent or null if element was moved directly as root
* `sourceEl` - whole moved element if you want to gather additional info about it
* `destParent` - whole destination parent element (if root, then it returns direct container)
* `destRoot` - contains destination group where element was dropped
* `sourceRoot` - contains source group where element belonged to before user started dragging it

**Inspect the [Nestable Demo](http://lukasoppermann.github.com/Nestable/) for guidance.**

**Author**   
David Bushell [http://dbushell.com](http://dbushell.com/) [@dbushell](http://twitter.com/dbushell/)

**Contributors**
Lukas Oppermann [http://vea.re](http://vea.re/) [@lukasoppermann](http://twitter.com/lukasoppermann/)
Kirill Maximov [@maxkir](http://twitter.com/maxkir/)

Copyright © 2012-2013 David Bushell | BSD & MIT license
