function addNotice(notice) {
	switch(notice.type) {
		case 'Request':
			$('#notices').prepend($('<li name="' + notice._id+ '"><b>' + notice.sender_name + '</b>'
			+ ' has invited you to join Board ' + 
			'<b>' + notice.board_name + '</b>'
			+ '<button class="accept-request">Accept</button><button class="reject-request">Reject</button></li>'));
		break;
		case 'Reject':
			$('#notices').prepend($('<li name="' + notice._id+ '"><b>' + notice.sender_name + '</b>'
			+ ' has rejected your invitation to Board ' + 
			'<b>' + notice.board_name + '</b>.</li>'));
		break;
		case 'Accept':
			$('#notices').prepend($('<li name="' + notice._id+ '"><b>' + notice.sender_name + '</b>'
			+ ' has accepted your invitation to Board ' + 
			'<b>' + notice.board_name + '</b>!</li>'));
		break;
		case 'Join':
			$('#notices').prepend($('<li name="' + notice._id+ '"><b>' + notice.sender_name + '</b>'
			+ ' has joined to Board ' + 
			'<b>' + notice.board_name + '!</b> Go welcome the new member!</li>'));
		break;
		case 'Leave':
			$('#notices').prepend($('<li name="' + notice._id+ '"><b>' + notice.sender_name + '</b>'
			+ ' has deleted Board ' + 
			'<b>' + notice.board_name + '</b>.</li>'));
		break;
		default:
		break;
	}
};

$(function(){

	$.ajax({
		url : '/notices',
		type : 'get',
		dataType : 'json',
		success : function(res, textStatus, jqXHR) {
			if (res.error) {
				console.log(res.error);
				return;
			}
			if(res.notices.length == 0) {
				$('#notices').append($('<li id="null-notice"> No notices</li>'));
			}
			else {
				res.notices.forEach(function(notice) {
					addNotice(notice);
				})
			}
		},
		error : function(jqXHR, textStatus, errorThrown) {
			// log the error to the console
			console.log("The following error occured: " + textStatus, errorThrown);
		},
		complete : function(jqXHR, textStatus) {

		}
	});

	$('#show-notices').click(function(e){
		if($('#notices').css('visibility') == 'hidden') {
			$('#notices').css('visibility', 'visible');
			if($('#new-notice-console.log').length != 0) {
				$('#new-notice-console.log').remove();
			}
			socket.emit('noticeReaded');
		}
		else
			$('#notices').css('visibility', 'hidden');
	});

	$('.accept-request').live('click', function(e) {
		var row = $(this).parent();
		var notice_id = row.attr('name');
		$.ajax({
			url : '/notices',
			type : 'post',
			data: {notice_id: notice_id, status: 'Accept'},
			dataType : 'json',
			success : function(res, textStatus, jqXHR) {
				if (res.error) {
					console.log(res.error);
					return;
				}
				row.remove();
				var url = "http://"+window.location.hostname+":"+window.location.port + "/boards/" + res.board_id64;
				console.log(url);
				window.location.href = url;
			},
			error : function(jqXHR, textStatus, errorThrown) {
				// log the error to the console
				console.log("The following error occured: " + textStatus, errorThrown);
			},
			complete : function(jqXHR, textStatus) {

			}
		})
	});

	$('.reject-request').live('click', function(e) {
		var row = $(this).parent();
		var notice_id = row.attr('name');
		$.ajax({
			url : '/notices',
			type : 'post',
			data: {notice_id: notice_id, status: 'Reject'},
			dataType : 'json',
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
		})
	});

});

socket.on('notification', function(notice) {
	//console.log("New notification!");
	if($('#new-notice-console.log').length == 0)
		$('#show-notices').append($('<b id="new-notice-console.log">(new)</b>'));
	if($('#null-notice'))
		$('#null-notice').remove();
	addNotice(notice);
	if(g_board_id) {
		if(notice.type == 'Accept' && notice.board_id == g_board_id && g_board_is_shared == false) {
			window.location.reload();
		}
	}
});