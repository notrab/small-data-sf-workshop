# Multi-Tenant and Per-User Database Workshop with Turso

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

3. Connect and get schema

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

   -- quit
   .quit
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

9. Update the parent schema with a new table

   > [!IMPORTANT]
   > Run `turso db show slack-schema --http-url` to get the HTTP URL for the schema database.

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

    -- quit
    .quit
    ```

### What did we learn?

- Each Slack workspace is its own isolated database (tenant)
- All workspaces share the same schema (users, channels, messages)
- Data in one workspace is completely separate from other workspaces
- Schema updates (like adding the `direct_messages` table) apply to all workspaces automatically!

## Part 2: Per-User Database Schema (30 minutes)

Personal Note-Taking Application

### Task

1. Create schema database

   ```bash
   turso db create notes-schema --type schema
   ```

2. Initialize schema

   ```sql
   -- Connect to the schema database
   turso db shell notes-schema

   -- Create the initial schema
   CREATE TABLE notes (
     id INTEGER PRIMARY KEY,
     title TEXT,
     content TEXT,
     created_at TEXT DEFAULT CURRENT_TIMESTAMP
   );

   CREATE TABLE tags (
     id INTEGER PRIMARY KEY,
     name TEXT UNIQUE
   );

   CREATE TABLE note_tags (
     note_id INTEGER,
     tag_id INTEGER,
     PRIMARY KEY (note_id, tag_id),
     FOREIGN KEY (note_id) REFERENCES notes(id),
     FOREIGN KEY (tag_id) REFERENCES tags(id)
   );

   -- quit
    .quit
   ```

3. Connect and get schema

   ```bash
   turso db shell notes-schema ".schema"
   ```

4. Create a child db (represents a single user's database)

   ```bash
   turso db create user1-notes --schema notes-schema
   ```

5. Insert data

   ```sql
   -- Connect to user1-notes
   turso db shell user1-notes

   -- Insert sample data
   INSERT INTO notes (title, content) VALUES ('Shopping List', 'Milk, Eggs, Bread');
   INSERT INTO tags (name) VALUES ('Personal');
   INSERT INTO note_tags (note_id, tag_id) VALUES (1, 1);

   -- quit
    .quit
   ```

6. Fetch data

   ```sql
   SELECT * FROM notes;
   SELECT * FROM tags;
   SELECT * FROM note_tags;

   -- quit
    .quit
   ```

7. Create a second db (represents another user's database)

   ```bash
   turso db create user2-notes --schema notes-schema
   ```

8. Fetch data (notice there's nothing, because it's per user)

   ```sql
   -- Connect to user2-notes
   turso db shell user2-notes

   SELECT * FROM notes;
   SELECT * FROM tags;
   SELECT * FROM note_tags;

   -- quit
    .quit
   ```

9. Update the parent schema with a new table

   ```sql
   -- Connect to notes-schema
   turso db shell notes-schema

   -- Add a new table
   CREATE TABLE reminders (
     id INTEGER PRIMARY KEY,
     note_id INTEGER,
     reminder_time TEXT,
     FOREIGN KEY (note_id) REFERENCES notes(id)
   );

   -- quit
    .quit
   ```

10. Connect to a child db again to see the schema changes

    ```bash
    turso db shell user1-notes ".schema"
    ```

11. Insert new data

    ```sql
    -- Connect to user1-notes
    turso db shell user1-notes

    INSERT INTO reminders (note_id, reminder_time)
    VALUES (1, '2023-09-15 10:00:00');
    ```

## Part 3: Deploy your own per-user application (30 minutes)

Deploy your own Turso powered platform in a few easy steps...

- [![Create a Database](https://sqlite.new/button)](https://sqlite.new?dump=https%3A%2F%2Fraw.githubusercontent.com%2Fnotrab%2Fturso-per-user-starter%2Fmain%2Fdump.sql&type=schema)

  - Once the database is created, you'll be presented with details about your database, and **Connect** details
  - Note down the following (you'll need these later):
    - Database name
    - Org name
    - Group Token (**Create Group Token** -> **Create Token**)
    - Platform API Token (**Create Platform API Token** -> **Insert memorable name** -> **Create Token**))

- [Sign up to Clerk](https://clerk.com)
  - Create a new application from the dashboard
  - Note down the following (you'll need these later):
    - Public key
    - Secret key
- [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnotrab%2Fturso-per-user-starter&env=NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,CLERK_SECRET_KEY,TURSO_API_TOKEN,TURSO_ORG,TURSO_DATABASE_NAME,TURSO_GROUP_AUTH_TOKEN&demo-title=Turso%20Per%20User%20Starter&demo-description=Create%20a%20database%20per%20user&demo-image=https://raw.githubusercontent.com/notrab/turso-per-user-starter/28373b4c9c74f814e3749525ee3d53b603176834/app/opengraph-image.png&demo-url=https%3A%2F%2Fturso-per-user-starter.vercel.app)
  - Add the following environment variables (from the details you noted down earlier):
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
    - `CLERK_SECRET_KEY` - Clerk secret key
    - `TURSO_API_TOKEN` - Platform API Token
    - `TURSO_ORG` - Org name
    - `TURSO_DATABASE_NAME` - Database name
    - `TURSO_GROUP_AUTH_TOKEN` - Group Token
  - Click **Deploy** and you're done!

## Part 4: AI & Embeddings

Todo

## Part 5: Q&A

- Ask us anything!
- Discount codes
