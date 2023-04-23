const fns = require('date-fns');
const fsPromises = require('fs').promises;
const path = require('path');

const logEvents = async (msg, fileName) => {
    const date = `${fns.format(new Date(), 'MMMM dd yyyy, HH:mm:ss a')}`;
    const logItem = `${date}\t${msg}\n`;
    console.log(logItem);
    try {
        await fsPromises.appendFile(path.join(__dirname, 'logs', fileName), logItem);
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = logEvents;