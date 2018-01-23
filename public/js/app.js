// Author: Jonathan Kern
// Last Updated: 01/22/18

// Repercussion: An audio reactive web app built off of the Spotify API in conjunction with THREE.js


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
const $tracks = $('.tracks');
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
const track = '../assets/audio/50Cent-InDaClub.mp3';

// Frequency must be one of: 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, and 32768
let fftSize = 32768;

let scene;
let camera;
let renderer;
let analyser;
let uniforms;

let userInputValue;

$(document).ready(function() {

    // clear input when clicking into it
    $('input').on('focus', function() {
        $(this).val('');
    });

    // prevent page from loading on form
    $options.submit(function(event) {
        event.preventDefault();
    });

    // options controls
    $optionsButton.on('click', function() {
        $options.fadeToggle('slow', 'linear');
    });

    // update colors in database
    $updateColorButton.on('click', function() {
        const inputColorValueR = $('#input-color-r').val();
        const inputColorValueG = $('#input-color-g').val();
        const inputColorValueB = $('#input-color-b').val();
        const colorReference = databaseReference.ref('color');

        colorReference.update({
            rValue: inputColorValueR,
            gValue: inputColorValueG,
            bValue: inputColorValueB
        });

        // make 3 values set to one string
        userInputValue = inputColorValueR + ', ' + inputColorValueG + ', ' + inputColorValueB;

        // update input with new value
        $("#results-input-color").attr('value', userInputValue);

        // clear input
        $('#input-color-r').val('');
        $('#input-color-g').val('');
        $('#input-color-b').val('');
    });

    // update line height in database
    $updateLineHeightButton.on('click', function() {
        const inputLineHeightValue = $('#input-line-height').val();
        const lineHeightReference = databaseReference.ref('lineHeight');

        lineHeightReference.update({
            value: inputLineHeightValue
        });

        userInputValue = inputLineHeightValue;

        // update input with new value
        $("#results-input-line-height").attr('value', userInputValue);

        // clear input
        $('#input-line-height').val('');
    });

    // update frequency in database
    $updateFrequencyButton.on('click', function() {
        const inputFrequencyValue = $('#input-frequency').val();
        const frequencyReference = databaseReference.ref('frequency');

        frequencyReference.update({
            value: inputFrequencyValue
        });

        userInputValue = inputFrequencyValue;

        // update input with new value
        $("#results-input-frequency").attr('value', userInputValue);

        // clear input
        $('#input-frequency').val('');
    });
});


// Categories
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
        $playlists.show();

        // slide categories to the left to make room for playlists
        $('.categories').css(
            {
                'position': 'relative',
                'left': '-1000px',
                'display': 'none'
            }
        );

        const playlistsRequestUrl = 'https://api.spotify.com/v1/browse/categories/' + categoryId + '/playlists';

        return fetchPlaylistsData(playlistsRequestUrl);
    });
}


// Playlists
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

                // pull data and parse json
                return response.json();
            } else {
                alert('there was a problem with the request');
            }
        }).then(function(data) {
            return playlists(data);
    });
}

function playlists(data) {
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
        $tracks.show();

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


// Tracks
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

                // pull data and parse json
                return response.json();
            } else {
                alert('there was a problem with the request');
            }
        }).then(function(data) {
            return tracks(data);
    });
}

function tracks(data) {
    const tracksData = data.items;

    tracksData.forEach(function(thisTrack) {
        trackName = thisTrack.track.name;
        artistName = thisTrack.track.artists[0].name;
        albumName = thisTrack.track.album.name;
        trackTime = thisTrack.track.duration_ms;

        return tracksUI(trackName, artistName, albumName, trackTime);
    });
}

function tracksUI(trackName, artistName, albumName, trackTime) {
    $('.tracks .controls').show();

    // UI elements
    const $orderedListElement = $('.tracks ol');
    const $listElement = $('<li></li>');
    const $firstListElement = $('.tracks ol li:first-child');
    const $trackName = $('<p class="track-name"></p>');
    const $trackInfo = $('<small></small>');
    const $artistName = $('<span class="artist-name"> </span>');
    const $albumName = $('<span class="album-name"> - </span>');
    const $trackTime = $('<span class="track-time"> - </span>');

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
}


// Audio reactor
function audioReactor() {
    $line.css('width', '0');
    $lines.addClass('move');
    $('.sidebar--right .controls').show();

    // initialize audio reactor
    init();
    animate();
}

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);
    $container.append(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.Camera();

    fftSize;

    audioLoader.load(track, function(buffer) {
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


// reset everything
function reset() {
    audio.pause();

    $tracks.removeClass('move');

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


$tracks.on('click', function() {
    $(this).toggleClass('move', 1000, "easeInOut");
});

$rewindButton.on('click', function() {

});

$playButton.on('click', function() {
    audioReactor();
});

$pauseButton.on('click', function() {
    audio.pause();

    $('.categories').css(
        {
            'position': 'relative',
            'left': '0',
            'display': 'block'
        }
    );

    $playlists.show();

    $tracks.hide();

    $('.sidebar--right .controls').hide();

    $lines.removeClass('move');
    $line.css('width', '100%');

});

$forwardButton.on('click', function() {

});


// full screen
$container.on('click', function() {
    toggleFullscreen();

    $controls.fadeToggle('slow', 'linear');
    $header.fadeToggle('slow', 'linear');
    $tracks.fadeToggle('slow', 'linear');
});


$logo.on('click', function() {
   reset();
});

reset();
