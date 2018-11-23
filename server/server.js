process.env.NODE_CONFIG_DIR=__dirname + '/config';

const config=require('config');
const express=require('express');
const _=require('lodash');

const {User}=require('./model/user');



console.log(`*** ${String(config.get('Level')).toUpperCase()} ***`);

let app=express();
app.use(express.json());

app.post('/api/users',(req,res)=>{
    const body=_.pick(req.body, ['fullname' ,'email' , 'password']);
    let user=new User(body);

    console.log(body);
    user.save().then(()=> {
            res.status(200).send(user);            
    },(err)=>{
        res.status(400).json({
            'ERROR' :`something went wrong ${err}`
        });
    })
});

app.listen(config.get('PORT'),()=>{
    console.log(`server is runing on port ${config.get('PORT')}`);
});