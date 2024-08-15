/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Diya Keyur Acharya
Student ID: 162776223
Date: 31th July
Vercel Web App URL: https://webapp-lake-gamma.vercel.app/about
GitHub Repository URL: https://github.com/Diya2675/web-app
********************************************************************************/
const express = require('express');
const path = require("path");
const exphbs = require('express-handlebars');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require('./store-service');
const clientSessions = require('client-sessions');
const authData = require('./auth-service');
const mongoose = require('mongoose');
const pg= require("pg");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// MongoDB connection string
const mongoString = 'mongodb+srv://dkacharya:Kamania@1234@cluster0.xjb0t.mongodb.net/';

mongoose.connect(mongoString, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dmg5zxhhk',
    api_key: '543789546385119',
    api_secret: 'hIml14to_D_RfjuF_SVzw5VNmiY',
    secure: true
});

// Multer configuration
const upload = multer();

// Handlebars configuration
const hbs = exphbs.create();

hbs.handlebars.registerHelper('navLink', function(url, options) {
    let active = '';
    if (url === app.locals.activeRoute) {
        active = 'active';
    }
    return `<li class="nav-item"><a href="${url}" class="nav-link ${active}">${options.fn(this)}</a></li>`;
});

hbs.handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 arguments");
    if (lvalue != rvalue) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
});
hbs.handlebars.registerHelper('safeHTML', function(context) {
    return new hbs.handlebars.SafeString(context);
});
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
}));
app.set('view engine', '.hbs');

// Client Sessions configuration
app.use(clientSessions({
    cookieName: 'session',
    secret: 'secret',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000,
}));

app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});

// Ensure Login middleware
const ensureLogin = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
};

// Routes
app.get("/", (req, res) => {
    res.redirect("/shop");
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get("/shop", async (req, res) => {
    let viewData = {};

    try {
        let items = await storeService.getAllItems();

        viewData.items = items;
        viewData.item = items.length > 0 ? items[0] : null;
        viewData.viewingCategory = req.query.category;
    } catch (err) {
        viewData.message = "No results for items.";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No results for categories.";
    }

    res.render("shop", viewData);
});

app.get('/shop/:id', async (req, res) => {
    let viewData = {};

    try {
        let items = await storeService.getItemsByCategory(req.params.id);
        viewData.items = items;
    } catch (err) {
        viewData.message = "No results";
    }

    try {
        let item = await storeService.getItemById(req.params.id);
        viewData.item = item;
    } catch (err) {
        viewData.message = "No results";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No results";
    }

    res.render("shop", viewData);
});

app.get("/items", ensureLogin, async (req, res) => {
    try {
        let items = await storeService.getAllItems();
        res.render("items", { items });
    } catch (err) {
        res.status(500).render("items", { message: "no results", error: err });
    }
});

app.get("/items/add", ensureLogin, (req, res) => {
    res.render("add-item");
});

app.post("/items/add", ensureLogin, upload.single("itemImage"), async (req, res) => {
    let itemData = req.body;
    let itemImage = req.file;

    try {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        let uploadResult = await streamUpload(req);
        itemData.itemImage = uploadResult.secure_url;

        let newItem = await storeService.addItem(itemData);
        res.redirect("/items");
    } catch (err) {
        res.status(500).render("add-item", { message: "Error adding item", error: err });
    }
});

app.get("/items/delete/:id", ensureLogin, async (req, res) => {
    try {
        let itemId = req.params.id;
        await storeService.deleteItem(itemId);
        res.redirect("/items");
    } catch (err) {
        res.status(500).render("items", { message: "Error deleting item", error: err });
    }
});

app.get('/categories', ensureLogin, async (req, res) => {
    try {
        let categories = await storeService.getCategories();
        res.render('categories', { categories });
    } catch (err) {
        res.render('categories', { message: 'Categories not available' });
    }
});

app.get('/category/:id', ensureLogin, (req, res) => {
    const categoryId = req.params.id;
    const items = getItemByCategory(categoryId);
    res.render('categories', { items, categoryId });
});

app.get('/addcategories', ensureLogin,  (req, res) => {
    res.render('addcategories');
});

app.post('/addcategories', ensureLogin, (req, res) => {
    const categoryData = {
        categoryName: req.body.categoryName || 'Default Category Name'
    };

    console.log('Received Category Data:', categoryData);

    if (!categoryData.categoryName || categoryData.categoryName.trim() === '') {
        res.status(400).send('Category Name is required.');
        return;
    }

    storeService.addCategory(categoryData)
        .then(() => {
            res.redirect('/categories');
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error adding category');
        });
});


app.get('/categories/delete/:id', ensureLogin,  async (req, res) => {
    try {
        await storeService.deleteCategoryById(req.params.id);
        res.redirect('/categories');
    } catch (err) {
        res.status(500).send('Unable to Remove Category / Category not found');
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (username === authData.username && password === authData.password) {
        req.session.user = {
            username: username
        };
        res.redirect("/shop");
    } else {
        res.render("login", { message: "Invalid username or password" });
    }
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    let userData = req.body;
    
    try {
        await authData.RegisterUser(userData);
        res.render('register', { successMessage: "User created" });
    } catch (err) {
        res.render('register', { errorMessage: err.message, userName: userData.userName });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.listen(HTTP_PORT, () => {
    console.log(`Server is running on port ${HTTP_PORT}`);
});