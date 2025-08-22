import { errorHandler } from "../middleware/errorHandler.js";
import Teacher from "../models/Teacher/Teacher.model.js";

const registerTeacher = errorHandler(async (req,res)=>{
    const {fullName, email, password, department}=req.body;


    if(fullName===""){
        throw new ApiError(400,"Fullname is required")
    }
    if(email===""){
        throw new ApiError(400,"Email is required")
    }
    if(department===""){
        throw new ApiError(400,"department is required")
    }
    if(password===""){
        throw new ApiError(400,"password is required")
    }

    const existedTeacher=await Teacher.findOne({
        $or:[{email}]
    })

    if(existedTeacher){
        throw new ApiError(409,"email already exists")
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
        throw new ApiError(500,"Something went wrong while registrating teacher")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"Registration successfully")
    )
})

export {registerTeacher};