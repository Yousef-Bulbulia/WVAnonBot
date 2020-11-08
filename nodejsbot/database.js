var sqlite = require('better-sqlite3');
var db = new sqlite('./dbfile');
var metadata = require('./metadata.js');

function getOrSetEncryptor(bufferIv) {
    // Can only have one encryptor value. Get an existing, or set and return passed
    var stmt = db.prepare('SELECT ivValue FROM encryptor')
    var row = stmt.get();
    if (row) {
        return Buffer.from(row.ivValue, 'hex');
    }
    stmt = db.prepare('INSERT INTO encryptor VALUES (?)');
    stmt.run(bufferIv.toString('hex'));
    return bufferIv;
}

function setChannelDestinations(colName, channelId) {
    var stmt = db.prepare('UPDATE channelDestinations SET ' + colName + ' = ' + channelId);
    stmt.run();
}

function getChannelDestination(colName) {
    var stmt = db.prepare('SELECT ' + colName + ' AS channelID FROM channelDestinations');
    return stmt.get().channelID;
}

function setConfigurationTimer(colName, seconds) {
    var stmt = db.prepare('UPDATE configuration SET ' + colName + ' = ' + seconds);
    stmt.run();
}

function getConfigurationTimer(colName) {
    var stmt = db.prepare('SELECT ' + colName + ' AS config FROM configuration');
    return stmt.get().config;
}

function setMessageBlocker(encryptedUser, reason, dateOfUnban) {
    stmt = db.prepare('INSERT INTO messageBlocker VALUES (?, ?, ?)');
    stmt.run(encryptedUser, reason, dateOfUnban);
}

function getMessageBlocker(encryptedUser) {
    var stmt = db.prepare('SELECT reason, date FROM messageBlocker WHERE encryptedUserId = ?');
    return stmt.get(encryptedUser);
}

function deleteMessageBlocker(encryptedUser) {
    var stmt = db.prepare('DELETE FROM messageBlocker WHERE encryptedUserId = ?');
    stmt.run(encryptedUser);
}

module.exports = {
    getOrSetEncryptor,
    setChannelDestinations,
    getChannelDestination,
    setConfigurationTimer,
    getConfigurationTimer,
    setMessageBlocker,
    getMessageBlocker,
    deleteMessageBlocker
}

// Initial setup
function initializeTables() {
    // Encryption storage for persistency of IDs
    var stmt = db.prepare('CREATE TABLE IF NOT EXISTS encryptor (ivValue TEXT)');
    stmt.run();

    // Channel storage
    stmt = db.prepare(
        'CREATE TABLE IF NOT EXISTS channelDestinations ('
        + Object.values(metadata.channels).join(' TEXT, ')
        + ' TEXT)');
    stmt.run();
    stmt = db.prepare('INSERT INTO channelDestinations VALUES (\'\', \'\', \'\')');
    stmt.run();

    // Configuration settings
    stmt = db.prepare(
        'CREATE TABLE IF NOT EXISTS configuration ('
        + Object.values(metadata.configuration).join(' INTEGER, ')
        + ' TEXT)');
    stmt.run();
    stmt = db.prepare('INSERT INTO configuration VALUES (0, 0)');
    stmt.run();

    // Message blockers
    stmt = db.prepare('CREATE TABLE IF NOT EXISTS messageBlocker (encryptedUserId TEXT, reason TEXT, date TEXT)');
    stmt.run();
}

initializeTables();