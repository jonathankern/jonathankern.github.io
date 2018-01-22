// Jonathan Kern
// Repercussion: An audio reactive web app
//
// Spotify API
// Web Audio API
// WebGL
// THREE.js

// Initialize Firebase
const config = {
    apiKey: "API_KEY",
    authDomain: "repercussion-2a67a.firebaseapp.com",
    databaseURL: "https://repercussion-2a67a.firebaseio.com",
    projectId: "repercussion-2a67a",
    storageBucket: "repercussion-2a67a.appspot.com",
    messagingSenderId: "717848410101"
};

firebase.initializeApp(config);

// connect to your Firebase application using your reference URL
const databaseReference = firebase.database();

// detect webgl
if (!Detector.webgl) Detector.addGetWebGLMessage();

// api vars
const accessToken = 'API_KEY';
const categoryRequestUrl = 'https://api.spotify.com/v1/browse/categories';

// ui vars
const $container = $('#container');
const $header = $('header');
const $controls = $('.controls');
const $logo = $('.logo a');
const $sidebarLeft = $('.sidebar--left');
const $sidebarRight = $('.sidebar--right');
const $playlists = $('.playlists');
const $playlist = $('.playlist');
const $optionsButton = $('.options-button');
const $options = $('.options');
const $updateColorButton = $('#update-color-button');
const $updateLineHeightButton = $('#update-line-height-button');
const $updateFrequencyButton = $('#update-frequency-button');
const $rewindButton = $('.rewind');
const $playButton = $('.play');
const $pauseButton = $('.pause');
const $forwardButton = $('.forward');
const $lines = $('.lines');
const $line = $('.line');

// audio reactor vars
const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();
const audio = new THREE.Audio(listener);

// Frequency must be one of: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, and 32768
let fftSize = 32768;

let scene;
let camera;
let renderer;
let analyser;
let uniforms;
// let song = '../assets/FrancescaLombardo-WhatToDo.mp3';
let song = '../assets/50Cent-InDaClub.mp3';

$(document).ready(function() {
    $('input').on('focus', function() {
        $(this).val('');
    });

    $('.options').submit(function(event) {
        event.preventDefault();
    });

    // options controls
    $optionsButton.on('click', function() {
        $options.fadeToggle('slow', 'linear');
    });

    $updateColorButton.on('click', function(event) {
        event.preventDefault();
        // console.log('color button was clicked');
        const inputColorValueR = $('#input-color-r').val();
        console.log(inputColorValueR);

        const inputColorValueG = $('#input-color-g').val();
        console.log(inputColorValueG);

        const inputColorValueB = $('#input-color-b').val();
        console.log(inputColorValueB);

        $('#input-color-r').val('');
        $('#input-color-g').val('');
        $('#input-color-b').val('');

        const colorReference = databaseReference.ref('color');

        colorReference.push({
            rValue: inputColorValueR,
            gValue: inputColorValueG,
            bValue: inputColorValueB
        });
        console.log(colorReference);

    });

    $updateLineHeightButton.on('click', function(event) {
        event.preventDefault();
        // console.log('line height button was clicked');
        const inputLineHeightValue = $('#input-line-height').val();
        console.log(inputLineHeightValue);

        $('#input-line-height').val('');

        const lineHeightReference = databaseReference.ref('lineHeight');

        lineHeightReference.push({
            value: inputLineHeightValue
        });
        console.log(lineHeightReference);

    });

    $updateFrequencyButton.on('click', function(event) {
        event.preventDefault();
        // console.log('frequency button was clicked');

        const inputFrequencyValue = $('#input-frequency').val();
        console.log(inputFrequencyValue);

        $('#input-frequency').val('');

        const frequencyReference = databaseReference.ref('frequency');

        frequencyReference.push({
            value: inputFrequencyValue
        });
        console.log(frequencyReference);


        // fftSize = inputFrequencyValue;
        // console.log(fftSize);
        // return init(inputFrequencyValue);
    });

    getValues();
});

