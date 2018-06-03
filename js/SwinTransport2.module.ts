angular.module("SwinTransport2", ["angular-loading-bar"]).config(["cfpLoadingBarProvider", (cfpLoadingBarProvider:any) => {
    cfpLoadingBarProvider.parentSelector = ".wrapper";
}]);