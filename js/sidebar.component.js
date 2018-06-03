var SwinTransport2;
(function (SwinTransport2) {
    class SidebarComponent {
        constructor(deck) {
            this.deck = deck;
            this.networks = {};
            this.isMobile = window.orientation !== undefined;
            for (let id of [1, 2, 3, 4, 5, 6, 7, 8, 10, 11]) {
                this.networks["network" + id] = {
                    showLines: true,
                    showIcons: false
                };
            }
        }
        $doCheck() {
            console.log("Checking?");
            this.deck.settings = this.networks;
            this.deck.updateLayers();
        }
    }
    SidebarComponent.Options = () => ({
        templateUrl: "views/sidebar.html",
        bindings: {},
        controller: SidebarComponent
    });
    SidebarComponent.$inject = ["DeckGLService"];
    SwinTransport2.SidebarComponent = SidebarComponent;
})(SwinTransport2 || (SwinTransport2 = {}));
angular.module("SwinTransport2").component("sidebar", SwinTransport2.SidebarComponent.Options());
//# sourceMappingURL=sidebar.component.js.map