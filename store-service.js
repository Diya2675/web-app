const { Sequelize, DataTypes } = require('sequelize');
const { Op } = Sequelize;

// Initialize Sequelize with actual database credentials
const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', '2P3qsabfGlOF', {
    host: 'ep-green-band-a5ckcaoz.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

// Define Category model
const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    categoryName: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false
});

// Define Item model
const Item = sequelize.define('Item', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    postDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    featureImage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    published: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    price: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    categoryID: {
        type: DataTypes.INTEGER,
        references: {
            model: Category,
            key: 'id'
        },
        allowNull: false
    }
}, {
    tableName: 'Items',
    timestamps: false
});

// Define relationships
Item.belongsTo(Category, { foreignKey: 'categoryID' });
Category.hasMany(Item, { foreignKey: 'categoryID' });

// Module exports functions
module.exports = {
    async initialize() {
        try {
            await sequelize.sync({ alter: true });
        } catch (err) {
            throw new Error("Unable to sync the database: " + err.message);
        }
    },

    async getAllItems() {
        try {
            const items = await Item.findAll();
            if (items.length > 0) {
                return items;
            } else {
                throw new Error("No results returned");
            }
        } catch (err) {
            throw new Error("Error retrieving items: " + err.message);
        }
    },

    async getItemsByCategory(categoryID) {
        try {
            const items = await Item.findAll({ where: { categoryID } });
            if (items.length > 0) {
                return items;
            } else {
                throw new Error("No results returned");
            }
        } catch (err) {
            throw new Error("Error retrieving items by category: " + err.message);
        }
    },

    async getItemsByMinDate(minDateStr) {
        try {
            const { gte } = Op;
            const items = await Item.findAll({
                where: {
                    postDate: {
                        [gte]: new Date(minDateStr)
                    }
                }
            });
            if (items.length > 0) {
                return items;
            } else {
                throw new Error("No results returned");
            }
        } catch (err) {
            throw new Error("Error retrieving items by date: " + err.message);
        }
    },

    async getItemById(id) {
        try {
            const item = await Item.findOne({ where: { id } });
            if (item) {
                return item;
            } else {
                throw new Error("No results returned");
            }
        } catch (err) {
            throw new Error("Error retrieving item by id: " + err.message);
        }
    },

    async addItem(itemData) {
        itemData.published = itemData.published ? true : false;
        for (let key in itemData) {
            if (itemData[key] === "") {
                itemData[key] = null;
            }
        }
        itemData.postDate = new Date();

        try {
            await Item.create(itemData);
        } catch (err) {
            throw new Error("Unable to create item: " + err.message);
        }
    },

    async getPublishedItems() {
        try {
            const items = await Item.findAll({ where: { published: true } });
            if (items.length > 0) {
                return items;
            } else {
                throw new Error("No results returned");
            }
        } catch (err) {
            throw new Error("Error retrieving published items: " + err.message);
        }
    },

    async getPublishedItemsByCategory(categoryID) {
        try {
            const items = await Item.findAll({
                where: {
                    published: true,
                    categoryID
                }
            });
            if (items.length > 0) {
                return items;
            } else {
                throw new Error("No results returned");
            }
        } catch (err) {
            throw new Error("Error retrieving published items by category: " + err.message);
        }
    },

    async getCategories() {
        try {
            const categories = await Category.findAll();
            if (categories.length > 0) {
                return categories;
            } else {
                throw new Error("No results returned");
            }
        } catch (err) {
            throw new Error("Error retrieving categories: " + err.message);
        }
    },

    async addCategory(categoryData) {
        for (let key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }

        try {
            await Category.create(categoryData);
        } catch (err) {
            throw new Error("Unable to create category: " + err.message);
        }
    },

    async deleteCategoryById(id) {
        try {
            const rowsDeleted = await Category.destroy({ where: { id } });
            if (rowsDeleted > 0) {
                return;
            } else {
                throw new Error("No category found with the given id");
            }
        } catch (err) {
            throw new Error("Error deleting category: " + err.message);
        }
    },

    async deleteItemById(id) {
        try {
            const rowsDeleted = await Item.destroy({ where: { id } });
            if (rowsDeleted > 0) {
                return;
            } else {
                throw new Error("No item found with the given id");
            }
        } catch (err) {
            throw new Error("Error deleting item: " + err.message);
        }
    }
};
