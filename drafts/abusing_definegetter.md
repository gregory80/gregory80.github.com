


Abusing JS defineGetter
---------------------------


For several years now, a JS method for attaching methods to properties,
efectively creating a more deliberate API for private variables has been
available:

    __defineGetter__( name, function() {
      return "somevalue"
    });

This functionality is covered in detail by many websites: here, here and
here of note. However, this isn't about proper usage of this method.
Rather, it recently (sad it was only recent isnt it) occured to me that
defineGetter effetively establishes a way to define, or redefine JS
keywords, or, invent some of my own.


Let's get started with something simple, and establish a wholly new, yet
not unknown keyword. yield.

    window.__defineGetter__("yield", function() {
      return "I yield for no man";
    });

And some code to use this.

    console.log(yield);
    function some_func() {
      // do stuff
      yield;
    }

    some_func();



Alright, that's pretty cool and all. We can just randomly declare some
word on the top level scope, and it behaves like a function. Handy, but
no useful because this break down very quickly if we try and actually
use it a expected in other languages.


    function other_func() {
      var foo = true;
      if( foo != false) {
        yield this._item;
      }
    }

Well, that code fails to setup anything useful first, such as something
that actually needs to be yielded due to a generator, but alas, this
code even if it wasnt concentually flawed, would not work. It throws an
unexpected type error for whatever the value following yield. So 

    yield "something";
    yield true;

The former throwing an unexpected string error, and the later throwing
an unexpected token error. Meaning we can't abuse this quite yet. The
problem here, is that the JS interpreter is treating yield like a label.
Regardless of the word (aka using "yield" isn't the issue), the problem
remains. What we want JS to do is behave more like the return statement,
which is essentially what yield does. People smarter than me discuss
yield in depth
[here](http://stackoverflow.com/questions/231767/the-python-yield-keyword-explained).

Okay, so now we know that defineGetter can't be used for anything
useful, like adding the yield statement to JavaScript. Probably for good
cause given that JS is single threaded on the client and yield would
most likely cause the UI painting to hang or crash. You would think that
coffeescript has a yield statement, given it's ruby/python look and
feel. But that bug was closed on the project as [not a feature of
JavaScript](https://github.com/jashkenas/coffee-script/issues/983)

