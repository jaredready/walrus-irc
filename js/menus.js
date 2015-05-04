walrusIRCApp.factory('menuService', ['$modal', '$timeout', function ($modal, $timeout) {
	var gui = require('nw.gui');

	var menu_bar = new gui.Menu({ type: 'menubar' });

	var file = new gui.MenuItem({ label: 'File' });
	var edit = new gui.MenuItem({ label: 'Edit' });
	var help = new gui.MenuItem({ label: 'Help' });

	// File submenus
	var file_submenu = new gui.Menu();
	file_submenu.append(new gui.MenuItem({
		label: 'Lock'
	}));
	file_submenu.append(new gui.MenuItem({
		label: 'Quit',
		click: function() {
			gui.Window.get().close();
		}
	}));
	file.submenu = file_submenu;

	// Edit submenus
	var edit_submenu = new gui.Menu();
	edit_submenu.append(new gui.MenuItem({
		label: 'Preferences'
	}));
	edit.submenu = edit_submenu;

	// Help submenus
	var help_submenu = new gui.Menu();
	help_submenu.append(new gui.MenuItem({
		label: 'Show Dev Tools',
		click: function() {
			if(!gui.Window.get().isDevToolsOpen()) {
				gui.Window.get().showDevTools();
			}
			else {
				gui.Window.get().closeDevTools();
			}
		}
	}));
	help_submenu.append(new gui.MenuItem({ label: 'About' }));
	help.submenu = help_submenu;

	// Connect menu items to menubar
	menu_bar.append(file);
	menu_bar.append(edit);
	menu_bar.append(help);

	gui.Window.get().menu = menu_bar;

	/**
	 *	Event listeners - Need to move to a new file sometime...
	 */

	gui.Window.get().on('close', function() {
		this.hide();
		console.log("Cleaning up...");
		this.close(true);
	});

	return gui.Window.get();
}]);