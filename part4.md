# Part 4

Use Turso's vector datatype to store and retrieve embeddings.

## Task

1. Create a database using the CLI just like we learned in part 2 & 3.
2. Connect to the database just like we learned in part 2 & 3.

3. Set up the database schema:

```sql
CREATE TABLE IF NOT EXISTS songs (
  title TEXT,
  artist TEXT,
  lyrics TEXT,
  mood_embedding F32_BLOB(5)  -- 5-dimensional f32 vector
);

CREATE INDEX IF NOT EXISTS songs_mood_idx ON songs(libsql_vector_idx(mood_embedding));
```

4. Insert sample songs with mood embeddings:

```sql
INSERT INTO songs (title, artist, lyrics, mood_embedding)
VALUES ('Happy', 'Pharrell Williams', 'Clap along if you feel like happiness is the truth', vector32('[0.5,0,0.5,0,0]'));

INSERT INTO songs (title, artist, lyrics, mood_embedding)
VALUES ('Sad Song', 'We The Kings', 'You and I, we''re like fireworks and symphonies exploding in the sky', vector32('[0,1,0,0,0]'));

INSERT INTO songs (title, artist, lyrics, mood_embedding)
VALUES ('Calm Down', 'Taylor Swift', 'You need to calm down, you''re being too loud', vector32('[0,0,0,1,0]'));

INSERT INTO songs (title, artist, lyrics, mood_embedding)
VALUES ('Killing in the Name', 'Rage Against the Machine', 'Some of those that work forces, are the same that burn crosses', vector32('[0,0,0,0,1]'));
```

5. Query for song recommendations based on mood:

For a happy mood:

```sql
SELECT title, artist
FROM vector_top_k('songs_mood_idx', vector32('[0.7,0.1,0.1,0.05,0.05]'), 3)
JOIN songs ON songs.rowid = id;
```

For a calm mood:

```sql
SELECT title, artist
FROM vector_top_k('songs_mood_idx', vector32('[0.1,0.1,0.1,0.6,0.1]'), 3)
JOIN songs ON songs.rowid = id;
```

For an angry mood:

```sql
SELECT title, artist
FROM vector_top_k('songs_mood_idx', vector32('[0.05,0.05,0.1,0.1,0.7]'), 3)
JOIN songs ON songs.rowid = id;
```
