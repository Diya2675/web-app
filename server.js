/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Diya Keyur Acharya
Student ID: 162776223
Date: 11th June
Vercel Web App URL: 
GitHub Repository URL: 

********************************************************************************/ 
const express = require('express'); 
const path = require("path"); 
const storeservice = require('./store-service');

const app = express();


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
    
app.get('/items', (req, res) => {
    storeservice.getAllItems()
    .then(allItems => res.json(allItems))
    .catch(err => res.status(500).json({ message: err }));
});

app.get('/categories', (req, res) => {
    storeservice.getCategories()
        .then(allCategories => res.json(allCategories))
        .catch(err => res.status(500).json({ message: err }));
});

app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

storeservice.initialize()
.then(() => {
app.listen(HTTP_PORT, () => {
console.log(`Server listening on: ${HTTP_PORT}`);
     });
 })
.catch(err => {
console.error(`Failed to initialize the data: ${err}`);
 });

 module.exports = app;