import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParseModule = require('pdf-parse')
const pdfParse = pdfParseModule.default || pdfParseModule
import { readFileSync, writeFileSync } from 'fs'

const pdfPath = process.argv[2]
const pdf = readFileSync(pdfPath)
const data = await pdfParse(pdf)
writeFileSync('scripts/extracted.txt', data.text)
console.log(`Extracted ${data.numpages} pages, ${data.text.length} chars`)
