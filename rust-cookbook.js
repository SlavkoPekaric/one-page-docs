'use strict'

const Scraper = require('./core/Scraper')

const scraperInstance = new Scraper({
	title: 'Rust Cookbook',
	baseUrl: 'https://rust-lang-nursery.github.io/rust-cookbook/',
	basePage: 'intro.html',
	contentSelector: '.content main',
	addonCss: 'code, .playpen { background: none !important; } pre.playpen { padding: 10px; border: 1px solid black; } code.language-sh { font-weight: bold; } ',
	linkIteratorFn: ($, links) => {
		$('#sidebar .chapter a')
			.each(function(i, subElem) {
		  	const link = $(this).attr('href')
		  	links.push(link)
			})
	},
	outputFile: 'rust-cookbook',
	openAfterCompile: true
}).run()

