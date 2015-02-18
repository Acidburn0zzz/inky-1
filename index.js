var cheerio = require('cheerio');

var Inky = function Inky () {
  this.zfTags = {
    button: 'button',
    row: 'row',
    callout: 'callout',
    columns: 'columns',
    subcolumns: 'subcolumns',
    container: 'container',
    inlineListH: 'inline-list-h',
    inlineListV: 'inline-list-v'
  },
  this.grid = 12
};

Inky.prototype = {
  // Description:
  //    Returns the object zfTags
  // Arguments:
  //    null
  // Returns:
  //    null
  getTags: function() {
    return this.zfTags;
  },

  // Description:
  //    Sets the object property zfArray to an array containing the markup for our ZF custom elements
  // Arguments:
  //    null
  // Returns:
  //    null
  setTagArray: function() {
    var arr = [];
    var self = this;
    
    for (val in self.zfTags) {
      arr.push(self.zfTags[val]);
    }
    self.zfArray = arr;
  },

  // Description:
  //   Checks if an element is a custom ZF element.
  //
  // Arguments:
  //    elType (string): the tag name of an element
  // Returns:
  //    boolean: true/false
  isZfElement: function(elType) {
    var self = this;
    // create an array of our custom tags, if we haven't done so already
    if(!self.zfArray) {
      self.setTagArray();
    }

    // if the element is a custom element
    if (self.zfArray.indexOf(elType) !== -1) {
      // return true
      return true;
    }
    else {
      return false;
    }
  },

  // Description:
  //   Puts in mark up for microsoft buttons
  //   TODO
  // Arguments:
  //    $: Cheerio
  // Returns:
  //    null: new buttons
  msButton: function($) {
    var buttons = $('table.button');
    $(buttons).each(function() {
      // put microsoft markup
    })

  },

  // Description:
  //   Checks if an element is an element with a td included. Currently it's a manual check. 
  //   Array was populated from the markup from the component factory.
  //
  // Arguments:
  //    elType (string): the tag name of an element
  // Returns:
  //    boolean: true/false
  isTdElement: function(elType) {
    var tdEls = ['subcolumns'];

    // if the element is an element that comes with td
    if (tdEls.indexOf(elType) > -1) {
      // return true
      return true;
    }
    else {
      return false;
    }
  },

  // Description:
  //   Sets custom config for Inky
  //
  // Arguments:
  //    opts (object): configuration object
  // Returns:
  //    null
  setConfig: function(opts) {
    for (var prop in opts) {
      this[prop] = opts[prop];
    }
  },

  // Description:
  //   Awww yiss. Kickstarts the whole parser. Takes in HTML loaded via Cheerio as an argument, 
  //   checks if there are any custom components. If there are, it replaces the nested components, 
  //   traverses the DOM and replaces them with email markup.
  //
  // Arguments:
  //    $, opts (object): Cheerio loaded string, configuration object
  // Returns:
  //    $: Cheerio modified string
  releaseTheKraken: function($, opts) {
    var center = $('center').html(),
        self   = this;

    // set configuration
    if (opts) {
      self.setConfig(opts);
    }
    // create an array of our custom tags
    self.setTagArray();

    //find nested components
    if (self.checkZfComponents($) !== false) {
      var nestedComponents = self.findNestedComponents($, center);

      // process each element to get the table markup
      $(nestedComponents).each(function(idx, el) {
        var containerScaffold = self.scaffoldElements($, $(el));
      });

      // remove any blank spaces between classes
      // and reload into cheerio
      str = self.removeBlankSpaces($.html());
      $ = cheerio.load(str);

      // see the mark up for dev purposes
      // console.log($.html());
    }
    else {
      console.log("all done");
    }
    return $;
  },

  // Description:
  //   Executes a function place the correct mark up for custom components in the correct place in the DOM
  //   It is a recursive function that drills down the DOM to find all custom nested elements within an element
  //   and replaces the custom tags with the correct table email markup. I got a blank space, baby.
  //
  // Arguments:
  //    $, str (String): Cheerio, and a string containing the markup of a singular element
  // Returns:
  //    null: his function replaces the syntax directly in the cheerio object
  removeBlankSpaces: function(str) {
    // remove any blank spaces between classes we may have put in
    str = str.replace( / "+/g, '"' )

    return str;
  },

  // Description:
  //   Executes a function place the correct mark up for custom components in the correct place in the DOM
  //   It is a recursive function that drills down the DOM to find all custom nested elements within an element
  //   and replaces the custom tags with the correct table email markup.
  //
  // Arguments:
  //    $, str (String): Cheerio, and a string containing the markup of a singular element
  // Returns:
  //    null: his function replaces the syntax directly in the cheerio object
  scaffoldElements: function($, str) {
    // take inner html of elements and nest them inside each others
    var output   = '',
        elMarkup = '',
        element  = $(str)[0],
        inner    = $(str).html(),
        self     = this;

    // replace tags with proper table syntax
    // elMarkup retains the inner html within the markup
    if (element !== undefined) {
      elMarkup = self.componentFactory($, element, element.name);
      $(element).replaceWith(elMarkup);
    }
    else {
      return;
    }

    // find if there are more nested elements in the inner syntax
    var moreNested = self.findNestedComponents($, inner);
    moreNested = moreNested.concat(self.findDeeplyNested($, inner));


    $(moreNested).each(function(idx, el) {
      // call a recursion to replace all nested elements
      self.scaffoldElements($, $(el));
    }); 

  },

  // Description:
  //   Executes a function to find and return nested custom elements within another element
  //
  // Arguments:
  //    $, str (String): Cheerio, and a string containing the markup of an element to be checked for nested components
  // Returns:
  //    nestedComponents (Array): An array containing the names (i.e. tags) of the nested components
  findNestedComponents: function($, str) {
    var nestedComponents = [],
        self             = this,
        children;

    // if array hasn't been set yet, set it with properties of object
    if (!self.zfArray) {
      self.setTagArray();
    }
    // if the nested component is an element, find the children
    // NOTE: this is to avoid a cheerio quirk where it will still pass
    // special alphanumeric characters as a selector
    if (str.indexOf('<') !== -1) {
      children = $(str);
    };

    $(children).each(function(i, el) {
      // if the element's name matches an element in the array
      if (self.zfArray.indexOf(el.name) !== -1) {
        // push them to array of nested component names
        nestedComponents.push(el.name);
      }
    });
    // return array containing all nested components
    return nestedComponents;
  },

  // Description:
  //   Executes a function to find and return deeply nested custom elements within another element
  //   Uses the find selector rather than going through children.
  //
  // Arguments:
  //    $, el (String): Cheerio, and a string containing the markup of an element to be checked for nested components
  // Returns:
  //    nestedComponents (Array): An array containing the names (i.e. tags) of the nested components
  findDeeplyNested: function($, el) {
    var nestedComponents = [],
        self             = this;

    // if array hasn't been set yet, set it with properties of object
    if (!self.zfArray) {
      self.setTagArray();
    }

    // if the nested component is an element, find the children
    // NOTE: this is to avoid a cheerio quirk where it will still pass
    // special alphanumeric characters as a selector
    if (el.indexOf('<') !== -1) {
      $(self.zfArray).each(function(idx, zfElement) {
        // find any nearby elements that are contained within el
        if ($(el).find(zfElement).length > 0) {
          nestedComponents.push(zfElement);
        }
      });
    };

    // return array containing all nested components
    return nestedComponents;
  },

  // Description:
  //   Goes through array of custom nested components to determine whether or not there are any on the DOM
  //
  // Arguments:
  //    $ : Cheerio
  // Returns:
  //    boolean: True if there are nested components on the DOM, false otherwise.
  checkZfComponents: function($) {
    var self = this;

    // if array hasn't been set yet, set it with properties of object
    if (!self.zfArray) {
      self.setTagArray();
    }

    $(self.zfArray).each(function(idx, zfElement) {
      // check if custom elements still exist
      if ($('center').find(zfElement).length > 0) {
        return true;
      }
    });

  },

  // Description:
  //    Returns output for desired custom element
  //
  // Arguments:
  //   $, element (obj), type (str): cheerio, element as a cheerio object, and type as the tag name
  // Returns:
  //    HTML (string): Mark up for corresponding element with inner html contents untouched
  componentFactory: function($, element, type) {
    var output    = '',
        component = $(element),
        inner     = $(element).html(),
        compClass = '',
        self      = this;

    if ($(component).attr('class')) {
      compClass = $(component).attr('class');
    };

    switch (type) {
      case self.zfTags.callout:
        output = '<td class="callout ' + compClass +'">' + inner + '</td>';
        break;

      case self.zfTags.button:
        output = '<table class="button ' + compClass +'"><tbody><tr><td>' + inner + '</td></tr></tbody></table>';
        break;

      case self.zfTags.subcolumns:
        output = self.makeCols($, component, 'subcolumns');
        break;

      case self.zfTags.container:
        output = '<table class="container ' + compClass + '"><tbody><tr><td>' + inner + '</td></tr></tbody></table>';
        break;

      case self.zfTags.columns:
        output = self.makeCols($, component, 'columns');
        break;
      
      case self.zfTags.row:
        output = '<table class="row ' + compClass + '"><tbody><tr>'+ inner + '</tr></tbody></table>';
        break;

      case self.zfTags.inlineListH:
        inner  = self.makeInlineList($, component, 'horizontal');
        output = '<table class="inline-list ' + compClass + '"><tbody><tr>' + inner + '</tr></tbody></table>';
        break;

      case self.zfTags.inlineListV:
        inner  = self.makeInlineList($, component, 'vertical');
        output = '<table class="inline-list ' + compClass + '"><tbody>' + inner + '</tbody></table>';
        break;

      default: 
        // unless it's a special element, just grab the inside
        // another cheerio quirk
        inner = $.html(element);
        output = '<td>' + inner + '</td>';
    };

    return output;
  },

  // Description:
  //    Returns output for inline list elements. 
  //
  // Arguments:
  //    $ (obj), col (obj), orientation (str): cheerio, the list, whether vertical/horizontal list
  // Returns:
  //    HTML (string): Mark up for inline lists
  makeInlineList: function($, list, orientation) {
    var output   = '';
    var children = list.children();

    $(children).each(function(idx, el) {
      var innerChild = $.html(el);

      if (orientation === 'horizontal') {
        output += '<td>' + innerChild + '</td>';
      }
      else if (orientation === 'vertical') {
        output += '<tr><td class="vertical">' + innerChild + '</td></tr>';
      }
      else {
        return;
      }
    });
    return output;
  },

  // Description:
  //    Returns output for column elements. TODO: this could be refactored to handle both cols and subcols
  //
  // Arguments:
  //    $ (obj), col (obj): cheerio, the target column
  // Returns:
  //    HTML (string): Mark up for columns all contained in a row
  makeCols: function($, col, type) {
    var output      = '',
        wrapperHTML = '',
        colSize     = '',
        colClass    = '',
        inner       = $(col).html(),
        self        = this;

    // Add 1 to include current column
    var colCount = $(col).siblings().length + 1;

    if ($(col).attr('class')) {
      colClass = $(col).attr('class');
    }

    // check for sizes
    // if no attribute is provided, default to small-12
    // divide evenly for large columns
    if ($(col).attr('small')) {
      colSize += 'small' + '-' + $(col).attr('small') + ' ';
    }
    else {
      colSize += 'small-12 ';
    }

    if ($(col).attr('large')) {
      colSize += 'large' + '-' + $(col).attr('large') + ' ';
    }
    else {
      colSize += 'large-' + Math.floor(self.grid/colCount) + ' ';
    }

    // start making markup
    if (type === 'columns') {
      // if it is the last column, add the class last
      if ($(col).next()[0] && $(col).next()[0].name !== 'columns') {
        output = '<td class="wrapper ' + colClass + 'last">';

      } else {
        output = '<td class="wrapper ' + colClass + '">';
      }

      output += '<table class="' + colSize + 'columns"><tr>';
      output += inner;
      output += '<td class="expander"></td></tr></table>';
    }
    else if (type === 'subcolumns') {

      // if it is the last subcolumn, add the last class
      if ($(col).next()[0] && $(col).next()[0].name !== 'subcolumns') {
        output = '<td class="sub-columns last' + colClass + ' ' + colSize +'">' + inner + '</td>';
      }
      else {
        output = '<td class="sub-columns' + colClass + ' ' + colSize +'">' + inner + '</td>';
      }      
    }
    else {
      return;
    }

    return output;
  }
};

module.exports = new Inky();