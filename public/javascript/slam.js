

/**
 * hasOwnProperty.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (has.call(require.modules, path)) return path;
  }

  if (has.call(require.aliases, index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!has.call(require.modules, from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    if ('.' != path.charAt(0)) {
      var segs = parent.split('/');
      var i = lastIndexOf(segs, 'deps') + 1;
      if (!i) i = 0;
      path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
      return path;
    }
    return require.normalize(p, path);
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return has.call(require.modules, localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-indexof/index.js", function(exports, require, module){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-mousetrap/index.js", function(exports, require, module){
/**
 * Copyright 2012 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 1.1.2
 * @url craig.is/killing/mice
 */

  /**
   * mapping of special keycodes to their corresponding keys
   *
   * everything in this dictionary cannot use keypress events
   * so it has to be here to map to the correct keycodes for
   * keyup/keydown events
   *
   * @type {Object}
   */
  var _MAP = {
          8: 'backspace',
          9: 'tab',
          13: 'enter',
          16: 'shift',
          17: 'ctrl',
          18: 'alt',
          20: 'capslock',
          27: 'esc',
          32: 'space',
          33: 'pageup',
          34: 'pagedown',
          35: 'end',
          36: 'home',
          37: 'left',
          38: 'up',
          39: 'right',
          40: 'down',
          45: 'ins',
          46: 'del',
          91: 'meta',
          93: 'meta',
          224: 'meta'
      },

      /**
       * mapping for special characters so they can support
       *
       * this dictionary is only used incase you want to bind a
       * keyup or keydown event to one of these keys
       *
       * @type {Object}
       */
      _KEYCODE_MAP = {
          106: '*',
          107: '+',
          109: '-',
          110: '.',
          111 : '/',
          186: ';',
          187: '=',
          188: ',',
          189: '-',
          190: '.',
          191: '/',
          192: '`',
          219: '[',
          220: '\\',
          221: ']',
          222: '\''
      },

      /**
       * this is a mapping of keys that require shift on a US keypad
       * back to the non shift equivelents
       *
       * this is so you can use keyup events with these keys
       *
       * note that this will only work reliably on US keyboards
       *
       * @type {Object}
       */
      _SHIFT_MAP = {
          '~': '`',
          '!': '1',
          '@': '2',
          '#': '3',
          '$': '4',
          '%': '5',
          '^': '6',
          '&': '7',
          '*': '8',
          '(': '9',
          ')': '0',
          '_': '-',
          '+': '=',
          ':': ';',
          '\"': '\'',
          '<': ',',
          '>': '.',
          '?': '/',
          '|': '\\'
      },

      /**
       * this is a list of special strings you can use to map
       * to modifier keys when you specify your keyboard shortcuts
       *
       * @type {Object}
       */
      _SPECIAL_ALIASES = {
          'option': 'alt',
          'command': 'meta',
          'return': 'enter',
          'escape': 'esc'
      },

      /**
       * variable to store the flipped version of _MAP from above
       * needed to check if we should use keypress or not when no action
       * is specified
       *
       * @type {Object|undefined}
       */
      _REVERSE_MAP,

      /**
       * a list of all the callbacks setup via Mousetrap.bind()
       *
       * @type {Object}
       */
      _callbacks = {},

      /**
       * direct map of string combinations to callbacks used for trigger()
       *
       * @type {Object}
       */
      _direct_map = {},

      /**
       * keeps track of what level each sequence is at since multiple
       * sequences can start out with the same sequence
       *
       * @type {Object}
       */
      _sequence_levels = {},

      /**
       * variable to store the setTimeout call
       *
       * @type {null|number}
       */
      _reset_timer,

      /**
       * temporary state where we will ignore the next keyup
       *
       * @type {boolean|string}
       */
      _ignore_next_keyup = false,

      /**
       * are we currently inside of a sequence?
       * type of action ("keyup" or "keydown" or "keypress") or false
       *
       * @type {boolean|string}
       */
      _inside_sequence = false;

  /**
   * loop through the f keys, f1 to f19 and add them to the map
   * programatically
   */
  for (var i = 1; i < 20; ++i) {
      _MAP[111 + i] = 'f' + i;
  }

  /**
   * loop through to map numbers on the numeric keypad
   */
  for (i = 0; i <= 9; ++i) {
      _MAP[i + 96] = i;
  }

  /**
   * cross browser add event method
   *
   * @param {Element|HTMLDocument} object
   * @param {string} type
   * @param {Function} callback
   * @returns void
   */
  function _addEvent(object, type, callback) {
      if (object.addEventListener) {
          return object.addEventListener(type, callback, false);
      }

      object.attachEvent('on' + type, callback);
  }

  /**
   * takes the event and returns the key character
   *
   * @param {Event} e
   * @return {string}
   */
  function _characterFromEvent(e) {

      // for keypress events we should return the character as is
      if (e.type == 'keypress') {
          return String.fromCharCode(e.which);
      }

      // for non keypress events the special maps are needed
      if (_MAP[e.which]) {
          return _MAP[e.which];
      }

      if (_KEYCODE_MAP[e.which]) {
          return _KEYCODE_MAP[e.which];
      }

      // if it is not in the special map
      return String.fromCharCode(e.which).toLowerCase();
  }

  /**
   * should we stop this event before firing off callbacks
   *
   * @param {Event} e
   * @return {boolean}
   */
  function _stop(e) {
      var element = e.target || e.srcElement,
          tag_name = element.tagName;

      // if the element has the class "mousetrap" then no need to stop
      if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
          return false;
      }

      // stop for input, select, and textarea
      return tag_name == 'INPUT' || tag_name == 'SELECT' || tag_name == 'TEXTAREA' || (element.contentEditable && element.contentEditable == 'true');
  }

  /**
   * checks if two arrays are equal
   *
   * @param {Array} modifiers1
   * @param {Array} modifiers2
   * @returns {boolean}
   */
  function _modifiersMatch(modifiers1, modifiers2) {
      return modifiers1.sort().join(',') === modifiers2.sort().join(',');
  }

  /**
   * resets all sequence counters except for the ones passed in
   *
   * @param {Object} do_not_reset
   * @returns void
   */
  function _resetSequences(do_not_reset) {
      do_not_reset = do_not_reset || {};

      var active_sequences = false,
          key;

      for (key in _sequence_levels) {
          if (do_not_reset[key]) {
              active_sequences = true;
              continue;
          }
          _sequence_levels[key] = 0;
      }

      if (!active_sequences) {
          _inside_sequence = false;
      }
  }

  /**
   * finds all callbacks that match based on the keycode, modifiers,
   * and action
   *
   * @param {string} character
   * @param {Array} modifiers
   * @param {string} action
   * @param {boolean=} remove - should we remove any matches
   * @param {string=} combination
   * @returns {Array}
   */
  function _getMatches(character, modifiers, action, remove, combination) {
      var i,
          callback,
          matches = [];

      // if there are no events related to this keycode
      if (!_callbacks[character]) {
          return [];
      }

      // if a modifier key is coming up on its own we should allow it
      if (action == 'keyup' && _isModifier(character)) {
          modifiers = [character];
      }

      // loop through all callbacks for the key that was pressed
      // and see if any of them match
      for (i = 0; i < _callbacks[character].length; ++i) {
          callback = _callbacks[character][i];

          // if this is a sequence but it is not at the right level
          // then move onto the next match
          if (callback.seq && _sequence_levels[callback.seq] != callback.level) {
              continue;
          }

          // if the action we are looking for doesn't match the action we got
          // then we should keep going
          if (action != callback.action) {
              continue;
          }

          // if this is a keypress event that means that we need to only
          // look at the character, otherwise check the modifiers as
          // well
          if (action == 'keypress' || _modifiersMatch(modifiers, callback.modifiers)) {

              // remove is used so if you change your mind and call bind a
              // second time with a new function the first one is overwritten
              if (remove && callback.combo == combination) {
                  _callbacks[character].splice(i, 1);
              }

              matches.push(callback);
          }
      }

      return matches;
  }

  /**
   * takes a key event and figures out what the modifiers are
   *
   * @param {Event} e
   * @returns {Array}
   */
  function _eventModifiers(e) {
      var modifiers = [];

      if (e.shiftKey) {
          modifiers.push('shift');
      }

      if (e.altKey) {
          modifiers.push('alt');
      }

      if (e.ctrlKey) {
          modifiers.push('ctrl');
      }

      if (e.metaKey) {
          modifiers.push('meta');
      }

      return modifiers;
  }

  /**
   * actually calls the callback function
   *
   * if your callback function returns false this will use the jquery
   * convention - prevent default and stop propogation on the event
   *
   * @param {Function} callback
   * @param {Event} e
   * @returns void
   */
  function _fireCallback(callback, e) {
      if (callback(e) === false) {
          if (e.preventDefault) {
              e.preventDefault();
          }

          if (e.stopPropagation) {
              e.stopPropagation();
          }

          e.returnValue = false;
          e.cancelBubble = true;
      }
  }

  /**
   * handles a character key event
   *
   * @param {string} character
   * @param {Event} e
   * @returns void
   */
  function _handleCharacter(character, e) {

      // if this event should not happen stop here
      if (_stop(e)) {
          return;
      }

      var callbacks = _getMatches(character, _eventModifiers(e), e.type),
          i,
          do_not_reset = {},
          processed_sequence_callback = false;

      // loop through matching callbacks for this key event
      for (i = 0; i < callbacks.length; ++i) {

          // fire for all sequence callbacks
          // this is because if for example you have multiple sequences
          // bound such as "g i" and "g t" they both need to fire the
          // callback for matching g cause otherwise you can only ever
          // match the first one
          if (callbacks[i].seq) {
              processed_sequence_callback = true;

              // keep a list of which sequences were matches for later
              do_not_reset[callbacks[i].seq] = 1;
              _fireCallback(callbacks[i].callback, e);
              continue;
          }

          // if there were no sequence matches but we are still here
          // that means this is a regular match so we should fire that
          if (!processed_sequence_callback && !_inside_sequence) {
              _fireCallback(callbacks[i].callback, e);
          }
      }

      // if you are inside of a sequence and the key you are pressing
      // is not a modifier key then we should reset all sequences
      // that were not matched by this key event
      if (e.type == _inside_sequence && !_isModifier(character)) {
          _resetSequences(do_not_reset);
      }
  }

  /**
   * handles a keydown event
   *
   * @param {Event} e
   * @returns void
   */
  function _handleKey(e) {

      // normalize e.which for key events
      // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
      e.which = typeof e.which == "number" ? e.which : e.keyCode;

      var character = _characterFromEvent(e);

      // no character found then stop
      if (!character) {
          return;
      }

      if (e.type == 'keyup' && _ignore_next_keyup == character) {
          _ignore_next_keyup = false;
          return;
      }

      _handleCharacter(character, e);
  }

  /**
   * determines if the keycode specified is a modifier key or not
   *
   * @param {string} key
   * @returns {boolean}
   */
  function _isModifier(key) {
      return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
  }

  /**
   * called to set a 1 second timeout on the specified sequence
   *
   * this is so after each key press in the sequence you have 1 second
   * to press the next key before you have to start over
   *
   * @returns void
   */
  function _resetSequenceTimer() {
      clearTimeout(_reset_timer);
      _reset_timer = setTimeout(_resetSequences, 1000);
  }

  /**
   * reverses the map lookup so that we can look for specific keys
   * to see what can and can't use keypress
   *
   * @return {Object}
   */
  function _getReverseMap() {
      if (!_REVERSE_MAP) {
          _REVERSE_MAP = {};
          for (var key in _MAP) {

              // pull out the numeric keypad from here cause keypress should
              // be able to detect the keys from the character
              if (key > 95 && key < 112) {
                  continue;
              }

              if (_MAP.hasOwnProperty(key)) {
                  _REVERSE_MAP[_MAP[key]] = key;
              }
          }
      }
      return _REVERSE_MAP;
  }

  /**
   * picks the best action based on the key combination
   *
   * @param {string} key - character for key
   * @param {Array} modifiers
   * @param {string=} action passed in
   */
  function _pickBestAction(key, modifiers, action) {

      // if no action was picked in we should try to pick the one
      // that we think would work best for this key
      if (!action) {
          action = _getReverseMap()[key] ? 'keydown' : 'keypress';
      }

      // modifier keys don't work as expected with keypress,
      // switch to keydown
      if (action == 'keypress' && modifiers.length) {
          action = 'keydown';
      }

      return action;
  }

  /**
   * binds a key sequence to an event
   *
   * @param {string} combo - combo specified in bind call
   * @param {Array} keys
   * @param {Function} callback
   * @param {string=} action
   * @returns void
   */
  function _bindSequence(combo, keys, callback, action) {

      // start off by adding a sequence level record for this combination
      // and setting the level to 0
      _sequence_levels[combo] = 0;

      // if there is no action pick the best one for the first key
      // in the sequence
      if (!action) {
          action = _pickBestAction(keys[0], []);
      }

      /**
       * callback to increase the sequence level for this sequence and reset
       * all other sequences that were active
       *
       * @param {Event} e
       * @returns void
       */
      var _increaseSequence = function(e) {
              _inside_sequence = action;
              ++_sequence_levels[combo];
              _resetSequenceTimer();
          },

          /**
           * wraps the specified callback inside of another function in order
           * to reset all sequence counters as soon as this sequence is done
           *
           * @param {Event} e
           * @returns void
           */
          _callbackAndReset = function(e) {
              _fireCallback(callback, e);

              // we should ignore the next key up if the action is key down
              // or keypress.  this is so if you finish a sequence and
              // release the key the final key will not trigger a keyup
              if (action !== 'keyup') {
                  _ignore_next_keyup = _characterFromEvent(e);
              }

              // weird race condition if a sequence ends with the key
              // another sequence begins with
              setTimeout(_resetSequences, 10);
          },
          i;

      // loop through keys one at a time and bind the appropriate callback
      // function.  for any key leading up to the final one it should
      // increase the sequence. after the final, it should reset all sequences
      for (i = 0; i < keys.length; ++i) {
          _bindSingle(keys[i], i < keys.length - 1 ? _increaseSequence : _callbackAndReset, action, combo, i);
      }
  }

  /**
   * binds a single keyboard combination
   *
   * @param {string} combination
   * @param {Function} callback
   * @param {string=} action
   * @param {string=} sequence_name - name of sequence if part of sequence
   * @param {number=} level - what part of the sequence the command is
   * @returns void
   */
  function _bindSingle(combination, callback, action, sequence_name, level) {

      // make sure multiple spaces in a row become a single space
      combination = combination.replace(/\s+/g, ' ');

      var sequence = combination.split(' '),
          i,
          key,
          keys,
          modifiers = [];

      // if this pattern is a sequence of keys then run through this method
      // to reprocess each pattern one key at a time
      if (sequence.length > 1) {
          return _bindSequence(combination, sequence, callback, action);
      }

      // take the keys from this pattern and figure out what the actual
      // pattern is all about
      keys = combination === '+' ? ['+'] : combination.split('+');

      for (i = 0; i < keys.length; ++i) {
          key = keys[i];

          // normalize key names
          if (_SPECIAL_ALIASES[key]) {
              key = _SPECIAL_ALIASES[key];
          }

          // if this is not a keypress event then we should
          // be smart about using shift keys
          // this will only work for US keyboards however
          if (action && action != 'keypress' && _SHIFT_MAP[key]) {
              key = _SHIFT_MAP[key];
              modifiers.push('shift');
          }

          // if this key is a modifier then add it to the list of modifiers
          if (_isModifier(key)) {
              modifiers.push(key);
          }
      }

      // depending on what the key combination is
      // we will try to pick the best event for it
      action = _pickBestAction(key, modifiers, action);

      // make sure to initialize array if this is the first time
      // a callback is added for this key
      if (!_callbacks[key]) {
          _callbacks[key] = [];
      }

      // remove an existing match if there is one
      _getMatches(key, modifiers, action, !sequence_name, combination);

      // add this call back to the array
      // if it is a sequence put it at the beginning
      // if not put it at the end
      //
      // this is important because the way these are processed expects
      // the sequence ones to come first
      _callbacks[key][sequence_name ? 'unshift' : 'push']({
          callback: callback,
          modifiers: modifiers,
          action: action,
          seq: sequence_name,
          level: level,
          combo: combination
      });
  }

  /**
   * binds multiple combinations to the same callback
   *
   * @param {Array} combinations
   * @param {Function} callback
   * @param {string|undefined} action
   * @returns void
   */
  function _bindMultiple(combinations, callback, action) {
      for (var i = 0; i < combinations.length; ++i) {
          _bindSingle(combinations[i], callback, action);
      }
  }

  // start!
  _addEvent(document, 'keypress', _handleKey);
  _addEvent(document, 'keydown', _handleKey);
  _addEvent(document, 'keyup', _handleKey);

  var mousetrap = {

      /**
       * binds an event to mousetrap
       *
       * can be a single key, a combination of keys separated with +,
       * a comma separated list of keys, an array of keys, or
       * a sequence of keys separated by spaces
       *
       * be sure to list the modifier keys first to make sure that the
       * correct key ends up getting bound (the last key in the pattern)
       *
       * @param {string|Array} keys
       * @param {Function} callback
       * @param {string=} action - 'keypress', 'keydown', or 'keyup'
       * @returns void
       */
      bind: function(keys, callback, action) {
          _bindMultiple(keys instanceof Array ? keys : [keys], callback, action);
          _direct_map[keys + ':' + action] = callback;
          return this;
      },

      /**
       * unbinds an event to mousetrap
       *
       * the unbinding sets the callback function of the specified key combo
       * to an empty function and deletes the corresponding key in the
       * _direct_map dict.
       *
       * the keycombo+action has to be exactly the same as
       * it was defined in the bind method
       *
       * TODO: actually remove this from the _callbacks dictionary instead
       * of binding an empty function
       *
       * @param {string|Array} keys
       * @param {string} action
       * @returns void
       */
      unbind: function(keys, action) {
          if (_direct_map[keys + ':' + action]) {
              delete _direct_map[keys + ':' + action];
              this.bind(keys, function() {}, action);
          }
          return this;
      },

      /**
       * triggers an event that has already been bound
       *
       * @param {string} keys
       * @param {string=} action
       * @returns void
       */
      trigger: function(keys, action) {
          _direct_map[keys + ':' + action]();
          return this;
      },

      /**
       * resets the library back to its initial state.  this is useful
       * if you want to clear out the current keyboard shortcuts and bind
       * new ones - for example if you switch to another page
       *
       * @returns void
       */
      reset: function() {
          _callbacks = {};
          _direct_map = {};
          return this;
      }
  };

module.exports = mousetrap;


});
require.register("component-cookie/index.js", function(exports, require, module){
/**
 * Encode.
 */

var encode = encodeURIComponent;

/**
 * Decode.
 */

var decode = decodeURIComponent;

/**
 * Set or get cookie `name` with `value` and `options` object.
 *
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @return {Mixed}
 * @api public
 */

module.exports = function(name, value, options){
  switch (arguments.length) {
    case 3:
    case 2:
      return set(name, value, options);
    case 1:
      return get(name);
    default:
      return all();
  }
};

/**
 * Set cookie `name` to `value`.
 *
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @api private
 */

function set(name, value, options) {
  options = options || {};
  var str = encode(name) + '=' + encode(value);

  if (null == value) options.maxage = -1;

  if (options.maxage) {
    options.expires = new Date(+new Date + options.maxage);
  }

  if (options.path) str += '; path=' + options.path;
  if (options.domain) str += '; domain=' + options.domain;
  if (options.expires) str += '; expires=' + options.expires.toUTCString();
  if (options.secure) str += '; secure';

  document.cookie = str;
}

/**
 * Return all cookies.
 *
 * @return {Object}
 * @api private
 */

function all() {
  return parse(document.cookie);
}

/**
 * Get cookie `name`.
 *
 * @param {String} name
 * @return {String}
 * @api private
 */

function get(name) {
  return all()[name];
}

/**
 * Parse cookie `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parse(str) {
  var obj = {};
  var pairs = str.split(/ *; */);
  var pair;
  if ('' == pairs[0]) return obj;
  for (var i = 0; i < pairs.length; ++i) {
    pair = pairs[i].split('=');
    obj[decode(pair[0])] = decode(pair[1]);
  }
  return obj;
}

});
require.register("component-jquery/index.js", function(exports, require, module){
/*!
 * jQuery JavaScript Library v1.9.1
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2012 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-2-4
 */
(function( window, undefined ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//"use strict";
var
	// The deferred used on DOM ready
	readyList,

	// A central reference to the root jQuery(document)
	rootjQuery,

	// Support: IE<9
	// For `typeof node.method` instead of `node.method !== undefined`
	core_strundefined = typeof undefined,

	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,
	location = window.location,

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$,

	// [[Class]] -> type pairs
	class2type = {},

	// List of deleted data cache ids, so we can reuse them
	core_deletedIds = [],

	core_version = "1.9.1",

	// Save a reference to some core methods
	core_concat = core_deletedIds.concat,
	core_push = core_deletedIds.push,
	core_slice = core_deletedIds.slice,
	core_indexOf = core_deletedIds.indexOf,
	core_toString = class2type.toString,
	core_hasOwn = class2type.hasOwnProperty,
	core_trim = core_version.trim,

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context, rootjQuery );
	},

	// Used for matching numbers
	core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

	// Used for splitting on whitespace
	core_rnotwhite = /\S+/g,

	// Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	// Match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

	// JSON RegExp
	rvalidchars = /^[\],:{}\s]*$/,
	rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
	rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
	rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	},

	// The ready event handler
	completed = function( event ) {

		// readyState === "complete" is good enough for us to call the dom ready in oldIE
		if ( document.addEventListener || event.type === "load" || document.readyState === "complete" ) {
			detach();
			jQuery.ready();
		}
	},
	// Clean-up method for dom ready events
	detach = function() {
		if ( document.addEventListener ) {
			document.removeEventListener( "DOMContentLoaded", completed, false );
			window.removeEventListener( "load", completed, false );

		} else {
			document.detachEvent( "onreadystatechange", completed );
			window.detachEvent( "onload", completed );
		}
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: core_version,

	constructor: jQuery,
	init: function( selector, context, rootjQuery ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	// The number of elements contained in the matched element set
	size: function() {
		return this.length;
	},

	toArray: function() {
		return core_slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			this.toArray() :

			// Return just the object
			( num < 0 ? this[ this.length + num ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	ready: function( fn ) {
		// Add the callback
		jQuery.ready.promise().done( fn );

		return this;
	},

	slice: function() {
		return this.pushStack( core_slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: core_push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
	var src, copyIsArray, copy, name, options, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	noConflict: function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( !document.body ) {
			return setTimeout( jQuery.ready );
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return jQuery.type(obj) === "array";
	},

	isWindow: function( obj ) {
		return obj != null && obj == obj.window;
	},

	isNumeric: function( obj ) {
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},

	type: function( obj ) {
		if ( obj == null ) {
			return String( obj );
		}
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ core_toString.call(obj) ] || "object" :
			typeof obj;
	},

	isPlainObject: function( obj ) {
		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {
			// Not own constructor property must be Object
			if ( obj.constructor &&
				!core_hasOwn.call(obj, "constructor") &&
				!core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.

		var key;
		for ( key in obj ) {}

		return key === undefined || core_hasOwn.call( obj, key );
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	error: function( msg ) {
		throw new Error( msg );
	},

	// data: string of html
	// context (optional): If specified, the fragment will be created in this context, defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	parseHTML: function( data, context, keepScripts ) {
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}
		context = context || document;

		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];

		// Single tag
		if ( parsed ) {
			return [ context.createElement( parsed[1] ) ];
		}

		parsed = jQuery.buildFragment( [ data ], context, scripts );
		if ( scripts ) {
			jQuery( scripts ).remove();
		}
		return jQuery.merge( [], parsed.childNodes );
	},

	parseJSON: function( data ) {
		// Attempt to parse using the native JSON parser first
		if ( window.JSON && window.JSON.parse ) {
			return window.JSON.parse( data );
		}

		if ( data === null ) {
			return data;
		}

		if ( typeof data === "string" ) {

			// Make sure leading/trailing whitespace is removed (IE can't handle it)
			data = jQuery.trim( data );

			if ( data ) {
				// Make sure the incoming data is actual JSON
				// Logic borrowed from http://json.org/json2.js
				if ( rvalidchars.test( data.replace( rvalidescape, "@" )
					.replace( rvalidtokens, "]" )
					.replace( rvalidbraces, "")) ) {

					return ( new Function( "return " + data ) )();
				}
			}
		}

		jQuery.error( "Invalid JSON: " + data );
	},

	// Cross-browser xml parsing
	parseXML: function( data ) {
		var xml, tmp;
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		try {
			if ( window.DOMParser ) { // Standard
				tmp = new DOMParser();
				xml = tmp.parseFromString( data , "text/xml" );
			} else { // IE
				xml = new ActiveXObject( "Microsoft.XMLDOM" );
				xml.async = "false";
				xml.loadXML( data );
			}
		} catch( e ) {
			xml = undefined;
		}
		if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	},

	noop: function() {},

	// Evaluates a script in a global context
	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	globalEval: function( data ) {
		if ( data && jQuery.trim( data ) ) {
			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data );
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Use native String.trim function wherever possible
	trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
		function( text ) {
			return text == null ?
				"" :
				core_trim.call( text );
		} :

		// Otherwise use our own trimming functionality
		function( text ) {
			return text == null ?
				"" :
				( text + "" ).replace( rtrim, "" );
		},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				core_push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		var len;

		if ( arr ) {
			if ( core_indexOf ) {
				return core_indexOf.call( arr, elem, i );
			}

			len = arr.length;
			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

			for ( ; i < len; i++ ) {
				// Skip accessing in sparse arrays
				if ( i in arr && arr[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var l = second.length,
			i = first.length,
			j = 0;

		if ( typeof l === "number" ) {
			for ( ; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, inv ) {
		var retVal,
			ret = [],
			i = 0,
			length = elems.length;
		inv = !!inv;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			retVal = !!callback( elems[ i ], i );
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}

		// Flatten any nested arrays
		return core_concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var args, proxy, tmp;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = core_slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,
			length = elems.length,
			bulk = key == null;

		// Sets many values
		if ( jQuery.type( key ) === "object" ) {
			chainable = true;
			for ( i in key ) {
				jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
			}

		// Sets one value
		} else if ( value !== undefined ) {
			chainable = true;

			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}

			if ( bulk ) {
				// Bulk operations run against the entire set
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			if ( fn ) {
				for ( ; i < length; i++ ) {
					fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
				}
			}
		}

		return chainable ?
			elems :

			// Gets
			bulk ?
				fn.call( elems ) :
				length ? fn( elems[0], key ) : emptyGet;
	},

	now: function() {
		return ( new Date() ).getTime();
	}
});

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		// Standards-based browsers support DOMContentLoaded
		} else if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );

		// If IE event model is used
		} else {
			// Ensure firing before onload, maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", completed );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", completed );

			// If IE and not a frame
			// continually check to see if the document is ready
			var top = false;

			try {
				top = window.frameElement == null && document.documentElement;
			} catch(e) {}

			if ( top && top.doScroll ) {
				(function doScrollCheck() {
					if ( !jQuery.isReady ) {

						try {
							// Use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							top.doScroll("left");
						} catch(e) {
							return setTimeout( doScrollCheck, 50 );
						}

						// detach all dom ready events
						detach();

						// and execute any waiting functions
						jQuery.ready();
					}
				})();
			}
		}
	}
	return readyList.promise( obj );
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || type !== "function" &&
		( length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,
		// Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				args = args || [];
				args = [ context, args.slice ? args.slice() : args ];
				if ( list && ( !fired || stack ) ) {
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};
jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var action = tuple[ 0 ],
								fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = core_slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
					if( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});
jQuery.support = (function() {

	var support, all, a,
		input, select, fragment,
		opt, eventName, isSupported, i,
		div = document.createElement("div");

	// Setup
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

	// Support tests won't run in some limited or non-browser environments
	all = div.getElementsByTagName("*");
	a = div.getElementsByTagName("a")[ 0 ];
	if ( !all || !a || !all.length ) {
		return {};
	}

	// First batch of tests
	select = document.createElement("select");
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName("input")[ 0 ];

	a.style.cssText = "top:1px;float:left;opacity:.5";
	support = {
		// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
		getSetAttribute: div.className !== "t",

		// IE strips leading whitespace when .innerHTML is used
		leadingWhitespace: div.firstChild.nodeType === 3,

		// Make sure that tbody elements aren't automatically inserted
		// IE will insert them into empty tables
		tbody: !div.getElementsByTagName("tbody").length,

		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
		htmlSerialize: !!div.getElementsByTagName("link").length,

		// Get the style information from getAttribute
		// (IE uses .cssText instead)
		style: /top/.test( a.getAttribute("style") ),

		// Make sure that URLs aren't manipulated
		// (IE normalizes it by default)
		hrefNormalized: a.getAttribute("href") === "/a",

		// Make sure that element opacity exists
		// (IE uses filter instead)
		// Use a regex to work around a WebKit issue. See #5145
		opacity: /^0.5/.test( a.style.opacity ),

		// Verify style float existence
		// (IE uses styleFloat instead of cssFloat)
		cssFloat: !!a.style.cssFloat,

		// Check the default checkbox/radio value ("" on WebKit; "on" elsewhere)
		checkOn: !!input.value,

		// Make sure that a selected-by-default option has a working selected property.
		// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
		optSelected: opt.selected,

		// Tests for enctype support on a form (#6743)
		enctype: !!document.createElement("form").enctype,

		// Makes sure cloning an html5 element does not cause problems
		// Where outerHTML is undefined, this still works
		html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",

		// jQuery.support.boxModel DEPRECATED in 1.8 since we don't support Quirks Mode
		boxModel: document.compatMode === "CSS1Compat",

		// Will be defined later
		deleteExpando: true,
		noCloneEvent: true,
		inlineBlockNeedsLayout: false,
		shrinkWrapBlocks: false,
		reliableMarginRight: true,
		boxSizingReliable: true,
		pixelPosition: false
	};

	// Make sure checked status is properly cloned
	input.checked = true;
	support.noCloneChecked = input.cloneNode( true ).checked;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Support: IE<9
	try {
		delete div.test;
	} catch( e ) {
		support.deleteExpando = false;
	}

	// Check if we can trust getAttribute("value")
	input = document.createElement("input");
	input.setAttribute( "value", "" );
	support.input = input.getAttribute( "value" ) === "";

	// Check if an input maintains its value after becoming a radio
	input.value = "t";
	input.setAttribute( "type", "radio" );
	support.radioValue = input.value === "t";

	// #11217 - WebKit loses check when the name is after the checked attribute
	input.setAttribute( "checked", "t" );
	input.setAttribute( "name", "t" );

	fragment = document.createDocumentFragment();
	fragment.appendChild( input );

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	support.appendChecked = input.checked;

	// WebKit doesn't clone checked state correctly in fragments
	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<9
	// Opera does not clone events (and typeof div.attachEvent === undefined).
	// IE9-10 clones events bound via attachEvent, but they don't trigger with .click()
	if ( div.attachEvent ) {
		div.attachEvent( "onclick", function() {
			support.noCloneEvent = false;
		});

		div.cloneNode( true ).click();
	}

	// Support: IE<9 (lack submit/change bubble), Firefox 17+ (lack focusin event)
	// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP), test/csp.php
	for ( i in { submit: true, change: true, focusin: true }) {
		div.setAttribute( eventName = "on" + i, "t" );

		support[ i + "Bubbles" ] = eventName in window || div.attributes[ eventName ].expando === false;
	}

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Run tests that need a body at doc ready
	jQuery(function() {
		var container, marginDiv, tds,
			divReset = "padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",
			body = document.getElementsByTagName("body")[0];

		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		container = document.createElement("div");
		container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";

		body.appendChild( container ).appendChild( div );

		// Support: IE8
		// Check if table cells still have offsetWidth/Height when they are set
		// to display:none and there are still other visible table cells in a
		// table row; if so, offsetWidth/Height are not reliable for use when
		// determining if an element has been hidden directly using
		// display:none (it is still safe to use offsets if a parent element is
		// hidden; don safety goggles and see bug #4512 for more information).
		div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
		tds = div.getElementsByTagName("td");
		tds[ 0 ].style.cssText = "padding:0;margin:0;border:0;display:none";
		isSupported = ( tds[ 0 ].offsetHeight === 0 );

		tds[ 0 ].style.display = "";
		tds[ 1 ].style.display = "none";

		// Support: IE8
		// Check if empty table cells still have offsetWidth/Height
		support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );

		// Check box-sizing and margin behavior
		div.innerHTML = "";
		div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";
		support.boxSizing = ( div.offsetWidth === 4 );
		support.doesNotIncludeMarginInBodyOffset = ( body.offsetTop !== 1 );

		// Use window.getComputedStyle because jsdom on node.js will break without it.
		if ( window.getComputedStyle ) {
			support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			// Check if div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container. (#3333)
			// Fails in WebKit before Feb 2011 nightlies
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			marginDiv = div.appendChild( document.createElement("div") );
			marginDiv.style.cssText = div.style.cssText = divReset;
			marginDiv.style.marginRight = marginDiv.style.width = "0";
			div.style.width = "1px";

			support.reliableMarginRight =
				!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
		}

		if ( typeof div.style.zoom !== core_strundefined ) {
			// Support: IE<8
			// Check if natively block-level elements act like inline-block
			// elements when setting their display to 'inline' and giving
			// them layout
			div.innerHTML = "";
			div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1";
			support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );

			// Support: IE6
			// Check if elements with layout shrink-wrap their children
			div.style.display = "block";
			div.innerHTML = "<div></div>";
			div.firstChild.style.width = "5px";
			support.shrinkWrapBlocks = ( div.offsetWidth !== 3 );

			if ( support.inlineBlockNeedsLayout ) {
				// Prevent IE 6 from affecting layout for positioned elements #11048
				// Prevent IE from shrinking the body in IE 7 mode #12869
				// Support: IE<8
				body.style.zoom = 1;
			}
		}

		body.removeChild( container );

		// Null elements to avoid leaks in IE
		container = div = tds = marginDiv = null;
	});

	// Null elements to avoid leaks in IE
	all = select = fragment = opt = a = input = null;

	return support;
})();

var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;

function internalData( elem, name, data, pvt /* Internal Use Only */ ){
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var thisCache, ret,
		internalKey = jQuery.expando,
		getByName = typeof name === "string",

		// We have to handle DOM nodes and JS objects differently because IE6-7
		// can't GC object references properly across the DOM-JS boundary
		isNode = elem.nodeType,

		// Only DOM nodes need the global jQuery cache; JS object data is
		// attached directly to the object so GC can occur automatically
		cache = isNode ? jQuery.cache : elem,

		// Only defining an ID for JS objects if its cache already exists allows
		// the code to shortcut on the same path as a DOM node with no cache
		id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

	// Avoid doing any more work than we need to when trying to get data on an
	// object that has no data at all
	if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && getByName && data === undefined ) {
		return;
	}

	if ( !id ) {
		// Only DOM nodes need a new unique ID for each element since their data
		// ends up in the global cache
		if ( isNode ) {
			elem[ internalKey ] = id = core_deletedIds.pop() || jQuery.guid++;
		} else {
			id = internalKey;
		}
	}

	if ( !cache[ id ] ) {
		cache[ id ] = {};

		// Avoids exposing jQuery metadata on plain JS objects when the object
		// is serialized using JSON.stringify
		if ( !isNode ) {
			cache[ id ].toJSON = jQuery.noop;
		}
	}

	// An object can be passed to jQuery.data instead of a key/value pair; this gets
	// shallow copied over onto the existing cache
	if ( typeof name === "object" || typeof name === "function" ) {
		if ( pvt ) {
			cache[ id ] = jQuery.extend( cache[ id ], name );
		} else {
			cache[ id ].data = jQuery.extend( cache[ id ].data, name );
		}
	}

	thisCache = cache[ id ];

	// jQuery data() is stored in a separate object inside the object's internal data
	// cache in order to avoid key collisions between internal data and user-defined
	// data.
	if ( !pvt ) {
		if ( !thisCache.data ) {
			thisCache.data = {};
		}

		thisCache = thisCache.data;
	}

	if ( data !== undefined ) {
		thisCache[ jQuery.camelCase( name ) ] = data;
	}

	// Check for both converted-to-camel and non-converted data property names
	// If a data property was specified
	if ( getByName ) {

		// First Try to find as-is property data
		ret = thisCache[ name ];

		// Test for null|undefined property data
		if ( ret == null ) {

			// Try to find the camelCased property
			ret = thisCache[ jQuery.camelCase( name ) ];
		}
	} else {
		ret = thisCache;
	}

	return ret;
}

function internalRemoveData( elem, name, pvt ) {
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var i, l, thisCache,
		isNode = elem.nodeType,

		// See jQuery.data for more information
		cache = isNode ? jQuery.cache : elem,
		id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

	// If there is already no cache entry for this object, there is no
	// purpose in continuing
	if ( !cache[ id ] ) {
		return;
	}

	if ( name ) {

		thisCache = pvt ? cache[ id ] : cache[ id ].data;

		if ( thisCache ) {

			// Support array or space separated string names for data keys
			if ( !jQuery.isArray( name ) ) {

				// try the string as a key before any manipulation
				if ( name in thisCache ) {
					name = [ name ];
				} else {

					// split the camel cased version by spaces unless a key with the spaces exists
					name = jQuery.camelCase( name );
					if ( name in thisCache ) {
						name = [ name ];
					} else {
						name = name.split(" ");
					}
				}
			} else {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = name.concat( jQuery.map( name, jQuery.camelCase ) );
			}

			for ( i = 0, l = name.length; i < l; i++ ) {
				delete thisCache[ name[i] ];
			}

			// If there is no data left in the cache, we want to continue
			// and let the cache object itself get destroyed
			if ( !( pvt ? isEmptyDataObject : jQuery.isEmptyObject )( thisCache ) ) {
				return;
			}
		}
	}

	// See jQuery.data for more information
	if ( !pvt ) {
		delete cache[ id ].data;

		// Don't destroy the parent cache unless the internal data object
		// had been the only thing left in it
		if ( !isEmptyDataObject( cache[ id ] ) ) {
			return;
		}
	}

	// Destroy the cache
	if ( isNode ) {
		jQuery.cleanData( [ elem ], true );

	// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
	} else if ( jQuery.support.deleteExpando || cache != cache.window ) {
		delete cache[ id ];

	// When all else fails, null
	} else {
		cache[ id ] = null;
	}
}

jQuery.extend({
	cache: {},

	// Unique for each copy of jQuery on the page
	// Non-digits removed to match rinlinejQuery
	expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	noData: {
		"embed": true,
		// Ban all objects except for Flash (which handle expandos)
		"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
		"applet": true
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	data: function( elem, name, data ) {
		return internalData( elem, name, data );
	},

	removeData: function( elem, name ) {
		return internalRemoveData( elem, name );
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return internalData( elem, name, data, true );
	},

	_removeData: function( elem, name ) {
		return internalRemoveData( elem, name, true );
	},

	// A method for determining if a DOM node can handle the data expando
	acceptData: function( elem ) {
		// Do not set data on non-element because it will not be cleared (#8335).
		if ( elem.nodeType && elem.nodeType !== 1 && elem.nodeType !== 9 ) {
			return false;
		}

		var noData = elem.nodeName && jQuery.noData[ elem.nodeName.toLowerCase() ];

		// nodes accept data unless otherwise specified; rejection can be conditional
		return !noData || noData !== true && elem.getAttribute("classid") === noData;
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var attrs, name,
			elem = this[0],
			i = 0,
			data = null;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					attrs = elem.attributes;
					for ( ; i < attrs.length; i++ ) {
						name = attrs[i].name;

						if ( !name.indexOf( "data-" ) ) {
							name = jQuery.camelCase( name.slice(5) );

							dataAttr( elem, name, data[ name ] );
						}
					}
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		return jQuery.access( this, function( value ) {

			if ( value === undefined ) {
				// Try to fetch any internally stored data first
				return elem ? dataAttr( elem, key, jQuery.data( elem, key ) ) : null;
			}

			this.each(function() {
				jQuery.data( this, key, value );
			});
		}, null, value, arguments.length > 1, null, true );
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});

function dataAttr( elem, key, data ) {
	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
						data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}
jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = jQuery._data( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray(data) ) {
					queue = jQuery._data( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		hooks.cur = fn;
		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return jQuery._data( elem, key ) || jQuery._data( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				jQuery._removeData( elem, type + "queue" );
				jQuery._removeData( elem, key );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	delay: function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = setTimeout( next, time );
			hooks.stop = function() {
				clearTimeout( timeout );
			};
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while( i-- ) {
			tmp = jQuery._data( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var nodeHook, boolHook,
	rclass = /[\t\r\n]/g,
	rreturn = /\r/g,
	rfocusable = /^(?:input|select|textarea|button|object)$/i,
	rclickable = /^(?:a|area)$/i,
	rboolean = /^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped)$/i,
	ruseDefault = /^(?:checked|selected)$/i,
	getSetAttribute = jQuery.support.getSetAttribute,
	getSetInput = jQuery.support.input;

jQuery.fn.extend({
	attr: function( name, value ) {
		return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	},

	prop: function( name, value ) {
		return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		name = jQuery.propFix[ name ] || name;
		return this.each(function() {
			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch( e ) {}
		});
	},

	addClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}
					elem.className = jQuery.trim( cur );

				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			proceed = arguments.length === 0 || typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}
					elem.className = value ? jQuery.trim( cur ) : "";
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isBool = typeof stateVal === "boolean";

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					state = stateVal,
					classNames = value.match( core_rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					state = isBool ? state : !self.hasClass( className );
					self[ state ? "addClass" : "removeClass" ]( className );
				}

			// Toggle whole class name
			} else if ( type === core_strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery._data( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	},

	val: function( value ) {
		var ret, hooks, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val,
				self = jQuery(this);

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, self.val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map(val, function ( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				// attributes.value is undefined in Blackberry 4.7 but
				// uses .value. See #6932
				var val = elem.attributes.value;
				return !val || val.specified ? elem.value : elem.text;
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// oldIE doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var values = jQuery.makeArray( value );

				jQuery(elem).find("option").each(function() {
					this.selected = jQuery.inArray( jQuery(this).val(), values ) >= 0;
				});

				if ( !values.length ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	},

	attr: function( elem, name, value ) {
		var hooks, notxml, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === core_strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( notxml ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] || ( rboolean.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && notxml && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && notxml && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {

			// In IE9+, Flash objects don't have .getAttribute (#12945)
			// Support: IE9+
			if ( typeof elem.getAttribute !== core_strundefined ) {
				ret =  elem.getAttribute( name );
			}

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( core_rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( rboolean.test( name ) ) {
					// Set corresponding property to false for boolean attributes
					// Also clear defaultChecked/defaultSelected (if appropriate) for IE<8
					if ( !getSetAttribute && ruseDefault.test( name ) ) {
						elem[ jQuery.camelCase( "default-" + name ) ] =
							elem[ propName ] = false;
					} else {
						elem[ propName ] = false;
					}

				// See #9699 for explanation of this approach (setting first, then removal)
				} else {
					jQuery.attr( elem, name, "" );
				}

				elem.removeAttribute( getSetAttribute ? name : propName );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	},

	propFix: {
		tabindex: "tabIndex",
		readonly: "readOnly",
		"for": "htmlFor",
		"class": "className",
		maxlength: "maxLength",
		cellspacing: "cellSpacing",
		cellpadding: "cellPadding",
		rowspan: "rowSpan",
		colspan: "colSpan",
		usemap: "useMap",
		frameborder: "frameBorder",
		contenteditable: "contentEditable"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				return ( elem[ name ] = value );
			}

		} else {
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
				return ret;

			} else {
				return elem[ name ];
			}
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				var attributeNode = elem.getAttributeNode("tabindex");

				return attributeNode && attributeNode.specified ?
					parseInt( attributeNode.value, 10 ) :
					rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
						0 :
						undefined;
			}
		}
	}
});

// Hook for boolean attributes
boolHook = {
	get: function( elem, name ) {
		var
			// Use .prop to determine if this attribute is understood as boolean
			prop = jQuery.prop( elem, name ),

			// Fetch it accordingly
			attr = typeof prop === "boolean" && elem.getAttribute( name ),
			detail = typeof prop === "boolean" ?

				getSetInput && getSetAttribute ?
					attr != null :
					// oldIE fabricates an empty string for missing boolean attributes
					// and conflates checked/selected into attroperties
					ruseDefault.test( name ) ?
						elem[ jQuery.camelCase( "default-" + name ) ] :
						!!attr :

				// fetch an attribute node for properties not recognized as boolean
				elem.getAttributeNode( name );

		return detail && detail.value !== false ?
			name.toLowerCase() :
			undefined;
	},
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
			// IE<8 needs the *property* name
			elem.setAttribute( !getSetAttribute && jQuery.propFix[ name ] || name, name );

		// Use defaultChecked and defaultSelected for oldIE
		} else {
			elem[ jQuery.camelCase( "default-" + name ) ] = elem[ name ] = true;
		}

		return name;
	}
};

// fix oldIE value attroperty
if ( !getSetInput || !getSetAttribute ) {
	jQuery.attrHooks.value = {
		get: function( elem, name ) {
			var ret = elem.getAttributeNode( name );
			return jQuery.nodeName( elem, "input" ) ?

				// Ignore the value *property* by using defaultValue
				elem.defaultValue :

				ret && ret.specified ? ret.value : undefined;
		},
		set: function( elem, value, name ) {
			if ( jQuery.nodeName( elem, "input" ) ) {
				// Does not return so that setAttribute is also used
				elem.defaultValue = value;
			} else {
				// Use nodeHook if defined (#1954); otherwise setAttribute is fine
				return nodeHook && nodeHook.set( elem, value, name );
			}
		}
	};
}

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

	// Use this for any attribute in IE6/7
	// This fixes almost every IE6/7 issue
	nodeHook = jQuery.valHooks.button = {
		get: function( elem, name ) {
			var ret = elem.getAttributeNode( name );
			return ret && ( name === "id" || name === "name" || name === "coords" ? ret.value !== "" : ret.specified ) ?
				ret.value :
				undefined;
		},
		set: function( elem, value, name ) {
			// Set the existing or create a new attribute node
			var ret = elem.getAttributeNode( name );
			if ( !ret ) {
				elem.setAttributeNode(
					(ret = elem.ownerDocument.createAttribute( name ))
				);
			}

			ret.value = value += "";

			// Break association with cloned elements by also using setAttribute (#9646)
			return name === "value" || value === elem.getAttribute( name ) ?
				value :
				undefined;
		}
	};

	// Set contenteditable to false on removals(#10429)
	// Setting to empty string throws an error as an invalid value
	jQuery.attrHooks.contenteditable = {
		get: nodeHook.get,
		set: function( elem, value, name ) {
			nodeHook.set( elem, value === "" ? false : value, name );
		}
	};

	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
	// This is for removals
	jQuery.each([ "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
			set: function( elem, value ) {
				if ( value === "" ) {
					elem.setAttribute( name, "auto" );
					return value;
				}
			}
		});
	});
}


// Some attributes require a special call on IE
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !jQuery.support.hrefNormalized ) {
	jQuery.each([ "href", "src", "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
			get: function( elem ) {
				var ret = elem.getAttribute( name, 2 );
				return ret == null ? undefined : ret;
			}
		});
	});

	// href/src property should get the full normalized URL (#10299/#12915)
	jQuery.each([ "href", "src" ], function( i, name ) {
		jQuery.propHooks[ name ] = {
			get: function( elem ) {
				return elem.getAttribute( name, 4 );
			}
		};
	});
}

if ( !jQuery.support.style ) {
	jQuery.attrHooks.style = {
		get: function( elem ) {
			// Return undefined in the case of empty string
			// Note: IE uppercases css property names, but if we were to .toLowerCase()
			// .cssText, that would destroy case senstitivity in URL's, like in "background"
			return elem.style.cssText || undefined;
		},
		set: function( elem, value ) {
			return ( elem.style.cssText = value + "" );
		}
	};
}

// Safari mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
if ( !jQuery.support.optSelected ) {
	jQuery.propHooks.selected = jQuery.extend( jQuery.propHooks.selected, {
		get: function( elem ) {
			var parent = elem.parentNode;

			if ( parent ) {
				parent.selectedIndex;

				// Make sure that it also works with optgroups, see #5701
				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
			return null;
		}
	});
}

// IE6/7 call enctype encoding
if ( !jQuery.support.enctype ) {
	jQuery.propFix.enctype = "encoding";
}

// Radios and checkboxes getter/setter
if ( !jQuery.support.checkOn ) {
	jQuery.each([ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = {
			get: function( elem ) {
				// Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
				return elem.getAttribute("value") === null ? "on" : elem.value;
			}
		};
	});
}
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = jQuery.extend( jQuery.valHooks[ this ], {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	});
});
var rformElems = /^(?:input|select|textarea)$/i,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {
		var tmp, events, t, handleObjIn,
			special, eventHandle, handleObj,
			handlers, type, namespaces, origType,
			elemData = jQuery._data( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		// jQuery(...).bind("mouseover mouseout", fn);
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener/attachEvent if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {
		var j, handleObj, tmp,
			origCount, t, events,
			special, handlers, type,
			namespaces, origType,
			elemData = jQuery.hasData( elem ) && jQuery._data( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery._removeData( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {
		var handle, ontype, cur,
			bubbleType, special, tmp, i,
			eventPath = [ elem || document ],
			type = core_hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		event.isTrigger = true;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
				event.preventDefault();
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( elem.ownerDocument, data ) === false) &&
				!(type === "click" && jQuery.nodeName( elem, "a" )) && jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && elem[ type ] && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					try {
						elem[ type ]();
					} catch ( e ) {
						// IE<9 dies on focus/blur to hidden element (#1486,#12518)
						// only reproducible on winXP IE8 native, not IE9 in IE8 mode
					}
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, ret, handleObj, matched, j,
			handlerQueue = [],
			args = core_slice.call( arguments ),
			handlers = ( jQuery._data( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var sel, handleObj, matches, i,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			for ( ; cur != this; cur = cur.parentNode || this ) {

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && (cur.disabled !== true || event.type !== "click") ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: IE<9
		// Fix target property (#1925)
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Support: Chrome 23+, Safari?
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Support: IE<9
		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
		event.metaKey = !!event.metaKey;

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var body, eventDoc, doc,
				button = original.button,
				fromElement = original.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( jQuery.nodeName( this, "input" ) && this.type === "checkbox" && this.click ) {
					this.click();
					return false;
				}
			}
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== document.activeElement && this.focus ) {
					try {
						this.focus();
						return false;
					} catch ( e ) {
						// Support: IE<9
						// If we error on focus to hidden element (#1486, #12518),
						// let .trigger() run the handlers
					}
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === document.activeElement && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Even when returnValue equals to undefined Firefox will still show alert
				if ( event.result !== undefined ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{ type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle, false );
		}
	} :
	function( elem, type, handle ) {
		var name = "on" + type;

		if ( elem.detachEvent ) {

			// #8545, #7054, preventing memory leaks for custom events in IE6-8
			// detachEvent needed property on element, by name of that event, to properly expose it to GC
			if ( typeof elem[ name ] === core_strundefined ) {
				elem[ name ] = null;
			}

			elem.detachEvent( name, handle );
		}
	};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;
		if ( !e ) {
			return;
		}

		// If preventDefault exists, run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();

		// Support: IE
		// Otherwise set the returnValue property of the original event to false
		} else {
			e.returnValue = false;
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;
		if ( !e ) {
			return;
		}
		// If stopPropagation exists, run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}

		// Support: IE
		// Set the cancelBubble property of the original event to true
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// IE submit delegation
if ( !jQuery.support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
				if ( form && !jQuery._data( form, "submitBubbles" ) ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						event._submit_bubble = true;
					});
					jQuery._data( form, "submitBubbles", true );
				}
			});
			// return undefined since we don't need an event listener
		},

		postDispatch: function( event ) {
			// If form was submitted by the user, bubble the event up the tree
			if ( event._submit_bubble ) {
				delete event._submit_bubble;
				if ( this.parentNode && !event.isTrigger ) {
					jQuery.event.simulate( "submit", this.parentNode, event, true );
				}
			}
		},

		teardown: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
if ( !jQuery.support.changeBubbles ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {
				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._just_changed = true;
						}
					});
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._just_changed && !event.isTrigger ) {
							this._just_changed = false;
						}
						// Allow triggered, simulated change events (#11500)
						jQuery.event.simulate( "change", this, event, true );
					});
				}
				return false;
			}
			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "changeBubbles" ) ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event, true );
						}
					});
					jQuery._data( elem, "changeBubbles", true );
				}
			});
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return !rformElems.test( this.nodeName );
		}
	};
}

// Create "bubbling" focus and blur events
if ( !jQuery.support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				if ( attaches++ === 0 ) {
					document.addEventListener( orig, handler, true );
				}
			},
			teardown: function() {
				if ( --attaches === 0 ) {
					document.removeEventListener( orig, handler, true );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var type, origFn;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});
/*!
 * Sizzle CSS Selector Engine
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://sizzlejs.com/
 */
(function( window, undefined ) {

var i,
	cachedruns,
	Expr,
	getText,
	isXML,
	compile,
	hasDuplicate,
	outermostContext,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsXML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,
	sortOrder,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	support = {},
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Array methods
	arr = [],
	pop = arr.pop,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},


	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	operators = "([*^$|!~]?=)",
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*" ),
	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"NAME": new RegExp( "^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rsibling = /[\x20\t\r\n\f]*[+~]/,

	rnative = /^[^{]+\{\s*\[native code/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rescape = /'|\\/g,
	rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = /\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,
	funescape = function( _, escaped ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		return high !== high ?
			escaped :
			// BMP codepoint
			high < 0 ?
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Use a stripped-down slice if we can't use a native one
try {
	slice.call( preferredDoc.documentElement.childNodes, 0 )[0].nodeType;
} catch ( e ) {
	slice = function( i ) {
		var elem,
			results = [];
		while ( (elem = this[i++]) ) {
			results.push( elem );
		}
		return results;
	};
}

/**
 * For feature detection
 * @param {Function} fn The function to test for native support
 */
function isNative( fn ) {
	return rnative.test( fn + "" );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var cache,
		keys = [];

	return (cache = function( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key += " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key ] = value);
	});
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return fn( div );
	} catch (e) {
		return false;
	} finally {
		// release memory in IE
		div = null;
	}
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( !documentIsXML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, slice.call(context.getElementsByTagName( selector ), 0) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getByClassName && context.getElementsByClassName ) {
				push.apply( results, slice.call(context.getElementsByClassName( m ), 0) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && !rbuggyQSA.test(selector) ) {
			old = true;
			nid = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && context.parentNode || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results, slice.call( newContext.querySelectorAll(
						newSelector
					), 0 ) );
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Detect xml
 * @param {Element|Object} elem An element or a document
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var doc = node ? node.ownerDocument || node : preferredDoc;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsXML = isXML( doc );

	// Check if getElementsByTagName("*") returns only elements
	support.tagNameNoComments = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if attributes should be retrieved by attribute nodes
	support.attributes = assert(function( div ) {
		div.innerHTML = "<select></select>";
		var type = typeof div.lastChild.getAttribute("multiple");
		// IE8 returns a string for some attributes even when not present
		return type !== "boolean" && type !== "string";
	});

	// Check if getElementsByClassName can be trusted
	support.getByClassName = assert(function( div ) {
		// Opera can't find a second classname (in 9.6)
		div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";
		if ( !div.getElementsByClassName || !div.getElementsByClassName("e").length ) {
			return false;
		}

		// Safari 3.2 caches class attributes and doesn't catch changes
		div.lastChild.className = "e";
		return div.getElementsByClassName("e").length === 2;
	});

	// Check if getElementById returns elements by name
	// Check if getElementsByName privileges form controls or returns elements by ID
	support.getByName = assert(function( div ) {
		// Inject content
		div.id = expando + 0;
		div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>";
		docElem.insertBefore( div, docElem.firstChild );

		// Test
		var pass = doc.getElementsByName &&
			// buggy browsers will return fewer than the correct 2
			doc.getElementsByName( expando ).length === 2 +
			// buggy browsers will return more than the correct 0
			doc.getElementsByName( expando + 0 ).length;
		support.getIdNotName = !doc.getElementById( expando );

		// Cleanup
		docElem.removeChild( div );

		return pass;
	});

	// IE6/7 return modified attributes
	Expr.attrHandle = assert(function( div ) {
		div.innerHTML = "<a href='#'></a>";
		return div.firstChild && typeof div.firstChild.getAttribute !== strundefined &&
			div.firstChild.getAttribute("href") === "#";
	}) ?
		{} :
		{
			"href": function( elem ) {
				return elem.getAttribute( "href", 2 );
			},
			"type": function( elem ) {
				return elem.getAttribute("type");
			}
		};

	// ID find and filter
	if ( support.getIdNotName ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && !documentIsXML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && !documentIsXML ) {
				var m = context.getElementById( id );

				return m ?
					m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ?
						[m] :
						undefined :
					[];
			}
		};
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.tagNameNoComments ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Name
	Expr.find["NAME"] = support.getByName && function( tag, context ) {
		if ( typeof context.getElementsByName !== strundefined ) {
			return context.getElementsByName( name );
		}
	};

	// Class
	Expr.find["CLASS"] = support.getByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && !documentIsXML ) {
			return context.getElementsByClassName( className );
		}
	};

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21),
	// no need to also add to buggyMatches since matches checks buggyQSA
	// A support test would require too much code (would include document ready)
	rbuggyQSA = [ ":focus" ];

	if ( (support.qsa = isNative(doc.querySelectorAll)) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explictly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select><option selected=''></option></select>";

			// IE8 - Some boolean attributes are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {

			// Opera 10-12/IE8 - ^= $= *= and empty values
			// Should not select anything
			div.innerHTML = "<input type='hidden' i=''/>";
			if ( div.querySelectorAll("[i^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:\"\"|'')" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = isNative( (matches = docElem.matchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.webkitMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = new RegExp( rbuggyMatches.join("|") );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = isNative(docElem.contains) || docElem.compareDocumentPosition ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	// Document order sorting
	sortOrder = docElem.compareDocumentPosition ?
	function( a, b ) {
		var compare;

		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		if ( (compare = b.compareDocumentPosition && a.compareDocumentPosition && a.compareDocumentPosition( b )) ) {
			if ( compare & 1 || a.parentNode && a.parentNode.nodeType === 11 ) {
				if ( a === doc || contains( preferredDoc, a ) ) {
					return -1;
				}
				if ( b === doc || contains( preferredDoc, b ) ) {
					return 1;
				}
				return 0;
			}
			return compare & 4 ? -1 : 1;
		}

		return a.compareDocumentPosition ? -1 : 1;
	} :
	function( a, b ) {
		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Parentless nodes are either documents or disconnected
		} else if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	// Always assume the presence of duplicates if sort doesn't
	// pass them to our comparison function (as in Google Chrome).
	hasDuplicate = false;
	[0, 0].sort( sortOrder );
	support.detectDuplicates = hasDuplicate;

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	// rbuggyQSA always contains :focus, so no need for an existence check
	if ( support.matchesSelector && !documentIsXML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && !rbuggyQSA.test(expr) ) {
		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	var val;

	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	if ( !documentIsXML ) {
		name = name.toLowerCase();
	}
	if ( (val = Expr.attrHandle[ name ]) ) {
		return val( elem );
	}
	if ( documentIsXML || support.attributes ) {
		return elem.getAttribute( name );
	}
	return ( (val = elem.getAttributeNode( name )) || elem.getAttribute( name ) ) && elem[ name ] === true ?
		name :
		val && val.specified ? val.value : null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

// Document sorting and removing duplicates
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		i = 1,
		j = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		for ( ; (elem = results[i]); i++ ) {
			if ( elem === results[ i - 1 ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	return results;
};

function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && ( ~b.sourceIndex || MAX_NEGATIVE ) - ( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

// Returns a function to use in pseudos for input types
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

// Returns a function to use in pseudos for buttons
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

// Returns a function to use in pseudos for positionals
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		for ( ; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (see #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[4] ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeName ) {
			if ( nodeName === "*" ) {
				return function() { return true; };
			}

			nodeName = nodeName.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
			};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( elem.className || (typeof elem.getAttribute !== strundefined && elem.getAttribute("class")) || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifider
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsXML ?
						elem.getAttribute("xml:lang") || elem.getAttribute("lang") :
						elem.lang) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
			//   not comment, processing instructions, or others
			// Thanks to Diego Perini for the nodeName shortcut
			//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( tokens = [] );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push( {
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			} );
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push( {
					value: matched,
					type: type,
					matches: match
				} );
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
}

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var data, cache, outerCache,
				dirkey = dirruns + " " + doneName;

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (cache = outerCache[ dir ]) && cache[0] === dirkey ) {
							if ( (data = cache[1]) === true || data === cachedruns ) {
								return data === true;
							}
						} else {
							cache = outerCache[ dir ] = [ dirkey ];
							cache[1] = matcher( elem, context, xml ) || cachedruns;
							if ( cache[1] === true ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector( tokens.slice( 0, i - 1 ) ).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	// A counter to specify which element is currently being matched
	var matcherCachedRuns = 0,
		bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, expandContext ) {
			var elem, j, matcher,
				setMatched = [],
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				outermost = expandContext != null,
				contextBackup = outermostContext,
				// We must always have either seed elements or context
				elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

			if ( outermost ) {
				outermostContext = context !== document && context;
				cachedruns = matcherCachedRuns;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			for ( ; (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
						cachedruns = ++matcherCachedRuns;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function select( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		match = tokenize( selector );

	if ( !seed ) {
		// Try to minimize operations if there is only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					context.nodeType === 9 && !documentIsXML &&
					Expr.relative[ tokens[1].type ] ) {

				context = Expr.find["ID"]( token.matches[0].replace( runescape, funescape ), context )[0];
				if ( !context ) {
					return results;
				}

				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && context.parentNode || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, slice.call( seed, 0 ) );
							return results;
						}

						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	compile( selector, match )(
		seed,
		context,
		documentIsXML,
		results,
		rsibling.test( selector )
	);
	return results;
}

// Deprecated
Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Easy API for creating new setFilters
function setFilters() {}
Expr.filters = setFilters.prototype = Expr.pseudos;
Expr.setFilters = new setFilters();

// Initialize with the default document
setDocument();

// Override sizzle attribute retrieval
Sizzle.attr = jQuery.attr;
jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;


})( window );
var runtil = /Until$/,
	rparentsprev = /^(?:parents|prev(?:Until|All))/,
	isSimple = /^.[^:#\[\.,]*$/,
	rneedsContext = jQuery.expr.match.needsContext,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend({
	find: function( selector ) {
		var i, ret, self,
			len = this.length;

		if ( typeof selector !== "string" ) {
			self = this;
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		ret = [];
		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, this[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = ( this.selector ? this.selector + " " : "" ) + selector;
		return ret;
	},

	has: function( target ) {
		var i,
			targets = jQuery( target, this ),
			len = targets.length;

		return this.filter(function() {
			for ( i = 0; i < len; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	not: function( selector ) {
		return this.pushStack( winnow(this, selector, false) );
	},

	filter: function( selector ) {
		return this.pushStack( winnow(this, selector, true) );
	},

	is: function( selector ) {
		return !!selector && (
			typeof selector === "string" ?
				// If this is a positional/relative selector, check membership in the returned set
				// so $("p:first").is("p:last") won't return true for a doc with two "p".
				rneedsContext.test( selector ) ?
					jQuery( selector, this.context ).index( this[0] ) >= 0 :
					jQuery.filter( selector, this ).length > 0 :
				this.filter( selector ).length > 0 );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			ret = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			cur = this[i];

			while ( cur && cur.ownerDocument && cur !== context && cur.nodeType !== 11 ) {
				if ( pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors) ) {
					ret.push( cur );
					break;
				}
				cur = cur.parentNode;
			}
		}

		return this.pushStack( ret.length > 1 ? jQuery.unique( ret ) : ret );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[0] && this[0].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return jQuery.inArray( this[0], jQuery( elem ) );
		}

		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context ) :
				jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
			all = jQuery.merge( this.get(), set );

		return this.pushStack( jQuery.unique(all) );
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

jQuery.fn.andSelf = jQuery.fn.addBack;

function sibling( cur, dir ) {
	do {
		cur = cur[ dir ];
	} while ( cur && cur.nodeType !== 1 );

	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );

		if ( !runtil.test( name ) ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		ret = this.length > 1 && !guaranteedUnique[ name ] ? jQuery.unique( ret ) : ret;

		if ( this.length > 1 && rparentsprev.test( name ) ) {
			ret = ret.reverse();
		}

		return this.pushStack( ret );
	};
});

jQuery.extend({
	filter: function( expr, elems, not ) {
		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return elems.length === 1 ?
			jQuery.find.matchesSelector(elems[0], expr) ? [ elems[0] ] : [] :
			jQuery.find.matches(expr, elems);
	},

	dir: function( elem, dir, until ) {
		var matched = [],
			cur = elem[ dir ];

		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, keep ) {

	// Can't pass null or undefined to indexOf in Firefox 4
	// Set to 0 to skip string check
	qualifier = qualifier || 0;

	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep(elements, function( elem, i ) {
			var retVal = !!qualifier.call( elem, i, elem );
			return retVal === keep;
		});

	} else if ( qualifier.nodeType ) {
		return jQuery.grep(elements, function( elem ) {
			return ( elem === qualifier ) === keep;
		});

	} else if ( typeof qualifier === "string" ) {
		var filtered = jQuery.grep(elements, function( elem ) {
			return elem.nodeType === 1;
		});

		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter(qualifier, filtered, !keep);
		} else {
			qualifier = jQuery.filter( qualifier, filtered );
		}
	}

	return jQuery.grep(elements, function( elem ) {
		return ( jQuery.inArray( elem, qualifier ) >= 0 ) === keep;
	});
}
function createSafeFragment( document ) {
	var list = nodeNames.split( "|" ),
		safeFrag = document.createDocumentFragment();

	if ( safeFrag.createElement ) {
		while ( list.length ) {
			safeFrag.createElement(
				list.pop()
			);
		}
	}
	return safeFrag;
}

var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
	rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
	rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	manipulation_rcheckableType = /^(?:checkbox|radio)$/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		area: [ 1, "<map>", "</map>" ],
		param: [ 1, "<object>", "</object>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		// IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
		// unless wrapped in a div with non-breaking characters in front of it.
		_default: jQuery.support.htmlSerialize ? [ 0, "", "" ] : [ 1, "X<div>", "</div>"  ]
	},
	safeFragment = createSafeFragment( document ),
	fragmentDiv = safeFragment.appendChild( document.createElement("div") );

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

jQuery.fn.extend({
	text: function( value ) {
		return jQuery.access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function(i) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	},

	append: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				this.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				this.insertBefore( elem, this.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, false, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, false, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			if ( !selector || jQuery.filter( selector, [ elem ] ).length > 0 ) {
				if ( !keepData && elem.nodeType === 1 ) {
					jQuery.cleanData( getAll( elem ) );
				}

				if ( elem.parentNode ) {
					if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
						setGlobalEval( getAll( elem, "script" ) );
					}
					elem.parentNode.removeChild( elem );
				}
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem, false ) );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}

			// If this is a select, ensure that it displays empty (#12336)
			// Support: IE<9
			if ( elem.options && jQuery.nodeName( elem, "select" ) ) {
				elem.options.length = 0;
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function () {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return jQuery.access( this, function( value ) {
			var elem = this[0] || {},
				i = 0,
				l = this.length;

			if ( value === undefined ) {
				return elem.nodeType === 1 ?
					elem.innerHTML.replace( rinlinejQuery, "" ) :
					undefined;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				( jQuery.support.htmlSerialize || !rnoshimcache.test( value )  ) &&
				( jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
				!wrapMap[ ( rtagName.exec( value ) || ["", ""] )[1].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for (; i < l; i++ ) {
						// Remove element nodes and prevent memory leaks
						elem = this[i] || {};
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch(e) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function( value ) {
		var isFunc = jQuery.isFunction( value );

		// Make sure that the elements are removed from the DOM before they are inserted
		// this can help fix replacing a parent with child elements
		if ( !isFunc && typeof value !== "string" ) {
			value = jQuery( value ).not( this ).detach();
		}

		return this.domManip( [ value ], true, function( elem ) {
			var next = this.nextSibling,
				parent = this.parentNode;

			if ( parent ) {
				jQuery( this ).remove();
				parent.insertBefore( elem, next );
			}
		});
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, table, callback ) {

		// Flatten any nested arrays
		args = core_concat.apply( [], args );

		var first, node, hasScripts,
			scripts, doc, fragment,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[0],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction || !( l <= 1 || typeof value !== "string" || jQuery.support.checkClone || !rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[0] = value.call( this, index, table ? self.html() : undefined );
				}
				self.domManip( args, table, callback );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				table = table && jQuery.nodeName( first, "tr" );
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call(
						table && jQuery.nodeName( this[i], "table" ) ?
							findOrAppend( this[i], "tbody" ) :
							this[i],
						node,
						i
					);
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!jQuery._data( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Hope ajax is available...
								jQuery.ajax({
									url: node.src,
									type: "GET",
									dataType: "script",
									async: false,
									global: false,
									"throws": true
								});
							} else {
								jQuery.globalEval( ( node.text || node.textContent || node.innerHTML || "" ).replace( rcleanScript, "" ) );
							}
						}
					}
				}

				// Fix #11809: Avoid leaking memory
				fragment = first = null;
			}
		}

		return this;
	}
});

function findOrAppend( elem, tag ) {
	return elem.getElementsByTagName( tag )[0] || elem.appendChild( elem.ownerDocument.createElement( tag ) );
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	var attr = elem.getAttributeNode("type");
	elem.type = ( attr && attr.specified ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );
	if ( match ) {
		elem.type = match[1];
	} else {
		elem.removeAttribute("type");
	}
	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var elem,
		i = 0;
	for ( ; (elem = elems[i]) != null; i++ ) {
		jQuery._data( elem, "globalEval", !refElements || jQuery._data( refElements[i], "globalEval" ) );
	}
}

function cloneCopyEvent( src, dest ) {

	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
		return;
	}

	var type, i, l,
		oldData = jQuery._data( src ),
		curData = jQuery._data( dest, oldData ),
		events = oldData.events;

	if ( events ) {
		delete curData.handle;
		curData.events = {};

		for ( type in events ) {
			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
				jQuery.event.add( dest, type, events[ type ][ i ] );
			}
		}
	}

	// make the cloned public data object a copy from the original
	if ( curData.data ) {
		curData.data = jQuery.extend( {}, curData.data );
	}
}

function fixCloneNodeIssues( src, dest ) {
	var nodeName, e, data;

	// We do not need to do anything for non-Elements
	if ( dest.nodeType !== 1 ) {
		return;
	}

	nodeName = dest.nodeName.toLowerCase();

	// IE6-8 copies events bound via attachEvent when using cloneNode.
	if ( !jQuery.support.noCloneEvent && dest[ jQuery.expando ] ) {
		data = jQuery._data( dest );

		for ( e in data.events ) {
			jQuery.removeEvent( dest, e, data.handle );
		}

		// Event data gets referenced instead of copied if the expando gets copied too
		dest.removeAttribute( jQuery.expando );
	}

	// IE blanks contents when cloning scripts, and tries to evaluate newly-set text
	if ( nodeName === "script" && dest.text !== src.text ) {
		disableScript( dest ).text = src.text;
		restoreScript( dest );

	// IE6-10 improperly clones children of object elements using classid.
	// IE10 throws NoModificationAllowedError if parent is null, #12132.
	} else if ( nodeName === "object" ) {
		if ( dest.parentNode ) {
			dest.outerHTML = src.outerHTML;
		}

		// This path appears unavoidable for IE9. When cloning an object
		// element in IE9, the outerHTML strategy above is not sufficient.
		// If the src has innerHTML and the destination does not,
		// copy the src.innerHTML into the dest.innerHTML. #10324
		if ( jQuery.support.html5Clone && ( src.innerHTML && !jQuery.trim(dest.innerHTML) ) ) {
			dest.innerHTML = src.innerHTML;
		}

	} else if ( nodeName === "input" && manipulation_rcheckableType.test( src.type ) ) {
		// IE6-8 fails to persist the checked state of a cloned checkbox
		// or radio button. Worse, IE6-7 fail to give the cloned element
		// a checked appearance if the defaultChecked value isn't also set

		dest.defaultChecked = dest.checked = src.checked;

		// IE6-7 get confused and end up setting the value of a cloned
		// checkbox/radio button to an empty string instead of "on"
		if ( dest.value !== src.value ) {
			dest.value = src.value;
		}

	// IE6-8 fails to return the selected option to the default selected
	// state when cloning options
	} else if ( nodeName === "option" ) {
		dest.defaultSelected = dest.selected = src.defaultSelected;

	// IE6-8 fails to set the defaultValue to the correct value when
	// cloning other types of input fields
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			i = 0,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone(true);
			jQuery( insert[i] )[ original ]( elems );

			// Modern browsers can apply jQuery collections as arrays, but oldIE needs a .get()
			core_push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});

function getAll( context, tag ) {
	var elems, elem,
		i = 0,
		found = typeof context.getElementsByTagName !== core_strundefined ? context.getElementsByTagName( tag || "*" ) :
			typeof context.querySelectorAll !== core_strundefined ? context.querySelectorAll( tag || "*" ) :
			undefined;

	if ( !found ) {
		for ( found = [], elems = context.childNodes || context; (elem = elems[i]) != null; i++ ) {
			if ( !tag || jQuery.nodeName( elem, tag ) ) {
				found.push( elem );
			} else {
				jQuery.merge( found, getAll( elem, tag ) );
			}
		}
	}

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], found ) :
		found;
}

// Used in buildFragment, fixes the defaultChecked property
function fixDefaultChecked( elem ) {
	if ( manipulation_rcheckableType.test( elem.type ) ) {
		elem.defaultChecked = elem.checked;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var destElements, node, clone, i, srcElements,
			inPage = jQuery.contains( elem.ownerDocument, elem );

		if ( jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {
			clone = elem.cloneNode( true );

		// IE<=8 does not properly clone detached, unknown element nodes
		} else {
			fragmentDiv.innerHTML = elem.outerHTML;
			fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
		}

		if ( (!jQuery.support.noCloneEvent || !jQuery.support.noCloneChecked) &&
				(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			// Fix all IE cloning issues
			for ( i = 0; (node = srcElements[i]) != null; ++i ) {
				// Ensure that the destination node is not null; Fixes #9587
				if ( destElements[i] ) {
					fixCloneNodeIssues( node, destElements[i] );
				}
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0; (node = srcElements[i]) != null; i++ ) {
					cloneCopyEvent( node, destElements[i] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		destElements = srcElements = node = null;

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var j, elem, contains,
			tmp, tag, tbody, wrap,
			l = elems.length,

			// Ensure a safe fragment
			safe = createSafeFragment( context ),

			nodes = [],
			i = 0;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || safe.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || ["", ""] )[1].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;

					tmp.innerHTML = wrap[1] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[2];

					// Descend through wrappers to the right content
					j = wrap[0];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Manually add leading whitespace removed by IE
					if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
						nodes.push( context.createTextNode( rleadingWhitespace.exec( elem )[0] ) );
					}

					// Remove IE's autoinserted <tbody> from table fragments
					if ( !jQuery.support.tbody ) {

						// String was a <table>, *may* have spurious <tbody>
						elem = tag === "table" && !rtbody.test( elem ) ?
							tmp.firstChild :

							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && !rtbody.test( elem ) ?
								tmp :
								0;

						j = elem && elem.childNodes.length;
						while ( j-- ) {
							if ( jQuery.nodeName( (tbody = elem.childNodes[j]), "tbody" ) && !tbody.childNodes.length ) {
								elem.removeChild( tbody );
							}
						}
					}

					jQuery.merge( nodes, tmp.childNodes );

					// Fix #12392 for WebKit and IE > 9
					tmp.textContent = "";

					// Fix #12392 for oldIE
					while ( tmp.firstChild ) {
						tmp.removeChild( tmp.firstChild );
					}

					// Remember the top-level container for proper cleanup
					tmp = safe.lastChild;
				}
			}
		}

		// Fix #11356: Clear elements from fragment
		if ( tmp ) {
			safe.removeChild( tmp );
		}

		// Reset defaultChecked for any radios and checkboxes
		// about to be appended to the DOM in IE 6/7 (#8060)
		if ( !jQuery.support.appendChecked ) {
			jQuery.grep( getAll( nodes, "input" ), fixDefaultChecked );
		}

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( safe.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		tmp = null;

		return safe;
	},

	cleanData: function( elems, /* internal */ acceptData ) {
		var elem, type, id, data,
			i = 0,
			internalKey = jQuery.expando,
			cache = jQuery.cache,
			deleteExpando = jQuery.support.deleteExpando,
			special = jQuery.event.special;

		for ( ; (elem = elems[i]) != null; i++ ) {

			if ( acceptData || jQuery.acceptData( elem ) ) {

				id = elem[ internalKey ];
				data = id && cache[ id ];

				if ( data ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Remove cache only if it was not already removed by jQuery.event.remove
					if ( cache[ id ] ) {

						delete cache[ id ];

						// IE does not allow us to delete expando properties from nodes,
						// nor does it have a removeAttribute function on Document nodes;
						// we must handle all of these cases
						if ( deleteExpando ) {
							delete elem[ internalKey ];

						} else if ( typeof elem.removeAttribute !== core_strundefined ) {
							elem.removeAttribute( internalKey );

						} else {
							elem[ internalKey ] = null;
						}

						core_deletedIds.push( id );
					}
				}
			}
		}
	}
});
var iframe, getStyles, curCSS,
	ralpha = /alpha\([^)]*\)/i,
	ropacity = /opacity\s*=\s*([^)]*)/,
	rposition = /^(top|right|bottom|left)$/,
	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rmargin = /^margin/,
	rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
	rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + core_pnum + ")", "i" ),
	elemdisplay = { BODY: "block" },

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssExpand = [ "Top", "Right", "Bottom", "Left" ],
	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function isHidden( elem, el ) {
	// isHidden might be called from jQuery#filter function;
	// in that case, element will be second argument
	elem = el || elem;
	return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = jQuery._data( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = jQuery._data( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
			}
		} else {

			if ( !values[ index ] ) {
				hidden = isHidden( elem );

				if ( display && display !== "none" || !hidden ) {
					jQuery._data( elem, "olddisplay", hidden ? display : jQuery.css( elem, "display" ) );
				}
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.fn.extend({
	css: function( name, value ) {
		return jQuery.access( this, function( elem, name, value ) {
			var len, styles,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		var bool = typeof state === "boolean";

		return this.each(function() {
			if ( bool ? state : isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Exclude the following css properties to add px
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			if ( value == null || type === "number" && isNaN( value ) ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifing setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !jQuery.support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {

				// Wrapped to prevent IE from throwing errors when 'invalid' values are provided
				// Fixes bug #5509
				try {
					style[ name ] = value;
				} catch(e) {}
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var num, val, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations
	swap: function( elem, options, callback, args ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.apply( elem, args || [] );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	}
});

// NOTE: we've included the "window" in window.getComputedStyle
// because jsdom on node.js will break without it.
if ( window.getComputedStyle ) {
	getStyles = function( elem ) {
		return window.getComputedStyle( elem, null );
	};

	curCSS = function( elem, name, _computed ) {
		var width, minWidth, maxWidth,
			computed = _computed || getStyles( elem ),

			// getPropertyValue is only needed for .css('filter') in IE9, see #12537
			ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined,
			style = elem.style;

		if ( computed ) {

			if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
			// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
			// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
			if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		return ret;
	};
} else if ( document.documentElement.currentStyle ) {
	getStyles = function( elem ) {
		return elem.currentStyle;
	};

	curCSS = function( elem, name, _computed ) {
		var left, rs, rsLeft,
			computed = _computed || getStyles( elem ),
			ret = computed ? computed[ name ] : undefined,
			style = elem.style;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && style[ name ] ) {
			ret = style[ name ];
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		// but not position css attributes, as those are proportional to the parent element instead
		// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

			// Remember the original values
			left = style.left;
			rs = elem.runtimeStyle;
			rsLeft = rs && rs.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				rs.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				rs.left = rsLeft;
			}
		}

		return ret === "" ? "auto" : ret;
	};
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

// Try to determine the default display value of an element
function css_defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {
			// Use the already-created iframe if possible
			iframe = ( iframe ||
				jQuery("<iframe frameborder='0' width='0' height='0'/>")
				.css( "cssText", "display:block !important" )
			).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[0].contentWindow || iframe[0].contentDocument ).document;
			doc.write("<!doctype html><html><body>");
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}

// Called ONLY from within css_defaultDisplay
function actualDisplay( name, doc ) {
	var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),
		display = jQuery.css( elem[0], "display" );
	elem.remove();
	return display;
}

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

if ( !jQuery.support.opacity ) {
	jQuery.cssHooks.opacity = {
		get: function( elem, computed ) {
			// IE uses filters for opacity
			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
				( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
				computed ? "1" : "";
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;

			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
			// if value === "", then remove inline opacity #12685
			if ( ( value >= 1 || value === "" ) &&
					jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
					style.removeAttribute ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there is no filter style applied in a css rule or unset inline opacity, we are done
				if ( value === "" || currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
	if ( !jQuery.support.reliableMarginRight ) {
		jQuery.cssHooks.marginRight = {
			get: function( elem, computed ) {
				if ( computed ) {
					// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
					// Work around by temporarily setting element display to inline-block
					return jQuery.swap( elem, { "display": "inline-block" },
						curCSS, [ elem, "marginRight" ] );
				}
			}
		};
	}

	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// getComputedStyle returns percent when specified for top/left/bottom/right
	// rather than make the css module depend on the offset module, we just check for it here
	if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
		jQuery.each( [ "top", "left" ], function( i, prop ) {
			jQuery.cssHooks[ prop ] = {
				get: function( elem, computed ) {
					if ( computed ) {
						computed = curCSS( elem, prop );
						// if curCSS returns percentage, fallback to offset
						return rnumnonpx.test( computed ) ?
							jQuery( elem ).position()[ prop ] + "px" :
							computed;
					}
				}
			};
		});
	}

});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		// Support: Opera <= 12.12
		// Opera reports offsetWidths and offsetHeights less than zero on some elements
		return elem.offsetWidth <= 0 && elem.offsetHeight <= 0 ||
			(!jQuery.support.reliableHiddenOffsets && ((elem.style && elem.style.display) || jQuery.css( elem, "display" )) === "none");
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});
var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function(){
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function(){
			var type = this.type;
			// Use .is(":disabled") so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !manipulation_rcheckableType.test( type ) );
		})
		.map(function( i, elem ){
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ){
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});

//Serialize an array of form elements or a set of
//key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}
jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.hover = function( fnOver, fnOut ) {
	return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
};
var
	// Document location
	ajaxLocParts,
	ajaxLocation,
	ajax_nonce = jQuery.now(),

	ajax_rquery = /\?/,
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

	// Keep a copy of the old load method
	_load = jQuery.fn.load,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( core_rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType[0] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var deep, key,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, response, type,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = url.slice( off, url.length );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ){
	jQuery.fn[ type ] = function( fn ){
		return this.on( type, fn );
	};
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": window.String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var // Cross-domain detection vars
			parts,
			// Loop variable
			i,
			// URL without anti-cache param
			cacheURL,
			// Response headers as string
			responseHeadersString,
			// timeout handle
			timeoutTimer,

			// To know if global events are to be dispatched
			fireGlobals,

			transport,
			// Response headers
			responseHeaders,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( core_rnotwhite ) || [""];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? 80 : 443 ) ) !=
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? 80 : 443 ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + ajax_nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ajax_nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// If successful, handle type chaining
			if ( status >= 200 && status < 300 || status === 304 ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 ) {
					isSuccess = true;
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					isSuccess = true;
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					isSuccess = ajaxConvert( s, response );
					statusText = isSuccess.state;
					success = isSuccess.data;
					error = isSuccess.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	}
});

/* Handles responses to an ajax request:
 * - sets all responseXXX fields accordingly
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {
	var firstDataType, ct, finalDataType, type,
		contents = s.contents,
		dataTypes = s.dataTypes,
		responseFields = s.responseFields;

	// Fill responseXXX fields
	for ( type in responseFields ) {
		if ( type in responses ) {
			jqXHR[ responseFields[type] ] = responses[ type ];
		}
	}

	// Remove auto dataType and get content-type in the process
	while( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

// Chain conversions given the request and the original response
function ajaxConvert( s, response ) {
	var conv2, current, conv, tmp,
		converters = {},
		i = 0,
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice(),
		prev = dataTypes[ 0 ];

	// Apply the dataFilter if provided
	if ( s.dataFilter ) {
		response = s.dataFilter( response, s.dataType );
	}

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	// Convert to each sequential dataType, tolerating list modification
	for ( ; (current = dataTypes[++i]); ) {

		// There's only work to do if current dataType is non-auto
		if ( current !== "*" ) {

			// Convert response if prev dataType is non-auto and differs from current
			if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split(" ");
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.splice( i--, 0, current );
								}

								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s["throws"] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}

			// Update prev for next iteration
			prev = current;
		}
	}

	return { state: "success", data: response };
}
// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
		s.global = false;
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function(s) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {

		var script,
			head = document.head || jQuery("head")[0] || document.documentElement;

		return {

			send: function( _, callback ) {

				script = document.createElement("script");

				script.async = true;

				if ( s.scriptCharset ) {
					script.charset = s.scriptCharset;
				}

				script.src = s.url;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function( _, isAbort ) {

					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( script.parentNode ) {
							script.parentNode.removeChild( script );
						}

						// Dereference the script
						script = null;

						// Callback if not abort
						if ( !isAbort ) {
							callback( 200, "success" );
						}
					}
				};

				// Circumvent IE6 bugs with base elements (#2709 and #4378) by prepending
				// Use native DOM manipulation to avoid our domManip AJAX trickery
				head.insertBefore( script, head.firstChild );
			},

			abort: function() {
				if ( script ) {
					script.onload( undefined, true );
				}
			}
		};
	}
});
var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( ajax_nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( ajax_rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});
var xhrCallbacks, xhrSupported,
	xhrId = 0,
	// #5280: Internet Explorer will keep connections alive if we don't abort on unload
	xhrOnUnloadAbort = window.ActiveXObject && function() {
		// Abort all pending requests
		var key;
		for ( key in xhrCallbacks ) {
			xhrCallbacks[ key ]( undefined, true );
		}
	};

// Functions to create xhrs
function createStandardXHR() {
	try {
		return new window.XMLHttpRequest();
	} catch( e ) {}
}

function createActiveXHR() {
	try {
		return new window.ActiveXObject("Microsoft.XMLHTTP");
	} catch( e ) {}
}

// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject ?
	/* Microsoft failed to properly
	 * implement the XMLHttpRequest in IE7 (can't request local files),
	 * so we use the ActiveXObject when it is available
	 * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
	 * we need a fallback.
	 */
	function() {
		return !this.isLocal && createStandardXHR() || createActiveXHR();
	} :
	// For all other browsers, use the standard XMLHttpRequest object
	createStandardXHR;

// Determine support properties
xhrSupported = jQuery.ajaxSettings.xhr();
jQuery.support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
xhrSupported = jQuery.support.ajax = !!xhrSupported;

// Create transport if the browser can provide an xhr
if ( xhrSupported ) {

	jQuery.ajaxTransport(function( s ) {
		// Cross domain only allowed if supported through XMLHttpRequest
		if ( !s.crossDomain || jQuery.support.cors ) {

			var callback;

			return {
				send: function( headers, complete ) {

					// Get a new xhr
					var handle, i,
						xhr = s.xhr();

					// Open the socket
					// Passing null username, generates a login popup on Opera (#2865)
					if ( s.username ) {
						xhr.open( s.type, s.url, s.async, s.username, s.password );
					} else {
						xhr.open( s.type, s.url, s.async );
					}

					// Apply custom fields if provided
					if ( s.xhrFields ) {
						for ( i in s.xhrFields ) {
							xhr[ i ] = s.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( s.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( s.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !s.crossDomain && !headers["X-Requested-With"] ) {
						headers["X-Requested-With"] = "XMLHttpRequest";
					}

					// Need an extra try/catch for cross domain requests in Firefox 3
					try {
						for ( i in headers ) {
							xhr.setRequestHeader( i, headers[ i ] );
						}
					} catch( err ) {}

					// Do send the request
					// This may raise an exception which is actually
					// handled in jQuery.ajax (so no try/catch here)
					xhr.send( ( s.hasContent && s.data ) || null );

					// Listener
					callback = function( _, isAbort ) {
						var status, responseHeaders, statusText, responses;

						// Firefox throws exceptions when accessing properties
						// of an xhr when a network error occurred
						// http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
						try {

							// Was never called and is aborted or complete
							if ( callback && ( isAbort || xhr.readyState === 4 ) ) {

								// Only called once
								callback = undefined;

								// Do not keep as active anymore
								if ( handle ) {
									xhr.onreadystatechange = jQuery.noop;
									if ( xhrOnUnloadAbort ) {
										delete xhrCallbacks[ handle ];
									}
								}

								// If it's an abort
								if ( isAbort ) {
									// Abort it manually if needed
									if ( xhr.readyState !== 4 ) {
										xhr.abort();
									}
								} else {
									responses = {};
									status = xhr.status;
									responseHeaders = xhr.getAllResponseHeaders();

									// When requesting binary data, IE6-9 will throw an exception
									// on any attempt to access responseText (#11426)
									if ( typeof xhr.responseText === "string" ) {
										responses.text = xhr.responseText;
									}

									// Firefox throws an exception when accessing
									// statusText for faulty cross-domain requests
									try {
										statusText = xhr.statusText;
									} catch( e ) {
										// We normalize with Webkit giving an empty statusText
										statusText = "";
									}

									// Filter status for non standard behaviors

									// If the request is local and we have data: assume a success
									// (success with no data won't get notified, that's the best we
									// can do given current implementations)
									if ( !status && s.isLocal && !s.crossDomain ) {
										status = responses.text ? 200 : 404;
									// IE - #1450: sometimes returns 1223 when it should be 204
									} else if ( status === 1223 ) {
										status = 204;
									}
								}
							}
						} catch( firefoxAccessException ) {
							if ( !isAbort ) {
								complete( -1, firefoxAccessException );
							}
						}

						// Call complete if needed
						if ( responses ) {
							complete( status, statusText, responses, responseHeaders );
						}
					};

					if ( !s.async ) {
						// if we're in sync mode we fire the callback
						callback();
					} else if ( xhr.readyState === 4 ) {
						// (IE6 & IE7) if it's in cache and has been
						// retrieved directly we need to fire the callback
						setTimeout( callback );
					} else {
						handle = ++xhrId;
						if ( xhrOnUnloadAbort ) {
							// Create the active xhrs callbacks list if needed
							// and attach the unload handler
							if ( !xhrCallbacks ) {
								xhrCallbacks = {};
								jQuery( window ).unload( xhrOnUnloadAbort );
							}
							// Add to list of active xhrs callbacks
							xhrCallbacks[ handle ] = callback;
						}
						xhr.onreadystatechange = callback;
					}
				},

				abort: function() {
					if ( callback ) {
						callback( undefined, true );
					}
				}
			};
		}
	});
}
var fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [function( prop, value ) {
			var end, unit,
				tween = this.createTween( prop, value ),
				parts = rfxnum.exec( value ),
				target = tween.cur(),
				start = +target || 0,
				scale = 1,
				maxIterations = 20;

			if ( parts ) {
				end = +parts[2];
				unit = parts[3] || ( jQuery.cssNumber[ prop ] ? "" : "px" );

				// We need to compute starting value
				if ( unit !== "px" && start ) {
					// Iteratively approximate from a nonzero starting point
					// Prefer the current property, because this process will be trivial if it uses the same units
					// Fallback to end or a simple constant
					start = jQuery.css( tween.elem, prop, true ) || end || 1;

					do {
						// If previous iteration zeroed out, double until we get *something*
						// Use a string for doubling factor so we don't accidentally see scale as unchanged below
						scale = scale || ".5";

						// Adjust and apply
						start = start / scale;
						jQuery.style( tween.elem, prop, start + unit );

					// Update scale, tolerating zero or NaN from tween.cur()
					// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
					} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
				}

				tween.unit = unit;
				tween.start = start;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[1] ? start + ( parts[1] + 1 ) * end : end;
			}
			return tween;
		}]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

function createTweens( animation, props ) {
	jQuery.each( props, function( prop, value ) {
		var collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
			index = 0,
			length = collection.length;
		for ( ; index < length; index++ ) {
			if ( collection[ index ].call( animation, prop, value ) ) {

				// we're done with this property
				return;
			}
		}
	});
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	createTweens( animation, props );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

function propFilter( props, specialEasing ) {
	var value, name, index, easing, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

function defaultPrefilter( elem, props, opts ) {
	/*jshint validthis:true */
	var prop, index, length,
		value, dataShow, toggle,
		tween, hooks, oldfire,
		anim = this,
		style = elem.style,
		orig = {},
		handled = [],
		hidden = elem.nodeType && isHidden( elem );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE does not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		if ( jQuery.css( elem, "display" ) === "inline" &&
				jQuery.css( elem, "float" ) === "none" ) {

			// inline-level elements accept inline-block;
			// block-level elements need to be inline with layout
			if ( !jQuery.support.inlineBlockNeedsLayout || css_defaultDisplay( elem.nodeName ) === "inline" ) {
				style.display = "inline-block";

			} else {
				style.zoom = 1;
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		if ( !jQuery.support.shrinkWrapBlocks ) {
			anim.always(function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			});
		}
	}


	// show/hide pass
	for ( index in props ) {
		value = props[ index ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ index ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {
				continue;
			}
			handled.push( index );
		}
	}

	length = handled.length;
	if ( length ) {
		dataShow = jQuery._data( elem, "fxshow" ) || jQuery._data( elem, "fxshow", {} );
		if ( "hidden" in dataShow ) {
			hidden = dataShow.hidden;
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;
			jQuery._removeData( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( index = 0 ; index < length ; index++ ) {
			prop = handled[ index ];
			tween = anim.createTween( prop, hidden ? dataShow[ prop ] : 0 );
			orig[ prop ] = dataShow[ prop ] || jQuery.style( elem, prop );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Remove in 2.0 - this supports IE8's panic based approach
// to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );
				doAnimation.finish = function() {
					anim.stop( true );
				};
				// Empty animations, or finishing resolves immediately
				if ( empty || jQuery._data( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = jQuery._data( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = jQuery._data( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.cur && hooks.cur.finish ) {
				hooks.cur.finish.call( this );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth? 1 : 0;
	for( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p*Math.PI ) / 2;
	}
};

jQuery.timers = [];
jQuery.fx = Tween.prototype.init;
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	if ( timer() && jQuery.timers.push( timer ) ) {
		jQuery.fx.start();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}
jQuery.fn.offset = function( options ) {
	if ( arguments.length ) {
		return options === undefined ?
			this :
			this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
	}

	var docElem, win,
		box = { top: 0, left: 0 },
		elem = this[ 0 ],
		doc = elem && elem.ownerDocument;

	if ( !doc ) {
		return;
	}

	docElem = doc.documentElement;

	// Make sure it's not a disconnected DOM node
	if ( !jQuery.contains( docElem, elem ) ) {
		return box;
	}

	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	if ( typeof elem.getBoundingClientRect !== core_strundefined ) {
		box = elem.getBoundingClientRect();
	}
	win = getWindow( doc );
	return {
		top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
		left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
	};
};

jQuery.offset = {

	setOffset: function( elem, options, i ) {
		var position = jQuery.css( elem, "position" );

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		var curElem = jQuery( elem ),
			curOffset = curElem.offset(),
			curCSSTop = jQuery.css( elem, "top" ),
			curCSSLeft = jQuery.css( elem, "left" ),
			calculatePosition = ( position === "absolute" || position === "fixed" ) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
			props = {}, curPosition = {}, curTop, curLeft;

		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			parentOffset = { top: 0, left: 0 },
			elem = this[ 0 ];

		// fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// we assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();
		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top  += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		return {
			top:  offset.top  - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true)
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || document.documentElement;
			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position") === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent || document.documentElement;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
	var top = /Y/.test( prop );

	jQuery.fn[ method ] = function( val ) {
		return jQuery.access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? (prop in win) ? win[ prop ] :
					win.document.documentElement[ method ] :
					elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : jQuery( win ).scrollLeft(),
					top ? val : jQuery( win ).scrollTop()
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}
// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return jQuery.access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
					// unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});
// Limit scope pollution from any deprecated API
// (function() {

// })();

// Expose for component
module.exports = jQuery;

// Expose jQuery to the global object
//window.jQuery = window.$ = jQuery;

// Expose jQuery as an AMD module, but only for AMD loaders that
// understand the issues with loading multiple versions of jQuery
// in a page that all might call define(). The loader will indicate
// they have special allowances for multiple jQuery versions by
// specifying define.amd.jQuery = true. Register as a named module,
// since jQuery can be concatenated with other files that may use define,
// but not use a proper concatenation script that understands anonymous
// AMD modules. A named AMD is safest and most robust way to register.
// Lowercase jquery is used because AMD module names are derived from
// file names, and jQuery is normally delivered in a lowercase file name.
// Do this after creating the global so that if an AMD module wants to call
// noConflict to hide this version of jQuery, it will work.
if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
	define( "jquery", [], function () { return jQuery; } );
}

})( window );

});
require.register("visionmedia-batch/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

try {
  var EventEmitter = require('events').EventEmitter;
} catch (err) {
  var Emitter = require('emitter');
}

/**
 * Noop.
 */

function noop(){}

/**
 * Expose `Batch`.
 */

module.exports = Batch;

/**
 * Create a new Batch.
 */

function Batch() {
  this.fns = [];
  this.concurrency(Infinity);
  for (var i = 0, len = arguments.length; i < len; ++i) {
    this.push(arguments[i]);
  }
}

/**
 * Inherit from `EventEmitter.prototype`.
 */

if (EventEmitter) {
  Batch.prototype.__proto__ = EventEmitter.prototype;
} else {
  Emitter(Batch.prototype);
}

/**
 * Set concurrency to `n`.
 *
 * @param {Number} n
 * @return {Batch}
 * @api public
 */

Batch.prototype.concurrency = function(n){
  this.n = n;
  return this;
};

/**
 * Queue a function.
 *
 * @param {Function} fn
 * @return {Batch}
 * @api public
 */

Batch.prototype.push = function(fn){
  this.fns.push(fn);
  return this;
};

/**
 * Execute all queued functions in parallel,
 * executing `cb(err, results)`.
 *
 * @param {Function} cb
 * @return {Batch}
 * @api public
 */

Batch.prototype.end = function(cb){
  var self = this
    , total = this.fns.length
    , pending = total
    , results = []
    , cb = cb || noop
    , fns = this.fns
    , max = this.n
    , index = 0
    , done;

  // empty
  if (!fns.length) return cb(null, results);

  // process
  function next() {
    var i = index++;
    var fn = fns[i];
    if (!fn) return;
    var start = new Date;

    try {
      fn(callback);
    } catch (err) {
      callback(err);
    }

    function callback(err, res){
      if (done) return;
      if (err) return done = true, cb(err);
      var complete = total - pending + 1;
      var end = new Date;

      results[i] = res;

      self.emit('progress', {
        index: i,
        value: res,
        pending: pending,
        total: total,
        complete: complete,
        percent: complete / total * 100 | 0,
        start: start,
        end: end,
        duration: end - start
      });

      if (--pending) next()
      else cb(null, results);
    }
  }

  // concurrency
  for (var i = 0; i < fns.length; i++) {
    if (i == max) break;
    next();
  }

  return this;
};

});
require.register("component-inherit/index.js", function(exports, require, module){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
});
require.register("component-preloader/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Batch = require('batch')
  , inherit = require('inherit');

/**
 * Expose `Preloader`.
 */

module.exports = Preloader;

/**
 * Initialize a new `Preloader`.
 *
 * @return {Type}
 * @api public
 */

function Preloader(urls) {
  Batch.call(this);
  this.urls = [];
}

/**
 * Inherits from `Batch.prototype`.
 */

inherit(Preloader, Batch);

/**
 * Preload the given image `url`.
 *
 * @param {String} url
 * @api public
 */

Preloader.prototype.add = function(url){
  this.urls.push(url);
  this.push(function(done){
    var img = new Image;
    img.onload = function(){ done(); };
    img.src = url;
  });
};
});
require.register("publicclass-rtc/index.js", function(exports, require, module){
var Emitter = require('emitter')
  , WebSocketSignal = require('./signal/web-socket')
  , AppChannelSignal = require('./signal/app-channel')
  , debug = { connection: require('debug')('rtc:connection'),
              channel: require('debug')('rtc:channel') };

// Fallbacks for vendor-specific variables until the spec is finalized.
var PeerConnection = window.webkitRTCPeerConnection
                  || window.mozRTCPeerConnection
                  || window.RTCPeerConnection;

exports.sdpConstraints = {'mandatory': {
                          'OfferToReceiveAudio': true,
                          'OfferToReceiveVideo': true }};

exports.servers = { iceServers: [
  {url: 'stun:stun.l.google.com:19302'}
]}

exports.available = (function(){
  if( typeof PeerConnection == 'function'
      && PeerConnection.prototype // stupid mozilla
      && typeof PeerConnection.prototype.createDataChannel == 'function' ){
    try {
      var pc = new PeerConnection(null,{optional: [{RtpDataChannels: true}]});
      pc.createDataChannel('feat',{reliable:false}).close()
      return true;
    } catch(e){
      return false;
    }
  } else {
    return false;
  }
})();

exports.connect = function(opts){
  opts = opts || {};
  opts.dataChannels = opts.dataChannels || false;
  opts.connectionTimeout = opts.connectionTimeout || 30000;
  opts.turnConfigURL = opts.turnConfigURL || '';
  opts.autoNegotiate = typeof opts.autoNegotiate == 'boolean' ? opts.autoNegotiate : true;

  var rtc = Emitter({})
    , channels = rtc.channels = {}
    , connection
    , signal
    , timeout
    , challenge = Date.now() + Math.random()
    , challenged = rtc.challenged = false
    , challenger = rtc.challenger = false
    , initiator = rtc.initiator = null
    , negotiationneeded = false
    , streams = []
    , open = rtc.open = false;

  // default to appchannel signal
  if( opts.signal == 'ws' ){
    signal = rtc.signal = new WebSocketSignal(opts)
  } else {
    signal = rtc.signal = new AppChannelSignal(opts)
  }

  signal.on('open',function(){
    if( connection ){ rtc.close() }
    connection = createConnection();
    createDataChannels();
    addMissingStreams(connection);
  })
  signal.on('offer',function(desc){
    if( !connection ){ return; }
    debug.connection('remote offer',connection.signalingState,[desc])
    if( connection.signalingState == 'stable' ){
      connection.setRemoteDescription(rewriteSDP(desc),function(){
        debug.connection('create answer')
        connection.createAnswer(onLocalDescriptionAndSend,null,exports.sdpConstraints);
      },onDescError('remote offer'));
    } else {
      debug.connection('received remote "offer" bit expected an "answer"')
    }
  })
  signal.on('answer',function(desc){
    if( !connection ){ return; }
    debug.connection('remote answer',connection.signalingState,[desc])
    if( connection.signalingState != 'stable' ){
      connection.setRemoteDescription(rewriteSDP(desc),function(){},onDescError('remote answer'));
    } else {
      debug.connection('received "answer" but expected an "offer"')
    }
  })
  signal.on('candidate',function(candidate){
    if( !connection ){ return; }

    // skip while disconnected
    if( connection.iceConnectionState == 'disconnected' ){
      return;
    }
    try {
      debug.connection('signal icecandidate',arguments)
      connection.addIceCandidate(candidate);
    } catch(e){
      console.warn('failed to add ice candidate. was it received from a previous connection?',e)
    }
  })
  signal.on('request-for-offer',function(e){
    debug.connection('signal request-for-offer')
    sendOffer()
  })
  signal.on('challenge',function(e){
    // a request-for-challenge
    if( e.challenge === null ){
      debug.connection('request-for-challenge',challenge)
      sendChallenge()
      return;
    }

    // in case a challenge was received without
    // having sent one we send it now.
    if( !challenger ){
      sendChallenge()
    }

    // the one with the lowest challenge
    // (and thus the first one to arrive)
    // is the initiator.
    // and the initiator will "start" the
    // rtc connection by sending the initial
    // offer. the rest of the handshake will
    // be dealt with by the library.
    debug.connection('challenge',challenge,e.challenge)
    if( e.challenge > challenge ){
      rtc.initiator = initiator = true;
      sendOffer();
    } else {
      rtc.initiator = initiator = false;
    }

    // mark this connection as challenged
    // (a requirement to be considered "open")
    rtc.challenged = challenged = true;

    rtc.emit('connected')
  })
  signal.on('connected',function(){
    debug.connection('signal connected')

    // instead of letting a server decide
    // which peer should send the initial
    // offer (aka "initiator") we request
    // the peer to send us a challenge
    requestChallenge()
  })
  signal.on('disconnected',function(){
    debug.connection('signal disconnected')
    rtc.emit('disconnected')
    rtc.reconnect()
  })
  signal.on('event',function(evt){
    var type = evt.type;
    delete evt.type;
    rtc.emit(type,evt);
  })
  signal.on('error',function(evt){
    rtc.emit('error',evt)
  })

  function createConnection(){
    debug.connection('create')

    // clear any previous timeouts
    stopTimeout('create');

    var config = {optional: [{RtpDataChannels: !!opts.dataChannels}]};
    var connection = new PeerConnection(exports.servers,config);
    connection.onconnecting = function(e){
      debug.connection('connecting',arguments)
      rtc.emit('connecting',e)
    }
    connection.onclose = function(e){
      debug.connection('close',arguments)
      rtc.emit('close',e)
      stopTimeout('onclose');
      checkOpen()
    }
    connection.onaddstream = function(e){
      debug.connection('addstream',arguments)
      rtc.emit('addstream',e)
    }
    connection.onremovestream = function(e){
      debug.connection('removestream',arguments)
      rtc.emit('removestream',e)
    }
    connection.ondatachannel = function(e){
      debug.connection('datachannel',arguments)
      channels[e.channel.label] = initDataChannel(e.channel);
      rtc.emit('datachannel',e)
    }
    connection.ongatheringchange = function(e){
      debug.connection('gatheringchange -> %s',connection.iceGatheringState,arguments)
      rtc.emit('gatheringchange',e)
      checkOpen()
    }
    connection.onicecandidate = function(e){
      if( e.candidate ){
        // debug.connection('icecandidate %s',opts.bufferCandidates ? '(buffered)' : '',arguments)
        signal.send(e.candidate)
      } else {
        debug.connection('icecandidate end %s',opts.bufferCandidates ? '(buffered)' : '')
        signal.send({candidate:null})
      }
      rtc.emit('icecandidate',e)
      checkOpen()
    }
    connection.oniceconnectionstatechange =
    connection.onicechange = function(e){
      debug.connection('icechange -> %s',connection.iceConnectionState,arguments)
      rtc.emit('icechange',e)
      checkOpen()
    }
    connection.onnegotiationneeded = function(e){
      debug.connection('negotiationneeded',arguments)
      rtc.emit('negotiationneeded',e)
      if( opts.autoNegotiate ){
        if( open ){
          rtc.offer()
        } else {
          negotiationneeded = true;
        }
      }
    }
    connection.onsignalingstatechange =
    connection.onstatechange = function(e){
      debug.connection('statechange -> %s',connection.signalingState,arguments)
      rtc.emit('statechange',e)
      checkOpen()
    }

    rtc.connection = connection;
    return connection;
  }

  function checkOpen(){
    var isOpen = connection && challenged && challenger &&
      initiator !== null &&
      connection.signalingState == 'stable' &&
      connection.iceConnectionState != 'disconnected' &&
      (connection.iceConnectionState == 'connected' ||
        connection.iceGatheringState == 'complete');

    // closed -> open
    if( !open && isOpen ){
      debug.connection('CLOSED -> OPEN')
      stopTimeout('isopen');
      rtc.open = open = true;
      rtc.emit('open')
      addMissingStreams(connection);

      if( negotiationneeded ){
        debug.connection('negotiationneeded on open')
        rtc.offer()
      }

    // closed -> closed
    } else if( !open && !isOpen ){
      debug.connection('CLOSED -> CLOSED')
      startTimeout('isopen')

    // open -> closed
    } else if( open && !isOpen ){
      debug.connection('OPEN -> CLOSED')
      rtc.open = open = false;
      stopTimeout('isopen');
      rtc.emit('close')

    // open -> open
    } else {
      debug.connection('OPEN -> OPEN')
    }
  }

  function createDataChannels() {
    if( opts.dataChannels ){
      var labels = typeof opts.dataChannels == 'string' ?
        [opts.dataChannels] :
         opts.dataChannels;
      for(var i=0; i<labels.length; i++){
        createDataChannel(labels[i]);
      }
    }
  }

  function createDataChannel(label){
    debug.channel('create',label);
    var channel;
    try {
      // Reliable Data Channels not yet supported in Chrome
      // Data Channel api supported from Chrome M25.
      // You need to start chrome with  --enable-data-channels flag.
      channel = connection.createDataChannel(label,{reliable: false});
    } catch (e) {
      console.error('Create Data channel failed with exception: ' + e.message);
      return null;
    }
    channels[label] = initDataChannel(channel);
    return channel;
  }

  function addMissingStreams(connection){
    // re-add any missing streams
    // [stream,constraints...]
    for(var i=0; i<streams.length; i+=2){
      var stream = streams[i];
      if( !getStreamById(connection,stream.id) ){
        debug.connection('re-added missing stream',stream.id)
        connection.addStream(stream);
      }
    }
  }

  // a fallback version of connection.getStreamById
  function getStreamById(connection,id){
    if( typeof connection.getStreamById == 'function' ){
      return connection.getStreamById(id);
    } else {
      var streams = connection.localStreams || connection.getLocalStreams();
      for(var i=0; i<streams.length; i++){
        if( streams[i].id === id ){
          return streams[i];
        }
      }
      return null;
    }
  }

  function closeDataChannel(label){
    var channel = channels[label];
    if( channel ){
      if( channel.readyState != 'closed' ){
        channel.close();
      }
      channel.onmessage = null;
      channel.onopen = null;
      channel.onclose = null;
      channel.onerror = null;
      delete channels[label];
    }
  }

  function closeConnection(){
    if( connection ){
      stopTimeout('close')
      if( connection.signalingState != 'closed' ){
        connection.close()
      }
      connection.onconnecting = null;
      connection.onopen = null;
      connection.onclose = null;
      connection.onaddstream = null;
      connection.onremovestream = null;
      connection.ondatachannel = null;
      connection.ongatheringchange = null;
      connection.onicecandidate = null;
      connection.onicechange = null;
      connection.onidentityresult = null;
      connection.onnegotiationneeded = null;
      connection.oniceconnectionstatechange = null;
      connection.onsignalingstatechange = null;
      connection.onstatechange = null;
      connection = null;
    }
    rtc.connection = null;
  }

  function initDataChannel(channel){
    if( channel ){
      debug.channel('adding listeners',channel.label)
      channel.onmessage = function(e){
        debug.channel('message %s',channel.label,e)
        rtc.emit('channel '+channel.label+' message',e)
        rtc.emit('channel message',e)
      }
      channel.onopen = function(e){
        debug.channel('open %s',channel.label)
        rtc.emit('channel '+channel.label+' open',e)
        rtc.emit('channel open',e)
      }
      channel.onclose = function(e){
        debug.channel('close %s',channel.label)
        rtc.emit('channel '+channel.label+' close',e)
        rtc.emit('channel close',e)
      }
      channel.onerror = function(e){
        debug.channel('error %s',channel.label,e)
        rtc.emit('channel '+channel.label+' error',e)
        rtc.emit('channel error',e)
        rtc.emit('error',e)
      }
    }
    return channel;
  }

  var startTimeout = function(from){
    debug.connection('timeout started',from)
    clearTimeout(timeout);
    timeout = setTimeout(function(){
      rtc.emit('timeout');
    },opts.connectionTimeout)
  }

  var stopTimeout = function(from){
    if( timeout ){
      debug.connection('timeout stopped',from)
      clearTimeout(timeout);
      timeout = null;
    }
  }

  var sendOffer = function(){
    if( connection ){
      debug.connection('send offer',connection.signalingState)
      if( connection.signalingState != 'have-remote-offer' ){
        connection.createOffer(onLocalDescriptionAndSend,null,exports.sdpConstraints);
      } else {
        debug.connection('offer not sent because of signalingState',connection.signalingState)
      }
      negotiationneeded = false;
    }
  }

  var sendChallenge = function(){
    debug.connection('send challenge',challenge)
    signal.send({challenge:challenge})
    rtc.challenger = challenger = true;
  }

  var requestOffer = function(){
    if( connection ){
      debug.connection('request offer')
      signal.send({type:'request-for-offer'})
      negotiationneeded = false;
    }
  }

  var requestChallenge = function(){
    debug.connection('request challenge')
    signal.send({challenge:null})
  }

  var onDescError = function(src){
    return function(err){
      if( connection ){
        console.log('signalingState',connection.signalingState)
        console.log('iceConnectionState',connection.iceConnectionState)
        console.log('iceGatheringState',connection.iceGatheringState)
      }
      console.warn('could not set %s description',src,err)
    }
  }

  var onLocalDescriptionAndSend = function(desc){
    debug.connection('local description',desc)
    if( connection ){
      connection.setLocalDescription(desc,function(){},onDescError('local '+desc.type))
      signal.send(desc)
    }
  }

  rtc.offer = function(){
    if( initiator === true ){
      sendOffer()
    } else if( initiator === false ){
      requestOffer()
    } else {
      console.warn('attempting to offer before open')
    }
  }

  rtc.addStream = function(stream,constraints){
    debug.connection('adding local stream')
    try {
      connection && connection.addStream(stream,constraints);
      streams.push(stream,constraints);
    } catch(e){}
    return this;
  }

  rtc.removeStream = function(stream){
    debug.connection('removing local stream')
    var i = streams.indexOf(stream);
    ~i && streams.splice(i,2);
    connection && connection.removeStream(stream);
    return this;
  }

  rtc.reconnect = function(){
    debug.connection('reconnect')
    if( connection ) {
      rtc.close(true)
    }
    connection = createConnection();
    createDataChannels();
    requestChallenge();
    rtc.emit('reconnect')
    return this;
  }

  rtc.close = function(keepSignal){
    debug.connection('close')
    var labels = Object.keys(channels);
    labels.forEach(closeDataChannel)
    closeConnection()
    rtc.challenged = challenged = false;
    rtc.challenger = challenger = false;
    rtc.initiator = initiator = null;
    checkOpen()
    keepSignal || signal.send('close')
  }

  rtc.send = function(label,data){
    debug.channel('send',label,data)
    var channel = channels[label];
    if( channel ){
      if( channel.readyState == 'open' ){
        channel.send(data);
      } else {
        console.warn('tried to send data on a not open channel %s',label)
      }
    } else {
      console.error('tried to send to non-existing channel %s',label);
    }
  }

  // ensure we close properly before
  // unload. (hoping this will lessen
  // the "Aw snap" errors)
  var _before = window.onbeforeunload;
  window.onbeforeunload = function() {
    stopTimeout('unload');
    rtc.close();

    // chain in case there's other listeners
    if( typeof _before == 'function' ){
      _before.apply(window,arguments);
    }
  }

  // request optional turn configuration
  if( opts.turnConfigURL ){
    requestTURNConfiguration(opts.turnConfigURL,rtc);
  }

  return rtc;
}


function rewriteSDP(desc){
  // adjust the bandwidth to 64kbps instead of default 30kbps
  desc.sdp = desc.sdp.replace('b=AS:30','b=AS:64')
  return desc;
}

// 'http://computeengineondemand.appspot.com/turn?username=apa&key=1329412323'
function requestTURNConfiguration(url,rtc){
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function(){
    if( xhr.readyState == 4 && xhr.status == 200 ){
      var data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch(e) {
        return debug.connection('got bad data from turn ajax service.',xhr.responseText);
      }
      if( data.uris && data.uris[0] && data.username && data.password ){
        for (var i = 0; i < data.uris.length; i++) {
          exports.servers.iceServers.push({
            url: data.uris[i].replace(':', ':' + data.username + '@'),
            credential: data.password
          })
        }

        // attempt a reconnect using the new configuration
        rtc && rtc.reconnect()
      }
    }
  }
  xhr.open('GET', url, true);
  xhr.send();
}

});
require.register("publicclass-rtc/signal/app-channel.js", function(exports, require, module){
/* globals goog: true */
var Emitter = require('emitter')
  , debug = require('debug')('rtc:signal:appchan');


module.exports = AppChannel;

/**
 * The AppChannel uses an App Engine channel.
 */
function AppChannel(opts){
  opts = opts || {};
  opts.token = opts.token || '';
  opts.room = opts.room || '';
  opts.user = opts.user || '';
  opts.timeout = opts.timeout || 15000;
  opts.retryTimeout = opts.retryTimeout || 5000;
  opts.maxAttempts = opts.maxAttempts || 5;
  opts.bufferCandidates = opts.bufferCandidates || false;

  var retryTimeout = opts.retryTimeout;
  var retryAttempts = 0;
  var signal = Emitter({});

  // default to queue send()
  signal.send = function(msg){
    signal.on('open',function(){
      signal.send(msg)
    })
  }

  // for when the app channel api failed to load
  if( typeof goog == 'undefined' ){
    return signal;
  }

  // token is required and will be empty
  // when quota is full (see error log on server)
  if( !opts.token ){
    var req = new XMLHttpRequest()
    req.onload = function(){
      if( req.readyState == 4 && req.status == 200 ){
        var q = qs(req.responseText);
        opts.user = q.user;
        opts.token = q.token;
        if( opts.user && opts.token ){
          q.type = 'token';
          signal.emit('event',q)
          create()
        }
      }
    };
    req.open('POST', '/_token?room='+opts.room, true)
    req.send()
    return signal;
  }

  function create(){
    debug('create',opts.token,opts.room,opts.user)

    retryTimeout *= 2;
    retryAttempts++;
    if( retryAttempts >= opts.maxAttempts ){
      return signal.emit('error',new Error('unable to connect to signal: '+opts.token))
    }

    var channel = new goog.appengine.Channel(opts.token)
      , socket = channel.open()
      , connected = null
      , opened = false
      , candidates = [];

    socket.onopen = function(){
      debug('open')
      opened = true;

      // Make sure server knows we connected.
      // (a workaround for unreliable, and sometimes
      // totally non-functioning, presence service
      // in google appengine)
      var req = new XMLHttpRequest()
      req.open('POST', '/_connect?from='+opts.user+'-'+opts.room, false)
      req.send()

      signal.emit('open') // create the peer connection here
      clearTimeout(socket.timeout)
    }

    socket.onmessage = function(m){
      // reset retry timeout on first message
      retryTimeout = opts.retryTimeout;
      retryAttempts = 0;

      if( m.data == 'connected' ){
        if( !connected ){
          connected = true;
          debug('connected')
          signal.emit('connected') // from peer
        }

      } else if( m.data == 'disconnected' ){
        if( connected === true ){
          connected = false;
          debug('disconnected')
          signal.emit('disconnected') // from peer
        }

      } else if( m.data == 'full' ){
        debug('full')
        signal.emit('event',{type:'full'})
        close()

      } else if( !connected ){
        console.warn('received messages from channel before being connected. ignoring.',m.data)
        return;

      } else {
        var json = JSON.parse(m.data);
        if( json && json.type == 'offer' ){
          debug('offer',json)
          signal.emit('offer',new RTCSessionDescription(json))

        } else if( json && json.type == 'request-for-offer' ){
          debug('request-for-offer')
          signal.emit('request-for-offer')

        } else if( json && json.type == 'answer' ){
          debug('answer',json)
          signal.emit('answer',new RTCSessionDescription(json))

        } else if( json && 'challenge' in json ){
          debug('challenge',[json])
          signal.emit('challenge',json)

        } else if( json && json.candidates ){
          debug('candidates',[json])
          if( connected === true ){
            for( var i=0; i<json.candidates.length; i++ ){
              signal.emit('candidate',new RTCIceCandidate(json.candidates[i]))
            }
          }

        } else if( json && json.candidate ){
          debug('candidate',[json])
          if( connected === true ){
            signal.emit('candidate',new RTCIceCandidate(json))
          }

        } else if( json ){
          debug('message',m.data)
          if( json.type ){
            signal.emit('event',json)
          }
        } else {
          console.warn('invalid json',json)
        }
      }
    }

    socket.onerror = function(e){
      console.error('Socket error: ',e)
      signal.emit('error', e)
      close()
    }

    socket.onclose = function(){
      // TODO emit "close" only after a few attempts
      //      and possible "reconnected" if retries
      //      work...
      debug('closed (retrying in %sms)',retryTimeout)
      clearTimeout(socket.timeout)
      socket.timeout = setTimeout(create,retryTimeout)
    }

    clearTimeout(socket.timeout)
    socket.timeout = setTimeout(function(e){
      debug('timed out (retrying in %sms)',retryTimeout)
      clearTimeout(socket.timeout)
      socket.timeout = setTimeout(create,retryTimeout)
    },opts.timeout)

    signal.send = function(msg){
      debug('send',msg)
      var originalMessage = msg;
      if( opened ){
        // an event
        if( typeof msg == 'string' ){
          msg = JSON.stringify({type:msg});

        // received a candidate (to buffer)
        } else if( 'candidate' in msg && opts.bufferCandidates ){
          if( msg.candidate ){
            candidates.push(msg);
            return;

          // end of candidates (= null)
          } else {
            msg = JSON.stringify({candidates:candidates})
          }

        // any other object to send
        } else {
          msg = JSON.stringify(msg)
        }
        var req = new XMLHttpRequest()
        req.onerror = function(e){
          // socket.onerror(e)
          console.error('error while sending app-channel-message (retrying)',e)
          setTimeout(function(){
            signal.send(originalMessage);
          },100)
        }
        req.open('POST', '/_message?from='+opts.user+'-'+opts.room, true)
        req.setRequestHeader('Content-Type','application/json')
        req.send(msg)
      } else {
        console.error('attempted to send a message too early, waiting for open')
        signal.on('open',signal.send.bind(signal,originalMessage))
      }
    }

    // ensure the room is disconnect on leave
    var _before = window.onbeforeunload;
    window.onbeforeunload = function(){
      if( connected ){
        try {
          var req = new XMLHttpRequest()
          req.open('POST', '/_disconnect?from='+opts.user+'-'+opts.room, false)
          req.send()
        } catch(e){
          // ignored because it should be done from the
          // backend anyway
        }
      }

      // chain in case there's other listeners
      if( typeof _before == 'function' ){
        _before.apply(window,arguments);
      }
    }


    function close(){
      debug('close')

      clearTimeout(socket.timeout)
      // socket.close(); // will this throw?
      signal.emit('close')

      // re-connect if were connected
      if( connected ){
        connected = false;
        signal.emit('disconnected')
        socket.timeout = setTimeout(create,retryTimeout)
      }
    }

    return signal;
  }
  return create();
}

function qs(query){
  var obj = {};
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=')
      , key = decodeURIComponent(pair[0])
      , val = decodeURIComponent(pair[1]);
    obj[key] = val;
  }
  return obj;
}
});
require.register("publicclass-rtc/signal/web-socket.js", function(exports, require, module){
var Emitter = require('emitter')
  , debug = require('debug')('rtc:signal:ws');


module.exports = WebSocketSignal;

/**
 * The WebSocketSignal expects to connect
 * to a simple relay server.
 *
 * ex: https://gist.github.com/4547040#file-relay-js
 */
function WebSocketSignal(opts){
  opts = opts || {};
  opts.url = opts.url || 'ws://localhost:8080/test';
  opts.timeout = opts.timeout || 5000;
  opts.retryTimeout = opts.retryTimeout || 500;
  opts.maxAttempts = opts.maxAttempts || 5;

  var retryTimeout = opts.retryTimeout;
  var retryAttempts = 0;
  var signal = Emitter({});

  function create(){
    debug('create')

    retryTimeout *= 2;
    retryAttempts++;
    if( retryAttempts >= opts.maxAttempts ){
      return signal.emit('error',new Error('unable to connect to signal: '+opts.url))
    }

    var ws = new WebSocket(opts.url)
      , connected = null;

    ws.onopen = function(){
      debug('open')
      signal.emit('open') // create the peer connection here
      clearTimeout(ws.timeout)
    }

    ws.onmessage = function(m){
      // reset retry timeout on first message
      retryTimeout = opts.retryTimeout;
      retryAttempts = 0;

      var json = JSON.parse(m.data);
      if( json && json.type == 'offer' ){
        debug('offer',json)
        signal.emit('offer',new RTCSessionDescription(json))

      } else if( json && json.type == 'request-for-offer' ){
        debug('request-for-offer')
        signal.emit('request-for-offer')

      } else if( json && json.type == 'answer' ){
        debug('answer',json)
        signal.emit('answer',new RTCSessionDescription(json))

      } else if( json && json.type == 'close' ){
        debug('close')
        signal.emit('close');
        if( connected === true ){
          connected = false;
          debug('disconnected')
          signal.emit('disconnected') // from peer
        }

      } else if( json && json.candidates ){
        debug('candidates',[json])
        for( var i=0; i<json.candidates.length; i++ ){
          signal.emit('candidate',new RTCIceCandidate(json.candidates[i]))
        }

      } else if( json && json.candidate ){
        debug('candidate',[json])
        signal.emit('candidate',new RTCIceCandidate(json))

      } else if( json && json.a && json.b ){
        if( !connected ){
          connected = true;
          debug('connected')
          signal.emit('connected') // from peer
        }

      } else if( json && ((json.a && !json.b) || (json.b && !json.a)) ){
        if( connected === true ){
          connected = false;
          debug('disconnected')
          signal.emit('disconnected') // from peer
        }

      } else if( json && 'challenge' in json ){
        debug('challenge',[json])
        signal.emit('challenge',json)

      } else if( json ){
        debug('message',m.data)
        if( json.type ){
          signal.emit('event',json)
        }
      } else {
        console.warn('invalid json',json)
      }
    }

    ws.onerror = function(e){
      console.error('WS error: ',e)
      clearTimeout(ws.timeout)
      signal.emit('close')
      signal.emit('error',e)
    }

    ws.onclose = function(e){
      // if we weren't connected and the socket
      // was closed normally (code 1000) then the
      // room is most likely full.
      if( e.code === 1000 && connected === null ){
        debug('closed (probably full)',e.code)
        signal.emit('event',{type:'full'})

      // if not it's probably a network error and
      // we should retry a few times.
      } else {
        debug('closed (retrying in %sms)',retryTimeout)
        signal.emit('close')
        clearTimeout(ws.timeout)
        ws.timeout = setTimeout(create,retryTimeout)
      }
    }

    clearTimeout(ws.timeout)
    ws.timeout = setTimeout(function(e){
      debug('timed out (retrying in %sms)',retryTimeout)
      clearTimeout(ws.timeout)
      ws.timeout = setTimeout(create,retryTimeout)
    },opts.timeout)

    signal.send = function(msg){
      debug('send',msg)
      if( ws.readyState == ws.OPEN ){
        if( typeof msg == 'string' ){
          msg = JSON.stringify({type:msg});
        } else {
          msg = JSON.stringify(msg)
        }
        ws.send(msg)
      } else {
        console.warn('attempted to send a message too early, waiting for open')
        signal.on('open',signal.send.bind(signal,msg))
      }
    }

    return signal;
  }
  return create();
}
});
require.register("publicclass-request-animation-frame/index.js", function(exports, require, module){
var requestAnimationFrame = function(fn){ setTimeout(fn, 1000 / 60) };

module.exports = typeof window != 'undefined'
  ? window.requestAnimationFrame
    || window.webkitRequestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.oRequestAnimationFrame
    || window.msRequestAnimationFrame
    || requestAnimationFrame
  : requestAnimationFrame;
});
require.register("publicclass-now/index.js", function(exports, require, module){

module.exports = (function() {
  return typeof window != 'undefined' && window.performance
    ? (window.performance.now
    || window.performance.mozNow
    || window.performance.msNow
    || window.performance.oNow
    || window.performance.webkitNow
    || Date.now).bind(window.performance || {})
    : Date.now || function(){ return +new Date() };
})()

});
require.register("publicclass-geom-vec/index.js", function(exports, require, module){

var unallocated = []
  , allocated = []
  , totalAllocated = 0;

// TODO see if `new Vec()` is better than `[]` or `new Array(2)`
// in both memory and speed
function Vec(x,y){this[0] = x; this[1] = y};


// Used by sin/cos to fix floating point precision errors
// slower, but testable
var EPS = 1e-12;
function eps(x){ return Math.round(x/EPS) * EPS }

var vec = module.exports = {

  verbose: true,

  _unallocated: unallocated,
  _allocated: allocated,

  make: function(x,y){
    var c = vec.alloc();
    if( typeof x == 'object' ){
      c[0] = x[0] || x.x || x.u || 0;
      c[1] = x[1] || x.y || x.v || 0;
    } else {
      c[0] = x || 0;
      c[1] = y || 0;
    }
    return c;
  },

  alloc: function(){
    if( !unallocated.length ){
      var i = totalAllocated
        , u = unallocated.length - i;
      totalAllocated = (totalAllocated || 64) * 2; // double the size (128>256>512 etc)
      allocated.length = totalAllocated;
      vec.verbose && console.warn('vec alloc',totalAllocated)
      while(i < totalAllocated){
        var v = [0,0]; //new Array(2); //new Vec(0.0,0.0);
        unallocated[u+i] = v;
        allocated[i] = v;
        i++;
      }
    }
    return unallocated.pop();
  },

  free: function(v){
    v && unallocated.push(v);
    return vec;
  },

  copy: function(a,b){
    b = b || vec.make()
    b[0] = a[0]
    b[1] = a[1]
    return b;
  },

  add: function(a,b,c){
    c = c || vec.make()
    c[0] = a[0] + b[0];
    c[1] = a[1] + b[1];
    return c;
  },

  sadd: function(a,s,c){
    c = c || vec.make()
    c[0] = a[0] + s;
    c[1] = a[1] + s;
    return c;
  },

  sub: function(a,b,c){
    c = c || vec.make()
    c[0] = a[0] - b[0];
    c[1] = a[1] - b[1];
    return c;
  },

  ssub: function(a,s,c){
    c = c || vec.make()
    c[0] = a[0] - s;
    c[1] = a[1] - s;
    return c;
  },

  mul: function(a,b,c){
    c = c || vec.make()
    c[0] = a[0] * b[0];
    c[1] = a[1] * b[1];
    return c;
  },

  smul: function(a,s,c){
    c = c || vec.make()
    c[0] = a[0] * s;
    c[1] = a[1] * s;
    return c;
  },

  div: function(a,b,c){
    c = c || vec.make()
    c[0] = a[0] / b[0];
    c[1] = a[1] / b[1];
    return c;
  },

  sdiv: function(a,s,c){
    c = c || vec.make()
    c[0] = a[0] / s;
    c[1] = a[1] / s;
    return c;
  },

  min: function(a,b,c){
    c = c || vec.make()
    c[0] = Math.min(a[0],b[0])
    c[1] = Math.min(a[1],b[1])
    return c;
  },

  smin: function(a,s,c){
    c = c || vec.make()
    c[0] = Math.min(a[0],s)
    c[1] = Math.min(a[1],s)
    return c;
  },

  max: function(a,b,c){
    c = c || vec.make()
    c[0] = Math.max(a[0],b[0])
    c[1] = Math.max(a[1],b[1])
    return c;
  },

  smax: function(a,s,c){
    c = c || vec.make()
    c[0] = Math.max(a[0],s)
    c[1] = Math.max(a[1],s)
    return c;
  },

  clamp: function(lo,v,hi,c){
    c = c || vec.make()
    vec.min(hi,v,c)
    vec.max(lo,c,c)
    return c;
  },

  sclamp: function(lo,a,hi,c){
    c = c || vec.make()
    vec.min(v,hi,c)
    vec.max(c,lo,c)
    return c;
  },

  abs: function(a,c){
    c = c || vec.make()
    c[0] = Math.abs(a[0])
    c[1] = Math.abs(a[1])
    return c;
  },

  neg: function(a,c){
    c = c || vec.make()
    c[0] = -a[0]
    c[1] = -a[1]
    return c;
  },

  // note: dot(perp(a), b) == cross(a, b)
  perp: function(a,c){
    c = c || vec.make()
    var x=a[0], y=a[1];
    c[0] = -y
    c[1] = +x
    return c;
  },

  // cross product of two vectors
  cross: function(a,b){
    return a[0]*b[1] - a[1]*b[0];
  },

  // dot product of two vectors
  dot: function(a,b){
    return a[0]*b[0] + a[1]*b[1];
  },

  len: function(a){
    return Math.sqrt(vec.lenSq(a));
  },

  lenSq: function(a){
    return vec.dot(a,a);
  },

  dist: function(a,b){
    var d = vec.sub(a,b)
    var l = vec.len(d)
    vec.free(d)
    return l;
  },

  distSq: function(a,b){
    var d = vec.sub(a,b)
    var l = vec.lenSq(d)
    vec.free(d)
    return l;
  },

  norm: function(a,c){
    c = c || vec.make()
    var l = vec.len(a);
    c[0] = !l ? 0 : a[0] / l;
    c[1] = !l ? 0 : a[1] / l;
    return c;
  },

  // to move `a` around `origin`:
  //  var b = vec.sub(a,origin)
  //  b = vec.rot(b,theta)
  //  vec.add(b,origin,a)
  rot: function(a,theta,c){
    c = c || vec.make()
    var cos = Math.cos(theta)
      , sin = Math.sin(theta);
    c[0] = eps(cos * a[0] - sin * a[1]);
    c[1] = eps(sin * a[0] + cos * a[1]);
    return c;
  },

  eq: function(a,b){
    return a[0]===b[0] && a[1]===b[1];
  },

  lerp: function(a,b,t,c){
    c = c || vec.make()
    c[0] = a[0] + (b[0] - a[0]) * t;
    c[1] = a[1] + (b[1] - a[1]) * t;
    return c;
  },

  // m = mat
  transform: function(a,m,c){
    c = c || vec.make()
    var x=a[0], y=a[1];
    c[0] = m[0]*x + m[3]*y + m[2]
    c[1] = m[1]*x + m[4]*y + m[5]
    return c;
  },

  reflect: function(v,n,c){
    c = c || vec.make()
    var t = vec.dot(v,n);
    c[0] = v[0] - (2 * t) * n[0];
    c[1] = v[1] - (2 * t) * n[1];
    return c;
  }
}

});
require.register("publicclass-geom-mat/index.js", function(exports, require, module){
var unallocated = []
  , allocated = []
  , totalAllocated = 0;

// Used by sin/cos to fix floating point precision errors
// slower, but testable
var EPS = 1e-12;
function eps(x){ return Math.round(x/EPS) * EPS }

// 2d affine transformation matrix
var mat = module.exports = {

  verbose: true,

  _unallocated: unallocated,
  _allocated: allocated,

  make: function(a,b,c,d,x,y){
    var m = mat.ident()
      , u = undefined;
    if( a !== u ) m[0] = a;
    if( b !== u ) m[1] = b;
    if( c !== u ) m[3] = c;
    if( d !== u ) m[4] = d;
    if( x !== u ) m[2] = x;
    if( y !== u ) m[5] = y;
    return m;
  },

  alloc: function(){
    if( !unallocated.length ){
      var i = totalAllocated
        , u = unallocated.length - i;
      totalAllocated = (totalAllocated || 64) * 2; // double the size (128>256>512 etc)
      allocated.length = totalAllocated;
      mat.verbose && console.warn('mat alloc',totalAllocated)
      while(i < totalAllocated){
        var v = [1,0,0,0,1,0,0,0,1]; //new Array(9)
        unallocated[u+i] = v;
        allocated[i] = v;
        i++;
      }
    }
    return unallocated.pop();
  },

  free: function(v){
    v && unallocated.push(v);
    return mat;
  },

  copy: function(a,m){
    m = m || mat.make()
    m[0] = a[0];
    m[1] = a[1];
    m[2] = a[2];
    m[3] = a[3];
    m[4] = a[4];
    m[5] = a[5];
    m[6] = a[6];
    m[7] = a[7];
    m[8] = a[8];
    return m;
  },

  ident: function(m){
    m = m || mat.alloc()
    m[0] = 1; // 0 0 / a
    m[1] = 0; // 0 1 / b
    m[2] = 0; // 0 2 / tx
    m[3] = 0; // 1 0 / c
    m[4] = 1; // 1 1 / d
    m[5] = 0; // 1 2 / ty
    m[6] = 0; // 2 0 / ?
    m[7] = 0; // 2 1 / ?
    m[8] = 1; // 2 2 / ?
    return m;
  },

  mul: function(a,b,m){
    var c = mat.make()
    c[0] = a[0]*b[0] + a[3]*b[1] // a*a + c*b
    c[1] = a[1]*b[0] + a[4]*b[1] // b*a + d*b
    c[3] = a[0]*b[3] + a[3]*b[4] // a*c + c*d
    c[4] = a[1]*b[3] + a[4]*b[4] // b*c + d*d
    c[2] = a[0]*b[2] + a[3]*b[5] + a[2] // a*tx + c*ty + tx
    c[5] = a[1]*b[2] + a[4]*b[5] + a[5] // b*tx + d*ty + ty
    if( m ){
      mat.copy(c,m)
      mat.free(c)
      return m;
    }
    return c;
  },

  //https://github.com/STRd6/matrix.js/blob/master/matrix.js
  translate: function(x,y,m){
    var a = mat.make(1,0,0,1,x,y)
    if( m ){
      mat.mul(a,m,m)
      mat.free(a)
      return m;
    }
    return a;
  },

  rotate: function(theta,m){
    var c = eps(Math.cos(theta))
      , s = eps(Math.sin(theta))
      , a = mat.make(c,s,-s,c);
    if( m ){
      mat.mul(a,m,m)
      mat.free(a)
      return m;
    }
    return a;
  },

  scale: function(x,y,m){
    var a = mat.make(x,0,0,y)
    if( m ){
      mat.mul(a,m,m)
      mat.free(a)
      return m;
    }
    return a;
  },

  // TODO transpose
  // TODO shear

  inv: function(a,m){
    var id = 1 / (a[0]*a[4] - a[1]*a[3]);
    a = mat.make(
       a[4]*id,
      -a[1]*id,
      -a[3]*id,
       a[0]*id,
      (a[3]*a[5] - a[4]*a[2])*id,
      (a[1]*a[2] - a[0]*a[5])*id
    )
    if( m ){
      mat.mul(a,m,m)
      mat.free(a)
      return m;
    }
    return a;
  }
}
});
require.register("publicclass-geom-poly/index.js", function(exports, require, module){
var vec = require('geom-vec');


var unallocated = []
  , allocated = []
  , totalAllocated = 0;

function Poly(){
  this.length = 0;
  this.vertices = []
  this.edges = []
}

var poly = module.exports = {

  verbose: true,

  make: function(){
    var p = poly.alloc();
    if( arguments.length ){
      for( var i=0; i < arguments.length; i+=2 )
        poly.add(p,arguments[i],arguments[i+1]);
      poly.close(p);
    }
    return p;
  },

  alloc: function(){
    if( !unallocated.length ){
      var i = totalAllocated
        , u = unallocated.length - i;
      totalAllocated = (totalAllocated || 64) * 2; // double the size (128>256>512 etc)
      allocated.length = totalAllocated;
      poly.verbose && console.warn('poly alloc',totalAllocated)
      while(i < totalAllocated){
        var p = new Poly();
        unallocated[u+i] = p;
        allocated[i] = p;
        i++;
      }
    }
    return unallocated.pop();
  },

  free: function(p){
    if( p ){
      while(p.vertices.length)
        vec.free(p.vertices.pop());
      while(p.edges.length)
        vec.free(p.edges.pop());
      p.length = 0;
      unallocated.push(p);
    }
    return p;
  },

  copy: function(p,c){
    c = poly.free(c) || poly.make()
    for (var i = 0; i < p.vertices.length; i++) {
      poly.add(c,p.vertices[i][0],p.vertices[i][1])
    }
    poly.close(c);
    return c;
  },

  add: function(p,x,y){
    var v = vec.make(x,y)
    if( p.length ){
      // an edge is a vector between the last and
      // the current vertex
      var l = p.vertices[p.length-1];
      p.edges.push(vec.sub(v,l));
    }
    p.vertices.push(v);
    p.length++;
    return p;
  },

  close: function(p){
    if( p.length ){
      // an edge is a vector between the last and
      // the current vertex
      var l = p.vertices[p.length-1]
      var v = p.vertices[0];
      p.edges.push(vec.sub(v,l));
    }
    return p;
  },

  // source: http://alienryderflex.com/polygon/
  inside: function(p,x,y){
    var oddNodes = false;
    for( var i=0,j=p.vertices.length-1; i < p.vertices.length; i++ ){
      var vI = p.vertices[i]
        , vJ = p.vertices[j];
      if( (vI.y< y && vJ.y>=y
       ||  vJ.y< y && vI.y>=y)
       && (vI.x<=x || vJ.x<=x))
        oddNodes ^= (vI.x+(y-vI.y)/(vJ.y-vI.y)*(vJ.x-vI.x)<x);
      j = i;
    }
    return oddNodes;
  },

  area: function(p){
    var n = p.vertices.length
      , area = 0;
    for(var i=0, j=n-1; i < n; j=i, i++){
      var v = p.vertices[i];
      var q = p.vertices[j];
      area += v[0] * q[1];
      area -= v[1] * q[0];
    }
    return Math.abs(area / 2);
  },

  perimeter: function(p){
    var sum = 0;
    for(var i=0; i < p.edges.length; i++){
      var e = p.edges[i];
      sum += vec.len(e); // TODO optimize away sqrt?
    }
    return sum;
  },

  radiusSq: function(p,c){
    var r = 0;
    c = c || poly.centroid(p);
    for(var i=0; i < p.length; i++){
      var v = p.vertices[i];
      var d = vec.distSq(v,c);
      if( d > r ) r = d;
    }
    return r;
  },

  radius: function(p,c){
    return Math.sqrt(poly.radiusSq(p,c));
  },

  centroid: function(p){
    var a = poly.area(p) // TODO maybe accept area as an argument (in case it's cached?)
      , n = p.length
      , P = p.vertices
      , c = vec.make();
    for(var i=0, j=n-1; i < n; j=i, i++){
      var v = P[i]
        , q = P[j]
        , x = vec.cross(v,q);
      c[0] += (v[0] + q[0]) * x
      c[1] += (v[1] + q[1]) * x
    }
    var b = 1 / (6 * a);
    vec.smul(c,b,c)
    if( c[0] < 0 ){
      vec.neg(c,c)
    }
    return c;
  },

  translate: function(p,x,y,o){
    if( o && (o.length !== p.length) ){
      // TODO this will not make a functional `o` (should use poly.add()/poly.close())
      throw new Error('translate to unequal polys are not supported')
      return;
    }
    var t = vec.make(x,y)
    o = o || p;
    for(var j=0; j < p.length; j++){
      vec.add(p.vertices[j],t,o.vertices[j]);
    }
    vec.free(t)
    return o;
  },

  rotate: function(p,theta,o){
    // TODO
    throw new Error('rotate not implemented')
  },

  scale: function(p,theta,o){
    // TODO
    throw new Error('scale not implemented')
  },

  transform: function(p,mat,o){
    if( o && (o.length !== p.length) ){
      // TODO this will not make a functional `o` (should use poly.add()/poly.close())
      throw new Error('transform to unequal polys are not supported')
      return;
    }
    o = o || p
    var n = p.length;
    for(var i=0, j=n-1; i < n; j=i, i++){
      vec.transform(p.vertices[i],mat,o.vertices[i]);
      vec.sub(p.vertices[i],p.vertices[j],o.edges[j])
    }
    vec.sub(p.vertices[0],p.vertices[n-1],o.edges[n-1])
    return o;
  },

  convexHull: function(p,o){
    // TODO
    throw new Error('convexHull not implemented')
  },

  reverse: function(p){
    var o = poly.make();
    for(var i=p.length-1; i>=0; i--){
      var v = p.vertices[i];
      poly.add(o,v[0],v[1]);
    }
    return poly.close(o);
  },

  aabb: function(p,o){
    // [t,r,b,l]
    var aabb = o || [0,0,0,0]
    aabb[0] =  Infinity;
    aabb[1] = -Infinity;
    aabb[2] = -Infinity;
    aabb[3] =  Infinity;
    for(var j=0; j < p.length; j++){
      var v = p.vertices[j];
      if( v[1] < aabb[0] ) aabb[0] = v[1] // t
      if( v[0] > aabb[1] ) aabb[1] = v[0] // r
      if( v[1] > aabb[2] ) aabb[2] = v[1] // b
      if( v[0] < aabb[3] ) aabb[3] = v[0] // l
    }
    return aabb;
      // or [x,y,w,h]?
      // or Poly(x1,y1,x2,y2,x3,y3,x4,y4)?
  },

  // a->b goes through an edge of p? if so set the intersection
  // at i and the normal of the edge at n
  intersects: function(p,a,b,i,n){
    // TODO
    throw new Error('intersects not implemented')
  },

  // http://www.codeproject.com/Articles/15573/2D-Polygon-Collision-Detection
  // is polygon `a` going to collide with polygon `b`?
  // `v` is the relative velocity of the polygons (ie. velA - velB)
  // returns a collision info object:
  //    { intersect: Bool, willIntersect: Bool, nearestEdge: vec, minTranslationVector: vec}
  collides: function(a,b,v,o){
    var res = o || {};
    res.intersect = true;
    res.willIntersect = true;
    res.minTranslationVector = null;
    res.nearestEdge = null;

    v = v || vec.make()
    var minIntervalDistance = Infinity;
    var translationAxis = vec.make();
    var nearestEdge = vec.make();
    var axis = vec.make()
    var iA = vec.make();
    var iB = vec.make();
    var cA, cB, cD;

    // loop through all edges of both polygons
    for(var i=0; i < (a.length+b.length); i++){
      var e = i < a.length ? i : i-a.length
      var edge = i < a.length ? a.edges[e] : b.edges[e]

      vec.perp(edge,axis)
      vec.norm(axis,axis)

      poly.project(a,axis,iA)
      poly.project(b,axis,iB)

      // are they currently intersecting?
      var iD = intervalDistance(iA,iB);
      if( iD >= 0 ){
        res.intersect = false;
      }

      // will they intersect?
      var vProj = vec.dot(axis,v);
      if( vProj < 0 ){
        iA[0] += vProj;
      } else {
        iA[1] += vProj;
      }

      iD = intervalDistance(iA,iB);
      if( iD >= 0 ){
        res.willIntersect = false;
      }

      // find out if it's the closest one
      iD = Math.abs(iD);
      if( iD < minIntervalDistance ){
        minIntervalDistance = iD;
        vec.copy(edge, nearestEdge);
        vec.copy(axis, translationAxis);

        cA = cA || poly.centroid(a)
        cB = cB || poly.centroid(b)
        cD = vec.sub(cA, cB, cD);
        if( vec.dot(cD, translationAxis) < 0 ){
          vec.neg(translationAxis,translationAxis)
        }
      }

      // no intersection is and won't happen
      if( !res.intersect && !res.willIntersect ){
        break;
      }

    }

    // the minimum translation vector can
    // be used to push the polygons apart
    if( res.willIntersect ){
      translationAxis[0] *= minIntervalDistance;
      translationAxis[1] *= minIntervalDistance;
      res.minTranslationVector = translationAxis;
      res.nearestEdge = nearestEdge;
    } else {
      vec.free(translationAxis)
      vec.free(nearestEdge)
    }

    vec.free(iA)
    vec.free(iB)
    vec.free(cA)
    vec.free(cB)
    vec.free(cD)
    vec.free(axis)

    // free `v` if it wasn't passed in as
    // an argument
    if( !arguments[2] ){
      vec.free(v);
    }

    return res;
  },


  // `i` (interval) will be [min,max]
  // `axis` (vec) will be [x,y]
  project: function(p,axis,i){
    i = i || vec.make();
    i[0] =  Infinity;
    i[1] = -Infinity;
    for(var j=0; j < p.length; j++){
      var dot = vec.dot(axis,p.vertices[j])
      if( dot < i[0] ){
        i[0] = dot;
      }
      if( dot > i[1] ){
        i[1] = dot;
      }
    }
    return i;
  }

}



function intervalDistance(a,b){
  return a[0] < b[0] ? b[0] - a[1] : a[0] - b[1];
}
});
require.register("publicclass-geom/index.js", function(exports, require, module){
exports.vec = require('geom-vec')
exports.mat = require('geom-mat')
exports.poly = require('geom-poly')
});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("publicclass-copy/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var type;

try {
  type = require('type');
} catch(e){
  type = require('type-component');
}

/**
 * Module exports.
 */

module.exports = copy;

/**
 * Copies the properties of `obj`.
 *
 * @param {Mixed} any object
 * @param {Mixed} any object
 * @param {Boolean} remove missing keys
 * @api public
 */

function copy(obj,to,clean){
  switch (type(obj)) {
    case 'object':
      var c = type(to) == 'object' ? to : {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          c[key] = copy(obj[key],c[key],clean);
        }
      }
      if( clean ){
        for (var key in c) {
          if (c.hasOwnProperty(key) && !obj.hasOwnProperty(key)) {
            delete c[key];
          }
        }
      }
      return c;

    case 'array':
      var c = type(to) == 'array' ? to : [];
      c.length = obj.length;
      for (var i = 0, l = obj.length; i < l; i++) {
        c[i] = copy(obj[i],c[i],clean);
      }
      return c;

    case 'regexp':
      // from millermedeiros/amd-utils - MIT
      var flags = '';
      flags += obj.multiline ? 'm' : '';
      flags += obj.global ? 'g' : '';
      flags += obj.ignoreCase ? 'i' : '';
      return new RegExp(obj.source, flags);

    case 'date':
      return new Date(obj.getTime());

    default: // string, number, boolean, …
      return obj;
  }
}

});
require.register("publicclass-stash/index.js", function(exports, require, module){

module.exports = function createStash(){
  return new Stash();
}

module.exports.Stash = Stash;

function Stash(){
  this.values = [];
  this.lookup = {};   // [key] = index
  this.reverse = {};  // [index] = key
  this.length = 0;
}

Stash.prototype = {

  set: function(key,val){
    key = ''+key
    if( key in this.lookup ){
      console.warn('key "%s" already exists in stash. deleting it first.',key)
      this.del(key);
    }
    var index = this.values.length;
    this.lookup[key] = index;
    this.reverse[index] = key;
    this.values.push(val)
    this.length++;
    return this
  },

  has: function(key){
    return (''+key) in this.lookup;
  },

  get: function(key){
    key = ''+key
    if( key in this.lookup ){
      var index = this.lookup[key];
      return this.values[index];
    } else console.error('tried to get "%s" that didn\'t exist',key)
    return undefined;
  },

  del: function(key){
    key = ''+key
    if( key in this.lookup ){
      // move the last values into the
      // position of the deleted value
      // to keep the array dense (and
      // avoid unnecessary allocation)
      var index = this.lookup[key]
        , end = this.length-1;

      // special case if the deleted key is last value (no need to reorder stuff)
      if( index == end ){
        this.values.pop();
        delete this.reverse[index];
        delete this.lookup[key];
        this.length--;

      } else if( index >= 0 && index < end ){
        this.values[index] = this.values.pop();

        // update the lookups
        var rindex = this.values.length;
        var rkey = this.reverse[rindex];
        this.lookup[rkey] = index;
        this.reverse[index] = rkey;
        delete this.reverse[rindex];
        delete this.lookup[key];
        this.length--;
      } else console.warn('tried to delete "%s" with an invalid index %s',key,index)
    } else console.warn('tried to delete "%s" that didn\'t exist',key)
    return this;
  },

  empty: function(){
    this.values.length = 0
    this.length = 0
    for(var i in this.reverse){
      var k = this.reverse[i]
      delete this.lookup[k]
      delete this.reverse[i]
    }
    return this;
  }

}
});
require.register("publicclass-netchan/index.js", function(exports, require, module){

module.exports = NetChannel;

/**
 * NetChannel wraps an unreliable DataChannel
 * with a sequence and an ack.
 *
 * When a message is received it checks the ack against
 * the messages buffer and the ones "acknowledged" will
 * be removed from the buffer and the rest will be resent.
 *
 * After sending and the buffer is not empty after a timeout
 * it will try to send again until it is.
 *
 * Inspired by NetChan by Id software.
 *
 *  Options:
 *
 *    - {Number} `resend` a number in ms if how often it should try to flush again.
 *    - {Boolean} `ack` if true an ACK packet will automatically be responded with to keep the buffer clean.
 *
 * @param {DataChannel} channel
 * @param {Object} opts
 */
function NetChannel(channel,opts){
  this.seq = 1;
  this.ack = 0;
  this.buffer = []; // [seq,buf]
  this.bufferLength = 0;
  this.encoded = null; // cached
  this.options = opts || {}

  channel && this.setChannel(channel)
}

// magic packet
var ACK = 'ncACK'.split('').map(function(c){return c.charCodeAt(0)})
NetChannel.ACK = new Uint8Array(ACK).buffer;
NetChannel._isACK = isACK; // export for testing only

NetChannel.prototype = {

  onmessage: noop,

  setChannel: function(channel){
    if( channel.reliable )
      throw new ArgumentError('channel must be unreliable. just use the normal data channel instead.')
    var netchan = this;
    this.channel = channel;
    this.channel.addEventListener('message',function(e){ netchan.recv(e) },false)
  },

  recv: function(e){
    this.decode(e.data)
    this.flush()
  },

  send: function(msg){
    // accept any TypedArray
    if( msg && (msg.buffer instanceof ArrayBuffer) ){
      msg = msg.buffer;
    }

    if( !(msg instanceof ArrayBuffer) ){
      throw new Error('invalid message type, only binary is supported');
    }

    if( msg.byteLength > 255 ){
      throw new Error('invalid message length, only up to 256 bytes are supported')
    }

    // grow by 3 bytes (seq & len)
    var seq = this.seq++;
    var buf = new Uint8Array(3+msg.byteLength);
    var dat = new DataView(buf.buffer);
    dat.setUint16(0,seq);
    dat.setUint8(2,msg.byteLength);
    buf.set(new Uint8Array(msg),3);

    this.bufferLength += buf.byteLength;
    this.buffer.push(seq,buf);
    this.encoded = null;

    this.flush();
  },

  flush: function(){
    if( this.bufferLength && this.channel && this.channel.readyState == 'open' ){
      this.channel.send(this.encoded || this.encode());

      // try again every X ms and stop when buffer is empty
      if( this.options.resend ){
        clearTimeout(this._timeout)
        this._timeout = setTimeout(this.flush.bind(this),this.options.resend)
      }
    }
  },

  // encodes into a message like this:
  // ack,seq1,len1,data1[,seq2,len2,data2...]
  encode: function(){
    // grow by 2 bytes (ack) + unsent buffer
    var buf = new Uint8Array(2+this.bufferLength);
    var data = new DataView(buf.buffer);

    // prepend with ack number
    data.setUint16(0,this.ack)

    // write all buffered messages
    var offset = 2;
    for(var i=1; i < this.buffer.length; i+=2){
      var msg = this.buffer[i];
      buf.set(msg,offset);
      offset += msg.byteLength;
    }
    return this.encoded = buf.buffer;
  },

  // decodes from a message like this:
  // ack,seq1,len1,data1[,seq2,len2,data2...]
  decode: function(buf){
    // read the sequence and ack
    var data = new DataView(buf.buffer || buf)
    var ack = data.getUint16(0)
    this.shrink(ack)

    // read messages
    var offset = 2 // start after ack
      , length = buf.byteLength
      , seq = this.ack // in case no messages are read, its the same
      , len = 0
      , sendACK = false;

    while(offset < length){
      seq = data.getUint16(offset,false); // false is required for node test only
      len = data.getUint8(offset+2);
      if( seq <= this.ack ){
        offset += len+3; // len + seq = 3 bytes
        continue;
      }

      // get the message
      var msg = data.buffer.slice(offset+3,offset+3+len);
      offset += len+3;

      // emit onmessage for each message unless it's an ACK
      if( !this.options.ack || !isACK(msg) ){
        if( typeof this.onmessage == 'function' ){
          this.onmessage(msg);
        }
        sendACK = true;
      }

      // store the sequence as the last acknowledged one
      this.ack = seq;
    }

    // send an ACK
    if( this.options.ack && sendACK ){
      this.send(NetChannel.ACK);
    }
  },

  // shrink the buffer & bufferLength up to the
  // acknowledged messages.
  // assumes this.buffer is sorted by sequence
  shrink: function(ack){
    var index = null
      , length = 0;
    for(var i=0; i < this.buffer.length; i+=2){
      var s = this.buffer[i];
      if( s <= ack ){
        index = i+2;
        length += this.buffer[i+1].byteLength;
      } else {
        break;
      }
    }
    if( index !== null ){
      this.buffer.splice(0,index);
      this.bufferLength -= length;
      this.encoded = null;
    }
  },

  toString: function(){
    return 'NetChannel\n\t' + [
      'seq: '+this.seq,
      'ack: '+this.ack,
      'buffer: '+this.buffer.length,
      'buffer size: '+this.bufferLength,
      'encoded: '+(this.encoded&&this.encoded.byteLength)
    ].join('\n\t')
  }
}

function noop(){}

function isACK(msg){
  // check the type
  if( !msg || typeof msg != typeof NetChannel.ACK ){
    return false;
  }

  // check the length
  if( msg.byteLength !== NetChannel.ACK.byteLength ){
    return false;
  }
  // check if they have the same contents
  var arr = new Uint8Array(msg);
  for(var i=0; i<ACK.length; i++){
    if( arr[i] !== ACK[i] ){
      return false;
    }
  }

  // yup. it's an ACK
  return true;
}
});
require.register("component-to-function/index.js", function(exports, require, module){

/**
 * Expose `toFunction()`.
 */

module.exports = toFunction;

/**
 * Convert `obj` to a `Function`.
 *
 * @param {Mixed} obj
 * @return {Function}
 * @api private
 */

function toFunction(obj) {
  switch ({}.toString.call(obj)) {
    case '[object Object]':
      return objectToFunction(obj);
    case '[object Function]':
      return obj;
    case '[object String]':
      return stringToFunction(obj);
    case '[object RegExp]':
      return regexpToFunction(obj);
    default:
      return defaultToFunction(obj);
  }
}

/**
 * Default to strict equality.
 *
 * @param {Mixed} val
 * @return {Function}
 * @api private
 */

function defaultToFunction(val) {
  return function(obj){
    return val === obj;
  }
}

/**
 * Convert `re` to a function.
 *
 * @param {RegExp} re
 * @return {Function}
 * @api private
 */

function regexpToFunction(re) {
  return function(obj){
    return re.test(obj);
  }
}

/**
 * Convert property `str` to a function.
 *
 * @param {String} str
 * @return {Function}
 * @api private
 */

function stringToFunction(str) {
  // immediate such as "> 20"
  if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

  // properties such as "name.first" or "age > 18"
  return new Function('_', 'return _.' + str);
}

/**
 * Convert `object` to a function.
 *
 * @param {Object} object
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  var match = {}
  for (var key in obj) {
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key])
  }
  return function(val){
    if (typeof val !== 'object') return false;
    for (var key in match) {
      if (!(key in val)) return false;
      if (!match[key](val[key])) return false;
    }
    return true;
  }
}

});
require.register("component-mean/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var toFunction = require('to-function');

/**
 * Return the mean value in `arr` with optional callback `fn(val, i)`.
 *
 * @param {Array} arr
 * @param {Function} [fn]
 * @return {Number}
 * @api public
 */

module.exports = function(arr, fn){
  if (0 == arr.length) return null;
  var sum = 0;

  if (fn) {
    fn = toFunction(fn);
    for (var i = 0; i < arr.length; ++i) {
      sum += fn(arr[i], i);
    }
  } else {
    for (var i = 0; i < arr.length; ++i) {
      sum += arr[i];
    }
  }

  return sum / arr.length;
};

});
require.register("component-variance/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var toFunction = require('to-function')
  , mean = require('mean');

/**
 * Return the variance of `arr` with optional callback `fn(val, i)`.
 *
 * @param {Array} arr
 * @param {Function} [fn]
 * @return {Number}
 * @api public
 */

module.exports = function(arr, fn){
  if (0 == arr.length) return null;

  var m = mean(arr);
  var d = [];

  if (fn) {
    fn = toFunction(fn);
    for (var i = 0; i < arr.length; i++) {
      d.push(Math.pow(fn(arr[i], i) - m, 2));
    }
  } else {
    for (var i = 0; i < arr.length; i++) {
      d.push(Math.pow(arr[i] - m, 2));
    }
  }

  return mean(d);
};

});
require.register("component-standard-deviation/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var variance = require('variance');

/**
 * Return the standard deviation of `arr` with optional callback `fn(val, i)`.
 *
 * @param {Array} arr
 * @param {Function} [fn]
 * @return {Number}
 * @api public
 */

module.exports = function(arr, fn){
  if (0 == arr.length) return null;
  return Math.sqrt(variance(arr, fn));
};

});
require.register("publicclass-median/index.js", function(exports, require, module){

/**
 * Return the median of the numbers in `arr`.
 *
 * @param {Array} arr
 * @return {Number}
 * @api public
 */

module.exports = function(arr){
  var n = arr.length;
  if( n % 2 == 0 ){
    return arr[n/2];
  } else {
    var l = Math.floor(n/2)
    return (arr[l] + arr[l+1]) / 2;
  }
}
});
require.register("publicclass-latency/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */
var median = require('median')
  , sd = require('standard-deviation');


/**
 * Calculates the latency from an `arr` of
 * times (each the result of `now - started`).
 *
 * Based on: http://www.gamedev.net/page/resources/_/technical/multiplayer-and-network-programming/clock-synchronization-of-client-programs-r2493
 *
 * @param {Array} arr
 * @return {Number}
 * @api public
 */
module.exports = function(arr){
  var std = sd(arr);
  var m = median(arr);
  var sum = 0;
  var n = 0;
  for (var i = 0; i < arr.length; ++i) {
    if( Math.abs(m - arr[i]) <= std ){
      sum += arr[i];
      n++;
    }
  }
  return sum / n;
}
});
require.register("publicclass-base64-arraybuffer/index.js", function(exports, require, module){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */

var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

exports.encode = function(arraybuffer) {
  var bytes = new Uint8Array(arraybuffer)
    , len = bytes.byteLength
    , base64 = "";

  for(var i = 0; i < len; i+=3){
    base64 += chars[bytes[i] >> 2];
    base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    base64 += chars[bytes[i + 2] & 63];
  }

  if ((len % 3) === 2) {
    base64 = base64.substring(0, base64.length - 1) + "=";
  } else if (len % 3 === 1) {
    base64 = base64.substring(0, base64.length - 2) + "==";
  }

  return base64;
};

exports.decode =  function(base64) {
  var bufferLength = base64.length * 0.75
    , len = base64.length
    , p = 0
    , encoded1
    , encoded2
    , encoded3
    , encoded4;

  if (base64[base64.length - 1] === "=") {
    bufferLength--;
    if (base64[base64.length - 2] === "=") {
      bufferLength--;
    }
  }

  var arraybuffer = new ArrayBuffer(bufferLength),
  bytes = new Uint8Array(arraybuffer);

  for(var i=0; i < len; i+=4){
    encoded1 = chars.indexOf(base64[i]);
    encoded2 = chars.indexOf(base64[i+1]);
    encoded3 = chars.indexOf(base64[i+2]);
    encoded4 = chars.indexOf(base64[i+3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arraybuffer;
};
});
require.register("visionmedia-debug/index.js", function(exports, require, module){
if ('undefined' == typeof window) {
  module.exports = require('./lib/debug');
} else {
  module.exports = require('./debug');
}

});
require.register("visionmedia-debug/debug.js", function(exports, require, module){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

if (window.localStorage) debug.enable(localStorage.debug);

});
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture || false);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture || false);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("ecarter-css-emitter/index.js", function(exports, require, module){

/**
 * Module Dependencies
 */

var Emitter = require('emitter')
  , events = require('event');

// CSS events

var watch = [
  'transitionend'
, 'webkitTransitionEnd'
, 'oTransitionEnd'
, 'MSTransitionEnd'
, 'animationend'
, 'webkitAnimationEnd'
, 'oAnimationEnd'
, 'MSAnimationEnd'
];

/**
 * Expose `CSSnext`
 */

module.exports = CssEmitter;

/**
 * Initialize a new `CssEmitter`
 *
 */

function CssEmitter(element){
  if (!(this instanceof CssEmitter)) return new CssEmitter(element);
  Emitter.call(this);
  this.el = element;
  this.bind();
}

/**
 * Inherit from `Emitter.prototype`
 */

CssEmitter.prototype = new Emitter;

/**
 * Bind CSS events.
 *
 * @api private
 */

CssEmitter.prototype.bind = function(){
  var self = self || this;
  for (var i=0; i < watch.length; i++) {
    events.bind(this.el, watch[i], function(e){
      self.emit('end', e);
    });
  }
};


});
require.register("slam/index.js", function(exports, require, module){
module.exports = require('./lib/app.js')
});
require.register("slam/lib/tracking.js", function(exports, require, module){
module.exports = {
  replayClicks:1,
  levelStartTime:0,
  currentLevel: -1,
  latency: []
}
});
require.register("slam/lib/settings.js", function(exports, require, module){
var Emitter = require('emitter')
  , Themes = require('./themes');

var settings = Emitter(exports);

settings.CAMERA_SCRIPTED = 0
settings.CAMERA_FPS = 1
settings.CAMERA_CLASSIC = 2
settings.CAMERA_RABBIT = 3
settings.CAMERA_MOUNTAINVIEW = 4

settings.QUALITY_BEST = 'best'
settings.QUALITY_HIGH = 'high'
settings.QUALITY_LOW = 'low'
settings.QUALITY_MOBILE = 'mobile'

// the default theme
// to be overridden by levels
settings.ai = null;
settings.theme = Themes.current;

settings.data = {

  // defaults (will be set in /states/game/multiplayer.js)
  defaultFramerate: 60,
  defaultTimestep: 1000/60,
  defaultUnitSpeed: 18,
  maxUpdatesPerFrame: 15,

  cameraType:settings.CAMERA_SCRIPTED,
  antialias: false,
  cameraFov: 50,
  cameraOverlay: true,
  cameraGrid: 0,
  godMode: false,
  showDebugInfo: false,
  //overrideCamera: '',
  wireframeOverride:false,
  terrainNormals:false,
  fpsCamera: false,

  // a bit of a hack to work around an
  // issue found on android devices
  // where they read the video textures
  // in a BGR format instead of the expected
  // RGB. by setting this to true the colors
  // will be flipped in the shaders.
  bgr: false,

  // game
  arenaWidth: 1700,
  arenaHeight: 1700/18*26,
  arenaColumns: 18,
  arenaRows: 26,
  unitSize: Math.round(1700/18), //= 94
  arenaSideHeight: 200,
  shieldPadding:2,
  defaultShields: 3,
  videoBoxDepth:700,
  paddleMass: 0.8,
  paddleDamping: 0.8,

  // minimum Y velocity of puck
  minYSpeed: 10,

  // speed of bullets
  // (multiplier of unitSpeed)
  bulletSpeed: 1.6,

  // time in ms how long a newly spawned
  // extra should be GHOSTed. this is so
  // the user has time to see what it is
  // first.
  extraGhostDuration: 400,

  // the default probability of an extra
  // to be spawned. so if for example only
  // one of the available extras defines
  // a probability of `1` it will be 10x
  // less likely then all the other extras
  // to be found.
  defaultProbability: 10,

  // the interval on which the forces
  // will toggle between active/inactive
  // set to 0 or non-number to disable.
  forcesInterval: 3000,

  // turn on paddle 'slam' effect
  paddleMomentum: true,

  // special 'speedup' which is damped
  // until it goes back to the normal
  // speed.
  speedupMomentum: true,

  // if the puck hit momentum should affect
  // the direction
  directionMomentum: true,

  // when true the collision reflection angle
  // is based on the edge intersecting the
  // centroid of the two colliding shapes instead
  // of the `nearestEdge` guessed by `poly.collide()`.
  // It may use a few more cycles on collision but
  // makes the bouncing much more reliable.
  improvedNormals: true,

  // the amount we narrow down the angle of reflection
  // with or without momentum.
  // higher value means more narrow as it's a divisor
  // of the position on the paddle.
  steerWidth: 2,
  steerWidthMomentum: 3,

  fireballSpeedup: 1.5,

  interpolationMaxFrames: 10,    // set to 0 to turn off
  interpolationMinDistance: 1,   // distance in pixels
  interpolationMaxDistance: 500, // distance in pixels

  clearColor: 0xedecd6,
  fireColor: 0xefce06,
  fireColor2: 0xff0000,

  //ambientLightColor: 0x444444,
  //ambientLightIntensity: 0.40,
  dirLightColor: 0xffffff,
  dirLightIntensity: 0.88,
  dirLightX: 0.107,
  dirLightY: 0.15,
  dirLightZ: 0.07,
  hemisphereLightSkyColor: 0xffffff,
  hemisphereLightGroundColor: 0xb1b1b1,
  hemisphereLightIntensity:0.74,
  useShadows:false,
  arenaSurfaceY: -200,

  hue: 0,
  saturate: 100,
  extraHue:0,
  extraSaturate: 100,

  quality: 'high',
  overrideSpawnExtras: false,
  spawnExtras: {
    bulletproof: false,
    mirroredcontrols: false,
    fog: false,
    extralife: false,
    ghostball: false,
    fireball: false,
    multiball: false,
    paddleresize: false,
    timebomb: false,
    laser: false,
    deathball: false
  },
  testCPUMorph: -1,

  // networking
  keepAliveInterval: 250, // ms
  sendRate: 15, // hz

  // controls
  mouseSensitivity: 0.07,
  keyboardSensitivity: 0.9,
  invertControls: false,

  forrestPredefined:true,
  forrestThreshold:0.5,
  forrestGridX:200,
  forrestGridY:200,
  forrestBaseScale:0.5,
  forrestRandomSeed:0.5
}

// [t,r,b,l]
settings.data.bounds = [0,settings.data.arenaWidth,settings.data.arenaHeight,0];
settings.data.framerate = settings.data.defaultFramerate;
settings.data.timestep = settings.data.defaultTimestep;
settings.data.unitSpeed = settings.data.defaultUnitSpeed;


settings.emit('lightsUpdated');

settings.getSpawnlist = function(){
  var list = [];
  for (var key in settings.data.spawnExtras) {
    if(settings.data.spawnExtras[key]){
      list.push({id: key});
    }
  }
  return list;
}

settings.changeTheme = function(theme){
  for( var key in theme ) {
    if( settings.theme.hasOwnProperty(key) ){
      settings.theme[key] = theme[key];
    }
  }
  settings.emit('colorsUpdated');
}


});
require.register("slam/lib/settings-gui.js", function(exports, require, module){
/* global dat: true, _gaq: true */

var settings = require('./settings')
  , Themes = require('./themes')
  , keys = require('mousetrap')
  , $ = require('jquery');

var gui
  , extraRows = [];

var CAMERA_TYPES = {
  'Scripted (1)': 0,
  'FPS (2)': 1,
  'Classic (3)': 2,
  'Rabbit Cam (4)': 3,
  'Mountain View (5)': 4
}

exports.createGenericUI = function( initParams ) {
  // dat.GUI is global, included in the HTML
  gui = new dat.GUI({ autoPlace: false });
  settings.gui = gui;

  gui.width = 400;
  document.getElementById('settingsDataGUI').appendChild(gui.domElement);

  gui.domElement.addEventListener('click', logSettingsClick)

  function logSettingsClick(){
    gui.domElement.removeEventListener('click', logSettingsClick)
    _gaq.push(['_trackEvent', 'settings', 'open']);
  }

  var f;

  f = gui.addFolder('Generic');
  f.add(exports,'shortcut','O').name('Show panels')
  f.add(exports,'shortcut','0').name('Debug renderer')
  f.add(exports,'shortcut','P').name('Add puck');
  f.add(exports,'shortcut','E').name('Explode');
  f.add(exports,'shortcut','H').name('Heal');
  f.add(exports,'shortcut','M').name('Mirror effect');
  f.add(settings.data, 'godMode').name('God mode');
  f.add(settings.data, 'quality',{'Best quality (antialiasing)':'best','High quality':'high','High performance':'low','Mobile':'mobile'}).onChange(function(value){

    var result=confirm('The page needs to be reloaded for the setting to be activated');
    if (result===true) {
      var currentUrl = window.location.href;
      currentUrl = updateQueryStringParameter(currentUrl,'quality',value);
      window.location.href = currentUrl;
    }
    /*
    settings.data.quality = value;
    settings.emit('qualityChanged');*/
  }.bind(this));
  f.add(settings.data, 'framerate').min(1).max(120).name('Framerate (fps)').onChange(framerateUpdated)
  f.add(settings.data, 'unitSpeed').min(1).max(120).name('Speed')

  f = gui.addFolder('Camera');
  f.add(settings.data, 'cameraType',CAMERA_TYPES).name('Mode').listen().onChange(function(value){
    settings.data.cameraType = parseInt(value,10);
    settings.emit('cameraTypeChanged')
  }.bind(this));
  f.add(settings.data,'cameraOverlay').name('Overlay').onChange(function(){
    settings.emit('cameraSettingsChanged')
  }.bind(this))
  f.add(settings.data,'cameraFov').min(10).max(100).step(1).name('FOV').onChange(function(){
    settings.emit('cameraSettingsChanged')
  }.bind(this))
  f.add(settings.data,'cameraGrid').min(0).max(1).name('Scanlines').onChange(function(){
    settings.emit('cameraSettingsChanged')
  }.bind(this))
  f.add(exports, 'shortcut','C').name('Log position');


  f = gui.addFolder('Theme');

  f.add(settings.data,'wireframeOverride').name('Wireframe override').onChange(function(){
    settings.emit('wireframeOverrideChanged')
  }.bind(this))
  f.add(settings.data,'terrainNormals').name('Terrain normals').onChange(function(){
    settings.emit('terrainNormalsChanged')
  }.bind(this))

  this.themelist = {};
  for (var i = Themes.list.length - 1; i >= 0; i--) {
    this.themelist[Themes.list[i].name] = i
  }

  f.add(this,'themelist',this.themelist).name('Presets').onChange(function(value){
    Themes.goto(parseInt(value,10)-1);
  })

  f.addColor(settings.theme, 'shieldColor').name('Shield color').onChange(colorsUpdated);
  f.addColor(settings.theme, 'puckColor').name('Puck').onChange(colorsUpdated);
  f.addColor(settings.theme, 'arenaColor').name('Arena').onChange(colorsUpdated);
  f.addColor(settings.theme, 'terrainColor1').name('Terrain1').onChange(colorsUpdated);
  f.addColor(settings.theme, 'terrainColor2').name('Terrain2').onChange(colorsUpdated);
  f.addColor(settings.theme, 'terrainColor3').name('Terrain3').onChange(colorsUpdated);
  f.addColor(settings.theme, 'treeBranchColor').name('Trees').onChange(colorsUpdated);
  f.addColor(settings.theme, 'iconColor').name('Icons').onChange(colorsUpdated);
  f.addColor(settings.theme, 'cpuBackdropColor').name('CPU backdrop').onChange(colorsUpdated);
  f.add(settings.theme, 'gridBrightness').min(0).max(1).name('Grid brightness').onChange(colorsUpdated);


  if( initParams.isMobile ) {
    f = gui.addFolder('Mobile Colors');
    f.add(settings.data, 'hue').min(0).max(360).name('Hue').onChange(mobileColor);
    f.add(settings.data, 'saturate').min(0).max(100).name('Saturate').onChange(mobileColor);
    f.add(settings.data, 'extraHue').min(0).max(360).name('Extras Hue').onChange(mobileExtrasColor);
    f.add(settings.data, 'extraSaturate').min(0).max(100).name('Extras Saturate').onChange(mobileExtrasColor);
  }

  f = gui.addFolder('Extras');
  f.add(settings.data,'overrideSpawnExtras').name('override extras').onChange(setExtraStatus);
  for (var key in settings.data.spawnExtras) {
    extraRows[key] = f.add(settings.data.spawnExtras,key).name(key);
  }
  setExtraStatus()

  f = gui.addFolder('Paddle');
  f.add(settings.data, 'paddleMomentum').name('Use momentum');
  f.add(settings.data, 'speedupMomentum').name('Momentum speedup');
  f.add(settings.data, 'directionMomentum').name('Momentum direction');
  f.add(settings.data, 'paddleMass').min(0).max(1).name('Mass');
  f.add(settings.data, 'paddleDamping').min(0).max(1).name('Damping');
  f.add(settings.data, 'keyboardSensitivity').min(0).max(100).name('Keyboard Sens.');
  f.add(settings.data, 'mouseSensitivity').min(0).max(100).name('Mouse/Touch Sens.');

  f = gui.addFolder('Forest');
  f.add(settings.data, 'forrestThreshold').min(0).max(1).name('Amount');
  f.add(settings.data, 'forrestGridX').min(50).max(500).name('Grid Size X');
  f.add(settings.data, 'forrestGridY').min(50).max(500).name('Grid Size Y');
  f.add(settings.data, 'forrestBaseScale').min(0).max(3).name('Base Scale');
  f.add(settings.data, 'forrestRandomSeed').min(0).max(10).name('Groups/Random');
  f.add(exports, 'createForrest').name('Generate');

  f = gui.addFolder('Lights');
  f.addColor(settings.data, 'dirLightColor').name('Dir color').onChange(lightsUpdated);
  f.add(settings.data, 'dirLightIntensity').min(0).max(2).name('Dir').onChange(lightsUpdated);
  f.add(settings.data, 'dirLightX').min(-1.01).max(1.01).listen().name('Dir pos X').onChange(lightsUpdated);
  f.add(settings.data, 'dirLightY').min(0).max(1.01).listen().name('Dir pos Y').onChange(lightsUpdated);
  f.add(settings.data, 'dirLightZ').min(-1.01).max(1.01).listen().name('Dir Pos Z').onChange(lightsUpdated);
  f.addColor(settings.data, 'hemisphereLightSkyColor').name('Hemisphere Sky').onChange(lightsUpdated);
  f.addColor(settings.data, 'hemisphereLightGroundColor').name('Hemisphere Ground').onChange(lightsUpdated);
  f.add(settings.data, 'hemisphereLightIntensity').min(0).max(2).name('Hemisphere').onChange(lightsUpdated);

  if( initParams.isNetwork ){
    f = gui.addFolder('Networking');
    f.add(settings.data, 'keepAliveInterval').min(16).max(1000).name('Keep Alive Interval (ms)');
    f.add(settings.data, 'sendRate').min(1).max(60).name('Send Rate (hz)');

    f = gui.addFolder('Interpolation');
    f.add(settings.data, 'interpolationMaxFrames').min(0).max(120).name('Max frames (0=none)');
    f.add(settings.data, 'interpolationMaxDistance').min(0).max(1000).name('Max distance diff (px/frame)');
    f.add(settings.data, 'interpolationMinDistance').min(0).max(1000).name('Min distance diff (px/frame)');
  }

  gui.close();

  settings.on('colorsUpdated',function(){
    for (var i in gui.__folders['Theme'].__controllers) {
      gui.__folders['Theme'].__controllers[i].updateDisplay();
    }
  })
}

function colorsUpdated() {
  settings.emit('colorsUpdated');
}


function lightsUpdated( value ) {
  settings.emit('lightsUpdated');
}

function mobileColor() {
  var filter = 'hue-rotate('+settings.data.hue+'deg) saturate('+settings.data.saturate+'%)';
  $('#canv-css .background')[0].style.webkitFilter = filter;
}

function mobileExtrasColor() {
  var filter = 'hue-rotate('+settings.data.extraHue+'deg) saturate('+settings.data.extraSaturate+'%)';
  $('#canv-css .extra').each( function(){
    this.style.webkitFilter = filter;
  })
}

function framerateUpdated(v){
  settings.data.timestep = 1000/v;
}

function setExtraStatus() {
  for (var key in extraRows) {
    var item = extraRows[key];

    if( !settings.data.overrideSpawnExtras ) {
      item.domElement.lastChild.disabled = true;
      item.domElement.parentNode.className='disabled';
    }
    else {
      item.domElement.lastChild.disabled = false;
      item.domElement.parentNode.className='';
    }
  }
}

function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
  separator = uri.indexOf('?') !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + "=" + value + '$2');
  }
  else {
    return uri + separator + key + "=" + value;
  }
}

exports.createForrest = function() {
  settings.data.forrestPredefined = false;
  settings.emit('generateForrest');
}

exports.shortcut = function(label){
  keys.trigger(label.toLowerCase());
}


});
require.register("slam/lib/app.js", function(exports, require, module){
function noop(){}
if(!window.console) { window.console = {log:noop,warn:noop,error:noop} }
if(!window.console.time) { window.console.time = window.console.timeEnd = noop }
if(!window.console.profile) { window.console.profile = noop }
if(!window.console.group) { window.console.group = window.console.groupEnd = window.console.groupCollapsed = noop }

console.groupCollapsed('load')
console.time('load')

var debug = require('debug').enable(d('')) // <-- enable within d() (prefer using ?d=xyz)
  , see = require('./support/see')
  , states = require('./states')
  , $ = require('jquery');

see('/',states.Mobile)
see('/',states.Setup) // game / network / audio / localization
see('/loading',states.Loading)
see('/main-menu',states.MainMenu)
see('/friend/invite',states.Friend.Invite)
see('/friend/waiting',states.Friend.Waiting)
see('/friend/accept',states.Friend.Accept)
see('/friend/arrived',states.Friend.Arrived)
see('/friend/left',states.Friend.Left)
see('/webcam/activate',states.Webcam.Activation)
see('/webcam/information',states.Webcam.Information)
see('/webcam/waiting',states.Webcam.Waiting) // (for friend to pick camera)
see('/game',states.Game.Input)
see('/game',states.Game.Multiplayer)
see('/game',states.Game.Verify)
see('/game',states.Game.Setup)        // Editor / Puppeteer / AI / mouse & keyboard controls
see('/game/instructions',states.Game.Instructions)
see('/game/wait',states.Game.Wait)    // (for friend to start game)
see('/game/start',states.Game.Start)  // setup game / create puck / create paddles / create shields
see('/game/play',states.Game.Play)    // unpause game
see('/game/next',states.Game.Next)    // update progress / distort screen / decide if game is really over
see('/game/pause',states.Game.Pause)  // show pause screen
see('/game/over',states.Game.Over)    // show winner!
see('/game/prompt',states.Prompt)     // show round prompt
see('/game/prompt/round',states.Prompt.Round)   // show round prompt
see('/game/prompt/level',states.Prompt.Level)   // show level prompt
see('/game/prompt/start',states.Prompt.Start)   // show level prompt
see('/game/prompt/over',states.Prompt.Over)     // show game over prompt
see('/game/invite',states.Friend.Invite)
see('/game/arrived',states.Friend.Arrived)
see('/game/cssinfo',states.Mobile.Info)
see('/game/over/cssinfo',states.Mobile.Info)
see('/cssinfo',states.Mobile.Info)
see('/error',states.Error)
see('/error/fullroom',states.Error.FullRoom)
see('/error/connection',states.Error.ConnectionError)
see('/error/datachannels',states.Error.DataChannels)
see('/error/browser',states.Error.Browser)
see('/error/lonelyroom',states.Error.Lonely)

see.on('enter',function(ctx,state){
  var name = slug(ctx.pathname)||'setup'

  if( name !== 'setup') {
    _gaq.push(['_trackPageview', name]);
  }

  $('body').addClass(name);
  $('.state.' + name).show().addClass('active enter');
  setTimeout(function(){
    $('.state.' + name).removeClass('inactive');
  },4);
  ctx.el = $('.state.' + name);
})

see.on('leave',function(ctx,state){
  var name = slug(ctx.pathname)||'setup'

  $('body').removeClass(name);
  var stateElem = $('.state.' + name).removeClass('active enter').addClass('inactive');
  stateElem.each(function(){
    if(!$(this).hasClass('animate') && $('.animate', $(this)).length < 1) {
      $(this).hide();
    }
  })
  ctx.el = $('.state.' + name);
})

see.on('error',function(err){
  console.error('see error:',err)
})

module.exports = function main(ctx){
  // add query object to ctx
  ctx.query = qs();
  see.ctx(ctx)

  setTimeout(function(){
    see('/loading') // GO!
  },4)
}

function slug(str){
  return str.replace(/^\//,'').replace(/[\/ ]/g,'-');
}

function d(enabled){
  if( enabled ) { return enabled; }
  var m = /&?d=([^&]+)/g.exec(location.search);
  if( m ){
    return m[1].replace(/%20|\+/g,' ');
  } else {
    return '';
  }
}

function qs(){
  var obj = {};
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=')
      , key = decodeURIComponent(pair[0])
      , val = decodeURIComponent(pair[1]);
    obj[key] = val || true; // true so "?x"; if( query.x ){}
  }
  return obj;
}
});
require.register("slam/lib/game.js", function(exports, require, module){
var requestAnimationFrame = require('request-animation-frame')
  , Emitter = require('emitter')
  , debug = require('debug')('game')
  , settings = require('./settings')
  , World = require('./world')
  , actions = require('./actions')
  , physics = require('./sim/physics')
  , Tick = require('./support/tick')
  , now = require('now')
  , AI = require('./ai');

// Example usage:
//  var g = new Game()
//  g.actions.register({name:fn})
//  g.run()

module.exports = Game;

function Game(name,renderer){
  this.tick = new Tick();
  this.world = new World(name,this.tick);
  this.ai = new AI(name);

  this.running = false;
  this.paused = false;

  this.on('update',physics.update)
  this.on('update',this.ai.update.bind(this.ai))
  this.on('update',this.tick.update.bind(this.tick))

  renderer && this.setRenderer(renderer)
}

Emitter(Game.prototype);

Game.prototype.reset = function(){
  debug('reset %s',this.world.name)
  this.world.reset();
  if( this.renderer ){
    this.renderer.reset();
  }
}

Game.prototype.setRenderer = function(renderer){
  debug('set renderer %s',this.world.name)
  if( this.renderer ){
    this.off('render')
    actions.off('renderer')
  }
  this.renderer = renderer;
  this.on('render',this.renderer.render.bind(this.renderer))
  // redirect 'renderer'-events from actions to renderer.triggerEvent
  actions.on('renderer',this.renderer.triggerEvent.bind(this.renderer))
}

Game.prototype.update = function(){
  var ts = settings.data.timestep;
  this.emit('pre update',this.world,ts)
  this.emit('update',this.world,ts)
  this.emit('post update',this.world,ts)
}

Game.prototype.render = function(){
  this.emit('render',this.world,0);
}

Game.prototype.pause = function(){
  debug('pause %s',this.world.name)
  this.paused = true;
}

Game.prototype.resume = function(){
  debug('resume %s',this.world.name)
  this.paused = false;
}

Game.prototype.run = function(){
  debug('run')

  if( this.running ){
    throw new Error('already running');
  }

  var currentTime = now()
    , accumulator = 0.0
    , game = this
    , world = this.world;

  function changevisibility( event ) {
    if( document.hidden === false || document.webkitHidden === false ){
      currentTime = now();
    }
  }
  document.addEventListener( 'visibilitychange',changevisibility,false);
  document.addEventListener( 'webkitvisibilitychange',changevisibility,false);

  function loop(){
    if( game.running ){
      requestAnimationFrame(loop);
    }
    var timestep = settings.data.timestep;
    var frameStart = now();
    game.emit('enter frame',world);

    if( !game.paused ){

      var newTime = now()
        , deltaTime = newTime - currentTime
        , maxDeltaTime = timestep*settings.data.maxUpdatesPerFrame;
      currentTime = newTime;

      // note: max frame time to avoid spiral of death
      if (deltaTime > maxDeltaTime){
        // console.warn('exceeding max deltatime ('+maxDeltaTime+'): '+deltaTime)
        deltaTime = maxDeltaTime;
      }

      // update
      var updatesStart = now();
      accumulator += deltaTime;
      while(accumulator >= timestep){
        game.emit('pre update',world,timestep)
        game.emit('update',world,timestep)
        game.emit('post update',world,timestep)
        accumulator -= timestep;
        if( !game.running ){
          break;
        }
      }
      var updatesEnd = now();
      if( updatesEnd - updatesStart > timestep ){
        // console.warn('slow update: '+(updatesEnd - updatesStart).toFixed(2)+'ms')
      }

      // render
      var renderStart = now();
      game.emit('render',world,accumulator/timestep);
      var renderEnd = now();
      if( renderEnd - renderStart > timestep ){
        // console.warn('slow render: '+(renderEnd - renderStart).toFixed(2)+'ms')
      }
    }

    game.emit('leave frame',world);

    var frameEnd = now();
    if( frameEnd-frameStart > timestep ){
      // console.warn('slow frame: '+(frameEnd-frameStart).toFixed(2)+' ms\n');
    }
  }
  this.running = true;
  loop();
  return this;
}
});
require.register("slam/lib/network.js", function(exports, require, module){
var Emitter = require('emitter')
  , NetChannel = require('netchan')
  , TimeSync = require('./support/time-sync')
  , validVideo = require('./support/valid-video')
  , base64 = require('base64-arraybuffer')
  , debug = require('debug')('network')
  , rtc = require('rtc');

module.exports = Network;

function Network(ctx){
  this.context = ctx; // TODO not sure about this...
  this.available = rtc.available;
  this.pathname = null;
  this.game = null; // will refer to the game channel when it's opened
  this.winner = false;
  this.ready = false;
  this.connected = false;
  this.sync = new TimeSync();
  this.readyState = 'new';
}

Emitter(Network.prototype)

Network.prototype.setupRemote = function(opts){
  debug('setup rtc')
  if( !this.available ){
    return console.warn('RTC not available. Skipping network');
  }

  var network = this
    , ctx = this.context
    , sync = this.sync;

  sync.on('timeout',function(){
    console.warn('time sync timed out')
  })
  sync.on('done',function(latency){
    debug('latency',latency)
    ctx.latency = latency;
    network.emit('change latency',latency)
    network.checkReady()
  })

  this.remote = rtc.connect(opts);
  this.remote.on('token',function(e){
    network.user = e.user;
    network.token = e.token;
  })
  this.remote.on('addstream',function(e){
    network.emit('addstream',e)
    network.checkReady()
  })
  this.remote.on('removestream',function(e){
    network.emit('removestream',e)
    network.checkReady()
  })
  this.remote.on('connected',function(e){
    debug('connected')
    network.connected = true;
    network.winner = this.initiator;
    network.emit('change winner',network.winner)
    debug('challenge winner?',network.winner)

    // send a meta object containing the
    // game version.
    this.signal.send({type:'meta',v:ctx.v})

    // send the current state and when
    // the remote current state is received
    // the first time we are officially connected.
    network.emit('state',ctx.pathname)
    network.checkReady()
  })
  this.remote.on('open',function(){
    debug('open')
    network.emit('open')
    network.checkReady()
  })
  this.remote.on('full',function(){
    debug('full')
    network.emit('full')
  })
  this.remote.on('timeout',function(){
    debug('timeout')
    network.emit('timeout')
  })
  this.remote.on('disconnected',function(e){
    debug('disconnected')
    if( network.connected ){
      network.emit('disconnected',e)
    }
    network.close()
  })
  this.remote.on('error',function(e){
    debug('error',e)
    console.warn('received an error from rtc:',e)
    network.emit('error',e)
  })
  this.remote.on('meta',function(meta){
    // verify the versions
    if( meta.v !== ctx.v ){
      console.error('game version mismatched. disconnecting.')
      network.close()
    }
  })
  this.remote.on('state',function(e){
    var initial = network.pathname;
    debug('received state %s %s',e.pathname, initial === null ? '(connected)' : '')
    network.pathname = e.pathname;
    network.emit('change pathname',e.pathname)
    if( initial === null ){
      network.emit('connected',e)
    }
    network.checkReady()
  })
  this.remote.on('channel game open',function(e){
    debug('channel game open',e)

    // wrap `this.channels.game` in NetChannel
    // and base64
    network.game = netchan(this.channels.game,network);
    network.game.onmessage = function(msg){
      // debug('message',ab2s(msg)) // too noisy
      if( sync.channel && !sync.onmessage(msg) ){
        network.emit('message',msg)
      }
    }

    // use the game channel for sending time sync
    // requests
    sync.channel = network.game;
    network.winner && sync.start()

    ctx.multiplayer = true;
    network.emit('change multiplayer',true)
    network.checkReady()
  })

  network.on('state',function(pathname){
    if( network.connected ){
      this.remote.signal.send({type:'state',pathname:pathname})
    }
  })

  // this.remote.on('state',function(e){
  //   console.log('STATE %s -> %s',network.pathname,e.pathname)
  // })
  // this.remote.on('addstream',function(e){
  //   console.log('ADD REMOTE STREAM',e.stream.id)
  // })
  // this.remote.on('removestream',function(e){
  //   console.log('REMOVE REMOTE STREAM',e.stream.id)
  // })
  // this.remote.on('timeout',function(){
  //   console.log('CONNECTION TIMED OUT')
  // })
  // this.remote.on('open',function(){
  //   console.log('OPENED')
  // })
  // this.remote.on('close',function(){
  //   console.log('CLOSED')
  // })
  // this.remote.on('full',function(){
  //   console.log('FULL')
  // })
  // this.remote.on('connected',function(){
  //   console.log('\nCONNECTED %s',this.initiator === true ? '(initiator)' : this.initiator === false ? '(not initiator)' : '(error: not challenged)')
  // })
  // this.remote.on('disconnected',function(){
  //   console.log('DISCONNECTED\n')
  // })
  // this.remote.on('channel open',function(e){
  //   console.log('CHANNEL OPENED')
  // })
  // this.remote.on('channel close',function(e){
  //   console.log('CHANNEL CLOSED')
  // })
  // this.remote.on('error',function(e){
  //   console.error('ERROR',e.message)
  // })
  // this.remote.on('reconnect',function(){
  //   console.log('RECONNECTED')
  // })
  // this.remote.on('negotiationneeded',function(){
  //   console.log('NEGOTIATIONNEEDED',this.connection.signalingState)
  // })
}

Network.prototype.checkReady = function(){
  if(this.ready){
    this.readyState = 'ready';
    return true;
  }
  if(!this.connected){
    this.readyState = 'not connected';
    return false;
  }
  if(!this.remote.channels.game){
    this.readyState = 'no game data channel';
    return false;
  }
  if(!this.context.multiplayer){
    this.readyState = 'not multiplayer';
    return false;
  }
  if(!this.context.latency){
    this.readyState = 'no latency results';
    return false;
  }
  if(this.pathname === null){
    this.readyState = 'no remote pathname';
    return false;
  }
  if(this.remote.connection.getLocalStreams().length === 0){
    this.readyState = 'no local video';
    return false;
  }
  if(this.remote.connection.getRemoteStreams().length === 0){
    this.readyState = 'no remote video';
    return false;
  }
  if(!validVideo(document.getElementById('remoteInput'))){
    this.readyState = 'invalid remote video';
    this.invalidTimeout = setTimeout(this.checkReady.bind(this),100);
    return false;
  }
  clearTimeout(this.invalidTimeout)
  this.ready = true;
  this.readyState = 'ready';
  this.emit('ready')
}


Network.prototype.close = function(){
  debug('close')
  if( this.game ){
    this.game.onmessage = null;
    this.game = null;
  }
  this.connected = false;
  this.context.multiplayer = false;
  this.context.latency = null;
  this.ready = false;
  this.pathname = null;
  this.winner = false;
  this.sync.stop()
  this.sync.channel = null;
  this.emit('change connected',false)
  this.emit('change multiplayer',false)
  this.emit('change latency',null)
  this.checkReady()
}

Network.prototype.send = function(msg){
  debug('send',ab2s(msg))
  if( this.game && this.ready ){
    this.game.send(msg);
  } else {
    console.warn('sending a message too early (game channel not open)')
  }
}

var NETCHAN_PREFIX = 'ı';

function netchan(channel,network,skipBase64){
  // since data channels don't support binary yet
  // we encode the sent message as base64
  if( !skipBase64 ){
    var _recv = NetChannel.prototype.recv;
    NetChannel.prototype.recv = function(e){
    // var _recv = channel.onmessage;
    // channel.onmessage = function(e){
      // MessageEvent#data is not writable
      // so we create a new one
      if( typeof e.data == 'string' && e.data.indexOf(NETCHAN_PREFIX) === 0 ){
        var m = new MessageEvent('message',{
          data: base64.decode(e.data.slice(NETCHAN_PREFIX.length)),
          origin: e.origin,
          lastEventId: e.lastEventId,
          source: e.source,
          ports: e.ports
        })
        // console.log('netchan recv',new Uint8Array(m.data))
        return _recv.call(this,m);
      } else if( typeof e.data != 'string' ){
        return _recv.call(this,e);

      } else {
        // console.log('netchan recv (skipping, not encoded)')
      }
    }
    // RTCDataChannel is not a public constructor
    // so we take the one from the instance.
    // var DataChannel = channel.constructor;
    // var _send = DataChannel.prototype.send;
    // DataChannel.prototype.send = function(msg){
    var _send = channel.send;
    var supportsBinary = null;
    channel.send = function(msg){
      if( typeof msg != 'string' ){
        // try it as binary first (and once)
        // if( supportsBinary || supportsBinary === null ){
        //   try {
        //     var r = _send.call(this,msg);
        //     supportsBinary = true;
        //     return r;
        //   } catch(e){
        //     console.warn('attempt to send message as binary failed',e)
        //     supportsBinary = false;
        //   }
        // }
        // console.log('netchan send',new Uint8Array(msg))
        msg = NETCHAN_PREFIX+base64.encode(msg);
      }
      if( msg.length > 1168 ){
        var err = new Error('message too long: '+msg.length);
        err.code = 1168;
        network.emit('error',err)
        return;
      }
      if( channel.readyState == 'open' ){
        // note: wrapped in a try/catch because canary
        // all of a sudden decided to start throwing random
        // SyntaxError Error: An invalid or illegal string was specified.
        try {
          return _send.call(this,msg);
        } catch(e){
          if( !channel.alreadyErrored ){
            console.warn('error while sending message "%s" on open channel',msg,e)
            channel.alreadyErrored = true;
          }
        }
      } else {
        console.warn('tried to send message (%s) on closed channel "%s"',msg,channel.label)
      }
    }
  }
  // return channel;
  return new NetChannel(channel,{ack: true})
}



var join = [].join;
function ab2s(buf){
  return join.call(new Uint8Array(buf));
}
});
require.register("slam/lib/extra-icons.js", function(exports, require, module){
// actions.emit('extras changed',world)


// fog:
//    multiple: false
//    show: when icon is in arena
//          (if there is a new extra w. data.id == fog in world.extras)
//    active: when icon has been hit
//          (while world.timeouts.fog exists)
//    remove: when fog has timed out or icon has been removed from arena or round is over
//          (when no extra w data.id == fog or world.timeouts.fog does not exist anymore)
//
// deathball:
//    multiple: false
//    show: when icon is in arena
//          (if there is a new extra w. data.id == deathball in world.extras)
//    active: when icon is in arena
//          (same as show)
//    remove: when icon has been removed from arena or round is over
//          (when no extra w data.id == deathball exist anymore)
//
// ghostball:
//    multiple: true (while multiball)
//    show: when icon is in arena
//          (if there is a new extra w. data.id == ghostball in world.extras)
//    active: when icon has been hit
//          (while theres a puck with data.ghostballTimeout)
//    remove: when ghost has timed out or icon has been removed from arena or round is over
//          (when no puck w data.ghostballTimeout or extra w. data.id == ghostball exist anymore)
//
// paddleresize:
//    multiple: true
//    show: when icon is in arena
//          (if there is a new extra w. data.id == paddleresize in world.extras)
//    active: when icon has been hit
//          (if there is a new extra w. data.id == paddleresize in world.extras)
//    remove: when paddleresize has timed out or icon has been removed from arena or round is over
//
// multiball:
//    multiple: true
//    show: when icon is in arena
//    active: when icon has been hit
//    remove: when icon has been removed from arena or round is over
//
// extralife:
//    multiple: false
//    show: when icon is in arena
//    active: never
//    remove: when icon has been hit or round is over
//
// timebomb:
//    multiple: true
//    show: when icon is in arena
//    active: when icon has been hit
//    remove: when timebomb explodes or icon has been removed from arena or round is over
//
// fireball:
//    multiple: true
//    show: when icon is in arena
//    active: never
//    remove: when icon has been hit or round is over
//
//  laser:
//    multiple: false
//    show: when icon is in arena
//    active: when icon has been hit
//    remove: when laser is over or round is over
//
//  mirroredcontrols:
//    multiple: false
//    show: when icon is in arena
//    active: when icon has been hit
//    remove: when round is over or another mirroredcontrols icon has been hit
//
//  bulletproof:
//    multiple: false
//    show: when icon is in arena
//    active: when icon has been hit
//    remove: when bulletproof has timed out or round is over
//
//

var debug = require('debug')('extra-icons')
  , $ = require('jquery');

var container = $('#extras ul');
//create this hidden container so list items can be translated
var hidden = $('<ul></ul>').hide().appendTo('body');
var clonables = container.children().appendTo(hidden);
var available = [];
var inUse = null;

exports.use = function(world){
  inUse = world;
}

exports.clear = function(){
  container.empty();
  available.length = 0;
}

exports.create = function(world,extra){
  if( world !== inUse ) { return }
  var id = extra.data.id;
  debug('create',id)
  var element = clonables.filter('.'+id).clone();
  setTimeout(function(element){
    element.addClass('visible')
  }.bind(null,element), 400)
  available.push({
    index: extra.index,
    id: id,
    element: element
  });
  container.append(element)
  redistribute()
}

exports.activate = function(world,extra){
  if( world !== inUse ) return
  debug('activate',extra)
  var element = find(extra);
  if( element ){
    element.addClass('active')
  } else {
    console.warn('missing icon for extra',extra)
  }
}

exports.remove = function(world,extra){
  if( world !== inUse ) return
  debug('remove',extra)
  var element = find(extra);
  if( element ){
    element.removeClass('active visible')
    setTimeout(function(element){
      element.remove()
    }.bind(null,element), 400)
    remove(element)
    redistribute()
  } else {
    console.warn('missing icon for extra',extra)
  }
}

function find(k){
  k = k.index || k;
  for(var i=0; i<available.length; i++){
    var a = available[i];
    if( a.index === k ){
      return a.element;
    }
    if( a.id === k ){
      return a.element;
    }
  }
  return null;
}

function remove(element){
  for(var i=0; i<available.length; i++){
    var a = available[i];
    if( a.element === element ){
      available.splice(i,1);
      return true
    }
  }
  return false;
}

function redistribute(){
  var top = 0;
  var h = 50; // TODO hard coding!
  for(var i=0; i<available.length; i++){
    var a = available[i];
    a.element.css('top',top);
    top += h;
  }
}
});
require.register("slam/lib/world.js", function(exports, require, module){
var debug = require('debug')('world')
  , stash = require('stash')
  , copy = require('copy')
  , Body = require('./sim/body')
  , BodyFlags = require('./sim/body-flags')
  , Random = require('./support/rand')
  , hashCode = require('./support/hash-code')
  , exclude = require('./support/exclude')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec;

module.exports = World;

// states
World.INIT = 'init';         // no level, no controls, no physics, no network
World.PREVIEW = 'preview';   // level inactive, controls, physics, no network
World.STARTING = 'starting'; // level inactive, no controls, no physics, no network
World.PLAYING = 'playing';   // level active, controls, physics, network
World.PAUSED = 'paused';     // level inactive, no controls, no physics, no network
World.NEXT_ROUND = 'next round'; // level inactive, no controls, no physics, no network
World.NEXT_LEVEL = 'next level'; // level inactive, no controls, no physics, no network, score reset
World.GAME_OVER = 'game over';   // level inactive, no controls, no physics, no network, score reset

// temporary properties to be
// excluded in hash code and diff
World.EXCLUDED = ['me','opponent','name','hashCode'];

function World(name,tick){
  debug('%s create',name)
  this.frame = 0;
  this.index = 0;
  this.name = name;
  this.tick = tick;

  // keep a seeded random for the world!
  // (don't use World#rand, use World#random() instead)
  this.rand = new Random(seed());

  this.bodies = stash();   // all bodies will be collided in physics
  this.pucks = stash();
  this.extras = stash();
  this.forces = stash();
  this.bullets = stash();
  this.paddles = stash();
  this.shields = stash();
  this.obstacles = stash();

  this.lastHitPucks = {}; // used to look up which paddle a puck hit last
  this.puckBounces = {};  // used to look up how many bounces a puck has
  this.timeouts = {};
  this.state = World.INIT;

  this.level = null;        // states/game.js setupLevels()
  this.me = null;           // states/game.js createGame()
  this.opponent = null;     // states/game.js createGame()
  this.multiplayer = false; // states/game.js Setup.enter()

  this.players = {
    a: new Player('HAL (A)'),
    b: new Player('EVE (B)')
  }
}

World.prototype.code = function(){
  debug('hash code',World.EXCLUDED)
  var hash;
  exclude(this,World.EXCLUDED,function(world){
    hash = hashCode(world)
  })
  return hash;
}

World.prototype.setState = function(state){
  debug('%s set state',this.name,state)
  switch(state){
    case World.INIT:
    case World.PREVIEW:
    case World.STARTING:
    case World.PLAYING:
    case World.PAUSED:
    case World.NEXT_ROUND:
    case World.NEXT_LEVEL:
    case World.GAME_OVER:
      this.state = state;
      break;
    default:
      throw new Error('invalid world state: '+state)
  }
}

World.prototype.random = function(){
  return this.rand.random()
}

World.prototype.createBody = function(shape,x,y,flags){
  debug('%s create body',this.name,this.index);
  var body = Body.alloc();
  body.index = this.index++;
  body.shape = shape;
  body.current[0] = body.previous[0] = x;
  body.current[1] = body.previous[1] = y;
  BodyFlags.set(body,flags);
  this.bodies.set(body.index,body);
  move(body.shape,body.current);
  body.aabb = poly.aabb(shape,body.aabb);
  body.radius = poly.radius(shape)
  return body;
}

/**
 * Marks the body for removal in the collision
 * loop and in the renderer.
 *
 * @param {Body} body
 */
World.prototype.releaseBody = function(body){
  debug('%s release body',this.name,body.index)
  body.removed = true
  return body;
}

/**
 * Frees and removes the body from the
 * physics.
 *
 * Should only be called outside of `oncollision()`
 * since it will be removed from the bodies array
 * and the collision loop may go bananas.
 *
 * If a body is removed _inside_ the collision
 * loop use `releaseBody()`. It will be destroyed
 * then after the loop.
 *
 * @param {Body} body
 */
World.prototype.destroyBody = function(body){
  debug('%s destroy body',this.name,body.index)
  if( !body.removed ){
    this.releaseBody(body)
  }
  this.bodies.del(body.index)
  Body.free(body)
}

World.prototype.copy = function(from){
  debug('%s copy',this.name,from.name)

  if( !(from instanceof World) ){
    throw new Error('World instance expected');
  }

  // must set index first for createBody to create the correct body...
  this.frame = from.frame;
  this.index = from.index;

  // copy (and remove) timeouts
  copy(from.tick,this.tick,true);

  copyBodies(this,from.bodies,this.bodies)
  copyBodies(this,from.pucks,this.pucks)
  copyBodies(this,from.extras,this.extras)
  copyBodies(this,from.obstacles,this.obstacles)
  copyBodies(this,from.bullets,this.bullets)
  copyBodies(this,from.paddles,this.paddles)
  copyBodies(this,from.shields,this.shields)

  this.forces.copy(from.forces)

  // copy the random state
  this.rand.state = from.rand.state;

  this.lastHitPucks = copy(from.lastHitPucks,this.lastHitPucks,true)
  this.puckBounces = copy(from.puckBounces,this.puckBounces,true)
  this.timeouts = copy(from.timeouts,this.timeouts,true)

  this.level = copy(from.level,this.level,true);
  this.state = from.state;
  this.multiplayer = from.multiplayer;

  this.players.a.copy(from.players.a)
  this.players.b.copy(from.players.b)
}

World.prototype.reset = function(){
  debug('%s reset',this.name)
  this.frame = 0;
  this.index = 0;

  this.tick.reset();

  this.rand = new Random(seed(this.level && this.level.index));

  for(var i=this.bodies.length-1; i >= 0; i--){
    this.destroyBody(this.bodies.values[i]);
  }

  this.obstacles.empty();
  this.pucks.empty();
  this.forces.empty();
  this.bullets.empty();
  this.paddles.empty();
  this.shields.empty();
  this.extras.empty();

  // TODO would it be better to loop/delete?
  this.lastHitPucks = {}
  this.puckBounces = {}
  this.timeouts = {};

  var resetScores = this.state === World.GAME_OVER
                 || this.state === World.NEXT_LEVEL;

  this.players.a.reset(resetScores);
  this.players.b.reset(resetScores);

  return this;
}

// default player object
function Player(name){
  this.name = name
  this.shields = []   // shields down (should be set to [1,1,1] on round start and if first one is hit it will turn into [0,1,1] etc)
  this.score = 0      // rounds won
  this.paddle = -1    // set in Simulator#create, an index to a paddle
  this.wins = 0
  this.hit = -1;      // was this player hit?
}
Player.prototype.copy = function(from){
  this.name = from.name;
  this.score = from.score;
  this.paddle = from.paddle;
  this.wins = from.wins;
  this.hit = from.hit;
  copy(from.shields,this.shields)
}
Player.prototype.reset = function(resetScores, resetWins){
  this.shields.length = 0;
  if( resetScores ){
      this.score = 0;
  }
  if( resetWins ){
    this.wins = 0;
  }
  this.hit = -1;
  this.paddle = -1;
  return this;
}

// extend Stash with a copy method
stash.Stash.prototype.copy = function(from){
  copy(from.values,this.values,true)
  copy(from.lookup,this.lookup,true)
  copy(from.reverse,this.reverse,true)
  this.length = from.length;
}

// extend Stash with a custom hashCode method
stash.Stash.prototype.hashCode = function(){
  // create an object from the values
  var obj = {}; // TODO reuse object?
  for(var k in this.lookup){
    obj[k] = this.values[this.lookup[k]];
  }
  return hashCode(obj)
}

// copyBodies(this,from.bodies,this.bodies)
function copyBodies(world,from,to){

  // var keysFrom = Object.keys(from.lookup).sort().join(',')
  // var keysTo = Object.keys(to.lookup).sort().join(',')

  // if( keysFrom !== keysTo ){
  //   console.log('the bodies has changed')
  //   console.log('  from:',keysFrom)
  //   console.log('  to:',keysTo)
  // }

  for(var i=0; i<from.length; i++){
    var a = from.values[i]
      , b;

    if( !a ){
      throw new Error('invalid stash!')
    }

    // check existance
    if( !to.has(a.index) ){
      // the body has been removed
      // since sync. re-add it.


      // it might have been added to
      // bodies already, in which case
      // use that one
      if( world.bodies.has(a.index) ){
        b = world.bodies.get(a.index);
        to.set(b.index,b);

      // if not we need to recreate it
      } else {
        // make a clone of a (properties will be copied below)
        b = Body.alloc()
        b.index = a.index
        to.set(b.index,b);
      }

      // verify it got that index
      if( b.index !== a.index ){
        throw new Error('wrong index')
      }

    // it's there!
    } else {
      b = to.get(a.index);

    }

    if( !to.has(a.index) ){
      throw new Error('body was never created')
    }

    var pa = a.data.id;
    var pb = b.data.id;

    // copy properties
    copy(a,b,true);


    if( a.data.id !== b.data.id ){
      console.error('data.id did not get copied before: %s,%s after: %s,%s',pa,pb,a.data.id,b.data.id)
    }
  }

  // slow way of finding the difference and destroy it
  // at this point there should always be more `from` than `to`
  // because `to` is ahead of `from` and may have removed a body
  // that `from` hasn't.
  if( from.length !== to.length ){
    var del = [];
    for(var i=0; i<to.length; i++){
      var b = to.values[i];
      if( !from.has(b.index) && !~del.indexOf(b.index) ){
        del.push(b.index);
      }
    }
    // actually delete outside of loop
    while(del.length){
        // console.log('deleting %s from `to` index',b.index)
      to.del(del.pop());
    }
  }

  if( from.length !== to.length ){
    throw new Error('bodies does not match!')
  }
}

function move(shape,to){
  var c = poly.centroid(shape)
  var d = vec.sub(to,c)
  poly.translate(shape, d[0] ,d[1]);
  vec.free(c)
  vec.free(d)
}

// [t,r,b,l]
function center(aabb){
  return vec.make(aabb[3]+(aabb[1]-aabb[3])/2,aabb[0]+(aabb[2]-aabb[0])/2)
}


// generate seed from pathname
function seed(extra){
  return location.pathname.split('')
    .map(function(c){return c.charCodeAt(0)})
    .reduce(function(s,c){return s+c},extra||0)*location.pathname.length;
}

});
require.register("slam/lib/arb.js", function(exports, require, module){
/*
 * Copyright 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Application Resource Bundle (ARB) supporting library.
 * This library provides a set of API to access resource stored in ARB and
 * methods to localize the HTML DOM tree using those resources.
 * @author shanjian@google.com (Shanjian Li)
 */


/**
 * Creates arb namespace.
 */
var arb = {};


/**
 * This is the global resource selector that can be used to switch locale,
 * scheme, etc. globally. Empty string is a valid value that means no global
 * selector.
 * @type {string}
 * @private
 */
arb.resourceSelector_ = '';


/**
 * Sets resource selector. This will affect all future resource selection.
 *
 * @param {string} selector resource selection string joined by ':'.
 */
arb.setResourceSelector = function(selector) {
  arb.resourceSelector_ = selector;
};


/**
 * DOM text node type.
 */
arb.TEXT_NODE_TYPE = 3;


/**
 * Cross-browser function for setting the text content of an element.
 * Code is borrowed from Closure.
 *
 * @param {Element} element The element to change the text content of.
 * @param {string} text The string that should replace the current element
 *     content.
 * @private
 */
arb.setTextContent_ = function(element, text) {
  if ('textContent' in element) {
    element.textContent = text;
  } else if (element.firstChild &&
             element.firstChild.nodeType == arb.TEXT_NODE_TYPE) {
    // If the first child is a text node we just change its data and remove the
    // rest of the children.
    while (element.lastChild != element.firstChild) {
      element.removeChild(element.lastChild);
    }
    element.firstChild.data = text;
  } else {
    var child;
    while ((child = element.firstChild)) {
      node.removeChild(child);
    }
    element.appendChild(element.ownerDocument.createTextNode(text));
  }
};


/**
 * Performs message substitution in DOM tree.
 */
arb.localizeHtml = function() {
  var resource = arb.getResource();
  arb.localizeSubtree(document, resource);
};


/**
 * Localizes a DOM subtree start from given elem.
 *
 * @param {Document | Element} elem the root of the subtree to be visited.
 * @param {Object.<string, string|Object>} resource ARB resource object.
 */
arb.localizeSubtree = function(elem, resource) {
  if (elem) {
    var origResource = resource;
    // If namespace is specified in the element, use it in its scope.
    if (elem.getAttribute && elem.getAttribute('arb:namespace')) {
      resource = arb.getResource(elem.getAttribute('arb:namespace')) ||
          resource;
    }

    // If no resource specified, don't do anything. There is nothing wrong
    // about it. A page can choose to skip localization this way.
    if (resource) {
      arb.localizeNode(elem, resource);
      for (var i = 0; i < elem.childNodes.length; i++) {
        var child = elem.childNodes[i];
        arb.localizeSubtree(child, resource);
      }
    }
    resource = origResource;
  }
};


/**
 * Localizes a DOM element. Different type of element has different type of
 * attribute to be localized, not necessarily text content.
 *
 * @param {Document | Element} elem the DOM element to be localized.
 * @param {Object.<string, string|Object>} resource resource bundle.
 */
arb.localizeNode = function(elem, resource) {
  var resId = elem.getAttribute && elem.getAttribute('arb:id') || elem.id;

  if (!resId) {
    return;
  }

  switch(elem.nodeName) {
    case 'IMG':
      arb.localizeElement_(elem, resId, resource, ['src', 'alt']);
      break;
    case 'INPUT':
      arb.localizeElement_(elem, resId, resource,
                           ['value', 'placeholder', 'defaultValue']);
      break;
    case 'AREA':
      arb.localizeElement_(elem, resId, resource, ['alt']);
      break;
    case 'OBJECT':
      arb.localizeElement_(elem, resId, resource, ['standby']);
      break;
    case 'OPTION':
      arb.localizeElement_(elem, resId, resource, ['value', 'label']);
      break;
    case 'OPTGROUP':
      arb.localizeElement_(elem, resId, resource, ['label']);
      break;
    case 'STYLE':
      if (resId in resource) {
        if (elem.styleSheet) {
          elem.styleSheet.cssText = resource[resId];
        } else {
          arb.setTextContent_(elem, resource[resId]);
        }
      }
      break;
    default:
      (resId in resource) && arb.setTextContent_(elem, resource[resId]);
  }
};


/**
 * Injects localized resource into element's attribute.
 *
 * @param {Element} elem the DOM element that need to have resource injected.
 * @param {string} resId ARB resource id.
 * @param {Object.<string, string|Object>} resource  ARB resource bundle.
 * @param {Array.<string>} attrs possible attributes in this element that may
 *     take localization resource.
 * @private
 */
arb.localizeElement_ = function(elem, resId, resource, attrs) {
  for (var i = 0; i < attrs.length; i++) {
    var fieldId = resId + '@' + attrs[i];
    (fieldId in resource) && (elem[attrs[i]] = resource[fieldId]);
  }
};


/**
 * Replaces placeholder in string with given values. For the time being
 * {} is used to mark placeholder. Placeholder will only be replaced if
 * a named argument or positional argument is available.
 *
 * @param {string} str message string possibly with placeholders.
 * @param {string} opt_values if it is a map, its key/value will be
 *     interpreted as named argument. Otherwise, it should be interpreted as
 *     positional argument.
 * @return {string} string with placeholder(s) replaced.
 */
arb.msg = function(str, opt_values) {
  // Plural support is an optional feature. When it is desired, developer
  // should include arbplural.js, where arb.processPluralRules_ is defined.
  if (arb.processPluralRules_) {
    str = arb.processPluralRules_(str, opt_values);
  }
  var type = typeof opt_values;
  if (type == 'object' || type == 'function') {
    for (var key in opt_values) {
      var value = ('' + opt_values[key]).replace(/\$/g, '$$$$');
      str = str.replace(new RegExp('\\{' + key + '\\}', 'gi'), value);
    }
  } else {
     for (var i = 1; i < arguments.length; i++) {
       str = str.replace(
           new RegExp('\\{' + (i - 1) + '\\}', 'g'), arguments[i]);
     }
  }
  return str;
};


/**
 * Resource name part as it appears in regular expression.
 * @type {number}
 * @private
 */
arb.RESOURCE_NAME_PART_ = 1;


/**
 * Obtains the resouce name from URL. That will allow resource to be selected
 * through use of url parameter.
 *
 * @return {string} arb name as passed in Url.
 */
arb.getParamFromUrl = function(paramName) {
  var regex = new RegExp('[\\\\?&]' + paramName + '=([^&#]*)', 'i');
  var m = regex.exec(window.location.href);
  return m ? m[arb.RESOURCE_NAME_PART_] : null;
};


/**
 * Maps ARB namespace into ARB instance.
 * @type {Object.<string, Object>}
 * @private
 */
arb.resourceMap_ = {};


/**
 * Checks if an object is empty or not.
 *
 * @param  {Object} obj An object to be checked for emptiness.
 * @return {boolean} true if the object has not direct properties.
 * @private
 */
arb.isEmpty = function(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
};


/**
 * Namespace delimiter.
 * @type {string}
 * @private
 */
arb.NAMESPACE_DELIMITER_ = ':';


/**
 * Registers a ARB resource object.
 *
 * @param {string|array.string} namespaces ARB resource object's namespaces.
 *     This parameter can be either a string or an array, the later allows a
 *     resource to be registered under different names.
 * @param {Object.<string, string|Object>} resource ARB resource object.
 */
arb.register = function(namespaces, resource) {
  if (typeof namespaces == 'string') {
    arb.resourceMap_[namespaces] = resource;
  } else {
    for (var i = 0; i < namespaces.length; i++) {
      arb.resourceMap_[namespaces[i]] = resource;
    }
  }
};


/**
 * Calls the callback for all the registerd namespace/locale pairs. This
 * function only iterates through fully qualified namespaces.
 *
 * @param {function(string)} arbCallback
 */
arb.iterateRegistry = function(arbCallback) {
  for (var namespace in arb.resourceMap_) {
    if (arb.resourceMap_.hasOwnProperty(namespace)) {
      arbCallback(namespace);
    }
  }
};


/**
 * Retrieves ARB resource object that best fits selector given. The algorithm
 * of this method tries to satisfy the selector as much as possible, and does
 * it in the specified priority. Selector given to this method takes priority
 * over global resource selector set through "setResourceSelector".
 *
 * @param {?string} opt_selector resource selector used to choose desired ARB
 *        resource object together with global resource selector.
 *
 * @return {Object.<string, string|Object>} The ARB resource object desired.
 *     or empty object if no ARB resource object registered with given
 *     namespace.
 */
arb.getResource = function(opt_selector) {
  var candidates = arb.resourceMap_;
  if (!opt_selector) {
    opt_selector = arb.resourceSelector_;
  } else if (arb.resourceSelector_) {
    opt_selector += arb.NAMESPACE_DELIMITER_ + arb.resourceSelector_;
  }

  // If opt_namespace is not given, default namespace will be used.
  if (opt_selector) {
    // This will only be true if opt_namespace is fully qualified.
    if (opt_selector in arb.resourceMap_) {
        return arb.resourceMap_[opt_selector];
    }

    var parts = opt_selector.split(arb.NAMESPACE_DELIMITER_);
    for (var i = 0; i < parts.length; i++) {
      var newCandidates = {};
      var pattern = new RegExp('(:|^)' + parts[i] + '(:|$)');
      for (var namespace in candidates) {
        if (pattern.test(namespace)) {
          newCandidates[namespace] = candidates[namespace];
        }
      }
      if (!arb.isEmpty(newCandidates)) {
        candidates = newCandidates;
      }
    }
  }

  var minLength = Number.MAX_VALUE;
  var bestNamespace = '';
  for (var namespace in candidates) {
    if (!namespace) { // empty string
      bestNamespace = namespace;
      break;
    }
    var len = namespace.split(arb.NAMESPACE_DELIMITER_).length;
    if (len < minLength) {
      minLength = len;
      bestNamespace = namespace;
    }
  }

  if (arb.resourceMap_.hasOwnProperty(bestNamespace)) {
    return arb.resourceMap_[bestNamespace];
  }
  return {};
};

/**
 * Checks if the given arb instance is in compact form.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @return {boolean} true if it is in compact form.
 */
arb.isCompact = function(resource) {
  for (var prop in resource) {
    if (resource.hasOwnProperty(prop) && prop[0] == '@') {
      return false;
    }
  }
  return true;
};


/**
 * Creates namespace for development mode methods.
 */
arb.dbg = {};


/**
 * Returns type of data as identified by resource id.
 * The type information might not be available for specified resource. Empty
 * string will be returned in such case.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @param {string} resId resource id.
 *
 * @return {string} type string if available, or empty string.
 */
arb.dbg.getType = function(resource, resId) {
  if (resId.charAt(0) == '@') {
    return 'attr';
  }
  var atResId = '@' + resId;
  if (resource.hasOwnProperty(atResId) &&
      resource[atResId].hasOwnProperty('type')) {
    return resource[atResId]['type'];
  }
  return '';
};


/**
 * Checks if the resource identified by resId is in given context. If the
 * resource has no context or if the desired context is the prefix of
 * resource's context, it will return true as well.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @param {string} resId resource id to be checked.
 * @param {string} context context desired.
 *
 * @return {boolean} true if the resource is in given context.
 */
arb.dbg.isInContext = function(resource, resId, context) {
  var contextRegex = new RegExp('^' + context + '($|:.*)');
  var atResId = '@' + resId;
  return resId.charAt(0) != '@' &&
      (!resource.hasOwnProperty(atResId) ||
       !resource[atResId].hasOwnProperty('context') ||
       contextRegex.test(resource[atResId]['context']));
};


/**
 * Returns the value of an attribute for a resource. Empty string will
 * be returned if attribute is not available.
 *
 * @param {Object.<string, string|Object>} resource ARB resource object.
 * @param {string} resId id of the resource to be checked.
 * @param {string} attrName attribute name of interest.
 *
 * @return {string} attribute value desired, or empty string.
 */
arb.dbg.getAttr = function(resource, resId, attrName) {
  var atResId = '@' + resId;
  if (!resource.hasOwnProperty(atResId)) {
    return '';
  }

  var msgAttr = resource[atResId];
  return msgAttr.hasOwnProperty(attrName) ? msgAttr[attrName] : '';
};

/*
 * Copyright 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Application Resource Bundle (ARB) plural support library.
 * This file contains data and methods to provide plural support in ARB
 * message substitution. Plural rules are based on the latest CLDR(1.9)
 * release. It should cover all the languages available in CLDR.
 *
 * @author shanjian@google.com (Shanjian Li)
 */


/**
 * Regular expression to identify plural message.
 * @type {RegExp}
 * @private
 */
arb.PLURAL_RULE_REGEX_ = /^\{\s*(\w+)\s*,\s*plural\s*,(\s*offset:(\d+))?\s*/;


/**
 * The locale used for selecting plural rules.
 * @type {string}
 * @private
 */
arb.pluralLanguage_ = 'en';


/**
 * Sets plural rules locale.
 */
arb.setPluralLanguage = function(language) {
  if (language in arb.pluralRuleMap_) {
    arb.pluralLanguage_ = language;
  } else {
    arb.pluralLanguage_ = '$$';
  }
}


/**
 * Processes plural message.
 * If it is a plural message, a branch selected based on plural rule will be
 * returned for further processing. Otherwise, original message will be
 * returned. In either case, non-plural related placeholder won't be touched.
 *
 * @param {string} str original message string.
 * @param {string} opt_values if it is a map, its key/value will be
 *     interpreted as named argument. Otherwise, it should be interpreted as
 *     positional argument.
 * @return {string} string after plural processing is done.
 * @private
 */
arb.processPluralRules_ = function(str, opt_values) {
  var m = arb.PLURAL_RULE_REGEX_.exec(str);
  if (!m) {
    return str;
  }

  var type = typeof opt_values;
  var arg;
  if (type == 'object' || type == 'function') {
    if (!(m[1] in opt_values)) {
      return str;
    }
    arg = opt_values[m[1]];
  } else {
    var order = parseInt(m[1]);
    if (m[1] != '' + order || order >= arguments.length) {
      return str;
    }
    arg = arguments[order];
  }

  var branches = arb.parseBranches_(str.substring(m[0].length));
  if (!branches) {
    return str;
  }

  if (arg in branches) {
    return branches['' + arg];
  }

  if (typeof arg != 'number') {
    return str;
  }

  var offset = m[3] ? parseInt(m[3]) : 0;

  var rule = arb.getRuleName(arg - offset);

  if (rule in branches) {
    return branches[rule].replace('#', arg - offset);
  }

  if ('other' in branches) {
    return branches['other'].replace('#', arg - offset);
  }

  return str;
};


/**
 * Parses the branches parts of a plural message into a map of selective
 * branches.
 *
 * @param {string} str plural message string to be parsed.
 * @return {?Object.<string, string>} a map of plural key name to plural
 *     select branch or null if parsing failed.
 * @private
 */
arb.parseBranches_ = function(str) {
  var branches = {};
  var regex = /(?:=(\d+)|(\w+))\s+\{/;
  while (true) {
    if (str.charAt(0) == '}') {
      return branches;
    }

    var m = regex.exec(str);
    if (!m) {
      return null;
    }
    var key = m[1] ? m[1] : m[2];
    str = str.substring(m[0].length);
    var openBrackets = 1;
    var i;
    for (i = 0; i < str.length && openBrackets > 0; i++) {
      var ch = str.charAt(i);
      if (ch == '}') {
        openBrackets--;
      } else if (ch == '{') {
        openBrackets++;
      }
    }
    if (openBrackets != 0) {
      return null;
    }

    // grab branch content without ending "}"
    branches[key] = str.substring(0, i - 1);
    str = str.substring(i).replace(/^\s*/, '');
    if (str == '') {
      return null;
    }
  }
};


/**
 * Returns plural rule name based on given number.
 *
 * @param {number} n number for plural selection.
 * @return {string} plural rule name.
 */
arb.getRuleName = function(n) {
  return arb.pluralRules_[arb.pluralRuleMap_[arb.pluralLanguage_]](n);
};


/**
 * Collection of all possible plural rules.
 * This tables is manually created from CLDR 1.9. Size is the biggest concern.
 * @type {Object.<number, function(number):string>}
 * @private
 */
arb.pluralRules_ = {
    // "one": "n is 1"
    0: function(n) {
        return (n == 1) ? 'one' : 'other';
    },

    // "one": "n in 0..1"
    1: function(n) {
        return (n == 0 || n == 1) ? 'one' : 'other';
    },

    // "few": "n mod 100 in 3..10",
    // "zero": "n is 0",
    // "one": "n is 1",
    // "two": "n is 2",
    // "many": "n mod 100 in 11..99"
    2: function(n) {
        return ((n % 100) >= 3 && (n % 100) <= 10 && n == Math.floor(n)) ?
            'few' : (n == 0) ? 'zero' : (n == 1) ? 'one' : (n == 2) ?
            'two' : ((n % 100) >= 11 && (n % 100) <= 99 && n == Math.floor(n)) ?
            'many' : 'other';
    },

    // "few": "n mod 10 in 2..4 and n mod 100 not in 12..14",
    // "one": "n mod 10 is 1 and n mod 100 is not 11",
    // "many": "n mod 10 is 0 or n mod 10 in 5..9 or n mod 100 in 11..14"
    3: function(n) {
        return ((n % 10) >= 2 && (n % 10) <= 4 &&
            ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) ?
            'few' : ((n % 10) == 1 && (n % 100) != 11) ? 'one' :
            ((n % 10) == 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
            ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) ?
            'many' : 'other';
    },

    // "few": "n is 3",
    // "zero": "n is 0",
    // "one": "n is 1",
    // "two": "n is 2",
    // "many": "n is 6"
    4: function(n) {
        return (n == 3) ? 'few' : (n == 0) ? 'zero' : (n == 1) ? 'one' :
            (n == 2) ? 'two' : (n == 6) ? 'many' : 'other';
    },

    // "one": "n within 0..2 and n is not 2"
    5: function(n) {
        return (n >= 0 && n < 2) ? 'one' : 'other';
    },

    // "two": "n is 2",
    // "one": "n is 1"
    6: function(n) {
        return (n == 2) ? 'two' : (n == 1) ? 'one' : 'other';
    },

    // "few": "n in 2..4",
    // "one": "n is 1"
    7: function(n) {
        return (n == 2 || n == 3 || n == 4) ? 'few' :
            (n == 1) ? 'one' : 'other';
    },

    // "zero": "n is 0",
    // "one": "n within 0..2 and n is not 0 and n is not 2"
    8: function(n) {
        return (n == 0) ? 'zero' : (n > 0 && n < 2) ? 'one' : 'other';
    },

    // "few": "n mod 10 in 2..9 and n mod 100 not in 11..19",
    // "one": "n mod 10 is 1 and n mod 100 not in 11..19"
    9: function(n) {
        return ((n % 10) >= 2 && (n % 10) <= 9 &&
               ((n % 100) < 11 || (n % 100) > 19) && n == Math.floor(n)) ?
               'few' :
               ((n % 10) == 1 && ((n % 100) < 11 || (n % 100) > 19)) ? 'one' :
               'other';
    },

    // "zero": "n is 0",
    // "one": "n mod 10 is 1 and n mod 100 is not 11"
    10: function(n) {
        return (n == 0) ? 'zero' : ((n % 10) == 1 && (n % 100) != 11) ?
            'one' : 'other';
    },

    // "one": "n mod 10 is 1 and n is not 11"
    11: function(n) {
        return ((n % 10) == 1 && n != 11) ? 'one' : 'other';
    },

    // "few": "n is 0 OR n is not 1 AND n mod 100 in 1..19",
    // "one": "n is 1"
    12: function(n) {
        return (n == 1) ? 'one' :
            (n == 0 ||
             (n % 100) >= 11 && (n % 100) <= 19 && n == Math.floor(n)) ?
            'few' : 'other';
    },

    // "few": "n is 0 or n mod 100 in 2..10",
    // "one": "n is 1",
    // "many": "n mod 100 in 11..19"
    13: function(n) {
        return (n == 0 || (n % 100) >= 2 && (n % 100) <= 10 &&
                n == Math.floor(n)) ? 'few' : (n == 1) ? 'one' :
            ((n % 100) >= 11 && (n % 100) <= 19 && n == Math.floor(n)) ?
            'many' : 'other';

    },

    // "few": "n mod 10 in 2..4 and n mod 100 not in 12..14",
    // "one": "n is 1",
    // "many": "n is not 1 and n mod 10 in 0..1 or
    //          n mod 10 in 5..9 or n mod 100 in 12..14"
    14: function(n) {
        return ((n % 10) >= 2 && (n % 10) <= 4 &&
            ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) ?
            'few' : (n == 1) ? 'one' :
            ((n % 10) == 0 || (n % 10) == 1 ||
             (((n % 10) >= 5 && (n % 10) <= 9) ||
            ((n % 100) >= 12 && (n % 100) <= 14)) && n == Math.floor(n)) ?
            'many' : 'other';
    },

    // "few": "n in 2..10",
    // "one": "n within 0..1"
    15: function(n) {
        return (n >= 2 && n <= 10 && n == Math.floor(n)) ? 'few' :
            (n >= 0 && n <= 1) ? 'one' : 'other';
    },

    // "few": "n mod 100 in 3..4",
    // "two": "n mod 100 is 2",
    // "one": "n mod 100 is 1"
    16: function(n) {
        var m = n % 100;
        return (m == 3 || m == 4) ? 'few' : (m == 2) ? 'two' :
               (m == 1) ? 'one' : 'other';
    },

    // No plural form
    17: function(n) {
        return 'other';
    }
};


/**
 * Mapping of locale to plural rule type.
 * @type {Object}
 * @private
 */
arb.pluralRuleMap_ = {
    'af': 0, 'ak': 1, 'am': 1, 'ar': 2,
    'be': 3, 'bem': 0, 'bg': 0, 'bh': 1, 'bn': 0, 'br': 4, 'brx': 0, 'bs': 3,
    'ca': 0, 'chr': 0, 'ckb': 0, 'cs': 7, 'cy': 4, 'da': 0, 'dz': 0,
    'el': 0, 'en': 0, 'eo': 0, 'es': 0, 'et': 0, 'eu': 0,
    'ff': 5, 'fi': 0, 'fil': 1, 'fo': 0, 'fr': 5, 'fur': 0, 'fy': 0,
    'ga': 6, 'gl': 0, 'gsw': 0, 'gu': 0, 'guw': 1,
    'ha': 0, 'he': 0, 'hi': 1, 'hr': 3,
    'is': 0, 'it': 0, 'iw': 0, 'kab': 5, 'ku': 0,
    'lag': 8, 'lb': 0, 'ln': 1, 'lt': 9, 'lv': 10,
    'mg': 1, 'mk': 11, 'ml': 0, 'mn': 0, 'mo': 12, 'mr': 0, 'mt': 13,
    'nah': 0, 'nb': 0, 'ne': 0, 'nl': 0, 'nn': 0, 'no': 0, 'nso': 1,
    'om': 0, 'or': 0,
    'pa': 0, 'pap': 0, 'pl': 14, 'ps': 0, 'pt': 0,
    'rm': 0, 'ro': 12, 'ru': 3,
    'se': 6, 'sh': 3, 'shi': 15, 'sk': 7, 'sl': 16, 'sma': 6, 'smi': 6,
    'smj': 6, 'smn': 6, 'sms': 6, 'so': 0, 'sg': 0, 'sr': 3, 'sv': 0, 'sw': 0,
    'ta': 0, 'te': 0, 'ti': 1, 'tk': 0, 'tl': 1,
    'uk': 3, 'ur': 0, 'wa': 1, 'zu': 0,
    '$$': 17   // Special item for language without plural rules.
};


/**
 * Make this exportable.
 */

module.exports = arb;


});
require.register("slam/lib/localization.js", function(exports, require, module){
var debug = require('debug')('localization')
  , arb = require('./arb.js')
  , Emitter = require('emitter')
  , Preloader = require('preloader')
  , $ = require('jquery');

// Override arb.setTextContent_ because we want
// to be able to write html.
var setTextContent = arb['setTextContent_'];
arb['setTextContent_'] = function(el,txt){
  if( $(el).is('meta') ){
    $(el).attr('content',txt)
  } else {
    $(el).html(txt);
  }
}

// Make arb global so that eval() can find it
window.arb = arb;

module.exports = new Localization('en-US');

function Localization(defaultLanguage){
  this.defaultLanguage = defaultLanguage;
  this.currentLanguage = defaultLanguage;
  this.availableLanguages = [];
  this.availablePriorities = [];
  this.acceptedLanguages = [];
  this.sortedAvailable = [];
}

Localization.prototype.parse = function(header){
  debug('parse',header)
  this.acceptedLanguages = parseParams(header);

  // Always keep the default language as last option
  // (unless it already exists).
  for(var i=0; i<this.acceptedLanguages.length; i++){
    var acc = this.acceptedLanguages[i];
    if( acc.value == this.defaultLanguage ){
      return this;
    }
  }

  // it didn't exist, add it with lowest index
  this.acceptedLanguages.push(acceptParams(this.defaultLanguage,this.acceptedLanguages.length))

  return this;
}

Localization.prototype.setLanguage = function(code){
  debug('set language',code)
  if( code != this.currentLanguage ){
    if( ~this.availableLanguages.indexOf(code) ){
      arb.setResourceSelector('cubeslam:'+code);
      arb.localizeHtml();
      this.currentLanguage = code;
    } else {
      console.warn('Language "%s" is not available.',code)
    }
  }
  return this;
}

Localization.prototype.sortLanguages = function(){
  this.sortedAvailable = [];
  for(var i=0; i<this.acceptedLanguages.length; i++){
    var acc = this.acceptedLanguages[i];
    var isAvailable = ~this.availableLanguages.indexOf(acc.value);
    if( isAvailable ){
      this.sortedAvailable.push(acc.value);
    }
  }
  if( !~this.sortedAvailable.indexOf(this.defaultLanguage) ){
    this.sortedAvailable.push(this.defaultLanguage);
  }
  debug('accepted languages',this.acceptedLanguages)
  debug('available languages',this.availableLanguages)
  debug('sort languages',this.sortedAvailable)
  return this;
}

Localization.prototype.nextLanguage = function(noSet){
  // find the index of the current language
  var curr = this.sortedAvailable.indexOf(this.currentLanguage);
  var next = this.sortedAvailable[(curr+1)%this.sortedAvailable.length];
  return noSet ? next : this.setLanguage(next);
}

Localization.prototype.register = function(code,prio){
  debug('register',code,prio)

  var shortCode = code.split('-')[0];

  for( var i=0; i<this.availableLanguages.length; i++ ){
    var l = this.availableLanguages[i];
    var p = this.availablePriorities[i];
    if( l.indexOf(shortCode) === 0 ){
      if( p < prio ){
        debug('replacing "%s" with "%s"',shortCode,code)
        this.availableLanguages.splice(i,1,code);
        this.availablePriorities.splice(i,1,prio);
      } else {
        debug('skipping "%s" because of "%s"',code,l)
      }
      return;
    }
  }

  // or we simply add this as a new language
  this.availableLanguages.push(code);
  this.availablePriorities.push(prio);
  return this;
}

Localization.prototype.load = function(fn){
  var self = this;

  // Clear available languages
  this.availableLanguages = [];
  this.availablePriorities = [];

  // Load each accepted language in parallel.
  var batch = new Preloader();
  for(var i=0; i<this.acceptedLanguages.length; i++){
    var code = this.acceptedLanguages[i].value;
    var prio = this.acceptedLanguages.length-i;
    batch.push(load(code,prio));
  }
  batch.end(function(){

    // just two languages is enough apparently
    var len = self.availableLanguages.length;
    if( len > 2 ){
      // sort first and extract the first/last(default)
      // language
      self.sortLanguages();
      self.sortedAvailable.splice(1,len-2);

      // remove the rest
      for(var i=len; i>=0; i--){
        if( !~self.sortedAvailable.indexOf(self.availableLanguages[i]) ){
          self.availableLanguages.splice(i,1);
          self.availablePriorities.splice(i,1);
        }
      }
    }

    // pre-render a sorted list of the available
    // languages
    self.sortLanguages()

    // set the first available language
    var lang = self.sortedAvailable[0] || self.defaultLanguage;
    self.setLanguage(lang);
    fn && fn();
  });

  function load(code,prio){
    debug('to load',code)
    var path = '/lang/'+code+'.arb';
    return function(next){
      debug('loading',path)
      $.ajax({url:path, cache:true, dataType:'script'})
        .done(function(){
          self.register(code,prio);
          next();
        })
        .fail(function(){
          // console.warn('failed to load "%s"',path,arguments);
          // ignoring errors because it will just not "register"
          next();
        })
    }
  }
  return this;
}

function parseParams(str){
  return str
    .split(/ *, */)
    .map(acceptParams)
    .filter(function(obj){
      return obj.quality;
    })
    .sort(function(a, b){
      if (a.quality === b.quality) {
        return a.originalIndex - b.originalIndex;
      } else {
        return b.quality - a.quality;
      }
    });
}

function acceptParams(str, index) {
  var parts = str.split(/ *; */);
  var ret = { value: parts[0], quality: 1, params: {}, originalIndex: index };

  for (var i = 1; i < parts.length; ++i) {
    var pms = parts[i].split(/ *= */);
    if ('q' == pms[0]) {
      ret.quality = parseFloat(pms[1]);
    } else {
      ret.params[pms[0]] = pms[1];
    }
  }

  return ret;
}
});
require.register("slam/lib/ai.js", function(exports, require, module){
var debug = require('debug')('ai')
  , geom = require('geom')
  , settings = require('./settings')
  , actions = require('./actions')
  , vec = geom.vec
  , ImprovedNoise = require('./support/improved-noise');

module.exports = AI;

function AI( name ){
  debug('created')
  this.name = name;
  this.active = false;
  this.noiseAmount = 0;
  this.guiInit = false;
  this.time = 0;
  this.target = null;
  this.currentConfusionOffsetX = 0;
  //stores logic
  this.brain = {};

  this.defaults = {
    maxSpeed:20,
    reaction:0.9,
    viewRange:0.6,
    confusion:0
  }

  this.resetBrain();

  actions.on('opponentPaddleHit', this.paddleHit.bind(this) )
}

AI.prototype = {

  resetBrain: function(){
    debug('reset brain')

    this.time = 0;
    this.brain = {};
    for( var key in this.defaults ) {
      this.brain[key] = this.defaults[key];
    }
  },

  updateBrain: function( data ) {
    debug('update brain',data)

    this.resetBrain();

    for( var key in data ) {
      if( this.brain.hasOwnProperty(key) ){
        this.brain[key] = data[key];
      }
    }

    if( !this.guiInit && settings.gui && this.name == 'game'){

      this.guiInit = true;

      var f = settings.gui.addFolder('AI')

      for( key in this.defaults ) {
        if( key == 'maxSpeed' ){
          f.add(this.brain,key).min(0).max(20).step(0.1).listen();
        } else {
          f.add(this.brain,key).min(0).max(1).step(0.1).listen();
        }
      }

    }

  },

  paddleHit: function(){
    this.currentConfusionOffsetX = Math.random()*500-250;
  },

  start: function(){
    debug('start')
    this.active = true;
    this.noiseAmount = 0;
  },

  stop: function(){
    debug('stop')
    this.active = false;
    this.time = 0;
  },

  setTarget: function(target){
    debug('set target',target)
    this.target = target;
  },

  update: function(world){
    // skip if target doesn't exist (yet)
    if( !this.active || this.target === null || !world.bodies.has(this.target) ){
      return false;
    }

    // find closest puck
    var closest = null
      , minDist = settings.data.arenaHeight*this.brain.viewRange
      , target = world.bodies.get(this.target)
      , current = target.current
      , paddleWidth = (target.aabb[1]-target.aabb[3])*0.5;

    for(var i=0; i < world.pucks.length; i++){
      var puck = world.pucks.values[i]
        , testPos = [puck.current[0],current[1]]
        , dist = vec.distSq(testPos,puck.current)

      minDist *= minDist

      if( dist < minDist ){
        minDist = dist;
        closest = puck;
      }
    }

    // no puck found
    var targetX = settings.data.arenaWidth*0.5;
    if( closest ) {
      targetX = closest.current[0] + this.currentConfusionOffsetX*this.brain.confusion*0.5;
    } else {
      targetX += this.currentConfusionOffsetX*this.brain.confusion;
    }

    if(this.noiseAmount<1){
      this.noiseAmount+= 0.004;
    }

    //offset target with confusion
    targetX += this.currentConfusionOffsetX*this.brain.confusion*0.3*this.noiseAmount;

    this.time += 0.1;

    targetX += Math.sin(this.time*2.2)*40*this.noiseAmount*this.brain.confusion;

    if( closest && closest.velocity[1] < 0 ){
      current[0] += Math.max(-this.brain.maxSpeed, Math.min(this.brain.maxSpeed,( targetX - current[0])))*this.brain.reaction;

    } else {
      current[0] += (targetX - current[0])*0.01*this.noiseAmount*this.brain.reaction;
    }

    if( current[0] > settings.data.arenaWidth - paddleWidth) {
      current[0] = settings.data.arenaWidth - paddleWidth;
    } else if( current[0] < paddleWidth) {
      current[0] = paddleWidth;
    }

    // ai has moved, let them know
    return true;
  }

}
});
require.register("slam/lib/dmaf.min.js", function(exports, require, module){
var dmaf=function(e){function t(e,t,i){return e&&t&&i?(k||n(e,t,i),void 0):(console.log(a()),void 0)}function n(e,t,n){N[e]=n,n.deps=t,n.name=e}function a(){return"Dinahmoe Web Audio Framework Version: "+E}function s(e){return I[e]||(r([e]),I[e]||{})}function r(e){for(var n,a=0,i=e.length;i>a;a++)if(n=e[a],!I[n]&&N[n]){if(!N[n].deps)return null;r.call(t,N[n].deps),I[n]=N[n].apply(t,o(N[n].deps))||{}}}function o(e){for(var t=[],n=0;e.length>n;n++)t.push(I[e[n]]);return t}function l(e){t.dev&&M.projectPath?p(M.projectPath+"project.xml","document",u):d(e),t.init=function(){t.log&&console.warn("dmaf has already been initialized.")}}function d(e){s("init")(e,s,N,M.descriptorsXML,M.configXML,M.assetsXML,M.logs||[])}function c(e,t){var n=document.createElement("script");n.type="text/javascript",n.charset="utf-8",n.async=!0,n.onload=function(){t(),setTimeout(function(){document.body.removeChild(n)},1)},n.src=e,document.body.appendChild(n)}function p(e,t,n){var a=new XMLHttpRequest;a.onload=function(){n(this.response)},a.open("GET",e,!0),a.responseType=t,a.send()}function u(e){var t=e.querySelector("framework"),n=e.querySelector("include"),a=e.querySelector("logs");if(t=t&&t.getAttribute("path"),n=n&&n.getAttribute("scripts"),a=a&&a.getAttribute("channels"),!t)throw new TypeError("Missing framework path.");M.customScripts=n&&n.split(",")||[],M.logs=a&&a.split(","),M.frameworkPath=t,M.configPath=M.projectPath+"config.xml",M.assetsPath=M.projectPath+"assets/",M.loadPath=M.projectPath+"assets.xml",M.customScripts=M.customScripts.map(function(e){return M.assetsPath+"js/"+e}),p(t+"src/scripts.json","text",m)}function m(e){var t,n=JSON.parse(e);n=n.concat(M.customScripts),M.files.toLoad=n.length,k=!1,console.log("Loading dmaf from:",M.frameworkPath);for(var a=0;M.files.toLoad>a;a++)t=/http/.test(n[a])?n[a]:M.frameworkPath+n[a],c(t,h)}function h(){++M.files.loaded===M.files.toLoad&&p(M.frameworkPath+"src/xml/descriptors.xml","document",f)}function f(e){M.descriptorsXML=e,p(M.configPath,"document",_)}function _(e){M.configXML=e,p(M.loadPath,"document",g)}function g(e){M.assetsXML=e,d(M.assetsPath)}function y(e){var n=[],a=function(){n.push(arguments)};a.resolve=function(a){for(t[e]=a||function(){};n.length;)a.apply(t,n.shift())},t[e]=a}var v=!("undefined"==typeof window||!e.navigator||!e.document),b=v&&!(!e.webkitAudioContext&&!e.AudioContext),A="undefined"!=typeof Audio,T=e.location&&e.location.href.split("?")||[],P=/^dmaf\=/,E="4.2.13",N={},I={},x=["once","registerObject","unregisterObject","addEventListener","removeEventListener","tell"],M={files:{loaded:0,total:0},projectPath:""},k=!1;for(x.forEach(y),t.prototype=null,t.isBrowser=v,t.hasHTMLAudio=A,t.hasContext=b,t.toString=a,t.init=l,t.dev=!1,i=0;T.length>i;i++)if(P.test(T[i])){console.log("DMAF is running in development mode."),t.dev=k=!0,M.projectPath=T[i].replace(P,"");break}return"undefined"!=typeof module&&module.exports?module.exports=t:"undefined"!=typeof define&&define("dmaf",[],function(){return t}),1&&(e.dmaf=t)}(this);dmaf("settings",["DMAF"],function(e){e.Settings={assetsPath:"./dmaf__assets/",descriptors:{validActions:["loadCustomCode","loadSound","cacheHTMLAudio","loadHTMLAudio","loadMIDI","loadSampleMap","loadBin","customCode","userObject","mediaElement","mediaController","genericPlay","stepPlay","htmlPlay","soundStop","midiProcessor","makeNote","transform","macro","state","eventMapper","midiNoteMapper","timePatternPlayer","beatPatternPlayer","sampler","audioBus"],validTypes:["noteMap","stateMap","eventMap","file","map","target","sampleMapGroup","sampleMap","start","stop","add","beatEvent","band","chorus","overdrive","compressor","cabinet","filter","convolver","delay","envelopeFollower","equalizer","lfo","phaser","pingPongDelay","tremolo","wahWah"],action:{assetController:{loadCustomCode:{type:"assetController",id:"loadCustomCode",instanceId:{name:"instanceId",type:"string"},returnEvent:{name:"returnEvent",type:"string"},files:{name:"files",type:"array",valueType:"file"},"":{type:"assetController"}},type:"assetController",loadSound:{type:"assetController",id:"loadSound",instanceId:{name:"instanceId",type:"string"},returnEvent:{name:"returnEvent",type:"string"},files:{name:"files",type:"array",valueType:"file"},"":{type:"assetController"}},cacheHTMLAudio:{type:"assetController",id:"cacheHTMLAudio",instanceId:{name:"instanceId",type:"string"},returnEvent:{name:"returnEvent",type:"string"},files:{name:"files",type:"array",valueType:"file"},"":{type:"assetController"}},loadHTMLAudio:{type:"assetController",id:"loadHTMLAudio",instanceId:{name:"instanceId",type:"string"},returnEvent:{name:"returnEvent",type:"string"},files:{name:"files",type:"array",valueType:"file"},"":{type:"assetController"}},loadMIDI:{type:"assetController",id:"loadMIDI",instanceId:{name:"instanceId",type:"string"},returnEvent:{name:"returnEvent",type:"string"},files:{name:"files",type:"array",valueType:"file"},"":{type:"assetController"}},loadSampleMap:{type:"assetController",id:"loadSampleMap",instanceId:{name:"instanceId",type:"string"},returnEvent:{name:"returnEvent",type:"string"},files:{name:"files",type:"array",valueType:"file"},"":{type:"assetController"}},loadBin:{type:"assetController",id:"loadBin",instanceId:{name:"instanceId",type:"string"},returnEvent:{name:"returnEvent",type:"string"},"":{type:"assetController"}}},customCode:{customCode:{type:"customCode",id:"customCode",instanceId:{name:"instanceId",type:"string"},"":{type:"customCode"}},type:"customCode",userObject:{type:"customCode",id:"userObject",instanceId:{name:"instanceId",type:"string"},"":{type:"customCode"}}},mediaElement:{mediaElement:{type:"mediaElement",id:"mediaElement",instanceId:{name:"instanceId",type:"string"},"":{type:"mediaElement"}},type:"mediaElement"},control:{mediaController:{type:"control",id:"mediaController",instanceId:{name:"instanceId",type:"string","default":"multi"},"":{type:"control"}},type:"control"},sound:{genericPlay:{type:"sound",id:"genericPlay",delay:{name:"delay",type:"int","default":0,min:-1e6,max:1e6},instanceId:{name:"instanceId",type:"string","default":"multi"},soundFile:{name:"soundFile",type:"string","default":"multi"},multiSuffix:{name:"multiSuffix",type:"string","default":""},volume:{name:"volume",type:"float",unit:"dB","default":0,min:-90,max:48},pan:{name:"pan",type:"int","default":0,min:-100,max:100},loop:{name:"loop",type:"int",unit:"mS","default":-1,min:-2,max:1e5},reTrig:{name:"reTrig",type:"int",unit:"mS","default":-1,min:-1,max:1e5},returnEvent:{name:"returnEvent",type:"string"},returnEventTime:{name:"returnEventTime",type:"int",unit:"mS","default":-1,min:-1e6,max:1e5},preListen:{name:"preListen",type:"int","default":0,min:0,max:500},bus:{name:"bus",type:"string","default":"master"},priority:{name:"priority",type:"boolean","default":!1},timingCorrection:{name:"timingCorrection",type:"enum","default":"PLAY",values:["RESYNC","SYNC","PLAY"]},fadeIn:{name:"fadeIn",type:"int",min:0,max:1e6,"default":0},"":{type:"sound"}},type:"sound",stepPlay:{type:"sound",id:"stepPlay",delay:{name:"delay",type:"int","default":0,min:0,max:1e5},instanceId:{name:"instanceId",type:"string"},soundFiles:{name:"soundFiles",type:"list"},generator:{name:"generator",type:"enum","default":"SHUFFLE",values:["SHUFFLE","RANDOM","RANDOM_FIRST","ROUND_ROBIN"]},volume:{name:"volume",type:"float","default":0,min:-90,max:48},pan:{name:"pan",type:"int","default":0,min:-100,max:100},reTrig:{name:"reTrig",type:"int","default":-1,min:-1,max:1e5},returnEvent:{name:"returnEvent",type:"string","default":"",values:["ALL"]},returnEventTime:{name:"returnEventTime",type:"int","default":-1,min:-1e6,max:1e5},preListen:{name:"preListen",type:"int","default":0,min:0,max:500},bus:{name:"bus",type:"string","default":"master",values:["ALL"]},priority:{name:"priority",type:"boolean","default":!1},timingCorrection:{name:"timingCorrection",type:"enum","default":"SYNC",values:["SYNC","PLAY"]},fadeIn:{name:"fadeIn",type:"int",min:0,max:1e6,"default":0},"":{type:"sound"}},htmlPlay:{type:"sound",id:"htmlPlay",delay:{name:"delay",type:"int","default":0,min:-1e6,max:1e6},instanceId:{name:"instanceId",type:"string","default":"multi"},soundFile:{name:"soundFile",type:"string","default":"multi"},multiSuffix:{name:"multiSuffix",type:"string","default":""},volume:{name:"volume",type:"float",unit:"dB","default":0,min:-90,max:48},loop:{name:"loop",type:"int",unit:"mS","default":-1,min:-2,max:1e5},reTrig:{name:"reTrig",type:"int",unit:"mS","default":-1,min:-1,max:1e5},returnEvent:{name:"returnEvent",type:"string"},returnEventTime:{name:"returnEventTime",type:"int",unit:"mS","default":-1,min:-1e6,max:1e5},timingCorrection:{name:"timingCorrection",type:"enum","default":"PLAY",values:["RESYNC","SYNC","PLAY"]},"":{type:"sound"}},soundStop:{type:"sound",id:"soundStop",instanceId:{name:"instanceId",type:"string"},delay:{name:"delay",type:"int","default":0,min:0,max:9999999},targets:{name:"targets",type:"list"},multiSuffix:{name:"multiSuffix",type:"string","default":""},fadeOut:{name:"fadeOut",type:"int",min:0,max:1e5,"default":0},"":{type:"sound"}}},midiProcessor:{midiProcessor:{type:"midiProcessor",id:"midiProcessor",instanceId:{name:"instanceId",type:"string"},customScale:{name:"customScale",type:"string","default":"0,0,0,0,0,0,0,0,0,0,0,0"},transpose:{name:"transpose",type:"int","default":0,min:-127,max:127},dynamic:{name:"dynamic",type:"int","default":0,min:-127,max:127},quantize:{name:"quantize",type:"string"},onChange:{name:"onChange",type:"boolean","default":!1},scale:{name:"scale",type:"enum","default":"off",values:["off","major","harmonicMinor","naturalMinor","majorPentatonic","minorPentatonic","dorian","phyrgian","lydian","mixolydian","locrian","doubleHarmonic","halfDim","custom"]},root:{name:"root",type:"string","default":"C",values:["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]},"":{type:"midiProcessor"}},type:"midiProcessor",makeNote:{type:"midiProcessor",id:"makeNote",instanceId:{name:"instanceId",type:"string","default":"someProcessor"},reTrig:{name:"reTrig",type:"int","default":0,min:0,max:1e4},noteMaps:{name:"noteMaps",type:"array",valueType:"noteMap"},"":{type:"midiProcessor"}}},parameterProcessor:{transform:{type:"parameterProcessor",id:"transform",instanceId:{name:"instanceId",type:"string"},delay:{name:"delay",type:"int","default":0,min:0,max:9999999},targetType:{name:"targetType",type:"enum","default":"SOUND",values:["sound","audioRouter","synth","parameterProcessor"]},targets:{name:"targets",type:"list"},targetParameter:{name:"targetParameter",type:"string"},multiSuffix:{name:"multiSuffix",type:"string"},value:{name:"value",type:"float","default":0,min:-9999999,max:9999999},duration:{name:"duration",type:"int","default":0,min:0,max:9999999},curve:{name:"curve",type:"int","default":0,min:-100,max:100},"":{type:"parameterProcessor"}},type:"parameterProcessor",macro:{type:"parameterProcessor",id:"macro",instanceId:{name:"instanceId",type:"string"},delay:{name:"delay",type:"int","default":0,min:0,max:9999999},macroTargets:{name:"macroTargets",type:"array",valueType:"macroTarget"},"":{type:"parameterProcessor"}}},stateProcessor:{state:{type:"stateProcessor",id:"state",instanceId:{name:"instanceId",type:"string"},update:{name:"update",type:"enum","default":"onChange",values:["onChange","always"]},stateMaps:{name:"stateMaps",type:"array",valueType:"stateMap"},"":{type:"stateProcessor"}},type:"stateProcessor"},eventProcessor:{eventMapper:{type:"eventProcessor",id:"eventMapper",instanceId:{name:"instanceId",type:"string"},reTrig:{name:"reTrig",type:"int","default":0,min:0,max:1e4},clearPending:{name:"clearPending",type:"boolean","default":!1},dispatch:{name:"dispatch",type:"enum","default":"ALWAYS",values:["ALWAYS","ON_CHANGE"]},eventMaps:{name:"eventMaps",type:"array",valueType:"eventMap"},"":{type:"eventProcessor"}},type:"eventProcessor",midiNoteMapper:{type:"eventProcessor",id:"midiNoteMapper",instanceId:{name:"instanceId",type:"string"},eventMaps:{name:"eventMaps",type:"array",valueType:"eventMap"},"":{type:"eventProcessor"}}},player:{timePatternPlayer:{type:"player",id:"timePatternPlayer",instanceId:{name:"instanceId",type:"string","default":"master_time_player"},behavior:{name:"behavior",type:"enum",values:["LINEAR","DEFAULT"],"default":"DEFAULT"},"":{type:"player"}},type:"player",beatPatternPlayer:{type:"player",id:"beatPatternPlayer",instanceId:{name:"instanceId",type:"string","default":"master_beat_player"},flowItems:{name:"flowItems",type:"array",valueType:"flowItem"},"":{type:"player"}}},synth:{sampler:{type:"synth",id:"sampler",instanceId:{name:"instanceId",type:"string"},ignoreNoteOff:{name:"ignoreNoteOff",type:"boolean","default":!1},bus:{name:"bus",type:"string","default":"master"},volume:{name:"volume",type:"float","default":0,min:-100,max:10},loop:{name:"loop",type:"boolean","default":!1},ampAttack:{name:"ampAttack",type:"int","default":0,min:0,max:500},ampDecay:{name:"ampDecay",type:"int","default":0,min:0,max:500},ampRelease:{name:"ampRelease",type:"int","default":0,min:0,max:1e3},ampSustain:{name:"ampSustain",type:"float","default":1,min:0,max:1},ampVelocityRatio:{name:"ampVelocityRatio",type:"float","default":1,min:0,max:1},filterOn:{name:"filterOn",type:"boolean","default":!1},filterAttack:{name:"filterAttack",type:"int","default":0,min:0,max:500},filterDecay:{name:"filterDecay",type:"int","default":0,min:0,max:500},filterRelease:{name:"filterRelease",type:"int","default":0,min:0,max:1e3},filterSustain:{name:"filterSustain",type:"float","default":1,min:0,max:1},filterVelocityRatio:{name:"filterVelocityRatio",type:"float","default":1,min:0,max:1},filterQ:{name:"filterQ",type:"float","default":1e-4,min:1e-4,max:30},filterFrequency:{name:"filterFrequency",type:"int","default":0,min:0,max:10},filterGain:{name:"filterGain",type:"float","default":0,min:0,max:1},audioNodes:{name:"audioNodes",type:"array",valueType:"audioNode"},sampleMapGroups:{name:"sampleMapGroups",type:"array",valueType:"sampleMapGroup"},"":{type:"synth"}},type:"synth"},audioRouter:{audioBus:{type:"audioRouter",id:"audioBus",instanceId:{name:"instanceId",type:"string"},out:{name:"out",type:"list","default":[""]},volume:{name:"volume",type:"float","default":0,min:-100,max:10},pan:{name:"pan",type:"int","default":0,min:-100,max:100},audioNodes:{name:"audioNodes",type:"array",valueType:"audioNode"},"":{type:"audioRouter"}},type:"audioRouter"}},type:{noteMap:{noteMap:{type:"noteMap",id:"noteMap",delay:{name:"delay",type:"int","default":0,min:0,max:1e5},triggerIn:{name:"triggerIn",type:"list"},triggerOut:{name:"triggerOut",type:"string"},note:{name:"note",type:"string","default":"C4"},velocity:{name:"velocity",type:"int",min:0,max:127,"default":127},duration:{name:"duration",type:"int",min:0,max:9999999,"default":0},"":{type:"noteMap"}},type:"noteMap"},stateMap:{stateMap:{type:"stateMap",id:"stateMap","in":{name:"in",type:"list"},state:{name:"state",type:"string"},"":{type:"stateMap"}},type:"stateMap"},eventMap:{eventMap:{type:"eventMap",id:"eventMap","in":{name:"in",type:"list"},out:{name:"out",type:"string"},delay:{name:"delay",type:"int","default":0,max:1e5,min:-1e5},"":{type:"eventMap"}},type:"eventMap"},file:{file:{type:{name:"type",type:"enum",values:["beatPattern","timePattern"],"default":""},id:"file",name:{name:"name",type:"string"},"":{type:"file"}},type:"file"},map:{map:{type:"map",id:"map",inValue:{name:"inValue",type:"string"},outValue:{name:"outValue",type:"string"},"":{type:"map"}},type:"map"},macroTarget:{target:{type:"macroTarget",id:"target",targetId:{name:"targetId",type:"string"},min:{name:"min",type:"float","default":1e5,min:-1e5,max:1e5},max:{name:"max",type:"float","default":1e5,min:-1e5,max:1e5},targetInstance:{name:"targetInstance",type:"string"},targetParameter:{name:"targetParameter",type:"string"},curve:{name:"curve",type:"enum","default":"LINEAR",values:["LINEAR","EXP","LOG"]},"":{type:"macroTarget"}},type:"macroTarget"},sampleMapGroup:{sampleMapGroup:{type:"sampleMapGroup",id:"sampleMapGroup",name:{name:"name",type:"string"},sampleMaps:{name:"sampleMaps",type:"array",valueType:"sampleMap"},"":{type:"sampleMapGroup"}},type:"sampleMapGroup"},sampleMap:{sampleMap:{type:"sampleMap",id:"sampleMap",name:{name:"name",type:"string"},velocityLow:{name:"velocityLow",type:"int","default":0,min:0,max:127},velocityHigh:{name:"velocityHigh",type:"int","default":127,min:0,max:127},"":{type:"sampleMap"}},type:"sampleMap"},flowItem:{start:{type:"flowItem",id:"start",tempo:{name:"tempo",type:"float","default":120,min:40,max:280},beatsPerBar:{name:"beatsPerBar",type:"int","default":16,min:1,max:32},"":{type:"flowItem"}},type:"flowItem",stop:{type:"flowItem",id:"stop",songPosition:{name:"songPosition",type:"string","default":"NEXT_BEAT"},"":{type:"flowItem"}},add:{type:"flowItem",id:"add",patternId:{name:"patternId",type:"list","default":["multi"]},channel:{name:"channel",type:"string","default":"main"},songPosition:{name:"songPosition",type:"string","default":"NEXT_BAR"},patternPosition:{name:"patternPosition",type:"enum","default":"SYNC",values:["SYNC","FIRST_BEAT","SONG_POSITION"]},clearPending:{name:"clearPending",type:"boolean","default":!0},replaceActive:{name:"replaceActive",type:"boolean","default":!0},setAsCurrent:{name:"setAsCurrent",type:"boolean","default":!0},loop:{name:"loop",type:"boolean","default":!1},loopLength:{name:"loopLength",type:"int","default":129,min:1,max:65536},clearPosition:{name:"clearPosition",type:"string","default":"NEXT_BAR"},"":{type:"flowItem"}},beatEvent:{type:"flowItem",id:"beatEvent",songPosition:{name:"songPosition",type:"string","default":"NEXT_BAR"},returnEvent:{name:"returnEvent",type:"string","default":""},"":{type:"flowItem"}}},band:{band:{type:"band",id:"band",bandType:{name:"bandType",type:"enum","default":"PEAKING",values:["LOWPASS","HIGHPASS","BANDPASS","LOWSHELF","HIGHSHELF","PEAKING","NOTCH","ALLPASS"],automatable:!1},frequency:{name:"frequency",type:"float","default":800,min:20,max:22050,automatable:!0},Q:{name:"Q",type:"float","default":1,min:0,max:100,automatable:!0},gain:{name:"gain",type:"float","default":0,min:-40,max:40,automatable:!0},"":{type:"band"}},type:"band"},audioNode:{chorus:{type:"audioNode",id:"chorus",active:{name:"active",type:"boolean","default":!0},feedback:{name:"feedback",type:"float","default":0,min:0,max:1,automatable:!1},delay:{name:"delay",type:"float","default":.0045,min:0,max:1,automatable:!1},rate:{name:"rate",type:"float","default":1.5,min:.01,max:8,automatable:!1},bypass:{name:"bypass",type:"float","default":0,min:0,max:1,automatable:!1},"":{type:"audioNode"}},type:"audioNode",overdrive:{type:"audioNode",id:"overdrive",active:{name:"active",type:"boolean","default":!0},outputGain:{name:"outputGain",type:"float","default":0,min:0,max:10,automatable:!0},drive:{name:"drive",type:"float","default":0,min:0,max:10,automatable:!0},curveAmount:{name:"curveAmount",type:"float","default":1,min:0,max:10,automatable:!0},algorithmIndex:{name:"algorithmIndex",type:"int","default":0,min:0,max:5,automatable:!1},"":{type:"audioNode"}},compressor:{type:"audioNode",id:"compressor",active:{name:"active",type:"boolean","default":!0},threshold:{name:"threshold",type:"float","default":0,min:-100,max:0,automatable:!0},makeupGain:{name:"makeupGain",type:"float","default":1,min:0,max:100,automatable:!0},attack:{name:"attack",type:"float","default":1,min:0,max:1e3,automatable:!0},release:{name:"release",type:"float","default":1,min:0,max:3e3,automatable:!0},ratio:{name:"ratio",type:"float","default":4,min:1,max:20,automatable:!0},knee:{name:"knee",type:"float","default":5,min:0,max:40,automatable:!0},automakeup:{name:"automakeup",type:"boolean","default":!1},"":{type:"audioNode"}},cabinet:{type:"audioNode",id:"cabinet",active:{name:"active",type:"boolean","default":!0},makeupGain:{name:"makeupGain",type:"float","default":1,min:0,max:20,automatable:!0},impulsePath:{name:"impulsePath",type:"string"},"":{type:"audioNode"}},filter:{type:"audioNode",id:"filter",active:{name:"active",type:"boolean","default":!0},frequency:{name:"frequency",type:"float","default":20,min:20,max:22050,automatable:!0},Q:{name:"Q",type:"float","default":1,min:0,max:100,automatable:!0},gain:{name:"gain",type:"float","default":0,min:-40,max:40,automatable:!0},bypass:{name:"bypass",type:"boolean","default":!0,automatable:!0},filterType:{name:"filterType",type:"enum","default":"LOWPASS",values:["LOWPASS","HIGHPASS","BANDPASS","LOWSHELF","HIGHSHELF","PEAKING","NOTCH","ALLPASS"],automatable:!1},"":{type:"audioNode"}},convolver:{type:"audioNode",id:"convolver",active:{name:"active",type:"boolean","default":!0},highCut:{name:"highCut",type:"float","default":22050,min:20,max:22050,automatable:!0},lowCut:{name:"lowCut",type:"float","default":20,min:20,max:22050,automatable:!0},dryLevel:{name:"dryLevel",type:"float","default":1,min:0,max:1,automatable:!0},wetLevel:{name:"wetLevel",type:"float","default":1,min:0,max:1,automatable:!0},level:{name:"level",type:"float","default":1,min:0,max:1,automatable:!0},impulse:{name:"impulse",type:"string"},"":{type:"audioNode"}},delay:{type:"audioNode",id:"delay",active:{name:"active",type:"boolean","default":!0},delayTime:{name:"delayTime",type:"float","default":30,min:.001,max:1e4,automatable:!1},feedback:{name:"feedback",type:"float","default":.45,min:0,max:.9,automatable:!0},cutoff:{name:"cutoff",type:"float","default":20,min:20,max:22050,automatable:!0},dryLevel:{name:"dryLevel",type:"float","default":1,min:0,max:1,automatable:!0},wetLevel:{name:"wetLevel",type:"float","default":1,min:0,max:1,automatable:!0},tempoSync:{name:"tempoSync",type:"string",automatable:!1},subdivision:{name:"subdivision",type:"enum","default":"8D",values:["1","2D","2","2T","4D","4","4T","8D","8","8T","16D","16","16T","32D","32","32T"],automatable:!1},"":{type:"audioNode"}},envelopeFollower:{type:"audioNode",id:"envelopeFollower",active:{name:"active",type:"boolean","default":!0},attackTime:{name:"attackTime",type:"float","default":.003,min:0,max:.5,automatable:!1},releaseTime:{name:"releaseTime",type:"float","default":.5,min:0,max:1,automatable:!1},"":{type:"audioNode"}},equalizer:{type:"audioNode",id:"equalizer",active:{name:"active",type:"boolean","default":!0},bands:{name:"bands",type:"array",valueType:"band"},"":{type:"audioNode"}},lfo:{type:{name:"type",type:"enum","default":"SIN",values:["SIN","SQUARE","TRIANGLE","SAWTOOTH"],automatable:!1},id:"lfo",active:{name:"active",type:"boolean","default":!0},frequency:{name:"frequency",type:"float","default":1,min:0,max:8,automatable:!1},offset:{name:"offset",type:"float","default":.85,min:0,max:22050,automatable:!1},phase:{name:"phase",type:"float","default":0,min:0,max:6.28318530718,automatable:!1},oscillation:{name:"oscillation",type:"float","default":.3,min:-22050,max:22050,automatable:!1},"":{type:"audioNode"}},phaser:{type:"audioNode",id:"phaser",active:{name:"active",type:"boolean","default":!0},rate:{name:"rate",type:"float","default":1,min:0,max:8,automatable:!1},depth:{name:"depth",type:"float","default":.3,min:0,max:1,automatable:!1},feedback:{name:"feedback",type:"float","default":.2,min:0,max:1,automatable:!1},stereoPhase:{name:"stereoPhase",type:"int","default":30,min:0,max:180,automatable:!1},baseModulationFrequency:{name:"baseModulationFrequency",type:"float","default":700,min:500,max:1500,automatable:!1},"":{type:"audioNode"}},pingPongDelay:{type:"audioNode",id:"pingPongDelay",active:{name:"active",type:"boolean","default":!0},delayTime:{name:"delayTime",type:"float","default":30,min:1e-4,max:1e4,automatable:!1},feedback:{name:"feedback",type:"float","default":.45,min:0,max:.9,automatable:!0},cutoff:{name:"cutoff",type:"float","default":20,min:20,max:22050,automatable:!0},dryLevel:{name:"dryLevel",type:"float","default":1,min:0,max:1,automatable:!0},wetLevel:{name:"wetLevel",type:"float","default":1,min:0,max:1,automatable:!0},tempoSync:{name:"tempoSync",type:"string",automatable:!1},subdivision:{name:"subdivision",type:"enum","default":"8D",values:["1","2D","2","2T","4D","4","4T","8D","8","8T","16D","16","16T","32D","32","32T"],automatable:!1},"":{type:"audioNode"}},tremolo:{type:"audioNode",id:"tremolo",active:{name:"active",type:"boolean","default":!0},intensity:{name:"intensity",type:"float","default":.3,min:0,max:1,automatable:!1},stereoPhase:{name:"stereoPhase",type:"int","default":0,min:0,max:180,automatable:!1},rate:{name:"rate",type:"float","default":.1,min:.001,max:8,automatable:!1},"":{type:"audioNode"}},wahWah:{type:"audioNode",id:"wahWah",active:{name:"active",type:"boolean","default":!0},automode:{name:"automode",type:"boolean","default":!1},baseFrequency:{name:"baseFrequency",type:"float","default":.5,min:0,max:1,automatable:!1},excursionOctaves:{name:"excursionOctaves",type:"int","default":2,min:1,max:6,automatable:!1},sweep:{name:"sweep",type:"float","default":.2,min:0,max:1,automatable:!1},resonance:{name:"resonance",type:"float","default":10,min:1,max:100,automatable:!1},sensitivity:{name:"sensitivity",type:"float","default":.5,min:-1,max:1,automatable:!1},"":{type:"audioNode"}}}}},actions:[{instanceId:"load_bass_filter",returnEvent:"",files:[{id:"file",name:"bass_filter_low_E2"},{id:"file",name:"bass_filter_low_As2"},{id:"file",name:"bass_filter_low_E3"},{id:"file",name:"bass_filter_low_As3"},{id:"file",name:"bass_filter_low_E4"},{id:"file",name:"bass_filter_low_As4"},{id:"file",name:"bass_filter_low_E5"},{id:"file",name:"bass_filter_low_As5"},{id:"file",name:"bass_filter_low_E6"},{id:"file",name:"bass_filter_low_As6"},{id:"file",name:"bass_filter_mid_E2"},{id:"file",name:"bass_filter_mid_As2"},{id:"file",name:"bass_filter_mid_E3"},{id:"file",name:"bass_filter_mid_As3"},{id:"file",name:"bass_filter_mid_E4"},{id:"file",name:"bass_filter_mid_As4"},{id:"file",name:"bass_filter_mid_E5"},{id:"file",name:"bass_filter_mid_As5"},{id:"file",name:"bass_filter_mid_E6"},{id:"file",name:"bass_filter_mid_As6"},{id:"file",name:"bass_filter_hi_E2"},{id:"file",name:"bass_filter_hi_As2"},{id:"file",name:"bass_filter_hi_E3"},{id:"file",name:"bass_filter_hi_As3"},{id:"file",name:"bass_filter_hi_E4"},{id:"file",name:"bass_filter_hi_As4"},{id:"file",name:"bass_filter_hi_E5"},{id:"file",name:"bass_filter_hi_As5"},{id:"file",name:"bass_filter_hi_E6"},{id:"file",name:"bass_filter_hi_As6"}],type:"assetController",id:"loadBin",triggers:["preload_assets"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_bass_filter.ogg.bin",files:[{name:"bass_filter_low_E2",size:9639,start:0,end:9639},{name:"bass_filter_low_As2",size:9585,start:9639,end:19224},{name:"bass_filter_low_E3",size:9772,start:19224,end:28996},{name:"bass_filter_low_As3",size:9678,start:28996,end:38674},{name:"bass_filter_low_E4",size:9781,start:38674,end:48455},{name:"bass_filter_low_As4",size:9726,start:48455,end:58181},{name:"bass_filter_low_E5",size:9627,start:58181,end:67808},{name:"bass_filter_low_As5",size:9540,start:67808,end:77348},{name:"bass_filter_low_E6",size:9507,start:77348,end:86855},{name:"bass_filter_low_As6",size:9656,start:86855,end:96511},{name:"bass_filter_mid_E2",size:9328,start:96511,end:105839},{name:"bass_filter_mid_As2",size:9677,start:105839,end:115516},{name:"bass_filter_mid_E3",size:9181,start:115516,end:124697},{name:"bass_filter_mid_As3",size:9710,start:124697,end:134407},{name:"bass_filter_mid_E4",size:9381,start:134407,end:143788},{name:"bass_filter_mid_As4",size:9577,start:143788,end:153365},{name:"bass_filter_mid_E5",size:9794,start:153365,end:163159},{name:"bass_filter_mid_As5",size:9675,start:163159,end:172834},{name:"bass_filter_mid_E6",size:9703,start:172834,end:182537},{name:"bass_filter_mid_As6",size:9502,start:182537,end:192039},{name:"bass_filter_hi_E2",size:18534,start:192039,end:210573},{name:"bass_filter_hi_As2",size:18637,start:210573,end:229210},{name:"bass_filter_hi_E3",size:20152,start:229210,end:249362},{name:"bass_filter_hi_As3",size:18912,start:249362,end:268274},{name:"bass_filter_hi_E4",size:20487,start:268274,end:288761},{name:"bass_filter_hi_As4",size:20504,start:288761,end:309265},{name:"bass_filter_hi_E5",size:20330,start:309265,end:329595},{name:"bass_filter_hi_As5",size:20515,start:329595,end:350110},{name:"bass_filter_hi_E6",size:20594,start:350110,end:370704},{name:"bass_filter_hi_As6",size:19939,start:370704,end:390643}]},{format:".aac",path:"bin/load_bass_filter.aac.bin",files:[{name:"bass_filter_low_E2",size:5408,start:0,end:5408},{name:"bass_filter_low_As2",size:5131,start:5408,end:10539},{name:"bass_filter_low_E3",size:5398,start:10539,end:15937},{name:"bass_filter_low_As3",size:5219,start:15937,end:21156},{name:"bass_filter_low_E4",size:5373,start:21156,end:26529},{name:"bass_filter_low_As4",size:5366,start:26529,end:31895},{name:"bass_filter_low_E5",size:5307,start:31895,end:37202},{name:"bass_filter_low_As5",size:5369,start:37202,end:42571},{name:"bass_filter_low_E6",size:5356,start:42571,end:47927},{name:"bass_filter_low_As6",size:5264,start:47927,end:53191},{name:"bass_filter_mid_E2",size:5618,start:53191,end:58809},{name:"bass_filter_mid_As2",size:5158,start:58809,end:63967},{name:"bass_filter_mid_E3",size:5060,start:63967,end:69027},{name:"bass_filter_mid_As3",size:4993,start:69027,end:74020},{name:"bass_filter_mid_E4",size:5148,start:74020,end:79168},{name:"bass_filter_mid_As4",size:5014,start:79168,end:84182},{name:"bass_filter_mid_E5",size:4882,start:84182,end:89064},{name:"bass_filter_mid_As5",size:5009,start:89064,end:94073},{name:"bass_filter_mid_E6",size:5084,start:94073,end:99157},{name:"bass_filter_mid_As6",size:4921,start:99157,end:104078},{name:"bass_filter_hi_E2",size:16240,start:104078,end:120318},{name:"bass_filter_hi_As2",size:17079,start:120318,end:137397},{name:"bass_filter_hi_E3",size:15338,start:137397,end:152735},{name:"bass_filter_hi_As3",size:15440,start:152735,end:168175},{name:"bass_filter_hi_E4",size:15020,start:168175,end:183195},{name:"bass_filter_hi_As4",size:14623,start:183195,end:197818},{name:"bass_filter_hi_E5",size:14506,start:197818,end:212324},{name:"bass_filter_hi_As5",size:14351,start:212324,end:226675},{name:"bass_filter_hi_E6",size:14098,start:226675,end:240773},{name:"bass_filter_hi_As6",size:14241,start:240773,end:255014}]}]},{instanceId:"load_lead_b",returnEvent:"",files:[{id:"file",name:"lead_b_E1"},{id:"file",name:"lead_b_As1"},{id:"file",name:"lead_b_E2"},{id:"file",name:"lead_b_As2"},{id:"file",name:"lead_b_E3"},{id:"file",name:"lead_b_As3"},{id:"file",name:"lead_b_E4"},{id:"file",name:"lead_b_As4"},{id:"file",name:"lead_b_E5"},{id:"file",name:"lead_b_As5"},{id:"file",name:"lead_b_E6"},{id:"file",name:"lead_b_As6"}],type:"assetController",id:"loadBin",triggers:["dmaf_ready"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_lead_b.ogg.bin",files:[{name:"lead_b_E1",size:54177,start:0,end:54177},{name:"lead_b_As1",size:53962,start:54177,end:108139},{name:"lead_b_E2",size:54307,start:108139,end:162446},{name:"lead_b_As2",size:54503,start:162446,end:216949},{name:"lead_b_E3",size:54810,start:216949,end:271759},{name:"lead_b_As3",size:54723,start:271759,end:326482},{name:"lead_b_E4",size:54108,start:326482,end:380590},{name:"lead_b_As4",size:53655,start:380590,end:434245},{name:"lead_b_E5",size:53390,start:434245,end:487635},{name:"lead_b_As5",size:52891,start:487635,end:540526},{name:"lead_b_E6",size:53104,start:540526,end:593630},{name:"lead_b_As6",size:51088,start:593630,end:644718}]},{format:".aac",path:"bin/load_lead_b.aac.bin",files:[{name:"lead_b_E1",size:49038,start:0,end:49038},{name:"lead_b_As1",size:50205,start:49038,end:99243},{name:"lead_b_E2",size:50814,start:99243,end:150057},{name:"lead_b_As2",size:50352,start:150057,end:200409},{name:"lead_b_E3",size:51587,start:200409,end:251996},{name:"lead_b_As3",size:51339,start:251996,end:303335},{name:"lead_b_E4",size:51600,start:303335,end:354935},{name:"lead_b_As4",size:53215,start:354935,end:408150},{name:"lead_b_E5",size:53007,start:408150,end:461157},{name:"lead_b_As5",size:52917,start:461157,end:514074},{name:"lead_b_E6",size:50728,start:514074,end:564802},{name:"lead_b_As6",size:49546,start:564802,end:614348}]}]},{instanceId:"load_lead_a",returnEvent:"",files:[{id:"file",name:"lead_a_E1"},{id:"file",name:"lead_a_As1"},{id:"file",name:"lead_a_E2"},{id:"file",name:"lead_a_As2"},{id:"file",name:"lead_a_E3"},{id:"file",name:"lead_a_As3"},{id:"file",name:"lead_a_E4"},{id:"file",name:"lead_a_As4"},{id:"file",name:"lead_a_E5"},{id:"file",name:"lead_a_As5"},{id:"file",name:"lead_a_E6"},{id:"file",name:"lead_a_As6"}],type:"assetController",id:"loadBin",triggers:["dmaf_ready"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_lead_a.ogg.bin",files:[{name:"lead_a_E1",size:51062,start:0,end:51062},{name:"lead_a_As1",size:51351,start:51062,end:102413},{name:"lead_a_E2",size:51568,start:102413,end:153981},{name:"lead_a_As2",size:51936,start:153981,end:205917},{name:"lead_a_E3",size:51671,start:205917,end:257588},{name:"lead_a_As3",size:51580,start:257588,end:309168},{name:"lead_a_E4",size:51690,start:309168,end:360858},{name:"lead_a_As4",size:51803,start:360858,end:412661},{name:"lead_a_E5",size:51426,start:412661,end:464087},{name:"lead_a_As5",size:50418,start:464087,end:514505},{name:"lead_a_E6",size:45245,start:514505,end:559750},{name:"lead_a_As6",size:41416,start:559750,end:601166}]},{format:".aac",path:"bin/load_lead_a.aac.bin",files:[{name:"lead_a_E1",size:42930,start:0,end:42930},{name:"lead_a_As1",size:46748,start:42930,end:89678},{name:"lead_a_E2",size:46412,start:89678,end:136090},{name:"lead_a_As2",size:46280,start:136090,end:182370},{name:"lead_a_E3",size:48361,start:182370,end:230731},{name:"lead_a_As3",size:48153,start:230731,end:278884},{name:"lead_a_E4",size:47020,start:278884,end:325904},{name:"lead_a_As4",size:47500,start:325904,end:373404},{name:"lead_a_E5",size:47207,start:373404,end:420611},{name:"lead_a_As5",size:46062,start:420611,end:466673},{name:"lead_a_E6",size:45239,start:466673,end:511912},{name:"lead_a_As6",size:43621,start:511912,end:555533}]}]},{instanceId:"load_synth_warm",returnEvent:"",files:[{id:"file",name:"synth_warm_E0"},{id:"file",name:"synth_warm_As0"},{id:"file",name:"synth_warm_E1"},{id:"file",name:"synth_warm_As1"},{id:"file",name:"synth_warm_E2"},{id:"file",name:"synth_warm_As2"},{id:"file",name:"synth_warm_E3"},{id:"file",name:"synth_warm_As3"},{id:"file",name:"synth_warm_E4"},{id:"file",name:"synth_warm_As4"}],type:"assetController",id:"loadBin",triggers:["dmaf_ready"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_synth_warm.ogg.bin",files:[{name:"synth_warm_E0",size:51334,start:0,end:51334},{name:"synth_warm_As0",size:51438,start:51334,end:102772},{name:"synth_warm_E1",size:51609,start:102772,end:154381},{name:"synth_warm_As1",size:51481,start:154381,end:205862},{name:"synth_warm_E2",size:47920,start:205862,end:253782},{name:"synth_warm_As2",size:48423,start:253782,end:302205},{name:"synth_warm_E3",size:51469,start:302205,end:353674},{name:"synth_warm_As3",size:51499,start:353674,end:405173},{name:"synth_warm_E4",size:51494,start:405173,end:456667},{name:"synth_warm_As4",size:49164,start:456667,end:505831}]},{format:".aac",path:"bin/load_synth_warm.aac.bin",files:[{name:"synth_warm_E0",size:44401,start:0,end:44401},{name:"synth_warm_As0",size:45238,start:44401,end:89639},{name:"synth_warm_E1",size:46265,start:89639,end:135904},{name:"synth_warm_As1",size:47538,start:135904,end:183442},{name:"synth_warm_E2",size:47484,start:183442,end:230926},{name:"synth_warm_As2",size:42219,start:230926,end:273145},{name:"synth_warm_E3",size:34594,start:273145,end:307739},{name:"synth_warm_As3",size:34250,start:307739,end:341989},{name:"synth_warm_E4",size:32630,start:341989,end:374619},{name:"synth_warm_As4",size:33556,start:374619,end:408175}]}]},{instanceId:"load_synth_funk",returnEvent:"",files:[{id:"file",name:"synth_funk_E0"},{id:"file",name:"synth_funk_As0"},{id:"file",name:"synth_funk_E1"},{id:"file",name:"synth_funk_As1"},{id:"file",name:"synth_funk_E2"},{id:"file",name:"synth_funk_As2"},{id:"file",name:"synth_funk_E3"},{id:"file",name:"synth_funk_As3"},{id:"file",name:"synth_funk_E4"},{id:"file",name:"synth_funk_As4"},{id:"file",name:"synth_funk_E5"},{id:"file",name:"synth_funk_As5"}],type:"assetController",id:"loadBin",triggers:["dmaf_ready"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_synth_funk.ogg.bin",files:[{name:"synth_funk_E0",size:23167,start:0,end:23167},{name:"synth_funk_As0",size:23222,start:23167,end:46389},{name:"synth_funk_E1",size:23223,start:46389,end:69612},{name:"synth_funk_As1",size:23269,start:69612,end:92881},{name:"synth_funk_E2",size:23072,start:92881,end:115953},{name:"synth_funk_As2",size:23209,start:115953,end:139162},{name:"synth_funk_E3",size:22839,start:139162,end:162001},{name:"synth_funk_As3",size:21237,start:162001,end:183238},{name:"synth_funk_E4",size:20389,start:183238,end:203627},{name:"synth_funk_As4",size:18770,start:203627,end:222397},{name:"synth_funk_E5",size:19488,start:222397,end:241885},{name:"synth_funk_As5",size:19942,start:241885,end:261827}]},{format:".aac",path:"bin/load_synth_funk.aac.bin",files:[{name:"synth_funk_E0",size:17572,start:0,end:17572},{name:"synth_funk_As0",size:17514,start:17572,end:35086},{name:"synth_funk_E1",size:17216,start:35086,end:52302},{name:"synth_funk_As1",size:16718,start:52302,end:69020},{name:"synth_funk_E2",size:15766,start:69020,end:84786},{name:"synth_funk_As2",size:13967,start:84786,end:98753},{name:"synth_funk_E3",size:12719,start:98753,end:111472},{name:"synth_funk_As3",size:13142,start:111472,end:124614},{name:"synth_funk_E4",size:13037,start:124614,end:137651},{name:"synth_funk_As4",size:12810,start:137651,end:150461},{name:"synth_funk_E5",size:11993,start:150461,end:162454},{name:"synth_funk_As5",size:12477,start:162454,end:174931}]}]},{instanceId:"load_synth_sharp",returnEvent:"",files:[{id:"file",name:"synth_sharp_E1"},{id:"file",name:"synth_sharp_As1"},{id:"file",name:"synth_sharp_E2"},{id:"file",name:"synth_sharp_As2"},{id:"file",name:"synth_sharp_E3"},{id:"file",name:"synth_sharp_As3"},{id:"file",name:"synth_sharp_E4"},{id:"file",name:"synth_sharp_As4"},{id:"file",name:"synth_sharp_E5"},{id:"file",name:"synth_sharp_As5"}],type:"assetController",id:"loadBin",triggers:["dmaf_ready"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_synth_sharp.ogg.bin",files:[{name:"synth_sharp_E1",size:22906,start:0,end:22906},{name:"synth_sharp_As1",size:22795,start:22906,end:45701},{name:"synth_sharp_E2",size:22613,start:45701,end:68314},{name:"synth_sharp_As2",size:21931,start:68314,end:90245},{name:"synth_sharp_E3",size:21855,start:90245,end:112100},{name:"synth_sharp_As3",size:22621,start:112100,end:134721},{name:"synth_sharp_E4",size:22918,start:134721,end:157639},{name:"synth_sharp_As4",size:22800,start:157639,end:180439},{name:"synth_sharp_E5",size:22769,start:180439,end:203208},{name:"synth_sharp_As5",size:22722,start:203208,end:225930}]},{format:".aac",path:"bin/load_synth_sharp.aac.bin",files:[{name:"synth_sharp_E1",size:16552,start:0,end:16552},{name:"synth_sharp_As1",size:16204,start:16552,end:32756},{name:"synth_sharp_E2",size:17735,start:32756,end:50491},{name:"synth_sharp_As2",size:17379,start:50491,end:67870},{name:"synth_sharp_E3",size:16141,start:67870,end:84011},{name:"synth_sharp_As3",size:15474,start:84011,end:99485},{name:"synth_sharp_E4",size:14232,start:99485,end:113717},{name:"synth_sharp_As4",size:14290,start:113717,end:128007},{name:"synth_sharp_E5",size:13392,start:128007,end:141399},{name:"synth_sharp_As5",size:13694,start:141399,end:155093}]}]},{instanceId:"load_synth_plucked",returnEvent:"",files:[{id:"file",name:"synth_plucked_E0"},{id:"file",name:"synth_plucked_As0"},{id:"file",name:"synth_plucked_E1"},{id:"file",name:"synth_plucked_As1"},{id:"file",name:"synth_plucked_E2"},{id:"file",name:"synth_plucked_As2"},{id:"file",name:"synth_plucked_E3"},{id:"file",name:"synth_plucked_As3"},{id:"file",name:"synth_plucked_E4"},{id:"file",name:"synth_plucked_As4"},{id:"file",name:"synth_plucked_E5"},{id:"file",name:"synth_plucked_As5"}],type:"assetController",id:"loadBin",triggers:["dmaf_ready"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_synth_plucked.ogg.bin",files:[{name:"synth_plucked_E0",size:7081,start:0,end:7081},{name:"synth_plucked_As0",size:7080,start:7081,end:14161},{name:"synth_plucked_E1",size:7030,start:14161,end:21191},{name:"synth_plucked_As1",size:7184,start:21191,end:28375},{name:"synth_plucked_E2",size:7124,start:28375,end:35499},{name:"synth_plucked_As2",size:7360,start:35499,end:42859},{name:"synth_plucked_E3",size:7329,start:42859,end:50188},{name:"synth_plucked_As3",size:7552,start:50188,end:57740},{name:"synth_plucked_E4",size:7771,start:57740,end:65511},{name:"synth_plucked_As4",size:7841,start:65511,end:73352},{name:"synth_plucked_E5",size:7880,start:73352,end:81232},{name:"synth_plucked_As5",size:8117,start:81232,end:89349}]},{format:".aac",path:"bin/load_synth_plucked.aac.bin",files:[{name:"synth_plucked_E0",size:3355,start:0,end:3355},{name:"synth_plucked_As0",size:3199,start:3355,end:6554},{name:"synth_plucked_E1",size:3389,start:6554,end:9943},{name:"synth_plucked_As1",size:3314,start:9943,end:13257},{name:"synth_plucked_E2",size:3178,start:13257,end:16435},{name:"synth_plucked_As2",size:3212,start:16435,end:19647},{name:"synth_plucked_E3",size:3329,start:19647,end:22976},{name:"synth_plucked_As3",size:3225,start:22976,end:26201},{name:"synth_plucked_E4",size:3399,start:26201,end:29600},{name:"synth_plucked_As4",size:3310,start:29600,end:32910},{name:"synth_plucked_E5",size:3213,start:32910,end:36123},{name:"synth_plucked_As5",size:3129,start:36123,end:39252}]}]},{instanceId:"load_strings",returnEvent:"",files:[{id:"file",name:"strings_E0"},{id:"file",name:"strings_As0"},{id:"file",name:"strings_E1"},{id:"file",name:"strings_As1"},{id:"file",name:"strings_E2"},{id:"file",name:"strings_As2"},{id:"file",name:"strings_E3"},{id:"file",name:"strings_As3"}],type:"assetController",id:"loadBin",triggers:["preload_assets"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_strings.ogg.bin",files:[{name:"strings_E0",size:54462,start:0,end:54462},{name:"strings_As0",size:54516,start:54462,end:108978},{name:"strings_E1",size:54464,start:108978,end:163442},{name:"strings_As1",size:54462,start:163442,end:217904},{name:"strings_E2",size:54404,start:217904,end:272308},{name:"strings_As2",size:54209,start:272308,end:326517},{name:"strings_E3",size:54261,start:326517,end:380778},{name:"strings_As3",size:54078,start:380778,end:434856}]},{format:".aac",path:"bin/load_strings.aac.bin",files:[{name:"strings_E0",size:54772,start:0,end:54772},{name:"strings_As0",size:51908,start:54772,end:106680},{name:"strings_E1",size:49643,start:106680,end:156323},{name:"strings_As1",size:52013,start:156323,end:208336},{name:"strings_E2",size:52380,start:208336,end:260716},{name:"strings_As2",size:50902,start:260716,end:311618},{name:"strings_E3",size:53754,start:311618,end:365372},{name:"strings_As3",size:54469,start:365372,end:419841}]}]},{instanceId:"load_synth_comp",returnEvent:"",files:[{id:"file",name:"synth_comp_E0"},{id:"file",name:"synth_comp_As0"},{id:"file",name:"synth_comp_E1"},{id:"file",name:"synth_comp_As1"},{id:"file",name:"synth_comp_E2"},{id:"file",name:"synth_comp_As2"},{id:"file",name:"synth_comp_E3"},{id:"file",name:"synth_comp_As3"},{id:"file",name:"synth_comp_E4"},{id:"file",name:"synth_comp_As4"},{id:"file",name:"synth_comp_E5"},{id:"file",name:"synth_comp_As5"}],type:"assetController",id:"loadBin",triggers:["preload_assets"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_synth_comp.ogg.bin",files:[{name:"synth_comp_E0",size:5699,start:0,end:5699},{name:"synth_comp_As0",size:5728,start:5699,end:11427},{name:"synth_comp_E1",size:5660,start:11427,end:17087},{name:"synth_comp_As1",size:5625,start:17087,end:22712},{name:"synth_comp_E2",size:5650,start:22712,end:28362},{name:"synth_comp_As2",size:5565,start:28362,end:33927},{name:"synth_comp_E3",size:5610,start:33927,end:39537},{name:"synth_comp_As3",size:5642,start:39537,end:45179},{name:"synth_comp_E4",size:5625,start:45179,end:50804},{name:"synth_comp_As4",size:5595,start:50804,end:56399},{name:"synth_comp_E5",size:5539,start:56399,end:61938},{name:"synth_comp_As5",size:5552,start:61938,end:67490}]},{format:".aac",path:"bin/load_synth_comp.aac.bin",files:[{name:"synth_comp_E0",size:1757,start:0,end:1757},{name:"synth_comp_As0",size:1822,start:1757,end:3579},{name:"synth_comp_E1",size:1621,start:3579,end:5200},{name:"synth_comp_As1",size:1541,start:5200,end:6741},{name:"synth_comp_E2",size:1504,start:6741,end:8245},{name:"synth_comp_As2",size:1591,start:8245,end:9836},{name:"synth_comp_E3",size:1550,start:9836,end:11386},{name:"synth_comp_As3",size:1660,start:11386,end:13046},{name:"synth_comp_E4",size:1623,start:13046,end:14669},{name:"synth_comp_As4",size:1728,start:14669,end:16397},{name:"synth_comp_E5",size:1754,start:16397,end:18151},{name:"synth_comp_As5",size:1738,start:18151,end:19889}]}]},{instanceId:"load_synth_pop",returnEvent:"",files:[{id:"file",name:"synth_pop_E0"},{id:"file",name:"synth_pop_As0"},{id:"file",name:"synth_pop_E1"},{id:"file",name:"synth_pop_As1"},{id:"file",name:"synth_pop_E2"},{id:"file",name:"synth_pop_As2"},{id:"file",name:"synth_pop_E3"},{id:"file",name:"synth_pop_As3"},{id:"file",name:"synth_pop_E4"},{id:"file",name:"synth_pop_As4"},{id:"file",name:"synth_pop_E5"},{id:"file",name:"synth_pop_As5"}],type:"assetController",id:"loadBin",triggers:["preload_assets"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_synth_pop.ogg.bin",files:[{name:"synth_pop_E0",size:5691,start:0,end:5691},{name:"synth_pop_As0",size:5650,start:5691,end:11341},{name:"synth_pop_E1",size:5636,start:11341,end:16977},{name:"synth_pop_As1",size:5659,start:16977,end:22636},{name:"synth_pop_E2",size:5665,start:22636,end:28301},{name:"synth_pop_As2",size:5610,start:28301,end:33911},{name:"synth_pop_E3",size:5597,start:33911,end:39508},{name:"synth_pop_As3",size:5535,start:39508,end:45043},{name:"synth_pop_E4",size:5623,start:45043,end:50666},{name:"synth_pop_As4",size:5597,start:50666,end:56263},{name:"synth_pop_E5",size:5573,start:56263,end:61836},{name:"synth_pop_As5",size:5602,start:61836,end:67438}]},{format:".aac",path:"bin/load_synth_pop.aac.bin",files:[{name:"synth_pop_E0",size:1751,start:0,end:1751},{name:"synth_pop_As0",size:1697,start:1751,end:3448},{name:"synth_pop_E1",size:1859,start:3448,end:5307},{name:"synth_pop_As1",size:1729,start:5307,end:7036},{name:"synth_pop_E2",size:1728,start:7036,end:8764},{name:"synth_pop_As2",size:1698,start:8764,end:10462},{name:"synth_pop_E3",size:1584,start:10462,end:12046},{name:"synth_pop_As3",size:1526,start:12046,end:13572},{name:"synth_pop_E4",size:1585,start:13572,end:15157},{name:"synth_pop_As4",size:1619,start:15157,end:16776},{name:"synth_pop_E5",size:1665,start:16776,end:18441},{name:"synth_pop_As5",size:1505,start:18441,end:19946}]}]},{instanceId:"load_synth_perc",returnEvent:"",files:[{id:"file",name:"synth_perc_E0"},{id:"file",name:"synth_perc_As0"},{id:"file",name:"synth_perc_E1"},{id:"file",name:"synth_perc_As1"},{id:"file",name:"synth_perc_E2"},{id:"file",name:"synth_perc_As2"},{id:"file",name:"synth_perc_E3"},{id:"file",name:"synth_perc_As3"},{id:"file",name:"synth_perc_E4"},{id:"file",name:"synth_perc_As4"},{id:"file",name:"synth_perc_E5"},{id:"file",name:"synth_perc_As5"}],type:"assetController",id:"loadBin",triggers:["preload_assets"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_synth_perc.ogg.bin",files:[{name:"synth_perc_E0",size:5778,start:0,end:5778},{name:"synth_perc_As0",size:5863,start:5778,end:11641},{name:"synth_perc_E1",size:5840,start:11641,end:17481},{name:"synth_perc_As1",size:5772,start:17481,end:23253},{name:"synth_perc_E2",size:5798,start:23253,end:29051},{name:"synth_perc_As2",size:5845,start:29051,end:34896},{name:"synth_perc_E3",size:5839,start:34896,end:40735},{name:"synth_perc_As3",size:5741,start:40735,end:46476},{name:"synth_perc_E4",size:5821,start:46476,end:52297},{name:"synth_perc_As4",size:5768,start:52297,end:58065},{name:"synth_perc_E5",size:5823,start:58065,end:63888},{name:"synth_perc_As5",size:5693,start:63888,end:69581}]},{format:".aac",path:"bin/load_synth_perc.aac.bin",files:[{name:"synth_perc_E0",size:1655,start:0,end:1655},{name:"synth_perc_As0",size:1663,start:1655,end:3318},{name:"synth_perc_E1",size:1666,start:3318,end:4984},{name:"synth_perc_As1",size:1724,start:4984,end:6708},{name:"synth_perc_E2",size:1614,start:6708,end:8322},{name:"synth_perc_As2",size:1594,start:8322,end:9916},{name:"synth_perc_E3",size:1618,start:9916,end:11534},{name:"synth_perc_As3",size:1624,start:11534,end:13158},{name:"synth_perc_E4",size:1669,start:13158,end:14827},{name:"synth_perc_As4",size:1670,start:14827,end:16497},{name:"synth_perc_E5",size:1649,start:16497,end:18146},{name:"synth_perc_As5",size:1588,start:18146,end:19734}]}]},{instanceId:"load_kraftwerk",returnEvent:"",files:[{id:"file",name:"kick"},{id:"file",name:"snare"},{id:"file",name:"hit"},{id:"file",name:"hihat"},{id:"file",name:"tapp_l"},{id:"file",name:"tapp_r"},{id:"file",name:"battery_1"},{id:"file",name:"battery_2"},{id:"file",name:"battery_3"},{id:"file",name:"battery_4"},{id:"file",name:"battery_5"},{id:"file",name:"battery_6"},{id:"file",name:"battery_7"},{id:"file",name:"battery_8"},{id:"file",name:"battery_9"}],type:"assetController",id:"loadBin",triggers:["preload_assets"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_kraftwerk.ogg.bin",files:[{name:"kick",size:5095,start:0,end:5095},{name:"snare",size:10017,start:5095,end:15112},{name:"hit",size:7920,start:15112,end:23032},{name:"hihat",size:6673,start:23032,end:29705},{name:"tapp_l",size:10737,start:29705,end:40442},{name:"tapp_r",size:10799,start:40442,end:51241},{name:"battery_1",size:6902,start:51241,end:58143},{name:"battery_2",size:6919,start:58143,end:65062},{name:"battery_3",size:6873,start:65062,end:71935},{name:"battery_4",size:6804,start:71935,end:78739},{name:"battery_5",size:6596,start:78739,end:85335},{name:"battery_6",size:6913,start:85335,end:92248},{name:"battery_7",size:7071,start:92248,end:99319},{name:"battery_8",size:6502,start:99319,end:105821},{name:"battery_9",size:6778,start:105821,end:112599}]},{format:".aac",path:"bin/load_kraftwerk.aac.bin",files:[{name:"kick",size:1714,start:0,end:1714},{name:"snare",size:4730,start:1714,end:6444},{name:"hit",size:3003,start:6444,end:9447},{name:"hihat",size:2780,start:9447,end:12227},{name:"tapp_l",size:7511,start:12227,end:19738},{name:"tapp_r",size:7431,start:19738,end:27169},{name:"battery_1",size:2834,start:27169,end:30003},{name:"battery_2",size:3303,start:30003,end:33306},{name:"battery_3",size:3329,start:33306,end:36635},{name:"battery_4",size:2311,start:36635,end:38946},{name:"battery_5",size:2234,start:38946,end:41180},{name:"battery_6",size:2420,start:41180,end:43600},{name:"battery_7",size:3959,start:43600,end:47559},{name:"battery_8",size:3151,start:47559,end:50710},{name:"battery_9",size:2617,start:50710,end:53327}]}]},{instanceId:"load_stab",returnEvent:"",files:[{id:"file",name:"stab_E0"},{id:"file",name:"stab_As0"},{id:"file",name:"stab_E1"},{id:"file",name:"stab_As1"},{id:"file",name:"stab_E2"},{id:"file",name:"stab_As2"},{id:"file",name:"stab_E3"},{id:"file",name:"stab_As3"},{id:"file",name:"stab_E4"},{id:"file",name:"stab_As4"},{id:"file",name:"stab_E5"},{id:"file",name:"stab_As5"}],type:"assetController",id:"loadBin",triggers:["preload_assets"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_stab.ogg.bin",files:[{name:"stab_E0",size:6888,start:0,end:6888},{name:"stab_As0",size:6984,start:6888,end:13872},{name:"stab_E1",size:7015,start:13872,end:20887},{name:"stab_As1",size:7027,start:20887,end:27914},{name:"stab_E2",size:6929,start:27914,end:34843},{name:"stab_As2",size:7015,start:34843,end:41858},{name:"stab_E3",size:7010,start:41858,end:48868},{name:"stab_As3",size:6952,start:48868,end:55820},{name:"stab_E4",size:6935,start:55820,end:62755},{name:"stab_As4",size:6875,start:62755,end:69630},{name:"stab_E5",size:6914,start:69630,end:76544},{name:"stab_As5",size:6905,start:76544,end:83449}]},{format:".aac",path:"bin/load_stab.aac.bin",files:[{name:"stab_E0",size:3580,start:0,end:3580},{name:"stab_As0",size:3622,start:3580,end:7202},{name:"stab_E1",size:3512,start:7202,end:10714},{name:"stab_As1",size:3632,start:10714,end:14346},{name:"stab_E2",size:3420,start:14346,end:17766},{name:"stab_As2",size:3443,start:17766,end:21209},{name:"stab_E3",size:3485,start:21209,end:24694},{name:"stab_As3",size:3360,start:24694,end:28054},{name:"stab_E4",size:3271,start:28054,end:31325},{name:"stab_As4",size:3490,start:31325,end:34815},{name:"stab_E5",size:3309,start:34815,end:38124},{name:"stab_As5",size:3239,start:38124,end:41363}]}]},{instanceId:"load_bass",returnEvent:"",files:[{id:"file",name:"bass_E0"},{id:"file",name:"bass_As0"},{id:"file",name:"bass_E1"},{id:"file",name:"bass_As1"},{id:"file",name:"bass_E2"},{id:"file",name:"bass_As2"},{id:"file",name:"bass_E3"},{id:"file",name:"bass_As3"},{id:"file",name:"bass_E4"},{id:"file",name:"bass_As4"},{id:"file",name:"bass_E5"},{id:"file",name:"bass_As5"}],type:"assetController",id:"loadBin",triggers:["preload_assets"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_bass.ogg.bin",files:[{name:"bass_E0",size:8534,start:0,end:8534},{name:"bass_As0",size:8560,start:8534,end:17094},{name:"bass_E1",size:8561,start:17094,end:25655},{name:"bass_As1",size:8403,start:25655,end:34058},{name:"bass_E2",size:8466,start:34058,end:42524},{name:"bass_As2",size:8586,start:42524,end:51110},{name:"bass_E3",size:8559,start:51110,end:59669},{name:"bass_As3",size:8594,start:59669,end:68263},{name:"bass_E4",size:8570,start:68263,end:76833},{name:"bass_As4",size:8581,start:76833,end:85414},{name:"bass_E5",size:8512,start:85414,end:93926},{name:"bass_As5",size:8543,start:93926,end:102469}]},{format:".aac",path:"bin/load_bass.aac.bin",files:[{name:"bass_E0",size:4943,start:0,end:4943},{name:"bass_As0",size:4655,start:4943,end:9598},{name:"bass_E1",size:4816,start:9598,end:14414},{name:"bass_As1",size:4499,start:14414,end:18913},{name:"bass_E2",size:4684,start:18913,end:23597},{name:"bass_As2",size:4476,start:23597,end:28073},{name:"bass_E3",size:5013,start:28073,end:33086},{name:"bass_As3",size:4557,start:33086,end:37643},{name:"bass_E4",size:4499,start:37643,end:42142},{name:"bass_As4",size:4302,start:42142,end:46444},{name:"bass_E5",size:4202,start:46444,end:50646},{name:"bass_As5",size:4376,start:50646,end:55022}]}]},{instanceId:"load_bass_comp",returnEvent:"",files:[{id:"file",name:"bass_comp_E-1"},{id:"file",name:"bass_comp_As-1"},{id:"file",name:"bass_comp_E0"},{id:"file",name:"bass_comp_As0"},{id:"file",name:"bass_comp_E1"},{id:"file",name:"bass_comp_As1"},{id:"file",name:"bass_comp_E2"},{id:"file",name:"bass_comp_As2"},{id:"file",name:"bass_comp_E3"},{id:"file",name:"bass_comp_As3"},{id:"file",name:"bass_comp_E4"},{id:"file",name:"bass_comp_As4"}],type:"assetController",id:"loadBin",triggers:["dmaf_ready"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_bass_comp.ogg.bin",files:[{name:"bass_comp_E-1",size:24459,start:0,end:24459},{name:"bass_comp_As-1",size:24508,start:24459,end:48967},{name:"bass_comp_E0",size:24460,start:48967,end:73427},{name:"bass_comp_As0",size:24472,start:73427,end:97899},{name:"bass_comp_E1",size:24563,start:97899,end:122462},{name:"bass_comp_As1",size:24573,start:122462,end:147035},{name:"bass_comp_E2",size:24746,start:147035,end:171781},{name:"bass_comp_As2",size:25158,start:171781,end:196939},{name:"bass_comp_E3",size:24638,start:196939,end:221577},{name:"bass_comp_As3",size:24661,start:221577,end:246238},{name:"bass_comp_E4",size:25434,start:246238,end:271672},{name:"bass_comp_As4",size:24757,start:271672,end:296429}]},{format:".aac",path:"bin/load_bass_comp.aac.bin",files:[{name:"bass_comp_E-1",size:20407,start:0,end:20407},{name:"bass_comp_As-1",size:20685,start:20407,end:41092},{name:"bass_comp_E0",size:20274,start:41092,end:61366},{name:"bass_comp_As0",size:20326,start:61366,end:81692},{name:"bass_comp_E1",size:20284,start:81692,end:101976},{name:"bass_comp_As1",size:19401,start:101976,end:121377},{name:"bass_comp_E2",size:18975,start:121377,end:140352},{name:"bass_comp_As2",size:17635,start:140352,end:157987},{name:"bass_comp_E3",size:17315,start:157987,end:175302},{name:"bass_comp_As3",size:17032,start:175302,end:192334},{name:"bass_comp_E4",size:16725,start:192334,end:209059},{name:"bass_comp_As4",size:16193,start:209059,end:225252}]}]},{instanceId:"load_fx",returnEvent:"",files:[{id:"file",name:"click_1"},{id:"file",name:"click_2"},{id:"file",name:"swish_fast_1"},{id:"file",name:"swish_fast_2"},{id:"file",name:"swish_fast_3"},{id:"file",name:"swish_medium_1"},{id:"file",name:"item_up_E3"},{id:"file",name:"paddlefx_E0"},{id:"file",name:"paddlefx_G0"},{id:"file",name:"paddlefx_B0"},{id:"file",name:"paddlefx_E1"},{id:"file",name:"paddlefx_G1"},{id:"file",name:"paddlefx_B1"},{id:"file",name:"paddlefx_E2"},{id:"file",name:"paddlefx_G2"},{id:"file",name:"paddlefx_B2"},{id:"file",name:"paddlefx_E3"},{id:"file",name:"paddlefx_G3"},{id:"file",name:"paddlefx_B3"},{id:"file",name:"item_activate_E1"},{id:"file",name:"item_activate_B1"},{id:"file",name:"item_activate_E2"},{id:"file",name:"shield_hit_E3"},{id:"file",name:"shield_hit_B3"},{id:"file",name:"shield_hit_E4"},{id:"file",name:"shield_hit_B4"},{id:"file",name:"loose_round_buzz"},{id:"file",name:"win_round_buzz"},{id:"file",name:"timebomb_explosion"},{id:"file",name:"force_field_4453"},{id:"file",name:"bulletproof_shield"},{id:"file",name:"shield_up"}],type:"assetController",id:"loadBin",triggers:["dmaf_ready"],delay:0,multi:!1,formats:[".ogg",".aac"],headers:[{format:".ogg",path:"bin/load_fx.ogg.bin",files:[{name:"click_1",size:4455,start:0,end:4455},{name:"click_2",size:4988,start:4455,end:9443},{name:"swish_fast_1",size:6549,start:9443,end:15992},{name:"swish_fast_2",size:7755,start:15992,end:23747},{name:"swish_fast_3",size:7207,start:23747,end:30954},{name:"swish_medium_1",size:6614,start:30954,end:37568},{name:"item_up_E3",size:7820,start:37568,end:45388},{name:"paddlefx_E0",size:5063,start:45388,end:50451},{name:"paddlefx_G0",size:5033,start:50451,end:55484},{name:"paddlefx_B0",size:5044,start:55484,end:60528},{name:"paddlefx_E1",size:4991,start:60528,end:65519},{name:"paddlefx_G1",size:4981,start:65519,end:70500},{name:"paddlefx_B1",size:4979,start:70500,end:75479},{name:"paddlefx_E2",size:4994,start:75479,end:80473},{name:"paddlefx_G2",size:4982,start:80473,end:85455},{name:"paddlefx_B2",size:5021,start:85455,end:90476},{name:"paddlefx_E3",size:5010,start:90476,end:95486},{name:"paddlefx_G3",size:5008,start:95486,end:100494},{name:"paddlefx_B3",size:5032,start:100494,end:105526},{name:"item_activate_E1",size:7415,start:105526,end:112941},{name:"item_activate_B1",size:7426,start:112941,end:120367},{name:"item_activate_E2",size:7461,start:120367,end:127828},{name:"shield_hit_E3",size:6592,start:127828,end:134420},{name:"shield_hit_B3",size:6673,start:134420,end:141093},{name:"shield_hit_E4",size:6806,start:141093,end:147899},{name:"shield_hit_B4",size:6946,start:147899,end:154845},{name:"loose_round_buzz",size:13918,start:154845,end:168763},{name:"win_round_buzz",size:17676,start:168763,end:186439},{name:"timebomb_explosion",size:10523,start:186439,end:196962},{name:"force_field_4453",size:53586,start:196962,end:250548},{name:"bulletproof_shield",size:9221,start:250548,end:259769},{name:"shield_up",size:9759,start:259769,end:269528}]},{format:".aac",path:"bin/load_fx.aac.bin",files:[{name:"click_1",size:611,start:0,end:611},{name:"click_2",size:1599,start:611,end:2210},{name:"swish_fast_1",size:2327,start:2210,end:4537},{name:"swish_fast_2",size:3181,start:4537,end:7718},{name:"swish_fast_3",size:2732,start:7718,end:10450},{name:"swish_medium_1",size:3078,start:10450,end:13528},{name:"item_up_E3",size:3276,start:13528,end:16804},{name:"paddlefx_E0",size:1180,start:16804,end:17984},{name:"paddlefx_G0",size:1175,start:17984,end:19159},{name:"paddlefx_B0",size:1170,start:19159,end:20329},{name:"paddlefx_E1",size:1176,start:20329,end:21505},{name:"paddlefx_G1",size:1143,start:21505,end:22648},{name:"paddlefx_B1",size:1131,start:22648,end:23779},{name:"paddlefx_E2",size:1161,start:23779,end:24940},{name:"paddlefx_G2",size:1141,start:24940,end:26081},{name:"paddlefx_B2",size:1123,start:26081,end:27204},{name:"paddlefx_E3",size:1172,start:27204,end:28376},{name:"paddlefx_G3",size:1218,start:28376,end:29594},{name:"paddlefx_B3",size:1233,start:29594,end:30827},{name:"item_activate_E1",size:2859,start:30827,end:33686},{name:"item_activate_B1",size:2807,start:33686,end:36493},{name:"item_activate_E2",size:2865,start:36493,end:39358},{name:"shield_hit_E3",size:3037,start:39358,end:42395},{name:"shield_hit_B3",size:2991,start:42395,end:45386},{name:"shield_hit_E4",size:3068,start:45386,end:48454},{name:"shield_hit_B4",size:2908,start:48454,end:51362},{name:"loose_round_buzz",size:9314,start:51362,end:60676},{name:"win_round_buzz",size:11718,start:60676,end:72394},{name:"timebomb_explosion",size:5262,start:72394,end:77656},{name:"force_field_4453",size:43152,start:77656,end:120808},{name:"bulletproof_shield",size:4254,start:120808,end:125062},{name:"shield_up",size:4831,start:125062,end:129893}]}]},{instanceId:"load_sampleMaps",returnEvent:"",files:[{id:"file",name:"samplemaps"}],type:"assetController",id:"loadSampleMap",triggers:["preload_assets"],delay:0,multi:!1},{instanceId:"midiLoader",returnEvent:"",files:[{id:"file",type:"beatPattern",name:"music"},{id:"file",type:"timePattern",name:"fx"}],type:"assetController",id:"loadMIDI",triggers:["preload_assets"],delay:0,multi:!1},{instanceId:"master_bus",out:["master"],volume:-2,pan:0,audioNodes:[{id:"compressor",active:!0,threshold:-3,makeupGain:0,attack:0,release:0,ratio:20,knee:0,automakeup:!1}],type:"audioRouter",id:"audioBus",triggers:["init_routing"],delay:0,multi:!1},{instanceId:"active_bus",out:["master_bus"],volume:0,pan:0,audioNodes:[],type:"audioRouter",id:"audioBus",triggers:["init_routing"],delay:0,multi:!1},{instanceId:"two_player_bus",out:["active_bus"],volume:0,pan:0,audioNodes:[],type:"audioRouter",id:"audioBus",triggers:["init_routing"],delay:0,multi:!1},{instanceId:"pause_bus",out:["two_player_bus"],volume:0,pan:0,audioNodes:[],type:"audioRouter",id:"audioBus",triggers:["init_routing"],delay:0,multi:!1},{instanceId:"master_mute",targetType:"audioRouter",targets:["master_bus"],targetParameter:"volume",value:-80,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["sound_off"],multi:!1},{instanceId:"master_unmute",targetType:"audioRouter",targets:["master_bus"],targetParameter:"volume",value:0,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["sound_on"],multi:!1},{instanceId:"active_mute",targetType:"audioRouter",targets:["active_bus"],targetParameter:"volume",value:-80,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["inactive"],multi:!1},{instanceId:"active_unmute",targetType:"audioRouter",targets:["active_bus"],targetParameter:"volume",value:0,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["active"],multi:!1},{instanceId:"pause_mute",targetType:"audioRouter",targets:["two_player_bus"],targetParameter:"volume",value:-10,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["microphone_on"],multi:!1},{instanceId:"pause_unmute",targetType:"audioRouter",targets:["two_player_bus"],targetParameter:"volume",value:0,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["microphone_off"],multi:!1},{instanceId:"pause_mute",targetType:"audioRouter",targets:["pause_bus"],targetParameter:"volume",value:-80,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["pause"],multi:!1},{instanceId:"pause_unmute",targetType:"audioRouter",targets:["pause_bus"],targetParameter:"volume",value:0,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["unpause"],multi:!1},{instanceId:"CheckMobile",type:"customCode",id:"customCode",triggers:["init_routing","splash_screen","info_screen"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"start",tempo:126,beatsPerBar:16}],type:"player",id:"beatPatternPlayer",triggers:["init_beatpatternplayer"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["splash_bass_filter"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["splash_bass"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["splash_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["splash_stab"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["splash_strings"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["splash_synth_comp"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["splash_synth_perc"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["splash_synth_pop"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"}],type:"player",id:"beatPatternPlayer",triggers:["splash_screen_music"],delay:0,multi:!1},{instanceId:"gameover_music_delayed",reTrig:0,eventMaps:[{id:"eventMap","in":["gameover_screen"],out:"gameover_screen_delayed",delay:400}],type:"eventProcessor",id:"eventMapper",clearPending:!1,dispatch:"ALWAYS",triggers:["gameover_screen"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"start",tempo:126,beatsPerBar:16},{id:"add",patternId:["game_over_bass"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_bass_comp"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_bass_filter"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_lead_a"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_lead_b"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_stab"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_strings"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_synth_comp"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_synth_perc"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["game_over_synth_pop"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"}],type:"player",id:"beatPatternPlayer",triggers:["gameover_screen_delayed"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"start",tempo:126,beatsPerBar:16},{id:"add",patternId:["info_bass_filter"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["info_stab"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"},{id:"add",patternId:["info_synth_pop"],channel:"main",songPosition:"NEXT_BAR",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BAR"}],type:"player",id:"beatPatternPlayer",triggers:["info_screen_music"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["level_bass"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_bass_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_bass_filter"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_synth_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_synth_perc"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_synth_pop"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_stab"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["paddle_dizzy","fireball_over","fog_over","multiball_over","deathball_over","mirroredcontrols_over","timebomb_over","ghostball_over"],delay:0,multi:!1},{instanceId:"handle_long",reTrig:100,eventMaps:[{id:"eventMap","in":["countdown_init"],out:"countdown_long_start",delay:500},{id:"eventMap","in":["countdown_init"],out:"stop_immediate",delay:0}],type:"eventProcessor",id:"eventMapper",clearPending:!1,dispatch:"ALWAYS",triggers:["countdown_init"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"stop",songPosition:"ASAP"}],type:"player",id:"beatPatternPlayer",triggers:["stop_immediate"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"start",tempo:126,beatsPerBar:16},{id:"add",patternId:["countlong_bass_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["countlong_stab"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["countlong_synth_perc"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["countlong_synth_plucked"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["countlong_synth_sharp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"beatEvent",songPosition:"NEXT_BEAT+1.6",returnEvent:"gameplay_init"}],type:"player",id:"beatPatternPlayer",triggers:["countdown_long_start"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["level_bass"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_bass_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_bass_filter"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_synth_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_synth_perc"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_synth_pop"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["level_stab"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["gameplay_init"],delay:0,multi:!1},{instanceId:"handle_short",reTrig:0,eventMaps:[{id:"eventMap","in":["countdown_short"],out:"countdown_short_start",delay:600},{id:"eventMap","in":["countdown_short"],out:"gameplay_init",delay:3450}],type:"eventProcessor",id:"eventMapper",clearPending:!1,dispatch:"ALWAYS",triggers:["countdown_short"],delay:0,multi:!1},{instanceId:"delay",reTrig:100,eventMaps:[{id:"eventMap","in":["user_won_round"],out:"round_end_stop_music",delay:0},{id:"eventMap","in":["user_lost_round"],out:"round_end_stop_music",delay:0},{id:"eventMap","in":["user_won_match"],out:"round_end_stop_music",delay:0},{id:"eventMap","in":["user_lost_match"],out:"round_end_stop_music",delay:0}],type:"eventProcessor",id:"eventMapper",clearPending:!1,dispatch:"ALWAYS",triggers:["user_lost_match","user_won_round","user_lost_round","user_won_match"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"stop",songPosition:"ASAP"}],type:"player",id:"beatPatternPlayer",triggers:["round_end_stop_music"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"start",tempo:126,beatsPerBar:16},{id:"add",patternId:["countshort_bass_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["countshort_stab"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["countshort_synth_perc"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["countshort_synth_plucked"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["countshort_synth_sharp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"FIRST_BEAT",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["countdown_short_start"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["fog_bass"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fog_bass_filter"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fog_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fog_stab"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fog_synth_funk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fog_synth_perc"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fog_synth_pop"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fog_synth_sharp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fog_synth_warm"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["fog_activate"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["mirrored_bass"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["mirrored_bass_filter"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["mirrored_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["mirrored_lead_a"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["mirrored_lead_b"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["mirrored_stab"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["mirrored_synth_funk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["mirrored_synth_plucked"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["mirrored_synth_sharp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["mirroredcontrols_activate"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["multi_bass"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_bass_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_bass_filter"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_stab"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_synth_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_synth_funk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_synth_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_synth_plucked"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_synth_pop"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_synth_sharp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["multi_synth_perc"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["multiball_activate"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["ghost_bass"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["ghost_bass_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["ghost_bass_filter"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["ghost_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["ghost_stab"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["ghost_synth_funk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["ghost_synth_pop"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["ghost_synth_warm"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["ghost_strings"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["ghostball_activate"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["time_bass"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["time_bass_filter"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["time_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["time_stab"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["time_synth_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["time_synth_perc"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["time_synth_plucked"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["time_synth_pop"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["time_synth_sharp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["time_synth_warm"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["timebomb_activate"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["death_bass"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["death_bass_filter"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["death_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["death_lead_a"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["death_synth_pop"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["death_synth_plucked"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["death_lead_b"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["death_bass_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["death_synth_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["deathball_activate"],delay:0,multi:!1},{instanceId:"main",flowItems:[{id:"add",patternId:["fire_bass_filter"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_bass_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_bass"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_synth_comp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_synth_funk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_synth_perc"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_synth_plucked"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_synth_pop"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_synth_sharp"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_synth_warm"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"},{id:"add",patternId:["fire_dm_kraftwerk"],channel:"main",songPosition:"NEXT_BEAT",patternPosition:"SYNC",clearPending:!1,replaceActive:!1,setAsCurrent:!1,loop:!0,loopLength:128,clearPosition:"NEXT_BEAT"}],type:"player",id:"beatPatternPlayer",triggers:["fireball_activate"],delay:0,multi:!1},{instanceId:"transpose_mapper",reTrig:100,eventMaps:[{id:"eventMap","in":["user_won_round"],out:"transpose_midi",delay:2e3},{id:"eventMap","in":["user_lost_round"],out:"transpose_midi",delay:2e3},{id:"eventMap","in":["user_lost_match"],out:"transpose_midi",delay:399},{id:"eventMap","in":["user_lost_match"],out:"transpose_midi_reset",delay:400},{id:"eventMap","in":["countdown_init"],out:"transpose_midi_reset",delay:0}],type:"eventProcessor",id:"eventMapper",clearPending:!1,dispatch:"ALWAYS",triggers:["gameover_screen","user_won_round","user_lost_round","countdown_init","user_lost_match"],delay:0,multi:!1},{instanceId:"LevelTransposer",type:"customCode",id:"customCode",triggers:["init_routing","transpose_midi","transpose_midi_reset"],delay:0,multi:!1},{instanceId:"midi_transposer",_dynamicValues:[{key:"transpose",string:"customCode:LevelTransposer:transposeValue"}],transpose:0,dynamic:0,quantize:"",scale:"off",root:"",customScale:"",type:"midiProcessor",id:"midiProcessor",onChange:!1,triggers:["item_activate","shield_up","item_up","paddle_fx","shield_hit","bass_filter","lead_a","lead_b","strings","synth_funk","synth_plucked","synth_sharp","synth_warm","bass","bass_comp","stab","synth_comp","synth_perc","synth_pop"],delay:0,multi:!1},{instanceId:"delay_effect_sounds",reTrig:0,eventMaps:[{id:"eventMap","in":["pause"],out:"pause_delayed",delay:400},{id:"eventMap","in":["unpause"],out:"unpause_delayed",delay:40},{id:"eventMap","in":["info_screen"],out:"info_screen_delayed",delay:400},{id:"eventMap","in":["gameover_sign_in"],out:"gameover_sign_in_delayed",delay:400}],type:"eventProcessor",id:"eventMapper",clearPending:!1,dispatch:"ALWAYS",triggers:["pause","info_screen","unpause"],delay:0,multi:!1},{delay:0,instanceId:"win_round_buzz",soundFile:"win_round_buzz",volume:0,loop:-1,reTrig:-1,returnEvent:"",returnEventTime:0,preListen:0,bus:"pause_bus",timingCorrection:"PLAY",type:"sound",id:"genericPlay",multiSuffix:"",pan:0,priority:!1,fadeIn:0,triggers:["user_won_round"],multi:!1},{delay:0,instanceId:"loose_round_buzz",soundFile:"loose_round_buzz",volume:0,loop:-1,reTrig:-1,returnEvent:"",returnEventTime:0,preListen:0,bus:"pause_bus",timingCorrection:"PLAY",type:"sound",id:"genericPlay",multiSuffix:"",pan:0,priority:!1,fadeIn:0,triggers:["user_lost_round","user_lost_match"],multi:!1},{delay:0,instanceId:"swish_small",soundFiles:["swish_fast_1","swish_fast_2","swish_fast_3"],generator:"ROUND_ROBIN",volume:0,reTrig:-1,returnEvent:"",returnEventTime:0,bus:"my_bus",timingCorrection:"PLAY",type:"sound",id:"stepPlay",pan:0,preListen:0,priority:!1,fadeIn:0,triggers:["friend_accept","info_screen_delayed","friend_screen","friend_arrived","friend_waiting","gameover_sign_in_delayed","gameover_sign_out","unpause_delayed","pause_delayed"],multi:!1},{delay:0,instanceId:"swish_medium",soundFile:"swish_medium_1",volume:0,loop:-1,reTrig:-1,returnEvent:"",returnEventTime:0,preListen:0,bus:"pause_bus",timingCorrection:"PLAY",type:"sound",id:"genericPlay",multiSuffix:"",pan:0,priority:!1,fadeIn:0,triggers:["friend_accept_out","info_screen_out","friend_screen_out","friend_waiting_out","friend_left"],multi:!1},{delay:0,instanceId:"click_1",soundFile:"click_1",volume:-2,loop:-1,reTrig:-1,returnEvent:"",returnEventTime:0,preListen:0,bus:"pause_bus",timingCorrection:"PLAY",type:"sound",id:"genericPlay",multiSuffix:"",pan:0,priority:!1,fadeIn:0,triggers:["button_down"],multi:!1},{delay:0,instanceId:"click_2",soundFile:"click_2",volume:0,loop:-1,reTrig:-1,returnEvent:"",returnEventTime:0,preListen:0,bus:"pause_bus",timingCorrection:"PLAY",type:"sound",id:"genericPlay",multiSuffix:"",pan:0,priority:!1,fadeIn:0,triggers:["share_click","text_button_down","small_button_down"],multi:!1},{delay:0,instanceId:"bulletproof_activate",soundFile:"bulletproof_shield",volume:0,loop:-1,reTrig:-1,returnEvent:"",returnEventTime:0,preListen:0,bus:"pause_bus",timingCorrection:"PLAY",type:"sound",id:"genericPlay",multiSuffix:"",pan:0,priority:!1,fadeIn:0,triggers:["bulletproof_activate"],multi:!1},{delay:0,instanceId:"timebomb_over",soundFile:"timebomb_explosion",volume:5,loop:-1,reTrig:-1,returnEvent:"",returnEventTime:0,preListen:0,bus:"pause_bus",timingCorrection:"PLAY",type:"sound",id:"genericPlay",multiSuffix:"",pan:0,priority:!1,fadeIn:0,triggers:["timebomb_over","paddle_dizzy"],multi:!1},{delay:0,instanceId:"force_field",soundFile:"force_field_4453",volume:5,loop:4453,reTrig:-1,returnEvent:"",returnEventTime:0,preListen:0,bus:"pause_bus",timingCorrection:"PLAY",type:"sound",id:"genericPlay",multiSuffix:"",pan:0,priority:!1,fadeIn:0,triggers:["force_show"],multi:!1},{delay:0,targets:["force_field"],type:"sound",id:"soundStop",instanceId:"",multiSuffix:"",fadeOut:0,triggers:["force_hide","user_won_round","user_lost_round","user_won_match","user_lost_match"],multi:!1},{instanceId:"extras_timpattern_mapper",reTrig:0,eventMaps:[{id:"eventMap","in":["extralife_activate"],out:"extralife_activate_paddle_fx.START",delay:0},{id:"eventMap","in":["extralife_activate"],out:"extralife_activate_bass_comp.START",delay:0},{id:"eventMap","in":["opponent_paddle_grow"],out:"grow_bass_comp.START",delay:0},{id:"eventMap","in":["opponent_paddle_grow"],out:"grow_paddle_fx.START",delay:0},{id:"eventMap","in":["opponent_paddle_shrink"],out:"shrink_bass_comp.START",delay:0},{id:"eventMap","in":["opponent_paddle_shrink"],out:"shrink_paddle_fx.START",delay:0},{id:"eventMap","in":["user_paddle_grow"],out:"grow_bass_comp.START",delay:0},{id:"eventMap","in":["user_paddle_grow"],out:"grow_paddle_fx.START",delay:0},{id:"eventMap","in":["user_paddle_shrink"],out:"shrink_bass_comp.START",delay:0},{id:"eventMap","in":["user_paddle_shrink"],out:"shrink_paddle_fx.START",delay:0},{id:"eventMap","in":["paddle_dizzy"],out:"paddle_dizzy_paddle_fx.START",delay:0},{id:"eventMap","in":["paddle_dizzy"],out:"paddle_dizzy_bass_comp.START",delay:0},{id:"eventMap","in":["paddle_dizzy"],out:"paddle_dizzy_dm_kraftwerk.START",delay:0},{id:"eventMap","in":["opponent_screen_explode"],out:"screen_explode_paddle_fx.START",delay:0},{id:"eventMap","in":["opponent_screen_explode"],out:"screen_explode_bass_comp.START",delay:0},{id:"eventMap","in":["opponent_screen_heal_start"],out:"screen_rebuild_paddle_fx.START",delay:0},{id:"eventMap","in":["opponent_screen_heal_start"],out:"screen_rebuild_bass_comp.START",delay:0},{id:"eventMap","in":["user_won_round"],out:"win_paddle_fx.START",delay:0},{id:"eventMap","in":["user_won_round"],out:"win_bass_comp.START",delay:0},{id:"eventMap","in":["user_won_round"],out:"win_synth_comp.START",delay:0},{id:"eventMap","in":["user_won_match"],out:"win_paddle_fx.START",delay:0},{id:"eventMap","in":["user_won_match"],out:"win_bass_comp.START",delay:0},{id:"eventMap","in":["user_won_match"],out:"win_synth_comp.START",delay:0},{id:"eventMap","in":["user_lost_round"],out:"loose_paddle_fx.START",delay:0},{id:"eventMap","in":["user_lost_round"],out:"loose_bass_comp.START",delay:0},{id:"eventMap","in":["user_lost_round"],out:"loose_synth_comp.START",delay:0},{id:"eventMap","in":["user_lost_match"],out:"loose_paddle_fx.START",delay:0},{id:"eventMap","in":["user_lost_match"],out:"loose_bass_comp.START",delay:0},{id:"eventMap","in":["user_lost_match"],out:"loose_synth_comp.START",delay:0}],type:"eventProcessor",id:"eventMapper",clearPending:!1,dispatch:"ALWAYS",triggers:["user_won_match","user_lost_match","user_lost_round","user_won_round","opponent_screen_heal_start","opponent_screen_explode","extralife_activate","opponent_paddle_grow","opponent_paddle_shrink","user_paddle_grow","user_paddle_shrink","paddle_dizzy"],delay:0,multi:!1},{instanceId:"time_player",behavior:"DEFAULT",type:"player",id:"timePatternPlayer",triggers:["loose_synth_comp.START","loose_bass_comp.START","loose_paddle_fx.START","win_synth_comp.START","win_bass_comp.START","win_paddle_fx.START","screen_rebuild_bass_comp.START","screen_rebuild_paddle_fx.START","screen_explode_paddle_fx.START","screen_explode_bass_comp.START","extralife_activate_paddle_fx.START","extralife_activate_bass_comp.START","grow_bass_comp.START","shrink_bass_comp.START","grow_paddle_fx.START","shrink_paddle_fx.START","paddle_dizzy_dm_kraftwerk.START","paddle_dizzy_paddle_fx.START","paddle_dizzy_bass_comp.START"],delay:0,multi:!1},{instanceId:"makeFx",reTrig:0,noteMaps:[{id:"noteMap",triggerIn:["bulletproof_activate"],triggerOut:"item_activate",note:"E1",velocity:127},{id:"noteMap",triggerIn:["bulletproof_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["deathball_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["extralife_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["fireball_activate"],triggerOut:"item_activate",note:"E1",velocity:127},{id:"noteMap",triggerIn:["fireball_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["fog_activate"],triggerOut:"item_activate",note:"E1",velocity:127},{id:"noteMap",triggerIn:["fog_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["ghostball_activate"],triggerOut:"item_activate",note:"E1",velocity:127},{id:"noteMap",triggerIn:["ghostball_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["laser_activate"],triggerOut:"item_activate",note:"E1",velocity:127},{id:"noteMap",triggerIn:["laser_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["laser_fire"],triggerOut:"shield_hit",note:"E5",velocity:127},{id:"noteMap",triggerIn:["mirroredcontrols_activate"],triggerOut:"item_activate",note:"E1",velocity:127},{id:"noteMap",triggerIn:["mirroredcontrols_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["multiball_activate"],triggerOut:"item_activate",note:"E1",velocity:127},{id:"noteMap",triggerIn:["multiball_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["timebomb_activate"],triggerOut:"item_activate",note:"E1",velocity:127},{id:"noteMap",triggerIn:["timebomb_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["opponent_score_hit"],triggerOut:"shield_hit",note:"E3",velocity:90},{id:"noteMap",triggerIn:["opponent_shield_hit"],triggerOut:"shield_hit",note:"E3",velocity:110},{id:"noteMap",triggerIn:["paddleresize_spawn"],triggerOut:"item_up",note:"E3",velocity:127},{id:"noteMap",triggerIn:["paddleresize_activate"],triggerOut:"item_activate",note:"E1",velocity:127},{id:"noteMap",triggerIn:["user_score_hit"],triggerOut:"shield_hit",note:"E3",velocity:90},{id:"noteMap",triggerIn:["user_shield_hit"],triggerOut:"shield_hit",note:"E3",velocity:110}],type:"midiProcessor",id:"makeNote",triggers:["shields_reset_up","extralife_activate","paddleresize_activate","paddleresize_spawn","user_score_hit","opponent_score_hit","laser_fire","laser_spawn","laser_activate","extralife_spawn","mirroredcontrols_activate","mirroredcontrols_spawn","fireball_activate","fireball_spawn","bulletproof_activate","bulletproof_spawn","multiball_activate","multiball_spawn","timebomb_activate","timebomb_spawn","ghostball_activate","ghostball_spawn","deathball_spawn","extralife_activate","user_shield_hit","opponent_shield_hit","opponent_score_hit","fog_spawn","fog_activate"],delay:0,multi:!1},{instanceId:"bounce_mapper",reTrig:30,noteMaps:[{id:"noteMap",triggerIn:["opponent_paddle_hit"],triggerOut:"paddle_fx",note:"E2",velocity:127},{id:"noteMap",triggerIn:["user_paddle_hit"],triggerOut:"paddle_fx",note:"E1",velocity:127},{id:"noteMap",triggerIn:["obstacle_hit"],triggerOut:"paddle_fx",note:"E3",velocity:127},{id:"noteMap",triggerIn:["wall_hit"],triggerOut:"paddle_fx",note:"B2",velocity:127}],type:"midiProcessor",id:"makeNote",triggers:["opponent_paddle_hit","user_paddle_hit","obstacle_hit","wall_hit"],delay:0,multi:!1},{instanceId:"shields_up_mapper",reTrig:500,noteMaps:[{id:"noteMap",triggerIn:["shields_reset_up"],triggerOut:"shield_up",note:"E3",velocity:127}],type:"midiProcessor",id:"makeNote",triggers:["shields_reset_up"],delay:0,multi:!1},{instanceId:"multi",ignoreNoteOff:!0,bus:"pause_bus",volume:0,loop:!1,ampAttack:1,ampDecay:1,ampRelease:260,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"shield_up",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["shield_up"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:1,loop:!1,ampAttack:1,ampDecay:1,ampRelease:260,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"paddle_fx",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["paddle_fx"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!0,bus:"pause_bus",volume:-1,loop:!1,ampAttack:1,ampDecay:1,ampRelease:260,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"item_activate",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["item_activate"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:1,loop:!1,ampAttack:1,ampDecay:1,ampRelease:260,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"shield_hit",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["shield_hit"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!0,bus:"pause_bus",volume:1,loop:!1,ampAttack:1,ampDecay:1,ampRelease:260,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"item_up",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["item_up"],delay:0,multi:!0},{instanceId:"muteInst",targetType:"synth",targets:["multi"],targetParameter:"volume",multiSuffix:"_mute",value:-80,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["bass_filter_mute","lead_a_mute","lead_b_mute","strings_mute","synth_funk_mute","synth_plucked_mute","synth_sharp_mute","synth_warm_mute","dm_kraftwerk_mute","bass_mute","bass_comp_mute","stab_mute","synth_comp_mute","synth_perc_mute","synth_pop_mute"],multi:!1},{instanceId:"unmuteInst",targetType:"synth",targets:["multi"],targetParameter:"volume",multiSuffix:"_unmute",value:-5,duration:100,type:"parameterProcessor",id:"transform",delay:0,curve:0,triggers:["bass_filter_unmute","lead_a_unmute","lead_b_unmute","strings_unmute","synth_funk_unmute","synth_plucked_unmute","synth_sharp_unmute","synth_warm_unmute","dm_kraftwerk_unmute","bass_unmute","bass_comp_unmute","stab_unmute","synth_comp_unmute","synth_perc_unmute","synth_pop_unmute"],multi:!1},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:1,loop:!1,ampAttack:1,ampDecay:100,ampRelease:300,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"bass_filter_low",velocityLow:0,velocityHigh:50},{id:"sampleMap",name:"bass_filter_mid",velocityLow:51,velocityHigh:100},{id:"sampleMap",name:"bass_filter_hi",velocityLow:101,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["bass_filter"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:-2,loop:!1,ampAttack:1,ampDecay:50,ampRelease:100,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["bass_comp"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!0,bus:"pause_bus",volume:-2,loop:!1,ampAttack:1,ampDecay:1,ampRelease:220,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["bass"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!0,bus:"pause_bus",volume:-4.5,loop:!1,ampAttack:1,ampDecay:50,ampRelease:100,ampSustain:1,ampVelocityRatio:0,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["stab"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:-6,loop:!1,ampAttack:1,ampDecay:1,ampRelease:220,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["strings"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!0,bus:"pause_bus",volume:-1,loop:!1,ampAttack:1,ampDecay:1,ampRelease:50,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["synth_comp"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:-5.5,loop:!1,ampAttack:1,ampDecay:50,ampRelease:300,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["synth_funk"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!0,bus:"pause_bus",volume:-13,loop:!1,ampAttack:1,ampDecay:1,ampRelease:50,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["synth_perc"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!0,bus:"pause_bus",volume:0,loop:!1,ampAttack:1,ampDecay:50,ampRelease:100,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["synth_plucked"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!0,bus:"pause_bus",volume:-2,loop:!1,ampAttack:1,ampDecay:1,ampRelease:50,ampSustain:1,ampVelocityRatio:0,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["synth_pop"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:-7.5,loop:!1,ampAttack:1,ampDecay:1,ampRelease:100,ampSustain:1,ampVelocityRatio:0,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["synth_sharp"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:-13,loop:!1,ampAttack:1,ampDecay:1,ampRelease:200,ampSustain:1,ampVelocityRatio:0,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["synth_warm"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:-8,loop:!1,ampAttack:1,ampDecay:1,ampRelease:500,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["lead_a"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:-9,loop:!1,ampAttack:1,ampDecay:1,ampRelease:400,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["lead_b"],delay:0,multi:!0},{instanceId:"multi",ignoreNoteOff:!1,bus:"pause_bus",volume:-3,loop:!1,ampAttack:1,ampDecay:50,ampRelease:200,ampSustain:1,ampVelocityRatio:1,filterOn:!1,audioNodes:[],sampleMapGroups:[{id:"sampleMapGroup",name:"map1",sampleMaps:[{id:"sampleMap",name:"multi",velocityLow:0,velocityHigh:127}]}],type:"synth",id:"sampler",filterAttack:0,filterDecay:0,filterRelease:0,filterSustain:1,filterVelocityRatio:1,filterQ:1e-4,filterFrequency:0,filterGain:0,triggers:["dm_kraftwerk"],delay:0,multi:!0}]}
}),dmaf("AudioNodes",["DMAF","Utils","Instance","events","Assets"],function(e,t,n,a,i){function s(e){return(Math.exp(e)-Math.exp(-e))/(Math.exp(e)+Math.exp(-e))}function r(e){return 0===e?1:Math.abs(e)/e}function o(e,t){var n,a,i=0,s=0,r=0,o=0;return n=e.toExponential().match(/^.\.?(.*)e(.+)$/),i=parseInt(n[2],10)-(n[1]+"").length,n=t.toExponential().match(/^.\.?(.*)e(.+)$/),s=parseInt(n[2],10)-(n[1]+"").length,s>i&&(i=s),a=e%t,-100>i||i>20?(r=Math.round(Math.log(a)/Math.log(10)),o=Math.pow(10,r),(a/o).toFixed(r-i)*o):parseFloat(a.toFixed(-i))}var l=Object.create(null),d={lowpass:0,highpass:1,bandpass:2,lowshelf:3,highshelf:4,peaking:5,notch:6,allpass:7},c={32:.125,"16T":.16666666666666666,"32D":.1875,16:.25,"8T":.3333333333333333,"16D":.375,8:.5,"4T":.6666666666666666,"8D":.75,4:1,"2T":1.3333333333333333,"4D":1.5,2:2,"2D":3,1:4},p=function(e,t){e.value=t},u=Object.create(n,{activate:{writable:!0,value:function(e){this.input.disconnect(),this._activated=e,e?(this.input.connect(this.activateNode),this.activateCallback&&this.activateCallback(e)):this.input.connect(this.output)}},bypass:{get:function(){return this._activated},set:function(e){this.activate(e)}},active:{get:function(){return this._activated},set:function(e){this.activate(e)}},connect:{value:function(e){this.output.connect(e)}},connectInOrder:{value:function(e){for(var t=e.length-1;t--;)e[t].connect(e[t+1])}}});return l.createRecursive=function(e,n){for(var a,i,s=[],r=0;n.length>r;r++)a=n[r],i=new(l[t.capitalize(a.id)])(a),a.active?i.activate(!0):i.activate(!1),s.push(i),e.connect(i.input),e=i;return s},l.Filter=function(t){this.input=e.context.createGainNode(),this.filter=this.activateNode=e.context.createBiquadFilter(),this.output=e.context.createGainNode(),this.filter.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.filter,this.frequency=t.frequency,this.Q=t.resonance,this.filterType=t.filterType,this.gain=t.gain},l.Filter.prototype=Object.create(u,{name:{value:"Filter"},filterType:{enumerable:!0,get:function(){return this._filterType},set:function(e){this._filterType=e,this.filter.type=d[this._filterType.toLowerCase()]}},Q:{enumerable:!0,get:function(){return this.filter.Q},set:function(e){this.filter.Q.value=e}},gain:{enumerable:!0,get:function(){return this.filter.gain},set:function(e){this.filter.gain.value=e}},frequency:{enumerable:!0,get:function(){return this.filter.frequency},set:function(e){this.filter.frequency.value=e}}}),l.Cabinet=function(t){this.input=e.context.createGainNode(),this.activateNode=e.context.createGainNode(),this.convolver=this.newConvolver(t.impulsePath),this.makeupNode=e.context.createGainNode(),this.output=e.context.createGainNode(),this.activateNode.connect(this.convolver.input),this.convolver.output.connect(this.makeupNode),this.makeupNode.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.cabinet,this.makeupGain=t.makeupGain,this.convolver.activate(!0)},l.Cabinet.prototype=Object.create(u,{name:{value:"Cabinet"},makeupGain:{enumerable:!0,get:function(){return this.makeupNode.gain},set:function(e){this.makeupNode.gain.value=e}},newConvolver:{value:function(e){return new l.Convolver({impulse:e,dryLevel:0,wetLevel:1})}}}),l.Chorus=function(t){this.input=e.context.createGainNode(),this.attenuator=this.activateNode=e.context.createGainNode(),this.splitter=e.context.createChannelSplitter(2),this.delayL=e.context.createDelayNode(),this.delayR=e.context.createDelayNode(),this.feedbackGainNodeLR=e.context.createGainNode(),this.feedbackGainNodeRL=e.context.createGainNode(),this.merger=e.context.createChannelMerger(2),this.output=e.context.createGainNode(),this.lfoL=new l.LFO({target:this.delayL.delayTime,callback:p}),this.lfoR=new l.LFO({target:this.delayR.delayTime,callback:p}),this.input.connect(this.attenuator),this.attenuator.connect(this.output),this.attenuator.connect(this.splitter),this.splitter.connect(this.delayL,0),this.splitter.connect(this.delayR,1),this.delayL.connect(this.feedbackGainNodeLR),this.delayR.connect(this.feedbackGainNodeRL),this.feedbackGainNodeLR.connect(this.delayR),this.feedbackGainNodeRL.connect(this.delayL),this.delayL.connect(this.merger,0,0),this.delayR.connect(this.merger,0,1),this.merger.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.chorus,this.feedback=t.feedback,this.rate=t.rate,this.delay=t.delay,this.depth=t.depth,this.lfoR.phase=Math.PI/2,this.attenuator.gain.value=.6934,this.lfoL.activate(!0),this.lfoR.activate(!0)},l.Chorus.prototype=Object.create(u,{name:{value:"Chorus"},delay:{enumerable:!0,get:function(){return this._delay},set:function(e){this._delay=2e-4*Math.pow(10,2*e),this.lfoL.offset=this._delay,this.lfoR.offset=this._delay,this._depth=this._depth}},depth:{enumerable:!0,get:function(){return this._depth},set:function(e){this._depth=e,this.lfoL.oscillation=this._depth*this._delay,this.lfoR.oscillation=this._depth*this._delay}},feedback:{enumerable:!0,get:function(){return this._feedback},set:function(e){this._feedback=e,this.feedbackGainNodeLR.gain.value=this._feedback,this.feedbackGainNodeRL.gain.value=this._feedback}},rate:{enumerable:!0,get:function(){return this._rate},set:function(e){this._rate=e,this.lfoL._frequency=this._rate,this.lfoR._frequency=this._rate}}}),l.Compressor=function(t){this.input=e.context.createGainNode(),this.compNode=this.activateNode=e.context.createDynamicsCompressor(),this.makeupNode=e.context.createGainNode(),this.output=e.context.createGainNode(),this.compNode.connect(this.makeupNode),this.makeupNode.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.compressor,this.automakeup=t.automakeup,this.makeupGain=t.makeupGain,this.threshold=t.threshold,this.release=t.release,this.attack=t.attack,this.ratio=t.ratio,this.knee=t.knee},l.Compressor.prototype=Object.create(u,{name:{value:"Compressor"},computeMakeup:{value:function(){var e=4,t=this.compNode;return-(t.threshold.value-t.threshold.value/t.ratio.value)/e}},automakeup:{enumerable:!0,get:function(){return this._automakeup},set:function(e){this._automakeup=e,this._automakeup&&(this.makeupGain=this.computeMakeup())}},threshold:{enumerable:!0,get:function(){return this.compNode.threshold},set:function(e){this.compNode.threshold.value=e,this._automakeup&&(this.makeupGain=this.computeMakeup())}},ratio:{enumerable:!0,get:function(){return this.compNode.ratio},set:function(e){this.compNode.ratio.value=e,this._automakeup&&(this.makeupGain=this.computeMakeup())}},knee:{enumerable:!0,get:function(){return this.compNode.knee},set:function(e){this.compNode.knee.value=e,this._automakeup&&(this.makeupGain=this.computeMakeup())}},attack:{enumerable:!0,get:function(){return this.compNode.attack},set:function(e){this.compNode.attack.value=e/1e3}},release:{enumerable:!0,get:function(){return this.compNode.release},set:function(e){this.compNode.release=e/1e3}},makeupGain:{enumerable:!0,get:function(){return this.makeupNode.gain},set:function(e){var n=e;this.makeupNode.gain.value=t.dbToWAVolume(n)}}}),l.Convolver=function(t){this.input=e.context.createGainNode(),this.activateNode=e.context.createGainNode(),this.convolver=e.context.createConvolver(),this.dry=e.context.createGainNode(),this.filterLow=e.context.createBiquadFilter(),this.filterHigh=e.context.createBiquadFilter(),this.wet=e.context.createGainNode(),this.output=e.context.createGainNode(),this.activateNode.connect(this.filterLow),this.activateNode.connect(this.dry),this.filterLow.connect(this.filterHigh),this.filterHigh.connect(this.convolver),this.convolver.connect(this.wet),this.wet.connect(this.output),this.dry.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.convolver,this.dryLevel=t.dryLevel,this.wetLevel=t.wetLevel,this.highCut=t.highCut,this.buffer=t.impulse,this.lowCut=t.lowCut,this.level=t.level,this.filterHigh.type=0,this.filterLow.type=1},l.Convolver.prototype=Object.create(u,{name:{value:"Convolver"},lowCut:{get:function(){return this.filterLow.frequency},set:function(e){this.filterLow.frequency.value=e}},highCut:{get:function(){return this.filterHigh.frequency},set:function(e){this.filterHigh.frequency.value=e}},level:{get:function(){return this.output.gain},set:function(e){this.output.gain.value=e}},dryLevel:{get:function(){return this.dry.gain},set:function(e){this.dry.gain.value=e}},wetLevel:{get:function(){return this.wet.gain},set:function(e){this.wet.gain.value=e,this.wet.gain=e}},buffer:{enumerable:!1,get:function(){return this.convolver.buffer},set:function(e){this.convolver.buffer=i.getAsset("buffer",e)}}}),l.Delay=function(t){this.input=e.context.createGainNode(),this.activateNode=e.context.createGainNode(),this.dry=e.context.createGainNode(),this.wet=e.context.createGainNode(),this.filter=e.context.createBiquadFilter(),this.delay=e.context.createDelayNode(),this.feedbackNode=e.context.createGainNode(),this.output=e.context.createGainNode(),this.activateNode.connect(this.delay),this.activateNode.connect(this.dry),this.delay.connect(this.filter),this.filter.connect(this.feedbackNode),this.feedbackNode.connect(this.delay),this.feedbackNode.connect(this.wet),this.wet.connect(this.output),this.dry.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.delay,this.tempoSync=t.tempoSync,this.tempoSync&&(this.subdivision=t.subdivision),this.delayTime=t.delayTime,this.feedback=t.feedback,this.wetLevel=t.wetLevel,this.dryLevel=t.dryLevel,this.cutoff=t.cutoff,this.filter.type=1},l.Delay.prototype=Object.create(u,{name:{value:"Delay"},tempoListener:{value:function(e){this.tempo=e,this.delayTime=this.tempo}},tempoSync:{get:function(){return this._tempoSync},set:function(t){if(t&&"string"==typeof t){var n=e.getInstance("player:"+t);this.tempo=n?n.tempo:90,this._tempoSync=t,dmaf.addEventListener("tempo_"+this._tempoSync,this.tempoListener.bind(this))}else this._tempoSync=!1}},subdivision:{get:function(){return this._subdivision},set:function(e){this._subdivision=e}},tempo:{get:function(){return this._tempo},set:function(e){this._tempo=e}},delayTime:{enumerable:!0,get:function(){return this.delay.delayTime},set:function(e){this.delay.delayTime.value=this._tempoSync?60*c[this.subdivision]/this.tempo:e/1e3}},wetLevel:{enumerable:!0,get:function(){return this.wet.gain},set:function(e){this.wet.gain.value=e}},dryLevel:{enumerable:!0,get:function(){return this.dry.gain},set:function(e){this.dry.gain.value=e}},feedback:{enumerable:!0,get:function(){return this.feedbackNode.gain},set:function(e){this.feedbackNode.gain.value=e}},cutoff:{enumerable:!0,get:function(){return this.filter.frequency},set:function(e){this.filter.frequency.value=e}}}),l.EnvelopeFollower=function(t){this.input=e.context.createGainNode(),this.jsNode=this.output=e.context.createJavaScriptNode(this.buffersize,1,1),this.input.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.envelopeFollower,this.attackTime=t.attackTime,this.releaseTime=t.releaseTime,this._envelope=0,this.target=t.target,this.callback=t.callback},l.EnvelopeFollower.prototype=Object.create(u,{name:{value:"EnvelopeFollower"},buffersize:{value:256},envelope:{value:0},sampleRate:{value:44100},attackTime:{enumerable:!0,get:function(){return this._attackTime},set:function(e){this._attackTime=e,this._attackC=Math.exp(-1/this._attackTime*this.sampleRate/this.buffersize)}},releaseTime:{enumerable:!0,get:function(){return this._releaseTime},set:function(e){this._releaseTime=e,this._releaseC=Math.exp(-1/this._releaseTime*this.sampleRate/this.buffersize)}},callback:{get:function(){return this._callback},set:function(e){this._callback=e}},target:{get:function(){return this._target},set:function(e){this._target=e}},activate:{value:function(t){this.activated=t,t?(this.jsNode.connect(e.context.destination),this.jsNode.onaudioprocess=this.returnCompute(this)):(this.jsNode.disconnect(),this.jsNode.onaudioprocess=null)}},returnCompute:{value:function(e){return function(t){e.compute(t)}}},compute:{value:function(e){var t,n,a,i,s=e.inputBuffer.getChannelData(0).length,r=e.inputBuffer.numberOfChannels;if(n=a=0,r>1)for(i=0;s>i;++i)for(;r>n;++n)t=e.inputBuffer.getChannelData(n)[i],a+=t*t/r;else for(i=0;s>i;++i)t=e.inputBuffer.getChannelData(0)[i],a+=t*t;a=Math.sqrt(a),a>this._envelope?(this._envelope*=this._attackC,this._envelope+=(1-this._attackC)*a):(this._envelope*=this._releaseC,this._envelope+=(1-this._releaseC)*a),this._callback(this._target,this._envelope)}}}),l.Equalizer=function(){function t(t){this._defaults=e.Settings.descriptors.type.audioNode.equalizer,this.nbands=t.bands.length;for(var n=0,a=this._nbands;a>n;n++);this.input=e.context.createGainNode(),this.output=e.context.createGainNode(),this.activateNode=e.context.createGainNode()}return t}(),l.Equalizer.prototype=Object.create(u,{name:{value:"Equalizer"},propertySearch:{value:/:bypass|:type|:frequency|:gain|:q/i}}),l.LFO=function(){function t(t){this.output=e.context.createJavaScriptNode(256,1,1),this.activateNode=e.context.destination,this.defaults=e.Settings.descriptors.type.audioNode.lfo,this.type=t.type,this.frequency=t.frequency,this.offset=t.offset,this.oscillation=t.oscillation,this.phase=t.phase,this.target=t.target,this.output.onaudioprocess=this.callback(t.callback)}return t.prototype=Object.create(u,{name:{value:"LFO"},bufferSize:{value:256},sampleRate:{value:44100},type:{enumerable:!0,get:function(){return this._type},set:function(e){this._type=e}},frequency:{get:function(){return this._frequency},set:function(e){this._frequency=e,this._phaseInc=2*Math.PI*this._frequency*this.bufferSize/this.sampleRate}},offset:{get:function(){return this._offset},set:function(e){this._offset=e}},oscillation:{get:function(){return this._oscillation},set:function(e){this._oscillation=e}},phase:{get:function(){return this._phase},set:function(e){this._phase=e}},target:{get:function(){return this._target},set:function(e){this._target=e}},activate:{value:function(t){this._activated=t,t?this.output.connect(e.context.destination):this.output.disconnect(e.context.destination)}},callback:{value:function(e){var t=this;return function(){t._phase+=t._phaseInc,t._phase>2*Math.PI&&(t._phase=0),e(t._target,t._offset+t._oscillation*Math.sin(t._phase))}}}}),t}(),l.Overdrive=function(t){this.input=e.context.createGainNode(),this.activateNode=e.context.createGainNode(),this.inputDrive=e.context.createGainNode(),this.waveshaper=e.context.createWaveShaper(),this.outputDrive=e.context.createGainNode(),this.output=e.context.createGainNode(),this.activateNode.connect(this.inputDrive),this.inputDrive.connect(this.waveshaper),this.waveshaper.connect(this.outputDrive),this.outputDrive.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.overdrive,this.ws_table=new Float32Array(this.k_nSamples),this.drive=t.drive,this.outputGain=t.outputGain,this.curveAmount=t.curveAmount,this.algorithm=t.algorithmIndex},l.Overdrive.prototype=Object.create(u,{name:{value:"Overdrive"},k_nSamples:{value:8192},drive:{get:function(){return this.inputDrive.gain},set:function(e){this._drive=e}},curveAmount:{get:function(){return this._curveAmount},set:function(e){this._curveAmount=e,void 0===this._algorithmIndex&&(this._algorithmIndex=0),this.waveshaperAlgorithms[this._algorithmIndex](this._curveAmount,this.k_nSamples,this.ws_table),this.waveshaper.curve=this.ws_table}},outputGain:{get:function(){return this.outputDrive.gain},set:function(e){var n=e;this._outputGain=t.dbToWAVolume(n)}},algorithm:{get:function(){return this._algorithmIndex},set:function(e){this._algorithmIndex=e,this.curveAmount=this._curveAmount}},waveshaperAlgorithms:{value:[function(e,t,n){var a,i,s=2*e/(1-e);for(a=0;t>a;a++)i=2*a/t-1,n[a]=(1+s)*i/(1+s*Math.abs(i))},function(e,t,n){var a,i,r;for(a=0;t>a;a++)i=2*a/t-1,r=(.5*Math.pow(i+1.4,2)-1)*r>=0?5.8:1.2,n[a]=s(r)},function(e,t,n){var a,i,r,o=1-e;for(a=0;t>a;a++)i=2*a/t-1,r=0>i?-Math.pow(Math.abs(i),o+.04):Math.pow(i,o),n[a]=s(2*r)},function(e,t,n){var a,i,s,o,l=1-e>.99?.99:1-e;for(a=0;t>a;a++)i=2*a/t-1,o=Math.abs(i),l>o?s=o:o>l?s=l+(o-l)/(1+Math.pow((o-l)/(1-l),2)):o>1&&(s=o),n[a]=r(i)*s*(1/((l+1)/2))},function(e,t,n){var a,i;for(a=0;t>a;a++)i=2*a/t-1,n[a]=-.08905>i?-3/4*(1-Math.pow(1-(Math.abs(i)-.032857),12)+1/3*(Math.abs(i)-.032847))+.01:i>=-.08905&&.320018>i?-6.153*i*i+3.9375*i:.630035},function(e,t,n){var a,i,s=2+Math.round(14*e),r=Math.round(Math.pow(2,s-1));for(a=0;t>a;a++)i=2*a/t-1,n[a]=Math.round(i*r)/r}]}}),l.Panner=function(t){this.input=e.context.createGainNode(),this.splitter=e.context.createChannelSplitter(2),this.lGain=e.context.createGainNode(),this.rGain=e.context.createGainNode(),this.merger=e.context.createChannelMerger(2),this.output=e.context.createGainNode(),this.input.connect(this.splitter),this.splitter.connect(this.lGain,0),this.splitter.connect(this.rGain,1),this.lGain.connect(this.merger,0,0),this.rGain.connect(this.merger,0,1),this.merger.connect(this.output),this.pan=t.value},l.Panner.prototype=Object.create(u,{pan:{get:function(){return this._value},set:function(e){var t=(e+100)/200;this._value=e,this.lGain.gain.value=Math.cos(t*Math.PI/2),this.rGain.gain.value=Math.sin(t*Math.PI/2)}}}),l.PingPongDelay=function(t){this.input=e.context.createGainNode(),this.activateNode=e.context.createGainNode(),this.dry=e.context.createGainNode(),this.splitter=e.context.createChannelSplitter(2),this.toMono=e.context.createGainNode(),this.wet=e.context.createGainNode(),this.feedbackNode=e.context.createGainNode(),this.delayL=new l.Delay(t),this.delayR=new l.Delay(t),this.merger=e.context.createChannelMerger(),this.output=e.context.createGainNode(),this.activateNode.connect(this.dry),this.activateNode.connect(this.splitter),this.splitter.connect(this.toMono,0,0),this.splitter.connect(this.toMono,1,0),this.toMono.connect(this.wet),this.wet.connect(this.delayL.delay),this.feedbackNode.connect(this.delayL.delay),this.delayL.delay.connect(this.delayR.delay),this.delayR.delay.connect(this.feedbackNode),this.delayL.delay.connect(this.merger,0,0),this.delayR.delay.connect(this.merger,0,1),this.dry.connect(this.output),this.merger.connect(this.output),this.delayL.feedback=0,this.delayR.feedback=0,this.delayL.wetLevel=1,this.delayR.wetLevel=1,this.delayL.dryLevel=0,this.delayR.dryLevel=0,this.defaults=e.Settings.descriptors.type.audioNode.pingPongDelay,this.cutoff=t.cutoff,this.tempoSync=t.tempoSync,this.tempoSync&&(this.subdivision=t.subdivision),this.delayTime=t.delayTime,this.feedback=t.feedback,this.wetLevel=t.wetLevel,this.dryLevel=t.dryLevel},l.PingPongDelay.prototype=Object.create(u,{name:{value:"PingPongDelay"},tempoSync:{get:function(){return this._tempoSync},set:function(t){var n=t?e.getInstance("player",t):null;this.tempo=n?n.tempo:120,this._tempoSync=t,this.delayL.tempoSync=this._tempoSync,this.delayR.tempoSync=this._tempoSync}},tempo:{get:function(){return this._tempo},set:function(e){this._tempo=e,this.delayL.tempo=e,this.delayR.tempo=e}},subdivision:{get:function(){return this._subdivision},set:function(e){this._subdivision=e,this.delayL.subdivision=this._subdivision,this.delayR.subdivision=this._subdivision}},delayTime:{enumerable:!0,get:function(){return this._delayTime},set:function(e){this._tempoSync?(this._delayTime=60*c[this.subdivision]/this.tempo,this.delayL.delayTime=this._delayTime,this.delayR.delayTime=this._delayTime):(this._delayTime=e/1e3,this.delayL.delayTime=e,this.delayR.delayTime=e)}},wetLevel:{enumerable:!0,get:function(){return this.wet.gain},set:function(e){this.wet.gain.value=e}},dryLevel:{enumerable:!0,get:function(){return this.dry.gain},set:function(e){this.dry.gain.value=e}},feedback:{enumerable:!0,get:function(){return this.feedbackNode.gain},set:function(e){this.feedbackNode.gain.value=e}},cutoff:{enumerable:!0,get:function(){return this.delayL.filter.frequency},set:function(e){this.delayL.filter.frequency.value=e,this.delayR.filter.frequency.value=e}}}),l.Phaser=function(t){this.input=e.context.createGainNode(),this.splitter=this.activateNode=e.context.createChannelSplitter(2),this.filtersL=[],this.filtersR=[],this.feedbackGainNodeL=e.context.createGainNode(),this.feedbackGainNodeR=e.context.createGainNode(),this.merger=e.context.createChannelMerger(2),this.filteredSignal=e.context.createGainNode(),this.output=e.context.createGainNode(),this.lfoL=new l.LFO({target:this.filtersL,callback:this.callback}),this.lfoR=new l.LFO({target:this.filtersR,callback:this.callback});for(var n=this.stage;n--;)this.filtersL[n]=e.context.createBiquadFilter(),this.filtersR[n]=e.context.createBiquadFilter(),this.filtersL[n].type=7,this.filtersR[n].type=7;this.input.connect(this.splitter),this.input.connect(this.output),this.splitter.connect(this.filtersL[0],0,0),this.splitter.connect(this.filtersR[0],1,0),this.connectInOrder(this.filtersL),this.connectInOrder(this.filtersR),this.filtersL[this.stage-1].connect(this.feedbackGainNodeL),this.filtersL[this.stage-1].connect(this.merger,0,0),this.filtersR[this.stage-1].connect(this.feedbackGainNodeR),this.filtersR[this.stage-1].connect(this.merger,0,1),this.feedbackGainNodeL.connect(this.filtersL[0]),this.feedbackGainNodeR.connect(this.filtersR[0]),this.merger.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.phaser,this.rate=t.rate,this.baseModulationFrequency=t.baseModulationFrequency,this.depth=t.depth,this.feedback=t.feedback,this.stereoPhase=t.stereoPhase,this.lfoL.activate(!0),this.lfoR.activate(!0)},l.Phaser.prototype=Object.create(u,{name:{value:"Phaser"},stage:{value:4},callback:{value:function(e,t){for(var n=0;4>n;n++)e[n].frequency.value=t}},depth:{enumerable:!0,get:function(){return this._depth},set:function(e){this._depth=e,this.lfoL.oscillation=this._baseModulationFrequency*this._depth,this.lfoR.oscillation=this._baseModulationFrequency*this._depth}},rate:{enumerable:!0,get:function(){return this._rate},set:function(e){this._rate=e,this.lfoL.frequency=this._rate,this.lfoR.frequency=this._rate}},baseModulationFrequency:{enumerable:!0,get:function(){return this._baseModulationFrequency},set:function(e){this._baseModulationFrequency=e,this.lfoL.offset=this._baseModulationFrequency,this.lfoR.offset=this._baseModulationFrequency}},feedback:{get:function(){return this._feedback},set:function(e){this._feedback=e,this.feedbackGainNodeL.gain.value=this._feedback,this.feedbackGainNodeR.gain.value=this._feedback}},stereoPhase:{get:function(){return this._stereoPhase},set:function(e){this._stereoPhase=e;var t=this.lfoL._phase+this._stereoPhase*Math.PI/180;t=o(t,2*Math.PI),this.lfoR._phase=t}}}),l.Tremolo=function(t){this.input=e.context.createGainNode(),this.splitter=this.activateNode=e.context.createChannelSplitter(2),this.amplitudeL=e.context.createGainNode(),this.amplitudeR=e.context.createGainNode(),this.merger=e.context.createChannelMerger(2),this.output=e.context.createGainNode(),this.lfoL=new l.LFO({target:this.amplitudeL.gain,callback:p}),this.lfoR=new l.LFO({target:this.amplitudeR.gain,callback:p}),this.input.connect(this.splitter),this.splitter.connect(this.amplitudeL,0),this.splitter.connect(this.amplitudeR,1),this.amplitudeL.connect(this.merger,0,0),this.amplitudeR.connect(this.merger,0,1),this.merger.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.tremolo,this.rate=t.rate,this.intensity=t.intensity,this.stereoPhase=t.stereoPhase,this.lfoL.offset=1-this.intensity/2,this.lfoR.offset=1-this.intensity/2,this.lfoL.phase=this.stereoPhase*Math.PI/180,this.lfoL.activate(!0),this.lfoR.activate(!0)},l.Tremolo.prototype=Object.create(u,{name:{value:"Tremolo"},intensity:{enumerable:!0,get:function(){return this._intensity},set:function(e){this._intensity=e,this.lfoL.offset=this._intensity/2,this.lfoR.offset=this._intensity/2,this.lfoL.oscillation=this._intensity,this.lfoR.oscillation=this._intensity}},rate:{enumerable:!0,get:function(){return this._rate},set:function(e){this._rate=e,this.lfoL.frequency=this._rate,this.lfoR.frequency=this._rate}},steroPhase:{enumerable:!0,get:function(){return this._rate},set:function(e){this._stereoPhase=e;var t=this.lfoL._phase+this._stereoPhase*Math.PI/180;t=o(t,2*Math.PI),this.lfoR.phase=t}}}),l.WahWah=function(t){this.input=e.context.createGainNode(),this.activateNode=e.context.createGainNode(),this.envelopeFollower=new l.EnvelopeFollower({target:this,callback:function(e,t){e.sweep=t}}),this.filterBp=e.context.createBiquadFilter(),this.filterPeaking=e.context.createBiquadFilter(),this.output=e.context.createGainNode(),this.activateNode.connect(this.filterBp),this.filterBp.connect(this.filterPeaking),this.filterPeaking.connect(this.output),this.defaults=e.Settings.descriptors.type.audioNode.wahWah,this.init(),this.automode=t.enableAutoMode,this.resonance=t.resonance,this.sensitivity=t.sensitivity,this.baseFrequency=t.baseModulationFrequency,this.excursionOctaves=t.excursionOctaves,this.sweep=t.sweep,this.envelopeFollower.activate(!0)},l.WahWah.prototype=Object.create(u,{name:{value:"WahWah"},activateCallback:{value:function(e){this.automode=e}},automode:{get:function(){return this._automode},set:function(e){this._automode=e,e?(this.activateNode.connect(this.envelopeFollower.input),this.envelopeFollower.activate(!0)):(this.envelopeFollower.activate(!1),this.activateNode.disconnect(),this.activateNode.connect(this.filterBp))}},sweep:{enumerable:!0,get:function(){return this._sweep.value},set:function(e){this._sweep=Math.pow(e>1?1:0>e?0:e,this._sensitivity),this.filterBp.frequency.value=this._baseFrequency+this._excursionFrequency*this._sweep,this.filterPeaking.frequency.value=this._baseFrequency+this._excursionFrequency*this._sweep}},baseFrequency:{enumerable:!0,get:function(){return this._baseFrequency},set:function(e){this._baseFrequency=50*Math.pow(10,2*e),this._excursionFrequency=Math.min(this.sampleRate/2,this.baseFrequency*Math.pow(2,this._excursionOctaves)),this.filterBp.frequency.value=this._baseFrequency+this._excursionFrequency*this._sweep,this.filterPeaking.frequency.value=this._baseFrequency+this._excursionFrequency*this._sweep}},excursionOctaves:{enumerable:!0,get:function(){return this._excursionOctaves},set:function(e){this._excursionOctaves=e,this._excursionFrequency=Math.min(this.sampleRate/2,this.baseFrequency*Math.pow(2,this._excursionOctaves)),this.filterBp.frequency.value=this._baseFrequency+this._excursionFrequency*this._sweep,this.filterPeaking.frequency.value=this._baseFrequency+this._excursionFrequency*this._sweep}},sensitivity:{enumerable:!0,get:function(){return this._sensitivity},set:function(e){this._sensitivity=e,this._sensitivity=Math.pow(10,this._sensitivity)}},resonance:{enumerable:!0,get:function(){return this._resonance},set:function(e){this._resonance=e,this.filterPeaking.Q=this._resonance}},init:{value:function(){var t,n,a=Object.keys(this.defaults);for(this.output.gain.value=5,this.filterPeaking.type=5,this.filterBp.type=2,this.filterPeaking.frequency.value=100,this.filterPeaking.gain.value=20,this.filterPeaking.Q.value=5,this.filterBp.frequency.value=100,this.filterBp.Q.value=1,this.sampleRate=e.context.sampleRate,t=0,n=a.length;n>t;t++)this[a[t]]=this.defaults[a[t]].value}}}),l}),dmaf("Action",["DMAF","Utils","events"],function(e,t,n){function a(a){function s(s,r,o){var l,d,c;if(r=r||1e3*e.context.currentTime,d=a.multi?s:a.instanceId,a.multiSuffix&&(d=d.replace(a.multiSuffix,"")),l=e.getInstance(a.type,d||"no_instance_id"))l._dynamicValues&&i(l);else{if(c=t.clone(a),l=e.createInstance(d,c),l.error)return;l._dynamicValues&&i(l),l.init(c)}dmaf.log&&n.dispatch("log:action:"+a.type+":"+a.id+":"+d,r,s),l?l.onAction(s,r+a.delay,o,a):n.dispatch("log:error","Action was unable to create a new instance")}return s}function i(n){t.each(n._dynamicValues,function(a,i){n[i.key]=t.verify(n.defaults[i.key],e.getInstanceProperty(i.string))})}return a}),dmaf("Instance",["Utils"],function(e){var t,n,a=/\:/;dmaf.hasContext&&(n=window.webkitAudioContext||window.AudioContext,t=Object.getPrototypeOf((new n).createGainNode().gain.constructor.prototype));var i={isDMAFInstance:!0,setInitProperties:function(t){return e.extend(t,this),this},init:function(){return this},onAction:function(){return this},returnChildInstance:function(e){var t,n,s,r,o;if(a.test(e)&&(t=e.split(a),t.length&&t.length>1))for(o=this,s=0,r=t.length;r>s;s++){if(n=t[s],o=o[n],"object"!=typeof o)return{instance:this,ref:e};if(i.isPrototypeOf(o))return t=t.slice(s+1).join(":"),o.returnChildInstance(t)}return{instance:this,ref:e}},setProperty:function(n,i,s,r){var o,l=this.returnChildInstance(n);return l.instance!==this?l.instance.setProperty(l.ref,i,s,r):a.test(n)?(console.error("log:instance","DMAF Does not support colon syntax for properties within arrays.",n),void 0):void 0===this[n]?(console.error("log:instance",n,"is not a valid property for instance type",this.id),void 0):(i=e.verify(this.defaults[n],i),"volume"===n&&(i=Math.max(0,Math.floor(100*Math.pow(2,i/6))/100)),t.isPrototypeOf(this[n])?(r=r?r/1e3:0,s=s=s?s/1e3:0,o=s?"linearRampToValueAtTime":"setValueAtTime",this[n].cancelScheduledValues(r),this[n].setValueAtTime(this[n].value,r),this[n][o](i,s+r)):this[n]=i,void 0)}};return i}),dmaf("Property",["DMAF"],function(e){function t(t,n,i,s){var r=1e3*e.context.currentTime;this.time=t,this.value=n,this.parent=s,this.type=i,this.execute=("linear"===i?a:this.done).bind(this),"linear"===i&&(t=this.parent._previous),this.id=setTimeout(this.execute,t>r?t-r:0)}function n(){this.startTime=this.parent._previous,this.startValue=this.parent.value}function a(){var t;void 0===this.startTime&&n.call(this),t=(1e3*e.context.currentTime-this.startTime)/(this.time-this.startTime),this.parent.value=this.startValue+(this.value-this.startValue)*t,t>.999?this.done():this.id=setTimeout(this.execute,20)}function i(e){this.value=e,this._previous=0,this._actions=[]}return t.prototype.done=function(){this.parent._previous=this.time,this.parent.value=this.value,this.parent._actions.splice(this.parent._actions.indexOf(this),1)},i.prototype.cancelScheduledValues=function(e){for(var t=this._actions.length;t--;)this._actions[t].time>=e&&this._actions.splice(t,1)},i.prototype.setValueAtTime=function(e,n){this._actions.push(new t(n,e,"set",this))},i.prototype.linearRampToValueAtTime=function(e,n){this._actions.push(new t(n,e,"linear",this))},i}),dmaf("context",[],function(){function e(){return(new Date).getTime()/1e3}function t(){return a.currentTime=e(),setTimeout(t,40),context.currentTime}function n(){var e=a.createBufferSource();e.buffer=a.createBuffer(1,100,44100),e.noteOn(0),document.removeEventListener(i,n,!1)}var a;if(dmaf.hasContext){var i="createTouch"in document?"touchstart":"mousedown",s=window.webkitAudioContext||window.AudioContext||null;return document.addEventListener(i,n,!1),a=new s}return Object.create?Object.create(null,{currentTime:{get:e}}):{currentTime:t()}}),dmaf("DMAF",["InstanceManager","Instance","context","events"],function(e,t,n,a){function i(e){return function(t){var n,i;return c.test(t)?(n=t.split(c),n.length>2&&(i=n.slice(2),n.length=2,n.push(i))):n=arguments,n[0]?p[n[0]]?e.apply(p,n):(a.dispatch("log:error:core","Invalid type!",n[0]),null):(a.dispatch("log:error:core","verifyQueryPartial, Missing arguments!"),null)}}function s(t,n,a,i){this[t]=this[t]||Object.create(null),this[t].ids=this[t].ids||[],this[t].ids.push(n),a.prototype.defaults=this.Settings.descriptors.action[t][n]||{},this[t][n]=new e(a,i)}function r(e,t){for(var n,a,i=this[e].ids,s=0,r=i.length;r>s;s++)if(a=i[s],n=this[e][a].getInstance(t))return n;return null}function o(e,t,n){var i=this.getInstance(e,t);if(!i)return a.dispatch("log:error:core","Missing instance",e,t),null;for(var s=0,r=n.length;r>s&&void 0!==i&&("object"==typeof i||"function"==typeof i);s++)i=i[n[s]];return s!==r?(a.dispatch("log:error:core","Could not find property:",n.join(",")),null):i}function l(e,t){var n;return t.instanceId=e,this[t.type]&&this[t.type][t.id]?n=this[t.type][t.id].createInstance(t):a.dispatch("log:error:core",n.type,n.id,"was not registered with dmaf."),n||{error:!0}}function d(e,t){var n=this.getInstance(e,t);
return n?this[n.type][n.id].removeInstance(t):(a.dispatch("log:error:core","DMAF.remove: Could not find instance",e,t),!1)}var c=/[:]/,p={registeredObjects:{}};return Array.prototype.slice,console.log||function(){},p.getInstanceProperty=i(o),p.getInstance=i(r),p.registerInstance=s,p.removeInstance=d,p.createInstance=l,p.context=n,p}),dmaf("init",["DMAF","Utils","Parse","events","Action","log"],function(e,t,n,a,i,s){return function(r,o,l,d,c,p,u){if(e.require=o,dmaf.isBrowser){if(!dmaf.hasContext)return e.require("public"),a.dispatch("_internal:resolve_listeners"),a.dispatch("_external:dmaf_fail"),void 0;if(e.Settings={},dmaf.dev){if(dmaf.log=!0,s(u),window.DMAF=e,!d)throw Error("Missing descriptors.xml!");if(e.Settings.descriptors=n("descriptors",d),!c)throw Error("Missing config.xml!");if(e.Settings.actions=n("actions",c),!p)throw Error("Missing assets.xml!");for(var m=n("actions",p),h=0;m.length>h;h++)e.Settings.actions.unshift(m[h])}else e.require("settings");r&&(e.Settings.assetsPath=r),t.each(l,function(t){switch(t){case"init":break;case"settings":break;default:e.require(t)}}),t.each(e.Settings.actions,function(n,s){e[s.type]&&e[s.type][s.id]?t.each(s.triggers,function(e,t){a.add(t,i(s))}):a.dispatch("log:core","DMAF: Requested unregistered module!",s)}),a.dispatch("preload_assets"),a.once("_internal:preloads_complete",function(){a.dispatch("log:core","preloads_complete"),a.dispatch("_internal:resolve_listeners"),a.dispatch("init_routing"),a.dispatch("dmaf_ready"),a.dispatch("_internal:resolve_input"),a.dispatch("log:core","Dispatching external dmaf_ready"),a.dispatch("_external:dmaf_ready"),a.dispatch("log:core","dmaf is now ready")})}else dmaf.Parse=n}}),dmaf("public",["DMAF","events"],function(e,t){function n(n,a,i){t.dispatch("log:public:tell",n,a),dmaf.log&&console.log("dmaf.tell:",n),i||(i=1e3*e.context.currentTime),t.dispatch(n,i,a)}function a(e,n){return t.add("_external:"+e,n)}function i(e,n){return t.remove("_external:"+e,n)}function s(e,n){return t.once("_external:"+e,n)}function r(n,a){return"string"!=typeof n?(console.error("dmaf: You must provide a valid id for the object you wish to register."),2):n?a&&a instanceof Object?(a.instanceId||(a.instanceId=n),e.registeredObjects[n]?(console.log("You've already registered an object with id",n),void 0):(t.dispatch("log:public:registerObject",n,a),e.registeredObjects[n]=a,t.dispatch(n+".CREATE"),void 0)):(console.log("dmaf: You've tried to register an object not of type 'object'"),3):(console.error("dmaf: You must provide a valid id for the object you wish to register."),1)}function o(n){t.dispatch("log:public:unregisterObject",n);var a=e.registeredObjects[n],i=!1;return a&&(i=delete e.registeredObjects[n]),a=e.getInstance("customCode:"+n),a&&(i=e.removeInstance("customCode:"+n)),a=e.getInstance("mediaElement:"+n),a&&(i=e.removeInstance("mediaElement:"+n),t.dispatch("log:public:unregisterObject",n)),i&&t.dispatch(n+".REMOVE"),delete e.registeredObjects[n]}function l(){t.dispatch("log:core","resolving pending addListeners and registerObject calls."),dmaf.once.resolve(s),dmaf.addEventListener.resolve(a),dmaf.removeEventListener.resolve(i),dmaf.unregisterObject.resolve(o)}function d(){dmaf.tell.resolve?(t.dispatch("log:core","resolving pending tells."),dmaf.tell.resolve(n)):(dmaf.tell=n,console.warn("dmaf: dmaf.tell has been overwritten. Unexpected behavior may occur.")),dmaf.registerObject.resolve(r)}t.once("_internal:resolve_listeners",l),t.once("_internal:resolve_input",d)}),dmaf("events",[],function(){function e(e){var n,a=r,i=Array.prototype.slice.call(arguments,0),s=t(e),o=[];r=0;for(var l=0,d=s.length;d>l&&(n=s[l],o.push(n.apply(null,i)),!r);l++);return r=a,o.length?o:null}function t(e){for(var t,n=e.split(l),a=o,i=[],s=0,r=n.length;r>s&&(t=a.names&&a.names[n[s]],t);s++)i=i.concat(t.listeners||[]),a=a.names[n[s]];return i}function n(){r=1}function a(e,t){for(var n=e.split(l),a=o,i=0,s=n.length;s>i;i++)a=a.names,a.hasOwnProperty(n[i])&&void 0!==a[n[i]]?a=a[n[i]]:(a[n[i]]={names:{}},a=a[n[i]]);for(a.listeners=a.listeners||[],i=0,s=a.listeners.length;s>i;i++)if(a.listeners[i]===t)return;a.listeners.push(t)}function i(e,t){var n=function(){return s(e,n),t.apply(this,arguments)};return a(e,n)}function s(e,t){var n,a,i,s,r,c,p,u=e.split(l),m=[o];for(s=0,r=u.length;r>s;s++)for(c=0;m.length>c;c++)i=[c,1],n=m[c].names,n[u[s]]&&i.push(n[u[s]]),m.splice.apply(m,i);for(s=0,r=m.length;r>s;s++)for(n=m[s];n.names;){if(t){if(n.listeners){for(c=0,p=n.listeners.length;p>c;c++)if(n.listeners[c]===t){n.listeners.splice(c,1);break}n.listeners.length||delete n.listeners}for(a in n.names)if(n.names[d](a)&&n.names[a].listeners){var h=n.names[a].listeners;for(c=0,p=h.length;p>c;c++){if(h[c]===t){h.splice(c,1);break}h.length||delete n.names[a].listeners}}}else{delete n.listeners;for(a in n.names)n.names[d](a)&&n.names[a].listeners&&delete n.names[a].listeners}n=n.names}}var r,o={names:{}},l=/[\:]/,d="hasOwnProperty",c={add:a,remove:s,_events:o,listeners:t,stop:n,once:i,dispatch:e};return c}),dmaf("assetController",["DMAF","Utils","Instance","Assets","Parse","events","AudioManager"],function(e,t,n,a,i,s,r){function o(e){return!!y.canPlayType(A[e]).replace(/no/,"")}function l(){}function d(){}function c(){}function p(){}function u(){}function m(){}function h(){}function f(t,n){return function(i){n.files.forEach(function(n){function r(e){s.dispatch("log:assets","Decoded",n.name),a.buffer[n.name]=e,t.onstep()}function o(e){console.error("Could note decode",n.name,e)}e.context.decodeAudioData(i.slice(n.start,n.end),r,o)})}}var _,g="assetController",y=dmaf.isBrowser?document.createElement("audio"):{},v={loadSampleMap:"xml/",loadMIDI:"midi/",loadSound:"audio/",loadCustomCode:"js/",loadHTMLAudio:"audio/",cacheHTMLAudio:"audio/"},b=["ogg","aac","mp3","wav"],A={wav:'audio/wav; codecs="1"',mp3:"audio/mpeg;",aac:'audio/mp4; codecs="mp4a.40.2"',ogg:'audio/ogg; codecs="vorbis"'},T=Object.create(n,{init:{value:function(){this.loadCount=0,-1!==this.triggers.indexOf("preload_assets")&&(a.preloads+=this.files.length,this.preload=!0)}},onload:{value:function(){return this.returnEvent&&s.dispatch(this.returnEvent),e.removeInstance(this.type,this.instanceId)}},onstep:{value:function(){return s.dispatch("_internal:asset_loaded",this.preload),++this.loadCount===this.files.length&&this.onload()}},onAction:{value:function(){this.files.length||(s.dispatch("log:error:assets",this.type,this.id,"There are no files for this loader"),this.onstep()),this.baseURL=e.Settings.assetsPath+v[this.id],this.fileNames=this.files.map(t.prop("name"));for(var n=0;this.fileNames.length>n;n++)this.loadFile(this.baseURL+this.fileNames[n]+this.format,this.fileNames[n],n);this.onAction=t.nope}}});if(y.canPlayType!==void 0)for(var P=0,E=b.length;E>P;P++)if(o(b[P])){_="."+b[P];break}return void 0===_?s.dispatch("_external:dmaf_fail"):(e.format=_,r.init(),l.prototype=Object.create(T,{loadFile:{value:function(){function e(){t.onstep()||(y.src=t.baseURL+n[t.loadCount]+t.format,y.load())}var t=this,n=this.fileNames;y.addEventListener("canplaythrough",e,!1),y.src=t.baseURL+n[t.loadCount]+t.format,y.load(),this.fileNames.length=0}},format:{value:_}}),e.registerInstance("assetController","cacheHTMLAudio",l),d.prototype=Object.create(T,{loadFile:{value:function(){function e(){t.onstep()||(s.once("_internal:"+n[t.loadCount]+".READY",e),r.preloadElement(n[t.loadCount]))}var t=this,n=this.fileNames;s.once("_internal:"+n[t.loadCount]+".READY",e),r.preloadElement(n[t.loadCount]),this.fileNames.length=0}},format:{value:_}}),e.registerInstance("assetController","loadHTMLAudio",d),c.prototype=Object.create(T,{format:{value:".js"},loadFile:{value:function(e){var t=this,n=document.createElement("script");n.type="text/javascript",n.src=e,n.addEventListener("load",function(){t.onstep(),void 0!==n.remove&&n.remove()}),document.body.appendChild(n)}}}),e.registerInstance(g,"loadCustomCode",c),p.prototype=Object.create(T,{format:{value:".xml"},loadFile:{value:function(e){function n(e){i("samplemap",e)}var a={chain:[this.onstep],context:this,responseXML:!0,fail:function(){s.dispatch("log:assets","Problem parsing samplemap file"),this.onstep()}.bind(this)};t.ajax(e,n,a)}}}),e.registerInstance(g,"loadSampleMap",p),u.prototype=Object.create(T,{format:{value:".mid"},loadFile:{value:function(e,n,a){function r(e){i("midi",e,this.files[a].type,n),this.onstep()}var o={override:"text/plain; charset=x-user-defined",expectType:"string",context:this,fail:function(){s.dispatch("log:assets","Problem parsing midi file",e),this.onstep()}.bind(this)};t.ajax(e,r,o)}}}),e.registerInstance(g,"loadMIDI",u),m.prototype=Object.create(T,{loadFile:{value:function(n,i){function r(t){p>0&&s.dispatch("log:assets","Retry success",i),s.dispatch("log:assets","Recieved",i,"from network."),e.context.decodeAudioData(t,d,c)}function o(){3>++p?(s.dispatch("log:assets","Could not load audio file",i,"trying again."),t.ajax(n,r,l,"buffer")):(s.dispatch("log:assets","Could not load audio file",i),this.onstep())}var l={responseType:"arraybuffer",fail:o.bind(this)},d=function(e){s.dispatch("log:assets","Decoded",i),a.buffer[i]=e,this.onstep()}.bind(this),c=function(e){s.dispatch("log:assets","Could not decode file",i,e),this.onstep()}.bind(this),p=0;t.ajax(n,r,l,"buffer")}},format:{value:_}}),e.registerInstance(g,"loadSound",m),h.prototype=Object.create(n,{init:{value:function(){this.loadCount=0,-1!==this.triggers.indexOf("preload_assets")&&(a.preloads+=this.files.length,this.preload=!0)}},onAction:{value:function(){var n={context:this,responseType:"arraybuffer",fail:function(){s.dispatch("log:assets","Problem loading binary file")}.bind(this)},a=this.headers.reduce(function(t,n){return n.format===e.format?n:t});t.ajax(e.Settings.assetsPath+a.path,f(this,a),n)}},onload:{value:function(){return this.returnEvent&&s.dispatch(this.returnEvent),e.removeInstance(this.type,this.instanceId)}},onstep:{value:function(){return s.dispatch("_internal:asset_loaded",this.preload),++this.loadCount===this.files.length&&this.onload()}}}),e.registerInstance("assetController","loadBin",h),void 0)}),dmaf("audioRouter",["DMAF","Utils","InstanceManager","Instance","AudioNodes"],function(e,t,n,a,i){function s(){this.input=e.context.createGainNode(),this.output=e.context.createGainNode()}var r="audioRouter";s.prototype=Object.create(a,{init:{value:function(n){var a,s=this.input;this.effects=i.createRecursive(this.input,n.audioNodes),this.effects.length>0&&(s=this.effects[this.effects.length-1]),s.connect(this.output),t.each(this.out,function(t,n){a=e.getInstance(r,n),this.output.connect(a?a.input:e.context.destination)},this)}},volume:{get:function(){return this.output.gain},set:function(e){this.output.gain.value=t.dbToWAVolume(e)}},getAutomatableProperties:{value:function(e){return"fx"==e.substring(0,2)?this.effects[parseInt(e.substring(2),10)]:void 0}},setAutomatableProperty:{value:function(t,n,a,i){var s=a>0?"linearRampToValueAtTime":"setValueAtAtTime";switch(t){case"volume":n=parseFloat(n),t="gain";break;case"pan":break;default:return}this.output[t].cancelScheduledValues(e.context.currentTime),this.output[t].setValueAtTime(this.output[t].value,e.context.currentTime),this.output[t][s](n,(i+a)/1e3)}},onAction:{value:function(){}}}),e.registerInstance(r,"audioBus",s)}),dmaf("beatPatternPlayer",["DMAF","TimeManager","InstanceManager","Instance","beatPattern","beatPosition","beatPatternInstance","Assets","events","Utils"],function(e,t,n,a,i,s,r,o,l,d){function c(){this.state=this.STOPPED,this.pendingPatterns=[],this.activePatterns=[],this.tempo=120,this.resetPosition()}function p(){var t,n,a=(new Date).getTime(),i=1e3*e.context.currentTime;return u&&(p.lastDifference=t,u=!1),t=a-i,n=t-p.lastDifference,Math.abs(n)>5?(l.dispatch("log:error","DMAF: Adjusting next beat Time. Difference was "+n+"ms"),p.lastDifference=t,n):0}var u=!0;c.prototype=Object.create(a,{STOPPED:{value:0},RUNNING:{value:1},tempo:{get:function(){return this._tempo},set:function(e){this._tempo=e,this.beatLength=250*(60/e)}},resetPosition:{value:function(){this.songPosition=new s(0,16,16),this.currentPattern=new r(this,{beatPattern:new i("MASTER",1),channel:"MASTER",addAtSongPosition:new s(1,1,16),startPatternAtBeat:1,clearPending:!0,replaceActive:!0,setAsCurrent:!0,loop:!0,loopLength:16,clearPosition:new s(1,1,16)})}},onAction:{value:function(t,n,a,i){if(l.dispatch("log:instance:player:beatPatternPlayer","onAction",t,"actionTime",parseInt(n,10)),i.flowItems)for(var s,r,o,c,p=i.flowItems,u=0,m=p.length;m>u;u++)switch(r=d.clone(p[u]),l.dispatch("log:instance:player:beatPatternPlayer",r.id,parseInt(n,10)),r.id){case"start":this.state===this.STOPPED&&this.start(r,n);break;case"add":if(this.state===this.STOPPED)return l.dispatch("log:error","Cannot add patterns while player is not running!"),void 0;for(o=0,c=r.patternId.length;c>o;o++){if(s=d.clone(r),s.patternId=r.patternId[o],s._dynamicValues)for(var h,f=0;s._dynamicValues.length>f;f++)h=s._dynamicValues[f],s[h.key]=e.getInstanceProperty(h.string);o>0&&(s.replaceActive=!1,s.clearPending=!1,s.setAsCurrent=!1),this.addPattern(s)}break;case"stop":this.state===this.RUNNING&&this.stop();break;case"beatEvent":this.state===this.RUNNING&&this.beatEvent(r,n)}}},addPattern:{value:function(e){e.beatPattern=o.getAsset("beatPattern",e.patternId),e.addAtSongPosition=this.getSongPosition(e.songPosition),e.startPatternAtBeat=this.getStartAtBeat(e.patternPosition),e.clearPosition=this.getSongPosition(e.clearPosition);var t=new r(this,e);if(e.clearPending)if("main"===e.channel)l.dispatch("log:instance:player:beatPatternPlayer","Clearing all pending patterns."),this.pendingPatterns.length=0;else for(var n=this.pendingPatterns.length;n--;)this.pendingPatterns[n].channel===e.channel&&(l.dispatch("log:instance:player:beatPatternPlayer","removing",this.pendingPatterns[n].patternId),this.pendingPatterns.splice(n,1));t.ERROR||(l.dispatch("log:instance:player:beatPatternPlayer","adding",t.patternId,"to pendingPatterns"),this.pendingPatterns.push(t))}},checkBeat:{value:function(){for(var t=1e3*e.context.currentTime,n=!1;t-this.nextBeatTime-e.preListen>this.beatLength;)this.skipBeat(this.nextBeatTime),n=!0;for(n&&(l.dispatch("log:instance:player:beatPatternPlayer","beatPatternPlayer has skipped beats!"),l.dispatch("log:instance:player:beatPatternPlayer","songPosition: "+this.songPosition.getInBeats()),l.dispatch("log:instance:player:beatPatternPlayer","patternPosition: "+this.currentPattern.currentBeat));t>=this.nextBeatTime-e.preListen;)this.updateBeat(this.nextBeatTime)}},skipBeat:{value:function(e){this.currentBeatTime=e,this.songPosition.gotoNextBeat();for(var t=0,n=this.activePatterns.length;n>t;t++)this.activePatterns[t].gotoNextBeat();this.updateActivePatterns(),l.dispatch("log:instance:player:beatPatternPlayer","songPosition: "+this.songPosition.getInBeats(),"currentBeatTime:"+e),l.dispatch("log:instance:player:beatPatternPlayer","patternPosition: "+this.currentPattern.currentBeat,"currentBeatTime:"+e),this.nextBeatTime=e+this.beatLength}},updateBeat:{value:function(e){this.currentBeatTime=e,this.songPosition.gotoNextBeat();for(var t=0,n=this.activePatterns.length;n>t;t++)this.activePatterns[t].gotoNextBeat();for(this.updateActivePatterns(),t=0,n=this.activePatterns.length;n>t;t++)this.activePatterns[t].executeEvents(e,this.beatLength);this.dispatchBeat(),this.nextBeatTime=e+this.beatLength-p()}},dispatchBeat:{value:function(){1===this.songPosition.beat%4&&l.dispatch("metronome",this.currentBeatTime,{bar:this.songPosition.bar,beat:Math.floor(this.songPosition.beat/4)+1})}},updateActivePatterns:{value:function(){for(var e,t,n,a,i,s=0;this.pendingPatterns.length>s;s++)if(n=this.pendingPatterns[s].addAtSongPosition,n.bar===this.songPosition.bar&&n.beat===this.songPosition.beat){if(e=this.pendingPatterns[s],this.pendingPatterns.splice(s--,1),e.replaceActive)for(a=0,i=this.activePatterns.length;i>a;a++)("main"===e.channel||e.channel===this.activePatterns[a].channel)&&(this.activePatterns[a].removeAtSongPosition=e.clearPosition);e.setAsCurrent&&(l.dispatch("log:instance:player:beatPatternPlayer","Setting",e.patternId,"as current pattern."),this.currentPattern=e),l.dispatch("log:instance:player:beatPatternPlayer","adding",e.patternId,"to activePatterns. pattern position",e.currentBeat),this.activePatterns.push(e)}for(s=0;this.activePatterns.length>s;s++){if(t=this.activePatterns[s].removeAtSongPosition,isNaN(t.beat))throw this.stop({songPosition:"ASAP"}),Error("NaN! beat",this);t.bar===this.songPosition.bar&&t.beat===this.songPosition.beat?(l.dispatch("log:instance:player:beatPatternPlayer","removing",this.activePatterns[s].patternId),this.activePatterns.splice(s--,1)):t.bar<this.songPosition.bar&&(l.dispatch("log:instance:player:beatPatternPlayer","removing",this.activePatterns[s].patternId),this.activePatterns.splice(s--,1))}}},start:{value:function(e,n){return this.nextBeatTime=n,isNaN(e.tempo)?(l.dispatch("log:error","Flow item in",this.instanceId,"was missing tempo."),void 0):(this.tempo=e.tempo,isNaN(e.beatsPerBar)?(l.dispatch("log:error","Flow item in",this.instanceId,"was missing beatsPerBar."),void 0):(this.beatsPerBar=e.beatsPerBar,this.state=this.RUNNING,l.dispatch("log:instance:player:beatPatternPlayer","adding addFrameListener","actionTime: "+parseInt(n,10)),t.addFrameListener("checkBeat",this.checkBeat,this),void 0))}},stop:{value:function(){this.state=this.STOPPED,this.pendingPatterns.length=0,this.activePatterns.length=0,t.removeFrameListener("checkBeat"),this.resetPosition(),l.dispatch("log:instance:player:beatPatternPlayer","Player",this.instanceId,"is stopped.")}},beatEvent:{value:function(n){var a=this.getSongPosition(n.songPosition).getInBeats(),i=this.songPosition.getInBeats(),s=(a-i)*this.beatLength;s+=1e3*e.context.currentTime,s=Math.max(1e3*e.context.currentTime,s),t.checkFunctionTime(s,l.dispatch,[],l,n.returnEvent,s,n)}},getSongPosition:{value:function(e){var t,n=e,a=0,i=0,r=new s(this.songPosition.bar,this.songPosition.beat,this.beatsPerBar);switch(/\+/.test(n)&&(t=n.split("+"),n=t[0],t=t[1].split("."),i=parseInt(t[0],10)||0,a=parseInt(t[1],10)||0),n){case"NEXT_BEAT":r.addOffset({bar:0,beat:1});break;case"NEXT_BAR":r.beat=1,r.bar++;break;case"ASAP":return r;default:l.dispatch("log:instance:player:beatPatternPlayer","BeatPatternPlayer getSongPosition: Unrecognized songPosition ",n)}return r.bar+=i,r.beat+=a,r}},getStartAtBeat:{value:function(e){var t,n=e,a=0,i=0,s=this.currentPattern&&this.currentPattern.currentBeat||1;if(!n)return 1;switch(/\+/.test(n)&&(t=n.split("+"),n=t[0],t=t[1].split("."),i=parseInt(t[0],10)||0,a=parseInt(t[1],10)||0),n){case"FIRST_BEAT":s=1;break;case"SYNC":s++;break;case"SONG_POSITION":return this.songPosition.getInBeats();default:l.dispatch("log:instance:player:beatPatternPlayer","BeatPatternPlayer: Unrecognized patternPosition "+n)}return s+=i*(this.currentPattern&&this.currentPattern.beatsPerBar||16),s+=a}}}),e.registerInstance("player","beatPatternPlayer",c)}),dmaf("customCode",["DMAF","InstanceManager","Instance","events"],function(e,t,n,a){function i(){}function s(){}i.prototype=Object.create(n),e.registerInstance("customCode","customCode",i),e.customCode.customCode.createInstance=function(t){if(e.customCode[t.instanceId]){var n=e.customCode[t.instanceId].createInstance(t);return n}a.dispatch("log:error",t.instanceId,"was not registered with DMAF")},s.prototype=Object.create(n,{onAction:{value:function(){var t=e.registeredObjects[this.instanceId];t&&(this.obj=t)}}}),e.registerInstance("customCode","userObject",s)}),dmaf("eventProcessor",["DMAF","events","TimeManager","InstanceManager","Instance"],function(e,t,n,a,i){function s(){}function r(){}var o="eventProcessor";s.prototype=Object.create(i,{init:{value:function(){this.lastEvent="",this.lastExecutedTime=-1*this.reTrig,this.pending=[]}},send:{value:function(e,n,a){"ALWAYS"===this.dispatch||e!==this.lastEvent?(t.dispatch("log:instance:eventProcessor:eventMapper","sending",e,"with actionTime",parseInt(n,10)),t.dispatch(e,n,a),this.lastEvent=e):t.dispatch("log:instance:eventProcessor:eventMapper","dispatch settings have prevented",this.instanceId,"from sending",e)}},onAction:{value:function(a,i,s){var r,o,l,d=parseInt(1e3*e.context.currentTime,10);if(d-this.lastExecutedTime<this.reTrig)return t.dispatch("log:instance:eventProcessor:eventMapper","reTrig settings have prevented execution of",this.instanceId),void 0;this.clearPending&&this.pending.length&&(t.dispatch("log:instance:eventProcessor:eventMapper","Clearing pending events"),n.dropPendingArray(this.pending));for(var c=0,p=this.eventMaps.length;p>c;c++)if(l=this.eventMaps[c],r=i+l.delay,o=l["in"],-1!==o.indexOf(a)){if(l.out===a)return t.dispatch("log:error:eventMapper",l.out,"is the same in event as output. Ignoring..."),void 0;n.checkFunctionTime(r,this.send,this.pending,this,l.out,r,s)}this.lastExecutedTime=d}}}),e.registerInstance(o,"eventMapper",s),r.prototype=Object.create(i,{init:{value:function(){for(var e=0,n=this.eventMaps.length;n>e;e++)this.eventMaps[e]["in"]=parseInt(this.eventMaps[e]["in"],10),isNaN(this.eventMaps[e]["in"])&&t.dispatch("log:error","In value for MidiNoteMapper is NaN!")}},onAction:{value:function(e,n,a){if(a&&a.midiNote)for(var i=0,s=this.eventMaps.length;s>i;i++)this.eventMaps[i]["in"]===a.midiNote&&t.dispatch(this.eventMaps[i].out,n,a)}}}),e.registerInstance(o,"midiNoteMapper",r)}),dmaf("sound_html5",["DMAF","Utils","events","sound","TimeManager","AudioManager"],function(e,t,n,a,i,s){function r(e){return e._.playing}function o(e,t){return function(){t._wait=null,t.proceedPlay(e)}}function l(){}l.prototype=Object.create(a,{init:{value:function(){this.sounds=[],this.pendingPlays=[],this.pendingStops=[],this.pendingEvents=[],this.pendingSoftLoop=[],this.playing=!1,this.previousActionTime=0}},checkFinished:{value:function(){this.sounds=this.sounds.filter(r),this.sounds.length||(this.playing=!1)}},clearAll:{value:function(){this.sounds=this.sounds.filter(function(e){return e.pause(),!1}),this.playing=!1}},dispose:{value:function(e){this.sounds=this.sounds.filter(function(t){return t.timestamp===e?(t.pause(),!1):!0}),this.sounds.length||(this.playing=!1)}},proceedPlay:{value:function(t){"RESYNC"===this.timingCorrection&&this.clearAll(),this._wait&&(n.removeEventListener("_internal:"+this.soundFile+".READY"),this._wait=null);var a=s.requestElement(this.soundFile,this);if(!a._.loaded)return this._wait=o(t,this),n.once("_internal:"+this.soundFile+".READY",this._wait),void 0;var r,l=1e3*e.context.currentTime,d=1e3*a.duration;if("PLAY"===this.timingCorrection)r=0;else{if(l>t+d)return;r=Math.max(0,l-t)}a.currentTime=r/1e3,a.play(),i.dropPendingArray(this.pendingEvents),this.returnEvent&&i.checkFunctionTime(t+d+this.returnEventTime,n.dispatch,this.pendingEvents,n,this.returnEvent,t+d+this.returnEventTime),this.loop>-1&&(i.checkFunctionTime(t+this.loop,this.proceedPlay,this.pendingSoftLoop,this,t+this.loop),i.checkFunctionTime(t+this.loop,this.dispose,[],this,a._.timestamp)),i.checkFunctionTime(t+d,this.dispose,[],this,a._.timestamp),this.playing=!0,this.sounds.push(a)},volume:{get:function(){return this._volume},set:function(e){this._volume=t.dbToJSVolume(e);for(var n=0;this.sounds.length>n;n++)this.sounds[n].volume=e}}}}),e.registerInstance("sound","htmlPlay",l)}),dmaf("mediaElement",["DMAF","events","TimeManager","InstanceManager","Instance"],function(e,t,n,a,i){function s(){}function r(){}var o="mediaElement";s.prototype=Object.create(i,{currentTime:{get:function(){return this.element?this.element.currentTime:void 0}},onAction:{value:function(){if(this.element)return null;var a=this.instanceId,i=e.registeredObjects[a];i?i instanceof HTMLElement&&("VIDEO"===i.tagName||"AUDIO"===i.tagName?(this.element=i,this.playing=!1,this.lastPlayTime=i.currentTime,n.addFrameListener(this.type+":"+this.instanceId,this.poll,this)):t.dispatch("log:instance:mediaElement","DMAF does not support registering HTML elements other than <video> and <audio>")):t.dispatch("log:instance:mediaElement","DMAF Could not locate mediaElement with id",this.instanceId)}},poll:{value:function(){this.lastPlayTime===this.element.currentTime?this.playing&&(t.dispatch("log:instance:mediaElement",this.instanceId+".STOP",1e3*e.context.currentTime),t.dispatch(this.instanceId+".STOP",1e3*e.context.currentTime),this.playing=!1):this.lastPlayTime-this.element.currentTime>.25?(t.dispatch("log:instance:mediaElement",this.instanceId+".START",1e3*(e.context.currentTime-this.currentTime)),t.dispatch(this.instanceId+".START",1e3*(e.context.currentTime-this.currentTime))):this.element.currentTime-this.lastPlayTime>.25?(t.dispatch("log:instance:mediaElement",this.instanceId+".START",1e3*(e.context.currentTime-this.currentTime)),t.dispatch(this.instanceId+".START",1e3*(e.context.currentTime-this.currentTime))):this.playing||(t.dispatch("log:instance:mediaElement",this.instanceId+".START",1e3*(e.context.currentTime-this.currentTime)),t.dispatch(this.instanceId+".START",1e3*(e.context.currentTime-this.currentTime)),this.playing=!0),this.lastPlayTime=this.element.currentTime}}}),e.registerInstance(o,"mediaElement",s),e.mediaElement.mediaElement.removeInstance=function(t){var a=e.getInstance("mediaElement:"+t);return a&&n.removeFrameListener(o+":"+t),delete this.activeInstances[t]},r.prototype=Object.create(i,{onAction:{value:function(e,t){var n,a=/CREATE|REMOVE/.exec(e);a.length&&(a=a[0].toLowerCase(),n=e.split(".")[0],this[a](t,n))}},create:{value:function(t,a){var i=e.mediaElement.mediaElement.createInstance({instanceId:a,type:o,id:"mediaElement"});n.checkFunctionTime(t,i.onAction,[],i)}},remove:{value:function(t,n){return e.mediaElement.mediaElement.removeInstance(n)}}}),e.registerInstance("control","mediaController",r,!0)}),dmaf("midiProcessor",["DMAF","events","Utils","InstanceManager","Instance","TimeManager"],function(e,t,n,a,i,s){function r(){}function o(){}var l="midiProcessor",d={off:null,major:[0,-1,0,-1,0,0,-1,0,-1,0,-1,0],harmonicMinor:[0,1,0,0,-1,0,1,0,0,-1,1,0],naturalMinor:[0,-1,0,0,-1,0,-1,0,0,-1,0,-1],majorPentatonic:[0,1,0,1,0,-1,1,0,1,0,-1,1],minorPentatonic:[0,-1,1,0,-1,0,1,0,-1,1,0,-1],dorian:[0,1,0,0,-1,0,1,0,1,0,0,-1],phrygian:[0,0,-1,0,-1,0,1,0,0,-1,0,-1],lydian:[0,1,0,1,0,1,0,0,1,0,1,0],mixolydian:[0,1,0,1,0,0,-1,0,-1,0,-1],locrian:[0,0,-1,0,-1,0,0,-1,0,-1,0,-1],doubleHarmonic:[0,0,-1,1,0,0,1,0,0,-1,1,0],halfDim:[0,1,0,0,-1,0,0,-1,0,-1,0,-1],pentatonic:[0,-1,-2,0,-1,0,-1,0,-1,-2,0,-1]},c={C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11};r.prototype=Object.create(i,{onChange:{get:function(){return this._onChange},set:function(e){return this._changeMemory=this._changeMemory||{},this._onChange=e,this._onChange}},scale:{get:function(){return this._scale},set:function(e){return this._scale="custom"===e?this.customScale.split(",").map(parseFloat):d[e],this._scale}},root:{get:function(){return this._root},set:function(e){this._root=c[e]}},onAction:{value:function(e,n,a){if(!a)return t.dispatch("log:error","no eventProperties for",e),void 0;if(void 0===a.midiNote)return t.dispatch("log:error","no midiNote for",e),void 0;if(this.onChange){if(this._changeMemory[e]===a.midiNote)return t.stop(),void 0;this._changeMemory[e]=a.midiNote}0!==this.dynamic&&(isNaN(a.velocity)||(a.velocity=this.dynamic+parseInt(a.velocity,10))),this.transpose&&(this.transpose=parseInt(this.transpose,10),a.midiNote+=this.transpose),null!==this.scale&&this.quantizeToScale(a)}},quantizeToScale:{value:function(e){var t;return e.midiNote&&(t=e.midiNote%12,t-=this._root,0>t&&(t=12+t),e.midiNote+=this.scale[t]),e}}}),e.registerInstance(l,"midiProcessor",r),o.prototype=Object.create(i,{init:{value:function(){this.lastActionTime=this.reTrig;for(var e=0,t=this.noteMaps.length;t>e;e++)this.noteMaps[e].midiNote=n.toMIDINote(this.noteMaps[e].note)}},onAction:{value:function(e,n){var a,i,r;if(!(n-this.lastActionTime<this.reTrig)){for(var o=0,l=this.noteMaps.length;l>o;o++)for(var d=0,c=this.noteMaps[o].triggerIn.length;c>d;d++)r=this.noteMaps[o].triggerIn[d],r===e&&(a={type:"noteOn",midiNote:this.noteMaps[o].midiNote,velocity:this.noteMaps[o].velocity,duration:this.noteMaps[o].duration},i=n+this.noteMaps[o].delay,s.checkFunctionTime(i,t.dispatch,[],t,this.noteMaps[o].triggerOut,i,a));this.lastActionTime=n}}}}),e.registerInstance(l,"makeNote",o)}),dmaf("parameterProcessor",["DMAF","TimeManager","InstanceManager","Instance","events"],function(e,t,n,a,i){function s(){this.timeoutContainer=[],this.instanceId="transform_"+l++}function r(){}var o="parameterProcessor",l=0;s.prototype=Object.create(a,{onAction:{value:function(e,t){var n="multi"===this.targets[0]?[e.replace(this.multiSuffix,"")]:this.targets.slice(0);this.execute(t,n)}},execute:{value:function(t,n){for(var a,s=0;n.length>s;s++)a=e.getInstance(this.targetType,n[s]),a&&(i.dispatch("log:instance:parameterProcessor:transform","Transforming",this.targetParameter,"of",a.instanceId),a.setProperty(this.targetParameter,this.value,this.duration,t))}}}),e.registerInstance(o,"transform",s),r.prototype=Object.create(a,{onAction:{value:function(t,n,a){var i,s,r;if(a&&void 0!==a.value)for(var o=0,l=this.macroTargets.length;l>o;o++)if(i=this.macroTargets[o],r=e.getInstance(i.targetInstance)){switch(s=a.value,i.curve){case"EXP":s=Math.pow(s,2);break;case"LOG":s=Math.log(0!==s?s:s+1e-16)}s=i.min+(i.max-i.min)*s,r.setProperty(i.targetParameter,s,a.duration||0,n)}}}}),e.registerInstance(o,"macro",r)}),dmaf("sound",["DMAF","Utils","TimeManager","events","InstanceManager","Instance","Iterator","Assets"],function(e,t,n,a,i,s,r,o){function l(){this.output=e.context.createGainNode()}function d(t){this.iterator=new r(t.soundFiles,t.generator),this.output=e.context.createGainNode()}function c(){}function p(t,n){e.context.currentTime>n&&(n=e.context.currentTime+this.delay);var a=t.replace(this.multiSuffix,""),i=e.getInstance("sound",a);i&&i.stop(n,this.fadeOut/1e3)}function u(t,n){var a;1e3*e.context.currentTime>n&&(n=1e3*e.context.currentTime+this.delay);for(var i=0,s=this.targets.length;s>i;i++)a=e.getInstance("sound",this.targets[i]),a&&a.stop(n,this.fadeOut/1e3)}var m="sound",h=0,f=t.propIsnt("playbackState",3),_=Object.create(s,{init:{value:function(t){if(this.pendingPlays=[],this.pendingStops=[],this.pendingEvents=[],this.pendingSoftLoop=[],this.sounds=[],this.playing=!1,this.previousActionTime=0,t.bus&&"master"!==t.bus){var n=e.getInstance("audioRouter",t.bus);this.targetBus=n?n.input:e.context.destination}else this.targetBus=e.context.destination;this.output.connect(this.targetBus)}},checkFinished:{value:function(){this.sounds=this.sounds.filter(f)}},clearAll:{value:function(t){for(var n=this.sounds,a=n.length;a--;)this.sounds[a].gain.cancelScheduledValues(e.context.currentTime),this.sounds[a].gain.setValueAtTime(this.sounds[a].gain.value,e.context.currentTime),this.sounds[a].gain.linearRampToValueAtTime(0,e.context.currentTime+(t||0)),this.sounds[a].noteOff(e.context.currentTime+(t||0)+.001);this.sounds.length=0,this.playing=!1}},createSound:{value:function(){var t=e.context.createBufferSource(),n=o.getAsset("buffer",this.getSoundFile());return n?(t.id=h++,t.buffer=n,t.connect(this.output),-2===this.loop&&(t.loop=!0),t):(a.dispatch("log:error:sound:genericPlay","Buffer is missing. Check soundFile property."),null)}},dispose:{value:function(e){for(var t=this.sounds.length;t--;)this.sounds[t].id===e&&this.sounds.splice(t,1);this.playing=!!this.sounds.length}},play:{value:function(e){this.checkFinished(),n.dropPendingArray(this.pendingStops),this.playing?(this.reTrig>-1&&(n.dropPendingArray(this.pendingPlays),n.dropPendingArray(this.pendingEvents)),0===this.reTrig||"RESYNC"===this.timingCorrection?(a.dispatch("log:instance:sound","scheduling",this.instanceId,"for",e),n.checkFunctionTime(e,this.proceedPlay,this.pendingPlays,this,e)):this.reTrig>0&&e-this.previousActionTime>this.reTrig&&(this.previousActionTime=e,a.dispatch("log:instance:sound","scheduling",this.instanceId,"for",e),n.checkFunctionTime(e,this.proceedPlay,this.pendingPlays,this,e))):(this.previousActionTime=e,a.dispatch("log:instance:sound","scheduling",this.instanceId,"for",e),n.checkFunctionTime(e,this.proceedPlay,this.pendingPlays,this,e))
}},proceedPlay:{value:function(t){a.dispatch("log:instance:sound","playing",this.instanceId,"at",Math.floor(1e3*e.context.currentTime));var i=this.createSound();if(i){var s,r=1e3*e.context.currentTime,o=1e3*i.buffer.duration;switch(this.timingCorrection){case"PLAY":r>t?i.noteOn(r/1e3):i.noteOn(t/1e3);break;case"RESYNC":if(this.clearAll(),r>t+o)return;r>t?(s=r-t,i.noteGrainOn(r/1e3,s/1e3,(o-s)/1e3)):i.noteOn(t/1e3);break;case"SYNC":if(r>t+o)return;r>t?(s=r-t,i.noteGrainOn(r/1e3,s/1e3,(o-s)/1e3)):i.noteOn(t/1e3)}this.fadeIn>0?r>t&&(i.gain.setValueAtTime(0,r/1e3),i.gain.linearRampToValueAtTime(1,r/1e3+this.fadeIn/1e3)):(i.gain.setValueAtTime(0,t/1e3),i.gain.linearRampToValueAtTime(1,t/1e3+this.fadeIn/1e3)),n.dropPendingArray(this.pendingEvents),this.returnEvent&&n.checkFunctionTime(t+o+this.returnEventTime,a.dispatch,this.pendingEvents,a,this.returnEvent,t+o+this.returnEventTime),this.loop>-1&&(n.checkFunctionTime(t+this.loop,this.proceedPlay,this.pendingSoftLoop,this,t+this.loop),n.checkFunctionTime(t+this.loop,this.dispose,[],this,i.id),i.noteOff(t/1e3+i.buffer.duration)),-2===this.loop||n.checkFunctionTime(t+o,this.dispose,[],this,i.id),this.playing=!0,this.sounds.push(i)}}},stop:{value:function(t,i){a.dispatch("log:instance:sound","scheduling stop",this.instanceId,"at",Math.floor(1e3*e.context.currentTime)),n.dropPendingArray(this.pendingPlays),n.dropPendingArray(this.pendingStops),n.checkFunctionTime(t,this.proceedStop,this.pendingStops,this,i)}},proceedStop:{value:function(t){a.dispatch("log:instance:sound","Stopping",this.instanceId,"at",Math.floor(1e3*e.context.currentTime)),n.dropPendingArray(this.pendingEvents),n.dropPendingArray(this.pendingSoftLoop),this.clearAll(t),e.sound[this.id].removeInstance(this.instanceId)}},volume:{get:function(){return this.output.gain},set:function(e){this._volume=e,this.waVolume=t.dbToWAVolume(this._volume),this.output&&(this.output.gain.value=this.waVolume)}},onAction:{value:function(e,t){"multi"===this.soundFile&&(this.soundFile=e.replace(this.multiSuffix,"")),this.play(t)}}});return l.prototype=Object.create(_,{getSoundFile:{value:function(){return this.soundFile}}}),e.registerInstance(m,"genericPlay",l),d.prototype=Object.create(_,{getSoundFile:{value:function(){return this.iterator.getNext()}}}),e.registerInstance(m,"stepPlay",d),c.prototype=Object.create(s,{init:{value:function(){this.onAction="multi"===this.targets[0]?p:u}}}),e.registerInstance(m,"soundStop",c,!0),_}),dmaf("stateProcessor",["DMAF","InstanceManager","Instance","events"],function(e,t,n,a){function i(){this.value=void 0,this.previous=void 0}var s="stateProcessor",r="in";i.prototype=Object.create(n,{onAction:{value:function(t){var n,i,s,o,l;for(i=0,s=this.stateMaps.length;s>i;i++)for(o=0,l=this.stateMaps[i][r].length;l>o;o++)this.stateMaps[i][r][o]===t&&(n=this.stateMaps[i].state,this.stateMaps[i]._dynamicValues&&(n=e.getInstanceProperty(this.stateMaps[i]._dynamicValues[0].string)),i=s,o=l);if(!n)return a.dispatch("log:instance:stateProcessor","No state found for",t),!1;switch(this.update){case"always":this.previous=this.value,this.value=n;break;case"onChange":n!==this.value&&(this.previous=this.value,this.value=n)}}}}),e.registerInstance(s,"state",i)}),dmaf("synth",["DMAF","Utils","InstanceManager","TimeManager","Instance","Assets","AudioNodes","events"],function(e,t,n,a,i,s,r,o){function l(t){this.input=e.context.createGainNode(),this.output=e.context.createGainNode(),this.Note=u.call(this,t)}function d(t,n,a){if(t)this.input.connect(this.output),this.output.connect(t);else{var i=this.input;if(this.effects=r.createRecursive(i,n),this.effects.length>0&&(i=this.effects[this.effects.length-1]),i.connect(this.output),a&&"master"!==a){var s=e.getInstance("audioRouter",a);s?this.output.connect(s.input):this.output.connect(e.context.destination)}else this.output.connect(e.context.destination)}}function c(){for(var t,n,a=e.context.currentTime,i=this.samples.active,s=this.samples.sustained,r=Object.keys(i),o=r.length;o--;)for(n=r[o],t=i[n].length;t--;)a>i[n][t].disposeTime&&i[n].splice(t,1);for(o=s.length;o--;)a>s[o].disposeTime&&s.splice(o,1)}function p(t,n,a){var i=this._loop&&this._sustain,s=this._loop?1/0:1e3*t.bufferLength-t.ampRelease,r=this.ignoreNoteOff?s:a?a:s,o=n+(i?1/0:r);isFinite(o)&&t._noteOff(o),this.sustained||!a?(this.samples.sustained.push(t),this.samples.sustained.length>this.numberOfVoices&&this.samples.sustained[0]._noteOff(1e3*e.context.currentTime)):this.samples.active[t.midiNote].push(t)}function u(){function t(t){this.bufferSource=e.context.createBufferSource(),this.pre=e.context.createGainNode(),this.amp=e.context.createGainNode(),this.filter=this.filterOn&&e.context.createBiquadFilter(),this.bufferSource.connect(this.pre),this.pre.connect(this.filter||this.amp),this.filter&&this.filter.connect(this.amp),this.amp.connect(this.output),this.parent=t.parent,this.midiNote=t.midiNote,this.pre.gain.value=void 0!==t.sampleGain?_(parseInt(t.sampleGain,10)):1,this.bufferSource.playbackRate.value=h(this.midiNote)/h(f(t.baseNote)),this.bufferSource.buffer=s.getAsset("buffer",t.buffer),this.bufferLength=this.bufferSource.buffer.length/e.context.sampleRate,this.velocity=Math.pow(t.velocity/127,1.2),this.bufferSource.loop=this.parent.loop,this.filterOn&&(this.filter.Q.value=this.filterQ,this.filter.gain=this.filterGain)}return t.prototype=Object.create(this),t.prototype.output=this.input,t.prototype._noteOn=g.noteOn,t.prototype._noteOff=g.noteOff,t}var m="synth",h=t.MIDIToFrequency,f=t.toMIDINote,_=t.dbToWAVolume;l.prototype=Object.create(i,{init:{value:function(e){d.apply(this,[e.output,e.audioNodes,e.bus]),this._sustain=!1,this.samples={meta:Object.create(null),maps:Object.create(null),used:Object.create(null),active:Object.create(null),sustained:[]};for(var t,n=0,i=e.sampleMapGroups[0].sampleMaps.length;i>n;n++)t=e.sampleMapGroups[0].sampleMaps[n].name,t="multi"===t?this.instanceId:t,this.samples.meta[t]=e.sampleMapGroups[0].sampleMaps[n];for(var r in this.samples.meta)this.samples.maps[r]=s.getAsset("sampleMap",r),this.samples.used[r]=Object.create(null);a.addFrameListener(this.instanceId,c,this)}},numberOfVoices:{value:16},volume:{get:function(){return this.output.gain},set:function(e){this.output.gain.value=t.dbToWAVolume(e)}},sustain:{get:function(){return this._sustain},set:function(t){if(t)this._sustain=!0;else{this._sustain=!1;for(var n=0,a=this.samples.sustained.length;a>n;n++)this.samples.sustained[n]._noteOff(1e3*e.context.currentTime)}}},filterSustain:{get:function(){return this._filterSustain},set:function(e){this._filterSustain=Math.pow(e,4)}},controller:{value:function(e,t){switch(t.controllerType){case 64:this.sustain=!!t.value;break;case 123:t.value&&this.stopAll();break;default:o.dispatch("log:instance:synth","Unrecognized controller number for",this.instanceId,":",t.controllerType)}}},onAction:{value:function(e,t,n){n&&(this[n.type]?this[n.type](t,n):o.dispatch("log:instance:synth","Sampler does not recognize message ",n))}},getRange:{value:function(e,t){var n,a,i,s,r=this.samples.meta,o=this.samples.maps,l=this.samples.used,d=0,c=[];for(a in r)if(t>=r[a].velocityLow&&r[a].velocityHigh>=t){n=o[a];for(i in n)s=n[i],e>=f(s.low)&&f(s.hi)>=e&&c.push(s)}return 1!==c.length&&(void 0!==l[a][e]&&(d=(l[a][e]+1)%c.length),l[a][e]=d),c[d]}},noteOn:{value:function(e,t){var n,a=this.samples.active,i=t.midiNote,r=t.velocity,l=t.duration||t.endTime,d=this.getRange(i,r);return d&&d.sound?s.getAsset("buffer",d.sound)?(n=new this.Note({parent:this,sampleGain:d.vol,baseNote:d.root,buffer:d.sound,midiNote:i,velocity:r}),a[i]?a[i].length&&!this.ignoreNoteOff&&this.noteOff(e,t):a[i]=[],this.loop&&this.ignoreNoteOff&&(o.dispatch("log:instance:synth","Sampler Configuration Error: You cannot use looped samples with ignoreNoteOff."),t.duration?this.ignoreNoteOff=!1:this.loop=!1),n._noteOn(e),p.apply(this,[n,e,l]),void 0):(o.dispatch("log:instance:synth","Missing Buffer!"),void 0):(o.dispatch("log:instance:synth","missing range for",this.instanceId,"midiNote",i),void 0)}},noteOff:{value:function(t,n){var a,i,s=this.samples.active,r=this.samples.sustained,o=n.midiNote;if(o&&!this.ignoreNoteOff){if(s[o])for(a=0,i=s[o].length;i>a;a++)s[o][a]._noteOff(t||1e3*e.context.currentTime);if(!this.sustain)for(a=0,i=r.length;i>a;a++)r[a].midiNote===o&&r[a]._noteOff(t||1e3*e.context.currentTime)}}},stopAll:{value:function(){var t,n=this.samples.active,a=this.samples.sustained;for(var i in n){for(t=n[i].length;t--;)n[i][t]._noteOff(1e3*e.context.currentTime);for(t=a.length;t--;)a[t]._noteOff(1e3*e.context.currentTime)}}}});var g={noteOn:function(e){var t=e+this.ampAttack,n=t+this.ampDecay,a=1-this.ampVelocityRatio+this.velocity*this.ampVelocityRatio,i=Math.pow(this.ampSustain*a,2);if(this.noteOnTime=e,this.ampPeakValue=a,this.ampSustainValue=i,this.amp.gain.setValueAtTime(0,e/1e3),this.amp.gain.linearRampToValueAtTime(a,t/1e3),this.amp.gain.linearRampToValueAtTime(i,n/1e3),this.filterOn){var s=e+this.filterAttack,r=s+this.filterDecay,o=1-this.filterVelocityRatio+this.velocity*this.filterVelocityRatio,l=this.filterADSRAmount*o,d=this.filterFrequency+l,c=this.filterFrequency+this.filterSustain*l;d=h(12*d+this.midiNote),c=h(12*c+this.midiNote),d=20>d?20:d>2e4?2e4:d,c=20>c?20:c>2e4?2e4:c,this.filterFrequency=h(12*this.filterFrequency+this.midiNote),this.filter.frequency.setValueAtTime(this.filterFrequency,e/1e3),this.filter.frequency.linearRampToValueAtTime(d,s/1e3),this.filter.frequency.linearRampToValueAtTime(c,r/1e3)}this.bufferSource.noteOn(this.noteOnTime/1e3)},noteOff:function(e){var t,n;t=e+this.ampRelease,n=e+this.filterRelease,this.amp.gain.cancelScheduledValues(e/1e3),this.amp.gain.setValueAtTime(this.ampSustainValue,e/1e3),this.amp.gain.linearRampToValueAtTime(0,t/1e3),this.filter&&(this.filter.frequency.cancelScheduledValues(e/1e3),this.filter.frequency.setValueAtTime(this.filter.frequency.value,e/1e3),this.filter.frequency.linearRampToValueAtTime(this.filterFrequency,n/1e3)),this.bufferSource.noteOff(t/1e3),this.disposeTime=t/1e3,this.noteOffSent=!0}};e.registerInstance(m,"sampler",l)}),dmaf("timePatternPlayer",["DMAF","TimeManager","InstanceManager","Instance","Assets","Utils","events"],function(e,t,n,a,i,s,r){function o(){this.activePatterns=[],this.running=!1}o.prototype=Object.create(a,{init:{value:function(){}},onAction:{value:function(e,n){var a=e.split("."),i=a[1].toLowerCase(),s=a[0];r.dispatch("instance:player:timePatternPlayer",e),this[i]&&this[i](s,n),this.running||(this.running=!0,t.addFrameListener(this.instanceId,this.checkPatterns,this))}},start:{value:function(e,t){var n=i.getAsset("timePattern",e);n?(-1===this.activePatterns.indexOf(n)?this.activePatterns.push(n):r.dispatch("log:instance:player:timePatternPlayer","Time Pattern",e,"is already active!"),n.startTime=t):r.dispatch("log:error","No time pattern with id ",e,"exists.")}},stop:{value:function(e){var t,n=i.getAsset("timePattern",e);n?("DEFAULT"===this.behavior&&n.reset(),t=this.activePatterns.indexOf(n),-1!==t&&this.activePatterns.splice(t,1)):r.dispatch("log:instance:player:timePatternPlayer","No time pattern with id ",e,"exists.")}},checkPatterns:{value:function(){if(!this.activePatterns.length)return this.running=!1,t.removeFrameListener(this.instanceId);for(var e=0;this.activePatterns.length>e;e++)this.activePatterns[e].executeEvents(this.behavior)&&this.activePatterns.splice(e--,1)[0].reset()}}}),e.registerInstance("player","timePatternPlayer",o)}),dmaf("log",["DMAF","events"],function(e,t){function n(){if(dmaf.log){var t=[].slice.call(arguments);t[0]&&(t[0]="DMAF:"+t[0]),t.unshift(Math.floor(1e3*e.context.currentTime)),console.log.apply(console,t)}}return function(e){e=e||[];for(var a=0;e.length>a;a++)t.add("log:"+e[a],n);t.add("log:error",n)}}),dmaf("Assets",["DMAF","events"],function(e,t){function n(e){t.dispatch("_external:progress"),e&&a.preloads--,0===a.preloads&&(t.remove("_internal:asset_loaded",n),t.dispatch("log:assets","Assets have completed loading."),t.dispatch("_internal:preloads_complete")),a.loaded++}var a=e.Assets={loaded:0,preloads:0,beatPattern:{},timePattern:{},sampleMap:{},buffer:{},getAsset:function(e,n){return this[e]&&this[e][n]?this[e][n]:(t.dispatch("log:error","DMAF couldn't find asset",e,n),null)},setAsset:function(e,t,n){this[e][t]=n}};return t.add("_internal:asset_loaded",n),a}),dmaf("AudioManager",["DMAF","events"],function(e,t){function n(e){t.dispatch("log:error:audioElement",e)}function a(){this._.playing&&(this._.playing=!1,this._.controller.checkFinished(),c.splice(c.indexOf(this),1),l(this,!1))}function i(){this._.timestamp=(new Date).getTime(),this._.playing=!0}function s(){this._.loaded=!0,t.dispatch("_internal:"+this.id+".READY",this)}function r(t,n){return t.id=n,t._.loaded=!1,t.src=m+n+e.format,t.load(),t}function o(e,t){return e._.controller=t,c.push(e),e}function l(e,t){if(t&&e.pause(),-1!==c.indexOf(this))throw Error("inactive sound trying to be made inactive");return e._.controller=null,p.push(e),e}function d(e,t,n){for(var a=0,i=t.length;i>a;a++)if(t[a]&&t[a].id)return n?t.splice(a,1)[0]:t[a];return null}var c=[],p=[],u=32,m=e.Settings.assetsPath+"audio/";return{init:function(){var e,t;for(t=0;u>t;t++)e=new Audio,e._={controller:null,loaded:!1,playing:!1},e.addEventListener("canplaythrough",s,!1),e.addEventListener("error",n,!1),e.addEventListener("ended",a,!1),e.addEventListener("pause",a,!1),e.addEventListener("play",i,!1),p[t]=e},preloadElement:function(e){var n;p.length?(n=d(e,p,!1),n?(t.dispatch("log:audioManager:preloadElement","Element was already loaded"),setTimeout(function(){t.dispatch("_internal:"+e+".READY",n)},1)):(n=p.shift(),p.push(n),r(n,e))):t.dispatch("log:error:audioElement","Preload failed for "+e+". There were no inactive elements.")},requestElement:function(e,n){var a=d(e,c,!1);return a&&!a._.playing?(a._.controller||console.error("WTF"),a):(p.length?(a=d(e,p,!0),a||(a=p.shift(),r(a,e))):(a=d(e,c,!0),a?l(a,!0):(a=c.shift(),l(a,!0),r(a,e)),t.dispatch("log:audioManager","mov")),o(a,n))}}}),dmaf("InstanceManager",[],function(){function e(e){this.activeInstances={},this.constructor=e}return e.prototype.getInstance=function(e){return this.activeInstances[e]},e.prototype.removeInstance=function(e){return delete this.activeInstances[e]},e.prototype.addInstance=function(e){this.activeInstances[e.instanceId]=e},e.prototype.createInstance=function(e){var t=new this.constructor(e);return t.setInitProperties(e),this.addInstance(t),t},e}),dmaf("TimeManager",["DMAF","events"],function(e,t){function n(){if(!o.length)return l=!1,void 0;for(i=1e3*d.currentTime,s=0;o.length>s;s++)o[s].callback.call(o[s].context,i);e.lastTime=e.currentTime,e.currentTime=e.context.currentTime,e.lastTime===e.currentTime,setTimeout(n,30)}function a(e){for(var t=o.length;t--;)if(o[t].id===e)return!0;return!1}var i,s,r=Array.prototype.slice,o=[],l=!1,d=e.context;return e.preListen=30,e.lastTime=0,e.currentTime=-1,{checkFunctionTime:function(t,n,a,i){var s,o,l,d=r.call(arguments,4);i=i||e,t>=1e3*e.context.currentTime+e.preListen?(s=function s(){a.splice(a.indexOf(o),1),n.apply(i,d)},l=t-1e3*e.context.currentTime-e.preListen,o=setTimeout(s,l),a.push(o)):n.apply(i,d)},dropPendingArray:function(e){for(;e.length;)clearTimeout(e.pop())},addFrameListener:function(i,s,r){return a(i)?(t.dispatch("log:manager:timeManager","That frame listener is already running!",i),void 0):(o.push({callback:s,context:r||e,id:i}),l||(l=!0,setTimeout(n,0)),void 0)},removeFrameListener:function(e){for(var t=o.length;t--;)if(o[t].id===e)return o.splice(t,1),!0;return!1}}}),dmaf("parseActions",["DMAF","Utils"],function(e,t){function n(e){var n=[];return t.each(e,function(e,t){"array"===t.type&&n.push(t)}),n}function a(e,n){return t.each(n,function(a){t.isType("undefined",e[a])&&(e[a]=p(n[a]))}),e}function i(e){var n;return t.each(d.action,function(a,i){return t.each(i,function(t,a){return t===e?n=a:void 0}),n}),n||console.error("Could not find action with Id of",e)}function s(e){return Object.keys(d.type[e]).filter(function(e){return"type"!==e})}function r(e,i,s){var r=t.tag(e,"properties"),d=n(i),p={};return t.each(r,function(e,t){t.localName&&o(p,t,i)}),t.each(d,function(n,a){if(c(e)){var i=t.tag(e,a.name)[0]||[];p[a.name]=i?l(i,a.valueType):[]}else p[a.name]=[]}),a(p,i,s)}function o(e,n,a){for(var i=n.attributes,s=0,r=i.length;r>s;s++)if(void 0===a[i[s].localName]&&"triggers"!==i[s].localName&&"delay"!==i[s].localName)return console.error("Invalid attribute",i[s].localName,"check spelling in descriptors");t.each(a,function(a,i){var s;n.hasAttribute(a)&&(s=t.attr(n,a),!/\:/.test(s)||/target/.test(a)||/_external/.test(s)?(s=t.fromString(i.type,s,i),e[a]=t.verify(i,s)):(e._dynamicValues=e._dynamicValues||[],e._dynamicValues.push({key:a,string:s}),e[a]=p(i)))})}function l(e,a){if(c(e)){var i=s(a),r=[],p=[],u=d.type[a];return t.each(e.childNodes,function(t,n){n&&c(n)&&(n.parentElement===e||n.parentNode===e)&&n.localName&&-1!==i.indexOf(n.localName)&&r.push(n)}),t.each(r,function(a,i){if(i.localName&&u[i.localName]){var s={id:i.localName},r=n(u[s.id]);o(s,i,u[s.id]),t.each(r,function(n,a){var i=t.tag(e,a.name)[0];s[a.name]=i&&c(i)?l(i,a.valueType):[]}),p.push(s)}}),p}return[]}var d,c=t.prop("getElementsByTagName"),p=t.prop("default");return function(n){var a=t.tag(n,"actions")&&t.tag(n,"actions")[0].childNodes,s=[],o=[];if(!a)throw Error("Missing action tag in config!");if(!a.length)throw Error("Found zero actions! Cannot continue");return d=e.Settings.descriptors,t.each(a,function(e,t){t&&t.localName&&c(t)&&(-1!==d.validActions.indexOf(t.localName)?s.push(t):console.error("Unrecognized action!",t.localName,"check spelling."))}),t.each(s,function(e,n){if(n.localName&&c(n)){var a=n.localName,s=i(a),l=r(n,s,n.localName),d=s.type,p=t.attr(n,"triggers"),u=t.attr(n,"delay")||0,m=t.attr(n,"instanceId")||l.instanceId||"",h={};if(!p)return console.error("Action",d,a,l.instanceId,"has no triggers!"),!0;p=t.removeWhiteSpace(p).split(","),t.extend(l,h),h.id=a,h.type=d,h.triggers=p,h.delay=parseInt(h.delay||u,10),h.instanceId=m||"",h.multi="multi"===m,o.push(h)}}),o}}),dmaf("parseDescriptors",["Utils","DMAF"],function(e,t){function n(t){for(var n,a=t.attributes,i={},s=0,r=a.length;r>s;s++)n=a[s].nodeName,e.propertyModel[n]&&(i[n]=e.fromString(e.propertyModel[n],a[s].value,t));return i}var a="getElementsByTagName",i="getAttribute";return function(s){var r,o,l,d,c,p=s[a]("descriptor"),u={validActions:[],validTypes:[]};return e.each(p,function(t,s){s[i]&&(c=s[i]("id"),d=s[i]("type"),l=s[i]("class"),u[l]=u[l]||{},u[l][d]=u[l][d]||{},u[l][d][c]=o=u[l][d][c]||{},u[l][d][c].type=d,u[l][d][c].id=c,u[l][d].type=d,"action"===l&&u.validActions.push(c),"type"===l&&u.validTypes.push(c),r=s[a]("property"),e.each(r,function(e,t){t[i]&&(o[t[i]("name")]=n(t))}))}),t.Settings||(t.Settings={}),t.Settings.descriptors=u,u}}),dmaf("parseMidi",["Assets","timePattern","beatPattern","events"],function(e,t,n,a){function i(e,t,n){this.absoluteTime=t+e.readVariableLengthInt();var a=e.read8BitInt();240==(240&a)?this.getMetaEvent(e,a):this.getChannelEvent(e,a,n)}function s(e){this.pointer=0,this.midiString=e}function r(e){s.call(this,e.split("").map(c).join("")),this.tracks=[],this.chunk={},this.lastEventType=0,this.getNextChunk("MThd").readHeader().getTracks()}function o(n,a){var i,s,r,o,l,c,p,u,m,h,f;for(c=0,p=n.trackCount;p>c;c++){for(o=n.tracks[c],i=o[0].text||a+c+"",trigger=o[1].text||a+c+"",r=[],u=0,m=o.length;m>u;u++)if("setTempo"===o[u].subtype){f=6e7/o[u].microsecondsPerBeat;break}for(u=0,m=o.length;m>u;u++)if("noteOn"===o[u].subtype){for(l=o[u],l.type=l.subtype,l.trigger=trigger,h=u;m>h&&!d(o[h],l);h++);l.absoluteTime=6e4*l.absoluteTime/(n.ticksPerBeat*f)+1,l.duration=6e4*l.duration/(n.ticksPerBeat*f),r.push(l)}s=new t(i,r),e.setAsset("timePattern",i,s)}}function l(t,a){var i,s,r,o,l,c,p,u,m,h,f,_;for(c=1,p=t.trackCount;p>c;c++){for(o=t.tracks[c],i=o[0].text||a+c+"",s=o[1].text||a+c+"",r=new n(i,1),u=2,m=o.length;m>u;u++)if("noteOn"===o[u].subtype||"controller"===o[u].subtype){for(l=o[u],l.type=l.subtype,h=Math.floor(l.absoluteTime/t.beatLengthInTicks),f=Math.floor(l.absoluteTime-h*t.beatLengthInTicks),_=u;m>_&&!d(o[_],l);_++);r.addEvent(s,h+1,f+1,l)}else"controller"===o[u].subtype&&(l=o[u],l.type=l.subtype,h=Math.floor(l.absoluteTime/t.beatLengthInTicks),f=Math.floor(l.absoluteTime-h*t.beatLengthInTicks),r.addEvent(s,h+1,f+1,l));e.setAsset("beatPattern",i,r)}}function d(e,t){var n=("noteOn"===e.subtype||"noteOff"===e.subtype)&&e.subtype;return n&&e.midiNote===t.midiNote?"noteOn"===n&&!e.velocity||"noteOff"===n?(t.duration=e.absoluteTime-t.absoluteTime,t.duration):void 0:!1}function c(e){return String.fromCharCode(255&e.charCodeAt(0))}return i.prototype={getMetaEvent:function(e,t){var n,i;if(255==t){switch(this.type="meta",i=e.read8BitInt(),n=e.readVariableLengthInt(),i){case 0:if(this.subtype="sequenceNumber",2!=n)return;return this.number=e.read16BitInt(),void 0;case 1:return this.subtype="text",this.text=e.readTo(n),void 0;case 2:return this.subtype="copyrightNotice",this.text=e.readTo(n),void 0;case 3:return this.subtype="trackName",this.text=e.readTo(n),void 0;case 4:return this.subtype="instrumentName",this.text=e.readTo(n),void 0;case 5:return this.subtype="lyrics",this.text=e.readTo(n),void 0;case 6:return this.subtype="marker",this.text=e.readTo(n),void 0;case 7:return this.subtype="cuePoint",this.text=e.readTo(n),void 0;case 32:if(this.subtype="midiChannelPrefix",1!==n)return;return this.channel=e.read8BitInt(),void 0;case 47:return this.subtype="endOfTrack",void 0;case 81:if(this.subtype="setTempo",3!=n)return;return this.microsecondsPerBeat=(e.read8BitInt()<<16)+(e.read8BitInt()<<8)+e.read8BitInt(),void 0;case 84:if(this.subtype="smpteOffset",5!=n)return;var s=e.read8BitInt();return this.frameRate={0:24,32:25,64:29,96:30}[96&s],this.hour=31&s,this.min=e.read8BitInt(),this.sec=e.read8BitInt(),this.frame=e.read8BitInt(),this.subframe=e.read8BitInt(),void 0;case 88:if(this.subtype="timeSignature",4!==n)return;return this.numerator=e.read8BitInt(),this.denominator=Math.pow(2,e.read8BitInt()),this.metronome=e.read8BitInt(),this.thirtyseconds=e.read8BitInt(),void 0;case 89:if(this.subtype="keySignature",2!==n)return;return this.key=e.read8BitInt(),this.scale=e.read8BitInt(),void 0;case 127:return this.subtype="sequencerSpecific",this.data=e.readTo(n),void 0;default:return this.subtype="unknown",this.data=e.readTo(n),void 0}return this.data=e.readTo(n),void 0}return 240==t?(this.type="sysEx",n=e.readVariableLengthInt(),this.data=e.readTo(n),void 0):247==t?(this.type="dividedSysEx",n=e.readVariableLengthInt(),this.data=e.readTo(n),void 0):(this.type="unknown",n=e.readVariableLengthInt(),this.data=e.readTo(n),a.dispatch("log:parsing:midi","unknown MIDI event type byte of length"+n),void 0)},getChannelEvent:function(e,t,n){var i,s;switch(0===(128&t)?(s=t,t=n.lastEventType):(s=e.read8BitInt(),n.lastEventType=t),i=t>>4,this.channel=15&t,this.type="channel",i){case 8:this.subtype="noteOff",this.midiNote=s,this.velocity=e.read8BitInt();break;case 9:this.midiNote=s,this.velocity=e.read8BitInt(),this.subtype=0===this.velocity?"noteOff":"noteOn";break;case 10:this.subtype="noteAftertouch",this.midiNote=s,this.amount=e.read8BitInt();break;case 11:this.subtype="controller",this.controllerType=s,this.value=e.read8BitInt();break;case 12:this.subtype="programChange",this.programNumber=s;break;case 13:this.subtype="channelAftertouch",this.amount=s;break;case 14:this.subtype="pitchBend",this.value=s+(e.read8BitInt()<<7);break;default:this.subtype="unknown",a.dispatch("log:parsing:midi","Unrecognised MIDI event type: "+i)}}},s.prototype={read32BitInt:function(){var e=(this.midiString.charCodeAt(this.pointer)<<24)+(this.midiString.charCodeAt(this.pointer+1)<<16)+(this.midiString.charCodeAt(this.pointer+2)<<8)+this.midiString.charCodeAt(this.pointer+3);return this.pointer+=4,e},read16BitInt:function(){var e=(this.midiString.charCodeAt(this.pointer)<<8)+this.midiString.charCodeAt(this.pointer+1);return this.pointer+=2,e},read8BitInt:function(){var e=this.midiString.charCodeAt(this.pointer);return this.pointer+=1,e},readTo:function(e){var t=this.midiString.substr(this.pointer,e);return this.pointer+=e,t},endOfFile:function(){return this.pointer>=this.midiString.length},readVariableLengthInt:function(){for(var e=0;;){var t=this.read8BitInt();if(!(128&t))return e+t;e+=127&t,e<<=7}}},r.prototype=Object.create(s.prototype,{readHeader:{value:function(){var e=new s(this.chunk.data);return this.formatType=e.read16BitInt(),this.trackCount=e.read16BitInt(),this.ticksPerBeat=e.read16BitInt(),32768&this.ticksPerBeat&&(this.ticksPerBeat=480,a.dispatch("log:parsing:midi","Time division in SMPTE, defaulting to 480 ticks per beat")),this.beatLengthInTicks=this.ticksPerBeat/4,this}},getTracks:{value:function(){for(var e,t,n,a=0,r=this.trackCount;r>a;a++)for(this.tracks[a]=[],t=0,this.getNextChunk("MTrk"),e=new s(this.chunk.data);!e.endOfFile();)n=new i(e,t,this),this.tracks[a].push(n),t=n.absoluteTime;return this}},getNextChunk:{value:function(e){return this.chunk.id=this.readTo(4),this.chunk.id!==e?(a.dispatch("log:parsing:midi",e,"but found",this.chunk.id),this):(this.chunk.length=this.read32BitInt(),this.chunk.data=this.readTo(this.chunk.length),this)}}}),function(e,t,n){var a=new r(e);switch(t){case"beatPattern":l(a,n);break;case"timePattern":o(a,n);break;default:l(a,n)}}}),dmaf("Parse",["DMAF","Assets","parseSampleMap","parseMidi","parseDescriptors","parseActions","events"],function(e,t,n,a,i,s,r){var o={midi:a,samplemap:n,descriptors:i,actions:s};return function(t){var n=Array.prototype.slice.call(arguments,1);return o[t]?o[t].apply(e,n):(r.dispatch("log:parsing","DMAF.parse: invalid type",t),null)}}),dmaf("parseSampleMap",["Assets","Utils","events"],function(e,t,n){function a(e){n.dispatch("log:error","Malformed Samplemap!",e||"No information about this error!")}function i(e,n){return t.attr(n,e)||a("Could not find required property "+e,n)}return function(n){var s,r,o,l=t.tag(n,"samplemap"),d=["sound","root","low","hi","vol"];t.each(l,function(n,l){return r=t.attr(l,"name"),s=t.tag(l,"range"),o={},"string"!=typeof r?a("name is undefined"):s&&s.length?(t.each(s,function(e,n){var a=o["range_"+e]={};t.each(d,function(e,t){a[t]=i(t,n)})}),e.setAsset("sampleMap",r,o),void 0):a("Couldn't find ranges for "+r)})}}),dmaf("beatPattern",["DMAF","Assets","events"],function(e,t,n){function a(e,t,n,a){this.eventName=e,this.beat=t,this.tick=n||1,this.data=a}function i(e,t){this.events={},this.patternId=e,this.startPosition=t||1,this.endPosition=0}return a.prototype.execute=function(e,t){var a=Object.create(this.data);e=Math.floor(e+(this.tick-1)*(t/120)),a.duration=e+a.duration*(t/120)/1e3-e,a.duration*=1e3,n.dispatch(this.eventName,e,a)},i.prototype.addEvent=function(e,t,n,i){this.events[t]=this.events[t]||[],this.events[t].push(new a(e,t,n,i)),t+1>this.endPosition&&(this.endPosition=t+1)},t.setAsset("beatPattern","empty_pattern",new i("empty_pattern",1)),i}),dmaf("beatPatternInstance",["beatPosition","events"],function(e,t){function n(n,a){if(!a.beatPattern)return t.dispatch("log:error:beatPatternInstance","Found no BeatPattern for channel",a.channel,". Please check MIDI file."),this.ERROR=!0,void 0;if(this.addAtSongPosition=a.addAtSongPosition,this.currentBeat=a.startPatternAtBeat,this.replaceActive=a.replaceActive,this.clearPosition=a.clearPosition,this.setAsCurrent=a.setAsCurrent,this.beatPattern=a.beatPattern,this.patternId=a.patternId,this.channel=a.channel,this.loop=a.loop,this.player=n,this.loop)a.loopLength?(this.loopLength=a.loopLength,this.removeAtSongPosition=new e(1/0,1,this.player.beatsPerBar)):t.dispatch("log:error:beatPatternInstance","You must specify a loopLength for pattern "+this.patternId+" if loop is set to true."),this.currentBeat===this.loopLength&&(this.currentBeat=1);else{var i=this.beatPattern.endPosition-this.currentBeat;this.removeAtSongPosition=this.addAtSongPosition.clone(),this.removeAtSongPosition.addOffset({bar:0,beat:i})}}return n.prototype.gotoNextBeat=function(){this.currentBeat++,this.loop&&this.currentBeat>this.loopLength&&(this.currentBeat=1)},n.prototype.executeEvents=function(e,t){var n=this.beatPattern.events[this.currentBeat];if(n)for(var a=0,i=n.length;i>a;a++)n[a].execute(e,t)},n}),dmaf("beatPosition",[],function(){function e(e,t,n){this.bar=void 0===e?1:e,this.beat=void 0===t?1:t,this.beatsPerBar=void 0===n?16:n}return e.prototype.getInBeats=function(){return(this.bar-1)*this.beatsPerBar+this.beat},e.prototype.gotoNextBeat=function(){this.beat===this.beatsPerBar?(this.bar++,this.beat=1):this.beat++},e.prototype.addOffset=function(e){for(this.beat+=e.beat;this.beat>this.beatsPerBar;)this.bar++,this.beat-=this.beatsPerBar;this.bar+=e.bar},e.prototype.clone=function(){return new e(this.bar,this.beat,this.beatsPerBar)},e}),dmaf("timePattern",["DMAF","events","Utils"],function(e,t,n){function a(e,t){this.patternId=e,this.events=t,this.startTime=-1,this.lastExecutedEventTime=-1,this.remove=!1}return a.prototype={reset:function(){this.startTime=-1,this.lastExecutedEventTime=-1,this.remove=!1},executeEvents:function(t){var n=1e3*e.context.currentTime-this.startTime,a=-1;switch(t){case"LINEAR":this.executeLinear(n,a);break;case"DEFAULT":this.executeDefault(n,a)}return this.remove},executeLinear:function(a){var i,s;for(i=0,s=this.events.length;s>i;i++)this.events[i].absoluteTime>this.lastExecutedEventTime&&a>this.events[i].absoluteTime-e.preListen&&(dmaf.log&&t.dispatch("log:pattern:timePattern","dispatching",this.events[i].trigger),t.dispatch(this.events[i].trigger,this.startTime+this.events[i].absoluteTime,n.clone(this.events[i])),this.lastExecutedEventTime=this.events[i].absoluteTime);a>this.events[s-1].absoluteTime+300&&(this.remove=!0)},executeDefault:function(a,i){var s,r;if(-1===this.lastExecutedEventTime){for(s=0,r=this.events.length;r>s;s++)a>this.events[s].absoluteTime-e.preListen&&(dmaf.log&&t.dispatch("log:pattern:timePattern","dispatching",this.events[s].trigger),t.dispatch(this.events[s].trigger,this.startTime+this.events[s].absoluteTime,n.clone(this.events[s])),i=this.events[s].absoluteTime);this.lastExecutedEventTime=i,a>this.events[r-1].absoluteTime+300&&(this.remove=!0)}else this.executeLinear(a,i)}},a}),dmaf("Iterator",[],function(){function e(e,n){this.index=-1,this.array=e,this.getNext=t[n],this.A=e.slice(0),this.B=[]}var t={ROUND_ROBIN:function(){return this.index++,this.index%=this.array.length,this.array[this.index]},RANDOM_FIRST:function(){return-1===this.index?this.array[Math.floor(Math.random()*this.array.length)]:this.array[++this.index]},RANDOM:function(){return this.array[Math.floor(Math.random()*this.array.length)]},SHUFFLE:function(){var e;this.A.length||(this.A=this.array.slice(0),this.B=[]);do e=Math.floor(Math.random()*this.A.length);while(this.A[e]===this.previous);return this.B.push(this.A.splice(e,1)[0]),this.previous=this.B[this.B.length-1],this.previous}};return e}),dmaf("Utils",["events"],function(e){function t(e,t){return function(n){return n&&n[e]===t}}function n(e,t){return function(n){return n&&n[e]!==t}}function a(e,t,n,a,i,s){var r=t-e,o=a-n;return function(a){a=Math.max(a,e),a=Math.min(a,t);var i=o*(a-e)/r+n;return s&&(i=parseInt(i,10)),i}}function i(e){return function(t){return t[e]}}function s(t,n,a){var i,s,o,l=0;if(a=r(_,a)&&a||null,r(g,t))for(l=0,o=t.length;o>l&&!n.call(a,l,t[l]);l++);else if("object"==typeof t)for(i=Object.keys(t),l=0,o=i.length;o>l&&(s=i[l],"length"===s||!n.call(a,s,t[s]));l++);else e.dispatch("log:error","Not array or object",typeof t,t),console.log(t,n,a)}function r(e,t){switch(e){case u:return t===+t&&0===t%1;case m:return t===+t;case y:return t===void 0||"undefined"===t;case f:return"boolean"==typeof t;case h:return"string"==typeof t;case g:return"[object Array]"===x.call(t);case v:return"[object Function]"===x.call(t);case _:return"[object Object]"===x.call(t);default:return!1}}function o(e){var t;return s(b,function(n,a){return r(a,e)?(t=a,!0):void 0}),t}function l(e,t){return s(e,function(e,n){r(_,n)?(t[e]={},l(n,t[e])):r(g,n)?(t[e]=[],l(n,t[e])):t[e]=n
}),t}function d(t){var n;if(r(_,t))n={};else{if(!r(g,t))return e.dispatch("log:error","cannot clone non object",t),void 0;n=[]}return l(t,n)}function c(t,n){return t>n.max&&(e.dispatch("log:error",t,"is out of range. constraining",n.name,"to:",n.max),t=n.max),n.min>t&&(e.dispatch("log:error",t,"is out of range. constraining",n.name,"to:",n.min),t=n.min),t}function p(t,n){var a;if(r("undefined",t)||!t.type)return console.error("log:error","DMAF Verification Error: Malformed descriptor!"),void 0;if(r("undefined",n))return M(t);switch(t.type){case"int":if(n=parseInt(n,10),!N.test(n)){a=!0;break}n=c(n,t);break;case"float":if(n=parseFloat(n),!r(m,n)&&!r(u,n)){a=!0;break}n=c(n,t);break;case"string":"undefined"===n&&(n=void 0),"string"!=typeof n&&(a=!0);break;case"list":a=!(n instanceof Array);break;case"enum":r("array",t.values)?-1===t.values.indexOf(n)&&(e.dispatch("log:error",n,"is not valid enum for",t.name),a=!0):(e.dispatch("log:error","Malformed descriptors object",t.name),a=!0);break;case"boolean":a=!r("boolean",n);break;default:e.dispatch("log:error","Malformed defaults object. Please check the descriptors.xml")}return a?(e.dispatch("log:error",n,"is not valid for",t.name),e.dispatch("log:error","Defaulting",t.name,"to",M(t)),M(t)):n}var u="int",m="float",h="string",f="boolean",_="object",g="array",y="undefined",v="function",b=[u,m,h,f,_,g,y,v],A={cflat:-1,c:0,csharp:1,dflat:1,d:2,dsharp:3,eflat:3,e:4,esharp:5,fflat:4,f:5,fsharp:6,gflat:6,g:7,gsharp:8,aflat:8,a:9,asharp:10,bflat:10,b:11,bsharp:12},T={automatable:"boolean","default":"fromType",valueType:"string",value:"fromType",min:"fromType",max:"fromType",name:"string",type:"string",values:"list",unit:"string",src:"string"},P="getAttribute",E="getElementsByTagName",N=/^\s*-?[0-9]{1,10}\s*$/,I=Object.prototype,x=I.toString,M=i("default");return{ajax:function(t,n,a){function i(){if(4===this.readyState){var n,i=a&&a.context||null,d=this.status>=200&&300>this.status||304===this.status;if(!d||!this.response)return r.onerror=function(){},s();if(a&&a.expectType&&typeof this.response!==a.expectType)return s();if(n=a.responseXML?this.responseXML:this.response,a.responseXML&&!this.responseXML)return e.dispatch("log:error","Problem with XMLHttpRequest: XML is missing or malformed.",t),s();for(var c=0,p=l.length;p>c;c++)o.unshift(n),n=l[c].apply(i,o)}}var s,r=new XMLHttpRequest,o=[],l=[n];a?(a.override&&r.overrideMimeType(a.override),a.chain&&(l=l.concat(a.chain)),a.args&&(o=o.concat(a.args))):a={},s=a.fail?a.fail:function(){e.dispatch("log:error","DMAF ajax: Problem with request",t)},r.onerror=s,r.onreadystatechange=i,r.open("GET",t,!0),a&&a.responseType&&(r.responseType=a.responseType),r.send()},clone:d,constrain:c,attr:function(e,t){return e&&t&&e[P]?e[P](t):null},average:function(e){return sum(e)/e.length},dbToJSVolume:function(e){var t=Math.max(0,Math.round(100*Math.pow(2,e/6))/100);return Math.min(1,t)},dbToWAVolume:function(e){return Math.max(0,Math.floor(100*Math.pow(2,e/6))/100)},capitalize:function(e){return e.charAt(0).toUpperCase()+e.slice(1)},each:s,extend:l,fromString:function(t,n,a){if(n===void 0||"undefined"===n)return void 0;switch(t){case"string":return n;case"boolean":return"true"===n;case"int":return parseInt(n,10);case"float":return parseFloat(n);case"list":return n.split(",");case"enum":return n;case"fromType":return this.fromString(a[P]("type"),n,a);default:e.dispatch("log:error","DMAF convert string to value",t,n,a)}},getType:o,add:function(e,t){return e+t},subtract:function(e,t){return e-t},sum:function(e){return e.reduce(add)},prop:i,propIs:t,propIsnt:n,isType:r,MIDIToFrequency:function(e){return 8.1757989156*Math.pow(2,e/12)},nope:function(){},parseProperty:function(e){for(var t,n=e.attributes,a={},i=0,s=n.length;s>i;i++)t=n[i].nodeName,T[t]&&(a[t]=fromString(T[t],n[i].value,e));return a},propertyModel:T,removeWhiteSpace:function(e){return e.replace(/\s+/g,"")},scaler:a,tag:function(e,t){return e&&t&&e[E]?e[E](t):null},toMIDINote:function(e){var t,n,a,i;return"#"===e[1]||"s"===e[1].toLowerCase()?(n=e[0].toLowerCase()+"sharp",i=2):"b"===e[1]?(n=e[0].toLowerCase()+"flat",i=2):(n=e[0].toLowerCase(),i=1),n=A[n],a="-"===e[i]?12*(0-parseInt(e[i+1],10)+2):12*(parseInt(e[i],10)+2),t=a+n},verify:p}}),dmaf("CheckMobile",["DMAF","Instance","events"],function(e,t,n){function a(){}var i=!1,s={Android:function(){return navigator.userAgent.match(/Android/i)},BlackBerry:function(){return navigator.userAgent.match(/BlackBerry/i)},iOS:function(){return navigator.userAgent.match(/iPhone|iPad|iPod/i)},Opera:function(){return navigator.userAgent.match(/Opera Mini/i)},Windows:function(){return navigator.userAgent.match(/IEMobile/i)},any:function(){return s.Android()||s.BlackBerry()||s.iOS()||s.Opera()||s.Windows()}};a.prototype=Object.create(t,{onAction:{value:function(e){switch(e){case"splash_screen":null===s.any()?(n.dispatch("init_beatpatternplayer"),n.dispatch("splash_screen_music")):i===!0&&n.dispatch("splash_screen_music");break;case"info_screen":null===s.any()?n.dispatch("info_screen_music"):i===!0?n.dispatch("info_screen_music"):(n.dispatch("init_beatpatternplayer"),n.dispatch("info_screen_music"),i=!0)}}}}),e.registerInstance("customCode","CheckMobile",a)}),dmaf("LevelTransposer",["DMAF","Instance"],function(e,t){function n(){this.transposeValue=0,this.lastActionTime=-5e3}n.prototype=Object.create(t,{onAction:{value:function(e,t){var n=5e3>t-this.lastActionTime;switch(e){case"transpose_midi":if(n)return;this.transposeValue++;break;case"transpose_midi_reset":this.transposeValue=0}this.lastActionTime=t}}}),e.registerInstance("customCode","LevelTransposer",n)});
});
require.register("slam/lib/sound.js", function(exports, require, module){
var dmaf = require('./dmaf.min')
  , cookie = require('cookie')
  , $ = require('jquery')

// sound('on') / sound('off') / sound()

module.exports = function sound(toggle,skipTrackGA,skipCookie){
  var el = $('.sound-switch');
  if( typeof toggle == 'undefined' ){
    toggle = el.hasClass('on') ? 'off' : 'on';
  } else if( toggle == 'on' || toggle == 'off' ){
    toggle = toggle
  } else {
    toggle = toggle ? 'on' : 'off';
  }

  switch(toggle){
    case 'on':

      if( !skipTrackGA) _gaq.push(['_trackEvent', 'sound', 'on']);
      el.removeClass('off').addClass('on');
      if( dmaf.tell ) dmaf.tell('sound_on');
      if(!skipCookie) cookie('sound', 'on');
      break;

    case 'off':
      if( !skipTrackGA) _gaq.push(['_trackEvent', 'sound', 'off']);
      el.removeClass('on').addClass('off');
      if( dmaf.tell ) dmaf.tell('sound_off');
      if(!skipCookie) cookie('sound', 'off');
      break;

    default:
      throw new Error('you\'re doing it wrong.');
  }
}
});
require.register("slam/lib/themes.js", function(exports, require, module){
var settings = require('./settings')
    , $ = require('jquery');

function Themes() {

    this.white = 0xedecd6
    //this.white = 0xf9f9db

    this.currentThemeIndex = 0;
    this.list = [

        //only used as initiator in settings
        new Theme({}),

        //level 1
        new Theme({name:"default"}),

        //green
        new Theme({
            name:"green",
            puckColor: 0xffda00,
            arenaColor: 0xcdb380,
            terrainColor1: 0x036564,
            terrainColor2: 0x033649,
            terrainColor3: 0x033649,
            treeBranchColor: 0x031634,
            iconColor: 0xffda00,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,

            countdown1:'#ef0505',
            countdown2:'#19b9b7',
        }),

        //purple
        new Theme({
            name:"purple",
            puckColor: 0xffda00,
            arenaColor: 0xb38184,
            terrainColor1: 0x73626e,
            terrainColor2: 0x413e4a,
            terrainColor3: 0x413e4a,
            treeBranchColor: 0x413e4a,
            iconColor: 0xffda00,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,

            countdown1:'#b38184',
            countdown2:'#413e4a',
        }),

        //pastell
        new Theme({
            name:"pastell",
            puckColor: 0xffda00,
            arenaColor: 0xcc2a41,
            terrainColor1: 0x64908a,
            terrainColor2: 0x424254,
            terrainColor3: 0x351330,
            treeBranchColor: 0x424254,
            iconColor: 0x04c4c7f,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,

            countdown1:'#cc2a41',
            countdown2:'#015c50',
        }),


        //pink
        new Theme({
            name:"pink",
            puckColor: 0xffda00,
            arenaColor: 0x5e9fa3,
            terrainColor1: 0xdcd1b4,
            terrainColor2: 0xb05574,
            terrainColor3: 0xb6ac90,
            treeBranchColor: 0xb65957,
            iconColor: 0xffda00,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,
            darken: true,

            countdown1:'#b05574',
            countdown2:'#5e9fa3',

        }),

        //light
        new Theme({
            name:"light",
            puckColor: 0xffda00,
            arenaColor: 0xab526b,
            terrainColor1: 0xf4ebc3,
            terrainColor2: 0xbca297,
            terrainColor3: 0xbca297,
            treeBranchColor: 0xc5ceae,
            iconColor: 0x4c4c7f,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,
            darken: true,

            countdown1:'#bca297',
            countdown2:'#c5ceae',
        }),

        //pastell green
        new Theme({
            name:"pastell green",
            puckColor: 0xffda00,
            arenaColor: 0x3c3251,
            terrainColor1: 0xa8d46f,
            terrainColor2: 0x3c3251,
            terrainColor3: 0x341139,
            treeBranchColor: 0x359668,
            iconColor: 0x4c4c7f,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,

            countdown1:'#cc2a41',
            countdown2:'#359668',
        }),


        //orange
        new Theme({
            name:"orange",
            puckColor: 0xffda00,
            arenaColor: 0x3b8183,
            terrainColor1: 0xff9c5b,
            terrainColor2: 0xf5634a,
            terrainColor3: 0xed303c,
            treeBranchColor: 0xed303c,
            iconColor: 0xffda00,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,

            countdown1:'#911921',
            countdown2:'#3b8183',
        }),


        //forrest green
        new Theme({
            name:"forrest",
            puckColor: 0xffda00,
            arenaColor: 0xa32c28,
            terrainColor1: 0x384030,
            terrainColor2: 0x2b3124,
            terrainColor3: 0x1d2217,
            treeBranchColor: 0x7b8055,
            iconColor: 0xffda00,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,
            countdown1:'#a32c28',
            countdown2:'#7b8055',

        }),

        //black horizon
        new Theme({
            name:"black horizon",
            puckColor: 0xffda00,
            arenaColor: 0xe32f21,
            terrainColor1: 0xabccbd,
            terrainColor2: 0x181619,
            terrainColor3: 0x181619,
            treeBranchColor: 0x7dbeb8,
            iconColor: 0xffda00,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,
            darken: true,
            countdown1:'#e32f21',
            countdown2:'#7dbeb8',

        }),

        //red horizon
        new Theme({
            name:"red horizon",
            puckColor: 0xffda00,
            arenaColor: 0xc84648,
            terrainColor1: 0xd3c8b4,
            terrainColor2: 0x703e3b,
            terrainColor3: 0x703e3b,
            treeBranchColor: 0x703e3b,
            iconColor: 0xffda00,
            cpuBackdropColor:0x000000,
            gridBrightness: 0.12,
            darken:true,
            countdown1:'#703e3b',
            countdown2:'#456942',

        })

    ]

    this.current = this.list[this.currentThemeIndex];

}

Themes.prototype = {
    next: function(){
        this.currentThemeIndex++

        this.goto(this.currentThemeIndex)
    },

    goto: function(index) {

        if( index >= this.list.length-1 ) {
            //rewind until index in range. Might be good if there are hundreds of levels and a few themes
            while( index >= this.list.length-1 ) index -= this.list.length;

            if( index < 0 ) index = 0;
        }

        this.current = this.list[index+1];

        var scores = $("#scores");
        var extras = $("#extras ul");

        if(this.current.darken) {
           scores.find("h1,h2,h3,p").addClass("ui-darken")
           scores.find("li,li:before").addClass("ui-darken")
           extras.addClass("ui-darken")

        }
        else {
           scores.find("h1,h2,h3,p").removeClass("ui-darken")
           scores.find("li").removeClass("ui-darken")
           extras.removeClass("ui-darken")

        }

        settings.changeTheme(this.current);

    }
}

module.exports = new Themes();

function Theme( mixin ) {

    this.name = "";
    this.treeTrunkColor =  0x206cc3;
    this.shieldColor =  0xffffff;
    this.puckColor =  0xefce06;
    this.arenaColor =  0xeb2020;
    this.terrainColor1 =  0x146ccf;
    this.terrainColor2 =  0x0a71b9;
    this.terrainColor3 =  0x196189;
    this.treeBranchColor =  0x206cc3;
    this.iconColor =  0xefce06;
    this.cpuBackdropColor =  0x0e0e0d;
    this.gridBrightness = 0.1
    this.darken = false
    this.countdown1 = '#e83129'
    this.countdown2 = '#40a040'

    if( mixin ) {
        for( var key in mixin ) {
            if( this.hasOwnProperty(key) ){
                this[key] = mixin[key];
            }
        }
    }
}


});
require.register("slam/lib/puppeteer.js", function(exports, require, module){
var debug = require('debug')('puppeteer')
  , settings = require('./settings')
  , actions = require('./actions')
  , copy = require('copy')
  , sets = require('./levels/sets')
  , levels = require('./levels');

var namespace = null;

exports.namespace = function(id){
  debug('namespace',id)
  namespace = id;
  return exports;
}

// convenience method to go to the next level
exports.up = function(world){
  debug('up %s',world.name)
  var index = world.level.index + 1;
  //if( index < levels[namespace].length ){
    return exports.goto(world,index);
  //} else {
  //  return exports.goto(world,world.level.index);
  //}
}

exports.goto = function(world,index){
  if( !levels[namespace] ){
    throw new Error('namespace "'+namespace+'" not found. call .namespace() first.');
  }

  // default to the same index
  index = index || (world.level && world.level.index) || 0;
  debug('goto %s',world.name,index)

  var level = (index < levels[namespace].length)? levels[namespace][index]:levels[namespace][levels[namespace].length-1];

  // exists?
  if( !level ){
    throw new Error('level "'+index+'" not found.');
  }

  // prepare & set level on world
  world.level = prepare(world,level,index);
  return exports;
}

exports.update = function(world){
  // don't run if game over or paused
  if( world.state !== 'playing' )
    return;

  var level = world.level;

  // generate the nextSpawn
  if( level.nextSpawn < 0 ){
    // plan for the future
    // TODO move to settings?
    var min = settings.data.framerate*(level.minSpawnTime||5)
    var max = settings.data.framerate*(level.maxSpawnTime||10)
    level.nextSpawn = world.frame + world.rand.range(min,max);

  }

  // check if it's time to create an extra
  if( world.frame > level.nextSpawn ){
    //console.log(world.extras.length,level.maxExtras)
    if( world.extras.length >= level.maxExtras ){
      actions.destroyFirstExtra(world);
    }

    actions.createRandomExtra(world);

    // Reset next spawn frame
    // (will be regenerated next update())
    level.nextSpawn = -1;
  }

  // check if there's room for obstacles
  // (and there's still obstacles not in the arena)
  if( world.frame > 0 ){
    for(var i=world.obstacles.length; i<level.obstacles.length;i++){
      // TODO this .used property is probably not a good idea.
      //      maybe keep two arrays instead?
      if(!level.obstacles[i].used) {
        var added = actions.createNextObstacle(world)
        if(added) level.obstacles[i].used = true;
      }
    }

    for(var i=world.forces.length; i<level.forces.length;i++){
      actions.createNextForce(world)
    }
  }
}

function prepare(world,level,index){
  debug('prepare %s',world.name,index)

  // TODO Pool?
  var lvl = copy(level);

  // set the index of the level
  // (might be good to know for .goto())
  lvl.index = index;

  // special "random" case
  if( lvl.set === 'random' ){
    debug('set random')
    lvl.set = sets.random;
  }

  if( index > levels[namespace].length-1 ){
    //add more difficulty
    var gain = Math.max(0,(index-(levels[namespace].length-1))*0.3);
    console.log(gain);
    lvl.puck.speed += gain;
    lvl.puck.maxspeed += gain;
  }

  // pick a random set
  if( Array.isArray(lvl.set) ){
    lvl.set = world.rand.choice(lvl.set);
    debug('set from array',lvl.set)
  }

  // find obstacles and forces in sets
  if( sets[lvl.set] ){
    copy(sets[lvl.set],lvl)
  } else if(lvl.set){
    throw new Error('set "'+lvl.set+'" was not found')
  }

  // in case the level defines positions
  // overwrite with those
  if( level.positions ){
    lvl.positions = copy(level.positions,lvl.positions);
  }

  // optional extras, obstacles and forces
  lvl.extras = lvl.extras || []
  lvl.obstacles = lvl.obstacles || []
  lvl.forces = lvl.forces || []
  lvl.positions = lvl.positions || []


  // make available if destroyed
  for(var i=0; i < lvl.obstacles.length; i++){
    lvl.obstacles[i].used = false;
  }

  // TODO validate the extra ids so they exist

  // TODO validate the existence of AI?

  // When next extra should be added
  // set to -1 and reset on first update()
  lvl.nextSpawn = -1;


  // make sure the number of extras positions
  // must be more than `maxExtras` (3) or
  // available extras.
  // TODO maybe a setting?
  lvl.maxExtras = lvl.maxExtras || 3;//Math.min(3,lvl.extras.length);

  return lvl;
}
});
require.register("slam/lib/inputs/index.js", function(exports, require, module){
var debug = require('debug')('inputs:core')
  , Emitter = require('emitter')
  , network = require('./network')
  , types = require('./types')
  , buf = require('./buffer')
  , str = types.toString;

var buffer = [] // keeps the recorded inputs
  , slice = [].slice
  , hasPING = false
  , hasHIT = false;

Emitter(exports);

exports.types = types;
exports.network = network;

exports.reset = function(){
  buffer.length = 0;
  buf.reset()
  network.reset()
}

exports.record = function(type){
  debug('record',str(arguments))

  // validate input
  if( types.validate(arguments) ){

    // avoid multiple PINGs in buffer so we don't
    // get unnecessary 'message too long'-like
    // errors when being inactive.
    if( type === types.PING ){
      if( hasPING ){
        return;
      } else {
        hasPING = true;
      }
    }

    if( type === types.HIT ){
      if( hasHIT ){
        return;
      } else {
        hasHIT = true;
      }
    }


    // push the input into a temporary buffer
    buffer.push(slice.call(arguments))
  } else {
    console.warn('recorded invalid input:',arguments);
  }
}

exports.process = function(world){
  // send to network
  world.multiplayer && network.send(world.frame,buffer)

  // execute and enqueue the inputs
  for(var i=0; i<buffer.length; i++){
    var type = buffer[i][0];

    // skip PING/PONG/HIT/MISS, they should
    // only be sent over the network
    if( type === types.PING ) continue;
    if( type === types.PONG ) continue;
    if( type === types.MISS ) continue;
    if( type === types.HIT  ) continue;

    // enqueue for network replay
    // (do this first in case execute clears the buffer)
    world.multiplayer && network.enqueue(world.frame,buffer[i])

    // execute inputs locally
    types.execute(world,buffer[i]);
  }

  // reset buffer
  buffer.length = 0;
  hasPING = false;
  hasHIT = false;
}

exports.info = function(ctx){
  var info = network.info();
  info.recorded = buffer.length;
  return info;
}


});
require.register("slam/lib/inputs/network.js", function(exports, require, module){
var debug = require('debug')('inputs:network')
  , Emitter = require('emitter')
  , now = require('now')
  , buf = require('./buffer')
  , types = require('./types')
  , unhide = require('./util').unhide
  , qstr = require('./util').qstr
  , str = types.toString
  , diff = require('../support/diff')
  , physics = require('../sim/physics')
  , interpolate = require('../sim/interpolate')
  , World = require('../world')
  , settings = require('../settings');

Emitter(exports);

var buffered = []
  , messages = []
  , length = 0
  , net = []
  , loc = [];

// ack is the last acknowledged frame
// it's as far as we can forward and
// know that we'll stay in sync
// TODO what about on new game when the
// world resets it's frame?
var ack = -1;

// used to skip enqueing input during the replay
var replaying = false;

exports.reset = function(all){
  debug('reset %s',all ? '(all)' : '')
  ack = -1;
  if( all ){
    net.length = 0;
    loc.length = 0;
    buffered.length = 0;
    length = 0;
  }
}

exports.info = function(){
  return {
    ack: ack,
    replaying: replaying,
    buffered: buffered.length,
    length: length,
    net: qstr(net),
    loc: qstr(loc),
  }
}

exports.send = function(frame,inputs){
  // skip empty inputs
  if( !inputs.length ){
    return;
  }

  debug('send %s',frame, inputs)
  var msg = buf.build(frame,inputs)

  // 255 byte limit because of 8bit length header
  if( msg.byteLength > 255 ){
    // TODO split into more messages
    throw new Error('invalid msg length: '+buf.byteLength);
  }

  buffered.push(msg);
  length += msg.byteLength;
}

exports.flush = function(){
  if( length ){
    var msg = buf.wrap(buffered,length)
    exports.emit('message',msg)
    buffered.length = 0;
    length = 0;
    return true;

  }
  return false;
}

exports.onmessage = function(buffer){
  // unwrap the arraybuffer into its messages
  if( buf.unwrap(buffer,messages) ){
    debug('onmessage %s messages',messages.length)
    for(var i=0; i<messages.length; i++){
      var inputs = buf.parse(messages[i]);
      var frame = inputs[0];

      // skip if frame is before ack
      if( frame < ack ){
        console.warn('got input in the wrong order (%s < %s). something wrong with netchan? or game has restarted? or frame > 16bit?',frame,ack,str(inputs.slice(1)))
        continue;
      }

      for(var j=1; j<inputs.length; j++){
        var inp = inputs[j];
        if( types.validate(inp) ){
          switch(inp[0]){
            case types.MOVE: enqueue(net,frame,inp); break;
            case types.DIED: enqueue(net,frame,inp); break;
            case types.HIT:  exports.emit('hit',inp[1],inp[2],frame); break;
            case types.MISS: exports.emit('miss',inp[1],0,frame); break;
            case types.PING: exports.emit('ping',inp[1],frame); break;
            case types.PONG: exports.emit('pong',inp[1],frame); break;
          }
        } else {
          console.warn('received invalid input',inp)
        }
      }

      // update ack
      ack = frame;
    }
    debug('onmessage end ack: %s',ack)

    // emit ack in case the game
    // needs to fast forward a bit
    exports.emit('ack',ack)

    // reset messages when done
    messages.length = 0;
  }
}

exports.enqueue = function(frame,input){
  replaying || enqueue(loc,frame,input)
}

exports.forward = function(sync,max,locFirst){
  var a = sync.world.frame
    , b = Math.min(max,ack);

  // did we even start yet?
  if( b === -1 ){
    return;
  }

  // debug('forward %s -> %s (max: %s ack: %s)',a,b,max,ack);
  if( locFirst ){
    dequeue(loc,sync.world)
    dequeue(net,sync.world)
    for(var i=a; i<b; i++){
      sync.update()
      dequeue(loc,sync.world)
      dequeue(net,sync.world)
    }
  } else {
    dequeue(net,sync.world)
    dequeue(loc,sync.world)
    for(var i=a; i<b; i++){
      sync.update()
      dequeue(net,sync.world)
      dequeue(loc,sync.world)
    }
  }
}

// used for replay, keeps the
// "before" states of puck and paddles
var temp = new World('temp');

// from = sync.world
// to = game.world
// frames = number of frames to interpolate over
exports.replay = function(from,to,frames){
  var a = from.frame
    , b = to.frame;

  if( replaying ){
    return console.warn('attempted to do a replay during a replay. skipping.')
  }

  // debug('replay %s -> %s',a,b);

  // keep a copy of the pucks for interpolation
  temp.pucks.copy(to.pucks);

  // copy to revert the state
  to.copy(from);

  // verify that they match after copy()
  // verify(from,to) // NOTE: very heavy

  // extrapolate to match the previous state
  replaying = true;
  extrapolate(to,b-a)
  replaying = false;

  // add interpolation between the temp
  // and the post-replay-world.
  interpolate(temp,to,frames)
}

function enqueue(queue,frame,input){
  debug('enqueue %s %s %s',queue === loc ? '(loc)' : '(net)', frame, str(input))

  // verify that the queue is in order (frame > last frame in queue)
  var last = queue[queue.length-2];
  if( frame < last ){
    console.error('enqueue received an input too early. %s < %s', frame, last)
    console.log('  in queue %s:',queue === loc ? '(loc)' : '(net)',qstr(queue))
    return;
  }
  queue.push(frame,input)
}

function dequeue(queue,world){
  // verify that the frame has not passed the first frame in queue
  if( queue[0] < world.frame ){
    console.error('dequeue cannot pass the first frame in queue. %s < %s', queue[0], world.frame)
    console.log('  in queue %s:',queue === loc ? '(loc)' : '(net)',qstr(queue))
    throw new Error()
    return;
  }

  // execute inputs in queue matching the frame
  while(queue[0]===world.frame){
    var frame = queue.shift()
      , input = queue.shift();
    types.execute(world,input)

    if( input[0] == types.MOVE ){
      exports.emit('move',input);
    }

    exports.emit('dequeue',input,frame)
  }
}


// to be used by replay() to avoid making copies of
// the queues
function peek(queue,world,start){
  for(var i=start||0; i<queue.length; i+=2){
    var frame = queue[i]
      , input = queue[i+1];

    // stop if frame doesn't match
    if( frame !== world.frame ){
      return i;
    }

    types.execute(world,input)
  }
  return i;
}

function extrapolate(world,steps){
  var timestep = settings.data.timestep;
  var l = 0;
  var n = 0;
  for(var i=0; i<steps; i++){
    // apply inputs from queue
    l = peek(loc,world,l)
    n = peek(net,world,n)

    // apply the physics only
    physics.update(world,timestep)
  }
}

// a, b = world
function verify(a,b){
  debug('verify')
  if( a.code() !== b.code() ){

    var ja = JSON.stringify(a,unhide,2);
    var jb = JSON.stringify(b,unhide,2);
    console.log(diff.createPatch('diff for frame '+a.frame,ja,jb,'game','sync'))

    // alertOnce('hash codes does not match after copy. determinism is not guaranteed.')
    // err(1301,'hash codes does not match')
  }
}

});
require.register("slam/lib/inputs/buffer.js", function(exports, require, module){
var debug = require('debug')('inputs:buffer')
  , Writer = require('../support/buffer').Writer
  , Reader = require('../support/buffer').Reader
  , types = require('./types')
  , str = types.toString
  , ab2s = require('./util').ab2s;

var buildBuf = new ArrayBuffer(1024); // pre-allocated buffer
var sendSeq = -1;
var recvSeq = -1;

// for reconnects
exports.reset = function(){
  sendSeq = -1;
  recvSeq = -1;
}

exports.build = function(frame,inputs){
  debug('build',frame,str(inputs))
  var dat = new Writer(buildBuf);

  // write the frame
  dat.setUint16(frame);

  for(var i=0; i<inputs.length; i++) {
    var input = inputs[i];
    switch(input[0]){
      case types.MOVE: // type, id, x
      case types.DIED: // type, id, x
        dat.setInt8(input[0])
        dat.setUint8(input[1])
        dat.setFloat64(input[2])
        break;
      case types.PING: // type, id
      case types.PONG: // type, id
        dat.setInt8(input[0])
        dat.setUint16(input[1])
        break;
      case types.HIT:  // type, x, v
        dat.setInt8(input[0])
        dat.setFloat32(input[1])
        dat.setFloat32(input[2])
        break;
      case types.MISS: // type, x
        dat.setInt8(input[0])
        dat.setFloat32(input[1])
        break;
    }
  }

  // return the written part of the buildBuf.
  return new Uint8Array(buildBuf.slice(0,dat.offset));
}

// make an Array [frame,inputs...]
exports.parse = function(buf){
  debug('parse',ab2s(buf.buffer || buf))

  // TODO will these allocations be an issue?
  var arr = [];
  var dat = new Reader(buf);

  // frame
  arr.push(dat.getUint16())

  while(dat.offset < buf.byteLength){
    var input = []
      , type = dat.getInt8();
    switch(type){
      case types.MOVE: // type, id, x
      case types.DIED: // type, id, x
        input.push(type,dat.getUint8(),dat.getFloat64())
        break;
      case types.PING: // type, id
      case types.PONG: // type, id
        input.push(type,dat.getUint16())
        break;
      case types.HIT:  // type, x, v
        input.push(type,dat.getFloat32(),dat.getFloat32())
        break;
      case types.MISS: // type, x
        input.push(type,dat.getFloat32())
        break;
    }
    arr.push(input);
  }
  return arr;
}

exports.wrap = function(messages,length){
  // 2 = 16bit sequence
  // length = total length of messages
  // messages.length = 8bit length of each message
  var buf = new Uint8Array(2+length+messages.length)
    , off = 0
    , seq = ++sendSeq;

  // write sequence (manual 16bit > 2*8bit)
  buf[off++] = (seq >> 8) & 0xff
  buf[off++] = (seq >> 0) & 0xff

  while(messages.length){
    var msg = messages.shift();
    buf[off++] = msg.byteLength;
    buf.set(msg,off);
    off += msg.byteLength;
  }
  return buf;
}

exports.unwrap = function(buf,messages){
  debug('unwrap',buf.byteLength) // ab2s(buf)

  // check for empty messages
  if( !buf.byteLength ){
    return false;
  }

  // expect multiple frames in one buf
  // buf: [len,msg...]
  var arr = new Uint8Array(buf);

  // extract 16bit sequence
  // (see envelop() for the other end)
  var seq = (arr[0] << 8) + arr[1];

  // verify sequence
  if( !verifySequence(seq) ){
    return false;
  }

  // get each input and add them to the
  // messages array
  for(var offset=2; offset<arr.byteLength;){
    var len = arr[offset++];
    messages.push(arr.buffer.slice(offset,offset+len));
    offset += len;
  }

  return messages.length > 0;
}


// checks if last message sequence was
// more than 1 frame away = DROPPED!
function verifySequence(seq){
  if( Math.abs(recvSeq - seq) > 1 ){
    throw new Error('dropped packets. determinism is not guaranteed.')
  } else if( recvSeq === seq ){
    console.warn('packet %s received twice. skipping.',seq)
    return false;
  }
  recvSeq = seq;
  return true;
}

});
require.register("slam/lib/inputs/types.js", function(exports, require, module){
var debug = require('debug')('inputs:types');

exports.PONG = -2;
exports.PING = -1;
exports.MOVE = 1;
exports.DIED = 2; // player has been hit
exports.HIT  = 3; // paddle has been hit
exports.MISS = 4; // shield has been hit

exports.execute = execute;
exports.validate = validate;
exports.toString = str;

function str(input){
  switch(input[0]){
    case exports.PING: return 'PING('+input[1]+')';
    case exports.PONG: return 'PONG('+input[1]+')';
    case exports.MOVE: return 'MOVE('+input[1]+','+input[2]+')';
    case exports.DIED: return 'DIED('+input[1]+','+input[2]+')';
    case exports.MISS: return 'MISS('+input[1]+')';
    case exports.HIT:  return  'HIT('+input[1]+','+input[2]+')';
    default:
      // assumes the input is an array of inputs
      if( Array.isArray(input) ){
        return input.map(str).join(' | ')
      } else {
        return 'invalid input!'
      }
  }
}

function validate(input){
  switch(input && input[0]){
    case exports.HIT:  // paddle position, paddle velocity
    case exports.MOVE: // id, movement
    case exports.DIED: // id, puck position
      return input.length == 3;

    case exports.MISS: // paddle position
    case exports.PING: // id
    case exports.PONG: // id
      return input.length == 2;

  }
  return false;
}

function execute(world,input){
  debug('execute %s %s',world.name,world.frame,world.state,str(input))
  switch(input[0]){
    case exports.MOVE:  return require('../actions').movePaddle(world,input[1],input[2])
    case exports.DIED:  return require('../actions').roundOver(world,input[1],input[2])
    case exports.HIT:   throw new Error('cannot execute HIT');
    case exports.MISS:  throw new Error('cannot execute MISS');
    case exports.PING:  throw new Error('cannot execute PING');
    case exports.PONG:  throw new Error('cannot execute PONG');
  }
}
});
require.register("slam/lib/inputs/util.js", function(exports, require, module){
var str = require('./types').toString
  , join = [].join;

// converts an ArrayBuffer to a string
exports.ab2s = function(buf){
  return join.call(new Uint8Array(buf));
}


// used as JSON replacer to
// find undefined values and
// remove excluded keys
exports.unhide = function(k,v){
  if( ~require('../world').EXCLUDED.indexOf(k) )
    return undefined;
  if( typeof v == 'undefined' )
    return 'undefined'
  return v;
}


// [frame,input...]
exports.qstr = function(queue){
  var s = [];
  for(var i=0; i<queue.length; i+=2){
    var frame = queue[i]
      , input = queue[i+1];
    s.push(frame + ': ' + str(input));
  }
  return 'Queue ('+queue.length+')\n\t'+s.join('\n\t');
}


});
require.register("slam/lib/sim/body.js", function(exports, require, module){
var debug = require('debug')('sim:body')
  , BodyFlags = require('./body-flags')
  , Pool = require('../support/pool')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec;

module.exports = Body;

function Body(){
    this.aabb = [0,0,0,0]  //poly.aabb(this.shape)
}

Body.prototype = {

  alloc: function(){
    debug('alloc')
    this.shape = null //poly.make() (assigned in world.createBody())
    this.current = vec.make()
    this.previous = vec.make()
    this.velocity = vec.make()
    this.offset = vec.make()
    this.acceleration = vec.make()
    this.target = null
    this.removed = false      // mark as removed upon destroy

    // used in broadphase and should always be
    // the squared distance to the outermost vertex
    // (updated in integration.js)
    this.radiusSq = 0;

    // used by puck to keep track of its active effects
    // and by extras to keep a reference to their
    // options (duration etc.)
    this.data = {}

    // used after a replay to interpolate between the
    // before and after states of the puck and paddle
    //
    //  ex.
    //
    //    {
    //      offset: vec.sub(before.current,after.current),
    //      step: 1/f, // ex 1/10 = .1
    //      frames: f   // ex 10 so
    //    }
    //
    //  this will then be used in integration to set a
    //  body.offset using:
    //
    //      vec.lerp(i.offset,z,i.step*i.frames--,body.offset)
    //
    //  during integration and body.offset will then be added
    //  while rendering. This way the simulation will be jumping
    //  and accurate but the rendering will be smooth and nice.
    //
    this.interpolate = {}

    this.mass = 10;
    this.damping = 1;         // 0-1

    this.removed = false      // mark as removed upon destroy
    this.id = null            // used by icons/extras
    this.index = -1;          // will be set in world.createBody()
  },

  free: function(){
    debug('free')

    poly.free(this.shape)
    vec.free(this.current)
    vec.free(this.previous)
    vec.free(this.velocity)
    vec.free(this.acceleration)
    vec.free(this.offset)

    if( this.interpolate.offset ){
      vec.free(this.interpolate.offset)
    }

    if( this.target ){
        vec.free(this.target.position)
        this.target.position = null
    }

    // null them to make sure they fail in case
    // they're accessed again
    this.shape = null
    this.current = null
    this.previous = null
    this.velocity = null
    this.offset = null
    this.acceleration = null

    this.data = null
    this.interpolate = null
    this.target = null
  },

  toString: function(inclFlags){
    var str = '{'
    +' c:'+this.current.join(',')
    +' p:'+this.previous.join(',')
    +' v:'+this.velocity.join(',')
    +' a:'+this.acceleration.join(',');

    if( inclFlags )
      str += ' flags:'+BodyFlags.toString(this._flags);

    return str +' }'
  }

}

Pool(Body,20)
});
require.register("slam/lib/sim/body-flags.js", function(exports, require, module){
var debug = require('debug')('sim:body-flags')

// check if flag is on with:
//    if( body.flags & Body.GHOST ) bla;
// turn on:
//    flags |= GHOST
// turn off:
//    flags &= ~GHOST
// toggle:
//    flags ^= GHOST
// combine flags when created with:
//    new Body(shape,x,y,Body.IMMOVABLE | Body.GHOST | Body.AWESOME)

// add more flags by increasing the right integer (1<<2, 1<<3 etc)
exports.DYNAMIC = 0 << 0;  // moves around
exports.STATIC  = 1 << 0;  // stays put
exports.DESTROY = 1 << 1;  // removed when hit
exports.BOUNCE  = 1 << 2;  // will bounce off of anything that is BOUNCE and STEER or REFLECT
exports.GHOST   = 1 << 3;  // passes through anything that is DYNAMIC
exports.REFLECT = 0 << 4;  // reflects based on shape normal
exports.STEER   = 1 << 4;  // reflects based on hit position
exports.DIRECT  = 1 << 5;  // reflects based on shape normal + velocity

// example definitions:
// DEFAULT = DYNAMIC
// BULLET = DYNAMIC | DESTROY
// PUCK = DYNAMIC | BOUNCE
// MULTI_PUCK = PUCK | DESTROY
// GHOST_PUCK = PUCK | GHOST
// PADDLE = DYNAMIC | BOUNCE | STEER
// BRICK = STATIC | BOUNCE | DESTROY | REFLECT
// OBSTACLE = STATIC | BOUNCE | REFLECT
// EXTRA = STATIC | DESTROY

exports.toString = function(f){
  if( typeof f != 'number' ){
    throw new Error('invalid flags, must be a number')
  }
  var s = []
  if( f & exports.STATIC ){
    s.push('STATIC');
  } else {
    s.push('DYNAMIC');
  }
  if( f & exports.DESTROY ){
    s.push('DESTROY');
  }
  if( f & exports.BOUNCE ){
    s.push('BOUNCE');
  }
  if( f & exports.GHOST ){
    s.push('GHOST');
  }
  if( f & exports.DIRECT ){
    s.push('DIRECT');
  } else if( f & exports.STEER ){
    s.push('STEER');
  } else {
    s.push('REFLECT');
  }
  return s.join(' | ')
}

exports.set = function(body,flags){
  debug('set flags',body.id,exports.toString(flags))
  body._flags = flags;
}

exports.has = function(body,flags){
  // way too noisy...
  // debug('has flags',Body.flags(flags))
  return body._flags & flags;
}

exports.add = function(body,flags){
  debug('add flags',body.id,exports.toString(flags))
  debug(' =',exports.toString(body._flags))
  body._flags |= flags;
  debug(' >',exports.toString(body._flags))
}

exports.del = function(body,flags){
  debug('del flags',body.id,exports.toString(flags))
  debug(' =',exports.toString(body._flags))
  body._flags &= ~flags;
  debug(' >',exports.toString(body._flags))
}

});
require.register("slam/lib/sim/force.js", function(exports, require, module){
var geom = require('geom')
  , vec = geom.vec;

module.exports = Force;

/**
 * A Force is a point which pulls or pushes on the Bodies
 */
function Force(type,x,y,mass,power){
  if( !type ) throw new Error('missing type')
  this.type = type; // repell || attract
  this.power = power || 1; // 0-1
  this.mass = mass || 100;
  this.radius = this.mass/2;
  this.position = vec.make(x,y)
  this.active = false;
}

Force.prototype = {
  toString: function(){
    return 'Force('+[
      this.type,
      'active:'+this.active,
      'mass:'+this.mass,
      'x:'+this.position[0],
      'y:'+this.position[1]
    ]+')'
  }
}
});
require.register("slam/lib/sim/physics.js", function(exports, require, module){
var debug = require('debug')('sim:physics')
  , settings = require('../settings')
  , onbounds = require('./bounds')
  , oncollision = require('./collision')
  , integration = require('./integration')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec;

exports.update = update;

var removed = [];
var bodies = [];
var c = {};

function broadphase(world,mayCollide,wasRemoved){
  for(var i=0; i<world.bodies.length; i++){
    var a = world.bodies.values[i];

    // skip removed bodies
    if( a.removed ){
      wasRemoved.push(a);
      continue;
    }

    // skip any other than puck and bullets
    if( a.id != 'puck' && a.id != 'bullet' ){
      continue;
    }

    // check if colliding with other bodies
    for(var j=0; j<world.bodies.length; j++){
      // skip self
      if( i === j ) continue;

      var b = world.bodies.values[j];

      // whitelist
      if( a.id == 'puck' ){
        switch(b.id){
          case 'puck':
          case 'extra':
          case 'obstacle':
          case 'paddle':
          case 'shield':
            break;
          default:
            continue;
        }
      } else { // bullet
        switch(b.id){
          case 'paddle':
          case 'obstacle':
            break;
          default:
            continue;
        }
      }

      // if closer than radius+velocity it may collide
      var al = vec.len(a.velocity);
      var bl = vec.len(b.velocity);
      var ar = a.radius + al;
      var br = b.radius + bl;
      var d = vec.dist(a.current,b.current);
      if( d-(ar+br) < 0 ){
        // TODO should we check if the pair is in mayCollide first?
        mayCollide.push(a,b);
      }
    }
  }
}

function narrowphase(world,bodies,removed){
  if( !bodies.length ) return;
  var v = vec.make();
  for(var i=0; i<bodies.length; i+=2){
    var a = bodies[i]
      , b = bodies[i+1];

    // skip if removed
    if( a.removed || b.removed ){
      continue;
    }

    // calculate relative velocity
    vec.sub(a.velocity,b.velocity,v);

    // check for collision
    poly.collides(a.shape,b.shape,v,c);

    // for the ones actually colliding call "oncollision"
    if( c.willIntersect ){
      oncollision(world,a,b,c);
      vec.free(c.minTranslationVector)
      vec.free(c.nearestEdge)

      // add to remove queue if marked for removal
      a.removed && removed.push(a);
      b.removed && removed.push(b);
    // } else {
    //   console.log('narrowphase not colliding',a.id,b.id)
    //   console.log(' a aabb:',a.aabb.join(','))
    //   console.log(' b aabb:',b.aabb.join(','))
    //   console.log(' intersects?',collisions.intersects(a.aabb,b.aabb))
    }
  }
  vec.free(v);
}

function checkbounds(world,removed){
  var o = vec.make();
  for(var i=0; i<world.bodies.length; i++){
    var a = world.bodies.values[i];

    // skip shield
    if( a.id == 'shield' )
      continue;

    // skip obstacles
    if( a.id == 'obstacle' )
      continue;

    // check bounds
    var hit = oob(a.aabb,a.velocity,o)
    if( hit ){
      // console.log('HIT BOUNDS OK?!',a.id,a.index,bounds)
      switch(a.id){
        case 'puck':   onbounds.puck(world,a,o); break;
        case 'bullet': onbounds.bullet(world,a,o); break;
        case 'paddle': onbounds.paddle(world,a,o); break;
        // ignore the rest...
      }
    }

    // mark removed bodies
    if( a.removed ){
      removed.push(a);
    }
  }
  vec.free(o);
}

// assumes bounds and aabb = [t,r,b,l]
// if overlap it will return it as a vector
// NOTE: it doesn't use the velocity in the Y-axis
//       check to avoid accidental "god mode" when
//       the puck never hits the player.
function oob(aabb,v,o){
  var bounds = settings.data.bounds;
  o[0] = o[1] = 0
  if( aabb[0] < bounds[0] )
    o[1] = bounds[0] - (aabb[0] + v[1]);
  if( aabb[1] + v[0] > bounds[1] )
    o[0] = bounds[1] - (aabb[1] + v[0]);
  if( aabb[2] > bounds[2] )
    o[1] = bounds[2] - (aabb[2] + v[1]);
  if( aabb[3] + v[0] < bounds[3] )
    o[0] = bounds[3] - (aabb[3] + v[0]);
  return o[0] !== 0 || o[1] !== 0;
}

function destroy(world,removed){
  while(removed.length){
    var body = removed.pop();
    // there may be duplicates so check if
    // it has a position still
    if( body.current ){
      world.destroyBody(body);
    }
  }
}

function integrate(world,tsq){
  for(var i=0; i < world.bodies.length; i++){
    var body = world.bodies.values[i];

    // apply forces (if any)
    for(var j=0; j < world.forces.length; j++){
      if( body.id == 'puck'){ // only pucks? what about bullets?
        integration.force(world.forces.values[j],body);
      }
    }

    integration.body(body,tsq)
  }
}

function update(world,timeStep){
  // skip unless playing or preview
  if( world.state != 'playing' && world.state != 'preview' )
    return;

  bodies.length = 0;
  removed.length = 0;

  // first check proximity and bounds
  broadphase(world,bodies,removed);
  // console.log('post broadphase %s collisions %s removed',bodies.length/2,removed.length)

  // remove from world
  // TODO also remove from `bodies` if found?
  destroy(world,removed);

  // check if actually colliding
  narrowphase(world,bodies,removed);
  // console.log('post narrowphase %s collisions %s removed',bodies.length/2,removed.length)

  // remove from world any that was removed
  // by "oncollision"
  destroy(world,removed);

  // check bounds after integration
  // done after the collisions in case it has reflected
  checkbounds(world,removed);

  // remove from world any that was removed
  // by "onbounds"
  destroy(world,removed);

  // update their position in the world
  integrate(world,timeStep*timeStep);


  // now we're at the next frame
  world.frame += 1;
}

});
require.register("slam/lib/sim/shapes.js", function(exports, require, module){
var geom = require('geom')
  , poly = geom.poly;

exports.rect = function(w,h){
  return poly.make(
    0, 0,
    0, h,
    w, h,
    w, 0
  )
}

exports.oct = function(w){
  return poly.make(
    0,0,
    w*0.5,0,
    w*0.75,w*0.25,
    0.75*w,w*0.75,
    w*0.5,w,
    0,w,
    -0.25*w,w*0.75,
    -0.25*w,w*0.25
  )
}

exports.hex = function(w){
  var hex = poly.make();
  var a = 2 * Math.PI / 6;
  for(var i=5; i >= 0; i--) {
    poly.add(hex, w * Math.cos(i * a), w * Math.sin(i * a));
  }
  poly.close(hex)
  return hex;
}

exports.triangle = function(w,h,side,vertical){
  var triangle = poly.make()
  if(!vertical) {
    poly.add(triangle,0,-h);
    poly.add(triangle,w*(side?1:-1),0);
    poly.add(triangle,0,h);
  } else {
    poly.add(triangle,-w,0);
    poly.add(triangle,0,h*(side?1:-1));
    poly.add(triangle,w,0);
  }
  poly.close(triangle)
  return triangle
}

exports.diamond = function(w){
  var diamond = poly.make()
  var a = 2 * Math.PI / 4;
  for(var i=3; i >= 0; i--) {
    poly.add(diamond, w * Math.cos(i * a), w * Math.sin(i * a) );
  }
  poly.close(diamond)
  return diamond
}

});
require.register("slam/lib/sim/integration.js", function(exports, require, module){
var debug = require('debug')('sim:integration')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec;

// a temporary vector only required during the
// update and not supposed to be available to
// others
var next = vec.make()

// a 0,0 vector that can be copied from without
// allocating any array of vector.
var zero = vec.make()

// verlet integration
exports.body = function(body,tsq){
  var c = body.current
    , p = body.previous
    , v = body.velocity
    , a = body.acceleration
    , o = body.offset
    , i = body.interpolate
    , t = body.target
    , n = next
    , z = zero;

  // velocity = target - current
  if( t && t.position ){
    var tc = vec.sub(t.position,c)
    vec.sdiv(tc,t.frames--,v)
    vec.free(tc)
    if( t.frames == 0 ){
      vec.free(t.position)
      t.frames = 0;
      t.position = null;
    }

  // velocity = current - previous
  } else {
    vec.sub(c,p,v)
  }

  // damping
  if( body.damping !== 1 ){
    // damp until
    // resets damping when the velocity of the body
    // is lower than dampUntil^2
    var duSq = body.dampUntil*body.dampUntil
      , vSq = duSq && v[0]*v[0]+v[1]*v[1];
    if( duSq && duSq > vSq ){
      // console.log('stopping damping')
      body.damping = 1;
      delete body.dampUntil;
    } else {
      vec.smul(v,body.damping,v);
    }
  }

  // next = current + velocity + acceleration/2 * (timestep*timestep)
  n[0] = c[0] + v[0] + .5 * a[0] * tsq
  n[1] = c[1] + v[1] + .5 * a[1] * tsq

  vec.copy(c,p)     // previous = current
  vec.copy(n,c)     // current = next
  vec.copy(z,a)     // reset acceleration

  // replay interpolation
  // updates body.offset
  if( i && i.frames ){
    i.frames--
    vec.lerp(z,i.offset,i.step*i.frames,o)
    // console.log('applied interpolation to %s over %s frames',body.index,i.frames,i.offset.join(','),o.join(','))
    if( i.frames <= 0 ){
      // console.log('interpolation completed %s',o.join(','))
      vec.copy(z,o) // reset offset
      vec.free(i.offset)
      i.offset = null
      i.frames = null
    }
  }

  // update the shape
  move(body.shape,c)
  poly.aabb(body.shape,body.aabb)
}


exports.force = function(force,body){
  if( !force.active )
    return;

  switch( force.type ){

    case 'attract':
      var diff = vec.sub(force.position, body.current)
        , distSq = vec.lenSq(diff)
        , radiSq = force.radius*force.radius;
      if( distSq < radiSq ){
        // limit the distsq to avoid insane speeds
        // when it gets too close to the center.
        distSq = Math.max(100,distSq)
        var f = (body.mass*force.mass)/distSq*force.power;
        f = Math.min(.65, f)
        var d = Math.sqrt(distSq);
        exports.bodyForce(body, f * diff[0]/d, f * diff[1]/d);
      }
      vec.free(diff)
      break;

    case 'repell':
      var diff = vec.sub(force.position, body.current)
        , distSq = vec.lenSq(diff)
        , radiSq = force.radius*force.radius;
      if( distSq < radiSq ){
        // limit the distsq to avoid insane speeds
        // when it gets too close to the center.
        distSq = Math.max(100,distSq)
        var f = (body.mass*-force.mass)/distSq*force.power;
        var d = Math.sqrt(distSq);
        exports.bodyForce(body, f * diff[0]/d, f * diff[1]/d);
      }
      vec.free(diff)
      break;

    default:
      throw new Error('invalid force')
  }
}

exports.bodyForce = function(body,x,y){
  var invMass = 1/body.mass;
  var f = vec.make(x*invMass,y*invMass)
  vec.add(body.acceleration, f, body.acceleration);
  vec.free(f)
}


var EPS = 1e-12;
function eps(x){ return Math.round(x/EPS) * EPS }

function move(shape,to){
  var c = poly.centroid(shape)
  var d = vec.sub(to,c)
  poly.translate(shape, d[0] ,d[1]);
  vec.free(c)
  vec.free(d)
}

// [t,r,b,l]
function center(aabb){
  return vec.make((aabb[2]-aabb[0])/2,(aabb[1]-aabb[3])/2)
}

});
require.register("slam/lib/sim/interpolate.js", function(exports, require, module){
var debug = require('debug')('sim:interpolate')
  , vec = require('geom').vec
  , settings = require('../settings');

/**
 * Adds properties to bodies `interpolate` object
 * which will be used in the integration to smooth
 * things about a bit between the two worlds.
 *
 * It should ignore interpolating if the difference is too
 * small.
 *
 *  ex.
 *
 *    {
 *      offset: vec.sub(before.current,after.current),
 *      step: 1/f, // ex 1/10 = .1
 *      frames: f   // ex 10 so
 *    }
 *
 *
 * @param {World} before The (temporary) world before the replay
 * @param {World} after The current world after the replay
 */
module.exports = function interpolate(before, after, frames){
  frames = Math.min(settings.data.interpolationMaxFrames,frames)
  if( !frames ){
    return;
  }

  // interpolate pucks
  for(var i=0; i<after.pucks.length; i++){
    var a = after.pucks.values[i];
    if( before.pucks.has(a.index) ){
      interpolateBody(a,before.pucks.get(a.index),frames)
    }
  }
}

// applies the interpolation to a single body
function interpolateBody(a,b,f){
  var i = a.interpolate;

  // skip if it already has interpolation
  // TODO should we re-create instead and make
  //      sure we free the old ones first?
  if( i.frames ){
    // vec.free(i.offset)
    // i.offset = null
    // i.frames = null
    console.log('skipping interpolation of %s because it already has one')
    return;
  }

  // skip if distance is too large or small
  var maxDist = settings.data.interpolationMaxDistance
    , minDist = settings.data.interpolationMinDistance
    , dist = vec.distSq(a.current,b.current);

  if( dist < minDist*minDist ){
    debug('skipping too short interpolation for %s (dist: %s)',a.index,Math.sqrt(dist))
  } else if( dist > maxDist*maxDist ){
    debug('skipping too long interpolation for %s (dist: %s)',a.index,Math.sqrt(dist))
  } else {
    i.offset = vec.sub(b.current,a.current);
    vec.copy(i.offset,a.offset)
    i.step = 1/(f+1);
    i.frames = f;
  }

  // no need to free i.offset, it will be freed when done
}
});
require.register("slam/lib/sim/collision.js", function(exports, require, module){
var debug = require('debug')('sim:collision')
  , settings = require('../settings')
  , actions = require('../actions')
  , BodyFlags = require('./body-flags')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec;


module.exports = function collision(world,a,b,c){
  // console.log('collides:')
  // console.log('  a: %s:%s (%s)',a.id,a.index,BodyFlags.toString(a._flags))
  // console.log('  b: %s:%s (%s)',b.id,b.index,BodyFlags.toString(b._flags))

  // GHOST
  if( (BodyFlags.has(a,BodyFlags.GHOST) && !BodyFlags.has(b,BodyFlags.STATIC)) ||
      (BodyFlags.has(b,BodyFlags.GHOST) && !BodyFlags.has(a,BodyFlags.STATIC))){
    // console.log("GHOST COLLISION!")
    // just ignoring for now
    // but maybe even skip oncollision()?
    // and should it bounce off of STATICs?
    return;

  // BOUNCE
  } else if( BodyFlags.has(a,BodyFlags.BOUNCE) && BodyFlags.has(b,BodyFlags.BOUNCE) ){

    // currently intersecting. move apart
    // but don't change the velocity (it will be done below depending on flags)
    if( c.intersect ){
      fixIntersection(world,a,b,c)
    }

    if( BodyFlags.has(b,BodyFlags.DIRECT) ){
      bounceDirect(world,a,b,c)

    } else if( BodyFlags.has(b,BodyFlags.STEER) ){
      bounceSteer(world,a,b,c)

    } else {
      bounceReflect(world,a,b,c)
    }
  }

  // handle the collision based on
  // body types
  switch(a.id){
    case 'puck':
      switch(b.id){
        case 'extra': return actions.hitPuckExtra(world,a,b);
        case 'paddle': return actions.hitPuckPaddle(world,a,b);
        case 'shield': return actions.hitPuckShield(world,a,b);
        case 'obstacle': return actions.hitPuckObstacle(world,a,b);
      }
      return console.warn('unknown collision between %s and %s',a.id,b.id)

    case 'bullet':
      switch(b.id){
        case 'paddle': return actions.hitBulletPaddle(world,a,b);
        case 'obstacle': return actions.hitBulletObstacle(world,a,b);
      }
      return console.warn('unknown collision between %s and %s',a.id,b.id)
  }
}

function fixIntersection(world,a,b,c){
  var t = c.minTranslationVector;

  // if both are DYNAMIC `a` should + t*.5 and `b` - t*.5.
  // (see http://elancev.name/oliver/2D%20polygon.htm)
  if( a.id !== "paddle" && b.id !== "paddle" && !BodyFlags.has(a,BodyFlags.STATIC) && !BodyFlags.has(b,BodyFlags.STATIC) ){
    // split t in half
    t[0] = t[0]/2
    t[1] = t[1]/2

    // update a
    vec.add(a.previous,t,a.previous);
    vec.add(a.current,t,a.current);
    poly.translate(a.shape, t[0] ,t[1]);
    poly.aabb(a.shape,a.aabb);

    // update b
    vec.sub(b.previous,t,b.previous);
    vec.sub(b.current,t,b.current);
    poly.translate(b.shape, -t[0] ,-t[1]);
    poly.aabb(b.shape,b.aabb);

  // otherwise only move a
  } else {
    vec.add(a.previous,t,a.previous);
    vec.add(a.current,t,a.current);
    poly.translate(a.shape, t[0] ,t[1]);
    poly.aabb(a.shape,a.aabb);
  }
}

function bounceDirect(world,a,b,c){
  // console.log("BOUNCE DIRECT!")
  var I = vec.norm(a.velocity)
    , n = vec.perp(c.nearestEdge)
    , r = vec.reflect(I,vec.norm(n,n))
    , l = vec.len(a.velocity);

  // add the x-velocity of the paddle to the reflection angle
  var d = b.velocity[0] / 10;
  r[0] += d;

  r[0] /= 4;

  // normalizing again to avoid any additional velocity
  vec.smul(vec.norm(r,r),l,r)

  // update puck positions
  vec.sub(a.current,r,a.previous)

  // update velocity (which is used to check for other collisions)
  vec.copy(r,a.velocity)

  vec.free(r)
  vec.free(I)
  vec.free(n)
}

function bounceSteer(world,a,b,c){
  // console.log("BOUNCE STEER!")
  // divide the diff w. width to get the x normal
  var I = vec.norm(a.velocity)
    , n = vec.perp(c.nearestEdge)
    , r = vec.reflect(I,vec.norm(n,n))
    , l = vec.len(a.velocity)
    , d = (a.current[0] - b.current[0])/(a.aabb[1]-b.aabb[3]);

  // as nearestEdge is a bit shaky in it's
  // reliability we have the option of using
  // one that find an edge that crosses the
  // line between the centroids of the two
  // polygons.
  if( settings.data.improvedNormals ){
    improveNormals(a,b,I,r)
  }

  // divide to make it less horizontal when
  // we have momentum than without momentum
  r[0] = settings.data.paddleMomentum
         ? d/settings.data.steerWidthMomentum
         : d/settings.data.steerWidth;

  // normalizing again to avoid any additional velocity
  vec.smul(vec.norm(r,r),l,r)

  // update puck positions
  vec.sub(a.current,r,a.previous)

  // update velocity (which is used to check for other collisions)
  vec.copy(r,a.velocity)

  vec.free(r)
  vec.free(I)
  vec.free(n)
}

function bounceReflect(world,a,b,c){
  // console.log("BOUNCE REFLECT!",a.id,a.index)
  var I = vec.norm(a.velocity)
    , n = vec.perp(c.nearestEdge)
    , r = vec.reflect(I,vec.norm(n,n))
    , l = vec.len(a.velocity)

  // as nearestEdge is a bit shaky in it's
  // reliability we have the option of using
  // one that find an edge that crosses the
  // line between the centroids of the two
  // polygons.
  if( settings.data.improvedNormals ){
    improveNormals(a,b,I,r)
  }

  // make sure it has the original velocity
  vec.smul(r,l,r)

  // console.log('before reflect')
  // console.log(' c:',a.current)
  // console.log(' p:',a.previous)
  // console.log(' v:',a.velocity)

  // update puck positions
  vec.sub(a.current,r,a.previous)

  // update velocity (which is used to check for other collisions)
  vec.copy(r,a.velocity)

  // console.log('after reflect')
  // console.log(' c:',a.current)
  // console.log(' p:',a.previous)
  // console.log(' v:',a.velocity)

  vec.free(r)
  vec.free(I)
  vec.free(n)
}


function improveNormals(a,b,I,r){
  var x = vec.make(); // output normal
  var o = vec.copy(a.current) // origin
  var t = vec.copy(b.current) // target
  var s = vec.sub(t,o) // ray

  // extend `s` backwards by `a.radius` to
  // avoid a possible issue where the lines won't
  // intersect.
  var ext = vec.norm(s)
  vec.smul(ext,a.radius,ext)
  vec.sub(o,ext,o)

  // update s
  vec.sub(t,o,s)

  if( findEdgeNormal(b.shape,o,s,x) ){
    vec.reflect(I,x,r)
  }
  vec.free(t)
  vec.free(o)
  vec.free(s)
  vec.free(x)
}

/**
 * Sends a ray (the vector) into the Polygon
 * to see which edge segment it intersects.
 *
 * Based on: http://afloatingpoint.blogspot.se/2011/04/2d-polygon-raycasting.html
 *
 * @param  {Polygon} p The polygon
 * @param  {Vector} o The ray origin
 * @param  {Vector} v The ray direction
 * @param  {Vector} n The edge normal (if found)
 * @return {Boolean} true if normal was found
 */
function findEdgeNormal(p,o,v,n){
  var e = vec.add(o,v)
  var f = vec.make()
  for(var i=0; i<p.length; i++){
    var a = p.vertices[i];
    var b = vec.add(a,p.edges[i],f)
    if( intersectsLineLine(o,e,a,b) ){
      vec.perp(p.edges[i],n)
      vec.norm(n,n)
      vec.free(f)
      vec.free(e)
      return true;
    }
  }
  vec.free(e)
  vec.free(f)
  return false;
}

function intersectsLineLine(a1,a2,b1,b2,i){
  var uaT = (b2[0] - b1[0]) * (a1[1]-b1[1]) - (b2[1]-b1[1]) * (a1[0]-b1[0]);
  var ubT = (a2[0] - a1[0]) * (a1[1]-b1[1]) - (a2[1]-a1[1]) * (a1[0]-b1[0]);
  var u   = (b2[1] - b1[1]) * (a2[0]-a1[0]) - (b2[0]-b1[0]) * (a2[1]-a1[1]);
  if( u !== 0 ){
    var ua = uaT / u;
    var ub = ubT / u;

    if( 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ){
      // intersection point:
      if( i ){
        i[0] = a1[0]+ua*(a2[0]-a1[0])
        i[1] = a1[1]+ua*(a2[1]-a1[1])
      }
      return true;
    } else {
      // no intersection
      return false;
    }

  } else if( uaT === 0 || ubT === 0 ){
    // coincident
    return false;
  } else {
    // parallel
    return false;
  }
}
});
require.register("slam/lib/sim/bounds.js", function(exports, require, module){
var debug = require('debug')('sim:bounds')
  , actions = require('../actions')
  , settings = require('../settings')
  , BodyFlags = require('./body-flags')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec
  , dmaf = require('../dmaf.min');

/**
 * Will take care of the collision between
 * a body and boundries detected in physics.js.
 *
 * @param  {World} world
 * @param  {Body} a     A body
 * @param  {Object} b   Collision information (ex. {})
 * @return
 */


exports.puck = function(world,p,b){
  debug('puck',p.index)

  var h = (p.aabb[2] - p.aabb[0])*.5;

  // first see if we hit the bounds behind
  // any player?
  var player = null;
  if( p.current[1] <= h ){
    player = world.players.b;
  } else if( p.current[1] >= settings.data.arenaHeight-h  ){
    player = world.players.a;
  }

  // offset b to avoid intersection
  vec.add(p.current, b, p.current)

  // flip velocity by adding it to current
  // (moving the previous ahead)
  if( b[0] ) p.previous[0] = p.current[0] + p.velocity[0]
  if( b[1] ) p.previous[1] = p.current[1] + p.velocity[1]

  // update the velocity
  vec.sub(p.current, p.previous, p.velocity)

  // negate the offset if there is one
  if( p.interpolate.offset ){
    // console.log('negating the interpolation offset')
    if( b[0] ) p.interpolate.offset[0] = -p.interpolate.offset[0];
    if( b[1] ) p.interpolate.offset[1] = -p.interpolate.offset[1];
  }

  // check for player
  if( player && !BodyFlags.has(p,BodyFlags.GHOST) && !settings.data.godMode){
    actions.playerHit(world,player,p);
  } else {
    dmaf.tell('wall_hit');
  }

  actions.puckBounced(world,p)
}


exports.paddle = function(world,p,b){
  debug('paddle',p.index)
  // offset b to avoid intersection
  // reset velocity by settings previous to current
  vec.add(p.current, b, p.current)
  vec.copy(p.current, p.previous)
}


exports.bullet = function(world,p,b){
  debug('bullet',p.index)
  actions.destroyBullet(world,p);
}


});
require.register("slam/lib/support/aabb.js", function(exports, require, module){

/**
 * A helper method to see if a body is
 * colliding with any others in the world.
 *
 * @param  {World} world
 * @param  {Body} a
 * @return {Boolean} `true` in case of collision
 */
exports.colliding = colliding;
function colliding(world,a){
  for(var j=0; j < world.bodies.length; j++){
    var b = world.bodies.values[j]
    // skip self
    if( b === a ) {
      continue;
    }

    // fix for preventing obstacles to collide with
    // each other when spawning
    if( b.id == 'obstacle' && a.id == 'obstacle'){
      continue;
    }

    if( intersects(a.aabb,b.aabb) ){
      return true;
    }
  }
  return false;
}

/**
 * Checks if two AABB arrays intersects.
 *
 * Used for a faster `colliding()` check, since velocities
 * are not required for their use (extra creation).
 *
 * @param {AABB} a [t,r,b,l]
 * @param {AABB} b [t,r,b,l]
 * @return {Boolean} `true` if they intersect
 */
exports.intersects = intersects;
function intersects(a,b){
  if( b[3] > a[1] || a[3] > b[1] ) return false;
  if( b[0] > a[2] || a[0] > b[2] ) return false;
  return true;
}
});
require.register("slam/lib/support/diff.js", function(exports, require, module){
/* See license.txt for terms of usage */

/*
 * Text diff implementation.
 * 
 * This library supports the following APIS:
 * JsDiff.diffChars: Character by character diff
 * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
 * JsDiff.diffLines: Line based diff
 * 
 * JsDiff.diffCss: Diff targeted at CSS content
 * 
 * These methods are based on the implementation proposed in
 * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
 * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
 */
var JsDiff = (function() {
  function clonePath(path) {
    return { newPos: path.newPos, components: path.components.slice(0) };
  }
  function removeEmpty(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }
  function escapeHTML(s) {
    var n = s;
    n = n.replace(/&/g, "&amp;");
    n = n.replace(/</g, "&lt;");
    n = n.replace(/>/g, "&gt;");
    n = n.replace(/"/g, "&quot;");

    return n;
  }


  var fbDiff = function(ignoreWhitespace) {
    this.ignoreWhitespace = ignoreWhitespace;
  };
  fbDiff.prototype = {
      diff: function(oldString, newString) {
        // Handle the identity case (this is due to unrolling editLength == 0
        if (newString == oldString) {
          return [{ value: newString }];
        }
        if (!newString) {
          return [{ value: oldString, removed: true }];
        }
        if (!oldString) {
          return [{ value: newString, added: true }];
        }

        newString = this.tokenize(newString);
        oldString = this.tokenize(oldString);

        var newLen = newString.length, oldLen = oldString.length;
        var maxEditLength = newLen + oldLen;
        var bestPath = [{ newPos: -1, components: [] }];

        // Seed editLength = 0
        var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
        if (bestPath[0].newPos+1 >= newLen && oldPos+1 >= oldLen) {
          return bestPath[0].components;
        }

        for (var editLength = 1; editLength <= maxEditLength; editLength++) {
          for (var diagonalPath = -1*editLength; diagonalPath <= editLength; diagonalPath+=2) {
            var basePath;
            var addPath = bestPath[diagonalPath-1],
                removePath = bestPath[diagonalPath+1];
            oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
            if (addPath) {
              // No one else is going to attempt to use this value, clear it
              bestPath[diagonalPath-1] = undefined;
            }

            var canAdd = addPath && addPath.newPos+1 < newLen;
            var canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
            if (!canAdd && !canRemove) {
              bestPath[diagonalPath] = undefined;
              continue;
            }

            // Select the diagonal that we want to branch from. We select the prior
            // path whose position in the new string is the farthest from the origin
            // and does not pass the bounds of the diff graph
            if (!canAdd || (canRemove && addPath.newPos < removePath.newPos)) {
              basePath = clonePath(removePath);
              this.pushComponent(basePath.components, oldString[oldPos], undefined, true);
            } else {
              basePath = clonePath(addPath);
              basePath.newPos++;
              this.pushComponent(basePath.components, newString[basePath.newPos], true, undefined);
            }

            var oldPos = this.extractCommon(basePath, newString, oldString, diagonalPath);

            if (basePath.newPos+1 >= newLen && oldPos+1 >= oldLen) {
              return basePath.components;
            } else {
              bestPath[diagonalPath] = basePath;
            }
          }
        }
      },

      pushComponent: function(components, value, added, removed) {
        var last = components[components.length-1];
        if (last && last.added === added && last.removed === removed) {
          // We need to clone here as the component clone operation is just
          // as shallow array clone
          components[components.length-1] =
            {value: this.join(last.value, value), added: added, removed: removed };
        } else {
          components.push({value: value, added: added, removed: removed });
        }
      },
      extractCommon: function(basePath, newString, oldString, diagonalPath) {
        var newLen = newString.length,
            oldLen = oldString.length,
            newPos = basePath.newPos,
            oldPos = newPos - diagonalPath;
        while (newPos+1 < newLen && oldPos+1 < oldLen && this.equals(newString[newPos+1], oldString[oldPos+1])) {
          newPos++;
          oldPos++;
          
          this.pushComponent(basePath.components, newString[newPos], undefined, undefined);
        }
        basePath.newPos = newPos;
        return oldPos;
      },

      equals: function(left, right) {
        var reWhitespace = /\S/;
        if (this.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right)) {
          return true;
        } else {
          return left == right;
        }
      },
      join: function(left, right) {
        return left + right;
      },
      tokenize: function(value) {
        return value;
      }
  };
  
  var CharDiff = new fbDiff();
  
  var WordDiff = new fbDiff(true);
  WordDiff.tokenize = function(value) {
    return removeEmpty(value.split(/(\s+|\b)/));
  };
  
  var CssDiff = new fbDiff(true);
  CssDiff.tokenize = function(value) {
    return removeEmpty(value.split(/([{}:;,]|\s+)/));
  };
  
  var LineDiff = new fbDiff();
  LineDiff.tokenize = function(value) {
    return value.split(/^/m);
  };
  
  return {
    diffChars: function(oldStr, newStr) { return CharDiff.diff(oldStr, newStr); },
    diffWords: function(oldStr, newStr) { return WordDiff.diff(oldStr, newStr); },
    diffLines: function(oldStr, newStr) { return LineDiff.diff(oldStr, newStr); },

    diffCss: function(oldStr, newStr) { return CssDiff.diff(oldStr, newStr); },

    createPatch: function(fileName, oldStr, newStr, oldHeader, newHeader) {
      var ret = [];

      ret.push("Index: " + fileName);
      ret.push("===================================================================");
      ret.push("--- " + fileName + (typeof oldHeader === "undefined" ? "" : "\t" + oldHeader));
      ret.push("+++ " + fileName + (typeof newHeader === "undefined" ? "" : "\t" + newHeader));

      var diff = LineDiff.diff(oldStr, newStr);
      if (!diff[diff.length-1].value) {
        diff.pop();   // Remove trailing newline add
      }
      diff.push({value: "", lines: []});   // Append an empty value to make cleanup easier

      function contextLines(lines) {
        return lines.map(function(entry) { return ' ' + entry; });
      }
      function eofNL(curRange, i, current) {
        var last = diff[diff.length-2],
            isLast = i === diff.length-2,
            isLastOfType = i === diff.length-3 && (current.added === !last.added || current.removed === !last.removed);

        // Figure out if this is the last line for the given file and missing NL
        if (!/\n$/.test(current.value) && (isLast || isLastOfType)) {
          curRange.push('\\ No newline at end of file');
        }
      }

      var oldRangeStart = 0, newRangeStart = 0, curRange = [],
          oldLine = 1, newLine = 1;
      for (var i = 0; i < diff.length; i++) {
        var current = diff[i],
            lines = current.lines || current.value.replace(/\n$/, "").split("\n");
        current.lines = lines;

        if (current.added || current.removed) {
          if (!oldRangeStart) {
            var prev = diff[i-1];
            oldRangeStart = oldLine;
            newRangeStart = newLine;
            
            if (prev) {
              curRange = contextLines(prev.lines.slice(-4));
              oldRangeStart -= curRange.length;
              newRangeStart -= curRange.length;
            }
          }
          curRange.push.apply(curRange, lines.map(function(entry) { return (current.added?"+":"-") + entry; }));
          eofNL(curRange, i, current);

          if (current.added) {
            newLine += lines.length;
          } else {
            oldLine += lines.length;
          }
        } else {
          if (oldRangeStart) {
            // Close out any changes that have been output (or join overlapping)
            if (lines.length <= 8 && i < diff.length-2) {
              // Overlapping
              curRange.push.apply(curRange, contextLines(lines));
            } else {
              // end the range and output
              var contextSize = Math.min(lines.length, 4);
              ret.push(
                  "@@ -" + oldRangeStart + "," + (oldLine-oldRangeStart+contextSize)
                  + " +" + newRangeStart + "," + (newLine-newRangeStart+contextSize)
                  + " @@");
              ret.push.apply(ret, curRange);
              ret.push.apply(ret, contextLines(lines.slice(0, contextSize)));
              if (lines.length <= 4) {
                eofNL(ret, i, current);
              }

              oldRangeStart = 0;  newRangeStart = 0; curRange = [];
            }
          }
          oldLine += lines.length;
          newLine += lines.length;
        }
      }

      return ret.join('\n') + '\n';
    },

    convertChangesToXML: function(changes){
      var ret = [];
      for ( var i = 0; i < changes.length; i++) {
        var change = changes[i];
        if (change.added) {
          ret.push("<ins>");
        } else if (change.removed) {
          ret.push("<del>");
        }

        ret.push(escapeHTML(change.value));

        if (change.added) {
          ret.push("</ins>");
        } else if (change.removed) {
          ret.push("</del>");
        }
      }
      return ret.join("");
    },
    
    convertChangesToDMP: function(changes){
      var ret = [], change;
      for ( var i = 0; i < changes.length; i++) {
        change = changes[i];
        ret.push([(change.added ? 1 : change.removed ? -1 : 0), change.value]);
      }
      return ret;
    }
  };
})();

if (typeof module !== "undefined") {
    module.exports = JsDiff;
}
});
require.register("slam/lib/support/inspect.js", function(exports, require, module){

module.exports = inspect;

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  if (opts) {
    // got an "options" object
    extend(ctx, opts);
  }
  // set default options
  if (typeof ctx.showHidden === 'undefined') 
    ctx.showHidden = false;
  if (typeof ctx.depth === 'undefined') 
    ctx.depth = 2;
  if (typeof ctx.colors === 'undefined') 
    ctx.colors = false;
  if (typeof ctx.customInspect === 'undefined') 
    ctx.customInspect = true;
  if (ctx.colors) 
    ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect && value && typeof value.inspect === 'function' &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    return String(value.inspect(recurseTimes));
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (typeof value === 'function') {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (typeof value === 'function') {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  switch (typeof value) {
    case 'undefined':
      return ctx.stylize('undefined', 'undefined');

    case 'string':
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                               .replace(/'/g, "\\'")
                                               .replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');

    case 'number':
      return ctx.stylize('' + value, 'number');

    case 'boolean':
      return ctx.stylize('' + value, 'boolean');
  }
  // For some reason typeof null is "object", so special case here.
  if (value === null) {
    return ctx.stylize('null', 'null');
  }
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  try { 
    desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] } 
  } catch(e){
    return '';
  };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (recurseTimes === null) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (typeof name === 'undefined') {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}

function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && objectToString(ar) === '[object Array]');
}

function isRegExp(re) {
  return typeof re === 'object' && objectToString(re) === '[object RegExp]';
}

function isDate(d) {
  return typeof d === 'object' && objectToString(d) === '[object Date]';
}

function isError(e) {
  return typeof e === 'object' && objectToString(e) === '[object Error]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

function extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || typeof add !== 'object') return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
});
require.register("slam/lib/support/draw.js", function(exports, require, module){
var geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec;

module.exports = function(ctx){
  return new Draw(ctx);
}

function Draw(ctx){
  this.ctx = ctx;
}

Draw.prototype = {
  clear: function(){
    this.ctx.clearRect(0,0,canvas.width,canvas.height)
  },
  poly: function(p){
    this.ctx.beginPath();
    var v = p.vertices[0]
      , x = v[0]
      , y = v[1];

    for(var i=0; i < p.edges.length; i++){
      var e = p.edges[i];
      this.ctx.moveTo(x,y)
      this.ctx.lineTo(x+e[0],y+e[1]);

      // draw normal
      var n = vec.perp(e)
      vec.norm(n,n)
      var m = vec.lerp([x,y],[x+e[0],y+e[1]],.5)
      this.ctx.moveTo(m[0],m[1])
      this.ctx.lineTo(m[0]+n[0]*5,m[1]+n[1]*5)

      // draw index
      this.ctx.font = '3px courier'
      var t = this.ctx.measureText(i).width;
      this.ctx.fillText(i,m[0]-t/2,m[1])

      // free the vectors
      vec.free(n)
      vec.free(m)

      x += e[0]
      y += e[1];
    }
    this.ctx.closePath();

    // draw centroid
    var c = poly.centroid(p)
    this.ctx.fillRect(c[0]-1,c[1]-1,2,2)
    vec.free(c)

    return this;
  },
  line: function(S){
    var a = S[0], b = S[1];
    this.ctx.beginPath();
    this.ctx.moveTo(a[0],a[1])
    this.ctx.lineTo(b[0],b[1])
    this.ctx.closePath();
    return this;
  },
  rect: function(r){ // [t,r,b,l]
    this.ctx.beginPath();
    this.ctx.rect(r[0],r[3],r[1]-r[3],r[2]-r[0]);
    this.ctx.closePath();
    return this;
  },
  point: function(a,r){
    r = r || 1
    this.ctx.beginPath();
    this.ctx.rect(a[0]-r,a[1]-r,r+r,r+r);
    this.ctx.closePath();
    return this;
  },
  stroke: function(strokeStyle,lineWidth){
    if( lineWidth )
      this.ctx.lineWidth = lineWidth;
    if( strokeStyle )
      this.ctx.strokeStyle = strokeStyle;
    this.ctx.stroke()
    return this;
  },
  fill: function(fillStyle){
    if( fillStyle )
      this.ctx.fillStyle = fillStyle;
    this.ctx.fill()
    return this;
  }
}
});
require.register("slam/lib/support/info.js", function(exports, require, module){
var $ = require('jquery')
  , settings = require('../settings')
  , inputs = require('../inputs')
  , vec = require('geom').vec;

var p = ''; // previous string
var report = ''; // the PeerConnection#getStats results
var disabled = false;
var pre = $('#debug-info pre')[0];
module.exports = function(ctx,enabled){

  if( enabled ){
    disabled = false;
  } else if( enabled === false ){
    disabled = true;
  }

  if( disabled ){
    return p;
  }

  var s = '';
  s += context(ctx)
  s += query(ctx.query)
  s += world(ctx.game.world,ctx.sync&&ctx.sync.world) || '';
  s += ctx.sync && world(ctx.sync.world,ctx.game.world) || '';
  s += net(ctx.network) || '';
  s += inp(inputs.info()) || '';
  s += ctx.network.remote && peercon(ctx.network.remote.connection) || '';
  s += ctx.network.remote && rtc(ctx.network.remote) || '';
  s += ctx.network.game && datchan(ctx.network.game.channel) || '';
  s += ctx.network.game && netchan(ctx.network.game) || '';
  s += ctx.renderer.impl && ctx.renderer.impl.renderer && webgl(ctx.renderer.impl.renderer.info) || '';
  s += game(ctx.game.world) || '';
  s += report;

  if( p !== s ){
    // $('#debug-info pre').text(s);
    pre.innerText = s;
    p = s;
  }

  return p
}

function context(ctx){
  return 'Context\n\t' + [
    'version: '+ctx.v,
    'dev: '+ ctx.dev,
    'pathname: '+ ctx.pathname,
    'multiplayer: '+!!ctx.multiplayer,
    'touch: '+!!ctx.touch,
    'silent: '+!!ctx.silent,
    'mobile: '+!!ctx.mobile,
    'room: '+ctx.room
  ].join('\n\t') + '\n\n'
}

function query(q){
  return 'Query\n\t'
    + Object.keys(q).map(function(k){
      return k+': '+(q[k] || true)
    }).join('\n\t') + '\n\n'
}

function game(w){
  return 'Game\n\t' + [
    'framerate: '+settings.data.framerate,
    'speed: '+settings.data.unitSpeed,
    'bullets: '+w.bullets.length,
    'forces: '+w.forces.length,
    'shields: '+w.shields.length,
    'extras: '+w.extras.length,
    'obstacles: '+w.obstacles.length,
    'paddles: '+w.paddles.length,
    'pucks: '+w.pucks.length
  ].join('\n\t') + '\n\n'
}

function world(w,o){
  return 'World\n\t' + [
   'name: '+w.name,
   'frame: '+w.frame+(o?' ('+(w.frame-o.frame)+')':''),
   'multiplayer: '+w.multiplayer,
   // 'code: '+w.code(), // NOTE: HEAVY
   'seed: '+w.rand.state,
   'state: '+w.state,
   'score: '+w.players.a.score+' - '+w.players.b.score,
   'wins: '+w.players.a.wins+' - '+w.players.b.wins,
   'me: '+ (w.me && (w.me === w.players.a ? 'a' : 'b') + (w.me.hit !== -1 ? '(hit)':'')),
   'opponent: '+ (w.opponent && (w.opponent === w.players.a ? 'a' : 'b') + (w.opponent.hit !== -1 ? '(hit)':'')),
  ].join('\n\t') + '\n\n'
}

function netchan(nc){
  return nc && 'NetChannel\n\t' + [
    'seq: '+nc.seq,
    'ack: '+nc.ack,
    'resent: '+nc.resent,
    'sent acks: '+nc.sentACKs,
    'recv acks: '+nc.recvACKs,
    'buffer: '+nc.buffer.length,
    'buffer size: '+nc.bufferLength,
    'encoded: '+(nc.encoded&&nc.encoded.byteLength)
  ].join('\n\t') + '\n\n'
}

function peercon(pc){
  // if( pc && typeof pc.getStats == 'function'){
    // pc.getStats(function(s){ report = stats(s.result()) })
  // }
  return pc && 'PeerConnection\n\t' + [
    'ice: '+pc.iceConnectionState,
    'gathering: '+pc.iceGatheringState,
    'signal: '+pc.signalingState,
    'local streams: '+pc.getLocalStreams().length,
    'remote streams: '+pc.getRemoteStreams().length
  ].join('\n\t') + '\n\n'
}

function rtc(remote){
  return remote && 'RTC\n\t' + [
    'initiator: '+remote.initiator,
    'open: '+remote.open,
    'challenged: '+remote.challenged,
    'challenger: '+remote.challenger
  ].join('\n\t') + '\n\n'
}

function datchan(dc){
  return dc && 'DataChannel\n\t' + [
    'label: '+dc.label,
    'reliable: '+dc.reliable,
    'bufferedAmount: '+dc.bufferedAmount,
    'ready: '+dc.readyState
  ].join('\n\t') + '\n\n'
}

function inp(i){
  return i && 'Inputs\n\t' + [
    'ack: ' + i.ack,
    'replaying: ' + i.replaying,
    'recorded: ' + i.recorded,
    'buffered: ' + i.buffered,
    'length: ' + i.length,
    'loc: ' + i.loc,
    'net: ' + i.net
  ].join('\n\t') + '\n\n'
}

function net(n){
  return n && 'Network\n\t' + [
    'connected: ' + n.connected,
    'winner: ' + n.winner,
    'user: ' + n.user,
    'ready state: ' + n.readyState,
    'pathname: ' + n.pathname,
    'send rate: ' + settings.data.sendRate + 'hz',
    'keep alive interval: ' + settings.data.keepAliveInterval+'ms'
  ].join('\n\t') + '\n\n'
}

function stats(results){
  var s = '';
  for (var i = 0; i < results.length; ++i) {
    var res = results[i];
    s += 'Report ' + i + '\n\t';
    if (res.local) {
      s += "Local\n";
      s += dump(res.local,"\t\t");
      s += '\n\t'
    }
    if (res.remote) {
      s += "Remote\n";
      s += dump(res.remote,"\t\t");
      s += '\n\t'
    }
  }
  return s;
}

function webgl(i){

    // memory: {
    //   programs: 0,
    //   geometries: 0,
    //   textures: 0
    // },

    // render: {
    //   calls: 0,
    //   vertices: 0,
    //   faces: 0,
    //   points: 0
    // }
  var m = i.memory;
  var r = i.render;
  return i && 'WebGL\n\t' + [
    'programs: ' + m.programs,
    'geometries: ' + m.geometries,
    'textures: ' + m.textures,
    'render calls: ' + r.calls,
    'vertices: ' + r.vertices,
    'faces: ' + r.faces,
    'points: ' + r.points
  ].join('\n\t') + '\n\n'
}

// Dumping a stats variable as a string.
// might be named toString?
function dump(obj,pre) {
  var s = pre+'Timestamp: ' + obj.timestamp;
  if (obj.names) {
    var names = obj.names();
    for (var i = 0; i < names.length; ++i) {
       s += '\n'+pre;
       s += names[i];
       s += ':';
       s += obj.stat(names[i]);
    }
  } else {
    if (obj.stat('audioOutputLevel')) {
      s += "audioOutputLevel: ";
      s += obj.stat('audioOutputLevel');
      s += "\n"+pre;
    }
  }
  return s;
}
});
require.register("slam/lib/support/select-text.js", function(exports, require, module){


module.exports = function selectText(element){
  var doc = document
    , range, selection;
  if (doc.body.createTextRange) {
    range = document.body.createTextRange();
    range.moveToElementText(element);
    range.select();
  } else if (window.getSelection) {
    selection = window.getSelection();
    range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
});
require.register("slam/lib/support/language-codes.js", function(exports, require, module){
exports.name = function(code,type){
  var shortCode = (code||"").split("-").shift();
  return exports.native[shortCode] || "Unknown";
}

exports.english = {
  "am": "Amharic",
  "ar": "Arabic",
  "bg": "Bulgarian",
  "bn": "Bengali; Bangla",
  "ca": "Catalan",
  "cs": "Czech",
  "da": "Danish",
  "de": "German",
  "el": "Greek",
  "en": "English",
  "es": "Spanish",
  "et": "Estonian",
  "fa": "Persian",
  "fi": "Finnish",
  "fr": "French",
  "gu": "Gujarati",
  "hi": "Hindi",
  "hr": "Croatian",
  "hu": "Hungarian",
  "id": "Indonesian",
  "it": "Italian",
  "ja": "Japanese",
  "kn": "Kannada",
  "ko": "Korean",
  "lt": "Lithuanian",
  "lv": "Latvian",
  "ml": "Malayalam",
  "mr": "Marathi (Marāṭhī)",
  "ms": "Malay",
  "nl": "Dutch",
  "no": "Norwegian",
  "pl": "Polish",
  "pt": "Portuguese",
  "ro": "Romanian",
  "ru": "Russian",
  "sk": "Slovak",
  "sl": "Slovene",
  "sr": "Serbian",
  "sv": "Swedish",
  "sw": "Swahili",
  "ta": "Tamil",
  "te": "Telugu",
  "th": "Thai",
  "tr": "Turkish",
  "uk": "Ukrainian",
  "vi": "Vietnamese",
  "zh": "Chinese"
}

exports.entities = {
  "am": "&#4768;&#4635;&#4653;&#4763;",
  "ar": "&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;",
  "bg": "&#1073;&#1098;&#1083;&#1075;&#1072;&#1088;&#1089;&#1082;&#1080;",
  "bn": "&#2476;&#2494;&#2434;&#2482;&#2494;",
  "ca": "catal&agrave;",
  "cs": "&#269;e&scaron;tina",
  "da": "dansk",
  "de": "Deutsch",
  "el": "&epsilon;&lambda;&lambda;&eta;&nu;&iota;&kappa;&#940;",
  "en": "English",
  "es": "espa&ntilde;ol",
  "et": "eesti",
  "fa": "&#1601;&#1575;&#1585;&#1587;&#1740;",
  "fi": "suomi",
  "fr": "fran&ccedil;ais",
  "gu": "&#2711;&#2753;&#2716;&#2736;&#2750;&#2724;&#2752;",
  "hi": "&#2361;&#2367;&#2344;&#2381;&#2342;&#2368;",
  "hr": "hrvatski",
  "hu": "magyar",
  "id": "Indonesia",
  "it": "italiano",
  "ja": "&#26085;&#26412;&#35486;",
  "kn": "&#3221;&#3240;&#3277;&#3240;&#3233;",
  "ko": "&#38867;&#22283;&#35486;",
  "lt": "lietuvi&#371;",
  "lv": "latvie&scaron;u",
  "ml": "&#3374;&#3378;&#3375;&#3390;&#3379;&#3330;",
  "mr": "&#2350;&#2352;&#2366;&#2336;&#2368;",
  "ms": "Malay",
  "nl": "Nederlands",
  "no": "Norsk",
  "pl": "polski",
  "pt": "portugu&ecirc;s",
  "ro": "Romanian, Moldavian",
  "ru": "&#1088;&#1091;&#1089;&#1089;&#1082;&#1080;&#1081;",
  "sk": "sloven&#269;ina",
  "sl": "slovenski",
  "sr": "&#1089;&#1088;&#1087;&#1089;&#1082;&#1080; &#1112;&#1077;&#1079;&#1080;&#1082;",
  "sv": "Svenska",
  "sw": "Kiswahili",
  "ta": "&#2980;&#2990;&#3007;&#2996;&#3021;",
  "te": "&#3108;&#3142;&#3122;&#3137;&#3095;&#3137;",
  "th": "&#3652;&#3607;&#3618;",
  "tr": "T&uuml;rk&ccedil;e",
  "uk": "&#1091;&#1082;&#1088;&#1072;&#1111;&#1085;&#1089;&#1100;&#1082;&#1072;",
  "vi": "Ti&#7871;ng Vi&#7879;t"
}


exports.native = {
  "am": "አማርኛ",
  "ar": "العربية",
  "bg": "български",
  "bn": "বাংলা",
  "ca": "català",
  "cs": "čeština",
  "da": "dansk",
  "de": "Deutsch",
  "el": "ελληνικά",
  "en": "English",
  "es": "español",
  "et": "eesti",
  "fa": "فارسی",
  "fi": "suomi",
  "fr": "français",
  "gu": "ગુજરાતી",
  "hi": "हिन्दी",
  "hr": "hrvatski",
  "hu": "magyar",
  "id": "Indonesia",
  "it": "italiano",
  "ja": "日本語",
  "kn": "ಕನ್ನಡ",
  "ko": "韓國語",
  "lt": "lietuvių",
  "lv": "latviešu",
  "ml": "മലയാളം",
  "mr": "मराठी",
  "ms": "Malay",
  "nl": "Nederlands",
  "no": "Norsk",
  "pl": "polski",
  "pt": "português",
  "ro": "Romanian, Moldavian",
  "ru": "русский",
  "sk": "slovenčina",
  "sl": "slovenski",
  "sr": "српски језик",
  "sv": "Svenska",
  "sw": "Kiswahili",
  "ta": "தமிழ்",
  "te": "తెలుగు",
  "th": "ไทย",
  "tr": "Türkçe",
  "uk": "українська",
  "vi": "Tiếng Việt",
  "zh": "漢語"
}

});
require.register("slam/lib/support/see.js", function(exports, require, module){
var Emitter = require('emitter'+(typeof process == 'undefined' ? '' : '-component'))
  , debug = require('debug')('see');

module.exports = Emitter(see);

var stack = []    // current active states
  , queue = []    // next targets
  , target        // current target
  , current = []  // current path
  , states = {}   // available states
  , lookup = []   // connects stack indexes/paths to states
  , active        // the currently active state (esp. during async)
  , bound = {}    // cache of bound functions
  , context = {}
  , running = false;

// see(path,state)
// see(path)
function see(path,state){
  // create - see(path,state)
  if( arguments.length == 2 ){
    if( typeof state != 'object' || !state ){
      throw new Error('state must be an object');
    }

    path = normalize(path)
    debug('create',path,[state])
    if( !states[path] ){
      states[path] = [state];
    } else {
      states[path].push(state);
    }

  // go - see(path)
  } else {
    debug('go',path)
    see.go(path || '/')

  }
}

see.abort = function(){
  debug('abort',queue,stack,active)

  // clear queue
  queue.length = 0

  // cleanup active
  if( active ){
    see.emit('leave',context);
    active.cleanup && active.cleanup(context);
    active = null;
  }

  // start again on next see()
  running = false;
}

see.ctx = function(ctx){
  context = ctx;
}

see.go = function(path){
  debug('go',path)

  path = normalize(path);

  if( !states[path] ){
    throw new Error('path does not exist: '+path);
  }

  // add to queue
  queue.push(path);

  // go only if queue was empty
  // (or we'll have parallel states running)
  running || nextInQueue()
}

/**
 * Binds a see(path) call for an event listener.
 *
 * Only creates a single bound function per path
 * so that it can easily be removed from the event
 * listener again.
 *
 * Example:
 *
 *    emitter.on('go',see.bind('/to/here'))
 *    emitter.off('go',see.bind('/to/here'))
 *
 * @param  {String} path
 * @return {Function} bound to see.go(path)
 */
see.bind = function(path){
  return bound[path] || (bound[path] = see.go.bind(see,path));
}

function nextInQueue(){
  if( queue.length ){
    running = true;
    target = queue.shift().split('/');
    go()

  } else {
    // done!
    debug('done')
    running = false;
  }
}

// returns 1 / -1 / 0
// depending on if it matches
function diff(){
  var t = str(target)
    , c = str(current)
    , l = stack[stack.length-1];

  debug('diff',t,c,l)

  // if already there
  if( t === c ){
    return 0;
  }

  // if shorter and they match so far
  if( current.length < target.length && t.indexOf(c) === 0 ){
    return +1;
  }

  // if it doesn't match what's in the stack
  if( l && l.indexOf(c) !== 0 ){
    return -2;
  }

  // if longer or they don't match so far
  if( current.length > target.length || t.indexOf(c) !== 0 ){
    return -1;
  }

  return 0;
}

function go(){
  switch(diff()){
    case 1: // push
      current.push(target[current.length])
      updateContext(str(current))
      return push()

    case -1: // pop
      updateContext(str(current))
      current.pop()
      return pop()

    case -2: // pop without touching the stack
      current.pop()
      return go();

    case 0: // done
      see.emit(str(target))
      return nextInQueue()
  }
}

function pop(){
  var pathname = stack.pop()
    , nextpath = stack[stack.length-1]
    , state = lookup.pop()
    , next = nextpath === pathname ? pop : go;

  // mark state as active
  active = state;

  // run
  if( state && typeof state.leave == 'function' ){
    // async
    if( state.leave.length >= 2 ){
      debug('pop async',context.pathname)
      state.leave(context,function(err){
        if( err instanceof Error ){
          see.emit('error',err);
        } else {
          see.emit('leave',context);
          state.cleanup && state.cleanup(context);
          active = null;
          next();
        }
      })

    // sync
    } else {
      debug('pop sync',context.pathname)
      state.leave(context);
      see.emit('leave',context);
      state.cleanup && state.cleanup(context);
      active = null;
      next();
    }

  // no leave
  } else if(state){
    debug('pop no leave',context.pathname)
    see.emit('leave',context);
    state.cleanup && state.cleanup(context);
    active = null;
    next();

  // no more states
  } else {
    next();
  }
}


function push(){
  var state = nextMatchingState();

  // mark state as active
  active = state;

  // run
  if( state && typeof state.enter == 'function' ){
    // async
    if( state.enter.length >= 2 ){
      debug('push async',context.pathname)
      see.emit('enter',context);
      state.enter(context,function(err){
        active = null;
        if( err instanceof Error ){
          see.emit('error',err);
        } else {
          stack.push(context.pathname)
          lookup.push(state)
          push();
        }
      })

    // sync
    } else {
      debug('push sync',context.pathname)
      see.emit('enter',context);
      state.enter(context);
      active = null;
      stack.push(context.pathname)
      lookup.push(state)
      push();
    }

  // no enter
  } else if( state ){
    debug('push no enter',context.pathname)
    see.emit('enter',context);
    active = null;
    push()

  // no more states
  } else {
    go()
  }
}

function str(path){
  return path.join('/') || '/';
}

// find a matching state
function nextMatchingState(){
  var path = str(current);
  // console.log('nextMatchingState()',path,states[path])
  if( states[path] ){
    for(var i=0; i < states[path].length; i++){
      if( !~lookup.indexOf(states[path][i]) ){
        return states[path][i];
      } else {
        // console.log('already in stack?',states[path][i],stack)
      }
    }
  }
}


var supportsConfigurable = (function(){
  var x={};
  Object.defineProperty(x,'x',{value:123,configurable:true});
  Object.defineProperty(x,'x',{value:456,configurable:true});
  return x.x === 456;
})()

function updateContext(path){
  var i = path.indexOf('?');
  if( !supportsConfigurable ){
    context.path = path
    context.pathname = ~i ? path.slice(0, i) : path
    context.querystring = ~i ? path.slice(i + 1) : ''
  } else {
    Object.defineProperties(context,{
      path: {
        value: path,
        configurable: true
      },
      pathname: {
        value: ~i ? path.slice(0, i) : path,
        configurable: true
      },
      querystring: {
        value: ~i ? path.slice(i + 1) : '',
        configurable: true
      }
    })
  }
}

function normalize(path){
  // TODO ("../" "./" "/" "//")
  return path || '';
}
});
require.register("slam/lib/support/mouse.js", function(exports, require, module){
var Emitter = require('emitter')
  , debug = require('debug')('mouse')

var mx, my
  , px, py
  , cx, cy
  , pt
  , element = document;

Emitter(exports)

var u; // = undefined!

exports.tick = function(){
  var t = Date.now()
    , dt = t-pt;
  if( (px !== u && py !== u) && (mx !== px || my !== py) )
    exports.emit('move',mx-px,my-py,dt)
  if( cx && cy )
    exports.emit('click',cx,cy,dt)
  px = mx; py = my; pt = t;
  cx = cy = null;
}

exports.start = function(el){
  debug('start',el)
  if( el ) element = el;
  element.addEventListener('touchstart',touchStart,true)
  element.addEventListener('touchmove',touchMove,true)
  element.addEventListener('mousemove',move,true)
  element.addEventListener('click',click,true)
}

exports.stop = function(){
  debug('stop')
  mx = px;
  my = py;
  element.removeEventListener('touchstart',touchStart,true)
  element.removeEventListener('touchmove',touchMove,true)
  element.removeEventListener('mousemove',move,true)
  element.removeEventListener('click',click,true)
}

function move(e){
  mx = e.pageX; my = e.pageY;
}

function click(e){
  cx = e.pageX; cy = e.pageY;
}

function touchStart(e){
  var t = e.touches[0];
  if( t ){
    px = mx = t.pageX;
    py = my = t.pageY;
  }
}

function touchMove(e){
  var t = e.touches[0];
  if( t ){
    mx = t.pageX;
    my = t.pageY;
    // exports.tick();
  }
  e.preventDefault()
}
});
require.register("slam/lib/support/buffer.js", function(exports, require, module){
exports.Writer = Writer;

exports.Reader = Reader;


function Reader(buffer,offset){
  // TypedArray
  if( buffer.buffer ){
    this.data = new DataView(buffer.buffer);
    this.offset = offset || 0;
    this.littleEndian = true;

  // ArrayBuffer
  } else {
    this.data = new DataView(buffer);
    this.offset = offset || 0;
    this.littleEndian = true;
  }
}
Reader.prototype = {
  getInt8: get('getInt8',1),
  getUint8: get('getUint8',1),
  getInt16: get('getInt16',2),
  getUint16: get('getUint16',2),
  getFloat32: get('getFloat32',4),
  getFloat64: get('getFloat64',8),
  readString: function(){
    var length = this.getUint8();
    var bytes = new Uint8Array(this.data.buffer,this.offset,length);
    this.offset += 1+length;
    return String.fromCharCode.apply(null, bytes);
  }
}

function get(type,size){
  return function(){
    var v = this.data[type](this.offset,this.littleEndian);
    this.offset += size;
    return v;
  }
}

function Writer(buffer,offset){
  this.data = new DataView(buffer);
  this.offset = offset || 0;
  this.littleEndian = true;
}
Writer.prototype = {
  setInt8: set('setInt8',1),
  setUint8: set('setUint8',1),
  setInt16: set('setInt16',2),
  setUint16: set('setUint16',2),
  setFloat32: set('setFloat32',4),
  setFloat64: set('setFloat64',8),
  writeString: function(str){
    if( str.length > 255 ){
      throw new Error('only 255 chars supported')
    }
    var bytes = getCharCodes(str);
    this.setUint8(bytes.length);
    new Uint8Array(this.data.buffer,this.offset,bytes.length).set(bytes);
    this.offset += 1 + bytes.length;
    return this;
  }
}

function set(type,size){
  return function(d){
    this.data[type](this.offset,d,this.littleEndian)
    this.offset += size;
    return this;
  }
}

function getCharCodes(s) {
  var codes = new Array(s.length);
  for(var i=0, l=s.length; i<l; i++) {
    codes[i] = s.charCodeAt(i) & 0xff;
  }
  return codes;
}

});
require.register("slam/lib/support/pool.js", function(exports, require, module){

module.exports = Pool;


/**
 * A very simple object pooling function.
 *
 * It will auto-expand if needed.
 *
 * Example:
 *
 *    var pool = require('pool');
 *
 *    function Obj(){}
 *    pool(Obj);
 *
 *    var o = Obj.alloc();
 *    // use `o`
 *    Obj.free(o);
 */

function Pool(C,size){
  var totalPooled = size || 1;
  var freeList = [];
  function expand(howMany){
    console.warn('pool expand %s: %s',C.name,howMany)
    for(var i=0; i < howMany; i++ ){
      freeList[i] = new C;
    }
    totalPooled += howMany;
  }
  expand(totalPooled)
  C.alloc = function(){
    if( freeList.length < 1 ){
      expand(totalPooled) // *= 2
    }
    var instance = freeList.pop();
    instance.alloc && instance.alloc()
    return instance;
  }
  C.free = function(instance){
    instance.free && instance.free()
    freeList.push(instance)
  }
}

});
require.register("slam/lib/support/tick.js", function(exports, require, module){
var debug = require('debug')('tick')
  , actions = require('../actions')
  , settings = require('../settings');

module.exports = Tick;

var TIMEOUT = 0
  , INTERVAL = 1;

var TIMEOUT_LEN = 6
  , ADDED_LEN = 5;
var slice = [].slice;

function Tick(){
  this._timeouts = [];
  this._added = [];
  this._index = 1;
}

Tick.prototype.nextFrame = function(action){
  if( typeof actions[action] != 'function' )
    return console.warn('invalid action "%s"',action)
  var id = this._index++;
  debug('nextFrame(%s) %s',action,id)
  this._added.push(id,action,slice.call(arguments,1),0,TIMEOUT);
  return id;
}

Tick.prototype.setTimeout = function(action,ms){
  if( typeof actions[action] != 'function' )
    return console.warn('invalid action "%s"',action)
  var id = this._index++;
  var frames = msToFrames(ms);
  debug('setTimeout(%s) %s (%s frames)',action,id,frames)
  this._added.push(id,action,slice.call(arguments,2),frames,TIMEOUT);
  return id;
}

Tick.prototype.clearTimeout = function(id){
  debug('clearTimeout %s',id)
  return outOfRange(id,this._index)
      || clearAdded(id,this._added,TIMEOUT)
      || clearTimeouts(id,this._timeouts,TIMEOUT)
}

Tick.prototype.setInterval = function(action,ms){
  if( typeof actions[action] != 'function' )
    return console.warn('invalid action "%s"',action)
  var id = this._index++;
  var frames = msToFrames(ms);
  debug('setInterval(%s) %s (%s frames)',action,id,frames)
  this._added.push(id,action,slice.call(arguments,2),frames,INTERVAL)
  return id;
}

Tick.prototype.clearInterval = function(id){
  debug('clearInterval %s',id)
  return outOfRange(id,this._index)
      || clearAdded(id,this._added,INTERVAL)
      || clearTimeouts(id,this._timeouts,INTERVAL)
}

Tick.prototype.update = function(world){
  checkForAdded(world.frame,this._added,this._timeouts)
  checkForActive(world,this._added,this._timeouts)
}

Tick.prototype.reset = function(){
  this._timeouts.length = 0;
  this._added.length = 0;
  this._index = 1;
}

function checkForAdded(frame,added,timeouts){
  while(added.length){
    var id = added.shift()
      , action = added.shift()
      , args = added.shift()
      , frames = added.shift()
      , type = added.shift()
      , when = frame + frames;
    timeouts.push(when,id,frames,action,args,type);
  }
}

function checkForActive(world,added,timeouts){
  var frame = world.frame;
  // loop from back for easy splice
  for(var i=timeouts.length-TIMEOUT_LEN; i>=0; i-=TIMEOUT_LEN) {
    var when = timeouts[i];

    if( when === frame ) {
      var id = timeouts[i+1]
        , frames = timeouts[i+2]
        , action = timeouts[i+3]
        , args = timeouts[i+4]
        , type = timeouts[i+5];

      // remove from list
      timeouts.splice(i,TIMEOUT_LEN);

      // re-add when interval
      if( type === INTERVAL ){
        timeouts.push(frame+frames,id,frames,action,args,type);
      }

      // call
      actions[action].apply(actions,[world].concat(args));
    }
  }
}

function outOfRange(id,index){
  return typeof id == 'number'
      && id >= index;
      // TODO can we check if id is lower than the lowest "active"?
}

function clearAdded(id,added,type){
  for(var i=added.length; i>=0; i -= ADDED_LEN){
    if( added[i] === id && added[i+4] === type ){
      added.splice(i,ADDED_LEN);
      return true;
    }
  }
}

function clearTimeouts(id,timeouts,type){
  for(var i=timeouts.length-TIMEOUT_LEN; i>=0; i -= TIMEOUT_LEN){
    if( timeouts[i+1] === id && timeouts[i+5] === type ){
      timeouts.splice(i,TIMEOUT_LEN);
      return true;
    }
  }
}

function msToFrames(ms){
  // 60/1000 = 0.06
  // 100ms * 0.06 = 6 frames
  return Math.round(ms*settings.data.framerate/1000) || 1;
}
});
require.register("slam/lib/support/rand.js", function(exports, require, module){

module.exports = RNG;

// http://stackoverflow.com/a/424445/80582
function RNG(seed) {
  this.state = seed ? seed : Math.floor(Math.random() * (this.m-1));
}

// LCG using GCC's constants
RNG.prototype = {
  m: 0x100000000, // 2**32;
  a: 1103515245,
  c: 12345
}

/**
 *  Generate a 32bit integer.
 */
RNG.prototype.integer = function() {
  this.state = (this.a * this.state + this.c) % this.m;
  return this.state;
}

/**
 *  Generate a float [0,1]
 */
RNG.prototype.random =
RNG.prototype.float = function() {
  return this.integer() / (this.m - 1);
}

/**
 * Generate a number within `start` (incl) and
 * `end` (excl).
 */
RNG.prototype.range = function(start, end) {
  return start + Math.floor((this.integer() / this.m) * (end - start));
}

/**
 * Pick a random item in `array`.
 */
RNG.prototype.choice = function(array) {
  return array[this.range(0, array.length)];
}
});
require.register("slam/lib/support/time-sync.js", function(exports, require, module){
var debug = require('debug')('time-sync')
  , Emitter = require('emitter')
  , latency = require('latency')
  , now = require('now');

/**
  This lib assumes that a PeerConnection has been
  set up between two clients.

  It works by using `DataChannel#send` to send a series
  of sync requests (of which the local time has been stored)
  and listening for sync replies and then calculates a
  latency based on median-stddev.

  Based on http://www.gamedev.net/page/resources/_/technical/multiplayer-and-network-programming/clock-synchronization-of-client-programs-r2493

    // uses DataChannel to synchronize the time
    // of 2 clients, very useful for a realtime
    // multiplayer game like "chrome pong"
    var TimeSync = require('time-sync')
      , sync = new TimeSync(dataChannel);

    // will be called for both host and guest when
    // the total latency has been calculated
    sync.on('done',function(){
      // now set game clock to 0 + this.latency
    }).start()
*/

module.exports = TimeSync;

function TimeSync(channel){
  if( !(this instanceof TimeSync) ){
    return new TimeSync(channel);
  }
  this.channel = channel;
  this.times = [];
  this.received = 0;
  this.index = 0;
  this.wanted = 32;
  this.requestTimes = {};
  this.timeout = 10000;
  this.interval = 160;
}

Emitter(TimeSync.prototype);

TimeSync.prototype.onmessage = function(msg){
  // wrap in typed array
  msg = new Uint8Array(msg);

  // check for REQUEST
  if( is(REQ,msg) ){
    var index = parse(msg)
    debug('got REQUEST',index)
    this.channel.send(write(REP,index))
    this.emit('request',index)
    return true;

  // check for REPLY
  } else if( is(REP,msg) ){
    var index = parse(msg)

    // we good, it's one of ours
    var requestTime = this.requestTimes[index]
    if( this.requesting && requestTime ){
      var replyTime = now()
      debug('got REPLY %sms',replyTime-requestTime,index)
      this.received++;
      this.times[index % this.wanted] = (replyTime-requestTime)/2;
      delete this.requestTimes[index]
      this.emit('reply',index)
    }
    return true;

  // check for DONE
  } else if( is(DON,msg) ){
    if( !this.requesting ){
      this.latency = parse(msg)
      debug('got DONE',this.latency)
      this.emit('done',this.latency,false)
    } else {
      console.warn('unexpected DONE')
    }
    return true;

  }
  // not a TimeSync message!
  return false;
}

TimeSync.prototype.start = function(){
  debug('start');

  if( this.requesting ){
    return console.warn('ignoring time sync start because already running')
  }

  if( !this.channel ){
    return console.warn('ignoring time sync start because missing data channel')
  }

  this.times.length = 0 // clear array
  this.index = Math.round(Math.random()*10000)
  this.update(this.wanted)
}

TimeSync.prototype.update = function(n){
  debug('update',n)
  this.requesting = true
  // send a request every 30ms until we have received
  // enough replies.
  this.received = 0;
  this._interval = setInterval(function(){
    // if we have enough request/replies we're done
    if( this.requesting && this.received >= n ){
      this.done()

    // or we keep sending requests
    } else if( this.requesting ){
      this.request()

    // or stop it
    } else {
      this.stop()
    }
  }.bind(this),this.interval)

  this._timeout = setTimeout(function(){
    debug('timed out')
    this.stop()
    this.emit('timeout')
  }.bind(this),this.timeout)
}

TimeSync.prototype.request = function(){
  var requestIndex = this.index
  this.requestTimes[requestIndex] = now()
  this.channel.send(write(REQ,requestIndex))
  debug('sent REQUEST',requestIndex,this.times.length === 0 ? 'initial' : '')
  this.index++
}

TimeSync.prototype.stop = function(){
  // cancel the rest of the requests
  clearInterval(this._interval)
  clearTimeout(this._timeout)
  this.requesting = false
}

TimeSync.prototype.done = function(){
  this.stop()
  this.latency = Math.round(calculateLatency(this.times)) // rounded because of 16bit int
  this.channel.send(write(DON,this.latency))
  debug('sent DONE',this.latency)
  this.emit('done',this.latency,true)
}

// calculate the latency from an array of "midway-latencies"
function calculateLatency(times){
  return latency(times);
}

var PREFIX = ['T'.charCodeAt(0),'S'.charCodeAt(0)];

// REQ is a prebuilt buffer with:
//  - a time-sync prefix (TS)
//  - the REQUEST type (0)
//  - and room for a 16bit index
var REQ = new Uint8Array(PREFIX.concat(0,0,0))

// REP is a prebuilt buffer with:
//  - a time-sync prefix (TS)
//  - the REPLY type (1)
//  - and room for a 16bit index
var REP = new Uint8Array(PREFIX.concat(1,0,0))

// DON is a prebuilt buffer with:
//  - a time-sync prefix (TS)
//  - the DONE type (2)
//  - and room for a 16bit latency
var DON = new Uint8Array(PREFIX.concat(2,0,0))

function write(buf,index){
  buf[3] = (index >> 8) & 0xff
  buf[4] = (index >> 0) & 0xff
  return buf;
}
function parse(buf){
  return (buf[3] << 8) + buf[4];
}
function is(buf,msg){
  return buf.byteLength === msg.byteLength
      && buf[0] === msg[0]
      && buf[1] === msg[1]
      && buf[2] === msg[2];
}
});
require.register("slam/lib/support/hash-code.js", function(exports, require, module){

module.exports = function hashCode(object) {
  var hashs = [];
  if (typeof(object) == "number") {
    hashs.push(eps(object));

  } else if( typeof object !== 'object' || object === null ){
    hashs.push(object);

  } else if( typeof object.hashCode == 'function' ){
    hashs.push(object.hashCode());

  } else {
    for (var key in object) {
      var val = object[key];

      // recurse through objects (and arrays)
      if (typeof(val) == "object") {
        val = hashCode(val);
      }

      // round off number to avoid float rounding errors
      if (typeof(val) == "number") {
        val = eps(val);
      }

      // add to hash
      hashs.push(key + val + key.length + String(val).length);
    }
  }

  // sort by keys
  hashs.sort();

  return djb2(hashs.join('|'));
}

function djb2(str) {
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    var ch = str.charCodeAt(i);
    hash = ((hash << 5) + hash) + ch; /* hash * 33 + c */
  }
  return hash;
}

// var EPS = 1e-1;
// function eps(x){ return Math.round(Math.round(x/EPS) * EPS) }

// var EPS_1 = 1e-1;
// var EPS_2 = 1e-2;
// function eps(x){
//   x = Math.round(Math.round(x/EPS_1)*EPS_1);
//   return Math.round(Math.round(x/EPS_2)*EPS_2);
// }

var EPS = Math.pow(2,-512);
function eps(x){
  return Math.round(x*EPS)/EPS;
}

function toString(s){
  return Object.prototype.toString.call(null,s);
}
});
require.register("slam/lib/support/valid-video.js", function(exports, require, module){

// if the remote video is not valid then
// send a 'request-video' to the peer which
// will then do a:
//
//  var s = getLocalStream()[0];
//  removeStream(s)
//  addStream(s)
//


module.exports = function validVideo(el){
  if( el.readyState !== el.HAVE_ENOUGH_DATA ){
    return false;
  }

  if( el.videoWidth === 0 && el.videoHeight === 0 ){
    return false;
  }

  // checks top-left, bottom-right and center
  // if the pixels are not transparent. if they
  // are then it's not valid.
  if( readPixel(el,0,0)[3] === 0 ){
    return false;
  }

  if( readPixel(el,159,119)[3] === 0 ){
    return false;
  }

  if( readPixel(el,80,60)[3] === 0 ){
    return false;
  }

  return true;
}

function readPixel(el,x,y){
  var canv = document.createElement('canvas');
  canv.width = 1;
  canv.height = 1;
  var ctx = canv.getContext('2d');
  ctx.drawImage(el,x,y,1,1,0,0,1,1);
  return ctx.getImageData(0,0,1,1).data;
}

});
require.register("slam/lib/support/exclude.js", function(exports, require, module){

module.exports = exclude;

// temporary excludes properties in `obj` defined in `excluded`
// calls fn with the obj and then adds the properties back after
// the callback.
function exclude(obj,excluded,fn){
  var map = {}
  excluded.forEach(function(prop){
    var props = prop.split('.');
    var tmp = obj;
    for (var i = 0; i < props.length; ++i) {
      var name = props[i];
      if( i == props.length-1 ){
        map[prop] = tmp[name]
        delete tmp[name]
      } else {
        tmp = tmp[name];
      }
    }
  })
  fn(obj)
  Object.keys(map).forEach(function(prop){
    var props = prop.split('.');
    var tmp = obj;
    for (var i = 0; i < props.length; ++i) {
      var name = props[i];
      if( i == props.length-1 ){
        tmp[name] = map[prop];
      } else {
        tmp = tmp[name];
      }
    }
  })
}
});
require.register("slam/lib/support/estimate-slow-down.js", function(exports, require, module){
var settings = require('../settings')

/**
 * Calculates a multiplier how much to slow
 * down to adjust the arrival for latency.
 *
 *
 *   // use
 *   var paddle = world.paddles.get(world.opponent.paddle);
 *   var puck = world.pucks.values[0];
 *   var time = 1000/settings.data.sendRate + ctx.latency;
 *   var m = estimateSlowDown(paddle.current[1] - puck.current[1],puck.velocity[1],t)
 *   // returns null if the puck is going in the wrong direction
 *
 *   if( m != null ){
 *     // based on the sync puck or we'll have a squared decceleration.
 *     var spuck = ctx.sync.world.pucks.get(puck.index)
 *     vec.smul(spuck.velocity,m,puck.velocity);
 *     vec.sub(puck.current,puck.velocity,puck.previous)
 *   } else {
 *     replay = true;
 *   }
 *
 *
 * @param  {Number} d The distance to travel (ex. b[1]-a[1])
 * @param  {Number} v The current velocity (ex. a[1])
 * @param  {Number} t The time to adjust for (ex. ctx.latency)
 * @return {Number} A number to multiply the current velocity by. Or null if going in the opposite direction.
 */
module.exports = function estimateSlowDown(d,v,t){
  // no velocity means "keep it up!"
  if( !v || !d || !t ){
    return 1;
  }

  // check the direction first
  if( !sameSign(d,v) ){
    return null;
  }

  // the time it can take the puck to get to the paddle
  var t2 = d/v * settings.data.timestep;

  // the time we want it to take the puck to reach the paddle
  var t3 = t2 + t;

  // return a multiplier
  return t2/t3;

  // the new velocity required
  var v2 = t2/t3*v;
}

function sameSign(x, y){
  return (x >= 0) ^ (y < 0);
}

});
require.register("slam/lib/support/improved-noise.js", function(exports, require, module){
// http://mrl.nyu.edu/~perlin/noise/

module.exports = new ImprovedNoise();

function ImprovedNoise() {

	this.p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,
		 23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
		 174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,
		 133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,
		 89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,
		 202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,
		 248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,
		 178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,
		 14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
		 93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

	for (var i=0; i < 256 ; i++) {

		this.p[256+i] = this.p[i];

	}

}

ImprovedNoise.prototype.noise =  function (x, y, z) {

	var floorX = ~~x, floorY = ~~y, floorZ = ~~z;

	var X = floorX & 255, Y = floorY & 255, Z = floorZ & 255;

	x -= floorX;
	y -= floorY;
	z -= floorZ;

	var xMinus1 = x -1, yMinus1 = y - 1, zMinus1 = z - 1;

	var u = fade(x), v = fade(y), w = fade(z);

	var A = this.p[X]+Y, AA = this.p[A]+Z, AB = this.p[A+1]+Z, B = this.p[X+1]+Y, BA = this.p[B]+Z, BB = this.p[B+1]+Z;

	return lerp(w, lerp(v, lerp(u, grad(this.p[AA], x, y, z), 
					grad(this.p[BA], xMinus1, y, z)),
				lerp(u, grad(this.p[AB], x, yMinus1, z),
					grad(this.p[BB], xMinus1, yMinus1, z))),
			lerp(v, lerp(u, grad(this.p[AA+1], x, y, zMinus1),
					grad(this.p[BA+1], xMinus1, y, z-1)),
				lerp(u, grad(this.p[AB+1], x, yMinus1, zMinus1),
					grad(this.p[BB+1], xMinus1, yMinus1, zMinus1))));

}

function fade(t) {

		return t * t * t * (t * (t * 6 - 15) + 10);

	}

	function lerp(t, a, b) {

		return a + t * (b - a);

	}

	function grad(hash, x, y, z) {

		var h = hash & 15;
		var u = h < 8 ? x : y, v = h < 4 ? y : h == 12 || h == 14 ? x : z;
		return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);

	}

});
require.register("slam/lib/states/index.js", function(exports, require, module){
exports.Setup = require('./setup');
exports.Mobile = require('./mobile');
exports.Loading = require('./loading');
exports.Error = require('./error');
exports.MainMenu = require('./main-menu');
exports.Friend = require('./friend');
exports.Webcam = require('./webcam');
exports.Prompt = require('./prompt');
exports.Game = require('./game');
exports.Game.Input = require('./game/input');
exports.Game.Verify = require('./game/verify');
exports.Game.Multiplayer = require('./game/multiplayer');



});
require.register("slam/lib/states/error.js", function(exports, require, module){
var see = require('../support/see')
  , inputs = require('mousetrap')
  , $ = require('jquery');

exports.enter = function(){

}

exports.leave = function(){

}

exports.DataChannels = {
  enter: function(ctx){
    var btn = $('.main-menu',ctx.el).on('click', function(e){
      see('/main-menu')
      e.preventDefault()
    })
    inputs.bind('space',function(){
      btn.click();
    })
  },
  leave: function(ctx){
    $('.mainmenu',ctx.el).off('click')
    inputs.unbind('space')
  }
}
exports.ConnectionError = {
  enter: function(ctx){
    inputs.bind('space',function(){
      $('a.button',ctx.el).click();
    })
  },
  leave: function(ctx){
    inputs.unbind('space')
  }
}
exports.FullRoom = {
  enter: function(ctx){
    /*var btn = $('.main-menu',ctx.el).on('click', function(){
      see('/main-menu')
    })*/
    var btn = $('.main-menu',ctx.el);

    inputs.bind('space',function(){
      btn.click();
    })
  },
  leave: function(ctx){
    $('.mainmenu',ctx.el).off('click')
    inputs.unbind('space')
  }
}

exports.Browser = {
  enter: function(ctx){
    var btn = $('.button',ctx.el).on('click', function(){
    })
  },
  leave: function(ctx){
    $('.button',ctx.el).off('click')
  }
}

exports.Lonely = {
  enter: function(ctx){
    var btn = $('.button',ctx.el).on('click', function(){
    })
  },
  leave: function(ctx){
    $('.button',ctx.el).off('click')
  }
}


});
require.register("slam/lib/states/setup.js", function(exports, require, module){
/* global _gaq: true, Stats: true */

var debug = require('debug')('states:setup')
  , keys = require('mousetrap')
  , Game = require('../game')
  , Renderer = require('../renderer')
  , Renderer2D = require('../renderer-2d')
  , Network = require('../network')
  , settings = require('../settings')
  , localization = require('../localization')
  , see = require('../support/see')
  , info = require('../support/info')
  , selectRange = require('../support/select-text')
  , cssEvent = require('css-emitter')
  , inputs = require('../inputs')
  , tracking = require('../tracking')
  , actions = require('../actions')
  , langCodes = require('../support/language-codes')
  , cookie = require('cookie')
  , sound = require('../sound')
  , $ = require('jquery')
  , dmaf = require('../dmaf.min');


var Setup = exports;


Setup.enter = function(ctx){
  ctx.query.dev = ctx.query.dev ? true : false;

  // set before 3d is created
  if( ctx.query.quality ){

    if( ctx.query.quality === settings.QUALITY_BEST || ctx.query.quality === settings.QUALITY_LOW || ctx.query.quality === settings.QUALITY_HIGH || ctx.query.quality === settings.QUALITY_MOBILE) {
      settings.data.quality = ctx.query.quality;
    }

    if(settings.data.quality == settings.QUALITY_LOW || window.devicePixelRatio > 1){
      settings.data.antialias = false;
    }

    if(ctx.query.quality === settings.QUALITY_BEST) {
      settings.data.antialias = true;
    }

    if(ctx.query.quality === settings.QUALITY_MOBILE) {
      settings.data.cameraOverlay = false;
    }
  }

  ctx.renderer = new Renderer()
  ctx.game = new Game('game',ctx.renderer);

  if( ctx.query.renderer == '2d' ){
    ctx.renderer.set(new Renderer2D(document.getElementById('canv-2d')))
  }

  // start game paused
  if( ctx.query.paused ){
    console.warn('started game in paused mode. step forward with ".".')
    ctx.game.pause();

    // manually update
    keys.bind('.',function(){
      ctx.game.update();
      ctx.game.emit('render',ctx.game.world,0)
    })
  }

  // wrap loop with stats js
  if( typeof Stats == 'function' && ctx.query.dev ){
    var stats = new Stats();
    $(stats.domElement).css({
      'letter-spacing':'normal',
      'position': 'absolute',
      'z-index': 999
    }).insertBefore('#benchmarks');
    ctx.game.on('enter frame',function(){stats.begin()})
    ctx.game.on('leave frame',function(){stats.end()})
  }

  // check for touch
  ctx.touch = 'ontouchstart' in window || navigator.msMaxTouchPoints;
  if( ctx.touch ){
    $('body').addClass('touch');
    if( !ctx.mobile ){
      settings.data.mouseSensitivity = 0.7/10;
    }
  }

  // optionally disable sounds entirely
  ctx.silent = ctx.silent || ctx.query.silent;
  if( !ctx.silent ) {
    ctx.silent = !(window.webkitAudioContext || window.AudioContext);
  }

  // no need to show sound button when silent
  ctx.silent && $('.sound').hide();
  sound(cookie('sound'),true); // true = prevent GA tracking first time

  // enable dmaf logs
  dmaf.log = ctx.query.dmaf;

  stateHack();
  socialPopup();
  trackExternalLinks();

  // networking
  setupNetwork(ctx);

  // key bindings
  setupBindings(ctx);

  // init localization
  localize(ctx.query.lang || ctx.acceptLanguage)

  // toggle debug info
  //info(ctx,ctx.dev || ctx.query.dev)
  info(ctx, ctx.query.dev)
  $('#debug-info').toggle(ctx.query.dev)
  //$('#debug-info').toggle(ctx.dev || ctx.query.dev)
}

Setup.leave = function(){
  throw new Error('this should never happen...')
}

function trackExternalLinks(){
  $('#footer [target=_blank]').on('click', function(){
    _gaq.push(['_trackEvent', 'outbound links', $(this).attr('href')]);
  })
  $('header').addClass('delay');
}

function localize(acceptLanguage){
  localization.parse(acceptLanguage);
  localization.load(function(){
    // console.log('loaded languages',localization.availableLanguages)

    // hide the language selector when only english
    if( localization.availableLanguages.length < 2 ){
      $('#localizationSwitch').closest('li').hide();

    // toggle between default language and other language
    } else {
      var next = localization.nextLanguage(true);
      var lang = langCodes.name(next)
      $('#localizationSwitch').html(lang).click(function(e){
        e.preventDefault();
        var lang = langCodes.name(localization.currentLanguage);
        $('#localizationSwitch').html(lang)
        localization.nextLanguage();
        _gaq.push(['_trackEvent', 'localization','switch', localization.currentLanguage]);
      })
    }
  })
}

function stateHack(){
  $('.state.inactive').hide().css('visibility', 'visible')
  //Hack to putting out the state-layers after transitions to prevent recalculation
  $('.state .animate').add($('.state.animate')).each(function(){
    cssEvent(this).on('end',afterTransition)
  })
  function afterTransition(evt){
    var stateElem = $(evt.target).hasClass('state') ? $(evt.target) : $(evt.target).closest('.state');
    if( !stateElem.hasClass('active') ){
      stateElem.hide();
    }
  }
}

function socialPopup(){

  $('.social a').on('mouseover', function(){
    dmaf.tell('share_over');
  })

  $('.social a').on('click', function(){
    dmaf.tell('share_click');
    var href = $(this).attr('href');
    _gaq.push(['_trackEvent', 'share', href]);
    window.open(href, 'Cube Slam', 'toolbar=0,status=0,width=626,height=480')
    return false;
  })
}

function setupNetwork(ctx){
  ctx.network = new Network(ctx)

  // skipping network when mobile
  if( ctx.mobile ){
    return;
  }

  // show error when network
  // is not available.
  if( !ctx.network.available ){
    return;
  }

  // update debug info
  ctx.game.on('post update',function(){ info(ctx) })

  see.on('enter',function(ctx,state){
    ctx.network.emit('state',ctx.pathname)
  })

  // make a sound when a friend connects
  ctx.network.on('connected',function(){
    dmaf.tell('friend_join');
  })

  // update the inputs latency
  ctx.network.on('change latency',function(latency){
    if( latency === null ){
      $('#multiplayer-notification').stop().hide();
      $('#latencyMeter span').closest('li').addClass('inactive')
      return
    }

    var quality = latency > 150 ? 'bad'
                : latency > 50 ? 'ok'
                : 'good';

    $('#latencyMeter span').text(latency).removeClass('ok good bad').addClass(quality)
      .closest('li').removeClass('inactive')

    if(quality != 'good') {
      $('#multiplayer-notification').stop().hide();
      var notification = $('#latency-notification:not(.inactive)').addClass('active');
      if(notification.length > 0){
        //_gaq.push(['_trackEvent', '2p', 'latency',undefined,parseInt(latency,10)]);
        notification.addClass('inactive').fadeOut(0)
          .fadeIn(200).delay(12000).fadeOut(200);
      }
    }

    //store and calculate average in end of round
    tracking.latency.push( latency );
  })

  // add remote camera
  ctx.network.on('addstream',function(e){
    var remoteVideo = document.getElementById('remoteInput');
    remoteVideo.src = webkitURL.createObjectURL(e.stream);
    ctx.renderer.triggerEvent('remoteVideoAvailable', {visible:true});
  })
  ctx.network.on('removestream',function(e){
    ctx.renderer.triggerEvent('remoteVideoAvailable', {visible:false});
    document.getElementById('remoteInput').src = '';
  })
  ctx.network.on('full', function(){
    $('body').addClass('error room-full')
    //ctx.network.close()
    see('/error/fullroom');

  })

  ctx.network.on('timeout',function(){
    console.warn('connection timed out')

    _gaq.push(['_trackEvent', 'error', 'connection timed out']);

    // abort unless loading
    if( ctx.pathname != '/loading' ){
      see.abort();
    }
    see('/error/connection');
  })

  ctx.network.on('error', function(e){
    console.error(e.stack)
    console.log(info(ctx))

    _gaq.push(['_trackEvent', 'error', e.message]);
    ctx.network.close()

    // abort unless loading
    if( ctx.pathname != '/loading' ){
      see.abort();
    }
    see('/error/connection');
  })

  ctx.network.on('connected',function(){
    if( ctx.pathname != '/loading' ){
      see.abort()
    }

    dmaf.tell('microphone_on');
    sound('off', true, true)
    //show and hide notification flag
    $('#multiplayer-notification').fadeOut(0)
      .fadeIn(200).delay(8000).fadeOut(200);

    if(this.winner){
      see('/friend/arrived');
    } else {
      see('/friend/waiting');
    }
  })
  ctx.network.on('disconnected', function(){
    if( ctx.pathname != '/loading' ){
      see.abort()
    }
    dmaf.tell('microphone_off');
    sound(cookie('sound'))
    see('/friend/left')
    // make sure we reactivate the webcam
    // ctx.webcam = false;
  })

  if( ctx.room !== 'offline' ){
    ctx.network.setupRemote({
      dataChannels: 'game',
      bufferCandidates: ctx.query.buffer || ctx.dev,
      signal: ctx.query.signal,

      // options for WebSocketSignal
      url: 'ws://nj.publicclass.co:8090/'+ctx.room,

      // options for AppChannelSignal
      room: ctx.room,

      // request TURN credentials
      turnConfigURL: 'https://computeengineondemand.appspot.com/turn?username=apa&key=1329412323'
    })
  }
}

function setupBindings(ctx){
  // input bindings
  keys.bind('o',function(){
    $('#settingsGUIContainer,#debug-info').toggle();
    info(ctx,$('#debug-info').is(':visible'))
  })
  keys.bind('p',function(){ actions.createPuckCenter(ctx.game.world) })
  keys.bind('e',function(){ ctx.renderer.triggerEvent('explode') })
  keys.bind('h',function(){ ctx.renderer.triggerEvent('heal') })
  keys.bind('m',function(){
    settings.data.debugMirror = !settings.data.debugMirror
    ctx.renderer.triggerEvent('mirrorEffect',{active:settings.data.debugMirror})
  })

  //camera
  for (var i = 1; i < 6; i++) {
    keys.bind(String(i),function(index){
      settings.data.cameraType = index-1;
      settings.emit('cameraTypeChanged')
    }.bind(null,i))
  }
  keys.bind('c',function(){
    ctx.renderer.triggerEvent('trace-camera')
  })

  var r2d = new Renderer2D(document.getElementById('canv-2d'))
    , rXd;
  keys.bind('0',function(){
    // toggle between the 2d renderer and the current one
    if( ctx.renderer.impl !== r2d ){
      rXd = ctx.renderer.impl;
      ctx.renderer.set(r2d)
      $(rXd.canvas || rXd.element).hide();
      $(r2d.canvas).show()
    } else if( rXd ){
      ctx.renderer.set(rXd);
      $(r2d.canvas).hide();
      $(rXd.canvas || rXd.element).show();
    }
  })
}

});
require.register("slam/lib/states/mobile.js", function(exports, require, module){
var debug = require('debug')('mobile')
  , settings = require('../settings')
  , keys = require('mousetrap')
  , see = require('../support/see')
  , mouse = require('../support/mouse')
  , localization = require('../localization')
  , $ = require('jquery');

var Mobile = exports;

Mobile.enter = function(ctx){
  if( ctx.query.quality != 'mobile' && navigator.userAgent.toLowerCase().indexOf('android') > -1 ) {
    ctx.query.mobile = true;
  }
  if( !ctx.query.mobile && hasWebGL() ){
    return;
  }
  ctx.mobile = true;
  ctx.query.renderer = ctx.query.renderer || 'css';
  $('html').addClass('mobile')

  var img = $('.mobile section.main-menu img').data($(document).width() > 800 ? 'src-tablet' : 'src-mobile');
  $('header.main-menu').css({backgroundImage: 'url('+img+')'});

  //activate fallback page if no csstransform support
  //if(!has3d() || !Modernizr.csstransforms3d ) {

  if(!has3d()) {
    $('header.main-menu').removeClass('inactive').addClass('active');
    $('header.main-menu .nav').hide();
    $('.loading').hide();
    see.abort();
    localize(ctx.acceptLanguage);
    see('/error/browser');
    return;
  }

  if( $('body').hasClass('room-lonely') ) {
    see.abort();
    $('header.main-menu').addClass('active');
    $('header.main-menu .nav').hide();
    $('#footer').hide();
    $('.loading').remove();
    localize(ctx.acceptLanguage)
    see('/error/lonelyroom');
    return;
  }


  //iPhone hack to get rid of omnibar.
  // we need at least 64px extra height and scrollto 0 to remove the bar.
  var iphoneOmnibar = 64;
  // $('#footer').css('paddingBottom', iphoneOmnibar);
  window.scrollTo(0,1)
  see.on('enter',function(ctx,state){
    if(ctx.pathname.indexOf('/game/')>-1) {
      // window.scrollTo(0,1);
    }
  })
  // window.onorientationchange = function() {
  //   window.scrollTo(0,0)
  // }

  //hack to get :active psuedo classes to work on ios.
  $('button').on('touchstart', function(){$(this).addClass('down')});
  $('button').on('touchend', function(){$(this).removeClass('down')});

  $('#gamepad button:first')
    .on('mousedown touchstart', function(){ keys.trigger('left,a','keydown'); $(this).addClass('down'); return false; })
    .on('mouseup touchend', function(){ keys.trigger('left,a','keyup'); $(this).removeClass('down'); return false; })
  $('#gamepad button:last')
    .on('mousedown touchstart', function(){ keys.trigger('right,d','keydown'); $(this).addClass('down'); return false; })
    .on('mouseup touchend', function(){ keys.trigger('right,d','keyup'); $(this).removeClass('down'); return false; })

  $('footer .technology a').on('click', function(e){
    if(ctx.pathname.indexOf('game') < 0){
      see('/cssinfo');
    } else {
      if( ctx.pathname.indexOf('over') > -1 ){
        see('/game/over/cssinfo');
      } else {
        see('/game/cssinfo');
      }
    }
    e.stopImmediatePropagation();
    return false;
  })
  $('#mobile-menu button.info').on('click', function(){
    see('/game/cssinfo');
    return false;
  })

  mouse.once('move',function(){
    $('#canv-css .swipe-instruction').addClass('hide');
  })

  $('#canv-css .background')
    .css('backgroundImage', 'url('+$('#canv-css .background img.bg').data( $(document).width() > 800 ? 'src-tablet' : 'src-mobile')+')');

  $('.state.friend-invite').remove();
  $('section.state.game-pause').remove();
  $('.state.webcam-activate').remove();
  $('.state.webcam-information').remove();
  $('.state.webcam-waiting').remove();
  $('.state.webcam-arrived').remove();
  $('.state.game-wait').remove();
  $('.state.friend-accept').remove();
  $('.state.friend-left').remove();
  $('#extras').remove();

  var c = document.getElementById('canv-css').style;
  $(window).on('resize', function(){
    var rect = {w: 560, h: 500}
      , dw = $(window).width()
      , dh = $(window).height()
      , w = dw / rect.w
      , h = dh / rect.h
      , scale = (w > h) ? h : w;
    c.transform = c.webkitTransform = c.msTransform = c.MozTransform = c.OTransform = 'scale('+scale+') translateZ(0)';
    if( scale < 1.8){
      settings.data.mouseSensitivity = (1.8-scale)/10;
    }
  }).resize();
}

Mobile.leave = function(ctx, next){
  // Nothing to do...
}

exports.Info = {
  enter: function(ctx){
    ctx.el.scrollTop(0,0);
    if(ctx.pathname.indexOf('game') > -1) {
      if(ctx.pathname.indexOf('over') > -1) {
        $('button',ctx.el).on('click',function(){ see('/game/over') })
      } else {
        $('button',ctx.el).on('click',function(){ see('/game/pause') })
      }
    } else {
      $('button',ctx.el).on('click',function(){ see('/main-menu') })
    }
  },
  leave: function(ctx){
    $('button',ctx.el).off('click');
  },
  cleanup: function(ctx){
  }
}

function hasWebGL(){
  if(window.WebGLRenderingContext){
    try {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if( context ){
        return true;
      } else {
        console.warn('webgl was not available. you might want to visit http://get.webgl.org/troubleshooting/')
      }
    } catch(e){
      console.error(e)
    }
  }
  return false;
}

function has3d() {
  var el = document.createElement('p'),
    has,
    transforms = {
      'webkitTransform':'-webkit-transform',
      'OTransform':'-o-transform',
      'msTransform':'-ms-transform',
      'MozTransform':'-moz-transform',
      'transform':'transform'
    };

  // Add it to the body to get the computed style.
  document.body.insertBefore(el, null);

  for (var t in transforms) {
    if (el.style[t] !== undefined) {
      el.style[t] = 'translate3d(1px,1px,1px)';
      has = window.getComputedStyle(el).getPropertyValue(transforms[t]);
    }
  }

  document.body.removeChild(el);


  //Check for preserve3d
  var element = document.createElement('p'),
      html = document.getElementsByTagName('HTML')[0],
      body = document.getElementsByTagName('BODY')[0],
      properties = {
        'webkitTransformStyle':'-webkit-transform-style',
        'MozTransformStyle':'-moz-transform-style',
        'msTransformStyle':'-ms-transform-style',
        'transformStyle':'transform-style'
      };

    body.insertBefore(element, null);

    for (var i in properties) {
      if (element.style[i] !== undefined) {
        element.style[i] = 'preserve-3d';
      }
    }

    var st = window.getComputedStyle(element, null),
        transform = st.getPropertyValue('-webkit-transform-style') ||
                    st.getPropertyValue('-moz-transform-style') ||
                    st.getPropertyValue('-ms-transform-style') ||
                    st.getPropertyValue('transform-style');

    if(transform!=='preserve-3d'){
      has = undefined;
    }
    document.body.removeChild(element);

  return (has !== undefined && has.length > 0 && has !== 'none');
}

function localize(acceptLanguage){
  localization.parse(acceptLanguage);
  localization.load()
}
});
require.register("slam/lib/states/loading.js", function(exports, require, module){
/* global _gaq: true */

var $ = require('jquery')
  , Preloader = require('preloader')
  , see = require('../support/see')
  , dmaf = require('../dmaf.min');

var Loading = exports;

Loading.enter = function(ctx){
  this.loader = new Preloader();

  // when network is not available but there's already
  // someone else in the room we show  "Install chrome to play 2p"
  if( !ctx.network.available && $('body').hasClass('room-lonely') ){
    see('/error/datachannels');

  // otherwise simply go to the main menu.
  } else {
    see('/main-menu')
  }
}

Loading.leave = function(ctx, next){
  var el = ctx.el;

  if(!ctx.silent){
    this.loader.push(function(done){
      dmaf.addEventListener('dmaf_ready', function(){ done() });
      dmaf.addEventListener('dmaf_fail', function(){
        done();
        _gaq.push(['_trackEvent', 'sound', 'failed']);
      });
      dmaf.init('/dmaf__assets/');
    })
  }

  //add workaround for scores not showing when transforms not supported fully
  if( !Modernizr.csstransforms3d ) {
    $("#scores").addClass("no-transforms");
  }

  if( ctx.query.renderer == 'css' ){
    // load CSS renderer
    _gaq.push(['_trackEvent', 'renderer', 'css']);

    this.loader.push(function(done){
      console.time('load css')
      loadScript('/javascript/renderer-css'+ctx.ext,function(err){
        console.timeEnd('load css')
        if( err ){return done(err)}
        var RendererCSS = require('../renderer-css')
        ctx.renderer.set(new RendererCSS(document.getElementById('canv-css')))
        done()
      })
    })

    this.loader.add('/images/mobile/puck.png');
    this.loader.add('/images/mobile/paddle-p1.png');
    this.loader.add('/images/mobile/paddle-p2.png');
    this.loader.add('/images/mobile/shields.png');
    this.loader.add('/images/mobile/bear.png');
    this.loader.add('/images/mobile/extra-icons.png');
    this.loader.add('/images/mobile/effects.png');
    this.loader.add('/images/mobile/obstacles.png');
    this.loader.add(findSrc('.mobile section.main-menu img'));
    this.loader.add(findSrc('#canv-css .background img.bg'));

    $('#canv-css .background').css('backgroundImage', 'url('+findSrc('#canv-css .background img.bg')+')');
    $('header.main-menu').css('backgroundImage', 'url('+findSrc('.mobile section.main-menu img')+')');


  } else if( ctx.query.renderer != 'none' ){
    // load 3D renderer
    _gaq.push(['_trackEvent', 'renderer', '3d']);



    this.loader.push(function(done){
      console.time('load 3d')
      var pending = 3;
      loadScript('/javascript/libs/tween-max.min.js',check)
      loadScript('/javascript/libs/three'+ctx.ext,check)
      loadScript('/javascript/renderer-3d'+ctx.ext,check)
      function check(err){
        if( err ){return done(err)}
        --pending || init()
      }
      function init(){
        console.timeEnd('load 3d')
        console.time('init 3d')
        console.groupCollapsed('init 3d')

        var Renderer3D = require('../renderer-3d');



        var renderer = new Renderer3D(document.getElementById('canv-3d'))
        renderer.on('initDone',function(){
          console.groupEnd('init 3d')
          console.timeEnd('init 3d')
          done()
        })
        ctx.renderer.set(renderer)
      }
    })
  }

  this.loader.end(function(err){
    console.timeEnd('load')
    console.groupEnd('load')

    // start the game loop
    ctx.game.run()
    el.remove()

    next()
  })
}

function findSrc(el){
  if( $(document).width() > 800 ){
    return $(el).data('src-tablet');
  } else {
    return $(el).data('src-mobile');
  }
}

function loadScript(src,fn){
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.onerror = function(e){fn(e)};
  s.onload = function(){fn()};
  s.src = src;
  var f = document.getElementsByTagName('script')[0];
  f.parentNode.insertBefore(s, f);
}
});
require.register("slam/lib/states/main-menu.js", function(exports, require, module){
/* global _gaq: true */

var inputs = require('mousetrap')
  , see = require('../support/see')
  , cookie = require('cookie')
  , settings = require('../settings')
  , settingsGUI = require('../settings-gui')
  , actions = require('../actions')
  , sound = require('../sound')
  , $ = require('jquery')
  , dmaf = require('../dmaf.min');

var MainMenu = exports;

MainMenu.enter = function(ctx){
  dmaf.tell('splash_screen')
  ctx.renderer.changeView('main-menu');

  document.addEventListener( 'visibilitychange', function ( event ) {
    document.hidden?dmaf.tell('inactive'):dmaf.tell('active');
  }, false );

  // webkit
  document.addEventListener( 'webkitvisibilitychange', function ( event ) {
    document.webkitHidden?dmaf.tell('inactive'):dmaf.tell('active');
  }, false );

  $('#about').find('li').off('mousedown').on('mousedown', function(evt){
    dmaf.tell('text_button_down', {className:evt.currentTarget.className})
  }).off('mouseover').on('mouseover', function(evt){
    dmaf.tell('text_button_over', {className:evt.currentTarget.className})
  })

  $('#socials').find('li').off('mousedown').on('mousedown', function(evt){
    dmaf.tell('small_button_down', {className:evt.currentTarget.className})
  }).off('mouseover').on('mouseover', function(evt){
    dmaf.tell('small_button_over', {className:evt.currentTarget.className})
  })

  $('button').off('mousedown').on('mousedown', function(evt){
    dmaf.tell('button_down', {className:evt.currentTarget.className})
  }).off('mouseover').on('mouseover', function(evt){
    dmaf.tell('button_over',{className:evt.currentTarget.className})
  })


  $('header.main-menu .links a').off('click').on('click', function(){
    _gaq.push(['_trackEvent', 'outbound links', $(this).attr('href')]);
  })

  // check sound setting (stored in a cookie)
  $('.sound-switch').click(function(){sound();return false;})

  var friend = $('.play-friend',ctx.el)
    , comp = $('.start',ctx.el);
  friend.on('click',function(){
    if($('body').hasClass('room-full')){
      return see('/error/fullroom');
    }
    if(!ctx.network.available){
      return see('/error/datachannels');
    }
    switch(ctx.network.pathname){
      case '/friend/arrived':
        return see('/friend/accept');
      case '/friend/invite':
      case '/friend/waiting':
        return see('/friend/arrived');
      default:
        return see('/friend/invite');
    }
  })
  //.prop('disabled',!ctx.network.available)

  this.waitingFor = function(pathname){
    if( ctx.network.pathname == '/friend/invite' ){
      see('/friend/waiting')
    }
  }
  ctx.network.on('change pathname',this.waitingFor)
  if( ctx.network.pathname == '/friend/invite' ){
    see('/friend/waiting')
  }

  comp.on('click', function(){
    see('/game/instructions')
  });

  inputs.bind('space',function(){
    comp.click()
  })

  if( ctx.query.extras ) {
    var extras = ctx.query.extras.split(',');
    var len = extras.length;
    if( len ) {
      settings.data.overrideSpawnExtras = true;
      for( var i=0; i<len; i++) {
        if( settings.data.spawnExtras.hasOwnProperty(extras[i]) ){
          settings.data.spawnExtras[extras[i]] = true;
        }
      }
    }
  }

  if( ctx.query.dev ) {
    _gaq.push(['_trackEvent', 'settings', 'dev enabled']);
    settingsGUI.createGenericUI( {isMobile:ctx.mobile, isNetwork: ctx.network.available})
  }

  // auto route
  if(ctx.query.see) {
    if( ctx.query.noleave ) {
      see.abort();
    }
    see(ctx.query.see);
  } else if( ctx.query.play ){
    see('/game/instructions')
  }

}

MainMenu.leave = function(ctx){
  //removing delay added from setup for intro animation
  $(ctx.el).removeClass('delay')

  ctx.network.off('change pathname',this.waitingFor);
  $('.play-friend',ctx.el).off('click')
  $('.start',ctx.el).off('click')
  inputs.unbind('space')
}
});
require.register("slam/lib/states/prompt.js", function(exports, require, module){
var debug = require('debug')('states:prompt')
  , see = require('../support/see')
  , $ = require('jquery')
  , dmaf = require('../dmaf.min');

var BEAT = 952.38;

var Prompt = exports;

Prompt.enter = function(ctx){

}
Prompt.leave = function(ctx){
}

exports.Level = {
  enter: function(ctx){
    dmaf.tell('countdown_init')
    see('/game/prompt/round')
  },
  leave: function(ctx,next){
    this.timeout = setTimeout(next,BEAT)
  },
  cleanup: function(ctx){
    clearTimeout(this.timeout)
  }
}

exports.Round = {
  enter: function(ctx){
    var players = ctx.sync ? ctx.sync.world.players : ctx.game.world.players;
    var round = players.a.score + players.b.score + 1;
    $('#round-prompt span').html(round);
    see('/game/prompt/start')
  },
  leave: function(ctx,next){
    this.timeout = setTimeout(next,BEAT)
  },
  cleanup: function(ctx){
    clearTimeout(this.timeout)
  }
}

exports.Start = {
  enter: function(ctx){
    var path = ctx.afterStart;
    ctx.afterStart = null;

    $(ctx.el).closest('section').addClass('alternate')
    see(path||'/game/start')
  },
  leave: function(ctx,next){
    $(ctx.el).closest('section').removeClass('alternate')
    this.timeout = setTimeout(next,BEAT)
  },
  cleanup: function(ctx){
    clearTimeout(this.timeout)
  }
}

exports.Over = {
  enter: function(ctx){
    dmaf.tell('gameover_screen');
    if(!ctx.multiplayer){
      $('.win', $(ctx.el)).hide();
      $('.loose', $(ctx.el)).hide();
      $('.over', $(ctx.el)).show()
    }
    see('/game/over');
  },
  leave: function(ctx,next){
    this.timeout = setTimeout(next,BEAT*3)
  },
  cleanup: function(ctx){
    clearTimeout(this.timeout)
  }
}
});
require.register("slam/lib/states/game.js", function(exports, require, module){
/* global _gaq:true */
var debug = require('debug')('states:game')
  , settings = require('../settings')
  , tracking = require('../tracking')
  , see = require('../support/see')
  , now = require('now')
  , mouse = require('../support/mouse')
  , keys = require('mousetrap')
  , World = require('../world')
  , inputs = require('../inputs')
  , icons = require('../extra-icons')
  , actions = require('../actions')
  , puppeteer = require('../puppeteer')
  , Themes = require('../themes')
  , $ = require('jquery')
  , dmaf = require('../dmaf.min');

exports.Setup = {
  enter: function(ctx){
    debug('setup enter')
    $('#scores .level').show();
    $('#scores li').addClass('active');
    $('#extras').show();

    // set the active player in the renderer
    ctx.renderer.activePlayer(!ctx.multiplayer || ctx.network.winner ? 0 : 1, false, ctx.multiplayer)

    if( ctx.query.god ) {
      settings.data.godMode = true;
    }

    if( ctx.query.momentum == 'off' ){
      settings.data.paddleMomentum = false;
    }

    if( !isNaN(ctx.query.framerate) ){
      var framerate = parseInt(ctx.query.framerate,10);
      settings.data.framerate = framerate;
      settings.data.timestep = 1000/framerate;
    }

    if( !isNaN(ctx.query.speed) ){
      var speed = parseInt(ctx.query.speed,10);
      settings.data.unitSpeed = speed;
    }

    // set the correct levels namespace
    if( ctx.query.ns ){
      puppeteer.namespace(ctx.query.ns);
    } else if( ctx.mobile ){
      puppeteer.namespace('mobile');
    } else if( ctx.multiplayer ){
      puppeteer.namespace('multi');
    } else {
      puppeteer.namespace('single');
    }

    setupLevel(ctx,ctx.game)
    setupLevel(ctx,ctx.sync)
    updateLevel(ctx,ctx.game.world.level.index)

    $('#scores').fadeOut(0);
  },

  leave: function(ctx){
    debug('setup leave')

    inputs.reset()

    // reset game to INIT
    ctx.game.off('pre update',puppeteer.update)
    ctx.game.reset();
    ctx.game.world.players.a.reset(true, true);
    ctx.game.world.players.b.reset(true, true);
    ctx.game.world.setState(World.INIT)
    ctx.game.world.level = null;
    ctx.afterStart = null;

    // remove ai when going from single to
    // multiplayer
    ctx.game.ai.setTarget(null);
  }
}


exports.Instructions = {
  enter: function(ctx){
    debug('information enter')

    dmaf.tell('info_screen')

    startGame(ctx.game,ctx.network.winner,ctx.multiplayer,true)
    startGame(ctx.sync,ctx.network.winner,ctx.multiplayer,true)

    ctx.renderer.changeView('play');

    $('#scores').hide()

    $('.game-controls').show();
    $('.info-animation', ctx.el).addClass('hidden').hide();

    var self = this;

    this.play = $('.play',ctx.el).show()
    this.play.one('click',function(){
      $('.game-controls').fadeOut(300);
      $('.info-animation.mobile', ctx.el).parent().hide();
      $('.info-animation.objective', ctx.el).delay(500).removeClass('hidden').hide().fadeIn({duration:0});

      //Hack to easily get past info
      keys.unbind('space');
      keys.bind('space', function(){ infoComplete(ctx) });
      $('.info-animation.objective', ctx.el).parent().one('click',function(){ infoComplete(ctx) })
      clearTimeout(self.gameStartTimeout);
      self.gameStartTimeout = setTimeout(function(){ infoComplete(ctx) }, 5000);
    })
    keys.bind('space', function(){ $('.play',ctx.el).click() });

    if(ctx.mobile){
     /* if(!ctx.touch) {
        this.play.click()
      } else {
        var mob = $('.info-animation.mobile', ctx.el).removeClass('hidden').hide().fadeIn({duration:400}).parent();
        mob.show();
        self.gameStartTimeout = setTimeout(function(){
          mob.click();
        }, 12000);
        mob.one('click',function(){
          clearTimeout(self.gameStartTimeout);
          self.play.click();
        })
      }*/
      this.play.click()
    }

    // autonavigate while testing multiplayer
    if( ctx.query.autonav || ctx.query.play ){
      infoComplete(ctx)
    }

    //debug round
    if( !isNaN(ctx.query.round) ){
      var round = Math.min(4,ctx.query.round);
      ctx.game.world.me.score = Math.floor(ctx.query.round/2)

      while(ctx.game.world.me.score + ctx.game.world.opponent.score < 4 ){
        ctx.game.world.opponent.score += 1;
      }
    }
  },

  leave: function(ctx, next){
    debug('information leave')
    clearTimeout(this.gameStartTimeout);

    dmaf.tell('info_screen_out')

    this.play.off('click');
    keys.unbind('space');
    $('.info-animation', ctx.el).parent().unbind('click')

    $('#scores .singleplayer').toggle(!ctx.multiplayer);
    $('#scores .multiplayer').toggle(!!ctx.multiplayer);

    $(ctx.el).removeClass('active').addClass('inactive')

    this.nextTimeout = setTimeout(next, 1000)
    ctx.game.world.setState(World.STARTING)
  },

  cleanup: function(ctx){
    clearTimeout(this.nextTimeout)
  }
}

exports.Wait = {
  enter: function(ctx){
    this.waiting = waitFor(ctx,'/game/wait','/game/prompt/level')

    // a timeout in case there's been a race condition and the
    // other player has not received the video as desired.
    clearTimeout(this.timeout);
    this.timeout = setTimeout(function(){
      if( ctx.network.winner ){
        console.log('waited for 10s. trying again to send an offer in case the last one was lost.')
        ctx.network.remote.start();
        ctx.network.sync.start();
      }
    },10000)
  },

  leave: function(ctx,next){
    // wait until we're in play view
    // and offset for latency for the one
    // who came last (and thus has no `this.waiting`)
    //
    // one issues with this latency is that it's
    // based on data channel instead of the signalling
    // api so it may not be precise enough
    //
    // TODO add a EMIT(id) message which will be
    //      executed as soon as it arrives instead of
    //      being enqueued. maybe simply inputs.emit(id)
    //      then we can use that in waitFor()
    //
    // console.log('wait latency',ctx.latency)
    var offset = this.waiting !== null ? 100 : 100+(ctx.latency*2 || 0);
    clearTimeout(this.timeout);
    this.timeout = setTimeout(next, offset);
  },

  cleanup: function(ctx){
    clearTimeout(this.timeout);
    this.waiting && ctx.network.off('change pathname',this.waiting)
  }
}

exports.Start = {

  enter: function(ctx){
    // start both games.
    // (game, local, preview)
    startGame(ctx.game,ctx.network.winner,ctx.multiplayer)
    startGame(ctx.sync,ctx.network.winner,ctx.multiplayer)

    // reset everything in the network
    inputs.network.reset(true)

    // restart the level
    puppeteer.goto(ctx.game.world);
    ctx.sync && puppeteer.goto(ctx.sync.world);
    updateLevel(ctx,ctx.game.world.level.index);

    if( ctx.game.world.level.index != tracking.currentLevel ) {
      var levelTime = Date.now() - tracking.levelStartTime;
      var level = ctx.game.world.level.index+1;
      if( level > 1 && tracking.levelStartTime ) {
        _gaq.push(['_trackEvent', getGACategory(ctx), 'level ' + (level-1) + ' completed', undefined,Math.round(levelTime/1000) ]);
      }
      tracking.currentLevel = ctx.game.world.level.index;
      tracking.levelStartTime = Date.now();

      _gaq.push(['_trackEvent', getGACategory(ctx), 'level ' + level + ' started', undefined, level ]);
    }

    // update the ai based on level
    ctx.game.ai.updateBrain(ctx.game.world.level.ai);
    ctx.sync && ctx.sync.ai.updateBrain(ctx.sync.world.level.ai);

    // copy the sync scores to world
    if( ctx.multiplayer ){
      ctx.game.world.players.a.score = ctx.sync.world.players.a.score;
      ctx.game.world.players.b.score = ctx.sync.world.players.b.score;
    }

    // show scores
    updateScores(ctx.sync ? ctx.sync.world : ctx.game.world)

    // singleplayer
    if( !ctx.multiplayer || ctx.query.ai ){
      ctx.game.ai.setTarget(ctx.game.world.opponent.paddle);
    }

    see('/game/play')
  },

  leave: function(ctx){
    ctx.renderer.changeView('play');
  }

}

exports.Play = {
  enter: function(ctx){
    ctx.game.ai.start();
    dmaf.tell('game_screen');
    ctx.renderer.triggerEvent('gameStart');
    $('.game-play').removeClass('active');
    keys.bind(['esc','space'], see.bind('/game/pause'))
    $('button.pause').on('click', see.bind('/game/pause'))
    this.timeout = setTimeout(function(){
      ctx.game.world.setState(World.PLAYING)
      ctx.sync && ctx.sync.world.setState(World.PLAYING)

      if(ctx.query.benchmark){
        ctx.benchmarkStart = now();
        ctx.benchmarkFrames = 0;

        ctx.benchmarkCount = function(){
          ctx.benchmarkFrames++;
        }
        ctx.game.on('enter frame',ctx.benchmarkCount)
      }

    }, 952.38)

    if(ctx.touch) {
      mouse.start(document.getElementById('game'))
    }
  },

  leave: function(ctx){
    keys.unbind(['esc','space'])
    $('button.pause').off('click')
    // send 10 more requests and see if latency has changed
    ctx.multiplayer && ctx.network.winner && ctx.network.sync.update(10)
    ctx.game.world.setState(World.PAUSED)
    ctx.sync && ctx.sync.world.setState(World.PAUSED)
    if(ctx.touch) {
      mouse.stop(document.getElementById('game'))
    }

    if(ctx.query.benchmark){
      ctx.benchmarkEnd = now();
      ctx.benchmarkCount && ctx.game.off('enter frame',ctx.benchmarkCount)

      var ms = ctx.benchmarkEnd - ctx.benchmarkStart;
      var frames = ctx.benchmarkFrames;
      var fps = frames/(ms/1000);

      $('#benchmarks').append('<p>'+ms.toFixed(2)+'ms, '+frames+' frames = '+fps.toFixed(2)+' avg fps</p>')

      _gaq.push(['_trackEvent', getGACategory() +':benchmark', 'time (ms)', undefined ,ms.toFixed(2) ]);
      _gaq.push(['_trackEvent', getGACategory() +':benchmark', 'frames', undefined ,frames ]);
      _gaq.push(['_trackEvent', getGACategory() +':benchmark', 'average round fps', undefined ,fps.toFixed(2) ]);
    }

  },

  cleanup: function(){
    this.unverify && this.unverify();
    clearTimeout(this.timeout)
  }
}


exports.Pause = {
  enter: function(ctx){
    ctx.game.ai.stop();
    dmaf.tell('pause');
    $('.main-menu',ctx.el)
      .toggle(!ctx.multiplayer) // hidden if we already play in multiplayer
      .on('click',see.bind('/main-menu'))

    clearTimeout(this.timeout)
    this.timeout = setTimeout(function(){
      keys.bind('space', see.bind('/game/play'))
      keys.bind('esc', see.bind('/main-menu'))
      $('button.play', ctx.el).on('click',see.bind('/game/play'))
    }, 1000);
  },
  leave: function(ctx){
    clearTimeout(this.timeout);
    keys.unbind('space')
    keys.unbind('esc')
    $('button.play',ctx.el).off('click')
    $('.main-menu',ctx.el).off('click')
    dmaf.tell('unpause')
  }
}

exports.Next = {

  enter: function(ctx){
    var world = ctx.sync ? ctx.sync.world : ctx.game.world;

    ctx.game.ai.stop();

    debug('%s round over',world.frame)

    // reset the input ack
    inputs.network.reset()

    // reset the icons
    icons.clear()

    // console.log('NEEEEXT!\n\n\n\n\n\n\n')

    var frame = world.frame;

    // update the score for the opponent
    // TODO this will fail if hit was on the other world
    var other = (ctx.game.world.players.a.hit !== -1 || world.players.a.hit !== -1) ? world.players.b : world.players.a;
    other.score += 1;

    // hides everything a bit early for know
    ctx.game.reset()
    ctx.renderer.triggerEvent('resetPaddles');

    // round over when someone reaches 3
    var maxBalls = 3; // TODO setting?
    var gameOver = world.players.a.score >= maxBalls || world.players.b.score >= maxBalls;
    var winner = world.players.a.score > world.players.b.score ? world.players.a : world.players.b;

    updateScores(world);

    _gaq.push(['_trackEvent', getGACategory(ctx), (gameOver)?'game over':'round', undefined ,frame ]);

    // multiplayer
    if( ctx.multiplayer ){
      var $promptEl = $('.state.game-prompt-over .prompt');

      $promptEl.children().hide();

      //report latency
      var sum = tracking.latency.reduce(function(a, b) { return a + b });
      var avg = sum / tracking.latency.length;
      debug('Average latency is ' + avg + ' milliseconds');
      _gaq.push(['_trackEvent', '2p', 'round latency average',undefined,parseInt(avg,10)]);
      tracking.latency.length = 0;

      if( winner === world.me ){
        dmaf.tell('user_won_match')
        $promptEl.find('.win').show();
      } else {
        dmaf.tell('user_lost_match')
        $promptEl.find('.loose').show();
      }

      // round over = game over!
      if( gameOver ){
        debug('multiplayer game over')
        winner.wins += 1;

        if( winner === world.me ){
          // TODO use the correct puck position (same as in actions.roundOver())
          ctx.renderer.triggerEvent('explodeOpponent',{point:0.5})
        }

        world.setState(World.GAME_OVER)
        ctx.renderer.triggerEvent('gameOver');
        this.waiting = waitFor(ctx,'/game/next','/game/prompt/over');

      // next round!
      } else {
        debug('multiplayer next round!')
        dmaf.tell('countdown_short')
        world.setState(World.NEXT_ROUND)
        ctx.renderer.triggerEvent('roundOver');
        this.waiting = waitFor(ctx,'/game/next','/game/prompt/round');

      }

    // singleplayer
    } else {
      //  round over + opponent winner = game over!
      if( gameOver && winner === world.opponent ){
        debug('singleplayer game over')
        dmaf.tell('user_lost_match')
        world.setState(World.GAME_OVER)
        ctx.renderer.triggerEvent('gameOver')
        see('/game/prompt/over')

      // round over + me winner = level up!
      } else if( gameOver && winner === world.me ){
        debug('singleplayer level up!')
        dmaf.tell('user_won_match')
        // TODO use the correct puck position (same as in actions.roundOver())
        ctx.renderer.triggerEvent('explodeOpponent',{point:0.5})
        world.setState(World.NEXT_LEVEL)

        clearTimeout(this.nextLevelTimeout)
        this.nextLevelTimeout = setTimeout(function(){

          world.players.a.reset(true);
          world.players.b.reset(true);

          ctx.renderer.triggerEvent('levelUp');

          puppeteer.up(ctx.game.world);
          ctx.sync && puppeteer.up(ctx.sync.world);
          updateLevel(ctx,ctx.game.world.level.index);

          clearTimeout(this.nextLevelTimeout)
          this.nextLevelTimeout = setTimeout(function(){
            see('/game/prompt/level');
          }, (ctx.mobile ? 1500 : 4000))
        }, (ctx.mobile ? 1000 :  4000))

      // next round!
      } else {
        debug('singleplayer next round!')
        if( other !== world.me ){
          dmaf.tell('user_lost_round');
        }
        else {
          dmaf.tell('user_won_round');
        }

        ctx.renderer.triggerEvent('roundOver');
        world.setState(World.NEXT_ROUND)

        clearTimeout(this.nextRoundTimeout)
        this.nextRoundTimeout = setTimeout(function(){

          ctx.renderer.triggerEvent('startCountDown');
          clearTimeout(this.nextRoundTimeout)
          this.nextRoundTimeout = setTimeout(function(){
            dmaf.tell('countdown_short')
            see('/game/prompt/round')
          },952.38)
        },2000);
      }
    }
  },


  leave: function(ctx,next){

    clearTimeout(this.nextLevelTimeout)
    clearTimeout(this.nextRoundTimeout)

    this.waiting && ctx.network.off('change pathname',this.waiting)

    // give some time for the bear to dance etc...
    if( ctx.multiplayer ){
      this.nextTimeout = setTimeout(next,2500)
    } else {
      this.nextTimeout = setTimeout(next,500)
    }
  },

  cleanup: function(ctx){
    clearTimeout(this.nextLevelTimeout)
    clearTimeout(this.nextRoundTimeout)
    clearTimeout(this.nextTimeout);
  }

}


exports.Over = {
  enter: function(ctx){

    dmaf.tell('gameover_sign_in');

    $('#scoreboard-multi').toggle(!!ctx.multiplayer)
    $('#scoreboard-single').toggle(!ctx.multiplayer)
    $('#scores').hide()

    if(!ctx.multiplayer){
      $('#single-levels i').text(ctx.game.world.level.index+1);
    } else {
      $('#me-levels i').text(ctx.sync.world.me.wins);
      $('#opponent-levels i').text(ctx.sync.world.opponent.wins);
    }

    $('.main-menu',ctx.el).on('click',see.bind('/main-menu'));

    function restart(){
      $('.play',ctx.el).off('click');
      keys.unbind('space');

      $('.info-animation', ctx.el).unbind('click')
      _gaq.push(['_trackEvent', getGACategory(ctx), 'restarted level ' + (ctx.game.world.level.index+1) + ', ' + (tracking.replayClicks++) + ' times' ]);

      ctx.renderer.triggerEvent('restart');

      if( ctx.multiplayer ) {
        ctx.renderer.triggerEvent('levelUp');
        puppeteer.up(ctx.game.world);
        puppeteer.up(ctx.sync.world);
        updateLevel(ctx,ctx.game.world.level.index);
      }

      $('#scores').fadeIn(500);

      if(ctx.multiplayer){
        see('/game/wait')

      } else {
        see('/game/prompt/level')

      }
      return false;
    }

    keys.bind('space',restart)
    $('.play',ctx.el).on('click',restart)

    ctx.renderer.changeView('gameOver');
  },

  leave: function(ctx){
    dmaf.tell('gameover_sign_out');

    ctx.game.reset()
    ctx.sync && ctx.sync.reset()
    updateScores(ctx.sync ? ctx.sync.world : ctx.game.world)

    keys.unbind('space')
    $('.main-menu',ctx.el).on('click')
  }
}

function waitFor(ctx,path,then){
  // console.log('  waiting for %s -> %s',path,then)
  var next = null;
  if( ctx.network.pathname === path ){
    see(then)

  } else {
    // console.log('  waiting for pathname change')
    next = function(pathname){
      // console.log('  network pathname change', pathname)
      if( pathname === path ){
        ctx.network.off('change pathname',next)
        see(then)
      }
    }
    ctx.network.on('change pathname',next)
  }
  return next;
}

function setupLevel(ctx,game){
  // ctx.sync is not available in mobile
  // console.error('startGame', game, local, withPuck)
  if( !game ) {return}

  var world = game.world;

  // add an update listener
  game.on('pre update',puppeteer.update)

  // debug shortcut
  if( !isNaN(ctx.query.level) ){
    puppeteer.goto(world,parseInt(ctx.query.level,10)-1);
    console.log('DEBUG LEVEL',ctx.query.level)

  } else {
    puppeteer.goto(world,0)
  }
}

function startGame(game,local,multi,preview){
  // ctx.sync is not available in mobile
  // console.error('startGame', game, local, withPuck)
  if( !game ) {return}

  var world = game.world;

  // easy player access
  world.me = !multi || local ? world.players.a : world.players.b;
  world.opponent = !multi || local ? world.players.b : world.players.a;

  // because I'm too lazy to do this better
  world.multiplayer = multi;

  // reset the game
  game.reset();

  // let the extra icons know which world
  // it should listen too
  // (will be sync when it exists)
  icons.use(world)

  // create paddles
  world.players.a.paddle = actions.createPaddle(world,world.players.a);
  world.players.b.paddle = actions.createPaddle(world,world.players.b);

  if( preview ){
    world.setState(World.PREVIEW)

  } else {
    // create shields
    actions.createShields(world,world.players.a)
    actions.createShields(world,world.players.b)

    // create puck
    actions.createPuckCenter(world)

    world.setState(World.STARTING)
  }
}

function updateScores(world){
  debug('update scores %s %s - %s',world.name,world.players.a.score,world.players.b.score)
  $('#scores li').addClass('active')
  $('#scores .singleplayer .player li').slice(world.me.score).removeClass('active latest-winner');
  $('#scores .singleplayer .opponent li').slice(world.opponent.score).removeClass('active latest-winner');
  $('#scores .multiplayer .player li').slice(world.me.score).removeClass('active latest-winner');
  $('#scores .multiplayer .opponent li').slice(world.opponent.score).removeClass('active latest-winner');
}

function updateLevel(ctx,level){
  $('#level-prompt span')
    .html(level+1)
    .closest('section')
    .toggleClass('start', level===0); // adds start class for transition delay purposes
  $('#level').html(level+1);

  // make some noise
  dmaf.tell('level_'+level);

  // update theme
  Themes.goto(level);
  $('html').addClass('theme-'+Themes.current.name.replace(' ', ''));
}

function infoComplete(ctx){
  $('#scores').fadeIn(500);
  if( ctx.multiplayer ){
    see('/game/wait')
  } else {
    see('/game/prompt/level')
  }
}

function getGACategory(ctx) {
  var str = '';

  if(ctx.mobile) {
    str += 'css:';
  }
  else {
    str += '3d:';

    if(ctx.multiplayer) {
      str += '2p';
    }
    else {
      str += '1p';
    }
  }

  return str;
}



});
require.register("slam/lib/states/game/input.js", function(exports, require, module){
var debug = require('debug')('states:game')
  , settings = require('../../settings')
  , mouse = require('../../support/mouse')
  , keys = require('mousetrap')
  , World = require('../../world')
  , inputs = require('../../inputs');

/*var KEYS_LEFT = ['left','up','a']
  , KEYS_RIGHT = ['right','down','d'];*/
var KEYS_LEFT = ['left','a']
  , KEYS_RIGHT = ['right','d'];

var isLeft = 0
  , isRight = 0;

var ctx;

exports.enter = function(context){
  ctx = context;
  ctx.game.on('pre update',onupdate)
  ctx.game.on('pre update',inputs.process)
  keys.bind(KEYS_LEFT,onleft,'keydown')
  keys.bind(KEYS_LEFT,offleft,'keyup')
  keys.bind(KEYS_RIGHT,onright,'keydown')
  keys.bind(KEYS_RIGHT,offright,'keyup')
  mouse.on('move',onmove.bind(null,ctx.game.world))
}

exports.leave = function(ctx){
  ctx.game.off('pre update',onupdate)
  ctx.game.off('pre update',inputs.process)
  keys.unbind(KEYS_LEFT,onleft,'keydown')
  keys.unbind(KEYS_LEFT,offleft,'keyup')
  keys.unbind(KEYS_RIGHT,onright,'keydown')
  keys.unbind(KEYS_RIGHT,offright,'keyup')
  mouse.off('move')
}

function onupdate(world,timestep){
  switch(world.state){
    case World.PREVIEW:
    case World.PLAYING:
    case World.OVER:
      break;
    default:
      return;
  }
  // if( ctx.query.benchmark ) return;
  var dir = settings.data.invertControls ? -1 : 1
  isLeft  && inputs.record(inputs.types.MOVE,world.me.paddle,eps(-settings.data.keyboardSensitivity*dir));
  isRight && inputs.record(inputs.types.MOVE,world.me.paddle,eps(+settings.data.keyboardSensitivity*dir));
  if(ctx.touch){
    mouse.tick() // will emit 'move' or 'click'
  }
}

function onmove(world,dx,dy,dt){
  // if( ctx.query.benchmark ) return;
  var dir = settings.data.invertControls ? -1 : 1
  inputs.record(inputs.types.MOVE,world.me.paddle,eps(dx * settings.data.mouseSensitivity*dir))
}

function onleft(){ isLeft = 1 }
function onright(){ isRight = 1 }
function offleft(){ isLeft = 0 }
function offright(){ isRight = 0 }
function eps(x){ return Math.round(x*1000)/1000 }

});
require.register("slam/lib/states/game/multiplayer.js", function(exports, require, module){
var debug = require('debug')('states:game:multiplayer')
  , settings = require('../../settings')
  , see = require('../../support/see')
  , keys = require('mousetrap')
  , World = require('../../world')
  , inputs = require('../../inputs')
  , Game = require('../../game')
  , estimateSlowDown = require('../../support/estimate-slow-down')
  , now = require('now')
  , latency = require('latency')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec
  , $ = require('jquery')
  , dmaf = require('../../dmaf.min');

var tell = null
  , lock = false
  , replay = false
  , puckDirection = 0;

var lastSent = now()
  , sent = {}
  , times = []
  , timesIndex = 0;

// a lazy hack because it's used all over this
// file. and this is better than relying on a
// global object to have been defined...
var ctx;

exports.enter = function(context){
  ctx = context;
  if( !ctx.multiplayer ){ return; }

  // create a network game
  ctx.sync = new Game('sync');
  $('#extras').hide();

  if( ctx.query.render == 'sync' ){
    var Renderer2D = require('../../renderer-2d')
    ctx.sync.setRenderer(new Renderer2D(document.getElementById('canv-db')))
  }

  // default to turn momentum off for multiplayer
  settings.data.paddleMomentum = false;

  // invert the controls for the "other" player
  settings.data.invertControls = !ctx.network.winner;

  // lower the framerate and raise the speed
  settings.data.framerate = settings.data.defaultFramerate/2;
  settings.data.timestep = settings.data.defaultTimestep*2;
  settings.data.unitSpeed = settings.data.defaultUnitSpeed*2;

  ctx.game.on('enter frame',flushInputs);
  ctx.game.on('leave frame',forwardSync);
  // ctx.game.on('pre update',lockOpponentPaddle);
  // ctx.game.on('post update',timeShift);

  ctx.sync.on('pre update',puckDirectionSave);
  ctx.sync.on('post update',puckDirectionCheck);

  ctx.network.on('change pathname',pathnameChange)
  ctx.network.on('change latency',onlatency)
  ctx.network.on('message',inputs.network.onmessage)
  ctx.game.world.latency = ctx.latency;

  inputs.network.on('ping',onping)
  inputs.network.on('pong',onpong)
  inputs.network.on('message',onmessage)
  inputs.network.on('ack',onack)
  inputs.network.on('move',onmove)
  // inputs.network.on('hit',hitOrMiss)
  // inputs.network.on('miss',hitOrMiss)

  keys.bind('r',forceReplay)
}

exports.leave = function(ctx){
  // reset the framerate when going from
  // multiplayer to singleplayer
  settings.data.framerate = settings.data.defaultFramerate;
  settings.data.timestep = settings.data.defaultTimestep;
  settings.data.unitSpeed = settings.data.defaultUnitSpeed;

  settings.data.paddleMomentum = true;
  settings.data.invertControls = false;

  ctx.game.off('enter frame',flushInputs);
  ctx.game.off('leave frame',forwardSync);
  ctx.game.off('pre update',lockOpponentPaddle);
  ctx.game.off('post update',timeShift);

  if( ctx.sync ){
    ctx.sync.off('pre update',puckDirectionSave);
    ctx.sync.off('post update',puckDirectionCheck);
    ctx.sync = null;
  }

  ctx.network.off('change pathname',pathnameChange)
  ctx.network.off('change latency',onlatency)
  ctx.network.off('message',inputs.network.onmessage)

  inputs.network.off('ping',onping)
  inputs.network.off('pong',onpong)
  inputs.network.off('message',onmessage)
  inputs.network.off('ack',onack)
  inputs.network.off('move',onmove)
  // inputs.network.off('hit',hitOrMiss)
  // inputs.network.off('miss',hitOrMiss)

  ctx.renderer.triggerEvent('friendLeft');

  keys.unbind('r',forceReplay)
}

// used to measure the time since the last packet
// to send KEEP_ALIVE packets.
function flushInputs(world){
  var sendRate = 1000/settings.data.sendRate;
  var n = now();
  if( n - lastSent > sendRate ){
    if( inputs.network.flush() ){
      lastSent = n;
    } else if( world.state == World.PLAYING && n - lastSent > settings.data.keepAliveInterval ){
      var id = (Math.random()*65535)|0; // 16bit
      sent[id] = now();
      inputs.record(inputs.types.PING,id);
    }
  }
}

function forwardSync(world){
  var state = ctx.sync.world.state
    , frame = ctx.sync.world.frame;

  // silence
  tell = dmaf.tell;
  dmaf.tell = silentDMAF;

  // forward the sync game
  inputs.network.forward(ctx.sync,world.frame,ctx.network.winner)

  // render the sync game
  // (adds a 'hack'-puck which shows it's position in "game")
  if( ctx.query.render == 'sync' ){
    var p = ctx.game.world.pucks.values[0];
    p && ctx.sync.world.pucks.set('hack',p)
    ctx.sync.render()
    p && ctx.sync.world.pucks.del('hack')
  }

  // has a replay been requested?
  if( replay ){
    // console.log('replaying %s -> %s',ctx.sync.world.frame,world.frame)
    var frames = Math.floor(ctx.latency*settings.data.timestep);
    inputs.network.replay(ctx.sync.world,world,frames)
    replay = false;
  }

  // end of silence
  dmaf.tell = tell;
}

// lock the position of the paddle
// data.x should be removed after a replay
// so this should be enough
function lockOpponentPaddle(world){
  if( world.state !== World.PLAYING ){
    return;
  }

  var paddle = world.paddles.get(world.opponent.paddle);
  if( paddle && paddle.data.x ){
    console.log('opponent paddle locked at %s',paddle.data.x)
    paddle.previous[0] = paddle.current[0] = paddle.data.x;
  }
}

function timeShift(world){
  if( world.state !== World.PLAYING ){
    return;
  }

  // slow down the puck if necessary
  var paddle = world.paddles.get(world.opponent.paddle);
  var puck = world.pucks.values[0];
  var spuck = ctx.sync.world.pucks.get(puck.index)
  if( world.frame > 1 && puck && ctx.latency ){

    // max out at 300ms latency to avoid insanely slow pucks
    // (a warning will be shown at this point anyway)
    // var t = 1000/settings.data.sendRate + Math.min(ctx.latency,300);
    // var t = Math.min(ctx.latency,300); // latency should include send rate, right?
    var t = Math.abs( world.frame - ctx.sync.world.frame ) * settings.data.timestep;
    var m = estimateSlowDown(paddle.current[1] - puck.current[1],spuck.velocity[1],t)

    if( m !== null && m !== 1 ){
      // based on the sync puck velocity or we'll have
      // a squared deceleration.
      var l = vec.len(spuck.velocity);
      if( l ){
        vec.norm(puck.velocity,puck.velocity)
        vec.smul(puck.velocity,m*l,puck.velocity);
        vec.sub(puck.current,puck.velocity,puck.previous)
      }
    }
  }
}

function puckDirectionSave(world){
  if( world.state !== World.PLAYING ){
    return;
  }

  // store the pre-update direction to track direction
  // change
  var puck = world.pucks.values[0];
  if( puck ){
    puckDirection = puck.velocity[1] > 0 ? +1 : -1;
    // console.log('setting puck direction',puckDirection)
  }
}

function puckDirectionCheck(world){
  if( world.state !== World.PLAYING ){
    return;
  }

  var puck = world.pucks.values[0];
  if( puck && puckDirection ){
    var prevDirection = puckDirection;
    puckDirection = puck.velocity[1] > 0 ? +1 : -1;
    // console.log('getting puck direction',prevDirection,puckDirection)
    if( prevDirection !== puckDirection ){
      // console.log('puck direction change player: %s v: %s',world.me === world.players.a ? 'a' : 'b', puck.velocity[1])
      if( (world.me === world.players.a && puck.velocity[1] > 0) ||
          (world.me === world.players.b && puck.velocity[1] < 0) ){
        // console.log('replaying because of direction change')
        replay = true;
      }
    }
  }
}

function pathnameChange(pathname){
  switch(pathname){
    case '/game/pause':
      if( ctx.pathname === '/game/play' ){
        see(pathname);
      }
      break;
    case '/game/play':
      if( ctx.pathname === '/game/pause' ){
        see(pathname);
      }
      break;
  }
}

function onmessage(buf){
  // to avoid the buffer growing out of hand
  // when a tab is inactive we pause the game
  // when the buffer is at 50%
  if( buf.length > 128 ){
    see('/game/pause');
  }
  ctx.network.send(buf)
}
function onping(id){
  inputs.record(inputs.types.PONG,id)
}
function onpong(id){
  var p = sent[id];

  // invalid PONG!
  if( !p ){ return; }

  // latency is one-way
  var n = now();
  var d = (n - p)/2;

  // store in a circular array w. 128 elements
  times[timesIndex] = d;
  timesIndex = (timesIndex+1) & 127;

  // wait until we have a bit of times before
  // updating ctx.latency. for better accuracy.
  if( times.length > 16 ){
    ctx.latency = Math.round(latency(times));
    ctx.network.emit('change latency',ctx.latency)
  }
}
function onack(ack){
  // console.log('ack %s world %s diff %s',ack,ctx.game.world.frame,ack-ctx.game.world.frame)
  if( ack - 5 > ctx.game.world.frame ){
    var steps = Math.min(50,ack - ctx.game.world.frame);
    for(var i=0;i<steps;i++){
      ctx.game.update();
    }
  }
}
function onmove(input){
  if( input[1] == ctx.game.world.opponent.paddle ){
    inputs.types.execute(ctx.game.world,input)
  }
}
function onlatency(latency){
  ctx.game.world.latency = latency;
}
function forceReplay(){
  replay = true;
}
function hitOrMiss(x,v,f){
  if( ctx.game.world.state !== World.PLAYING ){
    return;
  }

  // console.log('received hit or miss. opponent paddle will be at x: %s v: %s',x,v,f)
  var paddle = ctx.game.world.paddles.get(ctx.game.world.opponent.paddle);

  // store the velocity on the paddle so it can be used when
  // calculating the momentum instead of the actual velocity
  // which may be 0;
  paddle.data.vx = v;
  paddle.data.x = x;
}

function silentDMAF(id){
  var valid = ~id.indexOf('_screen') ||
              ~id.indexOf('countdown_') ||
              ~id.indexOf('_match') ||
              ~id.indexOf('_round') ||
              ~id.indexOf('level_') ||
              ~id.indexOf('_score');

  if( valid ){
    tell.apply(dmaf,arguments);
  } else if( dmaf.log ){
    console.log('dmaf.tell (silent): %s',id)
  }
}
});
require.register("slam/lib/states/game/verify.js", function(exports, require, module){
var debug = require('debug')('states:game:verify')
  , exclude = require('../../support/exclude')
  , keys = require('mousetrap')
  , World = require('../../world')
  , inputs = require('../../inputs')
  , diff = require('../../support/diff');

var hashes = {}
  , jsons = {}
  , verifyInputs = []
  , interval;

var ctx;

exports.enter = function(context){
  ctx = context;
  if( !ctx.query.verify ){
    return;
  }

  if( ctx.query.verify == 'inputs' ){
    keys.bind('i',sendInputs)
    ctx.network.remote.on('inputs',compareInputs)
    inputs.network.on('dequeue',logInputs)
  } else {
    keys.bind('.',sendHashes)
    ctx.network.remote.on('hashes',compareHashes)
    ctx.network.remote.on('world',compareWorlds)
    ctx.sync.on('post update',logHashCode)
  }

  if( !isNaN(ctx.query.verify) ){
    var ms = +ctx.query.verify;
    console.warn('sending hashes every %sms',ms)
    interval = setInterval(function(){ keys.trigger('.') },ms)
  }
}


exports.leave = function(ctx){
  if( !ctx.query.verify ){
    return;
  }
  clearInterval(interval);
  keys.unbind('.',sendHashes)
  ctx.network.remote.off('inputs',compareInputs)
  ctx.network.remote.off('hashes',compareHashes)
  ctx.network.remote.off('world',compareWorlds)
  ctx.sync && ctx.sync.off('post update',logHashCode)
  inputs.network.off('dequeue',logInputs)
}

function sendHashes(){
  console.log('sending %s hashes!',hashes.length)
  if( !hashes.length ){ return; }
  ctx.network.remote.signal.send({type:'hashes',hashes: hashes})
}

function sendInputs(){
  console.log('sending %s inputs!',verifyInputs.length/2)
  if( !verifyInputs.length ){ return; }
  ctx.network.remote.signal.send({type:'inputs',inputs: verifyInputs})
}

function compareInputs(e){
  console.groupCollapsed('comparing inputs')
  var l = Math.min(verifyInputs.length,e.inputs.length);
  for(var i=0; i<l; i+=2){
    if( !compareInput(i,verifyInputs,e.inputs) ){
      console.error('inputs mismatched!',verifyInputs[i],verifyInputs[i+1],e.inputs[i+1])
      throw new Error('inputs mismatched!')
    }
  }
  console.groupEnd('comparing inputs')
}

function compareInput(i,a,b){
  if( a[i] !== b[i] ){
    console.log('frames mismatched:',a[i],b[i])
    return false;
  }
  i += 1
  if( a[i][0] !== b[i][0] ){
    console.log('types mismatched:',a[i][0],b[i][0])
    return false;
  }
  if( a[i].length !== b[i].length ){
    console.log('input length mismatched:',a[i].length,b[i].length)
    return false;
  }
  for(var j=1; j<a[i].length; j++){
    if( a[i][j] !== b[i][j] ){
      console.log('input arguments mismatched:',a[i],b[i])
      return false;
    }
  }
  return true;
}

function compareHashes(e){
  var frames = [].concat(Object.keys(e.hashes),Object.keys(hashes))
                 .sort(function(a,b){return parseInt(a,10)-parseInt(b,10)});
  console.groupCollapsed('comparing hashes')
  var misMatch = null
    , f = -1; // last frame
  for(var i=0; i<frames.length; i++){
    var frame = frames[i];
    if( f === frame ){ continue; }
    f = frame;
    console.log(' frame: %s local: %s network: %s',frame,hashes[frame],e.hashes[frame]);
    if( hashes[frame] && e.hashes[frame] && hashes[frame] !== e.hashes[frame] ){
      console.log(' hashes does not match (%s vs %s), sending json of world to compare',hashes[frame],e.hashes[frame])
      ctx.network.remote.signal.send({type:'world',frame: frame,world: jsons[frame]})
      misMatch = frame;
      break;
    }
  }
  console.groupEnd('comparing hashes')
  if( misMatch !== null ){
    console.error('hashes did not match at %s',misMatch)
    throw new Error('check diff on other machine plz');
  }
}

function compareWorlds(e){
  var misMatch = false;
  console.group('comparing worlds at frame %s',e.frame)
  if( jsons[e.frame] !== e.world ){
    console.log('NOT THE SAME, trying diff:')
    console.log(diff.createPatch('diff for frame '+e.frame,jsons[e.frame],e.world,'local','remote'))
    console.log('remote',[JSON.parse(e.world)])
    console.log('local',[JSON.parse(jsons[e.frame])])
    misMatch = true;
  }
  console.groupEnd('comparing worlds at frame %s',e.frame)

  if(misMatch){
    throw new Error('check diff plz');
  }
}

// used as JSON replacer to
// find undefined values
function unhide(k,v){
  if( typeof v == 'undefined' ){
    return 'undefined';
  }
  return v;
}

function logHashCode(world){
  // hash and store without me/opponent/name
  hashes[world.frame] = world.code()
  exclude(world,World.EXCLUDED,function(world){
    jsons[world.frame] = JSON.stringify(world,unhide,2)
  })
}

function logInputs(input,frame){
  verifyInputs.push(frame,input);
}
});
require.register("slam/lib/states/webcam.js", function(exports, require, module){
var see = require('../support/see')
  , $ = require('jquery');

var getUserMedia = navigator.getUserMedia
                || navigator.webkitGetUserMedia
                || navigator.mozGetUserMedia
                || navigator.msGetUserMedia;
if( getUserMedia ){
  getUserMedia = getUserMedia.bind(navigator);
}

exports.Activation = {
  enter: function(ctx){
    ctx.renderer.changeView('webcamActivation')
    $('#settingsGUIContainer').css('opacity',0);

    if( ctx.webcam ){
      console.log('already have webcam. skipping getUserMedia.')
      return see('/webcam/waiting');
    }

    var constraints = {
      video: {
        mandatory: {
          maxWidth: 320,
          maxHeight: 240,
          minFrameRate: 10
        }
      },
      audio: !ctx.dev
    }

    getUserMedia(constraints,success,error)

    function success(stream){
      var videoInput = document.getElementById('localInput');
      videoInput.width = 320
      videoInput.height = 240
      videoInput.videoWidth = 320
      videoInput.videoHeight = 240
      videoInput.autoplay = true
      videoInput.src = window.webkitURL ? window.webkitURL.createObjectURL(stream) : stream
      ctx.renderer.triggerEvent('localVideoAvailable');
      ctx.webcam = true;

      ctx.network.remote.addStream(stream)
      see('/webcam/waiting')
    }

    function error(){
      ctx.webcam = false;
      see('/webcam/information');
    }
  },
  leave: function(ctx){
    $('#settingsGUIContainer').css('opacity',1);
  }
}


exports.Information = {
  enter: function(ctx){
    $('#activate-camera').on('click',function(){
      see('/webcam/activate')
    })
    $('.keyboard',ctx.el).on('click',function(){
      see('/game/start')
    })
  },
  leave: function(ctx){
    $('#activate-camera').off('click')
    $('.keyboard',ctx.el).off('click')
  }
}


exports.Waiting = {
  enter: function(ctx){
    function waitFor(){
      return ctx.network.pathname == '/webcam/waiting'
          || ctx.network.pathname.indexOf('/game/') === 0;
    }
    if( waitFor() ){
      see('/game/instructions')
    } else {
      this.pathchange = function(pathname){
        if( waitFor() ){
          see('/game/instructions')
        }
      }
      ctx.network.on('change pathname',this.pathchange)
    }
  },
  leave: function(ctx,next){
    this.pathchange && ctx.network.off('change pathname', this.pathchange)

    // wait until ready before leaving
    if( ctx.network.ready ){
      next()
    } else {
      ctx.network.once('ready',function(){
        next()
      })
    }
  },
  cleanup: function(ctx){
    ctx.network.off('ready')
  }
}


});
require.register("slam/lib/states/friend.js", function(exports, require, module){
var debug = require('debug')('states:game')
  , see = require('../support/see')
  , inputs = require('mousetrap')
  , selectRange = require('../support/select-text')
  , $ = require('jquery')
  , dmaf = require('../dmaf.min');

function mainmenu(){ see('/main-menu') }
function webcam(ctx){ see('/webcam/activate') }

exports.Invite = {
  enter: function(ctx){
    dmaf.tell('friend_screen');
    $('.return-mainmenu',ctx.el).on('click',mainmenu)
    inputs.bind('space',mainmenu)
    $('span.url', ctx.el).text(window.location.href)
    selectRange($('.share-url')[0])
  },
  leave: function(ctx){
    dmaf.tell('friend_screen_out');
    $('.return-mainmenu',ctx.el).off('click')
    inputs.unbind('space')
  }
}


exports.Accept = {
  enter: function(ctx){
    dmaf.tell('friend_accept')
    this.waitingFor = waitFor(ctx, '/friend/accept', webcam)
  },
  leave: function(ctx){
    dmaf.tell('friend_accept_out')
    this.waitingFor && ctx.network.off('change pathname', this.waitingFor)
  }
}


exports.Arrived = {
  enter: function(ctx){
    dmaf.tell('friend_arrived');
    $('.play-friend',ctx.el).on('click',function(){ inputs.trigger('space') })
    inputs.bind('space',function(){ see('/friend/accept') })
    if( ctx.query.autonav ){
      this.timeout = setTimeout(function(){
        inputs.trigger('space')
      },1000)
    }
  },
  leave: function(ctx){
    dmaf.tell('friend_arrived_out');
    $('.play-friend',ctx.el).off('click')
    inputs.unbind('space')
  }
}

exports.Waiting = {
  enter: function(ctx){
    dmaf.tell('friend_waiting')
    $('.play-friend',ctx.el).on('click',function(){ inputs.trigger('space') })
    inputs.bind('space',function(){ see('/friend/accept') })
    // while testing click the button automatically
    if( ctx.query.autonav ){
      this.timeout = setTimeout(function(){
        inputs.trigger('space')
      },1000)
    }
  },
  leave: function(ctx){
    dmaf.tell('friend_waiting_out')
  },
  cleanup: function(ctx){

    // this.waitingFor && ctx.network.off('change pathname', this.waitingFor)
    $('.play-friend',ctx.el).off('click')
    inputs.unbind('space')
    clearTimeout(this.timeout)
  }
}


exports.Left = {
  enter: function(ctx){
    dmaf.tell('friend_left')
    var btn = $('.main-menu',ctx.el).on('click',mainmenu)
    inputs.bind('space',mainmenu)
  },
  leave: function(ctx){
    dmaf.tell('friend_left_out')
    $('.main-menu',ctx.el).off('click')
    inputs.unbind('space')
  }
}

function waitFor(ctx,path,then){
  debug('  waiting for %s -> %s',path,then)
  var next = null;
  if( ctx.network.pathname && ctx.network.pathname.indexOf(path) === 0 ){
    then(ctx)
  } else {
    debug('  waiting for pathname change')
    next = function(pathname){
      debug('  network pathname change', pathname)
      if( pathname.indexOf(path) === 0 ){
        ctx.network.off('change pathname',next)
        then(ctx)
      }
    }
    ctx.network.on('change pathname',next)
  }
  return next;
}
});
require.register("slam/lib/actions/index.js", function(exports, require, module){
var Emitter = require('emitter');

Emitter(exports)

merge(exports,require('./bodies'))
merge(exports,require('./bullet'))
merge(exports,require('./paddle'))
merge(exports,require('./puck'))
merge(exports,require('./game'))
merge(exports,require('./extra'))
merge(exports,require('./obstacle'))
merge(exports,require('./force'))
merge(exports,require('./debug'))
merge(exports,require('./player'))
merge(exports,require('./shields'))

function merge(into,obj){
  for(var k in obj)
    into[k] = obj[k];
}
});
require.register("slam/lib/actions/bodies.js", function(exports, require, module){
var debug = require('debug')('actions:bodies')
  , actions = require('./');

/**
 * Destroys a Body based on index.
 *
 * Used in `world.copyBodies()` as it doesn't know
 * which what type of body it will have to delete.
 *
 * @param  {World} world
 * @param  {Number} index
 */
exports.destroy = function(world,index){
  debug('%s destroy',world.name,index)

  if( world.pucks.has(index) ){
    actions.destroyPuck(world,world.pucks.get(index));

  } else if( world.extras.has(index) ){
    actions.destroyExtra(world,world.extras.get(index));

  } else if( world.obstacles.has(index) ){
    actions.destroyObstacle(world,world.obstacles.get(index));

  } else if( world.forces.has(index) ){
    actions.destroyForce(world,world.forces.get(index));

  } else if( world.bullets.has(index) ){
    actions.destroyBullet(world,world.bullets.get(index));

  } else if( world.paddles.has(index) ){
    actions.destroyPaddle(world,world.paddles.get(index));

  } else if( world.shields.has(index) ){
    actions.destroyShield(world,world.shields.get(index));

  } else {
    console.warn('unknown type of body:',index)
  }
}
});
require.register("slam/lib/actions/bullet.js", function(exports, require, module){
var debug = require('debug')('actions:bullet')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec
  , BodyFlags = require('../sim/body-flags')
  , shapes = require('../sim/shapes')
  , settings = require('../settings')
  , actions = require('../actions')
  , dmaf = require('../dmaf.min');


// id is a generated id (ex 'a1' = player + (last shot id + 1))
// x, y is position it should start at
// v is the speed it should be moving with
exports.createBullet = function(world,paddle){
  debug('%s create',world.name ,paddle)

  var forward = paddle.index === world.players.b.paddle;

  var c = paddle.current
    , s = settings.data.unitSpeed * settings.data.bulletSpeed
    , v = vec.make(0, forward ? -s : s);

  // define a shape of the shot
  var bulletWidth = settings.data.unitSize;
  var bulletHeight = 150;
  var shape = shapes.rect(bulletWidth,bulletHeight);


  // round x to unitSize
  var paddleCenter = c[0] + bulletWidth*0.5 // no this would be the paddle edge?
  var spawnX = Math.floor(paddleCenter/bulletWidth)*bulletWidth-bulletWidth*0.5;

  // create a shot body
  var paddleHeight = paddle.aabb[2] - paddle.aabb[0];
  var spawnY = c[1] + s + (paddleHeight + bulletHeight)*(forward ? 1 : -1);

  var body = world.createBody(shape,spawnX,spawnY, BodyFlags.DYNAMIC | BodyFlags.DESTROY);
  body.id = 'bullet';

  // push it in the right direction (based on `v`)
  vec.add(body.current,v,body.previous)
  vec.free(v)

  // save it for rendering and physics
  world.bullets.set(body.index,body)
  actions.emit('added','bullet',world,body);
}

exports.hitBulletObstacle = function(world, bullet, obstacle){
  debug('%s hit obstacle', world.name, bullet.index, obstacle.index)

  actions.destroyBullet(world,bullet);
}

exports.hitBulletPaddle = function(world, bullet, paddle){
  debug('%s hit paddle', world.name, bullet.index, paddle.index)

  // destroy the bullet
  actions.destroyBullet(world,bullet);

  dmaf.tell( (paddle.index == world.me.paddle?'user':'opponent')+ '_paddle_shrink')

  // shrink paddle to half the size
  actions.resizePaddle(world, paddle.index, 0.5);

  // timeout after 5s and scale back to normal
  world.tick.clearTimeout(paddle.data.resizeTimeout);
  paddle.data.resizeTimeout = world.tick.setTimeout('resizePaddle',5000,paddle.index,1)
}

exports.destroyBullet = function(world, body){
  debug('%s destroy',world.name ,body.index)
  world.bullets.del(body.index)
  world.releaseBody(body)
  actions.emit('removed','bullet',world,body);
}
});
require.register("slam/lib/actions/paddle.js", function(exports, require, module){
var debug = require('debug')('actions:paddle')
  , settings = require('../settings')
  , BodyFlags = require('../sim/body-flags')
  , shapes = require('../sim/shapes')
  , actions = require('../actions')
  , inputs = require('../inputs')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec
  , mat = geom.mat
  , dmaf = require('../dmaf.min');


exports.createPaddle = function(world,player){
  debug('%s create',world.name ,player)
  var aw = settings.data.arenaWidth
    , ah = settings.data.arenaHeight
    , u = settings.data.unitSize
    , w = u*5
    , h = u
    , x = aw/2
    , y = (player === world.players.b ? u : ah-u);

  var flags = BodyFlags.DYNAMIC | BodyFlags.BOUNCE | BodyFlags.STEER;
  // if( world.multiplayer ){
  //   flags = BodyFlags.DYNAMIC | BodyFlags.BOUNCE | BodyFlags.DIRECT;
  // }

  var paddle = world.createBody(shapes.rect(w,h),x,y,flags)
  paddle.id = 'paddle' // for debugging mostly
  paddle.damping = settings.data.paddleDamping;
  paddle.mass = settings.data.paddleMass;
  world.paddles.set(paddle.index,paddle);
  actions.emit('added paddle',world,paddle);
  return paddle.index;
}

exports.hitPuckPaddle = function(world,puck,paddle){

  var player = paddle.index === world.players.a.paddle ? 'a' : 'b';

  // only add if puck hit other paddle in between
  if( world.lastHitPucks[puck.index] !== player ){
    world.puckBounces[puck.index]++;
  }

  if( paddle.data.x ){
    console.log('PUCK HIT PADDLE')
    console.log('does data.x match the current x?',paddle.data.x,paddle.current[0])
  }

  // mark who hit it last
  world.lastHitPucks[puck.index] = player;

  // puck was already fireball
  if( puck.data.fireball === 1){
    // make paddle "dizzy"
    actions.dizzyPaddle(world, paddle.index);
    puck.data.fireball = 2; // turn off

    //reset one frame later to allow visual effect
    world.tick.nextFrame('resetPuckExtra',puck.index,'fireball')
    world.tick.nextFrame('resetPaddleExtra',paddle.index,'fireball')
  }

  // figure out puck speed
  var speed = actions.getPuckSpeed(world,puck)

  // transfer the fireball effect
  if( paddle.data.fireball ){
    speed *= settings.data.fireballSpeedup; // speed up 20%
    puck.data.fireball = 1; // turn on
    paddle.data.fireball = 2; // turn off
    //reset one frame later to allow visual effect
    world.tick.nextFrame('resetPaddleExtra',paddle.index,'fireball')
  }

  // without paddle momentum
  if( !settings.data.paddleMomentum ){
    actions.puckSpeed(world,puck,speed)

  // with paddle momentum
  } else {
    // data.vx is set when a HIT() has been
    // received in multiplayer to prepare the predictive
    // "game". should be reset after use
    var vx = paddle.velocity[0];
    if( paddle.data.vx ){
      paddle.velocity[0] = paddle.data.vx;
    }
    actions.puckSpeedMomentum(world,puck,speed,paddle.velocity)

    // remove/reset
    delete paddle.data.vx;
    paddle.velocity[0] = vx;
  }

  if( paddle.index === world.me.paddle ){
    dmaf.tell('user_paddle_hit');
    if( world.multiplayer && world.name == 'game' ){
      inputs.record(inputs.types.HIT,paddle.current[0],paddle.velocity[0])
    }
  } else if( !world.multiplayer || world.name == 'sync' ){
    actions.emit('opponentPaddleHit'); // used by AI
    dmaf.tell('opponent_paddle_hit');
  }

  actions.emit('renderer','paddleHit',{player: player, velocity: puck.velocity})
  actions.puckBounced(world,puck)
}

/**
 * Resizes the paddle to a set scale.
 *
 * Scale is an "absolute" scale. In other words resizing
 * to 1.25 twice will not make a difference.
 *
 * @param  {World} world
 * @param  {Body} paddle
 * @param  {Number} scale  ex. .5 = 50%, 1.5 = 150%, 1 = 100%
 */
exports.resizePaddle = function(world,paddleIndex,scale){
  // keep what was sent in (store as resized below)
  var size = scale;

  // get paddle
  var paddle = world.paddles.get(paddleIndex);

  // it was previously resized. scale it back first
  // so there'll only be 3 sizes.
  //
  // original size: 50
  // scale 1: 1.5
  // = 50 * 1.5 = 75
  // scale 2: .5
  // = 75 * .5 = 37.5 = FAIL!
  // = 75 * 1 / 1.5 * .5 = 25 = WIN!
  if( paddle.data.resized ){
    size = 1/paddle.data.resized * scale;
  }

  // scale using a transformation matrix
  var c = paddle.current;
  var w = paddle.aabb[1] - paddle.aabb[3];
  var m = mat.make()
  mat.translate(-c[0],0,m)
  mat.scale(size,1,m)
  mat.translate(c[0],0,m)
  poly.transform(paddle.shape,m)
  poly.aabb(paddle.shape,paddle.aabb)
  paddle.radius = poly.radius(paddle.shape,c)
  mat.free(m);

  if( scale !== 1 ){
    paddle.data.resized = scale;
  } else {
    delete paddle.data.resized;
  }
}

exports.movePaddle = function(world,paddleIndex,dx){
  // sometimes the paddles doesn't exist because the
  // input is received after the reset/game over
  if( !world.paddles.has(paddleIndex) )
    return;

  var paddle = world.paddles.get(paddleIndex);

  // p.current[0] += dx;

  // Trying to use acceleration instead. The idea
  // is that updating at a lower degree may give
  // a smoother effect after a replay. Because the
  // acceleration will be added a bunch of times
  // while the position will be updated afterwards.
  paddle.acceleration[0] += dx/settings.data.timestep;
}

exports.paddleShoot = function(world,paddleIndex){
  debug('%s paddle shoot', world.name, paddleIndex)
  var paddle = world.paddles.get(paddleIndex);
  dmaf.tell('laser_fire');
  actions.createBullet(world,paddle);
}

exports.dizzyPaddle = function(world,paddleIndex){
  debug('%s dizzy paddle', world.name, paddleIndex)
  var paddle = world.paddles.get(paddleIndex);
  paddle.data.dizzyTimes = 0;
  world.tick.clearInterval(paddle.data.dizzyInterval)
  paddle.data.dizzyInterval = world.tick.setInterval('dizzyToggleDirection',100,paddleIndex)
  dmaf.tell('paddle_dizzy');
}

exports.dizzyToggleDirection = function(world,paddleIndex){
  var paddle = world.paddles.get(paddleIndex);

  paddle.data.dizzyDirection = paddle.data.dizzyDirection || 1;
  paddle.data.dizzyDirection *= -1;
  actions.movePaddle(world,paddle.index,paddle.data.dizzyDirection*12);

  if( ++paddle.data.dizzyTimes > 15 ){
    world.tick.clearInterval(paddle.data.dizzyInterval)
  }
}

exports.resetPaddleExtra = function(world,paddleIndex,extraType) {
  debug('%s reset paddle extra', world.name, paddleIndex, extraType)
  var paddle = world.paddles.get(paddleIndex);
  if( paddle && paddle.data.hasOwnProperty(extraType)) {
    paddle.data[extraType] = 0;
  }
}

});
require.register("slam/lib/actions/puck.js", function(exports, require, module){
var debug = require('debug')('actions:puck')
  , actions = require('../actions')
  , settings = require('../settings')
  , BodyFlags = require('../sim/body-flags')
  , shapes = require('../sim/shapes')
  , icons = require('../extra-icons')
  , colliding = require('../support/aabb').colliding
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec
  , dmaf = require('../dmaf.min');


exports.createPuckCenter = function(world){
  // add to center of arena
  var x = settings.data.arenaWidth/2
    , y = settings.data.arenaHeight/2
    , mass = 5
    , p = actions.createPuck(world,x,y,mass);

  // always start with 0 "bounces"
  var speed = actions.getPuckSpeed(world,p)
  speed *= settings.data.unitSpeed;

  // start it off with a push
  actions.puckSpeedXY(world, p, 0, speed)
}

exports.createPuck = function(world, x, y, mass, flags){
  debug('%s create %s,%s %s',world.name, x, y, mass, flags)
  var w = settings.data.unitSize
    , h = w // square
    , p = world.createBody(shapes.rect(w,h), x, y, flags || (BodyFlags.DYNAMIC | BodyFlags.BOUNCE))
  p.id = 'puck' // for debugging mostly

  // set a puck bounce counter
  // TODO move to p.data.bounces?
  world.puckBounces[p.index] = 0;
  world.pucks.set(p.index,p);
  actions.emit('added','puck',world,p);
  return p;
}

exports.puckSpeed = function(world, p, s){
  debug('%s speed (current direction) [%s]',world.name ,p.index, s)

  // it's probably a special case like:
  // "hit the end and the paddle in the same frame"
  // where one action will remove it and the other
  // set the speed. but warn just in case.
  if( !world.pucks.has(p.index) ){
    return console.warn('cannot set puck speed, does not exist yet');
  }

  // s = multiplier of unit speed (ex. speed*speedup^bounces)

  // only a speed (in the current direction)
  var v = vec.sub(p.current,p.previous)
  vec.norm(v,v)
  vec.smul(v,s*settings.data.unitSpeed,v)
  vec.sub(p.current,v,p.previous)
  vec.free(v)
}

exports.getPuckSpeed = function(world,puck){
  // add some extra power to each hit
  // unit * (speed+speedup*bounces)
  // 20 * (1+0) > 20 * (1+.2) > 20 * (1+.4)
  // ex. 20 > 20 * 1.2 > 20 * 1.4 > ... > 20 * 4
  var level = world.level.puck.speed
    , speedup = world.level.puck.speedup
    , maxspeed = world.level.puck.maxspeed
    , bounces = world.puckBounces[puck.index];

  return Math.min(level + speedup*bounces, maxspeed);
}

exports.puckSpeedMomentum = function(world, p, s, m){
  debug('%s speed (w. momentum) [%s]',world.name ,p.index, s, m)

  // see puckSpeed()
  if( !world.pucks.has(p.index) ){
    return console.warn('cannot set puck speed, does not exist yet');
  }

  // add extra speed and damp until the speed is
  // back to normal
  if( settings.data.speedupMomentum && Math.abs(m[0]) > 1 ){
    // moment as scalar
    var ms = Math.min(vec.len(m), settings.data.unitSpeed);

    p.dampUntil = s*settings.data.unitSpeed;
    p.damping = 0.97;

    s += ms/8;
  }

  // only a speed (in the current direction)
  var v = vec.sub(p.current,p.previous)

  // momentum changes direction
  if( settings.data.directionMomentum ){
    vec.add(v,m,v)
  }

  vec.norm(v,v)
  vec.smul(v,s*settings.data.unitSpeed,v)
  vec.sub(p.current,v,p.previous)
  vec.copy(v,p.velocity)
  vec.free(v)
}

exports.puckSpeedXY = function(world, p, x, y){
  debug('%s speed [%s]',world.name , p.index, x, y)

  // see puckSpeed()
  if( !world.pucks.has(p.index) ){
    return console.warn('cannot set puck speed, does not exist yet');
  }

  // set a speed and direction
  var v = vec.make(x,y)
  vec.sub(p.current,v,p.previous)
  vec.copy(v,p.velocity)
  vec.free(v)
}

exports.puckCheckMinSpeed = function(world, p){
  debug('check speed',p.index)

  // skip if it has been removed
  // (like when this is called from Bound.puck)
  if( p.removed ){
    return;
  }


  // make sure it has a minimum y-velocity so the
  // game doesn't get stuck.
  var minY = settings.data.minYSpeed;
  if( Math.abs(p.velocity[1]) < minY ){
    // correct the sign
    minY = p.velocity[1] > 0 ? minY : -minY;

    // apply speed
    actions.puckSpeedXY(world,p,p.velocity[0],minY);
  }

  // also make sure it has a minimum velocity (unitSpeed)
  // in any direction so force fields et al won't ruin the
  // fun.
  // using a calculated velocity since p.velocity may be outdated
  var speed = vec.dist(p.current,p.previous) / settings.data.unitSpeed;
  var minSpeed = 1;
  if( speed < minSpeed ){
    debug('puck was below min speed %s now at a comfortable %s',speed,minSpeed)
    actions.puckSpeed(world,p,minSpeed);
  }
}

exports.puckCheckMaxSpeed = function(world, p){
  debug('check speed',p.index)

  // skip if it has been removed
  // (like when this is called from Bound.puck)
  if( p.removed ){
    return;
  }

  var speed = vec.dist(p.current,p.previous) / settings.data.unitSpeed;
  var maxSpeed = world.level.puck.maxspeed + world.level.puck.maxspeed*0.5*(p.data.fireball==1);
  if( speed > maxSpeed && !p.dampUntil ){
    debug('puck was above max speed %s now at a comfortable %s',speed,maxSpeed)
    actions.puckSpeed(world,p,maxSpeed);

    // if extreme debug!
    if( speed > maxSpeed * 10 ){
      throw new Error('puck is extremely fast. must be a bug. investigate!');
    }
  }
}

exports.puckCheckSpeedAll = function(world, p){
  for(var i=0; i < world.pucks.length; i++){
    actions.puckCheckMinSpeed(world, world.pucks.values[i]);
    actions.puckCheckMaxSpeed(world, world.pucks.values[i]);
  }
}

exports.destroyPuck = function(world, puck){
  debug('%s destroy',world.name ,puck.index);
  delete world.lastHitPucks[puck.index];
  delete world.puckBounces[puck.index];
  world.pucks.del(puck.index)
  world.releaseBody(puck)
  actions.emit('removed','puck',world,puck);
}

exports.puckBounced = function(world,puck) {
  actions.emit('renderer','puckBounce',{puck: puck});

  //console.log('%s puck bounced angle: %s speed: %s',world.name,(Math.atan2(puck.velocity[1],puck.velocity[0])*180/Math.PI).toFixed(4),vec.len(puck.velocity))

  // after the hit, and if it's still alive, we
  // make sure it has a minimum y-velocity so the
  // game doesn't get stuck.
  actions.puckCheckMinSpeed(world,puck)
}

exports.puckToggleHit = function(world,puckIndex,hit){
  var puck = world.pucks.get(puckIndex);
  puck.data.hitShield = hit;
}

exports.puckToggleGhostball = function(world,puckIndex,extraIndex){
  var puck = world.pucks.get(puckIndex);
  if( puck.data.ghostball ){
    puck.data.ghostball = 2;
    dmaf.tell('ghostball_over');
    icons.remove(world,extraIndex);
    delete puck.data.ghostballTimeout;
    world.tick.nextFrame('resetPuckExtra',puck.index,'ghostball')
    puck.data.ghostIcon = extraIndex;
  } else {
    puck.data.ghostball = 1;
    icons.activate(world,extraIndex);
    delete puck.data.ghostIcon;
  }
}

exports.puckToggleGhostFlag = function(world,puckIndex,active){
  var puck = world.pucks.get(puckIndex);
  if( active ){
    debug('puck GHOST ADD %s %s %s',world.name,world.frame,puck.index)
    BodyFlags.add(puck,BodyFlags.GHOST);
  } else {
    // if it's colliding when GHOST wears off
    // wait a try again next frame
    if( colliding(world,puck) ){
      debug('puck was colliding when GHOST wore off. trying again next frame.')
      return world.tick.nextFrame('puckToggleGhostFlag',puckIndex);
    }
    BodyFlags.del(puck,BodyFlags.GHOST)
    debug('puck GHOST DEL %s %s %s',world.name,world.frame,puck.index)
  }
}

exports.puckTimebombExplode = function(world,puckIndex,extraIndex,radius){
  var puck = world.pucks.get(puckIndex);

  // visual and audial boom!
  puck.data.timebomb = 2;
  dmaf.tell('timebomb_over');
  world.tick.nextFrame('resetPuckExtra',puck.index,'timebomb')
  icons.remove(world,extraIndex);
  delete puck.data.bombTimeout;

  // query which shields are within radius
  // and destroy them!
  var radSq = radius*radius
    , destroyed = [];
  for(var i=0; i<world.shields.length;i++){
    var shield = world.shields.values[i];
    var distSq = vec.distSq(puck.current,shield.current)
    if( distSq < radSq ){
      // no good to destroy within loop because
      // stashes are unordered
      shield.data.blownAway = 1;
      destroyed.push(shield);
    }
  }
  while( destroyed.length ){
    actions.destroyShield(world,destroyed.pop());
  }
}

exports.resetPuckExtra = function(world,puckIndex,extraType) {
  var puck = world.pucks.get(puckIndex);
  if( puck && puck.data.hasOwnProperty(extraType)) {
    puck.data[extraType] = 0;
  }
}

});
require.register("slam/lib/actions/game.js", function(exports, require, module){
var debug = require('debug')('actions:game')
  , actions = require('../actions')
  , see = require('../support/see')
  , icons = require('../extra-icons')
  , see = require('../support/see');

exports.gameToggleDeathball = function(world, active){
  if( active ){
    dmaf.tell( "deathball_activate");
    icons.activate(world, 'deathball')
  } else {
    dmaf.tell( "deathball_over");
    icons.remove(world, 'deathball')
  }
  actions.emit('renderer','toggleDeathball',{active:active})
}

exports.gameDeathballOver = function(world,puckIndex){
  var playerID = world.lastHitPucks[puckIndex];
  dmaf.tell( "deathball_over");
  icons.remove(world, 'deathball')
  actions.playerHit(world,player,puck)
}

exports.gameToggleFog = function(world, active){
  actions.emit('renderer','toggleFog',{active:active})

  if( active ){
    icons.activate(world, 'fog')
  } else {
    dmaf.tell('fog_over');
    icons.remove(world, 'fog')
    delete world.timeouts.fog;
  }
}

exports.roundOver = function(world, hitPlayerIndex, hitPuckPosition){
  debug('%s round over',world.name)

  var player = hitPlayerIndex === 0
              ? world.players.a
              : world.players.b;

  if( !world.multiplayer || (world.name == 'sync' || player === world.me ) ){

    // mark who was last hit
    player.hit = hitPuckPosition || .5;
    // console.log('\n\n\nHIT!!! %s\n\n\n',world.name,hitPlayerIndex,hitPuckPosition)

    // show a distortion effect
    // TODO somehow get a hold of the position of the killing puck
    if( world.opponent.hit != -1 ){
      debug('hit opponent?')
      actions.emit('renderer','hitOpponent',{point: player.hit})
      dmaf.tell('opponent_score_hit')

    } else if( world.me.hit != -1 ){
      debug('hit me?')
      actions.emit('renderer','hitMe')
      dmaf.tell('user_score_hit')
    }

    see('/game/next')
  }
}

});
require.register("slam/lib/actions/extra.js", function(exports, require, module){
var debug = require('debug')('actions:extra')
  , settings = require('../settings')
  , BodyFlags = require('../sim/body-flags')
  , World = require('../world')
  , shapes = require('../sim/shapes')
  , icons = require('../extra-icons')
  , colliding = require('../support/aabb').colliding
  , actions = require('./')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec
  , dmaf = require('../dmaf.min');

/**
 *
 * IDs and descriptions of extras:
 *
 *   'paddleresize' (level 1)
 *       big=125%, small=75% (random)
 *
 *   'extralife' (level 2)
 *       one shield gets regenerated
 *
 *   'fog' (level 3)
 *       covers the opponents side of the field
 *       for X seconds
 *
 *   'multiball' (level 4)
 *       split ball up into X balls for Y seconds
 *       (or until it hits a shield/player)
 *       maybe start w. GHOST-flag for 5 frames to
 *       avoid instant collision?
 *
 *   'fireball' (level 5)
 *       removes items (other pucks and not
 *       picked up extras) in the way. makes
 *       hit paddle dizzy ()
 *
 *   'ghostball' (level 6)
 *       ball becomes barely visible for X
 *       seconds (or until it hits a
 *       shield/player), only when it hits something
 *
 *   'bulletproof' (level 7)
 *       a shield partition becomes unbreakable
 *       for X seconds
 *
 *   'mirroredcontrols' (level 8)
 *       controls get inverted
 *
 *   'laser' (level 9)
 *       auto shoots a laser that if hit player
 *       paddle shrinks it
 *
 *   'timebomb' (level 10)
 *       ball explodes after X seconds which removes
 *       items and shrinks paddles within Y radius.
 *       puck then restarts from middle.
 *
 *   'random' (level 11)
 *       any of the available extras
 *
 *   'deathball'
 *       bad assery
 *
 **/

/**
 * Creates one of the availabe extras at one of the
 * designated positions.
 *
 * @param  {World} world
 * @param  {Object} level
 * @return the created extra
 */
exports.createRandomExtra = function(world){
  debug('%s create random',world.name);
  var src = settings.data.overrideSpawnExtras? settings.getSpawnlist(): world.level.extras;

  // filter out extras which should not be available
  // in this round.
  var round = world.players.a.score + world.players.b.score + 1;
  var arr = src.filter(function(e){
    return !e.round || e.round <= round;
  })

  // no extras found to match this round
  if( !arr.length ){
    return;
  }

  // find an extra based on probability
  var extra = prob(world,arr);

  //to many?

  if( extra.simultaneous ) {

    var currentExtras = 0;
    for (var i =  world.extras.values.length - 1; i >= 0; i--) {
      if( world.extras.values[i].data.id === extra.id ) {
        currentExtras++
        if( currentExtras >= extra.simultaneous ) {
          debug('To many extras of same kind');
          return;
        }
      }
    }
  }

  var positions = shuffle(world,world.level.positions);
  var pos = extra.position || positions.pop();
  var body = actions.createExtra(world,extra,pos.x,pos.y);

  // this should be ok w. max 3 extras and a few pucks?
  var n;
  var x = pos.x, y = pos.y; // avoid updating the positions objects
  while(colliding(world,body) && (n = positions.pop())){
    poly.translate(body.shape, n.x-x, n.y-y);
    poly.aabb(body.shape, body.aabb) // update aabb
    body.current[0] = body.previous[0] = x = n.x;
    body.current[1] = body.previous[1] = y = n.y;
  }

  if( colliding(world,body) ){
    console.warn('still colliding after all positions, is there enough positions in the level?!')
    //console.log('body',body)
    //console.log('extra',extra)
  }
  actions.emit('added','extra',world,body);
  return body;
}

/**
 * Creates an extra body "pick-up" in the arena that
 * can be hit by the puck.
 *
 * When hit `hitExtra` will be called.
 *
 * @param  {World} world
 * @param  {Object} data  The extra level data (ex. {id:'fog',duration:200})
 * @param  {Number} x
 * @param  {Number} y
 * @return {Body} the created extra pick-up.
 */
exports.createExtra = function(world, data, x, y){
  debug('%s create',world.name ,data.id);

  if( !validExtra(data) ){
    throw new Error('invalid extra: '+data.id)
    return;
  }

  var shape = shapes.rect(settings.data.unitSize,settings.data.unitSize);
  var extra = world.createBody(shape, x, y, BodyFlags.STATIC | BodyFlags.DESTROY | BodyFlags.GHOST)
  extra.id = 'extra';
  extra.data = data;
  world.extras.set(extra.index,extra)
  dmaf.tell( data.id + '_spawn');
  icons.create(world, extra)

  if( data.id == 'deathball') {
    actions.gameToggleDeathball(world,true)
    world.tick.clearTimeout(world.timeouts.deathballTimeout);
    world.timeouts.deathballTimeout = world.tick.setTimeout('gameToggleDeathball',(data.duration || 5)*1000,false);
  }

  world.tick.setTimeout('resetExtraGhost',settings.data.extraGhostDuration,extra.index)

  return extra;
}

exports.resetExtraGhost = function(world, extraIndex){
  debug('reset ghost',extraIndex)
  var extra = world.extras.get(extraIndex);
  BodyFlags.del(extra,BodyFlags.GHOST);
}

/**
 * Called when an extra pick-up has been hit by
 * the puck.
 *
 * @param  {World} world
 * @param  {Body} puck
 * @param  {Body} extra
 */
exports.hitPuckExtra = function(world, puck, extra){
  debug('%s hit %s puck: %s',world.name ,extra.index,puck.index)

  // skip if no player can be affected
  if( !world.lastHitPucks[puck.index] ){
    return;
  }

  // renderer effects
  actions.emit('renderer','activateExtra',{puck:puck, extra: extra})

  // remove extra (unlike obstacles, extras are removed)
  actions.destroyExtra(world,extra)

  var id = extra.data.id
    , data = extra.data;

  // random extra
  if( id == 'random' ){
    // "random" has no actual effect, remove it from available
    var available = world.level.extras.filter(function(e){return e.id !== 'random'})
    data = rand(world,available);
    if( !data ){
      console.warn('no extra found to use as random')
      return
    }
    id = data.id;
  }

  dmaf.tell( id + '_activate');

  var playerID = world.lastHitPucks[puck.index]
    , player = world.players[playerID]
    , paddle = world.paddles.get(player.paddle)

  switch(id){

    case 'extralife':
      icons.remove(world,extra)
      actions.regenerateShield(world,player)
      break;

    case 'ghostball':
      var ghostDuration = (data.duration || 7)*1000;

      // remove any old extra icons
      if( puck.data.ghostIcon ){
        icons.remove(world,puck.data.ghostIcon);
        delete puck.data.resizeIcon;
      }

      actions.puckToggleGhostball(world,puck.index,extra.index)
      world.tick.clearTimeout(puck.data.ghostballTimeout);
      puck.data.ghostballTimeout = world.tick.setTimeout('puckToggleGhostball', ghostDuration, puck.index,extra.index)
      break;

    case 'fireball':
      icons.remove(world,extra)

      // mark the paddle as fireball
      // to be transferred when a puck hits it
      paddle.data.fireball = 1;
      break;

    case 'mirroredcontrols':
      // mirror the controls
      actions.emit('renderer','mirrorEffect',{active: true})
      icons.activate(world,'mirroredcontrols')
      break;

    case 'bulletproof':
      var bulletproofDuration = (data.duration || 7) * 1000;

      // remove any old extra icons
      if( world.timeouts.bulletproof ){
        icons.remove(world,extra);
        delete world.timeouts.bulletproof;
      }

      actions.playerToggleBulletproof(world,playerID,true);
      world.tick.clearTimeout(world.timeouts.bulletproof);
      world.timeouts.bulletproof = world.tick.setTimeout('playerToggleBulletproof', bulletproofDuration, playerID, false)
      break;

    case 'paddleresize':
      var resizeDuration = (data.duration || 10) * 1000;

      // remove any old extra icons
      if( paddle.data.resizeIcon ){
        icons.remove(world,paddle.data.resizeIcon);
        delete paddle.data.resizeIcon;
      }

      actions.playerTogglePaddleResize(world,playerID,extra.index,true)
      world.tick.clearTimeout(paddle.data.resizeTimeout);
      paddle.data.resizeTimeout = world.tick.setTimeout('playerTogglePaddleResize',resizeDuration, playerID, extra.index, false);
      break;

    case 'deathball':
      world.tick.nextFrame('gameDeathballOver',puck.index);
      break;

    case 'timebomb':
      var radius = data.radius || settings.data.arenaHeight / 2;
      if( !puck.data.timebomb ){
        icons.activate(world,extra)
      } else {
        icons.remove(world,extra)
      }
      puck.data.timebomb = 1;
      world.tick.clearTimeout(puck.data.bombTimeout);
      puck.data.bombTimeout = world.tick.setTimeout('puckTimebombExplode', 4000, puck.index, extra.index, radius)
      break;

    case 'laser':
      var laserDuration = (data.duration || 5)*1000;

      // remove any old extra icons
      if( world.timeouts.laserTimeout ){
        icons.remove(world,extra);
        dmaf.tell('laser_over');
      }

      // only one laser at the time
      // if( world.timeouts.laserTimeout ) {
      var a = world.paddles.get(world.players.a.paddle);
      var b = world.paddles.get(world.players.b.paddle);
      if( a.data.laser == 1 ){ a.data.laser = 2; }
      if( b.data.laser == 1 ){ b.data.laser = 2; }
      // }

      actions.playerToggleLaser(world,playerID,true)
      world.tick.clearTimeout(world.timeouts.laserTimeout)
      world.timeouts.laserTimeout = world.tick.setTimeout('playerToggleLaser',laserDuration,playerID,false);
      break;

    case 'fog':
      var fogDuration = (data.duration || 5)*1000;
      if( world.timeouts.fog ){
        icons.remove(world, extra);
        delete world.timeouts.fog;
      }
      actions.gameToggleFog(world,true)
      world.tick.clearTimeout(world.timeouts.fog);
      world.timeouts.fog = world.tick.setTimeout('gameToggleFog',fogDuration,false)
      break;

    case 'multiball':
      // create a new puck
      var x = data.x || settings.data.arenaWidth / 2
        , y = data.y || settings.data.arenaHeight / 2
        , n = actions.createPuck(world,x,y,puck.mass);

      // copy the last hit
      world.lastHitPucks[n.index] = world.lastHitPucks[puck.index];

      // make the new puck a ghost for a few frames
      // to avoid collisions
      actions.puckToggleGhostFlag(world,n.index,true)
      world.tick.clearTimeout(puck.data.ghostTimeout);
      puck.data.ghostTimeout = world.tick.setTimeout('puckToggleGhostFlag',200,n.index,false)

      // push the new puck in one direction and the old one
      // in the opposite.
      var speed = puck.velocity[1] < 0 ?  settings.data.unitSpeed: -settings.data.unitSpeed;
      actions.puckSpeedXY(world, n, 0, speed)

      icons.activate(world,extra)
      break;
  }
}

exports.destroyExtra = function(world, extra){
  debug('%s destroy',world.name ,extra.index);
  world.extras.del(extra.index)
  world.releaseBody(extra)
  actions.emit('removed','extra',world,extra);
  dmaf.tell( extra.data.id + '_remove');
}

exports.destroyFirstExtra = function(world){
  // find out which is the first extra
  // (i guess the one with the lowest index?)
  var extra
    , index = Infinity;
  for(var i=0; i < world.extras.length; i++){
    var e = world.extras.values[i];
    if( !e.removed && e.index < index ){
      index = e.index;
      extra = e;
    }
  }
  debug('%s destroy first',world.name ,index);
  if( extra ){
    icons.remove(world,index)
    actions.destroyExtra(world, extra)
    world.destroyBody(extra)
  } else {
    console.error('no extra found?!');
  }
}

function validExtra(data){
  // TODO validate the options
  switch(data.id){
    case 'fog':
    case 'fireball':
    case 'ghostball':
    case 'extralife':
    case 'multiball':
    case 'bulletproof':
    case 'mirroredcontrols':
    case 'deathball':
    case 'paddleresize':
    case 'timebomb':
    case 'laser':
    case 'random':
      return true;
  }
  return false;
}

function prob(world,available){
  var d = settings.data.defaultProbability
    , t = available.reduce(function(t,e){return t+(e.probability || d)},0)
    , x = world.random() * t
    , p = 0;
  for(var i=0;i<available.length; i++){
    var e = available[i]
      , n = p + (e.probability || d);
    if( x >= p && x < n ){
      return e;
    }
    p = n;
  }
  throw new Error('no extra found. whut?')
  return null;
}

function rand(world,arr){
  return arr[Math.round(world.random()*arr.length-0.5)]
}

function shuffle(world,arr){
  var array = arr.concat();
  var tmp, current, top = array.length;

  if(top){
    while(--top) {
      current = Math.floor(world.random() * (top + 1));
      tmp = array[current];
      array[current] = array[top];
      array[top] = tmp;
    }
  }

  return array;
}
});
require.register("slam/lib/actions/obstacle.js", function(exports, require, module){
var debug = require('debug')('actions:obstacle')
  , settings = require('../settings')
  , BodyFlags = require('../sim/body-flags')
  , shapes = require('../sim/shapes')
  , colliding = require('../support/aabb').colliding
  , actions = require('./')
  , geom = require('geom')
  , poly = geom.poly
  , vec = geom.vec
  , dmaf = require('../dmaf.min');

exports.createNextObstacle = function(world){
  debug('%s create next',world.name);

  // first test that the shape (aabb) of the body
  // will not collide
  var obstacle = world.level.obstacles[world.obstacles.length];

  if( !obstacle ){
    return null;
  }

  var shape = getObstacleShape(obstacle);
  poly.translate(shape,obstacle.x,obstacle.y,shape);
  var fake = { aabb: poly.aabb(shape), id: 'obstacle' };
  if( colliding(world,fake) ){
    return debug('colliding obstacle. trying again next frame.',fake)
  }

  var flags = BodyFlags.STATIC | BodyFlags.BOUNCE;
  if( obstacle.destroyable ){
    flags |= BodyFlags.DESTROY;
  }

  // now we can create the obstacle
  return actions.createObstacle(world,obstacle.id,obstacle.x,obstacle.y,flags,shape);
}

exports.createObstacle = function(world,id,x,y,flags,shape){
  debug('%s create',world.name ,id,x,y);

  var body
    , shape = shape || getObstacleShape(id)
    , flags = flags || BodyFlags.STATIC | BodyFlags.BOUNCE;

  if( shape ){
    body = world.createBody(shape,x,y,flags)
    body.id = 'obstacle';
    body.data.id = id;
    world.obstacles.set(body.index,body)
    actions.emit('added','obstacle',world,body);
  }
  return body;
}

exports.destroyObstacle = function(world,obstacle){
  debug('%s destroy',world.name ,obstacle.index);

  world.obstacles.del(obstacle.index)
  world.releaseBody(obstacle)
  actions.emit('removed','obstacle',world,obstacle);

}

exports.hitPuckObstacle = function(world,puck,obstacle){

  if( obstacle.data.regenerate ) {
    actions.emit('hide','obstacle',world,obstacle);
    actions.hideObstacle(world,obstacle)
  }
  else {
    if(BodyFlags.has(obstacle,BodyFlags.DESTROY)){
      actions.destroyObstacle(world,obstacle)
    }
  }

  dmaf.tell('obstacle_hit');

  actions.puckBounced(world,puck)
}

function getObstacleShape(obstacle){
  var size = obstacle.size;
  switch(obstacle.id || obstacle){
    case 'triangle-left':
      return shapes.triangle(settings.data.unitSize*(size && size[0]||3),settings.data.unitSize*(size && size[1]||4),true)
    case 'triangle-right':
      return shapes.triangle(settings.data.unitSize*(size && size[0]||3),settings.data.unitSize*(size && size[1]||4),false)
    case 'triangle-top':
      return shapes.triangle(settings.data.unitSize*(size && size[0]||3),settings.data.unitSize*(size && size[1]||4),false,true)
    case 'triangle-bottom':
      return shapes.triangle(settings.data.unitSize*(size && size[0]||3),settings.data.unitSize*(size && size[1]||4),true,true)
    case 'diamond':
      return shapes.diamond(settings.data.unitSize*(size||4))
    case 'hexagon':
      return shapes.hex(settings.data.unitSize*(size||3))
    case 'octagon':
      return shapes.oct(settings.data.unitSize*(size||8))
    case 'block-breakout':
      return shapes.rect(settings.data.unitSize,settings.data.unitSize);
    case 'block-rect':
      return shapes.rect(settings.data.unitSize*(size && size[0]||1),settings.data.unitSize*(size && size[1]||1));
    default:
      throw new Error('unsupported obstacle: '+obstacle.id)
  }
}

});
require.register("slam/lib/actions/force.js", function(exports, require, module){
var debug = require('debug')('actions:force')
  , settings = require('../settings')
  , actions = require('./')
  , dmaf = require('../dmaf.min')
  , Force = require('../sim/force');

exports.createNextForce = function(world){
  debug('%s create next', world.name);

  var force = world.level.forces[world.forces.length];
  if( !force ){
    return null;
  }

  // now we can create the force
  return actions.createForce(world,force.type,force.x,force.y,force.mass || 10);
}

exports.createForce = function(world,type, x, y, mass){
  debug('%s create', world.name, type, x, y, mass)

  if( !mass )
    throw new Error('cannot create a force without a mass')

  switch(type){
    case 'repell':
    case 'attract':
      var force = new Force(type, x, y, mass, 1)
      force.index = world.index++;
      if( settings.data.forcesInterval > 0 ){
        force.interval = world.tick.setInterval('toggleForce',settings.data.forcesInterval,force.index);
      } else {
        force.active = true;
      }
      world.forces.set(force.index,force);
      actions.emit('added','force',world,force);
      break;
    default:
      throw new Error('invalid force kind');
  }
}


exports.toggleForce = function(world,forceIndex){
  var force = world.forces.get(forceIndex);
  force.active = !force.active;
  dmaf.tell('force_' + (force.active ? 'show' : 'hide') );

  // run checkPuckSpeed on all pucks to keep
  // them in check
  if( !force.active ){
    actions.puckCheckSpeedAll(world);
  }
}

exports.destroyForce = function(world,force){
  debug('%s destroy',force)
  world.forces.del(force.index);
  world.tick.clearInterval(force.interval);
  actions.emit('removed','force',world,force);
}
});
require.register("slam/lib/actions/debug.js", function(exports, require, module){
var debug = require('debug')('actions:debug')
  , diff = require('../support/diff')
  , inspect = require('../support/inspect')

exports.debugDiff = function(world, remoteState){
  var remoteState = remoteState && remoteState.replace(/\\n/g,'\n')
  var localState;

  // temporary remove some uninteresting references
  var ignore = [
    'me',
    'opponent',
    'host',
    'players.a.paddle',
    'players.b.paddle',

    // these will all be in bodies too
    'pucks',
    'paddles',
    'extras',
    'obstacles',
    'forces',
    'bullets',

    // these are only in the renderer
    'added',
    'removed'
  ]
  exclude(world,ignore,function(world){
    localState = inspect(world,{depth:Infinity});
  })

  // received a state from other player
  if( remoteState ){
    console.log('got a remote state')
    console.log(diff.createPatch('diff',remoteState,localState,'remote','local ' + world.frame))

  // sending state reliably to other player
  } else {
    console.log('sending debug diff! %d ',world.frame)
  }
  return localState;
}




// temporary excludes properties in `obj` defined in `excluded`
// calls fn with the obj and then adds the properties back after
// the callback.
function exclude(obj,excluded,fn){
  var map = {}
  excluded.forEach(function(prop){
    var props = prop.split('.');
    var tmp = obj;
    for (var i = 0; i < props.length; ++i) {
      var name = props[i];
      if( i == props.length-1 ){
        map[prop] = tmp[name]
        delete tmp[name]
      } else {
        tmp = tmp[name];
      }
    }
  })
  fn(obj)
  Object.keys(map).forEach(function(prop){
    var props = prop.split('.');
    var tmp = obj;
    for (var i = 0; i < props.length; ++i) {
      var name = props[i];
      if( i == props.length-1 ){
        tmp[name] = map[prop];
      } else {
        tmp = tmp[name];
      }
    }
  })
}

});
require.register("slam/lib/actions/player.js", function(exports, require, module){
var debug = require('debug')('actions:player')
  , settings = require('../settings')
  , inputs = require('../inputs')
  , actions = require('../actions')
  , icons = require('../extra-icons')
  , dmaf = require('../dmaf.min');

exports.playerToggleBulletproof = function(world,playerID,active){
  var player = world.players[playerID]
    , paddle = world.paddles.get(player.paddle);

  // find available shields
  for(var i=0; i<world.shields.length; i++){
    var shield = world.shields.values[i];

    // make sure shield belongs to player
    if( shield.data.player !== playerID ){
      shield.data.bulletproof = 0; // or make sure they're off
      continue;
    }

    // shield must be "up"
    if( player.shields[shield.data.index] === 0 ){
      continue;
    }

    // toggle bulletproof on
    if( active && !shield.data.bulletproof ){
      shield.data.bulletproof = 1;
    }

    // toggle bulletproof off
    if( !active && shield.data.bulletproof ){
      shield.data.bulletproof = 0;
    }
  }

  if( active ){
    icons.activate(world,'bulletproof');
  } else {
    icons.remove(world,'bulletproof');
    delete world.timeouts.bulletproof;
  }
}

exports.playerTogglePaddleResize = function(world,playerID,extraIndex,active){
  var player = world.players[playerID]
    , paddle = world.paddles.get(player.paddle);

  if( active ){
    actions.resizePaddle(world,player.paddle,1.75);
    icons.activate(world,extraIndex)
    paddle.data.resizeIcon = extraIndex;

  } else {
    actions.resizePaddle(world,player.paddle,1.0);
    icons.remove(world,extraIndex);
    delete paddle.data.resizeIcon;
    delete paddle.data.resizeTimeout;
  }

  actions.emit('renderer','paddleResize',{
    playerID: playerID,
    width: paddle.aabb[1] - paddle.aabb[3]
  })
}

exports.playerToggleLaser = function(world,playerID,active){
  var player = world.players[playerID]
    , paddle = world.paddles.get(player.paddle)
    , interval = 1000; // TODO use the extra.data.interval

  if( active ){
    // mark it as a laser paddle
    paddle.data.laser = 1;
    icons.activate(world,'laser')

    // shoot bullets at an interval
    world.tick.clearInterval(world.timeouts.laserInterval)
    world.timeouts.laserInterval = world.tick.setInterval('paddleShoot', interval, player.paddle)

  } else {
    world.tick.clearInterval(world.timeouts.laserInterval)
    dmaf.tell('laser_over');
    icons.remove(world,'laser');
    delete world.timeouts.laserTimeout;
    paddle.data.laser = 2;
    world.tick.nextFrame('resetPaddleExtra',player.paddle,'laser')
  }
}

exports.playerHit = function(world,player,puck){
  debug('%s hit',world.name ,player,puck.index)

  // only send HIT if it was me who was hit in multiplayer
  // otherwise send it everytime. (AI sucks at networking)
  if( !world.multiplayer || (world.name == 'game' && player == world.me) ){
    var index = player === world.players.a ? 0 : 1;
    var x = puck.current[0]/settings.data.arenaWidth;
    inputs.record(inputs.types.DIED,index,x)
  }

}
});
require.register("slam/lib/actions/shields.js", function(exports, require, module){
var debug = require('debug')('actions:shields')
  , settings = require('../settings')
  , shapes = require('../sim/shapes')
  , BodyFlags = require('../sim/body-flags')
  , actions = require('../actions')
  , inputs = require('../inputs')
  , dmaf = require('../dmaf.min');

exports.createShields = function(world,player){
  var shields = world.level && world.level.player
              ? world.level.player.shields
              : settings.data.defaultShields;

  player.shields = makeArray(shields,1); // set to more than 1 for a stronger shield
  for(var i=0,l=player.shields.length; i<l; i++){
    actions.createShield(world,player,i,l);
  }
}

exports.createShield = function(world,player,i,length){
  debug('%s create',world.name ,player,i,length)

  // creates a shield 1 unit deep and x units wide
  var ah = settings.data.arenaHeight
    , w = settings.data.arenaColumns/length * settings.data.unitSize-5
    , h = settings.data.unitSize/8
    , x = w * i + w/2 + 5*i
    , y = (player === world.players.b ? h : ah-h)
    , s = world.createBody(shapes.rect(w,h),x,y,BodyFlags.STATIC | BodyFlags.BOUNCE | BodyFlags.DESTROY)
  s.id = 'shield' // used in collisions.js
  s.data.player = player === world.players.a ? 'a' : 'b'; // (used by hitExtra)
  s.data.index = i // index in player.shields (used by hitExtra)
  world.shields.set(s.index,s)
  actions.emit('added','shield',world,s)
}


// pick one shield of player w. 0 and reset it to 1 as
// well as call createShield() again.
exports.regenerateShield = function(world,player){
  debug('%s regenerate',world.name ,player)
  for(var i=0; i<player.shields.length; i++){
    if( player.shields[i] === 0 ){
      player.shields[i] = 1;
      actions.createShield(world,player,i,player.shields.length);
      break;
    }
  }
}

exports.hitPuckShield = function(world,puck,shield){
  debug('%s hit', world.name, puck.index, shield.index)

  var player = shield.data.player == 'a'
    ? world.players.a
    : world.players.b;

  // skip if puck already hit a shield this frame
  // this is to avoid two shields to get hit at
  // once
  if( puck.data.hitShield ){
    debug('skipping hit shield because puck already hit a shield this frame')
    return;
  }

  // flag the puck as "hit shield" for one frame
  actions.puckToggleHit(world,puck.index,true)
  world.tick.nextFrame('puckToggleHit',puck.index,false)

  // make the puck a ghost for a few frames
  // to avoid collisions
  actions.puckToggleGhostFlag(world,puck.index,true)
  world.tick.clearTimeout(puck.data.ghostTimeout);
  puck.data.ghostTimeout = world.tick.setTimeout('puckToggleGhostFlag',400,puck.index,false)

  // puck was fireball
  if( puck.data.fireball ){
    // set to 2 will trigger out-animation in renderer
    puck.data.fireball = 2; // turn off

    // reset the fireball flag next frame
    world.tick.nextFrame('resetPuckExtra',puck.index,'fireball')
    dmaf.tell("fireball_over");
  }

  // send it as a MISS in multiplayer
  if( world.multiplayer && world.name == 'game' ){
    if( player !== world.opponent ){
      var paddle = world.paddles.get(player.paddle);
      inputs.record(inputs.types.MISS,paddle.current[0])
    }
  }

  // shields also count as the 'last hit puck'
  world.lastHitPucks[puck.index] = shield.data.player;

  // make some noise!
  if( player == world.opponent ){
    dmaf.tell('opponent_shield_hit')
  } else {
    dmaf.tell('user_shield_hit')
  }

  // lower hit shield by 1 unless bullet proof
  if( !shield.data.bulletproof ){
    var v = Math.max(0, --player.shields[shield.data.index]);
    // and if shield is fully down destroy it
    if( v == 0 ){
      exports.destroyShield(world,shield)
    }
  }

  actions.puckBounced(world,puck)
}

exports.destroyShield = function(world,shield){
  debug('%s destroy',world.name ,shield)

  world.shields.del(shield.index)
  world.releaseBody(shield)
  actions.emit('removed','shield',world,shield)
}


function makeArray(len,v){
  var a = [];
  for(var i=0; i<len; i++)
    a[i] = v;
  return a;
}
});
require.register("slam/lib/renderer.js", function(exports, require, module){
/**
 * This is a Renderer front which will be a assigned a
 * renderer implementation like 2D, 3D or CSS.
 */

var debug = require('debug')('renderer');

module.exports = Renderer;

function Renderer(){
  this.impl = null;
}

Renderer.prototype = {

  set: function(r){
    this.impl = r;
  },

  triggerEvent: function(id,opts){
    debug('triggerEvent',id,opts)
    if( !this.impl ) return;
    this.impl.triggerEvent(id,opts)
  },
  changeView: function(state, callback){
    debug('changeView',state)
    if( !this.impl ) return;
    this.impl.changeView(state,callback)
  },
  activePlayer: function(id,init,multiplayer){
    debug('activePlayer',id,init,multiplayer)
    if( !this.impl ) return;
    this.impl.activePlayer(id,init,multiplayer)
  },
  reset: function(){
    debug('reset')
    if( !this.impl ) return;
    this.impl.reset()
  },
  render: function(world,alpha){
    if( !this.impl ) return;
    this.impl.render(world,alpha)
  }
}
});
require.register("slam/lib/renderer-2d.js", function(exports, require, module){
var draw = require('./support/draw')
  , settings = require('./settings')
  , poly = require('geom').poly;

module.exports = Renderer;

var PADDLE_COLORS = ['#f00','#00f'];

function Renderer(canvas){
  this.canvas = canvas;
  this.context = canvas.getContext('2d');
  this.inverted = false;
  this.stats = {}
  this.bounds = [0,settings.data.arenaWidth,settings.data.arenaHeight,0];
  this.draw = draw(this.context)
  this.resize = true;
}

Renderer.prototype = {

  constructor: Renderer,

  reset: function(){},

  triggerEvent: function(){},

  changeView: function(){},

  activePlayer: function(id){
    this.inverted = id;
    this.resize = true;
  },

  drawPaddle: function(ctx, paddle, style){
    this.draw.poly(paddle.shape).stroke(style,3.5)
    this.draw.line([paddle.previous,paddle.current]).stroke(style)
    this.stats.paddles++;
  },

  drawBounds: function(ctx){
    this.draw.rect(this.bounds).stroke('green')
    this.stats.bounds++;
  },

  // Draw a gradient based on the type and mass of the force
  drawForce: function(ctx, force){
    if( !force.active ) return;
    var x = force.position[0]
      , y = force.position[1]
      , r = force.radius;

    // Create radial gradient
    var grad = ctx.createRadialGradient(x,y,0,x,y,r);
    switch(force.type){
      case 'repell':
        grad.addColorStop(0, 'rgba(255,0,0,1)');
        grad.addColorStop(1, 'rgba(255,0,0,0)');
        break;
      case 'attract':
        grad.addColorStop(0, 'rgba(0,255,0,1)');
        grad.addColorStop(1, 'rgba(0,255,0,0)');
        break;
    }
    ctx.fillStyle = grad;
    ctx.fillRect(x-r,y-r,force.mass,force.mass)
    this.stats.forces++;
  },

  drawBullet: function(ctx, bullet){
    if( !bullet ) return;
    this.draw.poly(bullet.shape).stroke('white')
    this.stats.bullets++;
  },

  drawObstacle: function(ctx, obstacle){
    ctx.fillStyle = 'pink'
    this.draw.poly(obstacle.shape).stroke('pink')
    this.stats.obstacles++;
  },

  drawShield: function(ctx, shield){
    this.draw.poly(shield.shape).stroke('gray')
    this.stats.shields++;
  },

  drawExtra: function(ctx, extra){
    this.draw.poly(extra.shape).stroke('blue')
    this.stats.extras++;
  },

  drawPuck: function(ctx, puck, index){
    if( puck.removed ) return;
    var color = index > 0 ? 'white' : 'yellow'
    this.draw.poly(puck.shape).stroke(color)
    this.draw.line([puck.previous,puck.current]).stroke(color)

    // draw an offset "shadow"
    if( puck.offset[0] || puck.offset[1] ){
      poly.translate(puck.shape,puck.offset[0],puck.offset[1])
      this.draw.poly(puck.shape).stroke('aqua')
      poly.translate(puck.shape,-puck.offset[0],-puck.offset[1])
    }

    this.stats.pucks++;
  },

  drawInfo: function(ctx, world){
    ctx.font = '1.5em courier'
    ctx.fillStyle = 'black'
    var t = ctx.measureText('0/0').width
      , w = this.w
      , h = this.h;
    ctx.fillText('0/0',0,20)
    ctx.fillText('1/0',w-t,20)
    ctx.fillText('0/1',0,h)
    ctx.fillText('1/1',w-t,h)

    // draw a line every x steps
    for( var x=0; x <= 1; x += .1){
      // top
      ctx.moveTo(x*w,0)
      ctx.lineTo(x*w,5)
      // bottom
      ctx.moveTo(x*w,h)
      ctx.lineTo(x*w,h-10)
    }
    ctx.stroke()

    // draw the player names
    ctx.font = '5em courier'
    var t = ctx.measureText(world.players.b.name).width;
    ctx.save()
    ctx.translate(w/2,0)
    ctx.rotate(Math.PI)
    ctx.fillText(world.players.b.name,-t/2,0);
    ctx.restore()

    var t = ctx.measureText(world.players.a.name).width;
    ctx.fillText(world.players.a.name,w/2-t/2,h);

    // draw the player scores
    ctx.font = '10em courier'
    var t = ctx.measureText(world.players.b.score).width;
    ctx.save()
    ctx.translate(w/2,100)
    ctx.rotate(Math.PI)
    ctx.fillText(world.players.b.score,-t/2,0);
    ctx.restore()

    var t = ctx.measureText(world.players.a.score).width;
    ctx.fillText(world.players.a.score,w/2-t/2,h-100);
  },

  drawStats: function(ctx){
    var x = 0
      , y = this.h
      , h = 50;
    ctx.fillStyle = 'white'
    ctx.font = '4em courier'
    for(var k in this.stats)
      ctx.fillText(k+': '+this.stats[k],x,y-=h);
  },

  render: function(world, alpha){
    this.stats.paddles = 0
    this.stats.bounds = 0
    this.stats.forces = 0
    this.stats.pucks = 0
    this.stats.extras = 0
    this.stats.links = 0
    this.stats.bullets = 0
    this.stats.obstacles = 0
    this.stats.shields = 0


    // bounds = [t,r,b,l]
    var w = this.w = settings.data.arenaWidth
      , h = this.h = settings.data.arenaHeight
      , margin = 50 // room for drawing corner positions
      , scale = .25
      , ctx = this.context;

    // clears canvas and makes sure it stays with the bounds (w. margin)
    if( this.resize ){
      this.canvas.width = (w+margin)*scale;
      this.canvas.height = (h+margin)*scale;

      // guest is flipped
      if( this.inverted ){
        ctx.translate(this.canvas.width/2,this.canvas.height/2)
        ctx.rotate(Math.PI)
        ctx.translate(-this.canvas.width/2,-this.canvas.height/2)
      }

      // scale it down because 800x1600 is huge...
      ctx.scale(scale,scale)

      // move everything in according to margin
      ctx.translate(margin/2,margin/2)

      this.resize = false;
    } else {
      ctx.fillStyle = 'rgba(0,0,0,.3)'
      ctx.fillRect(0,0,this.canvas.width/scale,this.canvas.height/scale)
    }

    // draw some text at the corners
    this.drawInfo(ctx, world)

    this.drawBounds(ctx);

    // draw the video in the background
    if( this.localVideo )
      ctx.drawImage(this.localVideo,0,0);

    for(var i=0, l=world.paddles.values.length; i < l; i++ )
      this.drawPaddle(ctx,world.paddles.values[i],PADDLE_COLORS[i]);

    for(var i=0, l=world.forces.values.length; i < l; i++)
      this.drawForce(ctx,world.forces.values[i]);

    for(var i=0, l=world.bullets.values.length; i < l; i++)
      this.drawBullet(ctx,world.bullets.values[i]);

    for(var i=0, l=world.obstacles.values.length; i < l; i++)
      this.drawObstacle(ctx,world.obstacles.values[i]);

    for(var i=0, l=world.extras.values.length; i < l; i++)
      this.drawExtra(ctx,world.extras.values[i]);

    for(var i=0, l=world.pucks.values.length; i < l; i++)
      this.drawPuck(ctx,world.pucks.values[i],i);

    for(var i=0, l=world.shields.values.length; i < l; i++)
      this.drawShield(ctx,world.shields.values[i]);

    this.drawStats(ctx)
  }
}


});
require.register("slam/lib/levels/index.js", function(exports, require, module){
exports.single = require('./single')
exports.multi = require('./multi')
exports.mobile = require('./mobile')
});
require.register("slam/lib/levels/sets/index.js", function(exports, require, module){
exports.empty = require('./empty')
exports.barrier = require('./barrier')
exports.pipe = require('./pipe')
exports.columns = require('./columns')
exports.hexagon = require('./hexagon')
exports.octagon = require('./octagon')
exports.triangles = require('./triangles')
exports.trianglesattract = require('./triangles-attract')
exports.trianglesmini = require('./triangles-mini')
exports.diamond = require('./diamond')
exports.breakout = require('./breakout')
exports.diagonalblocks = require('./diagonal-blocks')
exports.diagonalattract = require('./diagonal-attract')
exports.centerattract = require('./center-attract')
exports.deathballblocks = require('./deathball-blocks')
exports.tridiamonds = require('./tridiamonds')
exports.trianglesbarrier = require('./triangles-barrier')
exports.arrows = require('./arrows')
exports.diagonalrocks = require('./diagonal-rocks')
exports.diamondsnake = require('./diamond-snake')

// random (= [all sets...])
exports.random = Object.keys(exports);
});
require.register("slam/lib/levels/sets/empty.js", function(exports, require, module){
module.exports = {
  obstacles: [],
  forces: [],
  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/barrier.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [

   {id: 'block-rect', destroyable:true,  size: [2,1], x: hw, y: us*10 },
   {id: 'block-rect', destroyable:true,  size: [2,1], x: hw, y: us*11 },
   {id: 'block-rect', destroyable:false, size: [2,1], x: hw, y: us*12 },
   {id: 'block-rect', destroyable:true,  size: [2,1], x: hw, y: us*13 },
   {id: 'block-rect', destroyable:true,  size: [2,1], x: hw, y: us*14 },
   {id: 'block-rect', destroyable:false, size: [2,1], x: hw, y: us*15 },
   {id: 'block-rect', destroyable:true,  size: [2,1], x: hw, y: us*16 },
   {id: 'block-rect', destroyable:true,  size: [2,1], x: hw, y: us*17 },

  ],

  forces: [],

  positions: [
    {x: hw-us*3, y: us*10},
    {x: hw-us*3, y: us*13},
    {x: hw-us*3, y: us*16},
    {x: hw+us*3, y: us*10},
    {x: hw+us*3, y: us*13},
    {x: hw+us*3, y: us*16}
  ]
}
});
require.register("slam/lib/levels/sets/pipe.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [

   {id: 'block-rect', destroyable:false, size: [2,8], x: hw-us*3, y: us*16 },
   {id: 'block-rect', destroyable:false, size: [2,8], x: hw+us*3, y: us*10 },

  ],

  forces: [],

  positions: [
    {x: hw-us*3, y: us*10},
    {x: hw-us*3, y: us*22},
    {x: hw+us*3, y: us*4},
    {x: hw+us*3, y: us*16},
  ]
}
});
require.register("slam/lib/levels/sets/columns.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [

    {id: 'block-rect', destroyable:false, size: [1,3], x: hw, y: hh},
    {id: 'block-rect', destroyable:false, size: [1,3], x: hw-us*3, y: hh},
    {id: 'block-rect', destroyable:false, size: [1,3], x: hw-us*6, y: hh},
    {id: 'block-rect', destroyable:false, size: [1,3], x: hw+us*3, y: hh},
    {id: 'block-rect', destroyable:false, size: [1,3], x: hw+us*6, y: hh}

  ],

  forces: [],
  positions: [
    {x: hw-us*1.5, y: hh},
    {x: hw-us*4.5, y: hh},
    {x: hw-us*7.5, y: hh},
    {x: hw+us*1.5, y: hh},
    {x: hw+us*4.5, y: hh},
    {x: hw+us*7.5, y: hh}
  ]
}
});
require.register("slam/lib/levels/sets/breakout.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [

   {id: 'block-rect', destroyable:true, size: [1,1], x: us*1.5, y: ah*.5 },
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*3.5, y: ah*.5 },
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*5.5, y: ah*.5 },
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*7.5, y: ah*.5 },
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*9.5, y: ah*.5 },
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*11.5, y: ah*.5 },
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*13.5, y: ah*.5 },
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*15.5, y: ah*.5 },
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*17.5, y: ah*.5 },

   {id: 'block-rect', destroyable:true, size: [1,1], x: us*0.5, y: ah*.5 + us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*2.5, y: ah*.5 + us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*4.5, y: ah*.5 + us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*6.5, y: ah*.5 + us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*8.5, y: ah*.5 + us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*10.5, y: ah*.5 + us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*12.5, y: ah*.5 + us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*14.5, y: ah*.5 + us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*16.5, y: ah*.5 + us*3},

   {id: 'block-rect', destroyable:true, size: [1,1], x: us*0.5, y: ah*.5 - us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*2.5, y: ah*.5 - us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*4.5, y: ah*.5 - us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*6.5, y: ah*.5 - us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*8.5, y: ah*.5 - us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*10.5, y: ah*.5 - us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*12.5, y: ah*.5 - us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*14.5, y: ah*.5 - us*3},
   {id: 'block-rect', destroyable:true, size: [1,1], x: us*16.5, y: ah*.5 - us*3},

  ],

  forces: [],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/triangles.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2;

module.exports = {
  obstacles: [
    {id: 'triangle-left', x: 100, y: hh},
    {id: 'triangle-right', x: aw-100, y: hh}
  ],

  forces: [],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/triangles-attract.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2;

module.exports = {
  obstacles: [
    {id: 'triangle-left', x: 100, y: hh},
    {id: 'triangle-right', x: aw-100, y: hh}
  ],

  forces: [
    { type: 'attract', x: aw*.5, y: ah*.5, mass: 900 }
  ],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/triangles-mini.js", function(exports, require, module){
var settings = require('../../settings')
  , us = settings.data.unitSize
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2;

module.exports = {
  obstacles: [
    {id: 'triangle-left', x: 40, y: hh, size:[1,2]},
    {id: 'triangle-right', x: aw-40, y: hh, size:[1,2]}
  ],

  forces: [],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/triangles-barrier.js", function(exports, require, module){
var settings = require('../../settings')
  , us = settings.data.unitSize
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [
    {id: 'triangle-left', x: 40, y: hh, size:[1,2]},
    {id: 'triangle-right', x: aw-40, y: hh, size:[1,2]},
    {id: 'diamond', x: hw-(5*us), y: hh+(5*us), size: 1},
    {id: 'diamond', x: hw+(5*us), y: hh-(5*us), size: 1},
    {id: 'diamond', x: hw, y: hh, size: 1}
  ],

  forces: [],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/diamond.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2;

module.exports = {
  obstacles: [
    {id: 'diamond', x: hw, y: hh, size: 2}
  ],

  forces: [],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/hexagon.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2;

module.exports = {
  obstacles: [
    {id: 'hexagon', x: hw, y: hh}
  ],
  forces: [],
  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/octagon.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2;

module.exports = {
  obstacles: [
    {id: 'octagon', x: hw, y: hh}
  ],
  forces: [],
  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/arrows.js", function(exports, require, module){
var settings = require('../../settings')
  , us = settings.data.unitSize
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [
    {id: 'block-rect', destroyable:true, size: [1,4], x: us*0.5, y: hh+us*2.2 },
    {id: 'block-rect', destroyable:true, size: [1,4], x: us*1.5, y: hh+us*2.2 },

    {id: 'block-rect', destroyable:true, size: [1,4], x: aw-us*0.5, y: hh-us*2.2 },
    {id: 'block-rect', destroyable:true, size: [1,4], x: aw-us*1.5, y: hh-us*2.2 },

    {id: 'triangle-left', x: us*3-30, y: hh+us*2.2, size:[2,2]},
    {id: 'triangle-right', x: aw-us*3+30, y: hh-us*2.2, size:[2,2]}

  ],

  forces: [],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/center-attract.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [],
  forces: [
    {type: 'attract', x: hw + us*0.5, y: hh, mass: 800}
  ],
  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/diagonal-attract.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [],

  forces: [
    { type: 'attract', x: aw*.75, y: ah*.25, mass: 600, power: .5 },
    { type: 'attract', x: aw*.50 + us*.5, y: ah*.5, mass: 800, power: .4 },
    { type: 'attract', x: aw*.25, y: ah*.75, mass: 600, power: .5 }
  ],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/diagonal-blocks.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [
   {id: 'block-rect', destroyable: true, size: [2,2], x: us*4, y: hh + us*7},
   {id: 'block-rect', destroyable: true, size: [2,2], x: hw, y: hh},
   {id: 'block-rect', destroyable: true, size: [2,2], x: aw - us*4, y: hh - us*7}
  ],
  forces: [],
  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/deathball-blocks.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [

  //left
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*3 - us*.5, y: hh + us*3},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*3 - us*.5, y: hh + us*2},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*3 - us*.5, y: hh + us*1},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*3 - us*.5, y: hh},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*3 - us*.5, y: hh - us*1},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*3 - us*.5, y: hh - us*2},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*3 - us*.5, y: hh - us*3},

  //right
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*3 + us*.5, y: hh + us*3},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*3 + us*.5, y: hh + us*2},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*3 + us*.5, y: hh + us*1},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*3 + us*.5, y: hh},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*3 + us*.5, y: hh - us*1},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*3 + us*.5, y: hh - us*2},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*3 + us*.5, y: hh - us*3},

   //far
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*2 - us*.5, y: hh - us*3},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*1 - us*.5, y: hh - us*3},

   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*1+us*.5, y: hh - us*3},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*2+us*.5, y: hh - us*3},

   //close
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*2 - us*.5, y: hh + us*3},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw-us*1 - us*.5, y: hh + us*3},

   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*1+us*.5, y: hh + us*3},
   {id: 'block-rect', destroyable: true, size: [1,1], x: hw+us*2+us*.5, y: hh + us*3},

  ],
  forces: [],
  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    // {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/tridiamonds.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [
    {id: 'diamond', x: hw, y: hh, size: 2},
    
    // {id: 'triangle-left', x: 40, y: hh, size:[1,2]},
    // {id: 'triangle-right', x: aw-40, y: hh, size:[1,2]}

    {id: 'diamond', x: us*3, y: hh+(us*6), size: 1},
    {id: 'diamond', x: aw-us*3, y: hh-(us*6), size: 1}

    // {id: 'triangle-left', x: 40+us*2, y: hh+(us*6), size:[1,2]},
    // {id: 'triangle-right', x: aw-(us*2), y: hh-(us*12), size:[1,2]}
  ],

  forces: [],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/diagonal-rocks.js", function(exports, require, module){
var settings = require('../../settings')
  , us = settings.data.unitSize
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [
    {id: 'triangle-left', x: 40, y: hh, size:[1,2]},
    {id: 'triangle-right', x: aw-40, y: hh, size:[1,2]},
    {id: 'diamond', x: hw, y: hh, size: 2}
  ],

  forces: [],

  positions: [
    {x: 200, y: 200},
    {x: 850, y: 1700},
    {x: 850, y: 700},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/sets/diamond-snake.js", function(exports, require, module){
var settings = require('../../settings')
  , aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2
  , us = settings.data.unitSize;

module.exports = {
  obstacles: [
    {id: 'diamond', x: hw, y: hh + (us * 5), size: 2},
    {id: 'diamond', x: hw, y: hh - (us * 5), size: 2},
    {id: 'triangle-left', x: hw + us - 45, y: hh + us*1.5, size:[1.5,1.5]},
    {id: 'triangle-right', x: hw - us + 45, y: hh - us*1.5 , size:[1.5,1.5]},

    {id: 'triangle-left', x: 40, y: hh+us*1.5, size:[1,2]},
    {id: 'triangle-right', x: aw-40, y: hh-us*1.5, size:[1,2]}
  ],

  positions: [
    {x: hw-us*3, y: us*10},
    {x: hw-us*3, y: us*22},
    {x: hw+us*3, y: us*4},
    {x: hw+us*3, y: us*16}
  ],

  forces: []

}
});
require.register("slam/lib/levels/single/index.js", function(exports, require, module){
module.exports = [
  require('./level1'),
  require('./level2'),
  require('./level3'),
  require('./level4'),
  require('./level5'),
  require('./level6'),
  require('./level7'),
  require('./level8'),
  require('./level9'),
  require('./level10'),
  require('./level11'),
  require('./level12'),
]
});
require.register("slam/lib/levels/single/level1.js", function(exports, require, module){
module.exports = {
  maxExtras:3,
  ai: {
    maxSpeed: 10,
    reaction: 0.2,
    viewRange: 0.4,
    confusion:1
  },

  puck: {
    speed: 1.3,
    speedup: 0.1,
    maxspeed: 2
  },

  player: {
    shields: 1
  },

  set: 'empty',

  extras: [
    {id: 'extralife', round:2, probability: 10},
    {id: 'ghostball', round:4, probability: 6},
    {id: 'paddleresize'}
  ]
}

});
require.register("slam/lib/levels/single/level2.js", function(exports, require, module){
module.exports = {

  minSpawnTime:2,
  maxSpawnTime:6,
  maxExtras:3,

  ai: {
    maxSpeed: 10,
    reaction: 0.2,
    viewRange: 0.6,
    confusion:0.8
  },

  puck: {
    speed: 1.3,
    speedup: 0.1,
    maxspeed: 2
  },

  player: {
    shields: 2
  },

  set: 'empty',

  extras: [
    {id: 'extralife', probability: 40, simultaneous:2},
    {id: 'multiball', probability: 60,simultaneous:1},
    {id: 'fireball', round:2, probability: 40},
    {id: 'fog', round: 3, probability: 40},
    {id: 'ghostball', round: 4, probability: 60}
  ]
}

});
require.register("slam/lib/levels/single/level3.js", function(exports, require, module){
module.exports = {
  minSpawnTime:3,
  maxSpawnTime:6,
  maxExtras:4,
  ai: {
    maxSpeed: 10,
    reaction: 0.2,
    viewRange: 0.5,
    confusion:0.7
  },

  puck: {
    speed: 1.3,
    speedup: 0.1,
    maxspeed: 2
  },

  player: {
    shields: 3
  },

  set: 'triangles',

  extras: [
    {id: 'extralife',probability: 6},
    {id: 'timebomb',probability: 6, round:2},
    {id: 'laser',probability: 12, round:3},
    {id: 'ghostball',probability: 6, round:2},
    {id: 'fog',probability: 1},
  ],

  positions: [
    {x: 200, y: 200},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}

});
require.register("slam/lib/levels/single/level4.js", function(exports, require, module){
module.exports = {
  maxExtras:4,
  
  ai: {
    maxSpeed: 10,
    reaction: 0.3,
    viewRange: 0.5,
    confusion:0.5
  },

  puck: {
    speed: 1.5,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 4
  },

  set: 'centerattract',

  extras: [
    {id: 'extralife', probability: 20},
    {id: 'laser', probability: 15},
    {id: 'bulletproof', duration: 10, probability: 10},
    {id: 'ghostball',round:4, probability: 10},
    {id: 'timebomb', round:2, probability: 10}
  ]
}

});
require.register("slam/lib/levels/single/level5.js", function(exports, require, module){
module.exports = {
  ai: {
    maxSpeed: 10,
    reaction: 0.34,
    viewRange: 0.5,
    confusion:0.5
  },

  puck: {
    speed: 1.6,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 5
  },

  set: 'diagonalattract',

  extras: [
    {id: 'extralife',probability: 5},
    {id: 'fog', duration: 5},
    {id: 'fireball',probability: 10},
    {id: 'ghostball',probability: 5},
    {id: 'paddleresize', round:2, probability: 10},
    {id: 'laser', round:3, probability: 10}
  ]
}

});
require.register("slam/lib/levels/single/level6.js", function(exports, require, module){
module.exports = {
  minSpawnTime:3,
  maxSpawnTime:6,
  maxExtras:3,

  ai: {
    maxSpeed: 15,
    reaction: 0.25,
    viewRange: 0.3,
    confusion:0.5
  },

  puck: {
    speed: 1.5,
    speedup: .1,
    maxspeed: 2
  },

  player: {
    shields: 6
  },

  set: 'hexagon',

  extras: [
    {id: 'fireball',probability: 5},
    {id: 'extralife',probability: 10},
    {id: 'fog', duration: 6,probability: 5},
    {id: 'bulletproof',probability: 5},
    
  ]
}
});
require.register("slam/lib/levels/single/level7.js", function(exports, require, module){
module.exports = {
  minSpawnTime:3,
  maxSpawnTime:5,
  ai: {
    maxSpeed: 19,
    reaction:0.3,
    viewRange:0.3,
    confusion:0.5
  },

  puck: {
    speed: 1.7,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 7
  },

  set: 'diagonalblocks',

  extras: [
    {id: 'extralife',probability: 10},
    {id: 'laser',probability: 20},
    {id: 'paddleresize',probability: 20},
    {id: 'fog', duration: 5,probability: 5},
    {id: 'fireball',probability: 10},
    {id: 'ghostball',probability: 5},
    {id: 'bulletproof', duration: 10,probability: 10}
  ]
}

});
require.register("slam/lib/levels/single/level8.js", function(exports, require, module){
module.exports = {
  ai: {
    maxSpeed: 19,
    reaction:0.3,
    viewRange:0.3,
    confusion:0.45
  },

  puck: {
    speed: 1.8,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 8
  },

  set: 'diamond',

  extras: [
    {id: 'extralife'},
    {id: 'fog', duration: 10},
    {id: 'fireball'},
    {id: 'ghostball'},
    {id: 'bulletproof', duration: 10}, // duration in seconds (buggy)
    {id: 'mirroredcontrols', duration: 10}
  ]
}

});
require.register("slam/lib/levels/single/level9.js", function(exports, require, module){
module.exports = {
  ai: {
    maxSpeed: 13,
    reaction: 0.3,
    viewRange: 0.6,
    confusion:0.5
  },

  puck: {
    speed: 1.6,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 9
  },

  set: 'breakout',

  extras: [
    {id: 'extralife'},
    {id: 'fog', duration: 10},
    {id: 'multiball'},
    {id: 'fireball'},
    {id: 'ghostball'},
    {id: 'bulletproof', duration: 5}, // duration in seconds
    {id: 'mirroredcontrols', duration: 10} // duration in seconds
  ]
}

});
require.register("slam/lib/levels/single/level10.js", function(exports, require, module){
var settings = require('../../settings');

var aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2;

module.exports = {
  maxExtras: 4,
  ai: {
    maxSpeed: 17,
    reaction: 0.3,
    viewRange: 0.5,
    confusion: 0.5
  },

  puck: {
    speed: 1.6,
    speedup: 0.1,
    maxspeed: 2.6
  },

  player: {
    shields: 10
  },

  set: 'deathballblocks',

  extras: [
    {id: 'deathball',round:3, probability: 5, duration:6, position:{x: hw, y:hh}},
    {id: 'extralife',probability: 2},
    {id: 'timebomb',probability: 2},
    {id: 'fireball',probability: 2},
    {id: 'ghostball',round:2,probability: 2},
    {id: 'bulletproof', duration: 10, round:2, probability: 2} // duration in seconds (buggy)
  ]
}
});
require.register("slam/lib/levels/single/level11.js", function(exports, require, module){

module.exports = {
  ai: {
    maxSpeed: 15,
    reaction: 0.2,
    viewRange: 0.5,
    confusion: 0.5
  },

  puck: {
    speed: 1.7,
    speedup: 0.2,
    maxspeed: 2.3
  },

  player: {
    shields: 11
  },

  set: 'diamondsnake',

  extras: [
    {id: 'extralife'},
    {id: 'laser'},
    {id: 'fog'},
    {id: 'paddleresize'},
    {id: 'mirroredcontrols'},
    {id: 'ghostball',round:2},
    {id: 'bulletproof', round:2},
    {id: 'timebomb', round:3},
    {id: 'laser', round:3}
  ]
}

});
require.register("slam/lib/levels/single/level12.js", function(exports, require, module){

module.exports = {
  ai: {
    maxSpeed: 15,
    reaction: 0.2,
    viewRange: 0.5,
    confusion: 0.5
  },

  puck: {
    speed: 1.7,
    speedup: 0.2,
    maxspeed: 2.3
  },

  player: {
    shields: 12
  },

  set: 'random',

  extras: [
    {id: 'extralife'},
    {id: 'laser'},
    {id: 'fog'},
    {id: 'paddleresize'},
    {id: 'mirroredcontrols'},
    {id: 'ghostball',round:2},
    {id: 'bulletproof', round:2},
    {id: 'timebomb', round:3},
    {id: 'laser', round:3}
  ]
}

});
require.register("slam/lib/levels/multi/index.js", function(exports, require, module){
module.exports = [
  require('./level1'),
  require('./level2'),
  require('./level3'),
  require('./level4'),
  require('./level5'),
  require('./level6'),
  require('./level7'),
  require('./level8'),
  require('./level9'),
  require('./level10'),
  require('./level11')
]
});
require.register("slam/lib/levels/multi/level1.js", function(exports, require, module){
module.exports = {
  maxExtras: 2,
  minSpawnTime: 4,
  maxSpawnTime: 7,

  ai: {
    maxSpeed: 10,
    reaction: 0.2,
    viewRange: 0.4,
    confusion:1
  },

  puck: {
    speed: 1.5,
    speedup: 0.1,
    maxspeed: 2
  },

  player: {
    shields: 1
  },

  set: 'arrows',

  extras: [
    {id: 'extralife', probability: 10},
    {id: 'timebomb', probability: 7},
    {id: 'ghostball', probability: 7},
    {id: 'paddleresize', round:2, probability: 10 },
    {id: 'bulletproof', duration: 6},
    {id: 'laser', round:2,probability: 10 },
    {id: 'fog', round: 3, probability: 7},
    {id: 'timebomb', round:3}
  ]
}

});
require.register("slam/lib/levels/multi/level2.js", function(exports, require, module){
module.exports = {
  maxExtras: 2,
  minSpawnTime: 3,
  maxSpawnTime: 6,

  ai: {
    maxSpeed: 10,
    reaction: 0.3,
    viewRange: 0.5,
    confusion: 0.5
  },

  puck: {
    speed: 1.5,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 2
  },

  set: 'diagonalrocks',

  extras: [
    {id: 'extralife', probability: 5},
    {id: 'laser', probability: 7},
    {id: 'ghostball', probability: 3},
    {id: 'bulletproof', duration: 5},
    {id: 'timebomb', probability: 8},
    {id: 'paddleresize', probability: 7 },
    {id: 'mirroredcontrols', round: 5, duration: 15} // duration in seconds
  ]
}
});
require.register("slam/lib/levels/multi/level3.js", function(exports, require, module){
module.exports = {
  minSpawnTime: 3,
  maxSpawnTime: 6,
  maxExtras: 3,

  ai: {
    maxSpeed: 10,
    reaction: 0.2,
    viewRange: 0.5,
    confusion: 0.7
  },

  puck: {
    speed: 1.5,
    speedup: 0.1,
    maxspeed: 2
  },

  player: {
    shields: 3
  },

  set: 'trianglesbarrier',

  extras: [
    {id: 'extralife', probability: 6},
    {id: 'timebomb', probability: 6},
    {id: 'ghostball', probability: 3},
    {id: 'fog', probability: 3},
    {id: 'paddleresize', probability: 10 },
    {id: 'mirroredcontrols', round: 5, duration: 15}, // duration in seconds
    {id: 'bulletproof', duration: 10, probability: 5}
  ]
}

});
require.register("slam/lib/levels/multi/level4.js", function(exports, require, module){

module.exports = {
  minSpawnTime: 3,
  maxSpawnTime: 6,
  maxExtras:4,

  ai: {
    maxSpeed: 10,
    reaction: 0.2,
    viewRange: 0.6,
    confusion: 0.8
  },

  puck: {
    speed: 1.6,
    speedup: .1,
    maxspeed: 2.2
  },

  player: {
    shields: 4
  },

  // set: 'pipe',
  set: 'tridiamonds',

  extras: [
    // {id: 'extralife', probability: 10},
    {id: 'ghostball', probability: 7},
    {id: 'paddleresize', round:2, probability: 10 },
    {id: 'fog', probability: 7},
    {id: 'mirroredcontrols', round: 4, duration: 15}, // duration in seconds
    {id: 'bulletproof', duration: 10, probability: 5},
    {id: 'timebomb', round: 2, probability: 6}
  ]
}

});
require.register("slam/lib/levels/multi/level5.js", function(exports, require, module){
module.exports = {
  ai: {
    maxSpeed: 13,
    reaction: 0.34,
    viewRange: 0.5,
    confusion:0.4
  },

  puck: {
    speed: 1.6,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 5
  },

  set: 'octagon',

  extras: [
    {id: 'extralife',probability: 5},
    {id: 'fog', duration: 5},
    // {id: 'fireball',probability: 10},
    {id: 'ghostball',probability: 5},
    {id: 'paddleresize', round:2, probability: 10},
//    {id: 'laser', round:3, probability: 10}
  ]
}

});
require.register("slam/lib/levels/multi/level6.js", function(exports, require, module){
module.exports = {
  maxExtras: 4,
  minSpawnTime: 4,
  maxSpawnTime: 7,

  ai: {
    maxSpeed: 10,
    reaction: 0.2,
    viewRange: 0.4,
    confusion:1
  },

  puck: {
    speed: 1.5,
    speedup: 0.1,
    maxspeed: 2
  },

  player: {
    shields: 6
  },

  set: 'diamondsnake',

  extras: [
    {id: 'extralife', probability: 10},
    {id: 'timebomb', probability: 7},
    {id: 'ghostball', probability: 7},
    {id: 'paddleresize', round:2, probability: 10 },
    {id: 'bulletproof', duration: 6},
    {id: 'laser', round:2,probability: 10 },
    {id: 'fog', round: 3, probability: 7},
    {id: 'timebomb', round:3}
  ]
}

});
require.register("slam/lib/levels/multi/level7.js", function(exports, require, module){
module.exports = {
  minSpawnTime:3,
  maxSpawnTime:5,
  ai: {
    maxSpeed: 19,
    reaction:0.3,
    viewRange:0.3,
    confusion:0.5
  },

  puck: {
    speed: 1.7,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 7
  },

  set: 'diagonalblocks',

  extras: [
    {id: 'extralife',probability: 10},
//    {id: 'laser',probability: 20},
    {id: 'paddleresize',probability: 20},
    {id: 'fog', duration: 5,probability: 5},
    // {id: 'fireball',probability: 10},
    {id: 'ghostball',probability: 5},
    {id: 'bulletproof', duration: 10,probability: 10}
  ]
}

});
require.register("slam/lib/levels/multi/level8.js", function(exports, require, module){
module.exports = {
  ai: {
    maxSpeed: 19,
    reaction:0.3,
    viewRange:0.2,
    confusion:0.7
  },

  puck: {
    speed: 1.4,
    speedup: .1,
    maxspeed: 1.9
  },

  player: {
    shields: 8
  },

  set: 'diamond',

  extras: [
    {id: 'extralife'},
    {id: 'fog', duration: 10},
    {id: 'laser'},
    {id: 'ghostball'},
    {id: 'bulletproof', duration: 10}, // duration in seconds (buggy)
    {id: 'mirroredcontrols', duration: 10}
  ]
}

});
require.register("slam/lib/levels/multi/level9.js", function(exports, require, module){
module.exports = {
  ai: {
    maxSpeed: 15,
    reaction: 0.3,
    viewRange: 0.7,
    confusion:0.5
  },

  puck: {
    speed: 1.6,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 9
  },

  set: 'breakout',

  extras: [
    {id: 'extralife'},
    {id: 'fog', duration: 10},
    {id: 'multiball'},
    // {id: 'fireball'},
    {id: 'ghostball'},
    {id: 'bulletproof', duration: 5}, // duration in seconds (buggy)
    {id: 'mirroredcontrols', duration: 10} // duration in seconds
  ]
}

});
require.register("slam/lib/levels/multi/level10.js", function(exports, require, module){
var settings = require('../../settings');

var aw = settings.data.arenaWidth
  , ah = settings.data.arenaHeight
  , hw = aw/2
  , hh = ah/2;

module.exports = {
  maxExtras:4,
  ai: {
    maxSpeed: 18,
    reaction: 0.3,
    viewRange: 0.5,
    confusion:0.5
  },

  puck: {
    speed: 1.6,
    speedup: .1,
    maxspeed: 2.3
  },

  player: {
    shields:10
  },

  set: 'deathballblocks',

  extras: [
    {id: 'deathball', probability: 15, duration:6, position: {x: hw, y: hh}},
    {id: 'extralife',probability: 2},
    {id: 'timebomb',probability: 2},
    // {id: 'fireball',round:2,probability: 2},
    {id: 'ghostball',round:2,probability: 2},
    {id: 'bulletproof', duration: 10,round:2,probability: 2}, // duration in seconds (buggy)

  ],

  /*positions: [
    {x: hw, y: hh}
  ]*/
}
});
require.register("slam/lib/levels/multi/level11.js", function(exports, require, module){

module.exports = {
  ai: {
    maxSpeed: 15,
    reaction: 0.2,
    viewRange: 0.5,
    confusion:0.5
  },

  puck: {
    speed: 1.4,
    speedup: .1,
    maxspeed: 2.0
  },

  player: {
    shields:11
  },

  set: 'random',

  extras: [
    {id: 'extralife'},
    {id: 'laser'},
    {id: 'fog'},
    {id: 'paddleresize'},
    {id: 'mirroredcontrols'},
    {id: 'ghostball',round:2},
    {id: 'bulletproof', round:2},
    {id: 'timebomb', round:3},
  ]
}

});
require.register("slam/lib/levels/mobile/index.js", function(exports, require, module){
// TODO write other levels instead of using singleplayers
module.exports = [
  require('./level1'),
  require('./level2'),
  require('./level3'),
  require('./level4'),
  require('./level5'),
  require('./level6'),
  require('./level7')
]
});
require.register("slam/lib/levels/mobile/level1.js", function(exports, require, module){
module.exports = {
  maxExtras:3,
  ai: {
    maxSpeed: 10,
    reaction: 0.2,
    viewRange: 0.4,
    confusion:.8
  },

  puck: {
    speed: 1.5,
    speedup: .1,
    maxspeed: 2
  },

  player: {
    shields: 1
  },

  set: 'empty',

  extras: [
    {id: 'extralife', round:1, probability: 5},
    {id: 'multiball', round:1, probability: 7},
    {id: 'ghostball', round:1, probability: 7},
  ]
}
});
require.register("slam/lib/levels/mobile/level2.js", function(exports, require, module){
module.exports = {

  minSpawnTime:2,
  maxSpawnTime:6,
  maxExtras:3,

  ai: {
    maxSpeed: 10,
    reaction: 0.2,
    viewRange: 0.6,
    confusion:0.8
  },

  puck: {
    speed: 1.5,
    speedup: .1,
    maxspeed: 2
  },

  player: {
    shields: 2
  },

  set: 'empty',

  extras: [
    {id: 'extralife', probability: 4},
    {id: 'multiball', probability: 4},
    {id: 'laser', probability: 4},
    {id: 'fog', round: 3, probability: 4},
    {id: 'bulletproof', round: 3, probability: 4},
    {id: 'timebomb', round: 2, probability: 4}
  ]
}

});
require.register("slam/lib/levels/mobile/level3.js", function(exports, require, module){

module.exports = {
  maxExtras: 4,
  ai: {
    maxSpeed: 10,
    reaction: 0.3,
    viewRange: 0.5,
    confusion:0.5
  },

  puck: {
    speed: 1.5,
    speedup: .1,
    maxspeed: 2.5
  },

  player: {
    shields: 3
  },

  set: 'centerattract',

  extras: [
    {id: 'extralife', probability: 20},
    {id: 'laser', probability: 15},
    {id: 'bulletproof', duration: 10, probability: 10},
    {id: 'ghostball',round:4, probability: 10},
    {id: 'timebomb', round:2, probability: 10}
  ]
}

});
require.register("slam/lib/levels/mobile/level4.js", function(exports, require, module){
module.exports = {
  minSpawnTime:3,
  maxSpawnTime:6,
  maxExtras:4,
  ai: {
    maxSpeed: 8,
    reaction: 0.3,
    viewRange: 0.5,
    confusion:0.7
  },

  puck: {
    speed: 1.3,
    speedup: 0.1,
    maxspeed: 2
  },

  player: {
    shields: 3
  },

  set: 'triangles',

  extras: [
    {id: 'extralife',probability: 6},
    {id: 'laser',probability: 8},
    {id: 'paddleresize',probability: 12, round:3},
    {id: 'ghostball',probability: 6, round:2},
    {id: 'fog',probability: 1}
  ],

  positions: [
    {x: 200, y: 200},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/mobile/level5.js", function(exports, require, module){
module.exports = {
  maxExtras:4,
  ai: {
    maxSpeed: 10,
    reaction: 0.3,
    viewRange: 0.5,
    confusion:0.4
  },

  puck: {
    speed: 2,
    speedup: 0.13,
    maxspeed: 2.7
  },

  player: {
    shields: 6
  },

  set: 'empty',

  extras: [
    {id: 'extralife', probability: 4},
    {id: 'fog', duration: 3},
    {id: 'ghostball', probability: 2},
    {id: 'multiball', probability: 3},
    {id: 'laser', probability: 6},
    {id: 'fireball', probability: 5},
    {id: 'timebomb', probability: 5},
    {id: 'bulletproof', probability: 3}

  ],
  positions: [
    {x: 850, y: 2000},
    {x: 850, y: 200},

    {x: 1200, y: 1227},
    {x: 200, y: 1227}
  ]
}

});
require.register("slam/lib/levels/mobile/level6.js", function(exports, require, module){
module.exports = {
  ai: {
    maxSpeed: 12,
    reaction: 0.25,
    viewRange: 0.3,
    confusion: 0.5
  },

  puck: {
    speed: 1.5,
    speedup: .1,
    maxspeed: 2
  },

  player: {
    shields: 6
  },

  set: 'octagon',

  extras: [
    {id: 'extralife', probability: 3},
    {id: 'fog', duration: 10, probability: 2},
    {id: 'bulletproof', probability:3},
    {id: 'ghostball', probability: 4}
  ],

  positions: [
    {x: 200, y: 200},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.register("slam/lib/levels/mobile/level7.js", function(exports, require, module){
module.exports = {
  ai: {
    maxSpeed: 15,
    reaction: 0.25,
    viewRange: 0.3,
    confusion:0.5
  },

  puck: {
    speed: 1.5,
    speedup: 0.1,
    maxspeed: 2
  },

  player: {
    shields: 6
  },

  set: ['octagon','empty','centerattract','triangles'],

  extras: [
    {id: 'extralife', probability: 5},
    {id: 'fog', duration: 10, probability: 2},
    {id: 'bulletproof', probability:5},
    {id: 'ghostball', probability: 4},
    {id: 'multiball', probability: 4},
    {id: 'laser', probability: 4},
    {id: 'fireball', probability: 4},
    {id: 'timebomb', probability: 4}

  ],
  positions: [
    {x: 200, y: 200},
    {x: 200, y: 2000},
    {x: 1400, y: 200},
    {x: 1400, y: 2000}
  ]
}
});
require.alias("component-emitter/index.js", "slam/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-mousetrap/index.js", "slam/deps/mousetrap/index.js");

require.alias("component-cookie/index.js", "slam/deps/cookie/index.js");

require.alias("component-jquery/index.js", "slam/deps/jquery/index.js");

require.alias("component-preloader/index.js", "slam/deps/preloader/index.js");
require.alias("visionmedia-batch/index.js", "component-preloader/deps/batch/index.js");
require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-inherit/index.js", "component-preloader/deps/inherit/index.js");

require.alias("publicclass-rtc/index.js", "slam/deps/rtc/index.js");
require.alias("publicclass-rtc/signal/app-channel.js", "slam/deps/rtc/signal/app-channel.js");
require.alias("publicclass-rtc/signal/web-socket.js", "slam/deps/rtc/signal/web-socket.js");
require.alias("component-emitter/index.js", "publicclass-rtc/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("visionmedia-debug/index.js", "publicclass-rtc/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "publicclass-rtc/deps/debug/debug.js");

require.alias("publicclass-request-animation-frame/index.js", "slam/deps/request-animation-frame/index.js");

require.alias("publicclass-now/index.js", "slam/deps/now/index.js");

require.alias("publicclass-geom/index.js", "slam/deps/geom/index.js");
require.alias("publicclass-geom-vec/index.js", "publicclass-geom/deps/geom-vec/index.js");

require.alias("publicclass-geom-mat/index.js", "publicclass-geom/deps/geom-mat/index.js");

require.alias("publicclass-geom-poly/index.js", "publicclass-geom/deps/geom-poly/index.js");
require.alias("publicclass-geom-vec/index.js", "publicclass-geom-poly/deps/geom-vec/index.js");

require.alias("publicclass-copy/index.js", "slam/deps/copy/index.js");
require.alias("component-type/index.js", "publicclass-copy/deps/type/index.js");

require.alias("publicclass-stash/index.js", "slam/deps/stash/index.js");

require.alias("publicclass-netchan/index.js", "slam/deps/netchan/index.js");

require.alias("publicclass-latency/index.js", "slam/deps/latency/index.js");
require.alias("component-standard-deviation/index.js", "publicclass-latency/deps/standard-deviation/index.js");
require.alias("component-variance/index.js", "component-standard-deviation/deps/variance/index.js");
require.alias("component-to-function/index.js", "component-variance/deps/to-function/index.js");

require.alias("component-mean/index.js", "component-variance/deps/mean/index.js");
require.alias("component-to-function/index.js", "component-mean/deps/to-function/index.js");

require.alias("publicclass-median/index.js", "publicclass-latency/deps/median/index.js");

require.alias("publicclass-base64-arraybuffer/index.js", "slam/deps/base64-arraybuffer/index.js");

require.alias("visionmedia-debug/index.js", "slam/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "slam/deps/debug/debug.js");

require.alias("ecarter-css-emitter/index.js", "slam/deps/css-emitter/index.js");
require.alias("component-emitter/index.js", "ecarter-css-emitter/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-event/index.js", "ecarter-css-emitter/deps/event/index.js");

