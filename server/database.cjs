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

const url = `${dbConfig.protocol}${dbConfig.username}:${dbConfig.password}@${dbConfig.url}/?${dbConfig.queryParams}`;

module.exports.connUrl = url;
module.exports.dbName = 'puzzly';
module.exports.default = new MongoClient(url);
