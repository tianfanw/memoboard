// on load of page
$(function(){
	var usernames = {};
	var cursors = {};
	// socket.on('connect', function(){
	// 	// call the server-side function 'adduser' and send one parameter (value of prompt)
	// 	socket.emit('adduser', g_username, g_user_id, g_board_id);
	// });
	canvas.on('mouse:move', sendCursor);
    function sendCursor(e) {
        socket.emit('mousemove', {x: e.e.pageX, y: e.e.pageY});
    }
    
	socket.on('updatechat', function(username, data) {
		$('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
		var objDiv = document.getElementById('conversation');
        objDiv.scrollTop = objDiv.scrollHeight;
       
	});

	socket.on('adduser', function(res){ 
		console.log('hello' + res.user_id);
		if(!usernames[res.user_id])
			usernames[res.user_id] = $('<span class="online-user">' + res.username + '</span>').appendTo('#online-users');
		
	});

	socket.on('mousemove', function(res){
		if(!cursors[res.user_id])
			cursors[res.user_id] = $('<div class="cursor" />').appendTo('#cursors');
		cursors[res.user_id].css({
			'left': res.left,
			'top': res.top
		});
	});

	socket.on('deluser', function(res){
		console.log('bye' + res.user_id);
		if(cursors[res.user_id]) {
			cursors[res.user_id].remove();
			delete cursors[res.user_id];
		}
		if(usernames[res.user_id])
			usernames[res.user_id].remove();
			delete usernames[res.user_id];
		
	});

	// when the client clicks SEND
	$('#datasend').click( function() {
		var message = $('#data').val();
		$('#data').val('');
		// tell server to execute 'sendchat' and send along one parameter
		socket.emit('sendchat', message);
	});

	// when the client hits ENTER on their keyboard
	$('#data').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#datasend').focus().click();
		}
	});
});