'use strict'

const Scraper = require('./core/Scraper')

const scraperInstance = new Scraper({
	title: 'Solidity 0.4.24 Documentation',
	baseUrl: 'http://solidity.readthedocs.io/en/v0.4.24/',
	basePage: '',
	includeBasePage: true,
	contentSelector: '.rst-content > .document',
	addonCss: 'html,body { background: transparent; padding: 35px 20px !important } .rst-content { margin-bottom: 60px; }',
	linkIteratorFn: ($, links) => {
		$('.wy-menu > ul > li')
			.each(function(i, elem) {
	  		const link = $(this).find('a').attr('href')
	  		if (link) links.push(link);
			})
	},
	outputFile: 'solidity',
	openAfterCompile: true
}).run()
