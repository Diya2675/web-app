/*********************************************************************************
WEB322 – Assignment 05
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
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

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

hbs.handlebars.registerHelper('formatDate', function(dateObj) {
    let year = dateObj.getFullYear();
    let month = (dateObj.getMonth() + 1).toString();
    let day = dateObj.getDate().toString();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
});

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',  
    defaultLayout: 'main',  
}));
app.set('view engine', '.hbs');

// Middleware
app.use(express.urlencoded({ extended: true }));

// Prof's code
app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

// Redirect to /shop instead of /about
app.get("/", (req, res) => {
    res.redirect("/shop");
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get("/shop", async (req, res) => {
    let viewData = {};
    try {
        // Fetch items
        let items = await storeService.getAllItems();

        // Check if category query parameter exists
        const category = req.query.category;

        if (category) {
            // Filter items by category
            items = items.filter(item => item.category === parseInt(category));
        }

        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        viewData.items = items;
        viewData.item = items.length > 0 ? items[0] : null; // Pass the first item as the current item or null if no items found
        viewData.viewingCategory = category;
    } catch (err) {
        viewData.message = "No results for items.";
    }

    try {
        // Fetch categories
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
        let items = [];
        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }
        items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
        viewData.items = items;
    } catch (err) {
        viewData.message = "No results";
    }
    try {
        viewData.item = await storeService.getItemById(req.params.id);
    } catch (err) {
        viewData.message = "No results"; 
    }
    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No results";
    }
    res.render("shop", { data: viewData });
});

app.get("/items", async (req, res) => {
    try {
        let items = await storeService.getAllItems();
        res.render("items", { items });
    } catch (err) {
        res.status(500).render("items", { message: "no items available", error: err });
    }
});

app.get('/items/:itemId', async (req, res) => {
    const itemId = req.params.itemId;
    try {
        const item = await storeService.getItem(itemId);
        res.render('items', { items });
    } catch (err) {
        res.render('items', { message: 'Items not found' });
    }
});

app.get('/categories', async (req, res) => {
    try {
        let categories = await storeService.getCategories();
        res.render('categories', { categories });
    } catch (err) {
        res.render('categories', { message: 'Categories not available' });
    }
});

app.get('/category/:id', (req, res) => {
    const categoryId = req.params.id;
    const items = getItemByCategory(categoryId);
    res.render('category', { items, categoryId });
});

app.get('/additem', (req, res) => {
    res.render('additem'); // Ensure this matches your view file name
});

app.post('/additem', upload.single('featureImage'), async (req, res) => {
    console.log('req.body:', req.body);
    const processItem = async (imageUrl) => {
        req.body.featureImage = imageUrl;
        const itemData = {
            item_name: req.body.item_name,
            description: req.body.description,
            postDate: new Date(),
            featureImage: req.body.featureImage,
            published: req.body.published,
            price: req.body.price,
            categoryID: req.body.categoryID
        };
        console.log('itemData:', itemData);

        try {
            const result = await storeService.addItem(itemData);
            console.log('addItem result:', result);
            if (result) {
                res.redirect('/items');
            } else {
                res.status(500).send('Failed to add item');
            }
        } catch (err) {
            console.error('Error adding item:', err);
            res.status(500).send('Failed to add item: ' + err.message);
        }
    };

    if (req.file) {
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

        try {
            const uploadResult = await streamUpload(req);
            await processItem(uploadResult.url);
        } catch (error) {
            console.error('Error uploading image:', error);
            res.status(500).send('Failed to upload image: ' + error.message);
        }
    } else {
        await processItem("");
    }
});
// Route to display the form
app.get('/addcategories', (req, res) => {
    res.render('addcategories');
});

// Route to handle form submission
// app.post('/addcategories', async (req, res) => {
//     const categoryData = {
//         categoryName: req.body.categoryName || 'Default Category Name'
//     };

//     console.log('Received Category Data:', categoryData);

//     if (!categoryData.categoryName || categoryData.categoryName.trim() === '') {
//         res.status(400).send('Category Name is required.');
//         return;
//     }

//     try {
//         await storeService.addCategory(categoryData);
//         res.redirect('/categories');
//     } catch (err) {
//         console.error('Failed to add category:', err.message);
//         res.status(500).send('Failed to add category: ' + err.message);
//     }
// });

app.post('/addcategories', (req, res) => {
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


app.get('/categories/delete/:id', async (req, res) => {
    try {
        await storeService.deleteCategoryById(req.params.id);
        res.redirect('/categories');
    } catch (err) {
        res.status(500).send('Unable to Remove Category / Category not found');
    }
});

app.get('/items/delete/:id', async (req, res) => {
    try {
        await storeService.deleteItemById(req.params.id);
        res.redirect('/items');
    } catch (err) {
        res.status(500).send('Unable to Remove Item / Item not found');
    }
});

app.use((req, res) => {
    res.status(404).render('404');
});

app.listen(HTTP_PORT, () => {
    console.log(`Server is listening on port ${HTTP_PORT}`);
});
