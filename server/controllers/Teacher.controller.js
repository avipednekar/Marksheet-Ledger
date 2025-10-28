import Teacher from "../models/Teacher/Teacher.model.js";

const registerTeacher = async (req,res)=>{
    const {fullName, email, password, department}=req.body;

    
    if(fullName===""){
        res.status(401).json({
            message:"Fullname required"
        })
    }
    if(email===""){
        res.status(401).json({
            message:"email required"
        })
    }
    if(department===""){
        res.status(401).json({
            message:"department required"
        })
    }
    if(password===""){
        res.status(401).json({
            message:"password required"
        })
    }

    const existedTeacher=await Teacher.findOne({
        email
    })

    if(existedTeacher){
        res.status(401).json({
            message:"teacher already exist"
        })
    }

    const teacher=await Teacher.create({
        fullName,
        email,
        department,
        password
    });

    const createdTeacher=await Teacher.findById(teacher._id).select(
        "-password -refreshToken"
    )

    if(!createdTeacher){
        res.status(401).json({
            message:"TEacher not created"
        })
    }

    return res.status(201).json(
        {message:"Register successfully"}
    )
}

export {registerTeacher};