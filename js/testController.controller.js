var SwinTransport2;
(function (SwinTransport2) {
    class TestController {
        constructor($scope) {
            $scope.$watch("networks", this.onNetworkChange.bind(this), true);
            $scope.networks = {};
            for (let id of [1, 2, 3, 4, 5, 6, 7, 8, 10, 11]) {
                $scope.networks["network" + id] = {
                    showLines: true,
                    showIcons: false
                };
            }
        }
        onNetworkChange(newValue, oldValue) {
            if (newValue) {
                settings = newValue;
                updateLayers();
            }
        }
    }
    TestController.$inject = ["$scope"];
    SwinTransport2.TestController = TestController;
})(SwinTransport2 || (SwinTransport2 = {}));
angular.module("SwinTransport2").controller("testController", SwinTransport2.TestController);
//# sourceMappingURL=testController.controller.js.map