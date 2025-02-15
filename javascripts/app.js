var App;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
App = (function() {
  function App(element) {
    var query;
    this.htmlify = new Htmlify();
    this.dir = "/css-reference";
    this.history = [];
    this.history_pos = -1;
    this.paths = window.paths;
    this.write(this.root);
    this.bindEvents();
    window.app = this;
    query = '';
    if (window.location.hash) {
      query = window.location.hash.replace(/#\/|#/, '');
      if (query && query.toLowerCase().match(/css/)) {
        query = '';
      }
    }
    app.load(query, true, 'replace');
  }
  App.prototype.bindEvents = function() {
    $("input[type=search]").live('keydown', function(e) {
      if (e.keyCode === 9 && app.previous_keyCode !== 9) {
        e.preventDefault();
        return $(this).val($('.results .approximate li:first-child').text() || '');
      }
    });
    $("input[type=search]").live('keyup click', function(e) {
      switch (e.keyCode) {
        case 13:
          app.commit($(this).val());
          break;
        case 38:
          app.history_pos = Math.max(app.history_pos - 1, 0);
          $(this).val(app.history[app.history_pos]);
          app.display(app.history[app.history_pos]);
          break;
        case 40:
          app.history_pos = Math.min(app.history_pos + 1, app.history.length - 1);
          $(this).val(app.history[app.history_pos]);
          app.display(app.history[app.history_pos]);
      }
      app.preview($(this).val());
      if (e.keyCode) {
        return app.previous_keyCode = e.keyCode;
      }
    });
    $("body").live('click', function(e) {
      if ($(e.target).attr('type') === 'search' || ($(e.target).parents('.approximate').length > 0 && $(e.target).nodeName === 'li')) {
        if ($("input[type=search]").val().length > 0) {
          return app.commit($("input[type=search]").val());
        }
      }
    });
    $(".history li").live("click", function(e) {
      return app.load($(this).text());
    });
    $(".approximate li").live("click", function(e) {
      app.load($(this).text());
      return window.scrollTo(0, 0);
    });
    $(".header h1 a").live("click", function(e) {
      if (e.keyCode === 0 || e.button === 0) {
        app.load('');
      }
      return e.preventDefault();
    });
    return window.onpopstate = function(e) {
      var query;
      query = window.location.pathname.split('/');
      query = query[query.length - 1];
      return app.load(query, false);
    };
  };
  App.prototype.load = function(path, commit, mode) {
    var query;
    if (path == null) {
      path = '';
    }
    if (commit == null) {
      commit = true;
    }
    if (mode == null) {
      mode = 'push';
    }
    query = path.replace('/', '');
    this.preview(query);
    if (commit) {
      this.commit(query, mode);
    }
    this.history_pos = this.history.indexOf(query);
    return this.display(query);
  };
  App.prototype.display = function(query) {
    $('.search .history').html(app.htmlify.htmlify(app.history));
    $(".history li").each(function() {
      return $(this).removeClass('selected');
    });
    $($('.history li')[app.history_pos]).addClass('selected');
    return $("input[type=search]").val(app.history[app.history_pos]);
  };
  App.prototype.preview = function(input) {
    var approximates, attr, attribute, exact, html, lower, query, special, upper, vendor, _i, _len, _ref;
    html = "";
    approximates = [];
    query = input.toLowerCase();
    for (attribute in this.paths) {
      attr = attribute.toLowerCase();
      try {
        if (attr.match(query) && query.length > 0) {
          approximates.push(attribute);
        }
      } catch (e) {
        if ((attr.indexOf(query.toString()) >= 0) || (attribute.indexOf(query.toString()) >= 0) || (query.indexOf(attribute) >= 0) || (query.indexOf(attr) >= 0) && query.length > 0) {
          approximates.push(attribute);
        }
      }
    }
    if (approximates.length <= 0) {
      if (query !== '') {
        html = "No results for: " + query;
      }
      for (attribute in this.paths) {
        approximates.push(attribute);
      }
    }
    exact = [];
    lower = [];
    upper = [];
    vendor = [];
    special = [];
    _ref = approximates.sort();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      attribute = _ref[_i];
      if (query && attribute[0].toLowerCase() === query[0].toLowerCase()) {
        exact.push(attribute);
      } else if (attribute[0].match(/[a-z]/)) {
        lower.push(attribute);
      } else if (attribute[0].match(/[A-Z]/)) {
        upper.push(attribute);
      } else if (attribute[0].match(/-/)) {
        vendor.push(attribute);
      } else {
        special.push(attribute);
      }
    }
    approximates = exact.sort().concat(lower.sort()).concat(upper.sort()).concat(special.sort()).concat(vendor.sort());
    html += this.htmlify.htmlify(approximates);
    $('.results .approximate').html(html);
    if (input in this.paths || approximates.length === 1) {
      $('.results .exact').text("loading: " + input + " ...");
      attribute = approximates[0];
      if (input in this.paths) {
        attribute = input;
      }
      return $.ajax({
        type: 'GET',
        dataType: 'html',
        url: this.paths[attribute],
        success: __bind(function(r) {
          if (attribute) {
            html = this.htmlify.tagify("a(href='" + this.dir + "/#/" + attribute + "')", attribute);
          }
          if (attribute) {
            html = this.htmlify.tagify('h1', html);
          }
          html += r + '<hr />';
          return $(".results .exact").html(html);
        }, this),
        error: __bind(function(r) {
          return $('.results .exact').html('');
        }, this)
      });
    } else {
      return $('.results .exact').text('');
    }
  };
  App.prototype.commit = function(input, mode) {
    var url;
    if (mode == null) {
      mode = 'push';
    }
    if (input && input.length > 0 && this.history.indexOf(input) < 0) {
      this.history.unshift(input);
    }
    if (input) {
      this.history_pos = this.history.indexOf(input);
    }
    url = "" + this.dir + "/" + input;
    if (mode === 'push') {
      window.history.pushState({
        query: input
      }, url, url);
    }
    if (mode === 'replace') {
      window.history.replaceState({
        query: input
      }, url, url);
    }
    return app.load(input, false);
  };
  App.prototype.write = function(element) {
    $(element).hide();
    $(element).append(this.htmlify.htmlify(window.data.document));
    return $(element).fadeIn('fast');
  };
  return App;
})();
