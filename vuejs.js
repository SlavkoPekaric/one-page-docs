'use strict'

const Scraper = require('./core/Scraper')

const scraperInstance = new Scraper({
	title: 'Vue JS v2 Documentation',
	baseUrl: 'https://vuejs.org',
	basePage: '/v2/guide/installation.html',
	contentSelector: '.content.guide',
	addonCss: 'html,body { padding: 35px 20px !important } .content { padding: 0 !important; max-width: none !important; width: 100%; margin: 0 0 50px 0; } .guide-links, .footer { display: none !important; }',
	linkIteratorFn: ($, links) => {
		$('.sidebar ul.menu-root')
			.find('li')
			.each(function(i, elem) {
	  		const link = $(this).find('a').attr('href')
	  		if (link) {
			  	links.push(link)
	  		}
			})
	},
	outputFile: 'vue-js-v2',
	openAfterCompile: true
}).run()

