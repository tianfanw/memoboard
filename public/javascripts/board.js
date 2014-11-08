var canvas = new fabric.Canvas('canvas');
canvas.selection = false;
var g_canvas_is_modified = false;
(function(global) {

  "use strict";

  function pad(str, length) {
    while (str.length < length) {
      str = '0' + str;
    }
    return str;
   };

  var getRandomInt = fabric.util.getRandomInt;
  function getRandomColor() {
    return (
      pad(getRandomInt(0, 255).toString(16), 2) +
      pad(getRandomInt(0, 255).toString(16), 2) +
      pad(getRandomInt(0, 255).toString(16), 2)
    );
  }

  function getRandomNum(min, max) {
    return Math.random() * (max - min) + min;
  }

  if (/(iPhone|iPod|iPad)/i.test(navigator.userAgent)) {
    fabric.Object.prototype.cornersize = 30;
  }

  // var canvas = global.canvas = new fabric.Canvas('canvas');

  // canvas.controlsAboveOverlay = true;

  document.getElementById('commands').onclick = function(ev) {
    ev = ev || window.event;

    if (ev.preventDefault) {
      ev.preventDefault()
    }
    else if (ev.returnValue) {
      ev.returnValue = false;
    }

    var element = ev.target || ev.srcElement;
    if (element.nodeName.toLowerCase() === 'strong') {
      element = element.parentNode;
    }

    var className = element.className,
        offset = 50,
        left = fabric.util.getRandomInt(0 + offset, 700 - offset),
        top = fabric.util.getRandomInt(0 + offset, 500 - offset),
        angle = fabric.util.getRandomInt(-20, 40),
        width = fabric.util.getRandomInt(30, 50),
        opacity = (function(min, max){ return Math.random() * (max - min) + min; })(0.5, 1);

    switch (className) {
      case 'rect':
        canvas.add(new fabric.Rect({
          left: left,
          top: top,
          fill: '#' + getRandomColor(),
          width: 50,
          height: 50,
          opacity: 0.8
        }));
        break;

      case 'circle':
        canvas.add(new fabric.Circle({
          left: left,
          top: top,
          fill: '#' + getRandomColor(),
          radius: 50,
          opacity: 0.8
        }));
        break;

      case 'triangle':
        canvas.add(new fabric.Triangle({
          left: left,
          top: top,
          fill: '#' + getRandomColor(),
          width: 50,
          height: 50,
          opacity: 0.8
        }));
        break;

      case 'image1':
        fabric.Image.fromURL('../assets/pug.jpg', function(image) {
          image.set({
            left: left,
            top: top,
            angle: angle,
            padding: 10,
            cornersize: 10
          });
          image.scale(getRandomNum(0.1, 0.25)).setCoords();
          canvas.add(image);
        });
        break;

      case 'image2':
        fabric.Image.fromURL('../assets/logo.png', function(image) {
          image.set({
            left: left,
            top: top,
            angle: angle,
            padding: 10,
            cornersize: 10
          });
          image.scale(getRandomNum(0.1, 1)).setCoords();
          canvas.add(image);
          updateComplexity();
        });
        break;

      case 'imgbtn':
        fabric.Image.fromURL('http://fabricjs.com/assets/logo.png', function(image) {
          image.set({
            left: left,
            top: top,
            angle: angle,
            padding: 10,
            cornersize: 10
          });
          image.scale(getRandomNum(0.1, 1)).setCoords();
          canvas.add(image);
        });
        break;

      case 'shape':
        var id = element.id, match;
        if (match = /\d+$/.exec(id)) {
          fabric.loadSVGFromURL('../assets/' + match[0] + '.svg', function(objects, options) {
            var loadedObject = fabric.util.groupSVGElements(objects, options);

            loadedObject.set({
              left: left,
              top: top,
              angle: angle,
              padding: 10,
              cornersize: 10
            });
            loadedObject/*.scaleToWidth(300)*/.setCoords();

            // loadedObject.hasRotatingPoint = true;

            canvas.add(loadedObject);
            updateComplexity();
            canvas.calcOffset();
          });
        }
        break;

      case 'clear':
        if (confirm('Are you sure?')) {
          socket.emit('deleteAll');
          canvas.clear();
          //---------------------------------------------------------------------------------------------------------------------清空canvas
        }
    }
    // updateComplexity();
  };

  // function updateComplexity() {
  //   setTimeout(function(){
  //     document.getElementById('complexity').childNodes[1].innerHTML = ' ' + canvas.complexity();
  //   }, 100);
  // }

  // document.getElementById('execute').onclick = function() {
  //   var code = document.getElementById('canvas-console').value;
  //   if (!(/^\s+$/).test(code)) {
  //     eval(code);
  //   }
  // };

  document.getElementById('rasterize').onclick = function() {
    if (!fabric.Canvas.supports('toDataURL')) {
      alert('This browser doesn\'t provide means to serialize canvas to an image');
    }
    else {
      socket.emit('sendPng', canvas.toDataURL('png'));
      window.open(canvas.toDataURL('png'));
    }
  };

  var removeSelectedEl = document.getElementById('remove-selected');
  removeSelectedEl.onclick = function() {
    var activeObject = canvas.getActiveObject(),
        activeGroup = canvas.getActiveGroup();
    if (activeObject) {
      // console.log(activeObject.type);
      // if (activeObject.type === 'image' || activeObject.type === 'text' || activeObject.type === 'path'){
        // var src = activeObject.getSrc();
        // var url = document.createElement('a');
        // url.href = src;
        //alert(activeObject.name);
        console.log(activeObject.name)
        socket.emit('delete', {type: activeObject.type, id: activeObject.name});
        g_canvas_is_modified = true;
        // $.ajax({
        //     url: window.location.href + '/images',
        //     type: 'delete',
        //     dataType: 'json',
        //     data: {imagePath: url.pathname},
        //     success: function(data, textStatus, jqXHR){
        //         if(data.error) {
        //             alert(data.error);
        //             return;
        //         }
        //         row.remove();
        //     },
        //     // callback handler that will be called on error
        //     error: function(jqXHR, textStatus, errorThrown){
        //         // log the error to the console
        //         console.log(
        //             "The following error occured: "+
        //             textStatus, errorThrown
        //         );
        //     },
        // });
      // }
      // canvas.remove(activeObject);
    }
    else if (activeGroup) {
      var objectsInGroup = activeGroup.getObjects();
      canvas.discardActiveGroup();
      objectsInGroup.forEach(function(object) {
        canvas.remove(object);
      });
    }
  };

  var supportsInputOfType = function(type) {
    return function() {
      var el = document.createElement('input');
      try {
        el.type = type;
      }
      catch(err) { }
      return el.type === type;
    };
  };

  var supportsSlider = supportsInputOfType('range'),
      supportsColorpicker = supportsInputOfType('color');

  // if (supportsSlider()) {
  //   (function(){
  //     var controls = document.getElementById('controls');

  //     var sliderLabel = document.createElement('label');
  //     sliderLabel.htmlFor = 'opacity';
  //     sliderLabel.innerHTML = 'Opacity: ';

  //     var slider = document.createElement('input');

  //     try { slider.type = 'range'; } catch(err) { }

  //     slider.id = 'opacity';
  //     slider.value = 100;

  //     controls.appendChild(sliderLabel);
  //     controls.appendChild(slider);

  //     canvas.calcOffset();

  //     slider.onchange = function() {
  //       var activeObject = canvas.getActiveObject(),
  //           activeGroup = canvas.getActiveGroup();

  //       if (activeObject || activeGroup) {
  //         (activeObject || activeGroup).setOpacity(parseInt(this.value, 10) / 100);
  //         canvas.renderAll();
  //       }
  //     };
  //   })();
  // }

  // if (supportsColorpicker()) {
  //   (function(){
  //     var controls = document.getElementById('controls');

  //     var label = document.createElement('label');
  //     label.htmlFor = 'color';
  //     label.innerHTML = 'Color: ';
  //     label.style.marginLeft = '10px';

  //     var colorpicker = document.createElement('input');
  //     colorpicker.type = 'color';
  //     colorpicker.id = 'color';
  //     colorpicker.style.width = '40px';

  //     controls.appendChild(label);
  //     controls.appendChild(colorpicker);

  //     canvas.calcOffset();

  //     colorpicker.onchange = function() {
  //       var activeObject = canvas.getActiveObject(),
  //           activeGroup = canvas.getActiveGroup();

  //       if (activeObject || activeGroup) {
  //         (activeObject || activeGroup).setFill(this.value);
  //         canvas.renderAll();
  //       }
  //     };
  //   })();
  // }

  // var lockHorizontallyEl = document.getElementById('lock-horizontally');
  // lockHorizontallyEl.onclick = function() {
  //   var activeObject = canvas.getActiveObject();
  //   if (activeObject) {
  //     activeObject.lockMovementX = !activeObject.lockMovementX;
  //     lockHorizontallyEl.innerHTML = activeObject.lockMovementX
  //       ? 'Unlock horizontal movement'
  //       : 'Lock horizontal movement';
  //   }
  // };

  // var lockVerticallyEl = document.getElementById('lock-vertically');
  // lockVerticallyEl.onclick = function() {
  //   var activeObject = canvas.getActiveObject();
  //   if (activeObject) {
  //     activeObject.lockMovementY = !activeObject.lockMovementY;
  //     lockVerticallyEl.innerHTML = activeObject.lockMovementY
  //       ? 'Unlock vertical movement'
  //       : 'Lock vertical movement';
  //   }
  // };

  // var lockScalingXEl = document.getElementById('lock-scaling-x');
  // lockScalingXEl.onclick = function() {
  //   var activeObject = canvas.getActiveObject();
  //   if (activeObject) {
  //     activeObject.lockScalingX = !activeObject.lockScalingX;
  //     lockScalingXEl.innerHTML = activeObject.lockScalingX
  //       ? 'Unlock horizontal scaling'
  //       : 'Lock horizontal scaling';
  //   }
  // };

  // var lockScalingYEl = document.getElementById('lock-scaling-y');
  // lockScalingYEl.onclick = function() {
  //   var activeObject = canvas.getActiveObject();
  //   if (activeObject) {
  //     activeObject.lockScalingY = !activeObject.lockScalingY;
  //     lockScalingYEl.innerHTML = activeObject.lockScalingY
  //       ? 'Unlock vertical scaling'
  //       : 'Lock vertical scaling';
  //   }
  // };

  var lockRotationEl = document.getElementById('lock-rotation');
  lockRotationEl.onclick = function() {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.lockRotation = !activeObject.lockRotation;
      // lockRotationEl.innerHTML = activeObject.lockRotation
      //   ? 'Unlock rotation'
      //   : 'Lock rotation';
    }
  };

  // var gradientifyBtn = document.getElementById('gradientify');

  var activeObjectButtons = [
    // lockHorizontallyEl,
    // lockVerticallyEl,
    // lockScalingXEl,
    // lockScalingYEl,
    lockRotationEl,
    removeSelectedEl,
    // gradientifyBtn
  ];

  var opacityEl = document.getElementById('opacity');
  if (opacityEl) {
    activeObjectButtons.push(opacityEl);
  }
  var colorEl = document.getElementById('color');
  if (colorEl) {
    activeObjectButtons.push(colorEl);
  }

  for (var i = activeObjectButtons.length; i--; ) {
    activeObjectButtons[i].disabled = true;
  }

  canvas.on('object:selected', onObjectSelected);
  canvas.on('group:selected', onObjectSelected);

  function onObjectSelected(e) {
    var selectedObject = e.target;
    var addtext = document.getElementById('add-text');
    var edittext = document.getElementById('edit-text');
    var newNote = document.getElementById('newNote');
    var editNote = document.getElementById('editNote');
    if (selectedObject.type === 'text') {
      addtext.style.visibility = 'hidden';
      edittext.style.visibility = 'visible';
      newNote.style.visibility = 'hidden'
    }
    else{
      addtext.style.visibility = 'visible';
      edittext.style.visibility = 'hidden';
      editNote.style.visibility = 'hidden';
    }
  }

  canvas.on('selection:cleared', function(e) {
    var addtext = document.getElementById('add-text');
    var edittext = document.getElementById('edit-text');
    var uploadForm = document.getElementById('uploadForm');
    //var shareBoard = document.getElementById('shareBoard');
    //var pollInfo = document.getElementById('pollInfo');
    var newNote = document.getElementById('newNote');
    var editNote = document.getElementById('editNote');
    addtext.style.visibility = 'visible';
    edittext.style.visibility = 'hidden';
    uploadForm.style.visibility = 'hidden';
    //shareBoard.style.visibility = 'hidden';
    //if(pollInfo)
    //  pollInfo.style.visibility = 'hidden';
    newNote.style.visibility = 'hidden';
    editNote.style.visibility = 'hidden';
    //----------------------------------------------------------------------------------------------------------------------------selection:cleared
  });

  var drawingModeEl = document.getElementById('drawing-mode'),
      cancelDrawingModeEl = document.getElementById('cancel-drawing-mode'),
      drawingOptionsEl = document.getElementById('drawing-mode-options'),
      // drawingColorEl = document.getElementById('drawing-color'),
      drawingLineWidthEl = document.getElementById('drawing-line-width');

  // drawingModeEl.onclick = function() {
  //   canvas.isDrawingMode = !canvas.isDrawingMode;
  //   if (canvas.isDrawingMode) {
  //     drawingModeEl.innerHTML = 'Cancel drawing mode';
  //     drawingModeEl.className = 'is-drawing';
  //     drawingOptionsEl.style.display = '';
  //   }
  //   else {
  //     drawingModeEl.innerHTML = 'Enter drawing mode';
  //     drawingModeEl.className = '';
  //     drawingOptionsEl.style.display = 'none';
  //   }
  // };
  drawingModeEl.onclick = function() {
    if(!canvas.isDrawingMode) {
      canvas.isDrawingMode = !canvas.isDrawingMode;
      drawingOptionsEl.style.display = '';
    }
  }

  cancelDrawingModeEl.onclick = function() {
    if (canvas.isDrawingMode) {
      canvas.isDrawingMode = !canvas.isDrawingMode;
      drawingOptionsEl.style.display = 'none';
    }
  }


  canvas.on('path:created', function(e) {
    // canvas.forEachObject(function(obj){
    //   if(obj.type=='path'){
    //     obj.selectable=false;
    //   };
    // });
    
    // e.path.setOpacity('0.2');
    // e.path.selectable=false
    // e.path.pathClosed=true;
    // var t =e.path.toSVG();
    var t =e.path.path.toString();
    // var path= new fabric.Path.fromObject({ 
    //   type: 'path', 
    //   'path': t,
    //   left: e.path.left, 
    //   top: e.path.top,
    //   fill: e.path.fill,
    //   stroke: e.path.stroke,
    //   strokeWidth: 10,
    //   width: e.path.width,
    //   height: e.path.height,
    //   pathClosed:true,
    // });
    var data = new Object();
    data.path = t;
    data.left = e.path.left;
    data.top = e.path.top;
    data.angle = e.path.angle;
    data.scaleX = e.path.scaleX;
    data.scaleY = e.path.scaleY;
    data.stroke= e.path.stroke;
    data.strokeWidth = e.path.strokeWidth;
    data.width = e.path.width;
    data.height = e.path.height;
    socket.emit('add', {type: 'path', data:data});
    g_canvas_is_modified = true;
    // var path= new fabric.Path(t,
    //   { left: e.path.left, 
    //     top: e.path.top, 
    //     stroke: e.path.stroke, 
    //     strokeWidth: e.path.strokeWidth, 
    //     fill: "none", 
    //     width: e.path.width, 
    //     height: e.path.height
    //   })


    // canvas.add(path);
    // canvas.renderAll();

  });

  // drawingColorEl.onchange = function() {
  //   canvas.freeDrawingColor = drawingColorEl.value;
  // };

  var widt1 = false;
  $('#colorSelector1').bind('click', function() {
    $('#colorpickerHolder1').stop().animate({height: widt1 ? 0 : 173}, 500);
    widt1 = !widt1;
  });
  $('#colorpickerHolder1').ColorPicker({
    flat: true,
    color: '#000000',
    onSubmit: function(hsb, hex, rgb) {
      $('#colorSelector1 div').css('backgroundColor', '#' + hex);
      canvas.freeDrawingColor = '#' + hex;
    }
  });
  $('#colorpickerHolder1>div').css('position', 'absolute');

  drawingLineWidthEl.onchange = function() {
    canvas.freeDrawingLineWidth = parseInt(drawingLineWidthEl.value, 10) || 1; // disallow 0, NaN, etc.
  };

  //canvas.freeDrawingColor = drawingColorEl.value;
  canvas.freeDrawingLineWidth = parseInt(drawingLineWidthEl.value, 10) || 1;


  var text = 'Lorem ipsum dolor sit amet,\nconsectetur adipisicing elit,\nsed do eiusmod tempor incididunt\nut labore et dolore magna aliqua.\n' +
    'Ut enim ad minim veniam,\nquis nostrud exercitation ullamco\nlaboris nisi ut aliquip ex ea commodo consequat.';

  document.getElementById('add-text').onclick = function(){
    var newNote = document.getElementById('newNote');
    newNote.style.visibility = (newNote.style.visibility == 'visible'? 'hidden':'visible');
  }

  document.getElementById('post-text').onclick = function() {
    // var text1 = prompt("Please enter your notes");
    var textarea1 = document.getElementById('newtext');
    var text1=textarea1.value;
    // var textSample = new fabric.Text(text1, {
    //   left: getRandomInt(350, 400),
    //   top: getRandomInt(350, 400),
    //   fontFamily: 'helvetica',
    //   angle: getRandomInt(-10, 10),
    //   fill: '#' + getRandomColor(),
    //   scaleX: 0.5,
    //   scaleY: 0.5,
    //   fontWeight: '',
    //   //backgroundColor: '#555',
    // });
    // console.log(JSON.stringify(textSample));
    // canvas.add(textSample);
    var data = new Object();
    data.text = text1;
    data.left = 200;
    data.top = 200;
    data.fontFamily = 'helvetica';
    data.scaleX = 0.5;
    data.scaleY = 0.5;
    data.angle = getRandomInt(-10,10);
    data.fill = '#' + getRandomColor();
    socket.emit('add', {type: 'text', data:data});
    g_canvas_is_modified = true;
    var newNote = document.getElementById('newNote');
    newNote.style.visibility  = 'hidden';
  };

  document.getElementById('edit-text').onclick = function(){
    var editNote = document.getElementById('editNote');
    editNote.style.visibility = (editNote.style.visibility == 'visible'? 'hidden':'visible');
  }

  var textEl = document.getElementById('text');
  if (textEl) {
    textEl.onfocus = function() {
      var activeObject = canvas.getActiveObject();

      if (activeObject && activeObject.type === 'text') {
        this.value = activeObject.text;
      }
    };
    textEl.onkeyup = function(e) {
      var activeObject = canvas.getActiveObject();
      if (activeObject) {
        if (!this.value) {
          canvas.discardActiveObject();
        }
        else {
          activeObject.text = this.value;
        }
        canvas.renderAll();
      }
    };
    var confirmEdit = document.getElementById('confirmEdit');
    confirmEdit.onclick = function() {
      var activeObject = canvas.getActiveObject();
      var data = new Object();
      data.id = activeObject.name;
      data.text = activeObject.text;
      data.fontFamily = activeObject.fontFamily;
      data.fill = activeObject.fill;
      socket.emit('update', {type: activeObject.type, data:data});
      socket.emit('save', {type: activeObject.type, data:data});
      g_canvas_is_modified = true;
      var editNote = document.getElementById('editNote');
      editNote.style.visibility = 'hidden';
    }
  }


  document.onkeydown = function(e) {
    var obj = canvas.getActiveObject() || canvas.getActiveGroup();
    if (obj && e.keyCode === 8) {
      // this is horrible. need to fix, so that unified interface can be used
      if (obj.type === 'group') {
        // var groupObjects = obj.getObjects();
        //         canvas.discardActiveGroup();
        //         groupObjects.forEach(function(obj) {
        //           canvas.remove(obj);
        //         });
      }
      else {
        //canvas.remove(obj);
      }
      canvas.renderAll();
      // return false;
    }
  };

  setTimeout(function() {
    canvas.calcOffset();
  }, 100);

  if (document.location.search.indexOf('guidelines') > -1) {
    initCenteringGuidelines(canvas);
    initAligningGuidelines(canvas);
  }

  var cmdUnderlineBtn = document.getElementById('text-cmd-underline');
  if (cmdUnderlineBtn) {
    activeObjectButtons.push(cmdUnderlineBtn);
    cmdUnderlineBtn.disabled = true;
    cmdUnderlineBtn.onclick = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.textDecoration = (activeObject.textDecoration == 'underline' ? '' : 'underline');
        this.className = activeObject.textDecoration ? 'selected' : '';
        canvas.renderAll();
      }
    };
  }

  var cmdLinethroughBtn = document.getElementById('text-cmd-linethrough');
  if (cmdLinethroughBtn) {
    activeObjectButtons.push(cmdLinethroughBtn);
    cmdLinethroughBtn.disabled = true;
    cmdLinethroughBtn.onclick = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.textDecoration = (activeObject.textDecoration == 'line-through' ? '' : 'line-through');
        this.className = activeObject.textDecoration ? 'selected' : '';
        canvas.renderAll();
      }
    };
  }

  var cmdOverlineBtn = document.getElementById('text-cmd-overline');
  if (cmdOverlineBtn) {
    activeObjectButtons.push(cmdOverlineBtn);
    cmdOverlineBtn.disabled = true;
    cmdOverlineBtn.onclick = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.textDecoration = (activeObject.textDecoration == 'overline' ? '' : 'overline');
        this.className = activeObject.textDecoration ? 'selected' : '';
        canvas.renderAll();
      }
    };
  }

  var cmdBoldBtn = document.getElementById('text-cmd-bold');
  if (cmdBoldBtn) {
    activeObjectButtons.push(cmdBoldBtn);
    cmdBoldBtn.disabled = true;
    cmdBoldBtn.onclick = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.fontWeight = (activeObject.fontWeight == 'bold' ? '' : 'bold');
        this.className = activeObject.fontWeight ? 'selected' : '';
        canvas.renderAll();
      }
    };
  }

  var cmdItalicBtn = document.getElementById('text-cmd-italic');
  if (cmdItalicBtn) {
    activeObjectButtons.push(cmdItalicBtn);
    cmdItalicBtn.disabled = true;
    cmdItalicBtn.onclick = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.fontStyle = (activeObject.fontStyle == 'italic' ? '' : 'italic');
        this.className = activeObject.fontStyle ? 'selected' : '';
        canvas.renderAll();
      }
    };
  }

  var cmdShadowBtn = document.getElementById('text-cmd-shadow');
  if (cmdShadowBtn) {
    activeObjectButtons.push(cmdShadowBtn);
    cmdShadowBtn.disabled = true;
    cmdShadowBtn.onclick = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.textShadow = !activeObject.textShadow ? 'rgba(0,0,0,0.2) 2px 2px 10px' : '';
        this.className = activeObject.textShadow ? 'selected' : '';
        canvas.renderAll();
      }
    };
  }

  var textAlignSwitch = document.getElementById('text-align');
  if (textAlignSwitch) {
    // activeObjectButtons.push(textAlignSwitch);
    // textAlignSwitch.disabled = true;
    textAlignSwitch.onchange = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.textAlign = this.value.toLowerCase();
        canvas.renderAll();
      }
    };
  }

  var fontFamilySwitch = document.getElementById('font-family');
  if (fontFamilySwitch) {
    // activeObjectButtons.push(fontFamilySwitch);
    // fontFamilySwitch.disabled = true;
    fontFamilySwitch.onchange = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.fontFamily = this.value;
        canvas.renderAll();
      }
    };
  }

  var bgColorField = document.getElementById('text-bg-color');
  if (bgColorField) {
    bgColorField.onchange = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.backgroundColor = this.value;
        canvas.renderAll();
      }
    };
  }

  var strokeColorField = document.getElementById('text-stroke-color');
  if (strokeColorField) {
    strokeColorField.onchange = function() {
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text') {
        activeObject.strokeStyle = this.value;
        canvas.renderAll();
      }
    };
  }

  var widt = false;
  $('#colorSelector2').bind('click', function() {
    $('#colorpickerHolder2').stop().animate({height: widt ? 0 : 173}, 500);
    widt = !widt;
  });
  $('#colorpickerHolder2').ColorPicker({
    flat: true,
    color: '#00ff00',
    onSubmit: function(hsb, hex, rgb) {
      $('#colorSelector2 div').css('backgroundColor', '#' + hex);
      var activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === 'text'){
        activeObject.fill = '#' + hex;
        canvas.renderAll();
      }
    }
  });
  $('#colorpickerHolder2>div').css('position', 'absolute');

  var addImage = document.getElementById('add-image');
  addImage.onclick = function(){
    var uploadForm = document.getElementById('uploadForm');
    // if (uploadForm.style.visibility = 'hidden'){
    //   uploadForm.style.visibility = 'visible';
    // }
    uploadForm.style.visibility = (uploadForm.style.visibility =='visible'? 'hidden':'visible');
  };

  // var shareBtnEl = document.getElementById('sharebtn');
  // shareBtnEl.onclick = function(){
  //   var shareBoard = document.getElementById('shareBoard');
  //   shareBoard.style.visibility = (shareBoard.style.visibility == 'visible'? 'hidden':'visible');
  // };

  // var pollBtnEl = document.getElementById('pollbtn');
  // if(pollBtnEl) {
  //   pollBtnEl.onclick = function(){
  //     var pollInfo = document.getElementById('pollInfo');
  //     pollInfo.style.visibility = (pollInfo.style.visibility == 'visible'? 'hidden':'visible');
  //   };
  // };

  var canvas2 = new fabric.Canvas('canvas2');
  var canvas3=new fabric.Canvas();
  var test = new fabric.Triangle({
          left: 200,
          top: 200,
          fill: '#' + getRandomColor(),
          width: 50,
          height: 50,
          opacity: 0.8
        });
  //var save = document.getElementById('savebtn');
  // var d = new Date();
  // var year=d.getFullYear();
  // var month = d.getMonth();
  // var day = d.getUTCDay();
  //save.onclick = function(){

    //canvas.setBackground('#222');
    //console.log(JSON.stringify(canvas));
    // function dd(){
      // var t = 'sss';
      // console.log('a');
      // var text = new fabric.Text(t, {
      //   left: 200,
      //   top: 200,
      //   fontFamily: 'helvetica',
      //   angle: 0,
      //   fill: '#000',
      //   scaleX: 0.5,
      //   scaleY: 0.5,
      //   fontWeight: '',
      //   //backgroundColor: '#555',
      // });
      // canvas.add(text);
    // }
    // canvas.forEachObject(function(obj){
    //   if(obj.type='text')
    //     console.log(obj.text);
    // })
    // var c=JSON.stringify(canvas);
    // alert(c);
    // canvas2.loadFromJSON(c);
  //};

  canvas.on('object:modified', saveChange);

  function saveChange(e) {
    var activeObject = canvas.getActiveObject();
    var data = new Object();
    if (activeObject.type == 'image' || activeObject.type == 'text' || activeObject.type == 'path') {
      data.id = activeObject.name;
      data.top = activeObject.getTop();
      data.left = activeObject.getLeft();
      data.scaleX = activeObject.getScaleX();
      data.scaleY = activeObject.getScaleY();
      data.angle = activeObject.getAngle();
    };
    socket.emit('save', {type: activeObject.type, data:data});
    g_canvas_is_modified = true;
  }

  var bg1 = document.getElementById('background1');
  bg1.onclick = function(){
    canvas.setBackgroundImage('/images/background1.png', canvas.renderAll.bind(canvas));
    document.getElementById('header').style.background = "#f7aa04";
    var data = new Object();
    data.bgImage = '/images/background1.png';
    data.bgColor = "#f7aa04";
    socket.emit('changeBackground', {data:data});
    g_canvas_is_modified = true;
  }

  var bg2 = document.getElementById('background2');
  bg2.onclick = function(){
    canvas.setBackgroundImage('/images/background2.png', canvas.renderAll.bind(canvas));
    document.getElementById('header').style.background = "#ba47cf";
    var data = new Object();
    data.bgImage = '/images/background2.png';
    data.bgColor = "#ba47cf";
    socket.emit('changeBackground', {data:data});
    g_canvas_is_modified = true;
  }

  var bg3 = document.getElementById('background3');
  bg3.onclick = function(){
    canvas.setBackgroundImage('/images/background3.png', canvas.renderAll.bind(canvas));
    document.getElementById('header').style.background = "#9ACD32";
    var data = new Object();
    data.bgImage = '/images/background3.png';
    data.bgColor = "#9ACD32";
    socket.emit('changeBackground', {data:data});
    g_canvas_is_modified = true;
  }

  var bg4 = document.getElementById('background4');
  bg4.onclick = function(){
    canvas.setBackgroundImage('/images/background4.png', canvas.renderAll.bind(canvas));
    document.getElementById('header').style.background = "#6c74e2";
    var data = new Object();
    data.bgImage = '/images/background4.png';
    data.bgColor = "#6c74e2";
    socket.emit('changeBackground', {data:data});
    g_canvas_is_modified = true;
  }

  var defaultbg = document.getElementById('defaultbg');
  defaultbg.onclick = function(){
    canvas.setBackgroundImage('/images/defaultbg.png', canvas.renderAll.bind(canvas));
    document.getElementById('header').style.background = "#9ACD32";
    var data = new Object();
    data.bgImage = '/images/defaultbg.png';
    data.bgColor = "#9ACD32";
    socket.emit('changeBackground', {data:data});
    g_canvas_is_modified = true;
  }


  // if (supportsSlider) {
  //   (function(){
  //     var container = document.getElementById('text-controls');
  //     var slider = document.createElement('input');
  //     var label = document.createElement('label');
  //     label.innerHTML = 'Line height: ';
  //     try { slider.type = 'range'; } catch(err) { }
  //     slider.min = 0;
  //     slider.max = 10;
  //     slider.step = 0.1;
  //     slider.value = 1.5;
  //     container.appendChild(label);
  //     label.appendChild(slider);
  //     slider.title = "Line height";
  //     slider.onchange = function(){
  //       var activeObject = canvas.getActiveObject();
  //       if (activeObject && activeObject.type === 'text') {
  //         activeObject.lineHeight = this.value;
  //         canvas.renderAll();
  //       }
  //     };

  //     canvas.on('object:selected', function(e) {
  //       slider.value = e.target.lineHeight;
  //     });
  //   })();
  // }

  // document.getElementById('load-svg').onclick = function() {
  //   var svg = document.getElementById('svg-console').value;
  //   fabric.loadSVGFromString(svg, function(objects, options) {
  //     var obj = fabric.util.groupSVGElements(objects, options);
  //     canvas.add(obj).centerObject(obj).renderAll();
  //     obj.setCoords();
  //   });
  // };

  // if (typeof Cufon !== 'undefined') {
  //   Cufon.fonts.delicious.offsetLeft = 75;
  //   Cufon.fonts.delicious.offsetTop = 25;
  // }

