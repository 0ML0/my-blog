import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';
import path from 'path'; //path included in standard node.js
//  type mongod and click enter; then open new terminal by clicking plus sign in 
// Visual Studio and make sure you are in my-blog-backend directory for that 2nd 
// terminal


const app = express();

// creating fake database whenever specific routes are hit and counting upvotes 
// to show relevant articles
// const articlesInfo = {
//     'AR-resources': {
//         upvotes: 0,
//         comments: [],
//     },
//     'AR-VR-Art': {
//         upvotes: 0,
//         comments: [],
//     },
// }
// Telling server where to serve static files from. 
app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());
// To upvote articles
// Getting data from database on computer

//let's start refactoring our code to make it look better
// need async since connecting to DB
const withDB = async (operations, res) => {
        // use try catch to send internal error message (500) if unable to reach server
        try {
            // const articleName = req.params.name;
            // using await because asynchronous
            // needed to pass {useUnifiedTopology: true} into MongoClient constructor
            // because the code is being updated and it must be included
            const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true, useUnifiedTopology: true});
            // We can query the database using the code below
            const db = client.db('my-blog');
            // Using operation function to eliminat three lines of code
            await operations(db); // needs await because operations function uses await/async
            // Using await because reading from the db is asynchronous
            // finding article in db that matches name from URL that was sent
            // const articleInfo = await db.collection('articles').findOne({ name: articleName});
            // // Send articleInfo in response
            // // We could use .send instead of .json, but json works better with json data here.
            // res.status(200).json(articleInfo);
            // Closes connection to the database
            client.close();
        } catch (error) {
            // error will have the error that occurred.
            res.status(500).json({message: 'Error connecting to db', error});
        }
}


app.get('/api/articles/:name', async (req,res) => {
    // since using await inside function in withDB need async
    withDB(async (db) => {
                // use try catch to send internal error message (500) if unable to reach server
                const articleName = req.params.name;
                // Using await because reading from the db is asynchronous
                // finding article in db that matches name from URL that was sent
                const articleInfo = await db.collection('articles').findOne({ name: articleName});
                // Send articleInfo in response
                // We could use .send instead of .json, but json works better with json data here.
                res.status(200).json(articleInfo);
    }, res);
})
app.post('/api/articles/:name/upvote', async (req,res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        // Query article db for article
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        // second parameter to updateOne is to update the upvotes for recommendation system
        await db.collection('articles').updateOne({name: articleName}, {
            '$set': {
                upvotes: articleInfo.upvotes + 1,
            },
        }); 
        // to get updated version of the article we just modified
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        // send updated article info back to the client
        res.status(200).json(updatedArticleInfo);
        // 2 lines below will have to be changed to work with the mongodb
        // articlesInfo[articleName].upvotes +=1;
        // res.status(200).send(`${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!`); 
    }, res);
});
// To add a comment to articles
app.post('/api/articles/:name/add-comment', (req,res) => {
    const {username, text} = req.body;
    const articleName = req.params.name;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({name: articleName});
        await db.collection('articles').updateOne({name: articleName}, {
            '$set': {
                comments: articleInfo.comments.concat({username, text}),
            },
        });
        // get updated version of article info
        const updatedArticleInfo = await db.collection('articles').findOne({name: articleName});
        // we want to send updated article info as a response
        res.status(200).json(updatedArticleInfo);
    }, res);
    // below 2 lines no longer work
    // articlesInfo[articleName].comments.push({username, text});
    // res.status(200).send(articlesInfo[articleName]);
});
// app.get('/hello',(req,res) => res.send('Hello!'));

// app.get('/hello/:name', (req,res) => res.send(`Hello ${req.params.name}`));
// // The below code will take the json object from the server and output the "name". 
// // This uses the post request in postman
// app.post('/hello',(req,res) => res.send(`Hello ${req.body.name}!`));
//the line below says that all other paths not caught by other lines will be passed onto app
// this allows client side app to navigate between pages and processes correctly.
app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname+'/build/index.html'));
});
app.listen(8000, () => console.log('Listening on port 8000'));