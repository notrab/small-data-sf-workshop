import { createClient } from "@libsql/client";

const client = createClient({
  url: "file:vector.db",
});

await client.execute(`
  CREATE INDEX IF NOT EXISTS movies_embedding_idx ON movies(libsql_vector_idx(embedding));
  `);
