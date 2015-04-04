walrusIRCApp.directive('walrusAutoGistify', function ($timeout) {
	return {
		link: function($scope, $element) {
			$timeout(function () {
				$($element[0]).gist();
			}, 500);
        }
	}
})