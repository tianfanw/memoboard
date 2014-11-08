//
// 	After you copied those 2 lines of code , make sure you take also the files into the same folder :-)
//     Next step will be to set the appropriate statement to "start-up" the calendar on the needed HTML element.

//     This example is of the direct HTML appending calendar version which can be used
//     in two ways. with a stripped mode or without.

//     BUT - in both cases , it simply attaches to an HTML element and stays there.

//     When used in this way , you will have to make a javascript function that will be registered
//     as an event handler of the clicking action on each day.

//     This is done easily like shown in the example.
//

$(function() {

	var title;
	var location;
	var name;
	var selectedYear;
	var selectedMonth;
	var selectedDates = new Array();
	var pollDates = [];

	//general information
	$("#generalToDates").click(function() {
		var l = $('input#title').val().replace(/^\s+/, '').replace(/\s+$/, '').length;

		if (l == 0) {
			alert('title cannot be empty!');
			return false;
		} else if (l < 5) {
			alert('title too short!');
			return false;
		} else if (l > 64) {
			alert('title too long!');
			return false;
		}
		$("#generalStep").css("display", "none");
		$("#datesPickerStep").show();
		var allInputs = $(".generalInfo :input");
		title = allInputs[0].value;
		location = allInputs[1].value;
		name = allInputs[2].value;

		$("#pollTitle").html(title);
		$("#pollLocation").html("Location: " + location);
	});

	//dates picker to pick dates
	$("#datesBackToGeneral").click(function() {

		$("#datesPickerStep").css("display", "none");
		$("#generalStep").show();
		$("#title").value = title;
		$("#location").value = location;
		$("#name").value = name;

	});
	g_globalObject = new JsDatePick({
		useMode : 1,
		isStripped : true,
		target : "calendar",
		weekStartDay : 0,

	});

	g_globalObject.setOnSelectedDelegate(function() {
		var obj = g_globalObject.getSelectedDay();
		var objWeekDay = dateToWeekday(obj);
		//copy object
		selectedDate = {
			year : obj.year,
			month : obj.month,
			day : obj.day
		}

		var unselected = false;
		for (var i = 0; i < selectedDates.length; i++) {
			if (selectedDates[i].day == selectedDate.day && selectedDates[i].month == selectedDate.month && selectedDates[i].year == selectedDate.year) {
				selectedDates.splice(i, 1);
				unselected = true;
			} else {
				continue;
			}
		}
		//uncheck selected date
		if (unselected == false) {
			selectedDates.push(selectedDate);
			var originalElement = document.getElementById("calendarResult");
			var newContent = document.createElement('div');

			newContent.innerHTML = obj.year + "/" + obj.month + "/" + obj.day + "," + objWeekDay;
			originalElement.appendChild(newContent);
		} else {
			$("#calendarResult").children().remove();
			var originalElement = document.getElementById("calendarResult");
			for (var i = 0; i < selectedDates.length; i++) {
				var newContent = document.createElement('div');

				newContent.innerHTML = selectedDates[i].year + "/" + selectedDates[i].month + "/" + selectedDates[i].day + "," + dateToWeekday(selectedDates[i]);
				originalElement.appendChild(newContent);
			}
		}

		// for(var i=0;i<selectedDates.length;i++){
		// alert(selectedDates[i].day);
		// }
	});

	// Ajax get poll list
	getPollList = function() {

		$.ajax({
			url : window.location.href + '/poll',
			type : 'get',
			dataType : 'json',
			success : function(res, textStatus, jqXHR) {
				if (res.error) {
					alert(res.error);
					return;
				}
				if (res.polls) {
					$("#poll-list").children().remove();
					res.polls.forEach(function(poll) {
						$("#poll-list").append($('<div><a class="poll-link" id="' + poll._id + '">' + poll.title + '</a></div>'));
					});
				}
			},
			error : function(jqXHR, textStatus, errorThrown) {
				// log the error to the console
				console.log("The following error occured: " + textStatus, errorThrown);
			},
			complete : function(jqXHR, textStatus) {
			}
		})
	};

	function clearPollForm() {
		$('input#title').val('');
		$('input#location').val('');
		$('input#description').val('');
		// $('#calendarResult').each(function() {
		// $(this).remove();
		// })
		pollDates.length = 0;
		// Need to refresh the calendar. HOW???????????
		$("#pollContainer").children().remove();

	}

	// Popup the poll window
	$("#pollbtn").click(function(e) {

		getPollList();
		clearPollForm();
		$('#poll-list').show();
		$('#poll-info').hide();
		$('#generalStep').show();
		$('#datesPickerStep').hide();
		// Remove later
		$('#pollStep').hide();

		var pollPopup = $("#poll-popup");
		pollPopup.fadeIn(300);

		var popMargTop = ($(pollPopup).height() + 24) / 2;
		var popMargLeft = ($(pollPopup).width() + 24) / 2;

		$(pollPopup).css({
			'margin-top' : -popMargTop,
			'margin-left' : -popMargLeft
		});

		$('body').append('<div id="mask"></div>');
		$('#mask').fadeIn(300);

		return false;
	});

	// Ajax submit poll
	$('#addPoll').click(function(e) {
		//sort the selected dates and ready to push
		selectedDates.sort(function(a, b) {
			return a.day - b.day;
		});

		for (var i = 0; i < selectedDates.length; i++) {
			pollDates.push(Date(selectedDates[i].year, selectedDates[i].month, selectedDates[i].day));
		}

		if (pollDates.length == 0) {
			alert('Please choose at least one day!');
			return false;
		}

		$.ajax({
			url : window.location.href + '/poll',
			type : 'post',
			dataType : 'json',
			data : {
				title : $('input#title').val(),
				location : $('input#location').val(),
				description : $('input#description').val(),
				dates : pollDates
			},
			success : function(res, textStatus, jqXHR) {
				if (res.error) {
					alert(res.error);
					return;
				}
				getPollList();
				clearPollForm();
				$("#datesPickerStep").css("display", "none");
				$("#generalStep").show();

			},
			error : function(jqXHR, textStatus, errorThrown) {
				// log the error to the console
				console.log("The following error occured: " + textStatus, errorThrown);
			},
			complete : function(jqXHR, textStatus) {
				// Also need to reset calendar

			}
		});
	});

	//click on a poll
	$('.poll-link').live('click', function(e) {
		var poll_id = $(this).attr('id');
		$.ajax({
			url : window.location.href + '/poll',
			type : 'get',
			dataType : 'json',
			data : {
				poll_id : poll_id
			},
			//parameters: {poll_id: poll_id},
			success : function(res, textStatus, jqXHR) {
				if (res.error) {
					alert(res.error);
					return;
				}
				console.log(res);
				//DATA U RECEIVED:::::::::::::
				// res.poll.title
				// res.poll.location
				// res.poll.description
				// res.choices.forEach(choice) {
				// 	choice.date
				// 	choice.voter.username
				// 	choice.voter._id
				// }
				// res.members.forEach(member) {
				// 	member.username
				// 	member._id
				// }

				selectedDates.length = 0;
				res.choices.forEach(function(choice) {
					s = choice.date.split('-');
					s1 = s[2].split('T');
					console.log(s);
					var col = {
						year: s[0],
						month: s[1],
						day: s1[0],
					};
					console.log(col);
					selectedDates.push(col);
				});
				var monthDict = ["Janaury", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
				var aTable = document.createElement("table");
				$(aTable).attr("cellspacing", "0");
				$(aTable).attr("cellpadding", "0");
				$(aTable).addClass("poll");
				$(aTable).append(document.createElement('tbody'));
				//should interact with server
				var participants = Object.keys(res.members).length;

				for (var i = 0; i < participants + 3; i++) {
					var aRow = document.createElement('tr');
					switch(i) {
						case 0: {
							//append header column
							aRow.className = "Header meeting month";
							var headColumn = document.createElement('th');
							$(headColumn).addClass("nonHeader");
							$(aRow).append(headColumn);

							var aColumn = document.createElement('th');
							$(aColumn).attr("colspan", selectedDates.length);
							var theContent = document.createElement('p');
							var selectedMonth = monthDict[selectedDates[0].month - 1];
							theContent.innerHTML = selectedMonth + "&nbsp" + selectedDates[0].year;
							$(aColumn).append(theContent);
							$(aRow).append(aColumn);
							break;
						}
						case 1:
							aRow.className = "Header meeting dates";

							var headColumn = document.createElement('th');
							$(headColumn).addClass("nonHeader");
							$(aRow).append(headColumn);
							//sort the array of calendar
							selectedDates.sort(function(a, b) {
								return a.day - b.day;
							});

							for (var j = 0; j < selectedDates.length; j++) {

								var aColumn = document.createElement('th');
								$(aColumn).addClass("selectedDates");
								var theContent = document.createElement('p');
								theContent.innerHTML = dateToWeekday(selectedDates[j]) + "&nbsp" + selectedDates[j].day + "&nbsp&nbsp";
								$(aColumn).append(theContent);
								$(aRow).append(aColumn);
							}
							break;
					}
					if (i > 2) {
						//the last row to vote
						if (i == participants + 1) {
							//create a row for participants
							aRow.className = "participants";

							var headColumn = document.createElement('td');
							$(headColumn).innerHTML = "Please select available dates";
							$(aRow).append(headColumn);

							for (var j = 0; j < selectedDates.length; j++) {

								var aColumn = document.createElement('td');
								$(aColumn).addClass("ToVote");
								$(aColumn).attr("id", "box" + j);
								$(aColumn).attr("title", dateToWeekday(selectedDates[j]) + ", " + selectedDates[j].year + "-" + selectedDates[j].month + "-" + selectedDates[j].day);
								var theContent = document.createElement('input');
								$(theContent).attr("type", "checkbox");
								$(aColumn).append(theContent);
								$(aRow).append(aColumn);
							}
						} else if (i == participants + 2) {
							aRow.className = "sums";

							var headColumn = document.createElement('td');
							headColumn.innerHTML = "Overall votes";
							$(headColumn).addClass("nonHeader");
							$(aRow).append(headColumn);

							//get the data from the database
						}
					}
					$(aTable).append(aRow);
				}
				$("#pollContainer").append(aTable);
				

				$('#poll-choices').children().remove();
				$('#poll-title').html(res.poll.title);
				$('#poll-location').html(res.poll.location);
				$('#poll-description').html(res.poll.description);
				res.choices.forEach(function(choice) {
					var choiceTuple = $('<div>' + choice.date + '</div>')
					$('#poll-info').find('.poll-choices').prepend(choiceTuple);
				})

				$('#poll-list').hide();
				$('#generalStep').hide();
				$('#datesPickerStep').hide();
				// Remove later
				$('#pollStep').show();
				//$('#poll-info').show();
			},
			error : function(jqXHR, textStatus, errorThrown) {
				// log the error to the console
				console.log("The following error occured: " + textStatus, errorThrown);
			},
			complete : function(jqXHR, textStatus) {
				// Also need to reset calendar
			}
		});
	})
	///////////////////////////////////////////////////////////////////////////////////////////
	// poll section
	$("#datesToPoll").click(function() {
		//if($("#calendar_result"))
		$("#datesPickerStep").css("display", "none");
		$("#pollStep").show();
		var monthDict = ["Janaury", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var aTable = document.createElement("table");
		$(aTable).attr("cellspacing", "0");
		$(aTable).attr("cellpadding", "0");
		$(aTable).addClass("poll");
		$(aTable).append(document.createElement('tbody'));
		//should interact with server
		var participants = 2;

		for (var i = 0; i < participants + 3; i++) {
			var aRow = document.createElement('tr');
			switch(i) {
				case 0: {
					//append header column
					aRow.className = "Header meeting month";
					var headColumn = document.createElement('th');
					$(headColumn).addClass("nonHeader");
					$(aRow).append(headColumn);

					var aColumn = document.createElement('th');
					$(aColumn).attr("colspan", selectedDates.length);
					var theContent = document.createElement('p');
					var selectedMonth = monthDict[selectedDates[0].month - 1];
					theContent.innerHTML = selectedMonth + "&nbsp" + selectedDates[0].year;
					$(aColumn).append(theContent);
					$(aRow).append(aColumn);
					break;
				}
				case 1:
					aRow.className = "Header meeting dates";

					var headColumn = document.createElement('th');
					$(headColumn).addClass("nonHeader");
					$(aRow).append(headColumn);
					//sort the array of calendar
					selectedDates.sort(function(a, b) {
						return a.day - b.day;
					});

					for (var j = 0; j < selectedDates.length; j++) {

						var aColumn = document.createElement('th');
						$(aColumn).addClass("selectedDates");
						var theContent = document.createElement('p');
						theContent.innerHTML = dateToWeekday(selectedDates[j]) + "&nbsp" + selectedDates[j].day + "&nbsp&nbsp";
						$(aColumn).append(theContent);
						$(aRow).append(aColumn);
					}
					break;
			}
			if (i > 2) {
				//the last row to vote
				if (i == participants + 1) {
					//create a row for participants
					aRow.className = "participants";

					var headColumn = document.createElement('td');
					$(headColumn).innerHTML = "Please select available dates";
					$(aRow).append(headColumn);

					for (var j = 0; j < selectedDates.length; j++) {

						var aColumn = document.createElement('td');
						$(aColumn).addClass("ToVote");
						$(aColumn).attr("id", "box" + j);
						$(aColumn).attr("title", dateToWeekday(selectedDates[j]) + ", " + selectedDates[j].year + "-" + selectedDates[j].month + "-" + selectedDates[j].day);
						var theContent = document.createElement('input');
						$(theContent).attr("type", "checkbox");
						$(aColumn).append(theContent);
						$(aRow).append(aColumn);
					}
				} else if (i == participants + 2) {
					aRow.className = "sums";

					var headColumn = document.createElement('td');
					headColumn.innerHTML = "Overall votes";
					$(headColumn).addClass("nonHeader");
					$(aRow).append(headColumn);

					//get the data from the database
				}
			}
			$(aTable).append(aRow);
		}
		$("#pollContainer").append(aTable);
	});

	//poll
	$("#pollBackToDates").click(function() {
		$("#pollStep").css("display", "none");
		$("#datesPickerStep").show();
		$("#pollContainer").children().remove();
	});

	$("#finish").click(function() {
		$("form").submit();
	});
});

function dateToWeekday(date) {
	var weekDayArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	var d = new Date();
	d.setUTCFullYear(parseInt(date.year), parseInt(date.month) - 1, parseInt(date.day));
	// alert(parseInt(date.year)+ "/" + parseInt(date.month)+ "/" + parseInt(date.day));
	// alert(d.getUTCFullYear() + "/" + d.getUTCMonth() + "/" + d.getUTCDate());
	// alert(d.getDay());
	return weekDayArray[d.getDay()];
};
