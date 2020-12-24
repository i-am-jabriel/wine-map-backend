const Pool =  require('pg').Pool;
const pool = new Pool({
    user:'postgres',
    host:'hyperfocus.cvfpf4e1t0yy.us-east-1.rds.amazonaws.com',
    database:'CorkTaint',
    password:'zMrdkenTGxPOQwlcN3MO',
});

const logError = () => console.warn(...arguments);

exports.get = (...names) => (req, res) =>{
    let q=`select * from ${names.join(',')}`;
    console.log(q);
    pool.query(q,(error, results) =>{
        if(error)logError(error);
        res.status(200).json(results?.rows||[]);
    });
}

exports.getWhere = (names, conds) => (req, res) =>{
    if(!Array.isArray(names))names=[names];
    let q = `select * from ${names.join(',')} where ${Object.keys(conds).map(a=>`${a} = ${encode(conds[a]||req.params[a])}`).join(' and ')}`;
    pool.query(q,(error, results) =>{
        if(error)logError(error);
        res.status(200).json(results?.rows||[]);
    });
}

exports.getJoin = (a,b) => (req,res)=>{
    // console.log(`select * from ${b} right outer join ${a}${b} on ${b}.id = ${a}${b}.parentid inner join ${a} on ${a}${b}.childid = ${a}.id`);
    //TEFEE!
    var q=`SELECT * FROM ${b} inner JOIN ${a}${b} ON ${b}.id = ${a}${b}.parentid ${a!=b?`inner JOIN ${a} ON ${a}.id = ${a}${b}.childid WHERE `:`AND `}${b}.id = ${req.params.id}`;

    if(a==b)q=`select * from ${a}${a} aa inner join ${a} a on aa.childid = a.id where aa.parentid = ${req.params.id}`;

    // console.log(`SELECT * FROM ${b} inner JOIN ${a}${b} ON ${b}.id = ${a}${b}.parentid inner JOIN ${a} ON ${a}.id = ${a}${b}.childid WHERE ${b}.id = ${req.params.id}`)
     pool.query(q, (error, results) => {
    //pool.query(`select * from ${b} inner join ${a}${b} on ${a}.id = ${a}${b}.childid ${a!=b?`inner JOIN ${a} ON ${a}.id = ${a}${b}.parentid WHERE `:`AND `}${b}.id = ${req.params.id}`, (error, results) => {
    // pool.query(`select * from `)
        if(error)logError(error); 
        res.status(200).json(results?.rows||[]);
    });
}

// insert into comments(userId, body) values(1,array['filling the database']);
// insert into commentsPosts(parentId, childId) values(2,currval('comments_id_seq'));

//let query = `insert into ${a}(${keys.join(',')}) values(${vals.join(',')});${b?`insert into ${a}${b}(parentid,childid) values(${id},currval('${a}_id_seq'));`:null}`;
const encode = a =>{
    if(Array.isArray(a))return `array[${a.map(a=>encode(a)).join(",")}]`;
    if(typeof a == 'number'||a=='now()')return a;
    if(typeof a == 'string')return `'${a.replace(/'/g, "''")}'`;
    if(a.isJson || arguments.length>1){
        let k = Object.keys(a);
        let v = k.map(b=>encode(a[b],1));
        return `'{${k.map((b,i)=>`"${b}":${v[i]}`).join(',')}}'`;
    }
    return a;
}

exports.post = (a, b) => (req,res) =>{
    let obj = req.body;
    let id = req.params.id || obj.parentid || obj.id;
    let keys = Object.keys(obj);
    let vals = keys.map(a=>encode(obj[a]));
    let query = `insert into ${a}(${keys.join(',')}) values(${vals.join(',')});${b?`insert into ${a}${b}(parentid,childid) values(${id},currval('${a}_id_seq'));`:''}`;
    pool.query(query, e => {
        if(e)console.log(query);
        if(e)logError(e);
        pool.query(query=`select * from ${a} order by id desc fetch next row only`, (e,results) => {
            if(e)console.log(query);
            if(e)logError(e);
            res.status(200).json(results?.rows||[]);
        });
    });
}

