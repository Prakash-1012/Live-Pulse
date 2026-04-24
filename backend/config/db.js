const mongoose = require("mongoose");

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_ATLAS_URI || process.env.ATLAS_URI || process.env.MONGODB_URI;

const connectDB = async () => {
  try{
    if (!mongoUri) {
      throw new Error("MONGO_URI is not configured. Set MONGO_URI or an Atlas URI environment variable.");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  }catch(err){
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;