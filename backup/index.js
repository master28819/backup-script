const http = require('http');
const fs = require('fs');
const pg = require('pg');
const dotenv = require('dotenv');
const utility = require('./utility');
dotenv.config();

const port = process.env.HOST ? process.env.PORT : 3000;
const host = process.env.HOST ? process.env.HOST : 'localhost';
const url = process.env.URL ? process.env.URL : `http://${host}:${port}`;

const src_pghost = process.env.SRC_PG_HOST ? process.env.SRC_PG_HOST : 'localhost';
const src_pgport = process.env.SRC_PG_PORT ? process.env.SRC_PG_PORT : 5432;
const src_pguser = process.env.SRC_PG_USERNAME ? process.env.SRC_PG_USERNAME : 'root';
const src_pgpass = process.env.SRC_PG_PASSWORD ? process.env.SRC_PG_PASSWORD : '';
const src_pgname = process.env.SRC_PG_DATABASE ? process.env.SRC_PG_DATABASE : 'tech';

const dst_pghost = process.env.DST_PG_HOST ? process.env.DST_PG_HOST : 'localhost';
const dst_pgport = process.env.DST_PG_PORT ? process.env.DST_PG_PORT : 5432;
const dst_pguser = process.env.DST_PG_USERNAME ? process.env.DST_PG_USERNAME : 'root';
const dst_pgpass = process.env.DST_PG_PASSWORD ? process.env.DST_PG_PASSWORD : '';
const dst_pgname = process.env.DST_PG_DATABASE ? process.env.DST_PG_DATABASE : 'tech';

const sourceConection = new pg.Client(
    {
        host: src_pghost,
        port: src_pgport,
        user: src_pguser,
        password: src_pgpass,
        database: src_pgname,
        ssl: {
            rejectUnauthorized: false
        }
    }
);

const destinationConnection = new pg.Client(
    {
        host: dst_pghost,
        port: dst_pgport,
        user: dst_pguser,
        password: dst_pgpass,
        database: dst_pgname,
        ssl: {
            rejectUnauthorized: false
        }
    }
);

const NO_DATA_FOUND = "Table does not have any data";

function jsonToDatatypeObject(json) {

    let type, data, returned = {};
    let datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

    json = JSON.parse(JSON.stringify(json));

    for (let field in json) {
        type = typeof json[field];
        data = json[field];

        if (json[field] === null) {
            type = "null";
            // data = null;
            // data = "null";
            data = "'{}'";
        } else if (json[field] === '') {
            type = "json";
            data = "''";
        } else if (type === "string") {
            if (!isNaN(json[field])) {
                data = Number(json[field]);
                type = typeof data;
            } else if (json[field] === "true" || json[field] === "false") {
                data = Boolean(json[field]);
                type = "boolean";
            } else if (datePattern.test(json[field])) {
                data = "'" + (new Date(json[field]).toISOString()) + "'";
                type = "date";
            } else {
                data = "'" + json[field] + "'";
                type = "string";
            }
        } else if (type === "object") {

            if (Array.isArray(json[field])) {
                data = Array(json[field])[0];
                type = "array";
            } else {
                data = "'" + JSON.stringify(json[field]) + "'";
                type = "object";
            }

        }

        returned[field] = data;

    }

    return returned;

}

/* console.log(jsonToDatatypeObject(
    {
        "authorid": "2",
        "bio": "i am krish",
        "createdat": "2024-12-03T18:30:00.000Z",
        "email": "vishal@gmai.com",
        "name": "krish",
        "password": "$2a$10$21rc2B4xU7hNlEFWQmY6RO24sXLXcONgyn8/zJN8uahBIOw.TXZBK",
        "profilepicture": "",
        "updatedat": "2024-12-03T18:30:00.000Z",
        "username": "vishal",
        "bloggerstatus": "active",
        "sociallinks": [{}],
        "age": '25',                   // Number (Integer)
        "rating": '4.5',               // Number (Float)
        "isActive": 'true',            // Boolean (True)
        "isVerified": 'false',         // Boolean (False)
        "profile": null,             // Null
        "uuid": "550e8400-e29b-41d4-a716-446655440000",  // UUID as String
        "binaryData": "SGVsbG8gV29ybGQ=",  // Base64 String
        "address": {                 // Nested Object
            "city": "New York",
            "zip": "10001"
        },
        "roles": ["admin", "editor"], // Array of Strings
        "scores": [95, 85, 75]       // Array of Numbers
    }
)); */

