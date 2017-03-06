### UI Scroll - [AngularJS](http://angularjs.org/) directive to provide infinite scroll over a limited element buffer

[![Build Status](https://travis-ci.org/angular-ui/ui-scroll.svg?branch=master)](https://travis-ci.org/angular-ui/ui-scroll) 
[![npm version](https://badge.fury.io/js/angular-ui-scroll.svg)](http://badge.fury.io/js/angular-ui-scroll) 
[![Bower version](https://badge.fury.io/bo/angular-ui-scroll.svg)](http://badge.fury.io/bo/angular-ui-scroll) 
[![Join the chat at https://gitter.im/angular-ui/ui-scroll](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/angular-ui/ui-scroll?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


### Quick links

- [Introduction](#introduction)
    - [Why?](#why)
    - [How it works](#how-it-works)
    - [Basic usage](#basic-usage)
    - [Examples](#examples)
    - [Install and connect](#install-and-connect)
- [uiScroll directive](#uiscroll-directive)
    - [Parametrs](#parametrs)
    - [Datasource](#datasource)
    - [Adapter](#adapter)
- [uiScrollViewport directive](#uiscrollviewport-directive)
- [jqLiteExtras service](#jqliteextras-service)
- [uiScrollTh and uiScrollTd](#uiscrollth-and-uiscrolltd-directives)
    - [GridAdapter](#gridadapter)
- [Development](#development)
- [Change log](#change-log)


-------------------


## Introduction


### Why?

The common way to present to the user a list of data elements of undefined length is to start with a small portion at the top of
the list - just enough to fill the space on the page. Additional rows are appended to the bottom of the list as the user scrolls
down the list.

The problem with this approach is that even though rows at the top of the list become invisible as they scroll out of the view,
they are still a part of the page and still consume resources. As the user scrolls down the list grows and the web app slows down.

This becomes a real problem if the html representing a row has event handlers and/or angular watchers attached. A web app of an average
complexity can easily introduce 20 watchers per row. Which for a list of 100 rows gives you total of 2000 watchers and a sluggish app.


### How it works

The uiScroll directive solves the problem just described by dynamically destroying elements as they become invisible and recreating
them if they become visible again.

The uiScroll directive is similar to the ngRepeat. Like the ngRepeat, uiScroll directive instantiates a template once per item from a
collection. Each template instance gets its own scope, where the given loop variable is set to the current collection item. The
collection content is provided by the datasource.

The directive is asking the datasource for data to build and render elements until it has enough elements to fill out the viewport.
It will start retrieving new data for new elements again if the user scrolls up/down to the edge of visible element list.


![](https://raw.githubusercontent.com/angular-ui/ui-scroll/master/demo/ui-scroll-demo.gif)


### Basic usage

```html
<ANY ui-scroll-viewport>
  <ANY ui-scroll="items in datasource" ... >
      ...
  </ANY>
</ANY>
```
Listing `ANY` for the tag, the directive can be applied to, stretches the truth - a little bit. The directive works well with majority
of the 'usual' tags - divs, spans, a, inputs, etc. For all of them the viewport should be a div (unless it is the window). Some other
tags require special treatment. If the repeated tag is a li, it is best to use ul or ol as a viewport. For a tr as a repeated tag the
viewport has to be the table or tbody. dl as a repeated tag is not supported.

The viewport is an element representing the space where the items from the collection are to be shown. Unless specified explicitly with
the [uiScrollViewport](#uiscrollviewport-directive) directive, browser window will be used as the viewport.

_Important!_ The viewport height must be constrained. If the height of the viewport is not constrained 
(style="height:auto") it will pull the entire content of the datasource and may throw an Error depending on the number of items
in the datasource. Even if it does not, using the directive this way does not provide any advantages over using ng-repeat, because
item template will be always instantiated for every item in the datasource.

_Important!_ There is a Scroll Anchoring feature enforced by Google Chrome (since Chrome 56) which makes scroller behaviour incorrect.
The ui-scroll-viewport directive eliminates this effect by disabling the 'overflow-anchor' css-property on its element.
But if the ui-scroll-viewport is not presented in the template, you should take care of this manually.


### Examples

We have built pull of examples covering a number of use-cases, showing various ways to use the ui-scroll directive. Each demo is
absolutely independent and has its own html-page and the javascript file with the same name and .js extension.

To run the examples use __[this link](http://rawgithub.com/angular-ui/ui-scroll/master/demo/index.html)__.


### Install and connect

To install the package via npm use

```
npm install --save angular-ui-scroll
```

After installation, the ui-scroll distributive files will be available as

```
<script src="node_modules/angular-ui-scroll/dist/ui-scroll.min.js">
<script src="node_modules/angular-ui-scroll/dist/ui-scroll-grid.min.js">
```

There are also uncompressed versions (ui-scroll.js, ui-scroll-grid.js) and sourcemaps for all of js-files.

To use it in your angular-app you should add the module (modules)

```
angular.module('application', ['ui.scroll', 'ui.scroll.grid'])
```

Currently we have 2 regular modules which can be added to the angular-app you are developing.
 - __ui.scroll__ module which has
   - [uiScroll directive](#uiscroll-directive)
   - [uiScrollViewport directive](#uiscrollviewport-directive)
   - [jqLiteExtras service](#jqliteextras-service) (with runner)
 - __ui.scroll.grid__ module which has
   - [uiScrollTh directive](#uiscrollth-and-uiscrolltd-directives)
   - [uiScrollTd directive](#uiscrollth-and-uiscrolltd-directives)
  
Also there is one more additional module in a separate file
 - __ui.scroll.jqlite__ module
It is empty since it was deprecated in v1.6.0.
  
  
-------------------


## uiScroll directive
 

```html
<div ui-scroll="item in myDatasource"
	 buffer-size="5"
	 padding="1"
	 start-index="100"
	 adapter="myAdapter"
>{{item}}</div>
```

### Parameters
 
* **uiScroll – scroll expression** – The expression indicating how to enumerate a collection. Only one format is currently supported: `variable in datasource` – where variable is the user defined loop variable and datasource is the name of the data source to enumerate.
* **buffer-size - expression**, optional - number of items requested from the datasource in a single request. The default is 10 and the minimal value is 3.
* **padding - expression**, optional - extra height added to the visible area for the purpose of determining when the items should be created/destroyed. The value is relative to the visible height of the area, the default is 0.5 and the minimal value is 0.3.
* **start-index - expression**, optional - index of the first item to be requested from the datasource. The default is 1.
* **adapter - assignable expression**, optional - if provided a reference to the adapter object for the scroller instance will be injected in the appropriate scope. If you have multiple scrollers within the same viewport, make sure that every one of them has its unique adapter name.

Some of the properties offered by the adapter can also be accessed directly from the directive by using matching attributes. In the same way as for the adapter attribute, syntax for such attributes allows for providing a reference expression to be used to access the corresponding value. Below is a list of such attributes:

* **is-loading - assignable expression**, optional - a boolean value indicating whether there are any pending load requests will be injected in the appropriate scope. See also `isLoading` adapter property, which is preferable.
* **top-visible - assignable expression**, optional - a reference to the item currently in the topmost visible position will be injected in the appropriate scope. See also `topVisible` adapter property, which is preferable.
* **top-visible-element - assignable expression**, optional - a reference to the DOM element currently in the topmost visible position will be injected in the appropriate scope. See also `topVisibleElement` adapter property, which is preferable.
* **top-visible-scope - assignable expression**, optional - a reference to the scope created for the item currently in the topmost visible position will be injected in the appropriate scope. See also `topVisibleScope` adapter property, which is preferable.

The `expression` can be any angular expression (assignable expression where so specified). All expressions are evaluated once at the time when the scroller is initialized. Changes in the expression value after scroller initialization will have no impact on the scroller behavior.

The `assignable expressions` will be used by scroller to inject the requested value into the target scope.
The target scope is being defined in accordance with standard Angular rules (nested scopes and controller As syntax should be taken into account):
the scroller will traverse its parents (from the ui-scroll element's scope up to the $rootScope) to locate the target scope.
If the viewport is presented (the element marked with the [uiScrollViewport](#uiscrollviewport-directive) directive),
then the scope associated with the viewport will be a start point in the target scope locating.
Angular $parse service is being used in `assignable expressions` implementation.

_Deprecated!_ The format `expression on controller` introduced in v1.5.0 (and deprecated in v1.6.1) can be used to explicitly target the scope associated with the specified controller as the target scope for the injection. In this format `expression` is any angular assignable expression, and `controller` is the name of controller constructor function as specified in the `ng-controller` directive.

### Datasource

Data source is an object to be used by the uiScroll directive to access the data.

The directive will locate the object using the provided data source name. It will first look for a property with the given name on its
$scope ([here](https://github.com/angular-ui/ui-scroll/blob/master/demo/scopeDatasource) is the example of
scope-based datasource usage). If none found it will try to get an angular service with the provided name
([here](https://github.com/angular-ui/ui-scroll/blob/master/demo/serviceDatasource) is the example of
service-based datasource usage).

The data source object implements methods and properties to be used by the directive to access the data.

* Method `get`

        get(descriptor, success)
     or
     
        get(index, count, success)

    This is a mandatory method used by the directive to retrieve the data.

    Parameters
    * **descriptor** is an object defining the portion of the dataset requested. The object will have 3 properties. Two of them named  `index` and `count`. They have the same meaning as in the alternative signature when the parameters passed explicitly (see below). The third one will be named either `append` if the items will be appended to the last item in the buffer, or `prepend` if they are to be prepended to the first item in the buffer. The value of the property in either case will be the item the new items will be appended/prepended to. This is useful if it is easier to identify the items to be added based on the previously requested items rather than on the index. Keep in mind that in certain use cases (i.e. on initial load) the value of the append/prepend property can be undefined.
    * **index** indicates the first data row requested
    * **count** indicates number of data rows requested
    * **success** function to call when the data are retrieved. The implementation of the data source has to call this function when the data are retrieved and pass it an array of the items retrieved. If no items are retrieved, an empty array has to be passed.

_Important!_ Make sure to respect the `index` and `count` parameters of the request. The array passed to the success method should have
exactly `count` elements unless it hit eof/bof.

* Properties `minIndex` and  `maxIndex`

    As the scroller receives the items requested by the `get` method, the value of minimum and maximum values of the item index are placed in the `minIndex` and `maxIndex` properties respectively. The values of the properties are cumulative - the value of the `minIndex` will never increase, and the value of the `maxIndex` will never decrease - except the values are reset in response to a call to the adapter `reload` method. The values of the properties are used to maintain the appearance of the scroller scrollBar.

    Values of the properties can be assigned programmatically. If the range of the index values is known in advance, assigning them programmatically would improve the usability of the scrollBar.


###Adapter

The adapter object is an internal object created for every instance of the scroller. Properties and methods of the adapter can be used to manipulate and assess the scroller the adapter was created for.

Adapter object implements the following properties:

* `isLoading` - a boolean value (read only) indicating whether there are any pending load requests.
* `topVisible` - a read only reference to the item currently in the topmost visible position.
* `topVisibleElement` - a read only reference to the DOM element currently in the topmost visible position.
* `topVisibleScope` - a read only reference to the scope created for the item currently in the topmost visible position.
* `disabled` - setting `disabled` to `true` disables scroller's scroll/resize events handlers. This can be useful if you have multiple scrollers within the same scrollViewport and you want to prevent some of them from responding to the events.

Adapter object implements the following methods

* Method `isBOF`

        isBOF()

    Returns `true` if the first item of the dataset is already in the buffer. No further requests for preceding items will be issued, returns `false` otherwise.

* Method `isEOF`

        isEOF()

    Returns `true` if the last item of the dataset is already in the buffer. No further requests for tailing items will be issued, returns `false` otherwise.

* Method `isEmpty`

        isEmpty()

    Returns `true` if the dataset is empty and the internal buffer length = 0. Returns `false` otherwise. Mind that isEmpty() will return `true` during the **first** request is pending, so maybe it should be used together with `isLoading` property. 

* Method `reload`

        reload()
     or

        reload(startIndex)

    Calling this method reinitializes and reloads the scroller content. `startIndex` is an integer indicating what item index the scroller will use to start the load process. The value of the argument replaces the value provided with the start-index attribute.  Calling `reload()` is equivalent to calling `reload` method with current value of the `start-index` attribute.

    _Important!_ `startIndex` should fall within underlying datset boundaries. The scroller will request two batches of items one starting from the `startIndex` and another one preceding the first one (starting from `startIndex - bufferSize`). If both requests come back empty, the scroller will consider the dataset to be empty and will place no further data requests.

* Method `applyUpdates`

            applyUpdates(index, newItems)

    Replaces the item in the buffer at the given index with the new items.

    Parameters
    * **index** provides position of the item to be affected in the dataset (not in the buffer). If the item with the given index currently is not in the buffer no updates will be applied. `$index` property of the item $scope can be used to access the index value for a given item
    * **newItems** is an array of items to replace the affected item. If the array is empty (`[]`) the item will be deleted, otherwise the items in the array replace the item. If the newItem array contains the old item, the old item stays in place.

            applyUpdates(updater)

    Updates scroller content as determined by the updater function

    Parameters
    * **updater** is a function to be applied to every item currently in the buffer. The function will receive 3 parameters: `item`, `scope`, and `element`. Here `item` is the item to be affected, `scope` is the item $scope, and `element` is the html element for the item. The return value of the function should be an array of items. Similarly to the `newItem` parameter (see above), if the array is empty(`[]`), the item is deleted, otherwise the item is replaced by the items in the array. If the return value is not an array, the item remains unaffected, unless some updates were made to the item in the updater function. This can be thought of as in place update.

* Method `append`

            append(newItems)

    Adds new items after the last item in the buffer.

    Parameters
    * **newItems** provides an array of items to be appended.

* Method `prepend`

            prepend(newItems)

    Adds new items before the first item in the buffer.

    Parameters
    * **newItems** provides an array of items to be prepended.

#### Manipulating the scroller content with adapter methods
Adapter methods `applyUpdates`, `append` and `prepend` provide a way to update the scroller content without full reload of the content from the datasource. The updates are performed by changing the items in the scroller internal buffer after they are loaded from the datasource. Items in the buffer can be deleted or replaced with one or more items.

_Important!_ Update datasource to match the scroller buffer content. Keep in mind that the modifications made by the adapter methods are only applied to the content of the buffer. As the items in response to scrolling are pushed out of the buffer, the modifications are lost. It is your responsibility to ensure that as the scroller is scrolled back and a modified item is requested from the datasource again the values returned by the datasource would reflect the updated state. In other words you have to make sure that in addition to manipulating the scroller content you also apply the modifications to the dataset underlying the datasource.
[Here](https://rawgit.com/angular-ui/ui-scroll/master/demo/append/append.html) is the example of such implementation.

#### Animations
In the fashion similar to ngRepeat the following animations are supported:
* .enter - when a new item is added to the list
* .leave - when an item is removed from the list

Animations are only supported for the updates made via applyUpdates method. Updates caused by scrolling are not going through animation transitions. Usual [rules](https://docs.angularjs.org/api/ngAnimate) of working with Angular animations apply. Look [here](http://rawgit.com/angular-ui/ui-scroll/master/demo/animation/animation.html) for an example of animations in the scroller


-------------------


## uiScrollViewport directive

The uiScrollViewport directive marks a particular element as viewport for the uiScroll directive.
If no parent of the uiScroll directive is marked with uiScrollViewport directive,
the browser window object will be used as viewport.

###Usage

```html
<ANY ui-scroll-viewport>
      ...
</ANY>
```


-------------------


## jqLiteExtras service

This service implements some DOM element methods of jQuery which are currently not implemented in jqLite, namely

* before(elem)
* height() and height(value)
* outerHeight() and outerHeight(true)
* scrollTop() and scrollTop(value)
* offset()

These methods are being registered on angular.element during 'ui.scroll' module run automatically only if jQuery is not loaded.
It is so since ui-scroll v1.6.0. In previous versions there was a separate module 'ui.scroll.jqlite' which should have been
included in the dependency list of the main app module. So currently we leave 'ui.scroll.jqlite' module stub with no content
to provide full backward compatibility.


-------------------


## uiScrollTh and uiScrollTd directives

The uiScrollTh and uiScrollTd directives provide a way to build flexible dynamic grids. Handling of grid rows is done by the uiScroll directive itself. In addition to this uiScrollTh and uiScrollTd directive provide tools to programmatically change grid layout, including applying styles to columns, changing column size and order, as well as saving the modifications to the layout and applying previously saved layouts.
At this point the above functionality is supported only for table based scrollable grids.

Here is the basic html template for scrollable grid using the uiScrollTh and uiScrollTd directives. Keep in mind that the height of the scroll viewport (in this case the `<TABLE>` tag) should be constrained. Also, make sure that the initial column widths are applied uniformly to both headers (`<TH>`) and cells (`<TD>`)

```html
<TABLE ui-scroll-viewport class="grid">
    <THEAD style="display:block">
       <TR>
         <TH ui-scroll-th class="col1">header 1...</TH>
         <TH ui-scroll-th class="col2">header 2...</TH>
         ...
       </TR>
    </THEAD>
    <TBODY>
       <TR ui-scroll="item in datasource" adapter="adapter">
         <TD ui-scroll-td class="col1">...</TD>
         <TD ui-scroll-td class="col2">...</TD>
         ...
       </TR>
    </TBODY>
</TABLE>
```

The grid directives have the same dependency requirements as the uiScroll directive itself. To use the directives make sure the `ui.scroll.grid` module is on the list of the module dependencies. Also you have to load the dist/ui-scroll-grid.js file in your page.

### GridAdapter

GridAdapter object (along with ColumnAdapter objects) provides methods and properties to be used to change the scrollable grid layout.
A reference to this object is injected as a property named `gridAdapter`in the scroller `adapter`.

`GridAdapter` object implements the following properties:

* Property `columns` - returns an array of ColumnAdapter objects to be used to control the scrollable grid layout. The columns are listed in the same order as they appear in the browser.

`GridAdapter` object implements the following methods:

* Method `getLayout()` - returns an object describing current scrollable grid layout.
* Method `applyLayout(layout)` - restores scrollabel grid layout to the state as defined by the object passed as the parameter
* Method `columnFromPoint(x,y)` - if the coordinates belong to a scrollable grid column returns the appropriate ColumnAdapter object. Otherwise, returns `undefined`.

`ColumnAdapter` object implements the following methods:

* Method `css(name, value)` - sets the css property `name` to `value` for the column header as well as for the column cells.
* Method `moveBefore(column)` - moves the column in front of the column referenced by the parameter. If the parameter is null, the column will become the rightmost column.


-------------------


## Development

Please feel free to make Pull Requests. Below is the information which could be useful for local developing and contributing.

The ui-scroll sources are in [./src](https://github.com/angular-ui/ui-scroll/tree/master/src) folder. They could not be run as is
because of ES6 modules (since v1.6.0), they should be built. Build process includes jshint sources verification, webpack-based
distributive files forming and tests running.

There are some npm scripts available for developing.

 __1__. To run dev-server use
 
```
npm start
```
  
  This should start development server on 5005 port over the [./demo](https://github.com/angular-ui/ui-scroll/tree/master/demo) folder.
  The middleware is configured to provide work with temporary distributive files (./temp) despite the direct links to public distributive
  files (./dist). So the dist-folder should stay clear until the development is finished. Dev-server watches for the source codes (./src)
  and automatically re-build temporary distributive files.
  
 __2__. To run tests in keep-alive mode use
 
```
npm test
```
  
  This runs karma testing against temporary distributive files (./temp). We created a number of specifications which consist of more
  than 160 tests. They are living at the [./test](https://github.com/angular-ui/ui-scroll/tree/master/test) folder. Karma watches for temp
  and test folders changes and automatically re-runs tests.

 __3__. To run both dev-server and tests in keep-alive mode use

```
npm run dev
```

  This is the combination of first two scripts running in concurrently mode. This allows you to work with the ui-scroll examples on 5005 port
  during continuous tests running.

 __4__. To run full build process use
 
```
npm run build
```
  
  After developing and testing complete, the build process should be run to
  a) pass through jshint,
  b) generate minified versions of distributive,
  c) run tests with minified distributive files,
  d) obtain all necessary files in the [./dist](https://github.com/angular-ui/ui-scroll/tree/master/dist) folder.

PR should include source code (./scr) changes, may include tests (./test) changes and may not include public distributive (./dist) changes.
  

-------------------


## Change log

###v1.6.1
 * Refactored Adapter assignments logic
 * Fixed Chrome Scroll Anchoring enforced feature [bug](https://github.com/angular-ui/ui-scroll/issues/138)

###v1.6.0
 * Introduced ES6 modules in the source codes.
 * Improved build process with Webpack.
 * Added sourcemaps. Fixed dev-server.
 * Removed 'ui.scroll.jqlite' module. Added jqLiteExtras service to 'ui.scroll' module.
 * Significantly changed the README.

###v1.5.2
* Refactored assignable expressions and attributes scope bindings.
* Added new demos and tests. Fixed IE compatibility.

###v1.5.1
* Refactored adjustments during elements append/prepend.
* Bof/eof information is accessible out of the scroller.

###v1.5.0
* Implemented uiScrollTh and uiScrollTd directives; uiScroll major refactoring.
* Added "disabled" property to the adapter object to ignore user's scroll events.
* Implemented "on controller" syntax to specify the scope where an adapter object has to be injected.

###v1.4.1
* Developed a new complex approach of padding elements height calculation (see [details](https://github.com/angular-ui/ui-scroll/pull/77)).
* Added startIndex attribute.
* Changed clipTop/clipBottom methods logic.
* Some new demos, tests, cleanup and other minor refactoring.

###v1.4.0
* Migrated sources from CoffeeScript to ES6.
* Optimized scroll events handling, removed odd $digest cycles.
* Examples (demo) refactoring.

###v1.3.3
* Implemented new signature of the Datasource get(descriptor, success) method.
* Implemented new signature of the Adapter reload(startIndex) method.
* Changed the logic of scroll bar adjustment (minIndex, maxIndex).

###v1.3.2
* Implemented the logic for adjustBuffer triggering during invisible items became visible.

###v1.3.1
* Changed the logic of viewport scroll/padding recalculation (to solve the problem [#8](https://github.com/angular-ui/ui-scroll/issues/8)).
* Splitted test specifications.
* Updated dev-dependencies (package.json).
* Implemented append/prepend methods on the adapter.

###v1.3.0
* Reorganized the repository structure.

###v1.2.1
* Dismiss pending requests on applyUpdates().

###v1.2.0
* Changed the algorithm of list items building.
* Integration with angular $animation.
* Insert/update/delete events are no longer supported.

###v1.1.2
* Fixed inserting elements via applyUpdates error.

###v1.1.1
* Fixed jqlite on $destroy error.

###v1.1.0
* Introduced API to dynamically update scroller content.
* Deep 'name' properties access via dot-notation in template.
* Fixed the problem occurring if the scroller is $destroyed while there are requests pending: [#64](https://github.com/Hill30/NGScroller/issues/64).
