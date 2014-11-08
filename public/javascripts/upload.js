$(document).ready(function() {
	// socket is renewed after page refresh!
	socket.emit('adduser', {username: g_username, user_id: g_user_id, board_id: g_board_id});
	
	// Upload image
    $('#uploadForm').submit(function() {
        
        $(this).ajaxSubmit({                                                                                                                 

            error: function(xhr) {
		        console.log('Error: ' + xhr.status);
            },

            success: function(res) {
                if(res.error) {
                    console.log(res.error);
                    status('Opps, something bad happened');
                    return;
                }
               
               fabric.Image.fromURL(res.image.path, function(image) {
                  image.set({
                    left: res.image.left,
                    top: res.image.top,
                    angle: res.image.angle,
                    scaleX: res.image.scaleX,
                    scaleY: res.image.scaleY,
                    padding: 10,
                    cornersize: 10,
                  });
                  image.name = res.image._id;
                  image.setCoords();
                  canvas.add(image);
                });
                socket.emit('add', {type: 'image', id: res.image._id});
                g_canvas_is_modified = true;
            },
            complete: function(jqXHR, textStatus) {
                $('[name="uploadedImage"]').val('');
                var uploadForm = document.getElementById('uploadForm')
                uploadForm.style.visibility = 'hidden';
            },
            
	   });

	// Have to stop the form from submitting and causing                                                                                                       
	// a page refresh - don't forget this                                                                                                                      
	return false;
    });

    // Board share
    $('#share').submit(function() {
        var sharedlist = $(this).parent().find('#sharedlist');
        $(this).ajaxSubmit({                                                                                                                 

            error: function(xhr) {
                  console.log('Error: ' + xhr.status);
            },

            success: function(res) {
                if(res.error) {
                    console.log(res.error);
                    return;
                }
                // var name = res.name;
                // var email = res.email;
                // window.location.reload();
                console.log(res.success);
            },
            complete: function(jqXHR, textStatus) {
                $('[name="username_email"]').val('');
            },
            
        });
        return false;
    });

	// Periodically send png
	setInterval(function(){
		if(g_canvas_is_modified == true) {
			socket.emit('sendPng', canvas.toDataURL('png'));
			g_canvas_is_modified = false;
		}
	},500);

	$("#sharebtn").click(function(e) {
		var shareBox = $('<div id="share-popup" class="popup">' + 
            '<p class="share-title">Share ' + g_board_name + ' with...</p><div class="share-form-wrap">' +
            '<form id="share-form" method="post" action="' + '/boards/' + g_board_id64 + '/share' + '">' + 
            '<input type="text" name="username_email" placeholder="Your friend\'s usrname/email">' + 
            '<button type="submit" class="button blue">Share<span></span></button></form></div></div>');
        $('body').append(shareBox);
        
        //Fade in the Popup
        $(shareBox).fadeIn(300);
        
        //Set the center alignment padding + border see css style
        var popMargTop = ($(shareBox).height() + 24) / 2; 
        var popMargLeft = ($(shareBox).width() + 24) / 2; 
        
        $(shareBox).css({ 
            'margin-top' : -popMargTop,
            'margin-left' : -popMargLeft
        });
        
        // Add the mask to body
        $('body').append('<div id="mask"></div>');
        $('#mask').fadeIn(300);

        var shareForm = $('#share-form');
        shareForm.submit(function() {
            if(shareForm.find('input').val().replace(/^\s+/,'').replace(/\s+$/,'') == '') {
                var err = 'Please fill your friend\'s username/email:';
                if(shareForm.find('.error_msg').length) {
                    shareForm.find('.error_msg').html(err);
                }
                else
                    shareForm.prepend($('<p class="error_msg">' + err + '</p>'));
                return false;
            }
            else {
                $(this).ajaxSubmit({                                                                                                                 

                    error: function(xhr) {
                          console.log('Error: ' + xhr.status);
                    },

                    success: function(res) {
                        if(res.error) {
                            if(shareForm.find('.error_msg').length) {
                                shareForm.find('.error_msg').html(res.error);
                            }
                            else
                                shareForm.prepend($('<p class="error_msg">' + res.error + '</p>'));
                            
                            return;
                        }
                        //console.log(res.success);
                        $('#share-popup').fadeOut(200 , function() {
                            $('#share-popup').remove();
                            var success_msg = $('<div id="success-popup" class="popup">The invitation is successfully sent!</div>');
                            $('body').append(success_msg);
                            success_msg.fadeIn(200);
                            var timer = setTimeout(function(){
                                $('#mask , #success-popup').fadeOut(300 , function() {
                                    $('#mask').remove();
                                    $('#success-popup').remove();
                                }); 
                            }, 1000);
                            $('#mask').live('click', function() {
                                clearTimeout(timer);
                                $('#mask , #success-popup').fadeOut(300 , function() {
                                    $('#mask').remove();
                                    $('#success-popup').remove();
                                }); 
                                return false;
                            });
                        });
                        return true;
                    },
                    complete: function(jqXHR, textStatus) {
                        $('[name="username_email"]').val('');
                    },
                    
                });
            }
            return false;
        });
        return false;
	});
	$('a.close, #mask').live('click', function() {
		$('#mask').fadeOut(300, function() {
			$('#mask').remove();
		})
		if($('#share-popup').length) {
	        $('#share-popup').fadeOut(300 , function() {
	           	$('#share-popup').remove();
	        }); 
  	  	}
        if($('#poll-popup').length) {
			$('#poll-popup').fadeOut(300 , function() {
		       	//$('#poll-popup').remove();
		    }); 
        }
        return false;
    });
}); 


