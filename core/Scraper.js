'use strict'

// NPM dependencies
const fs = require('fs')
const path = require('path')
const request = require('request')
const cheerio = require('cheerio')
const async = require('async')
const _ = require('lodash')
const open = require('open')

/**
 * JavaScript base class for scraping documentation pages
 */
class Scraper {

	constructor(settings) {
		this.title = settings.title
		this.baseUrl = settings.baseUrl
		this.includeBasePage = settings.includeBasePage
		this.basePage = settings.basePage
		this.contentSelector = settings.contentSelector
		this.addonCss = settings.addonCss
		this.linkIteratorFn = settings.linkIteratorFn
		this.outputFile = settings.outputFile
		this.openAfterCompile = settings.openAfterCompile

		this.outputDir = 'output'

		// regex settings
		this.httpsCssRegex = /(<link.+?href=")(?:\/{2})([a-zA-Z]{1}.*?")/g
		this.httpsJsRegex = /(<script.+?src=")(?:\/{2})([a-zA-Z]{1}.*?")/g
		
		this.cssLookupRegex = /(<link.*?href=".*?\.css".*>)/g
		this.jsLookupRegex = /(<script.*?src=".*?\.js".*<\/script>)/g
		
		this.inlineStylesRegex = /(<style.*>(.|\n)*?<\/style>)/g
		
		this.httpsRegex = [
			/(<link.+?href=")(?:\/{2})([a-zA-Z]{1}.*?")/g,
			/(<script.+?src=")(?:\/{2})([a-zA-Z]{1}.*?")/g
		]

		this.relSrcRegex = [
			/(<img.*?src=")((?!http|https).*?)(")/g,
			/(<img.+srcset=")(\/{1}[a-zA-Z]{1}.*)(,\s)/g,
			/(<img.+srcset=".+(?:,\s)|\n)(\/{1}[a-zA-Z]{1}.*)(">)/g,
			/(<a.*?href=")(\/.*?)(")/g,
			/(<link.*?href=")((?!http|https).*?)(")/g,
			/(<script.*?src=")((?!http|https).*?)(")/g
		]
	}

	/**
	 * Main scraper method
	 * @param {string} url - Web page to load
	 * @return {object}
	 */
	async scraper(url) {
		return new Promise((resolve, reject) => {
			request(url, (err, resp, html) => {
		    if (!err){
		      const $ = cheerio.load(html)
		      resolve($)
		    } else {
		    	reject(err)
		    }
			})
		})
	}

	/**
	 * Get links to doc pages
	 * @return {object}
	 */
	async getLinks(linkIteratorFn) {
		console.log('- Scraping links...')
		
		return new Promise((resolve, reject) => {
			let links = []

			if (this.includeBasePage === true) {
				links.push(this.basePage)
			}
			
			this.scraper(this.baseUrl+this.basePage).then($ => {
				this.linkIteratorFn($, links)
				resolve(links)
			}).catch(err => {
			  reject(err)
			})
		})
	}

	/**
	 * Get single page contents
	 * @param {string} url - Web page to load
	 * @return {string}
	 */
	async getPageContent(url) {
		console.log('- Scraping page:', url)

		return new Promise((resolve, reject) => {
			this.scraper(this.baseUrl+url).then($ => {
				let html = ''

				if (typeof this.contentSelector === 'string') {
					html = $(this.contentSelector).html()
				} else if (typeof this.contentSelector === 'function') {
					// let the function assign the html
					html = this.contentSelector($)
				}
				
				// correct sources
				html = this.handleHttpsSources(html)
				html = this.handleRelLinks(html)

				resolve(html)
			}).catch(err => {
			  reject(err)
			})
		})
	}

	/**
	 * Get combined HTML from all pages 
	 * @param {object} links - array of links to scrape (in order)
	 * @return {string}
	 */
	async getAllContent(links) {
		console.log('- Scraping content...')

		const getContentWrapper = () => {
			const matchRegex = (input, regex) => {
				const matches = input.match(regex)
				return matches && matches.length ? input.replace(regex, ` $1`).trim() : ''
			}

			const classes = matchRegex(this.contentSelector, /(?:\.{1})([a-zA-Z]+)/g)
			const ids = matchRegex(this.contentSelector, /(?:#{1})([a-zA-Z]+)/g)
			
			return `<div class="${classes}" id="${ids}">`
		}

		// returns joined html output
		const prepareData = input => {
			getContentWrapper()

			return _(input)
				.sortBy(item => item.index)
				// .map(item => item.html )
				.map(item => `${getContentWrapper()}${item.html}</div>` )
				.value()
				.join('')
		}
		
		return new Promise((resolve, reject) => {
			const data = []

			// limiting amount of parallel requests to 5 for optimal performance
			async.eachLimit(links, 10, (link, callback) => {
				this.getPageContent(link).then(result => {
					data.push({
						index: links.indexOf(link),
						html: result
					})
					callback()
				}).catch(err => {
				  callback(err)
				})
			}, err => {
		    if(err) {
		      return reject(err)
		    }

		    resolve(prepareData(data))
			})
		})
	}

	/**
	 * Get CSS
	 * @param {string} url - Web page to load
	 * @return {string}
	 */
	async getBasePage() {
		console.log('- Scraping base page...')
		
		return new Promise((resolve, reject) => {
			
			this.scraper(this.baseUrl+this.basePage).then($ => {
				let pageHtml = $.html()

				// update sources
				pageHtml = this.handleRelLinks(pageHtml)
				pageHtml = this.handleHttpsSources(pageHtml)
				
				resolve(pageHtml)
			}).catch(err => {
			  reject(err)
			})
		})
	}

	/**
	 * Get CSS from given html
	 * @param {string} pageHtml - Web page HTML
	 * @return {string}
	 */
	getStyles(pageHtml) {
		console.log('- Fetching styles...')

		let styles = ''
		
		// get linked styles
		const cssLinks = pageHtml.match(this.cssLookupRegex) || []
		styles += cssLinks.join('')
		
		// get inline styles
		const inlineStyles = pageHtml.match(this.inlineStylesRegex) || []

		styles += inlineStyles.join('')
		
		// add some styles manually to correct document
		if(this.addonCss) styles += `<style>${this.addonCss}</style>`;
		
		return styles
	}

	/**
	 * Get JS from given html
	 * @param {string} pageHtml - Web page HTML
	 * @return {string}
	 */
	getScripts(pageHtml) {
		console.log('- Fetching scripts...')

		let scripts = ''
		
		// get linked styles
		const jsLinks = pageHtml.match(this.jsLookupRegex)

		// append gathered links together
		scripts += jsLinks.join('') 
		
		return scripts
	}

	/**
	 * Transform relative links to absolute via baseUrl 
	 * @param {string} input - array of links to scrape (in order)
	 * @return {string}
	 */
	handleRelLinks(input) {
		this.relSrcRegex.forEach(regex => {
			input = input.replace(regex, `$1${this.baseUrl}$2$3`)
		})

		return input
	}

	/**
	 * Transform "//cdn..." type of sources to "https://" 
	 * @param {string} input - array of links to scrape (in order)
	 * @return {string}
	 */
	handleHttpsSources(input) {
		this.httpsRegex.forEach(regex => {
			input = input.replace(regex, `$1https:\/\/$2`)
		})

		return input
	}

	/**
	 * Write output HTML to file
	 * @param {string} html - HTML to insert into document
	 * @param {string} styles - CSS to insert into document
	 * @param {scripts} styles - JS to insert into document
	 * @param {string} title - Resulting web page title
	 * @param {string} filename - output filename
	 */
	async writeHtmlFile(html, styles, scripts, title, filename = 'index.html') {
		console.log('- Writing HTML file to:', filename)

		// output HTML page string
		const formatHtml = input => {
			return '<html>\
				<head>\
					<title>'+title+'</title>\
					'+styles+'\
					'+scripts+'\
				</head>\
				<body>'+input+'</body>\
			</html>'
		}
		
		return new Promise((resolve, reject) => {	
			fs.writeFile(filename, formatHtml(html), err => {
			  if (err) reject(err);
			  resolve()
			})
		})
	}

	/**
	 * Run scraper/compiler
	 */
	async run() {
		try {
			const links = await this.getLinks()
			const html = await this.getAllContent(links)
			const basePageHtml = await this.getBasePage()
			const styles = this.getStyles(basePageHtml)
			const scripts = this.getScripts(basePageHtml)
			const destinationFile = path.resolve(__dirname, `../${this.outputDir}/${this.outputFile}.html`)

			// create output directory if nonexsistant
			if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir);
			
			await this.writeHtmlFile(html, styles, scripts, this.title, destinationFile)

			// open file in browser after successful compile
			if (this.openAfterCompile) open(destinationFile);
		} catch(e) {
			console.log('An error occured...')
			console.log(e.message)
		}
	}

}

module.exports = Scraper