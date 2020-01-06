'use strict'

const Scraper = require('./core/Scraper')

const scraperInstance = new Scraper({
	title: 'Sequelize V5 Documentation',
	baseUrl: 'https://sequelize.org/v5/',
	basePage: '/manual/getting-started.html',
	contentSelector: '.content',
	addonCss: 'html,body { padding: 35px 20px !important } .content { margin: 0; padding: 0 }',
	linkIteratorFn: ($, links) => {
		$('.manual-toc-root ul.manual-toc > li:first-child')
			.each(function(i, elem) {
        const link = $(this).find('a').attr('href')
        links.push(link)
			})
	},
	outputFile: 'sequelize-v5',
	openAfterCompile: true
}).run()

