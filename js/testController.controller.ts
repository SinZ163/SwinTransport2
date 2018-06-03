module SwinTransport2 {
    interface NetworkScope extends ng.IScope {
        isMobile: boolean;
        sidebarOpen: boolean;
        loading: boolean;
    }

    export class TestController implements ng.IController {
        public static $inject = ["$scope", "DeckGLService"];

        public deckService: DeckGLService;
        constructor($scope:NetworkScope, deckService: DeckGLService) {
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
}

angular.module("SwinTransport2").controller("testController", SwinTransport2.TestController);