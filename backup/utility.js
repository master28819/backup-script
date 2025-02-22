async function getAllTables(conn) {

    return new Promise(
        async (resolve, reject) => {

            await conn.query(
                `
                 select table_name 
                 from information_schema.tables
                 where table_schema = 'public'
                `,
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    rows = result.rows;
                    resolve(rows);
                }
            );

        }
    );

}

async function getFieldsOfTables(conn, table) {

    return new Promise(
        async (resolve, reject) => {

            await conn.query(
                `
                 select column_name 
                 from information_schema.columns
                 where table_name = '${table}'
                `,
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(result.rows);
                }
            );

        }
    );

}

async function getRecordsOfTable(conn, table) {

    return new Promise(
        async (resolve, reject) => {

            conn.query(
                `select * from ${table}`,
                (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(result.rows);
                }
            );

        }
    );

}

module.exports = { getAllTables, getFieldsOfTables, getRecordsOfTable };
