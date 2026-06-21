import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Project from "../models/Project.js";

const newProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const { name, baseUrl, description, authToken } = req.body;
  if (
    !name ||
    !baseUrl ||
    typeof name !== "string" ||
    typeof baseUrl !== "string" ||
    name.trim() === "" ||
    baseUrl.trim() === ""
  ) {
    throw new ApiError(
      400,
      "Name and Base URL are required and must be valid text",
    );
  }
  // Check that any Project with similar name exists for that User or not
  const existingProject = await Project.findOne({
    userId: userId,
    name: name,
  });
  if (existingProject) {
    throw new ApiError(
      409,
      "Project with this already exists for You, Please Choose a new Name",
    );
  }
  try {
    let des = "";
    let authTokenused = "";
    if (description) {
      des = description;
    }
    if (authToken) {
      authTokenused = authToken;
    }

    const newProject = await Project.create({
      userId: userId,
      name: name,
      description: des,
      baseUrl: baseUrl,
      authToken: authTokenused,
    });
    const createdProject = await Project.findOne(newProject._id).select(
      "-authToken",
    );
    if (!createdProject) {
      throw new ApiError(
        500,
        "Something Went Wrong While Creating the New Projectee",
      );
    }
    // if all good
    return res
      .status(201)
      .json(new ApiResponse(201, createdProject, "Project Added Succesfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went Wrong while Creating a new Projectssssssss",
    );
  }
});

// To List all the Projects
const listAllProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    userId: req.user._id,
    isArchived: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

// TO Fetch A single Project Detail
const fetchProjectDetail = asyncHandler(async (req,res)=>{
  const {projectid} = req.params;
  if(!projectid){
    throw new ApiError(400,"Project Id is Required");
  }
  const project = await Project.findOne({
    _id : projectid,
    userId : req.user._id
  })
  if(!project){
    console.log("Project Does not Exists");
    throw new ApiError(404,"project does not exists");
  }
  return res
          .status(200)
          .json(new ApiResponse(200,project,"Project fetched Successfully"));
})

export { newProject, listAllProjects ,fetchProjectDetail};
