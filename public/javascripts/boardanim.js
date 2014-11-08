$("#chatslide").toggle(function(){
             $("#chat").animate({ height: 'show', opacity: 'show' }, 'slow');
             $("#chatslide").animate({bottom: "+=299"}, 'slow')
            },function(){
             $("#chat").animate({ height: 'hide', opacity: 'hide' }, 'slow');
             $("#chatslide").animate({bottom: "-=299"}, 'slow')
            });

var widt1 = false;
$('#colorSelector1').bind('click', function() {
		$('#colorpickerHolder1').stop().animate({height: widt1 ? 0 : 173}, 500);
		widt1 = !widt1;
	});
$('#colorpickerHolder1').ColorPicker({
		flat: true,
		color: '#00ff00',
		onSubmit: function(hsb, hex, rgb) {
			$('#colorSelector1 div').css('backgroundColor', '#' + hex);
		}
	});
$('#colorpickerHolder1>div').css('position', 'absolute');