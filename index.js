const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const PdfDocument = require('pdfkit');


(async () => {

    const directory = 'shots/';
    let slidesCounter = 0;
    let width;
    let height;



    const link = 'https://drive.google.com/open?id=1o3XmvhBihZFAvrLTm2PnUjd30tk789NP';

    const parentSlector = 'div.ndfHFb-c4YZDc-cYSp0e-DARUcf';
    const selector = 'div.ndfHFb-c4YZDc-cYSp0e-DARUcf-PLDbbf';


    // run program
    await fs.promises.mkdir(directory, {recursive: true})

    await cleanDirectory(directory);
    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    const pageHeight = {
        horizontal: 900,
        vertical: 1400
    }

    await page.setViewport({
        width: 1920,
        height: pageHeight.vertical
    });

    await page.goto(link);

    const title = (await page.title()).split('.')[0];

    await analyzePage(page);

    browser.close();

    await createPDF();

    async function analyzePage(page) {
        const delay = 1000;

        const slides = await page.evaluate(selector => {
            const element = document.querySelectorAll(selector);
            const recArray = [];
            slidesCounter = element.length;

            if (!element)
                return null;

            for (let i = 0; i < element.length; i++) {
                const {x, y, width, height} = element[i].getBoundingClientRect();
                recArray[i] = {x, y, width, height};
            }

            return recArray;
        }, selector, title);


        let iterator = 0;

        do {

            const params = {
                x: slides[0].x,
                y: (iterator === slides.length - 1) ? (pageHeight - slides[iterator].height - 56) : slides[0].y,
                width: slides[iterator].width,
                height: slides[iterator].height
            };

            await page.waitFor(delay);

            await takeScreenshot(params, iterator);

            await page.evaluate(height => {
                const container = document.querySelector('.ndfHFb-c4YZDc-cYSp0e-s2gQvd');
                container.scrollBy(0, height + 16);
            }, slides[iterator].height);

            iterator++;
            console.log(iterator);

        } while (slides[iterator - 1] !== slides[slides.length - 1]);

        slidesCounter = iterator;
        width = slides[0].width;
        height = slides[0].height;
    }

    async function takeScreenshot(clip, i) {
        await page.screenshot({
            path: directory + `slide-${i}.png`,
            clip
        });
    }

    async function createPDF() {
        const doc = new PdfDocument({
            autoFirstPage: false
        });

        doc.pipe(fs.createWriteStream(`${__dirname}/${title}.pdf`));

        for (let i = 0; i < slidesCounter; i++) {
            doc.addPage({
                margin: 0,
                size: [width, height]
            }).image(`${directory}slide-${i}.png`,
                {
                    align: "center",
                    valign: "center",
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
