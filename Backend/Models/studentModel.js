const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    student_id:{
        type:Number,
        required:[true,"Student ID is required"],
        unique: [true,"Student ID is must be unique"]
    },
    
    name: {
        type:String,
        required:[true,"Name is required"]
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:[true,"Email must be unique"]
    },
    password: {
        type:String,
        required:[true,"Password is requred"]
    },
    college:{
        type:String,
        required:[true,"College is required"]
    },
    route:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Route"
    },
    walletBalance: {
        type: Number,
        default: 0
    }
},{
    timestamps:true

});

module.exports = mongoose.model("Student", studentSchema);
