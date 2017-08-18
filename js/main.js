//Data Model

var Model = {

    markerList: [{
        address: "Rockefeller Center"
    }, {
        address: "Trump Tower"
    }, {
        address: "Times Square"
    }, {
        address: "Whitney Museum of American Art"
    }, {
        address: "Lincoln Tunnel"
    }, {
        address: "The Spotted Pig"
    }, {
        address: "Socrates Sculpture Park"
    }, {
        address: "Washington Square Park"
    }, {
        address: "Empire State Building"
    }]
};

function gmapsError() {
    window.alert("Unable to load API");
    console.log("Api error");
}
//The viewModel
var viewModel = function() {
    //Store viewModel scope
    var vm = this;

    //define global markers for active marker properties
    var infoWin = null;
    var boun = null;

    //define knockout observables
    vm.markerArray = ko.observableArray();
    vm.searchString = ko.observable();
    vm.forceTrig = ko.observable(1);

    //open sidenav
    vm.openNav = function() {
        document.getElementById("mySidenav").style.width = "30%";
    };

    //Close sidenav
    vm.closeNav = function() {
        document.getElementById("mySidenav").style.width = "0";
    };


    vm.geocodeFunc=function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            var tribeca = results[0].geometry.location;
            var marker = new google.maps.Marker({
                position: tribeca,
                map: map,
                title: results[0].formatted_address,
                name: Model.markerList[vm.markerArray().length].address,

                //define wiki url for marker data
                wikiUrl: 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + Model.markerList[vm.markerArray().length].address + '&format=json&callback=wikiCallback'
            });

            //call wiki data via ajax using jsonp
            $.ajax({
                url: marker.wikiUrl,
                dataType: "jsonp",

                //on success, run function
                success: function(response) {
                    marker.data = response[2][0];
                    marker.infoWin = new google.maps.InfoWindow({
                        content: "<p>" + marker.data + "</p>"
                    });
                    marker.addListener("click", function() {
                        if (infoWin) {
                            infoWin.close();
                        }
                        infoWin = marker.infoWin;
                        infoWin.open(map, marker);

                            if (boun !== null)
                                boun.setAnimation(null);
                            boun = marker;
                            boun.setAnimation(google.maps.Animation.BOUNCE);

                    });
                }

                //if wiki content fails to load,run this function
            }).fail(function(a, status) {
                window.alert("Unable to load wiki content");
            });
            vm.markerArray.push(marker);
        }
    };


    //define geocoding and marker definitions
    function geocodeAddress(geocoder, resultsMap) {
        for (var i = 0; i < Model.markerList.length; i++) {
            geocoder.geocode({
                'address': Model.markerList[i].address + ", NY"
            }, vm.geocodeFunc);
        }
    }

    //initMap is run after definition
    vm.initMap = function() {

        //check if google maps api has loaded
        if (typeof google !== 'object' || typeof google.maps !== 'object') {
            window.alert("Unable to load Google Maps API. This could be a network connectivity problem");
            return;
        }

        //define our map
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: 40.7413549,
                lng: -73.99802439999996
            },
            zoom: 13,

            //set draggable property to true to allow map dragging
            draggable: false
        });
        var geocoder = new google.maps.Geocoder();
        geocodeAddress(geocoder, map);
    };

    //filter based on search string
    vm.filteredArray = ko.computed(function() {
        return ko.utils.arrayFilter(vm.markerArray(), function(marker) {
            if (vm.searchString() !== undefined) {
                return marker.name.toLowerCase().indexOf(vm.searchString().toLowerCase()) !== -1;
            } else {
                return true;
            }
        });
    }, vm);

    //subscribe to reflect filter changes in map
    vm.filteredArray.subscribe(function() {
        var diffArray = ko.utils.compareArrays(vm.markerArray(), vm.filteredArray());
        ko.utils.arrayForEach(diffArray, function(marker) {
            if (marker.status === 'deleted') {
                marker.value.setMap(null);
            } else {
                marker.value.setMap(map);
            }
        });
    });


    vm.onClick = function(pika) {
        vm.searchString(pika.name);
        if (infoWin) {
            infoWin.close();
        }
        infoWin = pika.infoWin;
        infoWin.open(map, pika);

        if (boun !== null)
            boun.setAnimation(null);
        boun = pika;
        boun.setAnimation(google.maps.Animation.BOUNCE);
    };

};

var ViewModel=new viewModel();
ko.applyBindings(ViewModel);

function onApiLoad(){
    ViewModel.initMap();
}
