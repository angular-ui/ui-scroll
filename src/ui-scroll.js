/*!
 globals: angular, window

 List of used element methods available in JQuery but not in JQuery Lite

 element.before(elem)
 element.height()
 element.outerHeight(true)
 element.height(value) = only for Top/Bottom padding elements
 element.scrollTop()
 element.scrollTop(value)
 */

import { uiScrollViewport } from './modules/ui-scroll-viewport.js';
import { uiScroll } from './modules/ui-scroll.js';

angular.module('ui.scroll', [])
	.directive('uiScrollViewport', uiScrollViewport)
	.directive('uiScroll', uiScroll);
