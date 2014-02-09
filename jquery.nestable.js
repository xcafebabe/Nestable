/*!
 * Nestable jQuery Plugin - Copyright (c) 2012 David Bushell - http://dbushell.com/
 * Dual-licensed under the BSD or MIT licenses
 */
var nestable;
;(function(window, document, undefined)
{
	/* check for touch and change setup if needed */
    var hasTouch = 'ontouchstart' in window;
    // var nestableCopy;
    /**
     * Detect CSS pointer-events property
     * events are normally disabled on the dragging element to avoid conflicts
     * https://github.com/ausi/Feature-detection-technique-for-pointer-events/blob/master/modernizr-pointerevents.js
     */
    var hasPointerEvents = (function()
    {
        var el    = document.createElement('div'),
            docEl = document.documentElement;
        if (!('pointerEvents' in el.style)) {
            return false;
        }
        el.style.pointerEvents = 'auto';
        el.style.pointerEvents = 'x';
        docEl.appendChild(el);
        var supports = window.getComputedStyle && window.getComputedStyle(el, '').pointerEvents === 'auto';
        docEl.removeChild(el);
        return !!supports;
    })();
	 
	 // .css replacement
	//  +  function getStyle(el, styleProp) {
	//   +    if (el.currentStyle)
	//   +      var x = el.currentStyle[styleProp];
	//   +    else if (window.getComputedStyle)
	//   +      var x = document.defaultView.getComputedStyle(el, null)
	//   +                .getPropertyValue(styleProp);
	//   +    return x;
	// }

    var eStart  = hasTouch ? 'touchstart'  : 'mousedown',
        eMove   = hasTouch ? 'touchmove'   : 'mousemove',
        eEnd    = hasTouch ? 'touchend'    : 'mouseup',
        eCancel = hasTouch ? 'touchcancel' : 'mouseup';

    var fn, defaults = {
            listNodeName    : 'ol',
            itemNodeName    : 'li',
            rootClass       : 'dd',
            listClass       : 'dd-list',
            itemClass       : 'dd-item',
            dragClass       : 'dd-dragel',
            handleClass     : 'dd-handle',
            collapsedClass  : 'dd-collapsed',
            placeClass      : 'dd-placeholder',
            noDragClass     : 'dd-nodrag',
            noChildrenClass : 'dd-nochildren',
            emptyClass      : 'dd-empty',
            expandBtnHTML   : '<button data-action="expand" type="button">Expand</button>',
            collapseBtnHTML : '<button data-action="collapse" type="button">Collapse</button>',
            group           : 0,
            maxDepth        : 5,
            threshold       : 20,
            reject          : [],
            dropCallback    : null,
				ffn				 : {
					/* selector */
					getById: function(s){
						return document.getElementById(s);
					},
					getByTag: function(s, p){
						
					},
					/* utility */
					// Add class to element
					// IE8+
					addClass: function( el, className)
					{
						if( className !== undefined && className.trim().length > 0 )
						{
							className = Array.prototype.slice.call (arguments, 1);
							for (var i = className.length; i--;) 
							{
								className[i] = className[i].trim ().split (/\s*,\s*|\s+/);
								for (var j = className[i].length; j--;)
								{
									if (el.classList)
									{
								  		el.classList.add(className[i][j]);
									}
									else
									{
								  		el.className += ' ' + className[i][j]
									}
								}
							}
						}
					},
					// Remove class from element
					// IE8+
					removeClass: function( el, className)
					{
						if( className !== undefined && className.trim().length > 0 )
						{
							className = Array.prototype.slice.call (arguments, 1);
							for (var i = className.length; i--;) 
							{
								className[i] = className[i].trim ().split (/\s*,\s*|\s+/);
								for (var j = className[i].length; j--;)
								{
									if (el.classList)
									{
									  el.classList.remove(className[i][j])
									}
									else
									{
										el.className = el.className.replace(new RegExp('(^| )' + className[i][j].split(' ').join('|') + '( |$)', 'gi'), ' ')
									}
								}
							}
						}
					},
					// Check if element has class
					// IE8+
					hasClass: function(el, className)
					{
						if (el.classList)
						{
							if(el.classList.contains(className))
							{
								return true;
							}
							return false;
						}
						else
						{
							if(new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className) )
							{
								return true;
							}
							return false;
						}
					},
					/* createElement */
					createElement: function( ){
						
					},
					// each
					each: function( elements, fn )
					{
						if( typeof(elements) === 'string'){ 
							elements = document.querySelectorAll(elements); 
						}
						Array.prototype.slice.call(elements,0).forEach(function(el, i){
							fn(el);
						});
					},
					/* extend fn */
					extend: function(){
						for(var i=0; i<arguments.length; i++){
							for(var key in arguments[i]){
								if(arguments[i].hasOwnProperty(key)){
									arguments[0][key] = arguments[i][key];
								}
							}
						}
						return arguments[0];
					}
				}
        };
		
		var isList = function(v){
			return v && v.length != null && !(typeof v == 'string') && !(v && v['nodeType']) && !(typeof v == 'function' && !v['item']) && v !== window;
		}
		
		var each = function(list, cb){
			if (isList(list)){
				for (var i = 0; i < list.length; i++){
					cb(list[i], i);
				}
			} else if (list != null) {
				cb(list, 0);
			}
			return list;	
		}
		
		var hasClass = function(elem, clss){
			return (' ' + elem.className + ' ').indexOf(' '+clss+' ') > -1;
		}
		
		var closest = function(elem, selector) {

		   var matchesSelector = elem.matches || elem.webkitMatchesSelector || elem.mozMatchesSelector || elem.msMatchesSelector;

		    while (elem) {
		        if (matchesSelector.bind(elem)(selector)) {
		            return elem;
		        } else {
		            elem = elem.parentNode;
		        }
		    }
		    return false;
		}
	
		var Plugin = function(element, options)
		{
			this.w = document;
			this.el = element;
			this.options = defaults.ffn.extend({}, defaults, options);
			fn = this.options.fn;
			this.init();
		}

    Plugin.prototype = {

        init: function()
        {
            var list = this;

            list.reset();

            // list.el.data('nestable-group', this.options.group);
				// javascript (get set data attribute)
				// string = element.dataset.camelCasedName;
				// element.dataset.camelCasedName = string;
				list.el.setAttribute('data-nestable-group', this.options.group);
            list.placeEl = document.createElement('div');
				defaults.ffn.addClass(list.placeEl, list.options.placeClass);
				
				// list.el[0].querySelectorAll(list.options.itemNodeName)
				// jquery this.el.find(list.options.itemNodeName)
            // each(list.el.select('list.options.itemNodeName', true), function(k, el) {
            //     list.setParent($(el));
            // });

            list.el.addEventListener('click', 'button', function(e) 
				{
                if (list.dragEl || (!hasTouch && e.button !== 0)) {
                    return;
                }
                var target = $(e.currentTarget),
                    action = target.data('action'),
                    item   = target.parent(list.options.itemNodeName);
                if (action === 'collapse') {
                    list.collapseItem(item);
                }
                if (action === 'expand') {
                    list.expandItem(item);
                }
            });

            var onStartEvent = function(e)
            {
                var handle = $(e.target);
                // list.nestableCopy = handle.closest('.'+list.options.rootClass).clone(true);
					 list.nestableCopy = closest(e.target, '.'+list.options.rootClass).cloneNode(true);
                
                // if (!handle.hasClass(list.options.handleClass)) {
                if (!hasClass(e.target, list.options.handleClass)) {
                    // if (handle.closest('.' + list.options.noDragClass).length) {
                    if (closest(handle, '.' + list.options.noDragClass).length) {
                        return;
                    }
                    // handle = handle.closest('.' + list.options.handleClass);
                    handle = closest(handle, '.' + list.options.handleClass);
                }
                if (!handle.length || list.dragEl || (!hasTouch && e.which !== 1) || (hasTouch && e.touches.length !== 1)) {
                    return;
                }
                e.preventDefault();
                list.dragStart(hasTouch ? e.touches[0] : e);
            };

            var onMoveEvent = function(e)
            {
                if (list.dragEl) {
                    e.preventDefault();
                    list.dragMove(hasTouch ? e.touches[0] : e);
                }
            };

            var onEndEvent = function(e)
            {
                if (list.dragEl) {
                    e.preventDefault();
                    list.dragStop(hasTouch ? e.touches[0] : e);
                }
            };

            if (hasTouch) {
                list.el[0].addEventListener(eStart, onStartEvent, false);
                window.addEventListener(eMove, onMoveEvent, false);
                window.addEventListener(eEnd, onEndEvent, false);
                window.addEventListener(eCancel, onEndEvent, false);
            } else {
                list.el.addEventListener(eStart, onStartEvent);
                list.w.addEventListener(eMove, onMoveEvent);
                list.w.addEventListener(eEnd, onEndEvent);
            }

            var destroyNestable = function()
            {
               if (hasTouch) {
                    list.el[0].removeEventListener(eStart, onStartEvent, false);
                    window.removeEventListener(eMove, onMoveEvent, false);
                    window.removeEventListener(eEnd, onEndEvent, false);
                    window.removeEventListener(eCancel, onEndEvent, false);
               } else {
                    list.el.off(eStart, onStartEvent);
                    list.w.off(eMove, onMoveEvent);
                    list.w.off(eEnd, onEndEvent);
               }

               list.el.off('click');
               list.el.unbind('destroy-nestable');

               list.el.data("nestable", null);
										
					var buttons = list.el[0].getElementsByTagName('button');
					
					$(buttons).remove();
					
            };
				list.el[0].M[0].bind('destroy-nestable', destroyNestable);
        },

        destroy: function ()
        {
            this.expandAll();
				this.el.trigger('destroy-nestable');
        },

        serialize: function()
        {
            var data,
                depth = 0,
                list  = this;
                step  = function(level, depth)
                {
                    var array = [ ],
                        items = level.children(list.options.itemNodeName);
                    items.each(function()
                    {
                        var li   = $(this),
                            item = $.extend({}, li.data()),
                            sub  = li.children(list.options.listNodeName);
                        if (sub.length) {
                            item.children = step(sub, depth + 1);
                        }
                        array.push(item);
                    });
                    return array;
                };
            data = step(list.el.find(list.options.listNodeName).first(), depth);
            return data;
        },

        reset: function()
        {
            this.mouse = {
                offsetX   : 0,
                offsetY   : 0,
                startX    : 0,
                startY    : 0,
                lastX     : 0,
                lastY     : 0,
                nowX      : 0,
                nowY      : 0,
                distX     : 0,
                distY     : 0,
                dirAx     : 0,
                dirX      : 0,
                dirY      : 0,
                lastDirX  : 0,
                lastDirY  : 0,
                distAxX   : 0,
                distAxY   : 0
            };
            this.moving     = false;
            this.dragEl     = null;
            this.dragRootEl = null;
            this.dragDepth  = 0;
            this.dragItem   = null;
            this.hasNewRoot = false;
            this.pointEl    = null;
            this.sourceRoot = null;
        },

        expandItem: function(li)
        {
            li.removeClass(this.options.collapsedClass);
            li.children('[data-action="expand"]').hide();
            li.children('[data-action="collapse"]').show();
            li.children(this.options.listNodeName).show();
				this.el.trigger('expand', [li]);
				li.trigger('expand');
        },

        collapseItem: function(li)
        {
            var lists = li.children(this.options.listNodeName);
            if (lists.length) {
                li.addClass(this.options.collapsedClass);
                li.children('[data-action="collapse"]').hide();
                li.children('[data-action="expand"]').show();
                li.children(this.options.listNodeName).hide();
            }
				this.el.trigger('collapse', [li]);
				li.trigger('collapse');
        },

        expandAll: function()
        {
            var list = this;
            list.el.find(list.options.itemNodeName).each(function() {
                list.expandItem($(this));
            });
        },

        collapseAll: function()
        {
            var list = this;
            list.el.find(list.options.itemNodeName).each(function() {
                list.collapseItem($(this));
            });
        },

        setParent: function(li)
        {
            if (li[0].querySelectorAll(this.options.listNodeName).length) {
                li[0].prepend($(this.options.expandBtnHTML));
                li[0].prepend($(this.options.collapseBtnHTML));
            }
				if( (' ' + li[0].className + ' ').indexOf(' ' + defaults.collapsedClass + ' ') > -1 )
				{
            	li[0].children('[data-action="collapse"]').hide();					
				}
				else
				{
            	li[0].children('[data-action="expand"]').hide();
				}
        },

        unsetParent: function(li)
        {
            li.removeClass(this.options.collapsedClass);
            li.children('[data-action]').remove();
            li.children(this.options.listNodeName).remove();
        },

        dragStart: function(e)
        {
            var mouse    = this.mouse,
                target   = $(e.target),
                dragItem = $(closest(closest(e.target, '.' + this.options.handleClass), this.options.itemNodeName));


            this.sourceRoot = closest(e.target, '.' + this.options.rootClass);

            this.dragItem = dragItem;
            
            // this.placeEl.css('height', dragItem.height());
				this.placeEl.set('$height', dragItem.get('$height'));

            mouse.offsetX = e.offsetX !== undefined ? e.offsetX : e.pageX - target.offset().left;
            mouse.offsetY = e.offsetY !== undefined ? e.offsetY : e.pageY - target.offset().top;
            mouse.startX = mouse.lastX = e.pageX;
            mouse.startY = mouse.lastY = e.pageY;

            this.dragRootEl = this.el;
				
            // this.dragEl = $(document.createElement(this.options.listNodeName)).addClass(this.options.listClass + ' ' + this.options.dragClass);
            this.dragEl = $(document.createElement(this.options.listNodeName)).set(this.options.listClass + ' ' + this.options.dragClass);
            // this.dragEl.css('width', dragItem.width());
				this.dragEl.set('$width', dragItem.get('$width'));

            // fix for zepto.js
            //dragItem.after(this.placeEl).detach().appendTo(this.dragEl);
            // dragItem.after(this.placeEl);
				dragItem.addAfter(this.placeEl);
            dragItem[0].parentNode.removeChild(dragItem[0]);
            // dragItem.appendTo(this.dragEl);
				this.dragEl.add(dragItem);

            // $(document.body).append(this.dragEl);
            $(document.body).add(this.dragEl);
            // this.dragEl.css({
           //      'left' : e.pageX - mouse.offsetX,
           //      'top'  : e.pageY - mouse.offsetY
           //  });
			this.dragEl.set({
               $left : e.pageX - mouse.offsetX + "px",
               $top  : e.pageY - mouse.offsetY + "px"
           });
            // total depth of dragging item
            var i, depth,
                // items = this.dragEl.find(this.options.itemNodeName);
					 items = this.dragEl.select(this.options.itemNodeName, true);
            for (i = 0; i < items.length; i++) {
                // depth = $(items[i]).parents(this.options.listNodeName).length;
					 depth = $(items[i]).trav('parentNode', this.options.listNodeName).length;
                if (depth > this.dragDepth) {
                    this.dragDepth = depth;
                }
            }
        },

        dragStop: function(e)
        {
            // fix for zepto.js
            //this.placeEl.replaceWith(this.dragEl.children(this.options.itemNodeName + ':first').detach());
            // var el = this.dragEl.children(this.options.itemNodeName).first();
				var el = this.dragEl.select(this.options.itemNodeName, true).sub(0);
            // el[0].parentNode.removeChild(el[0]);
				el.remove();
            // this.placeEl.replaceWith(el);
            this.placeEl.replace(el);
            
            if (!this.moving) 
				{
					$(this.dragItem).trigger('click');
            }
				
            var i;
            var isRejected = false;
            for (i in this.options.reject) 
				{
					var reject = this.options.reject[i];
					if (reject.rule.apply(this.dragRootEl)) 
					{
						var nestableDragEl = el.clone(true);
						this.dragRootEl.html(this.nestableCopy.children().clone(true));
						if (reject.action) {
                  	reject.action.apply(this.dragRootEl, [nestableDragEl]);
                	}
						
                	isRejected = true;
                	break;
					}
				}
            
				if (!isRejected) 
				{
	            this.dragEl.remove();
	            this.el.trigger('change');

	            //Let's find out new parent id
	            // var parentItem = el.parent().parent();
					var parentItem = el.trav('parentNode').trav('parentNode');
	            var parentId = null;
	            if(parentItem !== null && !parentItem.is('.' + this.options.rootClass))
	                // parentId = parentItem.data('id');
 	                parentId = parentItem.get('%id');

	            // if($.isFunction(this.options.dropCallback))
					if( (typeof this.options.dropCallback == 'function' && !this.options.dropCallback['item']) )
					{
	              var details = {
	                // sourceId   : el.data('id'),
	                sourceId   : el.get('%id'),
	                destId     : parentId,
	                sourceEl   : el,
	                destParent : parentItem,
	                // destRoot   : el.closest('.' + this.options.rootClass),
						 destRoot   : closest(el[0], '.' + this.options.rootClass),
	                sourceRoot : this.sourceRoot
	              };
	              this.options.dropCallback.call(this, details);
	            }

	            if (this.hasNewRoot) {
	                this.dragRootEl.trigger('change');
	            }
					
	            this.reset();
				}
        },

        dragMove: function(e)
        {
            var list, parent, prev, next, depth,
                opt   = this.options,
                mouse = this.mouse;

            // this.dragEl.css({
            //     'left' : e.pageX - mouse.offsetX,
            //     'top'  : e.pageY - mouse.offsetY
            // });
				this.dragEl.set({
                $left : e.pageX - mouse.offsetX + "px",
                $top  : e.pageY - mouse.offsetY + "px"
            });
            // mouse position last events
            mouse.lastX = mouse.nowX;
            mouse.lastY = mouse.nowY;
            // mouse position this events
            mouse.nowX  = e.pageX;
            mouse.nowY  = e.pageY;
            // distance mouse moved between events
            mouse.distX = mouse.nowX - mouse.lastX;
            mouse.distY = mouse.nowY - mouse.lastY;
            // direction mouse was moving
            mouse.lastDirX = mouse.dirX;
            mouse.lastDirY = mouse.dirY;
            // direction mouse is now moving (on both axis)
            mouse.dirX = mouse.distX === 0 ? 0 : mouse.distX > 0 ? 1 : -1;
            mouse.dirY = mouse.distY === 0 ? 0 : mouse.distY > 0 ? 1 : -1;
            // axis mouse is now moving on
            var newAx   = Math.abs(mouse.distX) > Math.abs(mouse.distY) ? 1 : 0;
				
            // do nothing on first move
            if (!this.moving) {
                mouse.dirAx  = newAx;
                this.moving = true;
                return;
            }

            // calc distance moved on this axis (and direction)
            if (mouse.dirAx !== newAx) {
                mouse.distAxX = 0;
                mouse.distAxY = 0;
            } else {
                mouse.distAxX += Math.abs(mouse.distX);
                if (mouse.dirX !== 0 && mouse.dirX !== mouse.lastDirX) {
                    mouse.distAxX = 0;
                }
                mouse.distAxY += Math.abs(mouse.distY);
                if (mouse.dirY !== 0 && mouse.dirY !== mouse.lastDirY) {
                    mouse.distAxY = 0;
                }
            }
            mouse.dirAx = newAx;

            /**
             * move horizontal
             */
            if (mouse.dirAx && mouse.distAxX >= opt.threshold) {
                // reset move distance on x-axis for new phase
                mouse.distAxX = 0;
                // prev = this.placeEl.prev(opt.itemNodeName);
						 prev = this.placeEl.trav('previousSibling', opt.itemNodeName, 1).sub(0);
                // increase horizontal level if previous sibling exists and is not collapsed
                // if (mouse.distX > 0 && prev.length && !prev.hasClass(opt.collapsedClass) && !prev.hasClass(opt.noChildrenClass)) {
                if (mouse.distX > 0 && prev.length && !hasClass(prev, opt.collapsedClass) && !hasClass(prev, opt.noChildrenClass)) {
                    // cannot increase level when item above is collapsed
                    // list = prev.find(opt.listNodeName).last();
                    list = prev.select(opt.listNodeName, true).sub(-1);
                    // check if depth limit has reached
                    // depth = this.placeEl.parents(opt.listNodeName).length;
						  depth = this.placeEl.trav('parentNode', opt.listNodeName).length;
                    if (depth + this.dragDepth <= opt.maxDepth) {
                        // create new sub-level if one doesn't exist
                        if (!list.length) {
									 var docFrag = document.createDocumentFragment();
                            list = document.createElement(opt.listNodeName);
									 
									 defaults.ffn.addClass(list, opt.listClass);
                            
									 list.appendChild(this.placeEl[0]);
                            prev[0].appendChild(docFrag);
                            this.setParent(prev);
                        } else {
                            // else append to next level up
                            list = prev.children(opt.listNodeName).last();
                            list.appendChild(this.placeEl);
                        }
                    }
                }
                // decrease horizontal level
                if (mouse.distX < 0) {
                    // we can't decrease a level if an item preceeds the current one
                    // next = this.placeEl.next(opt.itemNodeName);
						  next = this.placeEl.trav('nextSibling', opt.itemNodeName, 1).sub(0);
                    if (!next.length) {
                        parent = this.placeEl.parent();
                        this.placeEl.closest(opt.itemNodeName).after(this.placeEl);
                        if (!parent.children().length) {
                            this.unsetParent(parent.parent());
                        }
                    }
                }
            }

            var isEmpty = false;
            // find list item under cursor
            if (!hasPointerEvents) {
                this.dragEl[0].style.visibility = 'hidden';
            }
            this.pointEl = $(document.elementFromPoint(e.pageX - document.documentElement.scrollLeft, e.pageY - (window.pageYOffset || document.documentElement.scrollTop)));
            if (!hasPointerEvents) {
                this.dragEl[0].style.visibility = 'visible';
            }
            // if (this.pointEl.hasClass(opt.handleClass)) {
				if (hasClass(this.pointEl, opt.handleClass)) {
                // this.pointEl = this.pointEl.closest( opt.itemNodeName );
					    this.pointEl = closest(this.pointEl, opt.itemNodeName );
            }
            // if (this.pointEl.hasClass(opt.emptyClass)) {
            if (hasClass(this.pointEl, opt.emptyClass)) {
                isEmpty = true;
            }
            // else if (!this.pointEl.length || !this.pointEl.hasClass(opt.itemClass)) {
            else if (!this.pointEl.length || !hasClass(this.pointEl, opt.itemClass)) {
                return;
            }

            // find parent list of item under cursor
            // var pointElRoot = this.pointEl.closest('.' + opt.rootClass),
            var pointElRoot = closest(this.pointEl, '.' + opt.rootClass),
                // isNewRoot   = this.dragRootEl.data('nestable-id') !== pointElRoot.data('nestable-id');
					 isNewRoot   = this.dragRootEl.get('%nestable-id') !== pointElRoot.get('%nestable-id');
            /**
             * move vertical
             */
            if (!mouse.dirAx || isNewRoot || isEmpty) {
                // check if groups match if dragging over new root
                if (isNewRoot && opt.group !== pointElRoot.data('nestable-group')) {
                    return;
                }
                // check depth limit
                depth = this.dragDepth - 1 + this.pointEl.parents(opt.listNodeName).length;
                if (depth > opt.maxDepth) {
                    return;
                }
                var before = e.pageY < (this.pointEl.offset().top + this.pointEl.height() / 2);
                    parent = this.placeEl.parent();
                // if empty create new list to replace empty placeholder
                if (isEmpty) {
                    list = $(document.createElement(opt.listNodeName)).addClass(opt.listClass);
                    list.append(this.placeEl);
                    this.pointEl.replaceWith(list);
                }
                else if (before) {
                    this.pointEl.before(this.placeEl);
                }
                else {
                    this.pointEl.after(this.placeEl);
                }
                if (!parent.children().length) {
                    this.unsetParent(parent.parent());
                }
                if (!this.dragRootEl.find(opt.itemNodeName).length) {
                    this.dragRootEl.append('<div class="' + opt.emptyClass + '"/>');
                }
                // parent root list has changed
					 this.dragRootEl = pointElRoot;
                if (isNewRoot) {
                    this.hasNewRoot = this.el[0] !== this.dragRootEl[0];
                }
            }
        }

    };

    // $.fn.nestable = function(params)
	 // define fn for minified
	 nestable = function(el, params)
    {
        var lists  = document.querySelectorAll(el),
            retval = lists;

        var generateUid = function (separator) {
            var delim = separator || "-";

            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }

            return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
        };
		  defaults.ffn.each(lists, function(item)
        {
            // var plugin = $(item).data('nestable');
				console.log(item);
            var plugin = item.getAttribute('data-nestable');
            if (!plugin) {
               item.setAttribute("data-nestable", new Plugin(item, params));
               item.setAttribute("data-nestable-id", generateUid());
                // $(this).data("nestable", new Plugin(this, params));
                // $(this).data("nestable-id", generateUid());
            } else {
                if (typeof params === 'string' && typeof plugin[params] === 'function') {
                    retval = plugin[params]();
                }
            }
        });

        return retval || lists;
    };

})(window, document);
