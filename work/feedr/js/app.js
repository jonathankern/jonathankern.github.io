/*
 	Jonathan Kern
 	Feedr - A single page app compiling news articles by pulling real time data from from the Guardian, the New York Times, and Buzzfeed APIs.
*/

'use strict';

// set up API functionality
const buzzFeedAPIKey = '63d578a6ea244763881563c1d8ff62fd';
const buzzFeedUrl = 'https://newsapi.org/v2/top-headlines?sources=buzzfeed&apiKey=' + buzzFeedAPIKey;
const buzzFeedRequest = new Request(buzzFeedUrl);

const guardianAPIKey = '2621dcb3-6117-4f6e-942f-33c7d3a0fb9c';
const guardianUrl = 'http://content.guardianapis.com/search?show-fields=lastModified,headline,trailText,thumbnail&api-key=' + guardianAPIKey;
const guardianRequest = new Request(guardianUrl);

const nyTimesAPIKey = '7dd6c56fcda5456b89f945beb04ad9bd';
const nyTimesUrl = 'http://api.nytimes.com/svc/topstories/v2/sports.json?api-key=' + nyTimesAPIKey;
const nyTimesRequest = new Request(nyTimesUrl);

let status;
let articles;
let title;
let description;
let tag;
let thumbnailUrl;
let imageUrl;
let publishDate;
let articleUrl;
let $newsSource;

const $newsSourceContainer = $('<h2 class="newsSource">');
const $caret = $('<i class="fas fa-angle-double-right"></i>');
const $main = $('#main');
const $popUpWrapper = $('#popUp');

const $navLinkAll = $('nav ul li a.mainFeed');

function beginAll() {
	beginBuzzFeed();
	beginGuardian();
	beginNYTimes();

	$($navLinkAll).addClass('selected');
	$newsSource = 'All Articles';
	$newsSourceContainer.append($caret);
	$newsSourceContainer.append($newsSource);
}

function beginBuzzFeed() {
	fetch(buzzFeedRequest).then(function(response) {
		if (response.ok) {
			// get status
			status = response.status;

			// pull data and parse json
			return response.json();
		} else {
			alert('there was a problem with the request');
		}
	}).then(function(data) {
		$popUpWrapper.removeClass('loader');

		buzzFeedHandler(data);
	});
}

function beginGuardian() {
	fetch(guardianRequest).then(function(response) {
		if (response.ok) {
			// get status
			status = response.status;
			// pull data and parse json
			return response.json();
		} else {
			alert('there was a problem with the request');
		}
	}).then(function(data) {
		$popUpWrapper.removeClass('loader');

		guardianHandler(data);
	});
}

function beginNYTimes() {
	fetch(nyTimesRequest).then(function(response) {
		if (response.ok) {
			// get status
			status = response.status;
			// pull data and parse json
			return response.json();
		} else {
			alert('there was a problem with the request');
		}
	}).then(function(data) {
		$popUpWrapper.removeClass('loader');

		nyTimesHandler(data);
	});
}

function buzzFeedHandler(data) {

	articles = data.articles;

	articles.forEach(function(article) {
		title = article.title;
		description = article.description;
		imageUrl = article.urlToImage;
		articleUrl = article.url;
		publishDate = article.publishedAt;
		tag = 'Top Headlines';

		return uiHandler(title, description, imageUrl, articleUrl, publishDate, tag);
	});
}

function guardianHandler(data) {

	articles = data.response.results;

	articles.forEach(function(article) {
		title = article.fields.headline;
		description = article.fields.trailText;
		imageUrl = article.fields.thumbnail;
		articleUrl = article.webUrl;
		publishDate = article.fields.lastModified;
		tag = article.sectionName;

		return uiHandler(title, description, imageUrl, articleUrl, publishDate, tag);
	});
}

function nyTimesHandler(data) {
	articles = data.results;

	articles.forEach(function(article) {
		title = article.title;
		description = article.abstract;
		imageUrl = article.multimedia[0].url;
		articleUrl = article.url;
		publishDate = article.published_date;
		tag = article.section;

		return uiHandler(title, description, imageUrl, articleUrl, publishDate, tag);
	});
}

