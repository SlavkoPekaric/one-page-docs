'use strict'

const Scraper = require('./core/Scraper')

const scraperInstance = new Scraper({
	title: 'React.js Documentation',
	baseUrl: 'https://reactjs.org',
	basePage: '/docs/getting-started.html',
	contentSelector: 'article',
	addonCss: 'html,body { padding: 35px 20px !important } p { max-width: 100% !important; } header + div > div:nth-child(2) { display: none !important; } header + div { margin-bottom:30px !important; }',
	linkIteratorFn: ($, links) => {
		$('article')
			.next('div')
			.find('nav')
			.children('div')
			.each(function(i, elem) {
		  	$(this)
		  		.find('ul')
		  		.children('li')
		  		.each(function(ii, subElem) {
				  	const link = $(this).find('a').attr('href')
				  	links.push(link)
					})
			})
	},
	outputFile: 'reactjs',
	openAfterCompile: true
}).run()

