const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];

function initialize() {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8', (err, itemsData) => {
            if (err) {
                reject('Unable to read items file');
                return;
            }
            items = JSON.parse(itemsData);

            fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8', (err, categoriesData) => {
                if (err) {
                    reject('Unable to read categories file');
                    return;
                }
                categories = JSON.parse(categoriesData);
                resolve();
            });
        });
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject('No items available');
        } else {
            resolve(items);
        }
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published);
        if (publishedItems.length === 0) {
            reject('No published items available');
        } else {
            resolve(publishedItems);
        }
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            reject('No categories available');
        } else {
            resolve(categories);
        }
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories
};
