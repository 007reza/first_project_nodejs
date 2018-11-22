const validator=require('validator');

const {mongoose}= require('./../db/mongoose');


let UserSchema= new mongoose.Schema({
    fullName:{
        type:String,
        required:true,
        minlength:3,
        trim: true
    },
    email:{
        type:String,
        trim:true,
        required:true,
        minlength:6,
        unique:true,
        validate:{
            validator:validator.isEmail,
            messsage: '{value} is not valid email'
        }
    },
    password:{
        type:String,
        minlength:6,
        required:true
    }
});
let User=mongoose.model('User',UserSchema);

module.exports={
    User
};