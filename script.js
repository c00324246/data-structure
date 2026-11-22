
// Location names (HashMap)
let locations = new Map();

locations.set("service", "Fire Service");
locations.set("store", "POLONEZ Store");
locations.set("town", "Town Centre");

// Graph
class Graph {

    constructor() {
        this.list = new Map();
    }

   addNode(node) {

    if (!this.list.has(node)) {
        this.list.set(node, []);
    }
}

    addEdge(node1, node2, distance) {

        this.list.get(node1).push({
            node: node2,
            distance: distance
        });

        this.list.get(node2).push({
            node: node1,
            distance: distance
        });
    }
}

// Priority Queue
class PriorityQueue {

    constructor() {
        this.items = [];
    }

    add(node, distance) {

        this.items.push({
            node: node,
            distance: distance
        });

        this.items.sort((a, b) => a.distance - b.distance);
    }

    remove() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

// Create graph
let graph = new Graph();

// Add locations and road junctions
graph.addNode("service");
graph.addNode("store");
graph.addNode("town");
graph.addNode("junction1");
graph.addNode("junction2");

// Add walking connections (distances in metres)
graph.addEdge("service", "junction1", 400);
graph.addEdge("junction1", "town", 500);

graph.addEdge("service", "junction2", 700);
graph.addEdge("junction2", "town", 300);

graph.addEdge("store", "junction1", 600);
graph.addEdge("store", "junction2", 400);

// Coordinates of locations
let coordinates = new Map();

coordinates.set("service", [52.8368, -6.9219]);
coordinates.set("store", [52.8370, -6.9340]);
coordinates.set("town", [52.8405, -6.9268]);

coordinates.set("junction1", [52.8390, -6.9250]);
coordinates.set("junction2", [52.8385, -6.9290]);

// Create map
let map = L.map("map").setView([52.8405, -6.9268], 15);

// Load OpenStreetMap
// Load CARTO Voyager map

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);
// Store selected location
let selectedPoint = null;

// Temporary marker
let temporaryMarker = null;
// Store user markers
let userMarkers = new Map();

// Select a point by clicking on the map
map.on("click", function(event) {

    selectedPoint = [
        event.latlng.lat,
        event.latlng.lng
    ];

    // Remove previous temporary marker
    if (temporaryMarker !== null) {
        map.removeLayer(temporaryMarker);
    }


    // Add new temporary marker
    temporaryMarker = L.marker(selectedPoint).addTo(map);

    document.getElementById("selectedLocation").innerHTML =
        "Location selected. Enter a name.";
});
// Add new location
function addLocation() {

    let name = document.getElementById("locationName").value;

    // Check input
    if (name === "" || selectedPoint === null) {
        alert("Please select a point on the map and enter a name.");
        return;
    }

    // Create location ID
    let id = "location" + Date.now();

    // Save location
    locations.set(id, name);
    coordinates.set(id, selectedPoint);

    // Add to road graph
    let nearest = findNearestRoad(selectedPoint);

    roadGraph.addNode(id);
    roadCoordinates.set(id, selectedPoint);

    roadGraph.addEdge(id, nearest.node, nearest.distance);

    // Add to dropdown lists
    let startOption = new Option(name, id);
    let endOption = new Option(name, id);

    document.getElementById("start").add(startOption);
    document.getElementById("end").add(endOption);




// Create popup content
let popupContent = document.createElement("div");

let title = document.createElement("p");
title.textContent = name;

let deleteButton = document.createElement("button");
deleteButton.textContent = "Delete";

deleteButton.onclick = function() {
    deleteLocation(id);
};

popupContent.appendChild(title);
popupContent.appendChild(deleteButton);

// Show popup
temporaryMarker.bindPopup(popupContent).openPopup();
// Save marker
userMarkers.set(id, temporaryMarker);

    // Reset selection
    selectedPoint = null;
    temporaryMarker = null;

    document.getElementById("locationName").value = "";
    document.getElementById("selectedLocation").innerHTML =
        "Location added successfully!";
}
// Add markers
for (let [node, position] of coordinates) {

    let name = locations.get(node);

    if (name === undefined) {
        name = "Road Junction";
    }

    let marker = L.marker(position).addTo(map);

    // Create popup
    let popupContent = document.createElement("div");

    let title = document.createElement("p");
    title.textContent = name;

    popupContent.appendChild(title);

    // Add delete button
    let deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";

    deleteButton.onclick = function() {
        deleteLocation(node);
    };

    popupContent.appendChild(deleteButton);

    marker.bindPopup(popupContent);

    // Save marker
    userMarkers.set(node, marker);
}

