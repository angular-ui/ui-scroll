angular.module('server', []).factory('Server', 
  ['$timeout', '$q', function ($timeout, $q) {

    var ServerFactory = {

      firstIndex: 1,

      lastIndex: 40,

      delay: 100,

      data: [],

      absIndex: 1,

      generateId: function () {
        var d = '-';
        function S4() {
          return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return (S4() + S4() + d + S4() + d + S4() + d + S4() + d + S4() + S4() + S4());
      },

      generateItem: function (index) {
        return {
          index: index,
          id: this.generateId(),
          content: 'Item #' + this.absIndex++
        }
      },

      init: function () {
        for (var i = this.firstIndex; i <= this.lastIndex; i++) {
          this.data.push(this.generateItem(i));
        }
      },

      getItem: function (index) {
        for (var i = this.data.length - 1; i >= 0; i--) {
          if (this.data[i].index === index) {
            return this.data[i];
          }
        }
      },

      returnDeferredResult: function (result) {
        var deferred = $q.defer();
        $timeout(function () {
          deferred.resolve(result);
        }, this.delay);
        return deferred.promise;
      },

      request: function (index, count) {
        var start = index;
        var end = index + count - 1;
        var item, result = {
          items: []
        };
        if (start <= end) {
          for (var i = start; i <= end; i++) {
            if (item = this.getItem(i)) {
              result.items.push(item);
            }
          }
        }
        return this.returnDeferredResult(result);
      },

      prependItem: function (params) {
        var newItem = this.generateItem(--this.firstIndex);
        newItem.content += params;
        this.data.unshift(newItem);
        return this.returnDeferredResult(newItem);
      },

      appendItem: function (params) {
        var newItem = this.generateItem(++this.lastIndex);
        newItem.content += params;
        this.data.push(newItem);
        return this.returnDeferredResult(newItem);
      },

      removeFirst: function () {
        var firstItem = this.data.find(i => i.index === this.firstIndex);
        if(!firstItem) {
          return $q.reject();
        }
        return this.removeItemById(firstItem.id);
      },

      removeLast: function () {
        var lastItem = this.data.find(i => i.index === this.lastIndex);
        if(!lastItem) {
          return $q.reject();
        }
        return this.removeItemById(lastItem.id);
      },

      removeItemById: function (itemId) {
        var length = this.data.length;
        for (var i = 0; i < length; i++) {
          if (this.data[i].id === itemId) {
            var indexRemoved = this.data[i].index;
            if(indexRemoved > this.firstIndex) {
              for (var j = i; j < length; j++) {
                this.data[j].index--;
              }
            }
            this.data.splice(i, 1);
            this.setIndices();
            return this.returnDeferredResult(indexRemoved);
          }
        }
        return this.returnDeferredResult(false);
      },

      insertAfterIndex: function (index, params) {
        if(index < this.firstIndex || index > this.lastIndex) {
          return this.returnDeferredResult(null);
        }
        var length = this.data.length, item;
        for (var i = 0; i < length; i++) {
          if (this.data[i].index === index) {
            for (var j = i + 1; j < length; j++) {
              this.data[j].index++;
            }
            item = this.generateItem(index + 1);
            item.content += params;
            this.data.splice(i + 1, 0, item);
            this.setIndices();
            return this.returnDeferredResult(item);
          }
        }
        return this.returnDeferredResult(null);
      },

      setIndices: function () {
        if(!this.data.length) {
          this.firstIndex = 1;
          this.lastIndex = 1;
          return;
        }
        this.firstIndex = this.data[0].index;
        this.lastIndex = this.data[0].index;
        for (var i = this.data.length - 1; i >= 0; i--) {
          if(this.data[i].index > this.lastIndex) {
            this.lastIndex = this.data[i].index;
          }
          if(this.data[i].index < this.firstIndex) {
            this.firstIndex = this.data[i].index;
          }
        }
      }
    };

    ServerFactory.init();

    return ServerFactory;
  }
]);
