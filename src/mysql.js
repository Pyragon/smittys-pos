const mysql = require('mysql');

const _mysql = (function (props) {

    let pool;

    const DEFAULT = {
        toSqlString: () => 'DEFAULT'
    };

    function executeQuery(query, params) {
        return new Promise((resolve, reject) => {
            try {
                pool.getConnection((err, con) => {
                    if (err) {
                        reject(err);
                        return false;
                    }
                    let results = con.query(query, setParams(params), (err, results, fields) => {
                        con.release();
                        if (err) {
                            reject(err);
                            return false;
                        }
                        resolve(results.insertId);
                    });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    function selectQuery(query, params) {
        return new Promise((resolve, reject) => {
            try {
                pool.getConnection((err, con) => {
                    if (err) {
                        reject('Unable to get pool connection.' + err);
                        return false;
                    }
                    let results = con.query(query, setParams(params), (err, results, fields) => {
                        con.release();
                        if (err) {
                            reject(err);
                            return false;
                        }
                        if (!results || results.length == 0) {
                            reject('No results');
                            return false;
                        }
                        resolve(results);
                    });
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    function setParams(params) {
        if (!params) return params;
        return params.map(p => p === 'DEFAULT' ? DEFAULT : p);
    }

    return {

        start: function () {
            pool = mysql.createPool({
                connectionLimit: props.get('con-limit'),
                host: props.get('db-host'),
                user: props.get('db-user'),
                password: props.get('db-pass'),
                database: props.get('db')
            });

        },

        select: function (table, clause, order, params, toTake) {
            let query = `SELECT ${toTake ? toTake.join(', ') : '*'} FROM ${table} ${clause || ''} ${order || ''}`;
            return selectQuery(query, params);
        },

        insert: function (table, params) {
            let query = `INSERT INTO ${table} VALUES(${params.slice(0).map(p => '?').join(', ')});`;
            return executeQuery(query, params);
        },

        set: function (table, update, clause, params) {
            let query = `UPDATE ${table} SET ${update} WHERE ${clause};`;
            return executeQuery(query, params);
        }

    };

});
module.exports = _mysql;