const server = http.createServer(
    async (request, response) => {

        let object = {
            'code': 404,
            'status': 'Not Found',
            'message': 'Unable to find requested resource'
        };

        try {

            let method = request.method;
            let route = request.url;

            if (method === "GET" && route === "/") {

                console.log(new Date());

                object['code'] = 200;
                object['status'] = 'OK';
                object['message'] = 'Being Alive';

                setTimeout(
                    async () => {
                        let data = await fetch(url);
                    }
                    , 14.5 * 60 * 60 * 1000);

            } else if (method === "GET" && route === "/backup") {

                object['code'] = 200;
                object['status'] = 'OK';
                object['message'] = 'Database Backup Created Successfully';

                let tables = await utility.getAllTables(sourceConection);

                // Way - 1 and 2 : creating a backup directory named using old server 's database
                if (!fs.existsSync("./" + src_pgname)) {
                    fs.mkdirSync("./" + src_pgname);
                }

                for (let table of tables) {

                    // Way - 2 : about initialize keywords
                    let content = "insert into " + table.table_name;
                    console.log(`Table : ${table.table_name}`);
                    let columns = await utility.getFieldsOfTables(sourceConection, table.table_name);

                    let fields = "(";
                    for (let column of columns) {
                        fields += column.column_name + ",";
                    }
                    fields = fields.substring(0, fields.length - 1) + ")";

                    // Way - 1 : adding fields name with a new line
                    await fs.writeFileSync(
                        "./" + src_pgname + "/" + table.table_name + ".txt",
                        fields + "\n\n"
                    );

                    // Way - 2 : about adding fields list and keywords
                    content = content + fields + " values \n";
                    // console.log(fields);

                    let records = await utility.getRecordsOfTable(sourceConection, table.table_name);

                    for (let record of records) {
                        let data = "(";
                        record = jsonToDatatypeObject(record);

                        for (let column of columns) {
                            data += record[column.column_name] + ",";
                        }
                        data = data.substring(0, data.length - 1) + ")";
                        // console.log(data);

                        // About Deleting all data of a query

                        // await destinationConnection.query(
                        //     "delete from " + table.table_name,
                        //     (err, result) => {
                        //         console.log(err ? err : 'Deleted Successfully');
                        //     }
                        // );


                        // Way - 1 : Each Query Per Record

                        console.log("\n\n");
                        console.log("insert into " + table.table_name + fields + " values" + data + ";");

                        // await destinationConnection.query(
                        //     "insert into " + table.table_name + fields + " values" + data + ";",
                        //     (err, result) => {
                        //         console.log(err ? err : result);
                        //     }
                        // );

                        // Way - 1 : adding each record with a new line

                        await fs.appendFileSync(
                            "./" + src_pgname + "/" + table.table_name + ".txt",
                            data + "\n"
                        );

                        // Way - 2 : about - line for adding a data
                        content = content + data + ",";

                    }
                    // Way - 1 : Printing status
                    console.log(records.length === 0 ? `\n\nTable ${table.table_name} doesn't have any records\n\n` : '');

                    // Way - 1 : appending about this table doesn't have any data.

                    if (records.length === 0) {
                        await fs.appendFileSync(
                            "./" + src_pgname + "/" + table.table_name + ".txt",
                            NO_DATA_FOUND
                        );
                    }

                    // Way - 2 : All Data Together

                    // if (records.length === 0) {
                    //     console.log(`\nTable ${table.table_name} doesn't have any records\n`);
                    // } else {

                    //     content = content.substring(0, content.length - 1) + ";";

                    //     destinationConnection.query(
                    //         content, (err, result) => {
                    //             console.log(err ?
                    //                 `${table.table_name} has some errors `//${err}`
                    //                 : 'Success');
                    //         }
                    //     );

                    //     console.log(`\n${content}`);
                    // }

                }


            } else if (method === "POST" && route === "/backup") {

                object['code'] = 201;
                object['status'] = 'Created';
                object['message'] = 'Database Backup Transfered Successfully';

                let tables = await fs.readdirSync(
                    "./" + src_pgname + "/"
                );

                for (let table of tables) {

                    try {

                        console.log(`\n\nTable : ${table.replace(".txt", "")} \n`);
                        let data = await fs.readFileSync("./" + src_pgname + "/" + table, 'utf-8');

                        if (data.includes(NO_DATA_FOUND)) {
                            console.log(`Table ${table.replace(".txt", "")} doesn't have any data`);
                            // console.log(NO_DATA_FOUND);
                        } else {

                            let content = "";
                            let fields = data.split("\n\n")[0];
                            data = data.split("\n\n")[1];
                            let records = data.split("\n");


                            for (let record of records) {
                                // for removing last extra line
                                if (record !== "") {
                                    content += record + ",\n";
                                }
                            }

                            // 1 for a line and 2 nd for last comma
                            content = content.substring(0, content.length - 2) + ";";
                            console.log("insert into " + table.replace(".txt", "") + fields + " values \n" + content);

                            destinationConnection.query(
                                "insert into " + table.replace(".txt", "") + fields + " values \n" + content,
                                (err, result) => {
                                    console.log(err ? `Table ${table.replace(".txt", "")} has some issues` : `Table ${table.replace(".txt", "")} backup converted successfully`);
                                }
                            );

                        }

                    } catch (err) {
                        console.log(`Error reading file ${table}`);
                    }

                }

            }


        } catch (err) {

            object['code'] = 500;
            object['status'] = 'Internal Server Error';
            object['message'] = 'Server is unable to respond';

            showError(err);

        } finally {
            response.writeHead(object['code'], { 'Content-Type': 'application/json' });
            response.end(JSON.stringify(object));
        }

    }
);

function showError(err) {
    console.log(`Error : ${err}`);
}

server.listen(
    port, () => {
        sourceConection.connect();
        destinationConnection.connect();
        console.log(`Server listening on ${host}:${port}`);
        console.log(`Server connected with ${src_pghost}:${src_pgport}`);
    }
);
