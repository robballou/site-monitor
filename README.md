# Site monitor

Quick, hacky, trashy site monitor

**Requires node 15** (for `AbortController`)

```
npm install
node index.js
```

Will ping sites between 5 & 15 minutes apart. Change this configuration to change what sites are hit:

```
const pages = [
  {
    url: 'https://example.com',
    id: 'add-to-cart-button'
  },
  {
    url: 'https://example.com',
    selector: '.prod-product-cta-add-to-cart'
  }
]
```
