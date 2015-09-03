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
    ]);
