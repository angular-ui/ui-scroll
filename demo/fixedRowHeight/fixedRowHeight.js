angular.module('application', ['ui.scroll'])

  .controller('MainCtrl', ($scope) => {
    $scope.hello = 'Hello Main Controller!';

    let min = -150, max = 200, delay = 0, inputs = 10;

    const getInput = index => {
      const result = [];
      for (let i = 0; i < inputs; i++) {
        result.push({ value: ((index % 2 === 0 ? -1 : 1) * (i + 1)).toString() });
      }
      return result;
    }

    const data = [];
    for (let i = min; i <= max; i++) {
      height = 50 + (i + 1);
      data.push({
        index: i,
        text: 'item #' + i,
        input: getInput(i)
      });
    }

    $scope.datasource = {
      get: (index, count, success) => {
        console.log('Getting ' + count + ' items started from ' + index + '...');
        setTimeout(() => {
          const result = [];
          const start = Math.max(min, index);
          const end = Math.min(index + count - 1, max);
          if (start <= end) {
            for (let i = start; i <= end; i++) {
              const _item = data.find(item => item.index === i);
              if (_item) {
                result.push(_item);
              }
            }
          }
          console.log('Got ' + result.length + ' items [' + start + '..' + end + ']');
          success(result);
        }, delay);
      }
    };

    $scope.getSum = item =>
      item.input.reduce((a, i) => a + Number(i.value), 0);

    $scope.getMul = item =>
      item.input.reduce((a, i) => a * Number(i.value), 1);

    $scope.getText = item => {
      const num = $scope.getMul(item).toString();
      const result = [];
      for (let i = 0; i < item.text.length; i++) {
        result.push(item.text[i]);
        result.push(i < num.length ? num[i] : 'x');
      }
      return result.join('');
    }

    const perfSlowCountDefault = 2;
    $scope.perfSlowCount = perfSlowCountDefault;
    $scope.perfSlowCountList = [];
    $scope.$watch('perfSlowCount', () => {
      let size = Number($scope.perfSlowCount);
      if (isNaN(size)) {
        size = perfSlowCountDefault;
      }
      $scope.perfSlowCountList = (new Array(size)).fill(0);
    })

  });
