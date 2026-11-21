const { pool } = require('../config/db');

// shortcut: serializa todas las escrituras de agenda; cambia a locks por recurso si el volumen de una sede supera este throughput.
const withAgendaTransaction = async (operation, connectionPool = pool) => {
    const connection = await connectionPool.getConnection();
    let transactionStarted = false;
    let lockAcquired = false;
    try {
        const [lock] = await connection.query("SELECT GET_LOCK('futuro:agenda', 15) AS acquired");
        if (lock[0].acquired !== 1) throw Object.assign(new Error('La agenda está ocupada. Intente nuevamente.'), { status: 409 });
        lockAcquired = true;
        await connection.beginTransaction();
        transactionStarted = true;
        const result = await operation(connection);
        await connection.commit();
        transactionStarted = false;
        return result;
    } catch (error) {
        if (transactionStarted) await connection.rollback();
        throw error;
    } finally {
        try {
            if (lockAcquired) await connection.query("SELECT RELEASE_LOCK('futuro:agenda')");
        } finally {
            connection.release();
        }
    }
};

module.exports = { withAgendaTransaction };
