$(window).load(function(){
	var getPathPermissions = $.ajax({
		url: '/db/internal/group/get/path/permissions',
		dataType: 'json'
	});
	var getExtensions = $.ajax({
		url: '/db/internal/group/get/filetypes',
		dataType: 'json'
	});
	$.when(getPathPermissions, getExtensions).done(function(pathPermissions, extensions){
		pathPermissions = pathPermissions[0];
		extensions = extensions[0];
		var locations = [];
		var $location = $('#location');
		pathPermissions.forEach(function(p){
			locations.push(p.Path);
			$location.append($('<option>',{
				text: p.Path,
				value: p.Path
			}))
		});
		$('.selectpicker').selectpicker('refresh');

		$('#extensions').text(extensions.join(', '));

		var fileInfo = new FileDigest({
			loc: loc.js.file
		});
		var browser = new FileBrowser({
			debug: true,
			extensions: extensions,
			location: locations.length > 0? locations[0]: undefined,
			onSelect: function(e, n, d){
				fileInfo.display(d.path, d.folder, d.refresh);
			},
			loc: loc.js.browser
		});
		$('#browser').append(browser.$container);
		$('#fileInfo').append(fileInfo.$container);

		$location.on('change', function(){
			browser.setLocation($(this).val());
			browser.refresh();
		});
	});
});