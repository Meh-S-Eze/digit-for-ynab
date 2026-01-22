import { Surreal } from 'surrealdb';

const db = new Surreal();

const connectDB = async () => {
    try {
        console.log('🔗 Connecting to SurrealDB:', process.env.SURREAL_URL);
        console.log('👤 User:', process.env.SURREAL_USER);
        console.log('📂 Scope:', {
            ns: process.env.SURREAL_NS,
            db: process.env.SURREAL_DB
        });

        await db.connect(process.env.SURREAL_URL);

        // Strategy 1: Try Root Authentication (Username/Password only)
        // This is typical for self-hosted or root-level access.
        try {
            console.log('Attempting Root Authentication...');
            await db.signin({
                username: process.env.SURREAL_USER,
                password: process.env.SURREAL_PASS,
            });
            console.log('✅ Root Authentication Successful');
        } catch (rootError) {
            console.warn('⚠️ Root Authentication Failed, trying Namespace/Database Authentication...', rootError.message);

            // Strategy 2: Try Namespace/Database Authentication (Required for scoped users)
            // This is typical for Surreal Cloud or restricted database users.
            try {
                await db.signin({
                    username: process.env.SURREAL_USER,
                    password: process.env.SURREAL_PASS,
                    namespace: process.env.SURREAL_NS,
                    database: process.env.SURREAL_DB,
                });
                console.log('✅ Namespace/Database Authentication Successful');
            } catch (scopedError) {
                console.error('❌ All Authentication Attempts Failed');
                throw scopedError; // Throw the final error to be caught by the outer catch
            }
        }

        // Select Namespace and Database
        await db.use({
            namespace: process.env.SURREAL_NS,
            database: process.env.SURREAL_DB,
        });

        console.log('Connected to SurrealDB Cloud');

        // Define Schemas (Idempotent)

        // Auth Users Table: Email/Password based users
        await db.query(`
            DEFINE TABLE auth_users SCHEMALESS;
            DEFINE FIELD email ON TABLE auth_users TYPE string ASSERT $value != NONE;
            DEFINE FIELD password_hash ON TABLE auth_users TYPE string ASSERT $value != NONE;
            DEFINE FIELD created_at ON TABLE auth_users TYPE datetime VALUE $before OR time::now();
            DEFINE FIELD updated_at ON TABLE auth_users TYPE datetime VALUE time::now();
            DEFINE INDEX idx_auth_users_email ON TABLE auth_users COLUMNS email UNIQUE;
        `);

        // YNAB Connections Table: Links auth_users to YNAB account
        await db.query(`
            DEFINE TABLE ynab_connections SCHEMALESS;
            DEFINE FIELD user ON TABLE ynab_connections TYPE record<auth_users> ASSERT $value != NONE;
            DEFINE FIELD ynab_id ON TABLE ynab_connections TYPE string ASSERT $value != NONE;
            DEFINE FIELD access_token ON TABLE ynab_connections TYPE string ASSERT $value != NONE;
            DEFINE FIELD refresh_token ON TABLE ynab_connections TYPE string;
            DEFINE FIELD expires_at ON TABLE ynab_connections TYPE datetime;
            DEFINE INDEX idx_ynab_connections_user ON TABLE ynab_connections COLUMNS user UNIQUE;
            DEFINE INDEX idx_ynab_connections_ynab_id ON TABLE ynab_connections COLUMNS ynab_id UNIQUE;
        `);

        // Sessions Table: Stores App Session ID (cookie) linked to a user
        await db.query(`
            DEFINE TABLE sessions SCHEMALESS;
            DEFINE FIELD user ON TABLE sessions TYPE record<auth_users> ASSERT $value != NONE;
            DEFINE FIELD token ON TABLE sessions TYPE string ASSERT $value != NONE; -- The session ID
            DEFINE FIELD expires_at ON TABLE sessions TYPE datetime;
            DEFINE INDEX idx_sessions_token ON TABLE sessions COLUMNS token UNIQUE;
        `);

        // Chat History (Existing)
        await db.query(`
            DEFINE TABLE chats SCHEMALESS;
            DEFINE FIELD created_at ON TABLE chats TYPE datetime VALUE $before OR time::now();
        `);

        await db.query(`
            DEFINE TABLE messages SCHEMALESS;
            DEFINE FIELD chat_id ON TABLE messages TYPE record<chats>;
            DEFINE FIELD role ON TABLE messages TYPE string;
            DEFINE FIELD content ON TABLE messages TYPE string;
            DEFINE FIELD timestamp ON TABLE messages TYPE datetime VALUE $before OR time::now();
        `);

        console.log('SurrealDB Schemas Initialized');

    } catch (err) {
        console.error('Failed to connect to SurrealDB:', err);
    }
};

export { db, connectDB };
