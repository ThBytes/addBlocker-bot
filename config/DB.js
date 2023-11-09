const mongoose = require("mongoose");

module.exports.connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`Conncted to ${conn.connection.host}`);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