function getValues() {
    databaseReference.ref('color').on('value', function(results) {
        console.log(results);
        // turn into string and display like R, G, B

        const $resultsInputColor = $('#results-input-color');
        $resultsInputColor.append(results);
    });

    databaseReference.ref('lineHeight').on('value', function(results) {
        console.log(results);

        const $resultsLineHeight = $('#results-input-line-height');
        $resultsLineHeight.append(results);
    });

    databaseReference.ref('frequency').on('value', function(results) {
        console.log(results);

        const $resultsInputFrequency = $('#results-input-frequency');
        $resultsInputFrequency.append(results);
    });
}


function fetchCategoryData(requestUrl) {
    fetch(requestUrl, {
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
            'Host': 'api.spotify.com',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, deflate, compress'
        }
    }).then(function(response) {
            if (response.ok) {
                // get status
                status = response.status;
                // console.log(status);

                // pull data and parse json
                return response.json();
            } else {
                alert('there was a problem with the request');
            }
        }).then(function(data) {
            // console.log(data);

            return categories(data);
    });
}

function categories(data) {
    // console.log(data);

    const categoriesList = data.categories.items;

    categoriesList.forEach(function(category) {
        categoryId = category.id;
        categoryName = category.name;

        return categoriesUI(categoryId, categoryName);
    });

}

function categoriesUI(categoryId, categoryName) {
    // UI elements
    const $categoryList = $('.categories ul');
    const $categoryListItem = $('<li></li>');
    const $categoryButton = $('<button class="category-button"></button>');

    // append to DOM
    $categoryList.append($categoryListItem);
    $categoryListItem.append($categoryButton);
    $categoryButton.append(categoryName);

    // trigger playlists on click
    $categoryButton.on('click', function() {
        // console.log(categoryId);

        $playlists.show();

        // slide categories to the left to make room for playlists
        $('.categories').css( {'position': 'relative', 'left': '-1000px', 'display': 'none'} );

        const playlistsRequestUrl = 'https://api.spotify.com/v1/browse/categories/' + categoryId + '/playlists';

        return fetchPlaylistsData(playlistsRequestUrl);
    });
}

function fetchPlaylistsData(requestUrl) {
    fetch(requestUrl, {
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
            'Host': 'api.spotify.com',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, deflate, compress'
        }
    }).then(function(response) {
            if (response.ok) {
                // get status
                status = response.status;
                // console.log(status);

                // pull data and parse json
                return response.json();
            } else {
                alert('there was a problem with the request');
            }
        }).then(function(data) {
            // console.log(data);

            return playlists(data);
    });
}

function playlists(data) {
    // console.log(data);
    const playlistsData = data.playlists.items;

    playlistsData.forEach(function(playlists) {
        playlistsName = playlists.name;
        playlistsTracksHref = playlists.tracks.href;
        playlistsTracksTotal = playlists.tracks.total;
        playlistsSpotifyID = playlists.id;
        playlistsUserID = playlists.owner.id
        playlistsURI = playlists.uri;

        return playlistsUI(playlistsName, playlistsTracksHref, playlistsTracksTotal, playlistsSpotifyID, playlistsUserID, playlistsURI);
    });
}

function playlistsUI(playlistsName, playlistsTracksHref, playlistsTracksTotal, playlistsSpotifyID, playlistsUserID, playlistsURI) {
    // console.log(playlistsURI);

    // UI elements
    const $playlistsList = $('.playlists ul');
    const $playlistsListItem = $('<li></li>');
    const $playlistsButton = $('<button class="playlist-button"></button>');

    // append to DOM
    $playlistsList.append($playlistsListItem);
    $playlistsListItem.append($playlistsButton);
    $playlistsButton.append(playlistsName);

    // trigger playlist on click
    $playlistsButton.on('click', function() {
        // console.log(playlistsURI);

        $playlist.show();

        $playlists.css(
            {
                'position': 'relative',
                'left': '-1000px',
                'display': 'none'
            }
        );

        // UI Elements
        const $playlistHeader = $('.header');

        // Append to DOM
        $playlistHeader.append(playlistsName);

        // fetch tracks
        tracksRequestUrl = 'https://api.spotify.com/v1/users/' + playlistsUserID + '/playlists/' + playlistsSpotifyID + '/tracks';

        return fetchTracksData(tracksRequestUrl);

    });
}

