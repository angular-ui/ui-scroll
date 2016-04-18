import jqLiteExtrasRegister from './modules/jqlite-extras-register';

angular.module('ui.scroll.jqlite', ['ui.scroll'])
  .service('jqLiteExtras', () => {
      return {
        registerFor: jqLiteExtrasRegister		
      };
    }
  )
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