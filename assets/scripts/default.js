Jotted.plugin('custom', function(jotted, options) {

  var navs, navItems, item;

  if (options.order && options.order.length) {

    navs = $(jotted.$container).find(".jotted-nav");
    navItems = $(jotted.$container).find(".jotted-nav li").detach();
    for (var i = 0; i < options.order.length; i++) {
      item = options.order[i];
      navItems.filter(".jotted-nav-item-" + item).appendTo(navs);
    }
  }

  jotted.on('change', function(params, callback) {
    if (params.type == "css" && options.fontCss) {
      params.content = '@import url("' + options.fontCss + '");\n' +
        'html{\n background-color: #eee;\n' +
        '-webkit-box-shadow: inset 0 0 5px black;' +
        '-moz-box-shadow: inset 0 0 5px black;' +
        '-o-box-shadow: inset 0 0 5px black;' +
        'box-shadow: inset 0 0 5px black;' +
        'min-height: 100%;' +
        'font-family : Roboto;\n}\n' +
        'body{\n  \n' +
        'margin: 0;' +
        'padding: 5px;' +
        '}\n' +
        params.content;
    }
    if (params.type == "html") {

      options.scripts = options.scripts || "";
      options.scripts += '<script>document.addEventListener("click", function(e){ if(e.target && e.target.tagName == "A") e.preventDefault(); }, true);</script>';
      params.content = (options.scripts + "\n" + params.content);

    }
    callback(null, params);
  }, 20);

});

Jotted.plugin('clone', function(jotted, options) {

  if(!document.querySelector(".code-minimal.html-code") && !options.noclones.html){
    $('<div class="code-minimal html-code"><h4>html</h4><pre><code></code></pre></div>').appendTo('.post-content');
  }

  if(!document.querySelector(".code-minimal.js-code") && !options.noclones.js){
    $('<div class="code-minimal js-code"><h4>javascript</h4><pre><code></code></pre></div>').appendTo('.post-content');
  }

  if(!document.querySelector(".code-minimal.css-code") && !options.noclones.css){
    $('<div class="code-minimal css-code"><h4>css</h4><pre><code></code></pre></div>').appendTo('.post-content');
  }

  if(!document.querySelector(".code-minimal.final-output") && !options.noclones.output){
    $('<div class="code-minimal final-output"><h4>Output</h4><div class="output"><iframe></iframe></div></div>').appendTo('.post-content');
  }

  jotted.on('change', function(params, callback) {
    try {
      if (params.content && !options.noclones[params.type]) {
        if(params.type == "js"){
          var script = $("<div>").text(params.content).html().replace(/\/\/.*\n/g, function(match){
            return "<em><span>" + match + "</span></em>";
          });
          $(".code-minimal." + params.type + "-code>pre>code").html(script);
        }else{
          $(".code-minimal." + params.type + "-code>pre>code").text(params.content);
        }
        $(".code-minimal." + params.type + "-code").show();
      } else {
        if(!options.noclones[params.type]){
          $(".code-minimal." + params.type + "-code").hide();
        }
      }
    } catch (error) {

    }
    callback(null, params);
  }, 20);


  var fixHeightTImer;
  jotted.done('change', function(params, callback) {
    if(!options.noclones.output){
      try {

        var iframe = $(".code-minimal.final-output>.output>iframe").get(0);
        var result = $(".jotted-pane-result iframe").contents().find("html").html();
        var newFrame = document.createElement('iframe')

        iframe.parentNode.replaceChild(newFrame, iframe);

        var noShadow = '-webkit-box-shadow: none; -moz-box-shadow: none; -o-box-shadow: none; box-shadow: none;';

        newFrame.contentWindow.document.open();
        newFrame.contentWindow.document.write('<!doctype html><html style="' + noShadow + '">' + ((result || "").replace(/data-reactid/g, "rel")) + '</html>');
        newFrame.contentWindow.document.close();

        if (fixHeightTImer) {
          clearTimeout(fixHeightTImer);
        }

        fixHeightTImer = setTimeout(function() {
          $(newFrame).height(Math.max($(newFrame).height(), newFrame.contentWindow.document.body.offsetHeight + 20));
        }, 500);

      } catch (error) {

      }

    }
  });

});

