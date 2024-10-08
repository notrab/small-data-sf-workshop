# Per Tenant Task

Slack-like per tenant database schema and application.

1. Create schema database

   ```bash
   turso db create slack-schema --type schema
   ```

   Store the name `slack-schema` as `TURSO_DATABASE_NAME` for later use.

2. Connect to the schema database

   ```bash
   turso db shell slack-schema
   ```

3. Initialize schema

   ```sql
   -- Create the initial schema
   CREATE TABLE users (
     id INTEGER PRIMARY KEY,
     username TEXT UNIQUE,
     email TEXT UNIQUE,
     display_name TEXT,
     created_at TEXT DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE channels (
     id INTEGER PRIMARY KEY,
     name TEXT UNIQUE,
     description TEXT,
     is_private INTEGER DEFAULT 0,
     created_at TEXT DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE messages (
     id INTEGER PRIMARY KEY,
     channel_id INTEGER,
     user_id INTEGER,
     content TEXT,
     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (channel_id) REFERENCES channels(id),
     FOREIGN KEY (user_id) REFERENCES users(id)
   );

   -- quit
   .quit
   ```

4. Confirm schema in a new temporary shell

   ```bash
   turso db shell slack-schema ".schema"
   ```

5. Create a child db (represents a Slack workspace)

   ```bash
   turso db create workspace1-slack --schema slack-schema
   ```

6. Connect to the child database and see the schema from `slack-schema` database!

   ```bash
   turso db shell workspace1-slack
   ```

   ```sql
   .schema
   ```

> [!NOTE]
> Woah! You just created a database with schema of another database!

6. Insert sample data

   ```sql
   INSERT INTO users (username, email, display_name)
   VALUES ('alice', 'alice@company1.com', 'Alice Johnson');

   INSERT INTO channels (name, description)
   VALUES ('general', 'General discussion');

   INSERT INTO messages (channel_id, user_id, content)
   VALUES (1, 1, 'Hello, welcome to our new Slack workspace!');
   ```

7. Fetch data

   ```sql
   SELECT * FROM users;
   SELECT * FROM channels;
   SELECT * FROM messages;

   -- quit
    .quit
   ```

8. Create a second db (represents another Slack workspace)

   ```bash
   turso db create workspace2-slack --schema slack-schema
   ```

9. Connect to the second child database and see the schema from `slack-schema` database!

   ```bash
   turso db shell workspace2-slack
   ```

   ```sql
   .schema
   ```

10. Fetch data (notice there's nothing, because it's per workspace)

    ```sql
    SELECT * FROM users;
    SELECT * FROM channels;
    SELECT * FROM messages;

    -- quit
     .quit
    ```

> [!IMPORTANT]
> Run `turso db show slack-schema --http-url` to get the HTTP URL for the schema database for use in the next step.

9. Connect to the parent schema database

   ```bash
   turso db shell <http-url>
   ```

10. Update the parent schema with a new table

    ```sql
    -- Add a new table for direct messages
    CREATE TABLE direct_messages (
      id INTEGER PRIMARY KEY,
      sender_id INTEGER,
      recipient_id INTEGER,
      content TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    );

    -- quit
    .quit
    ```

11. Connect to a child db again to see the schema changes

    ```bash
    turso db shell workspace1-slack ".schema"
    ```

> [!NOTE]
> Congratulations! You just propogated a schema change to all child databases.

11. Insert new data

    ```sql
    -- Connect to workspace1-slack
    turso db shell workspace1-slack

    -- Add another user
    INSERT INTO users (username, email, display_name)
    VALUES ('bob', 'bob@company1.com', 'Bob Smith');

    INSERT INTO users (username, email, display_name)
    VALUES ('alice', 'alice@company1.com', 'Alice Johnson');

    -- Insert a direct message
    INSERT INTO direct_messages (sender_id, recipient_id, content)
    VALUES (1, 2, 'Hi Bob, welcome to the team!');

    -- Select all direct messages
    SELECT * FROM direct_messages;

    -- quit
    .quit
    ```

12. Connect to another child to confirm `direct_messages` table exists, but not messages

    ```bash
    turso db shell workspace2-slack ".schema"
    turso db shell workspace2-slack "SELECT * FROM direct_messages"
    ```

13. Create a platform token

    ```bash
    turso auth api-tokens mint <insert-memorable-token-name>
    ```

    Store this somewhere as `TURSO_API_TOKEN` for later use.

14. Create a group token

    The `<group-name>` is usually `default` unless you specified otherwise when creating a database earlier.

    ```bash
    turso group tokens create <group-name>
    ```

    Store this somewhere as `TURSO_GROUP_AUTH_TOKEN` for later use.

15. Retrieve your account slug

    ```bash
    turso auth whoami
    ```

    Store this somewhere as `TURSO_ORG` for later use.

16. Deploy to Vercel

    [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnotrab%2Fturso-per-tenant-starter&env=TURSO_API_TOKEN,TURSO_ORG,TURSO_DATABASE_NAME,TURSO_GROUP_AUTH_TOKEN)

> [!NOTE]
> Congratulations! You just deployed a Slack-like app with per tenant database schema.

17. Sign into your new app and create some messages in one of the workspaces created above.

    You can login into multiple workspaces by entering any username into the login form.
