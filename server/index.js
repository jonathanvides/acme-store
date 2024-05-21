const express = require("express");
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

const {
    client,
    createTables,
    createUser,
    createProduct,
    fetchUsers,
    fetchProducts,
    createFavorite,
    fetchFavorites,
    deleteFavorite,
} = require("./db");

app.get("/api/users", async (req, res, next) => {
    try {
        res.send(await fetchUsers());
    } catch (ex) {
        next(ex);
    }
});

app.get("/api/products", async (req, res, next) => {
    try {
        res.send(await fetchProducts());
    } catch (ex) {
        next(ex);
    }
});

app.get("/api/users/:id/favorites", async (req, res, next) => {
    try {
        res.send(await fetchFavorites(req.params.id));
    } catch (ex) {
        next(ex);
    }
});

app.delete("/api/users/:userId/favorites/:id", async (req, res, next) => {
    try {
        await deleteFavorite({
            id: req.params.id,
            user_id: req.params.userId
        });
        res.sendStatus(204);
    } catch (ex) {
        next(ex);
    }
});

app.post("/api/users/:id/favorites", async (req, res, next) => {
    try {
        res.status(201).send(
            await createFavorite({
                user_id: req.params.id,
                product_id: req.body.product_id,
            })
        );
    } catch (ex) {
        next(ex);
    }
});

const init = async () => {
    await client.connect();
    console.log("connected");

    await createTables();
    console.log("tables created");

    const [jerry, max, donald, macbook, iphone, playstation, xbox] = await Promise.all([
        createUser({ username: 'jerry', password: 'jerry' }),
        createUser({ username: 'max', password: 'max' }),
        createUser({ username: 'donald', password: 'donald' }),
        createProduct({ name: 'macbook' }),
        createProduct({ name: 'iphone' }),
        createProduct({ name: 'playstation' }),
        createProduct({ name: 'xbox' }),
    ]);
    const users = await fetchUsers();
    console.log(users);

    const products = await fetchProducts();
    console.log(products);

    const favorites = await Promise.all([
        createFavorite({ user_id: jerry.id, product_id: macbook.id }),
        createFavorite({ user_id: jerry.id, product_id: iphone.id }),
        createFavorite({ user_id: donald.id, product_id: xbox.id }),
        createFavorite({ user_id: max.id, product_id: playstation.id }),
    ]);

    console.log(await fetchFavorites(jerry.id));
    await deleteFavorite(favorites[0].id);
    console.log(await fetchFavorites(jerry.id));

    console.log('data seeded');

    app.listen(port, () => console.log(`listening on port ${port}`));
};

init();