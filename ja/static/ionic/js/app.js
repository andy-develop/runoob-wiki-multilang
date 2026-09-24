angular.module('todo', ['ionic'])

.controller('TodoCtrl', function($scope, $ionicModal) {
  $scope.tasks = [
    { title: '菜鸟教程' },
    { title: 'www.runoob.com' },
    { title: '菜鸟教程' },
    { title: 'www.runoob.com' }
  ];

  $ionicModal.fromTemplateUrl('new-task.html', function(modal) { // 创建并载入模型
    $scope.taskModal = modal;
  }, {
    scope: $scope,
    animation: 'slide-in-up'
  });

  $scope.createTask = function(task) { // 表单提交时调用
    $scope.tasks.push({
      title: task.title
    });
    $scope.taskModal.hide();
    task.title = "";
  };

  $scope.newTask = function() { // 打开新增的模型
    $scope.taskModal.show();
  };

  $scope.closeNewTask = function() { // 关闭新增的模型
    $scope.taskModal.hide();
  };
});
