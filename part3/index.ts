import { createClient } from "@libsql/client";
import { pipeline } from "@xenova/transformers";

const client = createClient({
  url: "file:vector.db",
});

async function setupDatabase() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      year INTEGER NOT NULL,
      plot_summary TEXT,
      genres TEXT,
      embedding F32_BLOB(1024)  -- Adjust the dimension to match your model's output
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS movies_embedding_idx ON movies(libsql_vector_idx(embedding));
  `);
}

async function insertMovie(
  title: string,
  year: number,
  plotSummary: string,
  genres: string[],
  embedding: number[],
): Promise<number> {
  const query = `
    INSERT INTO movies (title, year, plot_summary, genres, embedding)
    VALUES (?, ?, ?, ?, vector32(?))
    RETURNING id
  `;

  const result = await client.execute({
    sql: query,
    args: [
      title,
      year,
      plotSummary,
      genres.join(","),
      JSON.stringify(embedding),
    ],
  });

  return result.rows[0].id as number;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const model = await pipeline(
    "feature-extraction",
    "mixedbread-ai/mxbai-embed-large-v1",
  );
  const output = await model([text], { pooling: "cls", normalize: true });
  return output.tolist()[0];
}

async function getMovieRecommendations(
  query: string,
  topK: number = 5,
): Promise<any[]> {
  const queryEmbedding = await generateEmbedding(query);
  const k = Math.max(1, Math.floor(topK));

  const sql = `
    SELECT movies.id, movies.title, movies.year, movies.genres,
           vector_distance_cos(movies.embedding, vector32(?)) as distance
    FROM vector_top_k('movies_embedding_idx', vector32(?), ?) AS v
    JOIN movies ON movies.id = v.id
    ORDER BY distance
    LIMIT ?
    `;

  // Doesn't work:
  // Using vector_top_k as per the documentation
  // const sql = `
  //   SELECT movies.id, movies.title, movies.year, movies.genres,
  //          v.distance
  //   FROM vector_top_k('movies_embedding_idx', vector32(?), ?) AS v
  //   JOIN movies ON movies.id = v.id
  //   ORDER BY v.distance
  // `;

  try {
    // const result = await client.execute({
    //   sql,
    //   args: [JSON.stringify(queryEmbedding), topK],
    // });

    const result = await client.execute({
      sql,
      args: [
        JSON.stringify(queryEmbedding),
        JSON.stringify(queryEmbedding),
        k,
        k,
      ],
    });

    return result.rows;
  } catch (error) {
    console.error("Error getting movie recommendations:", error);
    throw error;
  }
}

async function main() {
  await setupDatabase(); // Ensure the database is set up correctly

  const command = process.argv[2];

  switch (command) {
    case "add":
      const title = process.argv[3];
      const year = parseInt(process.argv[4]);
      const plotSummary = process.argv[5];
      const genres = process.argv[6].split(",");

      const embedding = await generateEmbedding(plotSummary);

      const movieId = await insertMovie(
        title,
        year,
        plotSummary,
        genres,
        embedding,
      );
      console.log(`Movie inserted with ID: ${movieId}`);
      break;

    case "recommend":
      const query = process.argv[3];
      const topK = Math.max(1, parseInt(process.argv[4] || "5", 10));

      const recommendations = await getMovieRecommendations(query, topK);
      console.log("Movie recommendations:");
      console.log(recommendations);
      break;

    default:
      console.log("Usage:");
      console.log(
        "  Add a movie: bun run index.ts add <title> <year> <plot_summary> <genres>",
      );
      console.log(
        "  Get recommendations: bun run index.ts recommend <query> [topK]",
      );
  }
}

main().catch(console.error);

// npx tsx index.ts add "The Matrix" 1999 "A computer programmer discovers a hidden world of sentient machines." "sci-fi,action"
//
// npx tsx index.ts recommend "AI takes over the world" 3