$(document).ready(function() {

  $(".code-piece").each(function(){

    var elem = this;

    var mode = $(this).data("mode");
    var hidden = $(this).data("hidden");


    function acefy(elemx){

      var content = $(elemx).html();
      var editor = ace.edit(elemx);

      if(content){
        content = content/*.replace(/^<pre><code>|<\/code><\/pre>$/g, '')*/.replace(/^\s+|\s+$/g, '').replace(/^<!--|-->$/g, "").replace(/\s->/g, " -->").replace(/\\=/g, "=");
        editor.setValue(content, -1);
        //editor.renderer.setOption("showGutter", false);
        //editor.renderer.setOption("showLineNumbers", false);
        /*editor.session.gutterRenderer =  {
          getWidth: function(session, lastLineNumber, config) {
              return 7;
          },
          getText: function(session, row) {
              return row;
          }
        };*/
        editor.renderer.setOption("showInvisibles", false);
        editor.renderer.setOption("fadeFoldWidgets", true);
        editor.renderer.setOption("displayIndentGuides", false);
        editor.setTheme("ace/theme/ambiance");
        editor.getSession().setUseWorker(false);
        editor.getSession().setMode("ace/mode/" + mode);
      }

    }

    if(!hidden){
      acefy(elem);
      $(this).show();
    }

    var $toggle = $('<button class="code-toggle ' + (hidden ? "closed" : "") + '">' +
                     '<i class="fa fa-window-close ' + (hidden ? "hidden" : "") + '" aria-hidden="true" title="Click to hide code block"></i>' +
                     '<i class="fa fa-window-maximize ' + (hidden ? "" : "hidden") + '" aria-hidden="true" title="Click to show code block"></i>' +
                    '</button>');
    $toggle.insertBefore(this).click(function(){
      $(this).toggleClass("closed").find(".fa").toggleClass("hidden");
      $(elem).slideToggle(function(){
        if(!$(elem).is(".ace_editor")){
          acefy(this);
        }
      });
    });

  });


  $(".code-editor").each(function() {

    var jotted, files = [],
      plugins = [],
      scripts = "",
      order;

    files = (function(elem) {

      var files = [],
        path;
      var jot = $(elem).data("jotted");
      var mods = $(elem).data("mods");
      var noclones = $(elem).data("noclones") || "";

      var htmlurl = $(elem).data("htmlurl");
      var jsurl = $(elem).data("jsurl");
      var cssurl = $(elem).data("cssurl");

      plugins.push({
        name: 'ace'
      });

      if(noclones != "all"){
        plugins.push({
          name: 'clone',
          options :{
            noclones : {
              html : /html/.test(noclones),
              js  : /js/.test(noclones),
              css : /css/.test(noclones)
            }
          }
        });
      }

      if (jot) {

        path = ($(elem).data("path") || "/resources") + "/code/" + $(elem).data("name");

        if (/html/.test(jot)) {
          files.push({
            type: "html",
            url: htmlurl || (path + "/example.html")
          });
        }

        if (/js/.test(jot)) {
          files.push({
            type: "js",
            url: jsurl || (path + "/example." + (function() {
              if (/coffeescript/.test(mods)) {
                plugins.push({
                  name: 'coffeescript'
                });
                return "coffee";
              } else if (/babel/.test(mods)) {
                plugins.push({
                  name: 'babel',
                  options : {}
                });
                return "js";
              } else {
                return "js";
              }
            })())
          });
        }

        if (/css/.test(jot)) {
          files.push({
            type: "css",
            url: cssurl || (path + "/example." + (function() {
              if (/stylus/.test(mods)) {
                plugins.push({
                  name: 'stylus'
                });
                return "styl";
              } else if (/less/.test(mods)) {
                plugins.push({
                  name: 'less'
                });
                return "less";
              } else {
                return "css";
              }
            })())
          });
        }

        order = jot.split(",");

      }
      return files;

    })(this);


    $(this).find("input[type=hidden]").each(function() {
      scripts += (($("<script>").prop({
        "src" : $(this).val(),
        "type" : "text/javascript"
      }).prop("outerHTML") || "") + "\n");
    });

    $(this).before('<div class="code-editor-title"><label><i class="fa fa-cogs" aria-hidden="true"></i>Live Editor</label></div>');
    $(this).height(parseInt($(this).data("height")));

    plugins.push({
      name: 'custom',
      options: {
        order: order,
        fontCss: config.fontCSS.Roboto,
        scripts: scripts
      },
    });

    jotted = new Jotted(this, {
      files: files,
      //showBlank: true,
      plugins: plugins,
      debounce: 1000,
      pane: order[0]
    });

    $(this).find(".ace_editor").each(function() {
      var editor = ace.edit(this);
      editor.setTheme("ace/theme/ambiance");
      editor.getSession().setUseWorker(false);
      //editor.session.setMode("ace/mode/javascript");
    });

    if(jsType){
      $(this).find(".jotted-nav-item-js a").text(jsType);
    }

  });
});
