$(document).ready(function() {

    socket.emit('adduser', {username: g_username, user_id: g_user_id});

    // load info of each board
    $('#board-list').children('div.boardRow').each(function() {
        var row = $(this);
        console.log($(this));
        $.ajax({
            url : '/boards/' + $(this).attr('id') + '/info',
            type : 'get',
            dataType : 'json',
            success : function(res, textStatus, jqXHR) {
                if (res.error) {
                    console.log(res.error);
                    return;
                }
                console.log(res);
                if(res.creator.username == g_username)
                    row.find('.creator').html('you');
                else
                    row.find('.creator').html(res.creator.username);
                
                row.find('.creator').attr('title', res.creator.email);
                row.find('.creator').tooltip();

                if(res.modifier.username == g_username)
                    row.find('.modifier').html('you');
                else
                    row.find('.modifier').html(res.modifier.username);

                row.find('.modifier').attr('title', res.modifier.email);
                row.find('.modifier').tooltip();

                if(row.find('.shared-list').length == 1) {
                    if(res.members.length == 1) {
                        row.find('.shared-list').append($('<span>only yourself.</span>'));
                    } else {
                        var count = 0;
                        res.members.forEach(function(member) {
                            count ++;
                            if(member.username != g_username) {
                                var memberRow;
                                if(count != Object.keys(res.members).length)
                                    memberRow = $('<a class="userName" rel="tooltip" title="' + member.email+ '">' + member.username + ',</a> ');
                                else
                                    memberRow = $('<a class="userName" rel="tooltip" title="' + member.email+ '">' + member.username + '</a>');
                                row.find('.shared-list').append(memberRow);
                                memberRow.tooltip();
                            }
                        });
                    }
                }
            },
            error : function(jqXHR, textStatus, errorThrown) {
                // log the error to the console
                console.log("The following error occured: " + textStatus, errorThrown);
            },
            complete : function(jqXHR, textStatus) {

            }
        })
    });

    // Board preview
    $(".boardView").colorbox({rel: 'view', width: "60%", height: "90%"});

    // Board delete
    $('.boardDelete').live('click', function(){
        var row = $(this).closest('.boardRow');
        var board_id = row.attr('id');
        
        $.confirm({
            'title'     : 'Delete Confimation',
            'message'   : 'Are you sure you want to delete the board?',
            'buttons'   : {
                'Delete'   : {
                    'class' : 'blue',
                    'action': function(){
                        $.ajax({
                            url: '/boards/' + board_id,
                            type: 'delete',
                            dataType: "json",
                            success: function(data, textStatus, jqXHR){
                                if(data.error) {
                                    console.log(data.error);
                                    return;
                                }
                                row.slideUp(function(){$(this).remove();});
                                row.next('hr').remove();
                                //row.remove();
                            },
                            // callback handler that will be called on error
                            error: function(jqXHR, textStatus, errorThrown){
                                // log the error to the console
                                console.log(
                                    "The following error occured: "+
                                    textStatus, errorThrown
                                );
                            },
                            
                        });
                    }
                },
                'Cancel'    : {
                    'class' : 'gray',
                    'action': function(){}  // Nothing to do in this case. You can as well omit the action property.
                }
            }
        });
        
    });

    // Board delete
    $('.boardShare').live('click', function() {
        var row = $(this).closest('.boardRow');
        var board_id = row.attr('id');

        var shareBox = $('<div id="share-popup" class="popup">' + 
            '<p class="share-title">Share ' + row.find('.boardName').html() + ' with...</p><div class="share-form-wrap">' +
            '<form id="share-form" method="post" action="' + '/boards/' + board_id + '/share' + '">' + 
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
        $('#mask , #share-popup').fadeOut(300 , function() {
            $('#mask').remove();
            $('#share-popup').remove();
        }); 
        return false;
    });
});