// Layer for route
let routeLine = null;


// Dijkstra's Algorithm
function dijkstra(start, end) {

    let distances = new Map();
    let previous = new Map();

    let queue = new PriorityQueue();

    // Set initial distances
    for (let node of roadGraph.list.keys()) {
        distances.set(node, Infinity);
    }

    distances.set(start, 0);

    queue.add(start, 0);

    // Find shortest path
    while (!queue.isEmpty()) {

        let current = queue.remove();

        let node = current.node;
        let distance = current.distance;

        if (distance > distances.get(node)) {
            continue;
        }

        if (node === end) {
            break;
        }

let neighbours = roadGraph.list.get(node) || [];

for (let edge of neighbours) {

            let newDistance = distance + edge.distance;

            if (newDistance < distances.get(edge.node)) {

                distances.set(edge.node, newDistance);

                previous.set(edge.node, node);

                queue.add(edge.node, newDistance);
            }
        }
    }

    // Build route
    let path = [];
    let current = end;

    while (current !== undefined) {

        path.unshift(current);

        if (current === start) {
            break;
        }

        current = previous.get(current);
    }

    if (path[0] !== start) {
        return null;
    }

    return {
        path: path,
        distance: distances.get(end)
    };
}


// Button function


// Button function
function findRoute() {

    let start = document.getElementById("start").value;
    let end = document.getElementById("end").value;

    let result = document.getElementById("result");

    if (start === end) {
        result.innerHTML = "Please select two different locations.";
        return;
    }

    // Calculate shortest route
    let route = dijkstra(start, end);

    if (route === null) {
        result.innerHTML = "No route found.";
        return;
    }

    // Remove old route
    if (routeLine !== null) {
        map.removeLayer(routeLine);
    }

    // Get coordinates from road graph
    let routeCoordinates = [];

    for (let node of route.path) {

        let position = roadCoordinates.get(node);

        if (position === undefined) {
            result.innerHTML = "Coordinates not found: " + node;
            return;
        }

        routeCoordinates.push(position);
    }

    // Draw route
    routeLine = L.polyline(routeCoordinates, {
        color: "red",
        weight: 6,
        opacity: 1
    }).addTo(map);

    routeLine.bringToFront();

    map.fitBounds(routeLine.getBounds());

    // Display route information
    let output = "<h3>Route found:</h3>";

    output += "<p>" + locations.get(start) + "</p>";

    output += "<p>Walking through road network...</p>";

    output += "<p>" + locations.get(end) + "</p>";

    output += "<hr>";

    output += "<b>Total distance: "
        + (route.distance / 1000).toFixed(2)
        + " km</b>";

    result.innerHTML = output;

    console.log("Road route:", route.path);
    console.log("Route coordinates:", routeCoordinates);
}

// Load roads from GeoJSON file
// Create a graph for real roads
let roadGraph = new Graph();

// Store coordinates of graph nodes
let roadCoordinates = new Map();

// Calculate distance between two points
function calculateDistance(point1, point2) {

    let lat1 = point1[0] * Math.PI / 180;
    let lon1 = point1[1] * Math.PI / 180;

    let lat2 = point2[0] * Math.PI / 180;
    let lon2 = point2[1] * Math.PI / 180;

    let dLat = lat2 - lat1;
    let dLon = lon2 - lon1;

    let a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) ** 2;

    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return 6371000 * c;
}

// Convert coordinates into a node ID
function getNodeId(lon, lat) {
    return lon.toFixed(6) + "," + lat.toFixed(6);
}

