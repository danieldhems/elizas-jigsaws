const MongoClient = require("mongodb").MongoClient;

const dbConfig = {
    protocol: 'mongodb+srv://',
    url: 'cluster0.0t6gvus.mongodb.net',
    queryParams: 'retryWrites=true&w=majority&appName=Cluster0',
    username: 'danhems87',
    password: 'GCo4jTrojM01vhRr'
}

// const dbConfig = {
//     protocol: 'mongodb://',
//     url: 'localhost:27017',
//     queryParams: '',
//     username: 'admin',
//     password: 'admin'
// }

const dbUrl = `${dbConfig.protocol}${dbConfig.username}:${dbConfig.password}@${dbConfig.url}/?${dbConfig.queryParams}`;

module.exports.dbUrl = dbUrl;
module.exports.default = new MongoClient(dbUrl);
