import chromium from 'chrome-aws-lambda'

async function getBrowserInstance() {
	const executablePath = await chromium.executablePath

	if (!executablePath) {
		// running locally
		const puppeteer = require('puppeteer')
		return puppeteer.launch({
			args: chromium.args,
			headless: true,
			defaultViewport: {
				width: 1280,
				height: 720
			},
			ignoreHTTPSErrors: true
		})
	}

	return chromium.puppeteer.launch({
		args: chromium.args,
		defaultViewport: {
			width: 1280,
			height: 720
		},
		executablePath,
		headless: chromium.headless,
		ignoreHTTPSErrors: true
	})
}

export default async (req, res) => {
	const url = req.body.url

	// Perform URL validation
	if (!url || !url.trim()) {
		res.json({
			status: 'error',
			error: 'Enter a valid URL'
		})

		return
	}

	let browser = null

	try {
		browser = await getBrowserInstance()
		let page = await browser.newPage()
		await page.goto(url)

		const ImgBuffer = await page.screenshot({
            fullPage: true,
            encoding: "base64",
          });
          await browser.close();

		  return res.status(200).json({
            success: true,
            msg: "Resume is Successfully Created.",
			imgData: ImgBuffer
          });

		// upload this buffer on AWS S3
	} catch (error) {
		console.log(error)
		res.json({
			status: 'error',
			data: error.message || 'Something went wrong'
		})
		// return callback(error);
	} finally {
		if (browser !== null) {
			await browser.close()
		}
	}
}
