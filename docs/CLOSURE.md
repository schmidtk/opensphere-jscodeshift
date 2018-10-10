# Replacing the Closure Library

## jscodeshift

The following can be replaced by `jscodeshift` transforms in this project:

```
goog.bind
goog.exportProperty
goog.isBoolean
goog.isDef
goog.isDefAndNotNull
goog.isNull
goog.isNumber
goog.isString
goog.array.clear
goog.array.find
goog.array.findIndex
goog.array.forEach
goog.string.contains
```

## Search/Replace

These can be replaced with a simple search and replace:

| Replace  | With |
| --- | --- |
| `goog.array.contains` | `ol.array.includes` |
| `goog.array.remove` | `ol.array.remove` |
| `goog.debug.expose` | `JSON.stringify` |
| `goog.functions.FALSE` | `ol.functions.FALSE` |
| `goog.functions.TRUE` | `ol.functions.TRUE` |
| `goog.getUid` | `ol.getUid` |
| `goog.inherits` | `ol.inherits` |
| `goog.isArrayLike` | `Array.isArray` |
| `goog.isArray` | `Array.isArray` |
| `goog.now` | `Date.now` |
| `goog.nullFunction` | `ol.nullFunction` |
| `goog.string.padNumber` | `ol.string.padNumber` |
| `goog.events.EventType.PROPERTYCHANGE` | `ol.ObjectEventType.PROPERTYCHANGE` |

## Closure Library Usage

To generate a list of `goog.*` usage in a project, use the `usage` NPM script. This generates usage information in `.build/goog-usage` from a base source directory. For example, to generate usage for OpenSphere:

```
yarn run usage ../opensphere/src
```

The output file contains a list of all `goog.*` references along with how many times each item is used. This does not include comments.

## TODO

### goog.require and goog.provide

These will go last, and the change has to be coordinated with dependent projects. These will eventually be replaced with ES6 modules (import/export), but could possibly be replaced with `goog.module` temporarily to allow a slower transition. More investigation is needed to determine if that will be useful or not.

### Events

The `goog.events` framework is used heavily in OpenSphere, and we will need a replacement. We should look into `ol.events` first and see if it meets our needs.

### Logging

OpenSphere needs a logging framework that at minimum supports log levels, and for full parity needs a logger hierarchy with per-class/namespace/etc levels. A hierarchy is often more complicated than necessary and doesn't seem to get much use, so that can likely be dropped.

