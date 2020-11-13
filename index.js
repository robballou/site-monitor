import Browser from 'zombie'
import notifier from 'node-notifier'
import debug from 'debug'

const d = debug('site-monitor')
const pages = [
  {
    url: 'https://www.amazon.com/Xbox-X/dp/B08H75RTZ8/ref=sr_1_3?dchild=1&keywords=xbox+series+x&link_code=qs&qid=1605191623&sourceid=Mozilla-search&sr=8-3&tag=mozilla-20',
    id: 'add-to-cart-button'
  },
  {
    url: 'https://www.bestbuy.com/site/microsoft-xbox-series-x-1tb-console-black/6428324.p?skuId=6428324',
    selector: '.add-to-cart-button',
    hasNoClass: 'btn-disabled'
  },
  {
    url: 'https://www.walmart.com/ip/XB1-Xbox-Series-X/443574645',
    selector: '.prod-product-cta-add-to-cart'
  },
  {
    url: 'https://direct.playstation.com/en-us/consoles/console/playstation5-console.3005816',
    selector: 'add-to-cart'
  }
]

let canPoll = true
let abort = null
const browsers = new WeakSet()

async function main () {
  d('main: start')
  // eslint-disable-next-line no-unmodified-loop-condition
  while (canPoll) {
    d('main: poll start')
    await poll()
    d('main: poll end')
    d('main: poll wait')
    try {
      await wait()
    } catch (err) {
      process.exit(0)
    }
    d('main: poll wait end')
  }
}

process.on('SIGABRT', () => { canPoll = false; abort?.abort() })
process.on('SIGINT', () => { canPoll = false; abort?.abort() })

/**
 *
 * @param {Promise<Browser>} browser
 * @param {[{ url: string, id?: string }]} page
 */
async function applyAssert (browserPromise, page) {
  const parsed = new URL(page.url)
  d(`applyAssert: ${parsed.host} start`)
  let passed = true
  const browser = await browserPromise
  try {
    browser.assert.success()
    browser.assert.element(page.id ? `#${page.id}` : page.selector)
    if (page.hasNoClass) {
      browser.assert.hasNoClass(page.selector, page.hasNoClass)
    }
    notifier.notify({ title: `${parsed.host} passed!`, open: page.url })
  } catch (err) {
    console.error(`Assertion for page failed: ${parsed.host}`)
    if (!err.code || err.code !== 'ERR_ASSERTION') {
      console.error(err)
    } else {
      d(err)
    }
    passed = false
  } finally {
    browsers.delete(browser)
  }
  d(`applyAssert: ${parsed.host} done`)
  return passed
}

async function poll () {
  return Promise.all(pages.map((page) => applyAssert(pollPage(page.url), page)))
}

function getRandomIntInclusive (min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min) // The maximum is inclusive and the minimum is inclusive
}

async function wait (ms = null) {
  abort = new AbortController()
  let waitTimeout = null

  return new Promise((resolve, reject) => {
    waitTimeout = setTimeout(() => resolve(), ms ?? getRandomIntInclusive(60 * 1000 * 5, 60 * 1000 * 15))
    abort.signal.addEventListener('abort', () => {
      d('abort!')
      if (waitTimeout) {
        clearTimeout(waitTimeout)
        waitTimeout = null
        reject(new Error('Aborted'))
      }
    })
  })
}

function pollPage (url) {
  const parsed = new URL(url)
  d(`pollPage: ${parsed.host} start`)
  return new Promise((resolve) => {
    const b = new Browser()
    browsers.add(b)
    b.visit(url, {}, (...args) => {
      d(`pollPage: ${parsed.host} done`, args)
      resolve(b)
    })
  })
}

main()
