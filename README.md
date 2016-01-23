# $dd [![Build Status](https://travis-ci.org/drdelambre/drdelambre.svg?branch=es6)](https://travis-ci.org/drdelambre/drdelambre)
> A library of modules for scaling your javascript code  

1. [The Namespace](#the-namespace)
  * [type](#typevariabletype)
  * [extend](#extendobject_1object_2object_n)
  * [expose](#exposevariableas)
  * [init](#initfun)
  * [mixin](#mixinobj)
2. [Core Modules](#the-core-modules)
  * [route](#route)
  * [dom](#dom)
  * [pubsub](#pubsub)
  * [ioc](#ioc)
  * [keys](#keys)
  * [model](#model)
  * [touch](#touch)

## The Namespace
$dd, by itself, comes with a collection of handy tools for normalizing repetitive javascript tasks.
#### ```type(variable,type?)```
_typeof_ is, at best, tedious. When you pass a variable into the **$dd.type** function, a string is returned that lets you know exactly which type of object you're dealing with. Optionally, you can pass in a space delineated string as the second parameter to determine if _variable_ is one of those types.
```Javascript
var a = $dd.type([]),
	b = $dd.type(window),
	c = $dd.type('hello world','array'),
	d = $dd.type('hello world','array string');
// variable values
//		a: 'array'
//		b: 'node'
//		c: false
//		d: true
```
---
#### ```extend(object_1,object_2,...,object_n)```
When you need to smash two objects together, only adding variables from the right side that aren't available in the left side, this is the function to use. I use it a lot for objects that have options with default values. You can smash as many objects together as you like.
```Javascript
var fun = function(options){
	this.options = $dd.extend({
		id: 0,
		name: 'guest',
		has_key: false
	},options);
};
var fun1 = new fun({ name: 'Theodore' });

// fun1.options
//		{
//			id: 0,
//			name: 'Theodore',
//			has_key: false
//		}
```
---
#### ```expose(variable,as)```
Keeping as many variables out of global namespace as possible is a good idea, but sometimes you need to access that one problematic function hidden deep inside of an iife. This function explicitly links a variable to the global scope, no matter where you are. If you have too many of these running around your code, try using the _inversion of control_ module instead.
```Javascript
(function(){
	var state_machine = { on: false };
	$dd.expose(state_machine,'state');
})();

window.state_machine.on = true;
```
---
#### ```init(fun)```
If you need to wait until the document is ready for manipulation, you can pass a callback function into **$dd.init**. The callbacks are called in the order they were passed to the namespace. If the document is already ready, the function is called immediately, so it's a good idea to wrap your dom manipulation calls in this function no matter where they are in your stack.
```Javascript
//this one gives an error
document.getElementById('.not-ready').className = 'ready';

//this one doesn't!
$dd.init(function(){
	document.getElementById('.not-ready').className = 'ready';
});
```
---
#### ```mixin(obj)```
This is how the namespace extends itself. If you check the modules directory, you'll see how this function is used. In essence, it just prevents collisions on the namespace.
```Javascript
$dd.mixin({
	istouch: !!('ontouchend' in document),
	browser: function(){}
});
if($dd.istouch){
	$dd.browser();
}
```
## The Core Modules
While $dd is fine and all, it's really just a variable to put stuff. Here's where it gets interesting. You can check out the _modules_ directory to find all of the modules and poke around to get a better understanding of how they work, this is just a brief usage overview.
### route
------  
> hash based router for doing single paged applications

```Javascript
$dd.route('/user/:id/edit',function(id){
	//on enter hash
	grabUser(id);
	$dd.dom('#user-edit-page').addClass('show');
},function(){
	//on exit
	$dd.dom('#user-edit-page').removeClass('show');
})
```  

### dom
------  
> A DOM maninipulation library that's mean and lean. Like 7KB lean.

```Javascript
$dd.dom('#start-page').on('scroll',function(evt){
	$dd.dom('#start-page .button.active')
		.get(1)
		.removeClass('active')
		.css({ opacity: '0.5' })
		.delay('300')
		.remove();
}).find('.button').addClass('active');
$dd.dom('#start-page').delay(100).fire('scroll');
```

### pubsub
------  
> Publish/Subscribe module for multi-casting events and loose coupling of your data structures.

```Javascript
(function(){
	var self = {
		chat_entries:[]
	};
	$dd.sub('/chat/:status',function(status,entry){
		if(status === 'new'){
			chat_entries.push(entry);
		}
	});
})();
(function(){
	var self = {
		chat_count: 0
	};
	$dd.sub('/chat/:status',function(status){
		if(status === 'new'){
			self.chat_count++;
		} else {
			self.chat_count--;
		}
	});
})()
(function(){
	var self = {
		element: $dd.dom('button');
	};
	self.element.on('click',function(){
		$dd.pub('/chat/new',{
			user: 'Bob',
			message: 'Hello World!'
		});
	});
})()
```

### ioc
------  
> Inversion of control is the answer to singletons. Useful for creating a decoupled service layer in your application (settings, user authentication, etc).

```Javascript
(function(){
	var settings = {
		language: 'en_US',
		currency: 'BTC'
	};
	$dd.ioc.register('settings',function(){
		return settings;
	});
})();
(function(){
	var current_currency = $dd.ioc.get('settings').currency;
})();
```

### keys
------  
> Drop in crazy keyboard combinations as quickly as hooking up a _mousedown_ event binding

```Javascript
$dd.keys({
	'[ctrl][a + e + y]': function(){ alert('finger stretch completed'); },
	'[shift][up + up + down + down + left + right + left + right + b + a + enter]': function(){ alert('KONAMI CODE'); }
});
```

### model
------  
> Data driven inheritance patterns, the core of any large web application. There are some cool functions that make models easier to connect to.

```$dd.model({ fieldname: default_value })``` defines a model  
```.fill(obj)``` fills the model with a basic javascript object  
```.on_fill(fun,fire_after)``` define a function to operate on the incoming data, before and after it is loaded into the model  
```.out()``` returns a clean javascript object from your model  
```.on_out(fun,fire_before)``` define a function to operate on the outgoing data, before and after it is returned from out  
```.map({ fieldname: 'outside_fieldname' })``` when your data source uses nonsensical variable names, use this to clean it up  
```.type({ fieldname: fun })``` define a constructor for fields. usefull for setting up model hierarchies. handles arrays automatically if defined as such in the model.  
```.extend(def)``` extends the definition of a model for inheritance  
```.attach(obj)``` save youself from typing _self_ over and over. just tacks things onto the object.  
```.validate({ fieldname: fun })``` defines a validation function for fields. the function returns an array of strings on error **pending change**  
```.validate()``` runs the validation functions. if it returns _false_, check _.errors_ **pending change**

```Javascript
var Bean = function(data){
	var self = $dd.model({
		name: '',
		flavor: 0
	}).on_fill(function(_data){
		if(_data.name){
			var _name = _data.name.toLowerCase();
			_data.name = _name.charAt(0).toUpperCase() + _name.slice(1);
		}
		_data.flavor = Math.min(0,Math.max(_data.flavor||0,10));
	});

	self.enhance = function(){ self.fill({ flavor: self.flavor + 1 }); };

	return self.fill(data);
};
var Burrito = function(data){
	var self = $dd.model({
		name: '',
		items: []
	}).map({
		items: 'stuff'
	}).type({
		items: Bean
	}).fill(data);

	self.clone = function(){
		return Burrito(self.out());
	};

	return self;
};
var BeanBurrito = Burrito({
	name: 'Bean Burrito',
	stuff: [{
		name: 'pinto',
		flavor: 12
	},{
		name: 'KIDNEY',
		flavor: 2
	}]
});

console.log(BeanBurrito.items[0].name + ' [' + BeanBurrito.items[0].flavor + '/10]');
// outputs:
//		Pinto [10/10]
```
  
### touch
------  
> Touch interfaces are weird in the browser. This module normalizes mouse and touch events into a single interface, connected to an element

When you're trying to write code around user interaction, there are edge cases between mouse and touch events. This module simulates the mouse as a single finger performing actions on the DOM, with events formatted as such:

```
{
	id: finger identifier,
	target: the element the event originated in,
	pageX: the coordinates of the event's left offset in window space,
	pageY: the coordinates of the event's top offset in window space
}
```

Instantiating the touch class is as simple as

```
$dd.touch({
	element: the upper element you're watching,
	start: a function to call when a finger touches the screen,
	move: a function to call when a finger moves,
	end: a function to call when a finger is lifted
})
```

each function takes the event object described above as it's sole parameter

### and so much more!
