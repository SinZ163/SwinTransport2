module SwinTransport2 {
    interface NetworkScope extends ng.IScope {
        networks : {
            [id: string] : NetworkSettingScope,
            network1?: NetworkSettingScope,
            network2?: NetworkSettingScope,
            network3?: NetworkSettingScope,
            network4?: NetworkSettingScope,
            network5?: NetworkSettingScope,
            network6?: NetworkSettingScope,
            network7?: NetworkSettingScope,
            network8?: NetworkSettingScope,
            network10?: NetworkSettingScope,
            network11?: NetworkSettingScope,
        }
    }

    export class TestController implements ng.IController {
        public static $inject = ["$scope"];
        constructor($scope:NetworkScope) {
            $scope.$watch("networks", this.onNetworkChange.bind(this), true);


            // Populate checkbox defaults
            $scope.networks = {};
            for (let id of [1,2,3,4,5,6,7,8,10,11]) {
                $scope.networks["network" + id] = {
                    showLines: true,
                    showIcons: false
                }
            }
        }

        public onNetworkChange(newValue:any, oldValue:any) {
            if (newValue) {
                settings = newValue;
                updateLayers();
            }
        }
    }
}

angular.module("SwinTransport2").controller("testController", SwinTransport2.TestController);