var SwinTransport2;
(function (SwinTransport2) {
    class TestController {
        constructor($scope, deckService) {
            this.deckService = deckService;
            $scope.isMobile = window.orientation !== undefined;
            $scope.sidebarOpen = false;
            $scope.loading = false;
            $scope.$on("DeckGLService::IconClicked", (event, args) => {
                console.log(event, args);
            });
            $scope.$on("cfpLoadingBar:started", (event, args) => {
                $scope.loading = true;
            });
            $scope.$on("cfpLoadingBar:completed", (event, args) => {
                $scope.loading = false;
            });
        }
    }
    TestController.$inject = ["$scope", "DeckGLService"];
    SwinTransport2.TestController = TestController;
})(SwinTransport2 || (SwinTransport2 = {}));
angular.module("SwinTransport2").controller("testController", SwinTransport2.TestController);
//# sourceMappingURL=testController.controller.js.map