var SwinTransport2;
(function (SwinTransport2) {
    class DeckGLService {
        constructor($http, $rootScope) {
            this.deckgl = new deck.DeckGL({
                container: 'map',
                mapboxApiAccessToken: 'pk.eyJ1Ijoic2lueiIsImEiOiJjamQxMzgxdmMyZmdmMzRuczk1cXhiYWFiIn0.wnnqZ5_3bJsSyziaDOhzHQ',
                mapStyle: 'mapbox://styles/sinz/cjgqk31z300022rp8sprwr8b7',
                longitude: 144.5339197,
                latitude: -37.8545151,
                zoom: 9,
                bearing: 30,
                pitch: 30
            });
            this.dataset = {};
            this.settings = {};
            this.http = $http;
            this.root = $rootScope;
            let markerHeight = 50, markerRadius = 10, linearOffset = 25;
            this.popup = new mapboxgl.Popup({
                offset: {
                    'top': [0, 0],
                    'top-left': [0, 0],
                    'top-right': [0, 0],
                    'bottom': [0, -markerHeight],
                    'bottom-left': [linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
                    'bottom-right': [-linearOffset, (markerHeight - markerRadius + linearOffset) * -1],
                    'left': [markerRadius, (markerHeight - markerRadius) * -1],
                    'right': [-markerRadius, (markerHeight - markerRadius) * -1]
                },
                closeButton: false,
                closeOnClick: false
            });
            this.ICON_MAPPING = {
                marker_1: { x: 0, y: 0, width: 32, height: 32 },
                marker_2: { x: 32, y: 0, width: 32, height: 32 },
                marker_3: { x: 64, y: 0, width: 32, height: 32 },
                marker_4: { x: 0, y: 32, width: 32, height: 32 },
                marker_5: { x: 32, y: 32, width: 32, height: 32 },
                marker_6: { x: 64, y: 32, width: 32, height: 32 },
                marker_7: { x: 0, y: 64, width: 32, height: 32 },
                marker_8: { x: 32, y: 64, width: 32, height: 32 },
                marker_10: { x: 64, y: 64, width: 32, height: 32 },
                marker_11: { x: 0, y: 96, width: 32, height: 32 },
            };
            this.progress = new Promise(async (resolve, reject) => {
                try {
                    if (window.orientation === undefined)
                        await this.Network(1, [0x8F, 0x1A, 0x95]);
                    await this.Network(2, [0x00, 0x72, 0xCE]);
                    await this.Network(3, [0x78, 0xBE, 0x20]);
                    await this.Network(4, [0xFF, 0x82, 0x00]);
                    if (window.orientation === undefined) {
                        await this.Network(5, [0xDE, 0x8F, 0xFF]);
                        await this.Network(6, [0x8F, 0x1A, 0x95]);
                        await this.Network(7, [0x00, 0x00, 0x00]);
                        await this.Network(8, [0x00, 0x00, 0x00]);
                        await this.Network(10, [0x00, 0x00, 0x00]);
                        await this.Network(11, [0x00, 0x00, 0x00]);
                    }
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
            });
        }
        updateLayers() {
            let layers = [];
            for (const networkID in this.dataset) {
                console.log(Object.keys(this.settings).includes("network" + networkID));
                if (Object.keys(this.settings).includes("network" + networkID)) {
                    if (this.settings["network" + networkID].showIcons && this.dataset[networkID].stations.length > 0) {
                        layers.push(new deck.IconLayer({
                            data: this.dataset[networkID].stations,
                            id: `station-layer-${networkID}`,
                            iconAtlas: 'atlas.png',
                            iconMapping: this.ICON_MAPPING,
                            pickable: true,
                            onHover: (info) => {
                                this.popup.remove();
                                if (info["picked"]) {
                                    this.popup
                                        .setLngLat(info.lngLat)
                                        .setText(info["object"]["name"])
                                        .addTo(this.deckgl.getMapboxMap());
                                }
                            },
                            onClick: (info) => {
                                console.log("We clicked on", info);
                                this.root.$broadcast("DeckGLService::IconClicked", info);
                            }
                        }));
                    }
                    if (this.settings["network" + networkID].showLines && this.dataset[networkID].lines.length > 0) {
                        layers.push(new deck.LineLayer({
                            data: this.dataset[networkID].lines,
                            id: `line-layer-${networkID}`,
                            strokeWidth: 2
                        }));
                    }
                }
            }
            this.deckgl.setProps({
                layers
            });
        }
        async Network(id, color) {
            let network = {
                stations: [],
                lines: [],
                networkID: id
            };
            this.dataset[id] = Object.assign({}, network);
            this.http.get(`data/${id}/stops.txt`).then(value => {
                let stopRows = d3.csvParse(value.data);
                for (var row of stopRows) {
                    network.stations.push({
                        position: [Number.parseFloat(row["stop_lon"]), Number.parseFloat(row["stop_lat"])],
                        name: row["stop_name"],
                        icon: `marker_${id}`,
                        size: 24,
                        color
                    });
                }
                this.dataset[id].stations = network.stations;
                this.updateLayers();
            });
            this.http.get(`data/${id}/shapes.txt`).then(value => {
                let lineRows = d3.csvParse(value.data);
                let shapes = {};
                for (var row of lineRows) {
                    let entry = [Number.parseFloat(row["shape_pt_lon"]), Number.parseFloat(row["shape_pt_lat"])];
                    if (row["shape_id"] in shapes) {
                        shapes[row["shape_id"]].push(entry);
                    }
                    else {
                        shapes[row["shape_id"]] = [entry];
                    }
                }
                for (let [key, value] of Object.entries(shapes)) {
                    for (let i = 1; i < value.length; i++) {
                        network.lines.push({
                            sourcePosition: value[i - 1],
                            targetPosition: value[i],
                            color
                        });
                    }
                }
                this.dataset[id].lines = network.lines;
                this.updateLayers();
            });
        }
    }
    DeckGLService.$inject = ["$http", "$rootScope"];
    SwinTransport2.DeckGLService = DeckGLService;
})(SwinTransport2 || (SwinTransport2 = {}));
angular.module("SwinTransport2").service("DeckGLService", SwinTransport2.DeckGLService);
//# sourceMappingURL=DeckGL.service.js.map