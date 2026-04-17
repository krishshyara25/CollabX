const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const CalendarLog = require('./models/CalendarLog');

const testDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const logs = await CalendarLog.find({});
        console.log("Total Calendar Logs in DB:", logs.length);
        console.log("Logs:", logs);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testDB();
