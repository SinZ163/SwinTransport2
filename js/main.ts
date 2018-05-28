//I couldn't find any deckgl standalone typings so this will do
declare var deck: any;
declare var luma: any;

//
const ICON_MAPPING = {
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
}

const deckgl = new deck.DeckGL({
    container: 'map',
    mapboxApiAccessToken: 'pk.eyJ1Ijoic2lueiIsImEiOiJjamQxMzgxdmMyZmdmMzRuczk1cXhiYWFiIn0.wnnqZ5_3bJsSyziaDOhzHQ',
    mapStyle: 'mapbox://styles/sinz/cjgqk31z300022rp8sprwr8b7',
    longitude: 144.5339197,
    latitude: -37.8545151,
    zoom: 9,
    bearing: 30,
    pitch: 30
});


init();
async function init() {
    try {
        luma.log.enable();
        luma.log.priority = 2;

        await Network(1, [0x8F, 0x1A, 0x95]);
        await Network(2, [0x00, 0x72, 0xCE]);
        await Network(3, [0x78, 0xBE, 0x20]);
        await Network(4, [0xFF, 0x82, 0x00]);
        await Network(5, [0xDE, 0x8F, 0xFF]);
        await Network(6, [0x8F, 0x1A, 0x95]);
        await Network(7, [0x00, 0x00, 0x00]);
        await Network(8, [0x00, 0x00, 0x00]);
        await Network(10, [0x00, 0x00, 0x00]);
        await Network(11, [0x00, 0x00, 0x00]);        
    } catch (e) {
        console.error(e);
    }
}

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
interface NetworkSettingScope {
    showLines: boolean,
    showIcons: boolean,
}
interface SettingScope {    
    [id: string] : NetworkSettingScope;
}

interface Networks {
    [id: number] : Network;
}

// Don't let AngularJS near this
let dataset: Networks = {};

// AngularJS gets to own this
let settings: SettingScope = {};

let markerHeight = 50, markerRadius = 10, linearOffset = 25;
let popup = new mapboxgl.Popup({
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


// TODO: Expand this over time to let our Angular codebase to manipulate what gets rendered
function updateLayers() {
    let layers = [];
    for (const networkID in dataset) {
        console.log(Object.keys(settings).includes("network" + networkID));
        if (Object.keys(settings).includes("network" + networkID)) {
            if (settings["network" + networkID].showIcons) {
                layers.push(
                    new deck.IconLayer({
                        data: dataset[networkID].stations,
                        id: `station-layer-${networkID}`,
                        iconAtlas: 'atlas.png',
                        iconMapping: ICON_MAPPING,
                        pickable: true,
                        onHover: (info:any) => {
                            // Delete the previous popup on map
                            popup.remove();
                            // did we hover into a new thing
                            if (info["picked"]) {
                                popup
                                .setLngLat(info.lngLat)
                                .setText(info["object"]["name"])
                                .addTo(deckgl.getMapboxMap());
                            }
                            console.log(info);
                        }
                    })
                );
            }
            if (settings["network" + networkID].showLines) {
                layers.push(
                    new deck.LineLayer({
                        data: dataset[networkID].lines,
                        id: `line-layer-${networkID}`,
                        strokeWidth: 2
                    })
                );
            }
        }
    }
    // Tell DeckGL what layers we have
    deckgl.setProps({
        layers
    });
}

async function Network(id:number, color: number[]) {
    let network:Network = {
        stations: [],
        lines: [],
        networkID: id
    };

    let stopRows = await d3.csv(`data/${id}/stops.txt`);
    for (var row of stopRows) {
        network.stations.push({
            position: [Number.parseFloat(row["stop_lon"]), Number.parseFloat(row["stop_lat"])],
            name: row["stop_name"],
            icon: `marker_${id}`,
            size: 24,
            color
        });
    }
    let lineRows = await d3.csv(`data/${id}/shapes.txt`);
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
    dataset[id] = network;
    //console.log(lines);
    updateLayers();
}