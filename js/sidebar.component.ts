module SwinTransport2 {
    export class SidebarComponent implements ng.IComponentController {
        static Options = () : ng.IComponentOptions => ({
            templateUrl: "views/sidebar.html",
            bindings: {
            },
            controller: SidebarComponent
        });

        public static $inject = ["DeckGLService"];

        public networks: NetworkSettings;
        public isMobile: boolean;

        private deck: DeckGLService;
        constructor(deck: DeckGLService) {
            this.deck = deck;
            this.networks = {};

            
            this.isMobile = window.orientation !== undefined;
            
            // I don't want to write this out, time to loop it
            for (let id of [1,2,3,4,5,6,7,8,10,11]) {
                ///@ts-ignore
                this.networks["network" + id] = {
                    showLines: true,
                    showIcons: false
                }
            }
        }
        public $doCheck() {
            console.log("Checking?");
            this.deck.settings = this.networks;
            this.deck.updateLayers();
        }
    }
}
angular.module("SwinTransport2").component("sidebar", SwinTransport2.SidebarComponent.Options());