exports.delete = (a) => (req,res) =>{
    let id = req.params.id || obj.parentid || obj.id;
    let q = `delete from ${a} where id=${id}`;
    pool.query(q,e=>{
        if(e)logError(q,e);
        res.status(200).json({response:true});
    });
    //let q2 = `delete from ${a}${b} where  `
}

exports.put = a => (req,res) =>{
    let id = req.params.id || obj.parentid || obj.id;
    let obj = req.body;
    let keys = Object.keys(obj);
    let vals = keys.map(b=>encode(obj[b]));
    let q = `update ${a} set ${keys.map((k,i)=>`${k}=${vals[i]}`).join(',')} where id=${id}`;
    pool.query(q,e=>{
        if(e)logError(q,e);
        res.status(200).json({response:true})
    })
}

exports.getFeed = (req,res) => {
    let type = req.params.type || 'posts';
    let trend = req.params.trend || 'day';
    let page = req.params.page || 1;
    let q = `select * from ${type} order by trend->>'${trend}' desc offset ${page-1} fetch next 5 row only`;
    console.log(q);
    pool.query(q,(e,r)=>{
        if(e)logError(q,e);
        res.status(200).json(r.rows);
    });
}
exports.getLeaderboard = (req,res)=>{
    req.params=Object.assign({type:'users',page:'1',trend:'week'},req.params);
    let {type,trend,page} = req.params;
    let q = `select id,  trend->>'${trend}' as score from ${type} order by trend->>'${trend}' desc offset ${page-1} fetch next 10 row only`;
    pool.query(q,(e,r)=>{
        if(e)logError(q,e);
        res.status(200).json(r.rows);
    })
}
exports.getCommentParent = (req, res) => {
    let q = `select parentid from commentscomments where childid=${req.params.id}`;
    pool.query(q,(e,r)=>{
        if(e && !console.log(q))logError(e);
        if(r&&r.rows.length==1)res.status(200).json(Object.assign(r.rows[0],{type:'comment'}));
        else{
            q=`select parentid from commentsposts where childid=${req.params.id}`;
            pool.query(q,(e,r)=>{
                if(e)logError(q,e);
                if(r&&r.rows.length==1)res.status(200).json(Object.assign(r.rows[0],{type:'post'}));
            })
        }
    });
}
exports.getFeedFromUser = (req, res)=>{
    req.params=Object.assign({type:'posts',trend:'recent',page:1},req.params);
    const {type,trend,page,id} = req.params;
    const o = trend == 'recent' ? 'postdate' : trend == 'all-time' ?  'score' :  `trend->>'${trend}'`;
    const q = `select id from ${type} where userid=${id} order by ${o} desc offset ${page-1} fetch next 10 row only`;
    pool.query(q,(e,r)=>{
        if(e)logError(q,e);
        res.status(200).json((r && r?.rows)||[]);
    });
}

exports.getFeedForUser = (req,res) => {
    req.params = Object.assign({trend:'day',page:'1',type:'posts'},req.params);
    const {a,b, trend, page, userid, id, type} = req.params;
    const o = trend == 'recent' ? 'postdate' : trend == 'all-time' ?  'score' :  `trend->>'${trend}'`;
    let q;
    if(type){
        q = `select id from ${type} order by ${o} desc offset ${page-1} fetch next 5 row only`;
    }else{
        q=`select id from ${b} b inner join ${a}${b} ab on b.id = ab.parentid inner join ${a} a ON a.id = ab.childid WHERE b.id = ${id} order by a.${o} desc offset ${page-1} fetch next 5 row only`;
        if(a==b)q=`select * from ${a}${a} aa inner join ${a} a on aa.childid = a.id where aa.parentid = ${id} order by ${o} desc offset ${page-1} fetch next 5 row only`;
    }
    pool.query(q,(e,r)=>{
        if(e)logError(q,e);
        res.status(200).json(r?.rows||[]);
    });
}
exports.getPostTree=(req,res)=>res.status(200).json({deadRoute:true})
//module.exports = {get, getWhere, getJoin };