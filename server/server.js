process.env.NODE_CONFIG_DIR=__dirname + '/config';

const config=require('config');

const {User}=require('./model/user');
console.log(`*** ${String(config.get('Level')).toUpperCase()} ***`);

let newUser= new User({
    fullName:'reza mohammadkhan',
    email: 'ere@gmail.com',
    password: '123123'
});

newUser.save().then((user) =>{
console.log('User has been saved to the database',user);
});