[`loglevel`](https://www.npmjs.com/package/loglevel) is a lightweight alternative that's available from NPM. It can be directly imported as an ES6 module but has an ES5 build that OpenSphere can use now. It will require some custom code to log messages to a UI instead of the console, but that seems to be the case for all open source JS loggers.

[`winston`](https://github.com/winstonjs/winston) is the most popular Node.js logging framework. It supports multiple loggers and different transport mechanisms (could be useful for Electron), and is very extensible. v3 (due out June 2018) allegedly has browser support, but there are a few open issues regarding that. The biggest roadblock is that there isn't an ES5 build, so OpenSphere can't use it until it's fully switched over to ES6.

### Full List

The following is an exhaustive list of `goog.*` usage in OpenSphere that does not yet have an alternative.

```
goog.DEBUG
goog.Disposable
goog.Promise
goog.Promise.CancellationError
goog.Promise.all
goog.Promise.reject
goog.Promise.resolve
goog.Thenable
goog.Timer
goog.Timer.TICK
goog.Timer.callOnce
goog.Timer.clear
goog.Uri
goog.Uri.QueryData
goog.Uri.QueryData.createFromMap
goog.Uri.resolve
goog.abstractMethod
goog.addSingletonGetter
goog.array.binaryInsert
goog.array.binaryRemove
goog.array.binarySearch
goog.array.binarySelect
goog.array.bucket
goog.array.clone
goog.array.defaultCompare
goog.array.equals
goog.array.every
goog.array.extend
goog.array.filter
goog.array.flatten
goog.array.indexOf
goog.array.insert
goog.array.insertArrayAt
goog.array.insertAt
goog.array.inverseDefaultCompare
goog.array.join
goog.array.map
goog.array.moveItem
goog.array.reduce
goog.array.removeAllIf
goog.array.removeAt
goog.array.removeDuplicates
goog.array.removeIf
goog.array.rotate
goog.array.slice
goog.array.some
goog.array.sort
goog.array.sortObjectsByKey
goog.array.splice
goog.asserts.assert
goog.asserts.assertElement
goog.asserts.assertInstanceof
goog.asserts.assertString
goog.asserts.fail
goog.async.ConditionalDelay
goog.async.Deferred
goog.async.Deferred.fail
goog.async.Deferred.succeed
goog.async.DeferredList
goog.async.Delay
goog.async.Throttle
goog.async.nextTick
goog.color.Rgb
goog.color.alpha
goog.color.darken
goog.color.hexToHsl
goog.color.hexToRgb
goog.color.highContrast
goog.color.hslArrayToHex
goog.color.hslArrayToRgb
goog.color.lighten
goog.color.parse
goog.color.rgbArrayToHex
goog.color.rgbArrayToHsl
goog.crypt.hash32.encodeString
goog.date.Date
goog.date.DateLike
goog.date.DateTime
goog.date.UtcDateTime
goog.db.Cursor
goog.db.Cursor.EventType.COMPLETE
goog.db.Cursor.EventType.NEW_DATA
goog.db.Error
goog.db.IndexedDb
goog.db.IndexedDb.VersionChangeEvent
goog.db.KeyRange
goog.db.KeyRange.bound
goog.db.Transaction
goog.db.Transaction.TransactionMode
goog.db.Transaction.TransactionMode.READ_ONLY
goog.db.Transaction.TransactionMode.READ_WRITE
goog.db.deleteDatabase
goog.db.openDatabase
goog.debug.FancyWindow
goog.debug.LogManager
goog.debug.Logger
goog.define
goog.disposable.IDisposable
goog.dispose
goog.disposeAll
goog.dom.NodeType
goog.dom.NodeType.CDATA_SECTION
goog.dom.NodeType.ELEMENT
goog.dom.NodeType.TEXT
goog.dom.TagName
goog.dom.TagName.CANVAS
goog.dom.TagName.DIV
goog.dom.TagName.INPUT
goog.dom.TagName.INPUT.toString
goog.dom.TagName.SPAN
goog.dom.TagName.TEXTAREA.toString
goog.dom.ViewportSizeMonitor
goog.dom.animationFrame.polyfill.install
goog.dom.append
goog.dom.classes
goog.dom.classlist
goog.dom.classlist.add
goog.dom.classlist.contains
goog.dom.classlist.enable
goog.dom.classlist.remove
goog.dom.contains
goog.dom.createDom
goog.dom.getAncestor
goog.dom.getAncestorByClass
goog.dom.getChildren
goog.dom.getDocument
goog.dom.getElement
goog.dom.getElementByClass
goog.dom.getFirstElementChild
goog.dom.getNextElementSibling
goog.dom.getParentElement
goog.dom.getViewportSize
goog.dom.insertSiblingBefore
goog.dom.removeChildren
goog.dom.removeNode
goog.dom.safe.setInnerHtml
goog.dom.safe.setLocationHref
goog.dom.safeHtmlToNode
goog.dom.setTextContent
goog.dom.xml.createDocument
goog.dom.xml.loadXml
goog.dom.xml.serialize
goog.dom.xml.setAttributes
goog.events.BrowserEvent
goog.events.BrowserEvent.MouseButton.MIDDLE
goog.events.Event
goog.events.EventId
goog.events.EventLike
goog.events.EventTarget
goog.events.EventType
goog.events.EventType.BEFOREUNLOAD
goog.events.EventType.BLUR
goog.events.EventType.CHANGE
goog.events.EventType.CLICK
goog.events.EventType.CONTEXTMENU
goog.events.EventType.COPY
goog.events.EventType.DRAGSTART
goog.events.EventType.EXIT
goog.events.EventType.FOCUS
goog.events.EventType.LOAD
goog.events.EventType.MESSAGE
goog.events.EventType.MOUSEDOWN
goog.events.EventType.MOUSEENTER
goog.events.EventType.MOUSELEAVE
goog.events.EventType.MOUSEMOVE
goog.events.EventType.MOUSEOUT
goog.events.EventType.MOUSEOVER
goog.events.EventType.MOUSEUP
goog.events.EventType.PASTE
goog.events.EventType.POINTERDOWN
goog.events.EventType.PROPERTYCHANGE
goog.events.EventType.RESIZE
goog.events.EventType.SUBMIT
goog.events.FileDropHandler
goog.events.FileDropHandler.EventType
goog.events.FileDropHandler.EventType.DROP
goog.events.Key
goog.events.KeyCodes
goog.events.KeyCodes.CTRL
goog.events.KeyCodes.DASH
goog.events.KeyCodes.DOWN
goog.events.KeyCodes.ENTER
goog.events.KeyCodes.EQUALS
goog.events.KeyCodes.ESC
goog.events.KeyCodes.FF_DASH
goog.events.KeyCodes.FF_EQUALS
goog.events.KeyCodes.K
goog.events.KeyCodes.L
goog.events.KeyCodes.LEFT
goog.events.KeyCodes.META
goog.events.KeyCodes.N
goog.events.KeyCodes.NUM_MINUS
goog.events.KeyCodes.NUM_PLUS
goog.events.KeyCodes.O
goog.events.KeyCodes.PAGE_DOWN
goog.events.KeyCodes.PAGE_UP
goog.events.KeyCodes.PERIOD
goog.events.KeyCodes.R
goog.events.KeyCodes.RIGHT
goog.events.KeyCodes.S
goog.events.KeyCodes.SHIFT
goog.events.KeyCodes.SPACE
goog.events.KeyCodes.U
goog.events.KeyCodes.UP
goog.events.KeyCodes.V
goog.events.KeyCodes.Y
goog.events.KeyCodes.Z
goog.events.KeyEvent
goog.events.KeyHandler
goog.events.KeyHandler.EventType.KEY
goog.events.KeyNames
goog.events.Listenable
goog.events.ListenableKey
goog.events.MouseWheelEvent
goog.events.MouseWheelHandler
goog.events.MouseWheelHandler.EventType.MOUSEWHEEL
goog.events.listen
goog.events.listenOnce
goog.events.removeAll
goog.events.unlisten
goog.events.unlistenByKey
goog.exportSymbol
goog.format.JsonPrettyPrinter
goog.fs.FileReader
goog.fs.FileReader.readAsArrayBuffer
goog.functions.and
goog.fx.AbstractDragDrop.EventType.DRAGEND
goog.fx.AbstractDragDrop.EventType.DRAGOUT
goog.fx.AbstractDragDrop.EventType.DRAGOVER
goog.fx.AbstractDragDrop.EventType.DRAGSTART
goog.fx.AbstractDragDrop.EventType.DROP
goog.fx.DragDrop
goog.fx.DragDropEvent
goog.html.SafeHtml
goog.html.SafeHtml.create
goog.html.SafeHtml.htmlEscape
goog.html.SafeStyleSheet
goog.html.SafeStyleSheet.concat
goog.html.SafeStyleSheet.fromConstant
goog.html.TrustedResourceUrl
goog.html.TrustedResourceUrl.BASE_URL_
goog.html.TrustedResourceUrl.fromConstant
goog.i18n.DateTimeFormat
goog.isDateLike
goog.isFunction
goog.isObject
goog.iter.Iterator
goog.iter.StopIteration
goog.iter.filter
goog.iter.forEach
goog.iter.toArray
goog.json.isValid
goog.labs.userAgent.util
goog.log.Logger
goog.log.error
goog.log.fine
goog.log.getLogger
goog.log.hasOwnProperty
goog.log.info
goog.log.warning
goog.math.Box
goog.math.Coordinate
goog.math.Coordinate.distance
goog.math.Line
goog.math.Matrix
goog.math.Range
goog.math.Range.contains
goog.math.Range.equals
goog.math.Range.fromPair
goog.math.Range.intersection
goog.math.RangeSet
goog.math.RangeSet.equals
goog.math.Size
goog.math.clamp
goog.math.lerp
goog.math.nearlyEquals
goog.math.toDegrees
goog.math.toRadians
goog.mixin
goog.net.Cookies
goog.net.ErrorCode
goog.net.ErrorCode.HTTP_ERROR
goog.net.ErrorCode.getDebugMessage
goog.net.EventType
goog.net.EventType.ABORT
goog.net.EventType.COMPLETE
goog.net.EventType.ERROR
goog.net.EventType.READY_STATE_CHANGE
goog.net.EventType.SUCCESS
goog.net.EventType.TIMEOUT
goog.net.WebSocket
goog.net.WebSocket.EXPONENTIAL_BACKOFF_
goog.net.WebSocket.EventType.CLOSED
goog.net.WebSocket.EventType.OPENED
goog.net.WebSocket.MessageEvent
goog.net.XhrIo
goog.net.XhrIo.FORM_CONTENT_TYPE
goog.net.XhrIo.ResponseType
goog.net.XhrIo.ResponseType.ARRAY_BUFFER
goog.net.XhrIo.ResponseType.DEFAULT
goog.net.XhrIo.ResponseType.DOCUMENT
goog.net.XmlHttp.ReadyState
goog.net.XmlHttp.ReadyState.COMPLETE
goog.net.XmlHttp.ReadyState.INTERACTIVE
goog.net.XmlHttp.ReadyState.LOADING
goog.net.jsloader.Error
goog.net.jsloader.safeLoad
goog.object.clear
goog.object.clone
goog.object.containsKey
goog.object.containsValue
goog.object.createSet
goog.object.equals
goog.object.extend
goog.object.findValue
goog.object.forEach
goog.object.get
goog.object.getAnyValue
goog.object.getCount
goog.object.getKeys
goog.object.getValueByKeys
goog.object.getValues
goog.object.isEmpty
goog.object.remove
goog.object.set
goog.object.unsafeClone
goog.partial
goog.provide
goog.reflect
goog.reflect.objectProperty
goog.removeUid
goog.require
goog.storage.Storage
goog.storage.mechanism.ErrorCode
goog.storage.mechanism.ErrorCode.INVALID_VALUE
goog.storage.mechanism.ErrorCode.QUOTA_EXCEEDED
goog.storage.mechanism.ErrorCode.STORAGE_DISABLED
goog.storage.mechanism.HTML5LocalStorage
goog.storage.mechanism.IterableMechanism
goog.storage.mechanism.Mechanism
goog.storage.mechanism.PrefixedMechanism
goog.storage.mechanism.mechanismfactory
goog.storage.mechanism.mechanismfactory.create
goog.string.Const
goog.string.Const.create__googStringSecurityPrivate_
goog.string.Const.from
goog.string.buildString
goog.string.caseInsensitiveCompare
goog.string.caseInsensitiveContains
goog.string.caseInsensitiveEquals
goog.string.createUniqueString
goog.string.endsWith
goog.string.escapeString
goog.string.floatAwareCompare
goog.string.getRandomString
goog.string.hashCode
goog.string.htmlEscape
goog.string.isAlpha
goog.string.isEmptyOrWhitespace
goog.string.isEmptySafe
goog.string.isNumeric
goog.string.makeSafe
goog.string.newLineToBr
goog.string.normalizeSpaces
goog.string.normalizeWhitespace
goog.string.numerateCompare
goog.string.path
goog.string.path.extension
goog.string.regExpEscape
goog.string.remove
goog.string.removeAll
goog.string.startsWith
goog.string.stripQuotes
goog.string.toNumber
goog.string.toTitleCase
goog.string.trim
goog.string.truncate
goog.string.unescapeEntities
goog.structs.CircularBuffer
goog.structs.Collection
goog.structs.LinkedMap
goog.structs.Map
goog.structs.every
goog.structs.getValues
goog.style.setElementShown
goog.style.setWidth
goog.typeOf
goog.ui.ColorPicker
goog.ui.ColorPicker.SIMPLE_GRID_COLORS
goog.uri.utils.ComponentIndex.DOMAIN
goog.uri.utils.ComponentIndex.PATH
goog.uri.utils.ComponentIndex.PORT
goog.uri.utils.ComponentIndex.SCHEME
goog.uri.utils.ComponentIndex.USER_INFO
goog.uri.utils.split
goog.userAgent.EDGE
goog.userAgent.GECKO
goog.userAgent.IE
goog.userAgent.LINUX
goog.userAgent.MAC
goog.userAgent.PLATFORM
goog.userAgent.VERSION
goog.userAgent.WEBKIT
goog.userAgent.WINDOWS
goog.userAgent.getUserAgentString
goog.userAgent.isVersionOrHigher
goog.userAgent.product
goog.userAgent.product.CHROME
goog.userAgent.product.EDGE
goog.userAgent.product.FIREFOX
goog.userAgent.product.IE
goog.userAgent.product.OPERA
goog.userAgent.product.SAFARI
goog.userAgent.product.isVersion
goog.window.open
```