function fetchTracksData(requestUrl) {
    fetch(requestUrl, {
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
            'Host': 'api.spotify.com',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, deflate, compress'
        }
    }).then(function(response) {
            if (response.ok) {
                // get status
                status = response.status;
                // console.log(status);

                // pull data and parse json
                return response.json();
            } else {
                alert('there was a problem with the request');
            }
        }).then(function(data) {
            // console.log(data);

            return tracks(data);
    });
}

function tracks(data) {
    // console.log(data);
    const tracksData = data.items;

    tracksData.forEach(function(thisTrack) {
        trackName = thisTrack.track.name;
        artistName = thisTrack.track.artists[0].name;
        albumName = thisTrack.track.album.name;
        trackTime = thisTrack.track.duration_ms;
        trackID = thisTrack.track.id;
        trackHref = thisTrack.track.href;
        trackURI = thisTrack.track.uri;

        return tracksUI(trackName, artistName, albumName, trackTime, trackID, trackHref, trackURI);
    });
}

function tracksUI(trackName, artistName, albumName, trackTime, trackID, trackHref, trackURI) {

    $('.playlist .controls').show();

    // UI elements
    const $orderedListElement = $('.playlist ol');
    const $listElement = $('<li></li>');
    const $firstListElement = $('.playlist ol li:first-child');
    const $trackName = $('<p class="track-name"></p>');
    const $trackInfo = $('<small></small>');
    const $artistName = $('<span class="artist-name"> </span>');
    const $albumName = $('<span class="album-name"> - </span>');
    const $trackTime = $('<span class="song-time"> - </span>');

    // Append to DOM
    $trackName.append(trackName);
    $artistName.append(artistName);
    $albumName.append(albumName);
    $trackTime.append(trackTime);

    $listElement.append($trackName);
    $listElement.append($trackInfo);

    $trackInfo.append($artistName);
    $trackInfo.append($albumName);
    $trackInfo.append($trackTime);

    $orderedListElement.append($listElement);

    $orderedListElement.hover(
        function() {
            $(this).addClass('visible');
        },
        function() {
            $(this).removeClass('visible');
        }
    );

    $trackName.on('click', function() {
        audioReactor();
    });
}

function audioReactor() {
    $line.css('width', '0');
    $lines.addClass('move');
    $('.sidebar--right .controls').show();

    // initialize audio reactor
    init();
    animate();
}

function init(inputFrequencyValue) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);
    $container.append(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.Camera();

    inputFrequencyValue = fftSize;

    audioLoader.load(song, function(buffer) {
        audio.setBuffer(buffer);
        audio.setLoop(true);
        audio.play();
    });

    analyser = new THREE.AudioAnalyser(audio, fftSize);

    uniforms = {
        tAudioData: {
            value: new THREE.DataTexture(analyser.data, fftSize / 2, 1, THREE.LuminanceFormat)
        }
    };

    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent
    });

    const geometry = new THREE.PlaneBufferGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    window.addEventListener('resize', onResize, false);

}

function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    analyser.getFrequencyData();
    uniforms.tAudioData.value.needsUpdate = true;
    renderer.render(scene, camera);
}

function toggleFullscreen(element) {
    element = element || document.documentElement;
    if (!document.fullscreenElement && !document.mozFullScreenElement &&
        !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

function reset() {
    fetchCategoryData(categoryRequestUrl);

    $line.addClass('move');

    $line.on('mouseover', function(){
        if ($(this).hasClass('move')) {
            $(this).removeClass('move');
        } else {
            $(this).addClass('move');
        }
    });
}


// playlist controls
$playlist.on('click', function() {
    $(this).toggleClass('move', 1000, "easeInOut");
});

$rewindButton.on('click', function() {

});

$playButton.on('click', function() {
    audioReactor();
});

$pauseButton.on('click', function() {
    audio.pause();
    reset();
});

$forwardButton.on('click', function() {

});


// full screen
$container.on('click', function() {
    toggleFullscreen();

    $controls.fadeToggle('slow', 'linear');
    $header.fadeToggle('slow', 'linear');
    $playlist.fadeToggle('slow', 'linear');
});


$logo.on('click', function() {
   reset();
});

reset();
