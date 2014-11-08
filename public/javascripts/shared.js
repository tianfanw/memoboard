$(function() {
  
  canvas.on('object:moving', sendMovement);

  function sendMovement(e) {
    var activeObject = canvas.getActiveObject();
    var data = new Object();
    data.id = activeObject.name;
    data.top = activeObject.getTop();
    data.left = activeObject.getLeft();
    socket.emit('update', {type: activeObject.type, data: data});
  }

  canvas.on('object:scaling', sendScale);

  function sendScale(e) {
    var activeObject = canvas.getActiveObject();
    var data = new Object();
    data.id = activeObject.name;
    data.scaleX = activeObject.getScaleX();
    data.scaleY = activeObject.getScaleY();
    data.angle = activeObject.getAngle();
    socket.emit('update', {type: activeObject.type, data: data});
  }

  canvas.on('object:rotating', sendRotate);

  function sendRotate(e) {
    var activeObject = canvas.getActiveObject();
    var data = new Object();
    data.id = activeObject.name;
    data.scaleX = activeObject.getScaleX();
    data.scaleY = activeObject.getScaleY();
    data.angle = activeObject.getAngle();
    socket.emit('update', {type: activeObject.type, data:data});
  }

  canvas.on('mouse:move', sendCursor);

  function sendCursor(e) {
    socket.emit('mousemove', {x: e.e.pageX, y: e.e.pageY});
  }  

  $('.deletePoll').live('click', function(e) {
    var row = $(this).parent();
    $.ajax({
      url : window.location.href + '/poll',
      type : 'delete',
      dataType : 'json',
      data : {
        poll_id : row.attr('id')
      },
      success : function(res, textStatus, jqXHR) {
        if (res.error) {
          console.log(res.error);
          return;
        }
        row.remove();
      },
      error : function(jqXHR, textStatus, errorThrown) {
        // log the error to the console
        console.log("The following error occured: " + textStatus, errorThrown);
      },
      complete : function(jqXHR, textStatus) {

      }
    });
  });
});