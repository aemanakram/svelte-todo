
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.callbacks.push(() => {
                outroing.delete(block);
                if (callback) {
                    block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\mine_icon.svelte generated by Svelte v3.6.5 */

    const file = "src\\mine_icon.svelte";

    function create_fragment(ctx) {
    	var svg, path;

    	return {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			set_style(path, "line-height", "normal");
    			set_style(path, "text-indent", "0");
    			set_style(path, "text-align", "start");
    			set_style(path, "text-decoration-line", "none");
    			set_style(path, "text-decoration-style", "solid");
    			set_style(path, "text-decoration-color", "#000");
    			set_style(path, "text-transform", "none");
    			set_style(path, "block-progression", "tb");
    			set_style(path, "isolation", "auto");
    			set_style(path, "mix-blend-mode", "normal");
    			attr(path, "d", "M 24.984375 1.9863281 A 1.0001 1.0001 0 0 0 24 3 L 24 7.0488281 C 19.788099 7.2817221 15.969452 8.9603227 13.021484 11.607422 L 10.150391 8.7363281 A 1.0001 1.0001 0 0 0 9.4335938 8.4335938 A 1.0001 1.0001 0 0 0 8.7363281 10.150391 L 11.603516 13.017578 C 8.9676792 15.970574 7.2834883 19.792069 7.0507812 24 L 3 24 A 1.0001 1.0001 0 1 0 3 26 L 7.0507812 26 C 7.2834883 30.207931 8.9676792 34.029426 11.603516 36.982422 L 8.7363281 39.849609 A 1.0001 1.0001 0 1 0 10.150391 41.263672 L 13.021484 38.392578 C 15.969452 41.039677 19.788099 42.718278 24 42.951172 L 24 47 A 1.0001 1.0001 0 1 0 26 47 L 26 42.951172 C 30.211901 42.718278 34.030548 41.039677 36.978516 38.392578 L 39.849609 41.263672 A 1.0001 1.0001 0 1 0 41.263672 39.849609 L 38.396484 36.982422 C 41.032321 34.029426 42.716512 30.207931 42.949219 26 L 47 26 A 1.0001 1.0001 0 1 0 47 24 L 42.949219 24 C 42.716512 19.792069 41.032321 15.970574 38.396484 13.017578 L 41.263672 10.150391 A 1.0001 1.0001 0 0 0 40.537109 8.4335938 A 1.0001 1.0001 0 0 0 39.849609 8.7363281 L 36.978516 11.607422 C 34.030548 8.9603227 30.211901 7.2817221 26 7.0488281 L 26 3 A 1.0001 1.0001 0 0 0 24.984375 1.9863281 z M 20.5 15 C 23.538 15 26 17.462 26 20.5 C 26 23.538 23.538 26 20.5 26 C 17.462 26 15 23.538 15 20.5 C 15 17.462 17.462 15 20.5 15 z");
    			add_location(path, file, 1, 4, 65);
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "viewBox", "0 0 50 50");
    			add_location(svg, file, 0, 0, 0);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(svg);
    			}
    		}
    	};
    }

    class Mine_icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment, safe_not_equal, []);
    	}
    }

    /* src\App.svelte generated by Svelte v3.6.5 */

    const file$1 = "src\\App.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.mine = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.minerow = list[i];
    	return child_ctx;
    }

    // (145:8) {:else}
    function create_else_block_2(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Minesweeper");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (139:8) {#if gameover}
    function create_if_block_1(ctx) {
    	var if_block_anchor;

    	function select_block_type_1(ctx) {
    		if (ctx.win) return create_if_block_2;
    		return create_else_block_1;
    	}

    	var current_block_type = select_block_type_1(ctx);
    	var if_block = current_block_type(ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (142:10) {:else}
    function create_else_block_1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("You lose!");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (140:10) {#if win}
    function create_if_block_2(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("You win!");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (163:12) {:else}
    function create_else_block(ctx) {
    	var t_value = ctx.mine.mineNeighbors ? ctx.mine.mineNeighbors : "", t;

    	return {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.minefield) && t_value !== (t_value = ctx.mine.mineNeighbors ? ctx.mine.mineNeighbors : "")) {
    				set_data(t, t_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (161:12) {#if mine.isRevealed && mine.isMine}
    function create_if_block(ctx) {
    	var current;

    	var mineicon = new Mine_icon({ $$inline: true });

    	return {
    		c: function create() {
    			mineicon.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(mineicon, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(mineicon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(mineicon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(mineicon, detaching);
    		}
    	};
    }

    // (154:8) {#each minerow as mine}
    function create_each_block_1(ctx) {
    	var button, current_block_type_index, if_block, button_class_value, current, dispose;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type_2(ctx) {
    		if (ctx.mine.isRevealed && ctx.mine.isMine) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function click_handler_1() {
    		return ctx.click_handler_1(ctx);
    	}

    	return {
    		c: function create() {
    			button = element("button");
    			if_block.c();
    			attr(button, "class", button_class_value = "field " + (ctx.mine.isRevealed ? 'open' : '') + " " + (ctx.mine.isMine
                  ? 'mine'
                  : '') + " svelte-9p8hch");
    			add_location(button, file$1, 154, 10, 3532);
    			dispose = listen(button, "click", click_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);
    			if_blocks[current_block_type_index].m(button, null);
    			current = true;
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(button, null);
    			}

    			if ((!current || changed.minefield) && button_class_value !== (button_class_value = "field " + (ctx.mine.isRevealed ? 'open' : '') + " " + (ctx.mine.isMine
                  ? 'mine'
                  : '') + " svelte-9p8hch")) {
    				attr(button, "class", button_class_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if_blocks[current_block_type_index].d();
    			dispose();
    		}
    	};
    }

    // (152:4) {#each minefield as minerow}
    function create_each_block(ctx) {
    	var div, t, current;

    	var each_value_1 = ctx.minerow;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr(div, "class", "row svelte-9p8hch");
    			add_location(div, file$1, 152, 6, 3470);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append(div, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.minefield) {
    				each_value_1 = ctx.minerow;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t);
    					}
    				}

    				group_outros();
    				for (i = each_value_1.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value_1.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var main, div2, div1, button, t1, div0, t2, current, dispose;

    	function select_block_type(ctx) {
    		if (ctx.gameover) return create_if_block_1;
    		return create_else_block_2;
    	}

    	var current_block_type = select_block_type(ctx);
    	var if_block = current_block_type(ctx);

    	var each_value = ctx.minefield;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div1 = element("div");
    			button = element("button");
    			button.textContent = "RESET";
    			t1 = space();
    			div0 = element("div");
    			if_block.c();
    			t2 = space();

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(button, "class", "reset-button svelte-9p8hch");
    			add_location(button, file$1, 131, 6, 2984);
    			attr(div0, "class", "status svelte-9p8hch");
    			add_location(div0, file$1, 137, 6, 3148);
    			attr(div1, "class", "status-bar svelte-9p8hch");
    			add_location(div1, file$1, 130, 4, 2952);
    			attr(div2, "class", "container");
    			add_location(div2, file$1, 129, 2, 2923);
    			attr(main, "class", "svelte-9p8hch");
    			add_location(main, file$1, 128, 0, 2913);
    			dispose = listen(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			append(main, div2);
    			append(div2, div1);
    			append(div1, button);
    			append(div1, t1);
    			append(div1, div0);
    			if_block.m(div0, null);
    			append(div2, t2);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (changed.minefield) {
    				each_value = ctx.minefield;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(main);
    			}

    			if_block.d();

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    }

    const fieldSize = 10;

    const mineCount = 10;

    function instance($$self, $$props, $$invalidate) {
    	

      let gameover = false;
      let win = false;
      let minefield = [];

      const setupField = (size, mineCount) => {
        $$invalidate('gameover', gameover = false);
        $$invalidate('win', win = false);

        let field = [];
        for (let i = 0; i < size; i++) {
          field[i] = [];
          for (let j = 0; j < size; j++) {
            field[i][j] = {
              x: i,
              y: j,
              isMine: false,
              isRevealed: false,
              mineNeighbors: 0,
            };
          }
        }

        field = addMines(field);
        field = countMineNeighbors(field);
        return field;
      };

      const addMines = (field) => {
        let mines = 0;
        while (mines < (fieldSize * fieldSize) / 10) {
          const x = Math.floor(Math.random() * fieldSize);
          const y = Math.floor(Math.random() * fieldSize);
          if (!field[x][y].isMine) {
            field[x][y].isMine = true;
            mines++;
          }
        }
        return field;
      };

      const countMineNeighbors = (field) => {
        for (let i = 0; i < fieldSize; i++) {
          for (let j = 0; j < fieldSize; j++) {
            if (field[i][j].isMine) {
              for (let k = -1; k <= 1; k++) {
                for (let l = -1; l <= 1; l++) {
                  if (
                    i + k >= 0 &&
                    i + k < fieldSize &&
                    j + l >= 0 &&
                    j + l < fieldSize
                  ) {
                    field[i + k][j + l].mineNeighbors++;
                  }
                }
              }
            }
          }
        }
        return field;
      };

      const checkWin = () => {
        let count = 0;
        for (let i = 0; i < fieldSize; i++) {
          for (let j = 0; j < fieldSize; j++) {
            if (minefield[i][j].isRevealed) {
              count++;
            }
          }
        }
        if (count == fieldSize * fieldSize - mineCount) {
          return true;
        }
        return false;
      };

      const revealMine = (mine) => {
        if (gameover) return;
        if (mine.isRevealed) return;

        revealNeighbors(mine);

        if (mine.isMine) {
          $$invalidate('gameover', gameover = true);
          $$invalidate('minefield', minefield = [...minefield]);
          return;
        }

        if (checkWin()) {
          $$invalidate('win', win = true);
          $$invalidate('gameover', gameover = true);
        }
        $$invalidate('minefield', minefield = [...minefield]);
      };

      const revealNeighbors = (mine) => {
        if (mine.isRevealed) return;
        mine.isRevealed = true;

        if (mine.mineNeighbors == 0) {
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (
                mine.x + i >= 0 &&
                mine.x + i < fieldSize &&
                mine.y + j >= 0 &&
                mine.y + j < fieldSize
              ) {
                revealNeighbors(minefield[mine.x + i][mine.y + j]);
              }
            }
          }
        }
      };

      onMount(() => {
        $$invalidate('minefield', minefield = setupField(fieldSize));
      });

    	function click_handler() {
    	          minefield = setupField(fieldSize); $$invalidate('minefield', minefield);
    	        }

    	function click_handler_1({ mine }) {
    		return revealMine(mine);
    	}

    	return {
    		gameover,
    		win,
    		minefield,
    		setupField,
    		revealMine,
    		click_handler,
    		click_handler_1
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment$1, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