// Add road points and connections to the graph
function addRoadLine(coordinates) {

    for (let i = 0; i < coordinates.length; i++) {

        let lon = coordinates[i][0];
        let lat = coordinates[i][1];

        let nodeId = getNodeId(lon, lat);

        roadGraph.addNode(nodeId);
        roadCoordinates.set(nodeId, [lat, lon]);

        // Connect this point with the previous point
        if (i > 0) {

            let previousLon = coordinates[i - 1][0];
            let previousLat = coordinates[i - 1][1];

            let previousId = getNodeId(previousLon, previousLat);

            let distance = calculateDistance(
                [previousLat, previousLon],
                [lat, lon]
            );

            roadGraph.addEdge(previousId, nodeId, distance);
        }
    }
}
// Find the nearest road node to a location
function findNearestRoad(point) {

    let nearestNode = null;
    let shortestDistance = Infinity;

    roadCoordinates.forEach((roadPoint, nodeId) => {

        let distance = calculateDistance(point, roadPoint);

        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestNode = nodeId;
        }
    });

    return {
        node: nearestNode,
        distance: shortestDistance
    };
}

// Load roads from GeoJSON
fetch("roads.geojson")
    .then(response => response.json())
    .then(data => {

        console.log("Roads loaded:", data);

        // Display roads on the map
        L.geoJSON(data).addTo(map);

        // Process all road features
        data.features.forEach(feature => {

            let geometry = feature.geometry;

            if (geometry.type === "LineString") {
                addRoadLine(geometry.coordinates);
            }

            if (geometry.type === "MultiLineString") {
                geometry.coordinates.forEach(line => {
                    addRoadLine(line);
                });
            }
        });
        // Connect locations to the road graph
locations.forEach((name, placeId) => {

    // Get location coordinates
    let point = coordinates.get(placeId);

    // Find nearest road node
    let nearest = findNearestRoad(point);

    // Add location to graph
    roadGraph.addNode(placeId);

    // Save location coordinates
    roadCoordinates.set(placeId, point);

    // Connect location to nearest road
    roadGraph.addEdge(
        placeId,
        nearest.node,
        nearest.distance
    );

    console.log(
        placeId + " connected to road:",
        Math.round(nearest.distance) + " metres"
    );
});

        console.log("Road graph created!");

console.log("Graph nodes:", roadCoordinates.size);

// Count all connections
let totalConnections = 0;

roadGraph.list.forEach(neighbours => {
    totalConnections += neighbours.length;
});

// Each edge is counted twice because the graph is undirected
console.log("Graph edges:", totalConnections / 2);
// Check road network connections
function checkConnections(start) {

    let visited = new Set();
    let queue = [start];

    visited.add(start);

    while (queue.length > 0) {

        let current = queue.shift();

        let neighbours = roadGraph.list.get(current) || [];

        for (let edge of neighbours) {

            if (!visited.has(edge.node)) {

                visited.add(edge.node);
                queue.push(edge.node);
            }
        }
    }

    return visited;
}

// Check Service connections
let reachable = checkConnections("service");

console.log("Reachable nodes from Service:", reachable.size);

console.log(
    "Can reach Store:",
    reachable.has("store")
);

console.log(
    "Can reach Town:",
    reachable.has("town")
);
    })
    .catch(error => {
        console.log("Error loading roads:", error);
    });
    // Delete user location
function deleteLocation(id) {
    // Protect main locations
if (id === "service" || id === "store" || id === "town") {
    alert("Main locations cannot be deleted.");
    return;
}

   // Remove marker from map
let marker = userMarkers.get(id);

if (marker) {
    map.removeLayer(marker);
}

    // Remove from marker list
    userMarkers.delete(id);

    // Remove from locations
    locations.delete(id);
    coordinates.delete(id);

    // Remove from road graph
    roadGraph.list.delete(id);
    roadCoordinates.delete(id);

    // Remove connections to this location
    roadGraph.list.forEach(neighbours => {

        for (let i = neighbours.length - 1; i >= 0; i--) {

            if (neighbours[i].node === id) {
                neighbours.splice(i, 1);
            }
        }
    });

    // Remove from dropdown lists
    let start = document.getElementById("start");
    let end = document.getElementById("end");

let startOption = start.querySelector('option[value="' + id + '"]');
let endOption = end.querySelector('option[value="' + id + '"]');

if (startOption) {
    startOption.remove();
}

if (endOption) {
    endOption.remove();
}

    document.getElementById("result").innerHTML =
        "Location deleted.";
}