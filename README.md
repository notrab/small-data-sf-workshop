# Small Data SF Workshop (Turso)

Welcome!

## Welcome and what is Turso (15 minutes)

Todo

## Part 1: Per-Tenant Database Schema - Slack-like Application (45 minutes)

Slack-like

### Task

1. Create schema database

   ```bash
   turso db create slack-schema --type schema
   ```

2. Initialize schema

   ```sql
   -- Connect to the schema database
   turso db shell slack-schema

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

3. Confirm schema in a new temporary shell

   ```bash
   turso db shell slack-schema ".schema"
   ```

4. Create a child db (represents a Slack workspace)

   ```bash
   turso db create workspace1-slack --schema slack-schema
   ```

5. Insert data

   ```sql
   -- Connect to workspace1-slack
   turso db shell workspace1-slack

   -- Insert sample data
   INSERT INTO users (username, email, display_name)
   VALUES ('alice', 'alice@company1.com', 'Alice Johnson');

   INSERT INTO channels (name, description)
   VALUES ('general', 'General discussion');

   INSERT INTO messages (channel_id, user_id, content)
   VALUES (1, 1, 'Hello, welcome to our new Slack workspace!');
   ```

6. Fetch data

   ```sql
   SELECT * FROM users;
   SELECT * FROM channels;
   SELECT * FROM messages;

   -- quit
    .quit
   ```

7. Create a second db (represents another Slack workspace)

   ```bash
   turso db create workspace2-slack --schema slack-schema
   ```

8. Fetch data (notice there's nothing, because it's per workspace)

   ```sql
   -- Connect to workspace2-slack
   turso db shell workspace2-slack

   SELECT * FROM users;
   SELECT * FROM channels;
   SELECT * FROM messages;

   -- quit
    .quit
   ```

> [!IMPORTANT]
> Run `turso db show slack-schema --http-url` to get the HTTP URL for the schema database for use in the next step.

9. Update the parent schema with a new table

   ```sql
   -- Connect to slack-schema
   turso db shell <http-url>

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

10. Connect to a child db again to see the schema changes

    ```bash
    turso db shell workspace1-slack ".schema"
    ```

11. Insert new data

    ```sql
    -- Connect to workspace1-slack
    turso db shell workspace1-slack

    -- Add another user
    INSERT INTO users (username, email, display_name)
    VALUES ('bob', 'bob@company1.com', 'Bob Smith');

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

### What did we learn?

- Each Slack workspace is its own isolated database (tenant)
- All workspaces share the same schema (users, channels, messages)
- Data in one workspace is completely separate from other workspaces
- Schema updates (like adding the `direct_messages` table) apply to all workspaces automatically!

### How does it work?

1. A database can be created and tagged as a "schema" database.
2. Other databases can be created that reference this schema database.
3. When a migration is applied to the schema database:
   - It's first run as a dry-run on the schema and all other associated databases.
   - If successful, a migration job is created.
   - Tasks are created for each database that references this schema.
   - The migration is then applied to each referencing database.
   - Finally, if all tasks succeed, the migration is applied to the schema database itself.
4. The process is managed by a scheduler that handles the progression of jobs and tasks through various states (e.g. `WaitingDryRun`, `DryRunSuccess`, `WaitingRun`).
5. During a migration, all databases are locked to write operations.
6. Databases refencing a schema are prevented from making direct changes to their schema.

## Part 2: Per-User Database Schema (30 minutes)

Personal Note-Taking Application

### Task

1. Create schema database

   ```bash
   turso db create todos-schema --type schema
   ```

2. Initialize schema

   ```sql
   -- Connect to the schema database
   turso db shell todos-schema

   -- Create the initial schema
   CREATE TABLE todos (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       description TEXT
   );

   -- Verify the schema
   .schema

   -- quit
    .quit
   ```

3. Create a platform token

   ```bash
   turso auth api-tokens mint <insert-memorable-token-name>
   ```

   Store this somewhere as `TURSO_API_TOKEN` for later use.

4. Create a group token

   The `<group-name>` is usually `default` if Turso created one for your automatically in Part 1.

   ```bash
   turso group tokens create <group-name>
   ```

   Store this somewhere as `TURSO_GROUP_AUTH_TOKEN` for later use.

5. Sign up to Clerk and create a new application

   Visit [Clerk](https://clerk.dev) and sign up.

   Create a new application and store the public and secret keys as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

6. Retrieve your account slug

   ```bash
   turso auth whoami
   ```

   Store this somewhere as `TURSO_ORG` for later use.

7. Deploy to Vercel

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnotrab%2Fturso-per-user-starter&env=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,TURSO_API_TOKEN,TURSO_ORG,TURSO_DATABASE_NAME,TURSO_GROUP_AUTH_TOKEN&demo-title=Turso%20Per%20User%20Starter&demo-description=Create%20a%20database%20per%20user&demo-image=https://raw.githubusercontent.com/notrab/turso-per-user-starter/28373b4c9c74f814e3749525ee3d53b603176834/app/opengraph-image.png&demo-url=https%3A%2F%2Fturso-per-user-starter.vercel.app)

8. Sign into your new app and create some todos

   Visit the newly deployed app on Vercel and create some todos.

   💡 **Bonus: Share the URL with others so that they can sign up and create some todos.**

9. Retrieve a list of child databases for the parent schema

   ```bash
   turso db list --schema todos-schema
   ```

10. Connect to a child database and fetch the todos

    Copy a database name from the list of child databases.

    ```bash
    turso db shell <database-name>
    ```

    ```sql
    select * from todos;
    ```

## Part 4

Todo

## Part 5: Q&A

- Ask us anything!
- Discount codes