function uiHandler(title, description, imageUrl, articleUrl, publishDate, tag) {
	const $articleWrapper = $('<article class="article">');
	const $thumbnailWrapper = $('<section class="featuredImage">');
	const $articleContentWrapper = $('<section class="articleContent">');

	const $imageElement = $('<img>');
	const $imageUrl = $imageElement.attr('src', imageUrl);

	const $link = $('<a href="#" class="openPopUp">');
	const $h3Element = $('<h3 class="articleTitle">');
	const $h6Element = $('<h6>');
	const $impressionsElement = $('<span class="impressions">');

	const $convertPublishDay = publishDate.substr(5, 5);
	const $convertPublishYear = publishDate.substr(0,4);
	const $convertPublishDate = $convertPublishDay + '-' + $convertPublishYear;
	const $publishText = 'Published: ' + $convertPublishDate;

	// add to DOM
	$main.prepend($newsSourceContainer);
	//append img to thumbnail wrapper
	$thumbnailWrapper.append($imageElement);

	// append article to container
	$main.append($articleWrapper);

	// append sections to article
	$articleWrapper.append($thumbnailWrapper);
	$articleWrapper.append($articleContentWrapper);
	// $articleWrapper.append($impressionsElement);

	// append title to h3
	$h3Element.append(title);

	// append h3 to link
	$link.append($h3Element);

	// append to tag h6
	$h6Element.append(tag);

	// append publishDate to impressions
	$impressionsElement.append($publishText);

	// append headings to article content
	$articleContentWrapper.append($link);
	$articleContentWrapper.append($h6Element);
	$articleContentWrapper.append($impressionsElement);

	// click article to open pop-up
	$articleWrapper.click(function() {
		// show popup
		$popUpWrapper.removeClass('hidden');

		const $popUpH1Element = $('#popUp .container h1');
		const $popUpPElement = $('#popUp .container p');
		const $popUpAElement = $('.popUpAction');
		const $popUpArticleUrl = $popUpAElement.attr('href', articleUrl);

		$popUpH1Element.append(title);
		$popUpPElement.append(description);
		$popUpAElement.append($popUpArticleUrl);

		// click handler closePopUp
		$('.closePopUp').click(function() {
			$popUpWrapper.addClass('hidden');

			$popUpH1Element.empty();
			$popUpPElement.empty();
		});
	});
}

function clear() {
	$('#popUp .container').empty();
	$newsSourceContainer.empty();
	$main.empty();
}

$('.mainFeed').click(function(event) {
	event.preventDefault();
	clear();
	beginAll();

	$(this).addClass('selected');
	$('.buzzFeedSource, .guardianSource, .nyTimesSource').removeClass('selected');
});

$('.buzzFeedSource').click(function(event) {
	event.preventDefault();
	clear();

	$newsSource = 'Buzzfeed Articles';
	$newsSourceContainer.append($caret);
	$newsSourceContainer.append($newsSource);

	beginBuzzFeed();

	$(this).addClass('selected');
	$('.mainFeed, .guardianSource, .nyTimesSource').removeClass('selected');
});

$('.guardianSource').click(function(event) {
	event.preventDefault();
	clear();

	$newsSource = 'The Guardian Articles';
	$newsSourceContainer.append($caret);
	$newsSourceContainer.append($newsSource);


	beginGuardian();

	$(this).addClass('selected');
	$('.buzzFeedSource, .mainFeed, .nyTimesSource').removeClass('selected');
});

$('.nyTimesSource').click(function(event) {
	event.preventDefault();
	clear();

	$newsSource = 'The New York Times Articles';
	$newsSourceContainer.append($caret);
	$newsSourceContainer.append($newsSource);

	beginNYTimes();

	$(this).addClass('selected');
	$('.buzzFeedSource, .guardianSource, .mainFeed').removeClass('selected');
});

beginAll();
