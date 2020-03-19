const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const PdfDocument = require('pdfkit');


(async () => {


    const directory = 'shots/';

    // await cleanDirectory(directory);
    // const browser = await puppeteer.launch({
    //     // headless: false
    // });
    // const page = await browser.newPage();
    // const parentSlector = 'div.ndfHFb-c4YZDc-cYSp0e-DARUcf';
    // const selector = 'div.ndfHFb-c4YZDc-cYSp0e-DARUcf-PLDbbf';
    //
    // await page.setViewport({
    //     width: 1920,
    //     height: 800
    // });
    //
    // await page.goto('https://drive.google.com/file/d/1jJ-GPgDullepWlKXK9XYKmODxsCtxOAV/view');
    //
    // await scrollToBottom(page);
    // browser.close();

    await createPDF();

    async function scrollToBottom(page) {
        const delay = 1000;

        const slides = await page.evaluate(selector => {
            const element = document.querySelectorAll(selector);
            const recArray = [];

            if (!element)
                return null;

            for (let i = 0; i < element.length; i++) {
                const {x, y, width, height} = element[i].getBoundingClientRect();
                recArray[i] = {x, y, width, height};
            }

            return recArray;
        }, selector);


        let iterator = 0;

        do {
            await page.waitFor(delay);

            await screenshot({
                x: slides[0].x,
                y: slides[0].y,
                width: 800,
                height: 600
            }, iterator);

            await page.evaluate((y) => {
                const container = document.querySelector('.ndfHFb-c4YZDc-cYSp0e-s2gQvd');
                container.scrollBy(0, 600 + 16);
            }, slides[iterator].y);

            iterator++;

            console.clear();
            console.log(iterator);

        } while (slides[iterator - 1] !== slides[slides.length - 1]);
    }

    async function screenshot({x, y, width, height}, i) {
        await page.screenshot({
            path: directory + `slide-${i}.png`,
            clip: {
                x,
                y,
                width,
                height
            }
        });
    }

    async function createPDF() {
        const doc = new PdfDocument({
            autoFirstPage: false
        });


        doc.pipe(fs.createWriteStream(__dirname + '/Prezentacja.pdf'));

        for (let i = 0; i < 89; i++) {
            doc.addPage({
                layout: "landscape",
                margin: 0
            }).image(`${directory}slide-${i}.png`, {
                // fit: [600, 800],
                align: "center",
                valign: "center"
            })
        }

        doc.end();
    }

    async function cleanDirectory(directory) {
        fs.readdir(directory, (err, files) => {
            if (err) throw err;

            for (const file of files) {
                fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                });
            }
        });
    }
})
();