//   $(document).ready(function() {
//     $('#uploadForm').submit(function() {
//         status('uploading the file ...');

//         $(this).ajaxSubmit({                                                                                                                 

//             error: function(xhr) {
//               status('Error: ' + xhr.status);
//             },

//             success: function(res) {
//                 if(res.error) {
//                     alert(res.error);
//                     status('Opps, something bad happened');
//                     return;
//                 }
//                 var imageUrlOnServer = res.path;

//                 status('Success, file uploaded to:' + imageUrlOnServer);
//                 $('#gallery').append($('<div><img src="' + imageUrlOnServer + '" /><button class="delete">Delete</button></div>'));
//                 fabric.Image.fromURL('http://fabricjs.com/assets/logo.png', function(image) {
//                   image.set({
//                     left: 200,
//                     top: 200,
//                     angle: 10,
//                     padding: 10,
//                     cornersize: 10
//                   });
//                   image.scale(getRandomNum(0.1, 1)).setCoords();
//                   canvas.add(image);
//                 });
//                 //$('<img/>').attr('src', imageUrlOnServer).appendTo($('#gallery'));
//             },
//             complete: function(jqXHR, textStatus) {
//                 $('[name="uploadedImage"]').val('');
//             },
            
//      });
//        return false;
//     });
// });

})(this);

// var context = canvas.getContext();

// context.shadowColor = "#999";
// context.shadowBlur = 10;
// context.shadowOffsetX = 5;
// context.shadowOffsetY = 5;