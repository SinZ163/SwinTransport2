//I couldn't find any deckgl standalone typings so this will do
declare var deck: any;
declare var luma: any;

module SwinTransport2 {
    interface Station {
        position: [number, number],
        name: string,
        icon: string,
        size: number,
        color: number[]
    }
    interface Line {
        sourcePosition: LatLng,
        targetPosition: LatLng,
        color: number[]
    }
    type LatLng = [number, number];
    
    interface Network {
        stations: Station[],
        lines: Line[],
        networkID: number
    }
    interface NetworkSetting {
        showLines: boolean,
        showIcons: boolean,
    }
    export interface NetworkSettings {    
        [id: string] : NetworkSetting;
    }
    
    interface Networks {
        [id: number] : Network;
    }

    export class DeckGLService {
        private ICON_MAPPING: any;
        
        private deckgl = new deck.DeckGL({
            container: 'map',
            mapboxApiAccessToken: 'pk.eyJ1Ijoic2lueiIsImEiOiJjamQxMzgxdmMyZmdmMzRuczk1cXhiYWFiIn0.wnnqZ5_3bJsSyziaDOhzHQ',
            mapStyle: 'mapbox://styles/sinz/cjgqk31z300022rp8sprwr8b7',
            longitude: 144.5339197,
            latitude: -37.8545151,
            zoom: 9,
            bearing: 30,
            pitch: 30
        });

        // Don't let AngularJS near this
        private dataset: Networks = {};
        
        // AngularJS gets to own this
        public settings: NetworkSettings = {};
        public progress: Promise<void>;

        private popup: mapboxgl.Popup;

        private http: ng.IHttpService;
        private root: ng.IRootScopeService;

        public static $inject = ["$http", "$rootScope"];
        
        constructor($http: ng.IHttpService, $rootScope: ng.IRootScopeService) {
            this.http = $http;
            this.root = $rootScope;
            
            let markerHeight = 50, markerRadius = 10, linearOffset = 25;
            this.popup = new mapboxgl.Popup({
                offset: {
                    'top': [0, 0],
                    'top-left': [0,0],
                    'top-right': [0,0],
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
                marker_1: {x: 0, y: 0, width: 32, height: 32},
                marker_2: {x: 32, y: 0, width: 32, height: 32},
                marker_3: {x: 64, y: 0, width: 32, height: 32},
                marker_4: {x: 0, y: 32, width: 32, height: 32},
                marker_5: {x: 32, y: 32, width: 32, height: 32},
                marker_6: {x: 64, y: 32, width: 32, height: 32},
                marker_7: {x: 0, y: 64, width: 32, height: 32},
                marker_8: {x: 32, y: 64, width: 32, height: 32},
                marker_10: {x: 64, y: 64, width: 32, height: 32},
                marker_11: {x: 0, y: 96, width: 32, height: 32},
            }/* 
            luma.log.enable();
            luma.log.priority = 2; */
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
                } catch(e) {
                    reject(e);
                }
            });
        }
        
        // This is exposed to angularjs and they call us when our state has changed
        // This is react's equivilant of a render() method
        updateLayers() {
            let layers = [];
            for (const networkID in this.dataset) {
                console.log(Object.keys(this.settings).includes("network" + networkID));
                if (Object.keys(this.settings).includes("network" + networkID)) {
                    if (this.settings["network" + networkID].showIcons && this.dataset[networkID].stations.length > 0) {
                        layers.push(
                            new deck.IconLayer({
                                data: this.dataset[networkID].stations,
                                id: `station-layer-${networkID}`,
                                iconAtlas: 'atlas.png',
                                iconMapping: this.ICON_MAPPING,
                                pickable: true,
                                onHover: (info:any) => {
                                    // Delete the previous popup on map
                                    this.popup.remove();
                                    // did we hover into a new thing
                                    if (info["picked"]) {
                                        this.popup
                                        .setLngLat(info.lngLat)
                                        .setText(info["object"]["name"])
                                        .addTo(this.deckgl.getMapboxMap());
                                    }
                                },
                                onClick: (info:any) => {
                                    console.log("We clicked on", info);
                                    // We are outside of AngularJS so it hates us for using their event structure
                                    this.root.$broadcast("DeckGLService::IconClicked", info);
                                }
                            })
                        );
                    }
                    if (this.settings["network" + networkID].showLines && this.dataset[networkID].lines.length > 0) {
                        layers.push(
                            new deck.LineLayer({
                                data: this.dataset[networkID].lines,
                                id: `line-layer-${networkID}`,
                                strokeWidth: 2
                            })
                        );
                    }
                }
            }
            // Tell DeckGL what layers we have
            this.deckgl.setProps({
                layers
            });
        }
        
        private async Network(id:number, color: number[]) {
            let network:Network = {
                stations: [],
                lines: [],
                networkID: id
            };
            // Copy it so the reference is different
            this.dataset[id] = Object.assign({}, network);
            
            this.http.get<string>(`data/${id}/stops.txt`).then(value => {
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
                /* 
                    Because we copied dataset earlier we can just move the station reference when we are ready
                    This lets us just check in updateLayers if length > 0 or not and guarentee deckgl never sees a half populated array and caches incomplete data
                */
                this.dataset[id].stations = network.stations;
                this.updateLayers();
            });
            
            this.http.get<string>(`data/${id}/shapes.txt`).then(value => {
                let lineRows = d3.csvParse(value.data);
                let shapes:{[id: string] : LatLng[]} = {};
                for (var row of lineRows) {
                    // TODO: Care about shape_pt_sequence
                    let entry:LatLng = [Number.parseFloat(row["shape_pt_lon"]), Number.parseFloat(row["shape_pt_lat"])];
                    if (row["shape_id"] in shapes) {
                        //console.log("We found it?");
                        shapes[row["shape_id"]].push(entry);
                    } else {
                        //console.log(row["shape_id"] + " is not in shapes?");
                        //console.log(Object.keys(shapes));
                        shapes[row["shape_id"]] = [entry];
                    }
                }
                for (let [key,value] of Object.entries(shapes)) {
                    //console.log(value);
                    for (let i = 1; i < value.length; i++) {
                        network.lines.push({
                            sourcePosition: value[i-1],
                            targetPosition: value[i],
                            color
                        })
                    }
                }

                /* 
                    Because we copied dataset earlier we can just move the line reference when we are ready
                    This lets us just check in updateLayers if length > 0 or not and guarentee deckgl never sees a half populated array and caches incomplete data
                */
                this.dataset[id].lines = network.lines;
                this.updateLayers();
            });
        }
    }
}
angular.module("SwinTransport2").service("DeckGLService", SwinTransport2.DeckGLService);