'use strict'

const Scraper = require('./core/Scraper')

const scraperInstance = new Scraper({
	title: 'The Rust Programming Language',
	baseUrl: 'https://doc.rust-lang.org/1.29.0/book/second-edition/',
	basePage: 'foreword.html',
	contentSelector: '.content main',
	addonCss: '.content { max-width: 100%; } code, .playpen { background: none !important; } pre.playpen { padding: 10px; border: 1px solid black; } code.language-sh { font-weight: bold; } ',
	linkIteratorFn: ($, links) => {
		$('#sidebar .chapter a')
			.each(function(i, subElem) {
		  	const link = $(this).attr('href')
		  	links.push(link)
			})
	},
	outputFile: 'rust-programming-language',
	openAfterCompile: false
}).run()

