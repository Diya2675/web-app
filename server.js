/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Diya Keyur Acharya
Student ID: 162776223
Date: 7th July
Vercel Web App URL: https://web-app-beta-ochre.vercel.app/about
GitHub Repository URL: https://github.com/Diya2675/web-app
********************************************************************************/ 

const express = require('express'); 
const path = require("path"); 
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const { getAllItems, addItem, getItemsByCategory, getItemsByMinDate, getItemById } = require('./store-service');
cloudinary.config({
    cloud_name: 'dmg5zxhhk',
    api_key: '543789546385119',
    api_secret: 'hIml14to_D_RfjuF_SVzw5VNmiY',
    secure: true
});

const upload = multer(); 

const streamifier = require('streamifier')

const app = express();
const storeservice = require('./store-service');

const HTTP_PORT = process.env.PORT || 8080;
    
app.use(express.static("public"));

app.get('/', (req, res) => {
    res.redirect('/about');
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, "/views/about.html"));
});

app.get('/shop', (req, res) => {
storeservice.getPublishedItems()
    .then(publishedItems => res.json(publishedItems))
    .catch(err => res.status(500).json({ message: err }));
});
    
app.get('/items', async (req, res) => {
    try {
        const { category, minDate } = req.query;

        if (category) {
            try {
            const items = await getItemsByCategory(parseInt(category)); 
            res.status(200).json(items);
            } catch (error) {
            console.error('Error fetching items by category:', error);
            res.status(404).send('No items found for the entered category number');
            }
        } else if (minDate) {
            try {
            const items = await getItemsByMinDate(minDate);
            res.status(200).json(items);
            } catch (error) {
            console.error('Error fetching items by minDate:', error);
            res.status(404).send('No items found for the entered date');
            }
        } else {
            const items = await getAllItems();
            res.status(200).json(items);
        }
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).send('Failed to fetch items');
    }
});

app.get('/categories', (req, res) => {
    storeservice.getCategories()
        .then(allCategories => res.json(allCategories))
        .catch(err => res.status(500).json({ message: err }));
});

app.get('/additem', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'addItem.html'));
});

app.post('/additem', upload.single('featureImage'), async (req, res) => {
    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        const upload = async (req) => {
            const result = await streamUpload(req);
            return result;
        };

        try {
            const uploaded = await upload(req);
            processItem(uploaded.url);
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).send('Failed to upload image');
            return;
        }
    }else{
        processItem("");
    }
 
    async function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        //const published = req.body.published === "true"; 
        const itemData = {
            id: 0,
            category: parseFloat(req.body.category),
            postDate: new Date().toISOString().split('T')[0], 
            featureImage: req.body.featureImage,
            price: parseFloat(req.body.price),
            title: req.body.title,
            body: req.body.body,
            published: req.body.published
        };

        try {
            const newItem = await addItem(itemData);

            const orderedItem = {
                id: newItem.id,
                category: newItem.category,
                postDate: newItem.postDate,
                featureImage: newItem.featureImage,
                price: newItem.price,
                title: newItem.title,
                body: newItem.body,
                published: newItem.published
            };
            res.status(201).json(orderedItem); 
        } catch (err) {
            console.error('Add item error:', err);
            res.status(500).send('Failed to add item');
        }
    }

});

    function processItem(imageUrl){
        req.body.featureImage = imageUrl;
    
        let itemData = {
            id: 0, 
            category: parseInt(req.body.category),
            postDate: new Date().toISOString().split('T')[0], 
            featureImage: req.body.featureImage,
            price: parseFloat(req.body.price),
            title: req.body.title,
            body: req.body.body,
            published: req.body.published 
        };

        storeservice.addItem(itemData)
            .then(() => {
                res.redirect('/items'); 
            })
            .catch(err => {
                console.error('Error adding item:', err);
                res.status(500).send('Error adding item');
            });
    }

app.get('/item/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    storeservice.getItemById(itemId)
        .then(item => res.json(item))
        .catch(err => res.status(404).json({ message: err }));
});



app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

storeservice.initialize()
.then(() => {
app.listen(HTTP_PORT, () => {
console.log('Server listening on:  http://localhost:8080');
     });
 })
.catch(err => {
console.error('Failed to initialize the data: ${err}');
 });

 module.exports = app;



