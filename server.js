/*********************************************************************************
WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
No part of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.
Name: Diya Keyur Acharya
Student ID: 162776223
Date: 18th July
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

app.set('views', path.join(__dirname, 'views'));

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',  
    defaultLayout: 'main',  
}));
app.set('view engine', '.hbs');  

app.use(express.static("public"));

// Prof's code
app.use(function(req,res,next){
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
    // Declare an object to store properties for the view
    let viewData = {};
      try{
          // declare empty array to hold "item" objects
        let items = [];
          // if there's a "category" query, filter the returned items by category
        if(req.query.category){
            // Obtain the published "items" by category
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        }else{
            // Obtain the published "items"
            items = await itemData.getPublishedItems();
        }
          // sort the published items by itemDate
        items.sort((a,b) => new Date(b.itemDate) - new Date(a.itemDate));
          // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
  
    }catch(err){
        viewData.message = "no results";
    }
      try{
        // Obtain the item by "id"
        viewData.item = await itemData.getItemById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }
      try{
        // Obtain the full list of "categories"
        let categories = await itemData.getCategories();
          // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", {data: viewData})
  });

app.get("/items", async (req, res) => {
    try {
        let items = await storeService.getAllItems();
        res.render("items", { items });
    } catch (err) {
        res.status(500).render("items", { message: "no results", error: err });
    }
});


app.get('/items/:itemId', async (req, res) => {
    const itemId = req.params.itemId;
    try {
      const item = await storeService.getItem(itemId);
      res.render('item', { item });
    } catch (err) {
      res.render('item', { message: 'Item not found' });
    }
  });

app.get('/categories', async (req, res) => {
    try {
        let categories = await storeService.getCategories();
        res.render('categories', { categories });
    } catch (err) {
        res.render('categories', { message: 'Failed to fetch categories' });
    }
});

app.get('/category/:id', (req, res) => {
    const categoryId = req.params.id;
    const items = getItemByCategory(categoryId);
    res.render('category', { items, categoryId });
  });

app.get('/additem', (req, res) => {
    res.render('additem');
});

app.post('/additem', upload.single('featureImage'), async (req, res) => {
    const processItem = async (imageUrl) => {
        req.body.featureImage = imageUrl;
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
            await storeService.addItem(itemData);
            res.redirect('/items');
        } catch (err) {
            res.status(500).send('Failed to add item');
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
            res.status(500).send('Failed to upload image');
        }
    } else {
        await processItem("");
    }
});

app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Page Not Found' });
});

storeService.initialize().then(() => {
    app.listen(HTTP_PORT, () => {
        console.log(`Server listening on: http://localhost:${HTTP_PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize the data:', err);
});

module.exports = app;

