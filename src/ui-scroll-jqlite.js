
import { jqLiteExtras } from './modules/ui-scroll-jqlite.js';

angular.module('ui.scroll.jqlite', ['ui.scroll'])
	.service('jqLiteExtras', jqLiteExtras)
	.run([
		'$log',
		'$window',
		'jqLiteExtras',
		function (console, window, jqLiteExtras) {
			if (!window.jQuery) {
				return jqLiteExtras.registerFor(angular.element);
			}
		}
	]);
