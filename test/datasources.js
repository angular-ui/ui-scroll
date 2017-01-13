angular.module('ui.scroll.test.datasources', [])

    .factory('myEmptyDatasource', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    success([]);
                }
            };
        }
    ])

    .factory('myNewEmptyDatasource', [
        '$log', '$timeout', '$rootScope', function () {

            // another layer of indirection introduced by the actualGet
            // is a workaround for the jasmine issue #1007 https://github.com/jasmine/jasmine/issues/1007
            var result = {
                get: function (descriptor, success) {
                    result.actualGet(descriptor, success);
                },
                actualGet: function (descriptor, success) {
                    success([]);
                }
            };

            return result;

        }
    ])

    .factory('myOnePageDatasource', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    if (index === 1) {
                        success(['one', 'two', 'three']);
                    } else {
                        success([]);
                    }
                }
            };
        }
    ])

    .factory('myOneBigPageDatasource', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    if (index === 1) {
                      var resultList = [];
                      for(var i = 1; i < 100; i++) {
                        resultList.push('item' + i);
                      }
                      success(resultList);
                    } else {
                        success([]);
                    }
                }
            };
        }
    ])

    .factory('myNewOnePageDatasource', [
        '$log', '$timeout', '$rootScope', function () {

            // another layer of indirection introduced by the actualGet
            // is a workaround for the jasmine issue #1007 https://github.com/jasmine/jasmine/issues/1007
            var result = {
                get: function (descriptor, success) {
                    result.actualGet(descriptor, success);
                },
                actualGet: function (descriptor, success) {
                    if (descriptor.index === 1) {
                        success(['one', 'two', 'three']);
                    } else {
                        success([]);
                    }
                }
            };

            return result;

        }
    ])

    .factory('myObjectDatasource', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    if (index === 1) {
                        success([{text: 'one'}, {text: 'two'}, {text: 'three'}]);
                    } else {
                        success([]);
                    }
                }
            };
        }
    ])

    .factory('myMultipageDatasource', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    var result = [];
                    for (var i = index; i < index + count; i++) {
                        if (i > 0 && i <= 20)
                            result.push('item' + i);
                    }
                    success(result);
                }
            };
        }
    ])

    .factory('anotherDatasource', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    var result = [];
                    for (var i = index; i < index + count; i++) {
                        if (i > -3 && i < 1)
                            result.push('item' + i);
                    }
                    success(result);
                }
            };
        }
    ])

    .factory('myEdgeDatasource', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    var result = [];
                    for (var i = index; i < index + count; i++) {
                        if (i > -6 && i <= 6)
                            result.push('item' + i);
                    }
                    success(result);
                }
            };
        }
    ])

    .factory('myDatasourceToPreventScrollBubbling', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    var result = [];
                    for (var i = index; i < index + count; i++) {
                        if (i < -6 || i > 20) {
                            break;
                        }
                        result.push('item' + i);
                    }
                    success(result);
                }
            };
        }
    ])

    .factory('myInfiniteDatasource', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    var result = [];
                    for (var i = index; i < index + count; i++) {
                        result.push('item' + i);
                    }
                    success(result);
                }
            };
        }
    ])

    .factory('myGridDatasource', [
        '$log', '$timeout', '$rootScope', function () {
            return {
                get: function (index, count, success) {
                    var result = [];
                    for (var i = index; i < index + count; i++) {
                        result.push({
                            col0: 'col0',
                            col1: 'col1',
                            col2: 'col2',
                            col3: 'col3'
                        });
                    }
                    success(result);
                }
            };
        }
    ]);
