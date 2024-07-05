
const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];

function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject('unable to read file ${filePath}');
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject('unable to parse JSON from file ${filePath}');
                }
            }
        });
    });
}
function initialize() {
     return new Promise((resolve, reject) => {
        const itemsPath = path.join(__dirname, 'data', 'items.json');
        const categoriesPath = path.join(__dirname, 'data', 'categories.json');
        
        fs.readFile(itemsPath, 'utf8', (err, itemsData) => {
            if (err) {
                reject('Unable to read items.json file: ${err}');
                return;
            }
            try {
                items = JSON.parse(itemsData);

                fs.readFile(categoriesPath, 'utf8', (err, categoriesData) => {
                    if (err) {
                        reject('Unable to read categories.json file: ${err}');
                        return;
                    }
                    try {
                        categories = JSON.parse(categoriesData);
                        resolve();
                    } catch (err) {
                        reject('Unable to parse JSON from categories.json file: ${err}');
                    }
                });
            } catch (err) {
                reject('Unable to parse JSON from items.json file: ${err}');
            }
        });
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject(new Error("No items found"));
        } else {
            const orderedItems = items.map(item => ({
                id: item.id,
                category: item.category,
                postDate: item.postDate,
                featureImage: item.featureImage,
                price: item.price,
                title: item.title,
                body: item.body,
                published: item.published
            }));
            resolve(orderedItems);
        }

    });
}

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        if (!itemData) {
            reject(new Error("Invalid item data"));
        } else {
            if (itemData.published === undefined) {
                itemData.published = false;
            } else {
                itemData.published = true;
            }

            itemData.id = items.length + 1;
            items.push(itemData);
            resolve(itemData);
        }
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published==true);
        if (publishedItems.length > 0) {
            resolve(publishedItems);
        } else {
            reject('no results returned');
        }
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);
        } else {
            reject('no results returned');
        }
    });
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        
        const filteredItems = items.filter(item => item.category === category);

        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results returned");
        }
    });
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        
        const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));

        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results returned");
        }
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        const foundItem = items.find(item => item.id === id);

        if (foundItem) {
            resolve(foundItem);
        } else {
            reject("No result returned");
        }
    });
}

module.exports = {
    initialize,
    readFile,
    getAllItems,
    addItem,
    items,
    getPublishedItems,
    getCategories,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById
};