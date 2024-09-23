# Part 3

Per-user database schema and application.

## Task

1. Create schema database

   ```bash
   turso db create todos-schema --type schema
   ```

   Store the name `todos-schema` as `TURSO_DATABASE_NAME` for later use.

2. Initialize schema

   ```sql
   -- Connect to the schema database
   turso db shell todos-schema

   -- Create the initial schema
   CREATE TABLE todos (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       `description` text NOT NULL,
       `completed` integer DEFAULT false NOT NULL
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

> [!NOTE]
> Congratulations! You just deployed a todo app with per user database schema.

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

11. Download your users data

    When logged into the todo app, click on your user avatar and select "Download my data".