socket.on('add', function(res) {
    if(res.type == 'image')
    {
        fabric.Image.fromURL(res.data.path, function(image) {
          image.set({
            left: res.data.left,
            top: res.data.top,
            angle: res.data.angle,
            scaleX: res.data.scaleX,
            scaleY: res.data.scaleY,
            padding: 10,
            cornersize: 10
          });
          image.name = res.data._id;
          image.setCoords();
          canvas.add(image);
        });
    }
    else if (res.type == 'text'){
	    var text = new fabric.Text(res.data.text, {
	      left: res.data.left,
	      top: res.data.top,
	      fontFamily: res.data.fontFamily,
	      angle: res.data.angle,
	      fill: res.data.fill,
	      scaleX: res.data.scaleX,
	      scaleY: res.data.scaleY,
	      fontWeight: '',
	      //backgroundColor: '#555',
	    });
	    text.name = res.data._id;
	    canvas.add(text);
        // });
    }
    else if(res.type == 'path') {
    	var path= new fabric.Path(res.data.path, { 
	    	left: res.data.left, 
	        top: res.data.top, 
	        stroke: res.data.stroke, 
	        strokeWidth: res.data.strokeWidth, 
	        scaleX: res.data.scaleX,
	        scaleY: res.data.scaleY,
	        angle: res.data.angle,
	        fill: "none", 
	        width: res.data.width, 
	        height: res.data.height
        });
        path.name = res.data._id;
        canvas.add(path);
    }
});

socket.on('setpathname', function(res) {
	canvas.forEachObject(function(obj) {
		if(obj.path) {
			if(obj.path.toString() == res.data.path) {
				obj.name = res.data._id;
			}
		}
	})
});

socket.on('delete', function(res) {
    //if(res.type == 'image')
    //{   
        // find image whose name = data.id and delete the image
        canvas.forEachObject(function(obj) {
        	if(obj.name == res.id){
        		canvas.remove(obj);
        	}
        })
    //}
});

socket.on('update',function(res){
	canvas.forEachObject(function(obj){
		if(obj.name == res.data.id){
			if (res.data.top&&res.data.left){
			    obj.set({
				    top: res.data.top,
				    left: res.data.left
			  });
			};
			if (res.data.scaleX && res.data.scaleY){
				obj.set({
					scaleX: res.data.scaleX,
					scaleY: res.data.scaleY
				})
			}
			if (res.data.angle){
				obj.set({
					angle: res.data.angle
				});
			};
			if (res.data.text){
				obj.set({
					text: res.data.text
				});
			};
			obj.setCoords();
		   canvas.renderAll();
		}
	})
});

socket.on('load', function(res) {
  var images = res.images;
  var texts = res.texts;
  var paths = res.paths;
  paths.forEach(function(path) {
    var pathSample= new fabric.Path(path.path, { 
	    	left: path.left, 
	        top: path.top, 
	        stroke: path.stroke, 
	        strokeWidth: path.strokeWidth, 
	        fill: "none", 
	        width: path.width, 
	        height: path.height
    });
    pathSample.name = path._id;
    canvas.add(pathSample);
  });
  images.forEach(function(img) {
    fabric.Image.fromURL(img.path, function(image){
	    image.set({
		    left: img.left,
		    top: img.top,
		    angle: img.angle,
		    scaleX: img.scaleX,
		    scaleY: img.scaleY,
		    padding: 10,
		    cornersize: 10,
	    });
	    image.name = img._id;
	    image.setCoords();
	    canvas.add(image);
    });
  });
  for (j in texts) {
    var textSample = new fabric.Text(texts[j].text, {
	    left: texts[j].left,
	    top: texts[j].top,
	    fontFamily:texts[j].fontFamily,
	    angle: texts[j].angle,
	    fill: texts[j].fill,
	    scaleX: texts[j].scaleX,
	    scaleY: texts[j].scaleY,
	    fontWeight: '',
    });
    textSample.name = texts[j]._id;
    textSample.setCoords();
    canvas.add(textSample);
  }
});

socket.on('deleteAll', function() {
	canvas.clear();
});

socket.on('changeBackground', function(res){
	canvas.setBackgroundImage(res.data.bgImage, canvas.renderAll.bind(canvas));
    document.getElementById('header').style.background = res.data.bgColor;
});
// socket.on('update', function(res){
// 	canvas.forEachObject(function(obj) {
// 		if(obj.name == res.data.id){
// 			obj.set({
// 				scaleX: res.data.scaleX,
// 				scaleY: res.data.scaleY
// 			})
// 			canvas.renderAll();
// 		}
// 	})
// });

// socket.on('update', function(res){
// 	canvas.forEachObject(function(obj){
// 		if(obj.name == res.data.id){
// 			obj.set({
// 				angle: res.data.angle
// 			})
// 			canvas.renderAll();
// 		}
// 	})
// });
// $("#chatslide").toggle(function(){
//              $("#chat").animate({ height: 'show', opacity: 'show' }, 'slow');
//              $("#chatslide").animate({bottom: "+=299"}, 'slow')
//             },function(){
//              $("#chat").animate({ height: 'hide', opacity: 'hide' }, 'slow');
//              $("#chatslide").animate({bottom: "-=299"}, 'slow')
//             });
