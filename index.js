const app = require('express')();
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./queries');
const port = 2999;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Epxress, and Postgres API'})
});
const main = ['users','posts','comments'];
const mainLikes = main.concat(['likes']);
mainLikes.forEach(a=>{
    app.get(`/${a}`, db.get(a))
    app.post(`/${a}`,db.post(a))
});
main.forEach(a=>{
    app.get(`/comments/${a}/:id`, db.getJoin('comments',a));
    app.post(`/comments/${a}/:id`, db.post('comments', a));
    if(a!='users')app.get(`/user/:userid/${a}`, db.getWhere(a,{userid:null}))
});
mainLikes.forEach(a=>{
    app.get(`/${a}/:id`, db.get(a));
    app.put(`/${a}/:id`, db.put(a));
    app.post(`/${a}/:id`, db.post(a));
    app.delete(`/${a}/:id`, db.delete(a));
})
main.forEach(a=>{
    app.get(`/likes/${a}`, db.get(`likes${a}`));
    app.post(`/likes/${a}/:id`, db.post('likes', a));
    app.get(`/likes/${a}/:id`, db.getJoin('likes',a));
});

app.get('/userWithEmail/:email', db.getWhere('users',{email:null}))
app.get('/user/:userid/feed/:a/:id/:b/:trend/:page', db.getFeedForUser);
app.get('/user/:userid/feed/:a/:id/:b/:trend/', db.getFeedForUser);
app.get('/user/:userid/feed/:a/:id/:b', db.getFeedForUser);
app.get('/user/:userid/feed/:type/:page', db.getFeedForUser);
app.get('/user/:userid/feed/:type', db.getFeedForUser);
app.get('/user/:userid/feed', db.getFeedForUser);
app.get('/feed/:type/:trend', db.getFeed);
app.get('/feed/:type/:trend', db.getFeed);
app.get('/feed/:type', db.getFeed);
app.get('/feed', db.getFeed);
app.get('/leaderboard/:type/:trend/:page', db.getLeaderboard);
app.get('/leaderboard/:type/:trend/', db.getLeaderboard);
app.get('/leaderboard/:type/', db.getLeaderboard);
app.get('/leaderboard', db.getLeaderboard);
// app.get('/users',db.get('users'));
// app.get('/posts',db.get('users'));
app.listen(port,()=>console.log('hi'));